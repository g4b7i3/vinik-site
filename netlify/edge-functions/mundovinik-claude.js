// Revisor do Mundo Vinik: repassa o pedido para a API do Claude e devolve a resposta aos poucos (streaming).
// A chave fica só na Netlify, na variável ANTHROPIC_API_KEY. Opcional: CLAUDE_MODELO para trocar o modelo.
// Só atende quem entrou com a senha (mesmo cookie do porteiro, conferido contra a senha guardada no Blobs).
import { getStore } from "@netlify/blobs";
const COOKIE = "mundo_chave";
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (t) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)));
const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

export default async (req) => {
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);
  const m = (req.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([a-f0-9]{64})"));
  const acesso = await getStore({ name: "mundovinik", consistency: "strong" }).get("acesso", { type: "json" });
  if (!m || !acesso || (await sha256(m[1])) !== acesso.resumo) return json({ erro: "acesso restrito" }, 401);
  const chave = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!chave) return json({ erro: "sem-chave" }, 503);
  let b;
  try { b = await req.json(); } catch (_) { return json({ erro: "pedido inválido" }, 400); }
  if (!Array.isArray(b.messages) || !b.messages.length) return json({ erro: "sem mensagens" }, 400);
  const corpo = {
    model: Netlify.env.get("CLAUDE_MODELO") || "claude-sonnet-5-5",
    max_tokens: Math.max(256, Math.min(+b.max_tokens || 4000, 16000)),
    system: String(b.system || "").slice(0, 40000),
    messages: b.messages,
    stream: true
  };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify(corpo)
  });
  if (!r.ok) return json({ erro: "api", status: r.status, detalhe: (await r.text()).slice(0, 600) }, 502);
  return new Response(r.body, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store" } });
};

export const config = { path: "/mundovinik/api/claude" };
