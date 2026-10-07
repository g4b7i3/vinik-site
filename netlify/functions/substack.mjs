// Lê o feed do Substack e devolve os posts em JSON para a página de notícias.
// Endereço do feed: variável SUBSTACK_FEED no painel da Netlify (padrão abaixo).
const FEED = process.env.SUBSTACK_FEED || "https://vinikautor.substack.com/feed";

const pick = (xml, tag) => {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) return "";
  return m[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
};
const strip = html => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();

export default async () => {
  try {
    const res = await fetch(FEED, { headers: { "User-Agent": "vinikautor.com.br" } });
    if (!res.ok) throw new Error("feed " + res.status);
    const xml = await res.text();
    const items = xml.split(/<item>/i).slice(1).map(chunk => {
      const item = chunk.split(/<\/item>/i)[0];
      const desc = strip(pick(item, "description"));
      const img = (item.match(/<enclosure[^>]*url="([^"]+)"/i) || [])[1] || "";
      const date = new Date(pick(item, "pubDate"));
      return {
        titulo: strip(pick(item, "title")),
        link: pick(item, "link"),
        data: isNaN(date) ? "" : date.toISOString().slice(0, 10),
        resumo: desc.length > 220 ? desc.slice(0, 217).replace(/\s\S*$/, "") + "…" : desc,
        imagem: img
      };
    }).slice(0, 12);
    return new Response(JSON.stringify({ posts: items }), {
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=10800" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ posts: [], erro: String(e.message || e) }), { status: 502, headers: { "content-type": "application/json" } });
  }
};
