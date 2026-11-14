// Peças comuns das notificações do Microciclo (Web Push).
// Tudo fica no Netlify Blobs deste site, loja "estudio". Nada passa pelos bancos do Radar ou da Nexos.
// As chaves VAPID são criadas sozinhas no primeiro uso e guardadas na loja (chave "push-vapid").
import { getStore } from "@netlify/blobs";
import * as webpush from "web-push";
import { createHash } from "node:crypto";

// mesmo resumo do porteiro (netlify/edge-functions/estudo-porteiro.js). Se trocar a senha, troque aqui também.
const RESUMO = "6a0c1b45e2b2421b2acf13c5fe03d2c24cf3b521dfc8ace9717936d7e9682ea5";
const COOKIE = "estudo_chave";

export const json = (dados, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

export function autorizado(req) {
  const c = req.headers.get("cookie") || "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([a-f0-9]{64})"));
  return !!m && createHash("sha256").update(m[1]).digest("hex") === RESUMO;
}

export const loja = () => getStore({ name: "estudio", consistency: "strong" });

export async function chaves() {
  const l = loja();
  let k = await l.get("push-vapid", { type: "json" });
  if (!k || !k.publicKey) {
    k = webpush.generateVAPIDKeys();
    await l.setJSON("push-vapid", k);
  }
  return k;
}

export async function assinaturas() {
  return (await loja().get("push-assinaturas", { type: "json" })) || [];
}
export async function guardarAssinaturas(lista) {
  await loja().setJSON("push-assinaturas", lista);
}

// envia para todos os aparelhos; tira da lista os que não existem mais.
// Devolve quantos receberam e o resultado de cada aparelho (para o teste mostrar o motivo de uma falha).
export async function enviarTodos(aviso) {
  const lista = await assinaturas();
  if (!lista.length) return { enviados: 0, aparelhos: 0, falhas: [] };
  const k = await chaves();
  webpush.setVapidDetails("https://vinikautor.com.br", k.publicKey, k.privateKey);
  const corpo = JSON.stringify(aviso);
  const mortos = new Set();
  const falhas = [];
  let enviados = 0;
  await Promise.all(lista.map(async (a) => {
    try { await webpush.sendNotification(a.sub, corpo, { TTL: 3600, urgency: "high" }); enviados++; }
    catch (e) {
      const st = e && e.statusCode;
      if (st === 404 || st === 410) mortos.add(a.sub.endpoint);
      falhas.push({ servico: new URL(a.sub.endpoint).hostname, status: st || 0, erro: String((e && (e.body || e.message)) || e).slice(0, 200) });
      console.log("push falhou", st, e && (e.body || e.message));
    }
  }));
  if (mortos.size) await guardarAssinaturas(lista.filter((a) => !mortos.has(a.sub.endpoint)));
  return { enviados, aparelhos: lista.length, falhas };
}
