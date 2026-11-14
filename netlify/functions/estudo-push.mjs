// Liga e desliga as notificações do Microciclo em cada aparelho.
// GET: chave pública · POST {sub}: guarda o aparelho · POST {teste:true}: manda um aviso de teste · DELETE {endpoint}: tira o aparelho
import { json, autorizado, chaves, assinaturas, guardarAssinaturas, enviarTodos } from "../lib/estudio-push.mjs";

export default async (req) => {
  if (!autorizado(req)) return json({ erro: "acesso restrito" }, 401);
  if (req.method === "GET") return json({ chave: (await chaves()).publicKey });

  let corpo = {};
  try { corpo = JSON.parse((await req.text()) || "{}"); } catch (_) { return json({ erro: "JSON inválido" }, 400); }

  if (req.method === "POST" && corpo.teste) {
    const enviados = await enviarTodos({ titulo: "Microciclo", corpo: "Notificações funcionando neste aparelho.", tag: "teste", url: "/estudo/microciclo/" });
    return json({ enviados });
  }
  if (req.method === "POST") {
    const s = corpo.sub;
    if (!s || typeof s.endpoint !== "string" || !s.endpoint.startsWith("https://") || !s.keys || !s.keys.p256dh || !s.keys.auth)
      return json({ erro: "assinatura inválida" }, 400);
    const lista = (await assinaturas()).filter((a) => a.sub.endpoint !== s.endpoint);
    lista.push({ sub: { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } }, aparelho: String(corpo.aparelho || "").slice(0, 120), em: Date.now() });
    await guardarAssinaturas(lista.slice(-10));
    return json({ ok: true });
  }
  if (req.method === "DELETE") {
    await guardarAssinaturas((await assinaturas()).filter((a) => a.sub.endpoint !== corpo.endpoint));
    return json({ ok: true });
  }
  return json({ erro: "método não permitido" }, 405);
};

export const config = { path: "/estudo/api/push" };
