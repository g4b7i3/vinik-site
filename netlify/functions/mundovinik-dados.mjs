// Guarda os livros do Mundo Vinik no Netlify Blobs deste site (loja "mundovinik"), para sincronizar PC e celular.
// Nada aqui passa pelos bancos do Radar ou da Nexos.
// Cada registro fica em "i/<tipo>/<id>"; o "indice" lista a data de cada um (negativa = apagado).
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

const COOKIE = "mundo_chave";
const TIPOS = ["books", "chapters", "fichas", "cards", "links", "scenes", "log", "ideias", "ajustes"];
const LIMITE = 5_500_000;
const CHAVE = /^([a-z]+)\/([\w:.-]{1,80})$/;

const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
async function autorizado(req, loja) {
  const m = (req.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([a-f0-9]{64})"));
  const acesso = m && (await loja.get("acesso", { type: "json" }));
  return !!acesso && createHash("sha256").update(m[1]).digest("hex") === acesso.resumo;
}
const valida = (k) => { const m = CHAVE.exec(String(k)); return m && TIPOS.includes(m[1]) ? m : null; };

export default async (req) => {
  const loja = getStore({ name: "mundovinik", consistency: "strong" });
  if (!(await autorizado(req, loja))) return json({ erro: "acesso restrito" }, 401);
  const op = new URL(req.url).searchParams.get("op");

  if (op === "indice" && req.method === "GET") {
    return json({ indice: (await loja.get("indice", { type: "json" })) || {} });
  }
  if (op === "baixar" && req.method === "POST") {
    let chaves = [];
    try { chaves = (await req.json()).chaves || []; } catch (_) { return json({ erro: "JSON inválido" }, 400); }
    const itens = {};
    await Promise.all(chaves.slice(0, 60).filter(valida).map(async (k) => { itens[k] = await loja.get("i/" + k, { type: "json" }); }));
    return json({ itens });
  }
  if (op === "enviar" && req.method === "POST") {
    const texto = await req.text();
    if (texto.length > LIMITE) return json({ erro: "grande demais" }, 413);
    let corpo;
    try { corpo = JSON.parse(texto); } catch (_) { return json({ erro: "JSON inválido" }, 400); }
    const indice = (await loja.get("indice", { type: "json" })) || {};
    for (const it of corpo.itens || []) {
      const k = it && it.obj && it.tipo + "/" + it.obj.id;
      if (!k || !valida(k)) continue;
      const em = +it.obj.updatedAt || Date.now();
      if (indice[k] && Math.abs(indice[k]) > em) continue; // já tem coisa mais nova
      await loja.setJSON("i/" + k, it.obj);
      indice[k] = em;
    }
    for (const a of corpo.apagar || []) {
      const k = a && a.chave;
      if (!valida(k)) continue;
      const em = +a.em || Date.now();
      if (indice[k] && Math.abs(indice[k]) > em) continue;
      await loja.delete("i/" + k);
      indice[k] = -em;
    }
    await loja.setJSON("indice", indice);
    return json({ ok: true, em: Date.now() });
  }
  // banco de palavras (tirado do dicionário analógico do Vinik; fica só aqui, atrás da senha)
  if (op === "banco" && req.method === "GET") {
    const dado = await loja.get("banco", { type: "arrayBuffer" });
    if (!dado) return json({ erro: "sem banco" }, 404);
    return new Response(dado, { headers: { "Content-Type": "application/gzip", "Cache-Control": "no-store" } });
  }
  if (op === "banco" && req.method === "PUT") {
    const dado = await req.arrayBuffer();
    if (dado.byteLength > LIMITE) return json({ erro: "grande demais" }, 413);
    const b = new Uint8Array(dado);
    if (b[0] !== 0x1f || b[1] !== 0x8b) return json({ erro: "precisa ser o arquivo .json.gz" }, 400);
    await loja.set("banco", dado);
    return json({ ok: true });
  }
  return json({ erro: "operação inválida" }, 400);
};

export const config = { path: "/mundovinik/api/dados" };
