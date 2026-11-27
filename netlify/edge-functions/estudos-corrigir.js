// Corretor do app Estudos: manda a pergunta, a resposta de referência e a resposta do Vinik para a API do Claude
// e devolve a nota (0 a 3) com um comentário curto. Usa a mesma chave da Netlify do revisor do Mundo Vinik
// (ANTHROPIC_API_KEY). Opcional: ESTUDOS_MODELO para trocar o modelo.
// Só atende quem entrou com a senha do Estudos. Se trocar a senha, troque o RESUMO aqui também.
const RESUMO = "b30c0a3d2636488d6cf94cb4808450c1703f6b91a35a14e9bd5161f18416dab4";
const COOKIE = "estudos_chave";
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (t) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)));
const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

const SISTEMA = `Você corrige respostas curtas do Vinik, um adulto que estuda os livros que lê. Escreva em português do Brasil, falando com ele por "você".
Avalie o conteúdo, não a escrita: ignore erros de digitação, gramática e frases informais.
Compare com a resposta de referência, mas aceite formulações diferentes e também ideias corretas que não estão nela. Não exija detalhes secundários da referência (datas, nomes de obras) se a pergunta não os pediu.
Notas:
0 = errado, vazio ou sem relação com a pergunta;
1 = parcialmente certo: acertou algo, mas errou ou deixou de fora uma parte central do que a pergunta pede (inclusive exemplos pedidos e não dados);
2 = certo no essencial, com falhas pequenas;
3 = completo e preciso.
Responda só com um JSON, sem nada antes ou depois:
{"nota": 0-3, "acertou": "o que ele acertou, em até 2 frases, ou vazio", "faltou": "o que estava errado ou faltou, em até 2 frases, ou vazio", "dica": "uma frase curta para lembrar da ideia central"}
Seja direto e concreto. Nada de elogios genéricos.`;

export default async (req) => {
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);
  const m = (req.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([a-f0-9]{64})"));
  if (!m || (await sha256(m[1])) !== RESUMO) return json({ erro: "acesso restrito" }, 401);
  const chave = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!chave) return json({ erro: "sem-chave" }, 503);
  let b;
  try { b = await req.json(); } catch (_) { return json({ erro: "pedido inválido" }, 400); }
  const pergunta = String(b.pergunta || "").slice(0, 2000);
  const referencia = String(b.referencia || "").slice(0, 4000);
  const resposta = String(b.resposta || "").slice(0, 3000);
  if (!pergunta || !resposta.trim()) return json({ erro: "faltou a resposta" }, 400);
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: Netlify.env.get("ESTUDOS_MODELO") || "claude-sonnet-5-5",
      max_tokens: 600,
      system: SISTEMA,
      messages: [{ role: "user", content: `PERGUNTA:\n${pergunta}\n\nRESPOSTA DE REFERÊNCIA:\n${referencia}\n\nRESPOSTA DO VINIK:\n${resposta}` }]
    })
  });
  if (!r.ok) return json({ erro: "api", status: r.status }, 502);
  const d = await r.json();
  const texto = (d.content || []).map((c) => c.text || "").join("");
  const achado = texto.match(/\{[\s\S]*\}/);
  try {
    const o = JSON.parse(achado ? achado[0] : texto);
    const nota = Math.max(0, Math.min(3, Math.round(+o.nota)));
    if (!Number.isFinite(nota)) throw 0;
    return json({ nota, acertou: String(o.acertou || ""), faltou: String(o.faltou || ""), dica: String(o.dica || "") });
  } catch (_) {
    return json({ erro: "resposta ilegível" }, 502);
  }
};

export const config = { path: "/estudos-vinik/api/corrigir" };
