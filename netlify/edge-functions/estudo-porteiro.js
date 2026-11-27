// Porteiro do Estúdio (vinikautor.com.br/estudo): só entra quem tem a senha.
// A senha não está aqui: só um resumo dela (PBKDF2 + SHA-256), que não dá para reverter.
// Para trocar a senha, veja estudo/COMO-TROCAR-A-SENHA.md.
const SAL = "386915369a04befedba21a85003faa38";
const ITERACOES = 120000;
const RESUMO = "6a0c1b45e2b2421b2acf13c5fe03d2c24cf3b521dfc8ace9717936d7e9682ea5";
const COOKIE = "estudo_chave";
const DEZ_ANOS = 315360000; // segundos
const BASE = "/estudo";
// arquivos que precisam abrir sem senha: tela de entrar, ícone e manifesto (para instalar) e o service worker
const LIVRES = [BASE + "/entrar.html", BASE + "/manifest.webmanifest", BASE + "/icons/", BASE + "/sw.js"];

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (txt) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt)));
async function derivar(senha) {
  const chave = await crypto.subtle.importKey("raw", new TextEncoder().encode(senha), "PBKDF2", false, ["deriveBits"]);
  const sal = new Uint8Array(SAL.match(/../g).map((h) => parseInt(h, 16)));
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: ITERACOES }, chave, 256));
}
function lerCookie(req, nome) {
  const c = req.headers.get("cookie") || "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + nome + "=([a-f0-9]{64})"));
  return m ? m[1] : null;
}
function voltaSegura(v) {
  v = String(v || "");
  return v.startsWith(BASE + "/") && !v.startsWith("//") && !v.includes("\\") ? v : BASE + "/";
}
const biscoito = (v) => `${COOKIE}=${v}; Path=${BASE}; Max-Age=${DEZ_ANOS}; HttpOnly; Secure; SameSite=Lax`;
const ir = (para, extra = {}) => new Response(null, { status: 303, headers: { Location: para, "Cache-Control": "no-store", ...extra } });

export default async (req, context) => {
  const url = new URL(req.url);
  const p = url.pathname;

  if (p === BASE + "/entrar" && req.method === "POST") {
    let senha = "", volta = BASE + "/";
    try { const f = await req.formData(); senha = String(f.get("senha") || ""); volta = voltaSegura(f.get("volta")); } catch (_) {}
    const d = senha ? await derivar(senha) : "";
    if (d && (await sha256(d)) === RESUMO) {
      return ir(volta, { "Set-Cookie": biscoito(d) });
    }
    await new Promise((r) => setTimeout(r, 700)); // atrasa quem tenta adivinhar
    return ir(`${BASE}/entrar.html?erro=1&volta=${encodeURIComponent(volta)}`);
  }
  if (p === BASE + "/sair") {
    return ir(BASE + "/entrar.html", { "Set-Cookie": `${COOKIE}=; Path=${BASE}; Max-Age=0; HttpOnly; Secure; SameSite=Lax` });
  }
  if (LIVRES.some((l) => p === l || (l.endsWith("/") && p.startsWith(l)))) {
    const r = await context.next();
    r.headers.set("X-Robots-Tag", "noindex, nofollow");
    return r;
  }

  const c = lerCookie(req, COOKIE);
  if (c && (await sha256(c)) === RESUMO) {
    const r = await context.next();
    r.headers.set("X-Robots-Tag", "noindex, nofollow");
    r.headers.set("Cache-Control", "private, no-cache");
    // renova a cada página aberta: o Chrome limita qualquer cookie a 400 dias,
    // então quem abre o Estúdio de vez em quando nunca precisa digitar a senha de novo
    if ((r.headers.get("content-type") || "").includes("text/html")) r.headers.append("Set-Cookie", biscoito(c));
    return r;
  }
  const navegando = req.method === "GET" && (req.headers.get("accept") || "").includes("text/html");
  if (navegando) return ir(`${BASE}/entrar.html?volta=${encodeURIComponent(voltaSegura(p + url.search))}`);
  return new Response("Acesso restrito", { status: 401, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
};

export const config = { path: ["/estudo", "/estudo/*"] };
