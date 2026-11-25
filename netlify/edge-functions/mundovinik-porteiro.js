// Porteiro do Mundo Vinik (vinikautor.com.br/mundovinik): só entra quem tem a senha.
// A senha é criada pelo próprio Vinik na tela nova-senha.html e fica guardada como resumo
// (PBKDF2 + SHA-256, sem volta) no Netlify Blobs deste site, loja "mundovinik", chave "acesso".
// Enquanto não existir senha, o app abre direto na tela de criar a senha.
import { getStore } from "@netlify/blobs";

const ITERACOES = 120000;
const COOKIE = "mundo_chave";
const DEZ_ANOS = 315360000;
const BASE = "/mundovinik";
const LIVRES = [BASE + "/entrar.html", BASE + "/nova-senha.html", BASE + "/manifest.json", BASE + "/icon.svg", BASE + "/sw.js", BASE + "/icons/icon-192.png", BASE + "/icons/icon-512.png", BASE + "/icons/maskable-512.png", BASE + "/icons/apple-touch-icon.png", BASE + "/icons/favicon-32.png"];

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (t) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)));
async function derivar(senha, salHex) {
  const chave = await crypto.subtle.importKey("raw", new TextEncoder().encode(senha), "PBKDF2", false, ["deriveBits"]);
  const sal = new Uint8Array(salHex.match(/../g).map((h) => parseInt(h, 16)));
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: ITERACOES }, chave, 256));
}
function lerCookie(req) {
  const m = (req.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([a-f0-9]{64})"));
  return m ? m[1] : null;
}
function voltaSegura(v) {
  v = String(v || "");
  return v.startsWith(BASE + "/") && !v.startsWith("//") && !v.includes("\\") ? v : BASE + "/";
}
const biscoito = (v) => `${COOKIE}=${v}; Path=${BASE}; Max-Age=${DEZ_ANOS}; HttpOnly; Secure; SameSite=Lax`;
const ir = (para, extra = {}) => new Response(null, { status: 303, headers: { Location: para, "Cache-Control": "no-store", ...extra } });
const espera = () => new Promise((r) => setTimeout(r, 700));
const loja = () => getStore({ name: "mundovinik", consistency: "strong" });
async function gravar(senha) {
  const sal = hex(crypto.getRandomValues(new Uint8Array(16)));
  const d = await derivar(senha, sal);
  await loja().setJSON("acesso", { sal, resumo: await sha256(d), em: Date.now() });
  return d;
}
async function form(req) { try { return await req.formData(); } catch (_) { return new FormData(); } }

export default async (req, context) => {
  const url = new URL(req.url);
  const p = url.pathname;
  const acesso = await loja().get("acesso", { type: "json" });

  if (p === BASE + "/api/senha-existe") return Response.json({ existe: !!acesso }, { headers: { "Cache-Control": "no-store" } });

  if (p === BASE + "/criar-senha" && req.method === "POST") {
    const f = await form(req);
    const nova = String(f.get("nova") || ""), conf = String(f.get("confirmar") || "");
    if (acesso) {
      // trocar: precisa da senha atual
      const atual = String(f.get("atual") || "");
      const ok = atual && (await sha256(await derivar(atual, acesso.sal))) === acesso.resumo;
      if (!ok) { await espera(); return ir(BASE + "/nova-senha.html?erro=atual"); }
    }
    if (nova.length < 6) return ir(BASE + "/nova-senha.html?erro=curta");
    if (nova !== conf) return ir(BASE + "/nova-senha.html?erro=diferente");
    const d = await gravar(nova);
    return ir(BASE + "/?senha=ok", { "Set-Cookie": biscoito(d) });
  }

  if (!acesso) {
    // ainda não há senha: tudo leva para a tela de criar
    if (LIVRES.some((l) => p === l)) return context.next();
    const navegando = req.method === "GET" && (req.headers.get("accept") || "").includes("text/html");
    if (navegando) return ir(BASE + "/nova-senha.html");
    return Response.json({ erro: "sem senha criada" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  if (p === BASE + "/entrar" && req.method === "POST") {
    const f = await form(req);
    const senha = String(f.get("senha") || ""), volta = voltaSegura(f.get("volta"));
    const d = senha ? await derivar(senha, acesso.sal) : "";
    if (d && (await sha256(d)) === acesso.resumo) return ir(volta, { "Set-Cookie": biscoito(d) });
    await espera();
    return ir(`${BASE}/entrar.html?erro=1&volta=${encodeURIComponent(volta)}`);
  }
  if (p === BASE + "/sair") {
    return ir(BASE + "/entrar.html", { "Set-Cookie": `${COOKIE}=; Path=${BASE}; Max-Age=0; HttpOnly; Secure; SameSite=Lax` });
  }
  if (LIVRES.some((l) => p === l)) {
    const r = await context.next();
    r.headers.set("X-Robots-Tag", "noindex, nofollow");
    return r;
  }

  const c = lerCookie(req);
  if (c && (await sha256(c)) === acesso.resumo) {
    const r = await context.next();
    r.headers.set("X-Robots-Tag", "noindex, nofollow");
    if ((r.headers.get("content-type") || "").includes("text/html")) {
      r.headers.set("Cache-Control", "private, no-cache");
      r.headers.append("Set-Cookie", biscoito(c));
    }
    return r;
  }
  const navegando = req.method === "GET" && (req.headers.get("accept") || "").includes("text/html");
  if (navegando) return ir(`${BASE}/entrar.html?volta=${encodeURIComponent(voltaSegura(p + url.search))}`);
  return Response.json({ erro: "acesso restrito" }, { status: 401, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
};

export const config = { path: ["/mundovinik", "/mundovinik/*"] };
