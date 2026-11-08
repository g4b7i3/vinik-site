// Guarda o estado dos apps do Estúdio (por enquanto, o Microciclo) no Netlify Blobs deste site.
// Nada aqui passa pelos bancos do Radar ou da Nexos.
// O porteiro (netlify/edge-functions/estudo-porteiro.js) já exige a senha em /estudo/*;
// esta função confere de novo o mesmo cookie, por segurança. Se trocar a senha, troque o RESUMO aqui também.
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

const RESUMO = "6a0c1b45e2b2421b2acf13c5fe03d2c24cf3b521dfc8ace9717936d7e9682ea5";
const COOKIE = "estudo_chave";
const LIMITE = 2_000_000; // bytes

const json = (dados, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

function autorizado(req) {
  const c = req.headers.get("cookie") || "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([a-f0-9]{64})"));
  return !!m && createHash("sha256").update(m[1]).digest("hex") === RESUMO;
}

export default async (req) => {
  if (!autorizado(req)) return json({ erro: "acesso restrito" }, 401);
  const app = new URL(req.url).searchParams.get("app") || "";
  if (!/^[a-z0-9-]{1,30}$/.test(app)) return json({ erro: "app inválido" }, 400);
  const loja = getStore({ name: "estudio", consistency: "strong" });

  if (req.method === "GET") {
    const dado = await loja.get(app, { type: "json" });
    return json(dado || { estado: null, em: 0 });
  }
  if (req.method === "PUT" || req.method === "POST") {
    const texto = await req.text();
    if (texto.length > LIMITE) return json({ erro: "grande demais" }, 413);
    let corpo;
    try { corpo = JSON.parse(texto); } catch (_) { return json({ erro: "JSON inválido" }, 400); }
    if (!corpo || typeof corpo.estado !== "object" || corpo.estado === null) return json({ erro: "sem estado" }, 400);
    const em = Date.now();
    await loja.setJSON(app, { estado: corpo.estado, em });
    return json({ em });
  }
  return json({ erro: "método não permitido" }, 405);
};

export const config = { path: "/estudo/api/estado" };
