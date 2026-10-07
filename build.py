# Gera o site a partir dos arquivos em content/ (editados pelo painel /admin).
# A Netlify roda este arquivo a cada publicação: python3 build.py
import json, os, re, shutil, glob, html as H

ROOT = os.path.dirname(os.path.abspath(__file__))


def _ver(rel):
    # muda sempre que o arquivo muda: o navegador baixa a versão nova na hora
    import hashlib
    with open(os.path.join(ROOT, rel), "rb") as f:
        return hashlib.md5(f.read()).hexdigest()[:10]


VER_CSS = _ver("assets/css/site.css")
VER_JS = _ver("assets/js/site.js")
OUT = os.path.join(ROOT, "public")
SITE = "https://vinikautor.com.br"


def load(name):
    with open(os.path.join(ROOT, "content", name), encoding="utf-8") as f:
        return json.load(f)


G = load("geral.json")
INI = load("inicio.json")
LANC = load("lancamentos.json").get("itens", [])
ASS = load("assinatura.json")
SOB = load("sobre.json")
CON = load("contato.json")
NOTP = load("noticias_pagina.json")
BOOKS = []
for p in sorted(glob.glob(os.path.join(ROOT, "content", "livros", "*.json"))):
    with open(p, encoding="utf-8") as f:
        b = json.load(f)
    if b.get("visivel", True) and b.get("endereco"):
        BOOKS.append(b)
BOOKS.sort(key=lambda b: (b.get("ordem") or 99, b.get("titulo", "")))
BY_SLUG = {b["endereco"]: b for b in BOOKS}


# ---------------------------------------------------------------- utilidades
def esc(s):
    return H.escape(str(s or ""), quote=True)


def inline(s):
    """Markdown simples numa linha: **negrito**, *itálico*, [texto](link)."""
    s = esc(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"\*(.+?)\*", r"<i>\1</i>", s)
    s = re.sub(r"\[(.+?)\]\((.+?)\)", r'<a href="\2">\1</a>', s)
    return s.replace("\n", "<br>")


def md(s):
    parts = [p.strip() for p in re.split(r"\n\s*\n", str(s or "").strip()) if p.strip()]
    return "".join(f"<p>{inline(p)}</p>" for p in parts)


def page_of(b):
    return f'{b["endereco"]}.html'


def theme_cls(b):
    return "sem" if b.get("tema") == "vermelho" else "m60"


def theme_attr(b):
    return ' data-theme-book="semente"' if b.get("tema") == "vermelho" else ""


def nota_txt(v):
    try:
        return f"{float(v):.1f}".replace(".", ",")
    except Exception:
        return str(v or "")


FONTS = "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IM+Fell+English+SC&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;1,7..72,400&family=IBM+Plex+Mono:wght@400;500&display=swap"
ICON_AMZ = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6 5 3H2"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg>'
ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>'

PERSON = {"@context": "https://schema.org", "@type": "Person", "@id": SITE + "/#vinik", "name": "Vinik",
          "alternateName": ["Gabriel Vinícius", "Vinik. S"], "url": SITE + "/", "image": SITE + "/" + INI.get("hero_imagem", ""),
          "jobTitle": "Escritor", "description": G.get("autor_resumo", ""), "homeLocation": {"@type": "Place", "name": "Maranhão, Brasil"},
          "sameAs": [x for x in (G.get("instagram"), G.get("tiktok"), G.get("substack")) if x]}
WEBSITE = {"@context": "https://schema.org", "@type": "WebSite", "name": "Vinik · Escritor", "url": SITE + "/", "inLanguage": "pt-BR", "publisher": {"@id": SITE + "/#vinik"}}


def book_ld(b):
    d = {"@context": "https://schema.org", "@type": "Book", "name": b["titulo"] + (f' – {b["subtitulo"]}' if b.get("subtitulo") else ""),
         "url": SITE + "/" + page_of(b), "image": SITE + "/" + b.get("capa_frente", ""),
         "author": {"@type": "Person", "@id": SITE + "/#vinik", "name": "Vinik"}, "inLanguage": "pt-BR",
         "genre": b.get("genero", ""), "description": b.get("sinopse_curta", ""),
         "bookFormat": ["https://schema.org/Paperback", "https://schema.org/EBook"]}
    if b.get("isbn"):
        d["isbn"] = b["isbn"]
    if b.get("data_publicacao"):
        d["datePublished"] = str(b["data_publicacao"])
    return d


def head(title, desc, book=None, og=None, path="", ld=None, noindex=False):
    og = og or G.get("imagem_compartilhamento", "")
    tb = theme_attr(book) if book else ""
    url = SITE + "/" + path
    ldj = "".join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>\n' for x in (ld or []))
    rob = '<meta name="robots" content="noindex">' if noindex else '<meta name="robots" content="index,follow,max-image-preview:large">'
    cores = f':root{{--yellow:{G.get("cor_amarela", "#f3e13a")};--blood:{G.get("cor_vermelha", "#d8322a")}}}'
    return f"""<!doctype html>
<html lang="pt-BR"{tb}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="author" content="Vinik (Gabriel Vinícius)">
{rob}
{"" if noindex else f'<link rel="canonical" href="{url}">'}
<meta name="theme-color" content="#0b0c0a">
<meta property="og:site_name" content="Vinik · Escritor">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{SITE}/{og}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/img/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="assets/css/site.css?v={VER_CSS}">
<style>{cores}</style>
{ldj}</head>
<body>
"""


def nav():
    items = '<li><a href="index.html">Início</a></li>' + "".join(
        f'<li><a href="{page_of(b)}">{esc(b.get("menu") or b["titulo"])}</a></li>' for b in BOOKS)
    items += '<li><a href="noticias.html">Notícias</a></li><li><a href="sobre.html">Sobre</a></li><li><a href="contato.html">Contato</a></li>'
    return f"""<header class="top">
  <div class="wrap">
    <a class="brand" href="index.html" aria-label="Vinik — início"></a>
    <button class="burger" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
    <ul class="menu" id="menu">{items}</ul>
  </div>
</header>
"""


def foot():
    livros = "".join(f'<li><a href="{page_of(b)}">{esc(b["titulo"])}{" – " + esc(b["subtitulo"]) if b.get("subtitulo") else ""}</a></li>' for b in BOOKS)
    if any(x.get("visivel") for x in LANC):
        livros += f'<li><a href="index.html#{esc(next(x for x in LANC if x.get("visivel")).get("ancora", "em-breve"))}">Em breve</a></li>'
    redes = ""
    if G.get("instagram"):
        redes += f'<li><a href="{esc(G["instagram"])}" target="_blank" rel="noopener">Instagram · {esc(G.get("instagram_nome", ""))}</a></li>'
    if G.get("tiktok"):
        redes += f'<li><a href="{esc(G["tiktok"])}" target="_blank" rel="noopener">TikTok · {esc(G.get("tiktok_nome", ""))}</a></li>'
    if G.get("substack"):
        redes += f'<li><a href="{esc(G["substack"])}" target="_blank" rel="noopener">Substack · {esc(G.get("substack_nome", ""))}</a></li>'
    redes += f'<li><a href="contato.html">{esc(G.get("email", ""))}</a></li>'
    return f"""<footer class="foot">
  <div class="wrap">
    <div><a class="brand" href="index.html" aria-label="Vinik — início"></a></div>
    <div><h4>Livros</h4><ul>{livros}</ul></div>
    <div><h4>Acompanhe</h4><ul>{redes}</ul></div>
    <div class="legal"><span>{esc(G.get("rodape_direitos", ""))}</span><span>{esc(G.get("rodape_local", ""))}</span></div>
  </div>
</footer>
<script src="assets/js/site.js?v={VER_JS}"></script>
</body>
</html>
"""


def book3d(b):
    label = f'{b["titulo"]}, capa em 3D'
    return f"""<div data-book-wrap>
  <div class="book-stage" tabindex="0" aria-label="{esc(label)}. Arraste para girar o livro.">
    <div class="book" data-ry="{esc(b.get("angulo", -26))}">
      <div class="f front" style="background-image:url({esc(b.get("capa_frente", ""))})"></div>
      <div class="f backc" style="background-image:url({esc(b.get("capa_verso") or b.get("capa_frente", ""))})"></div>
      <div class="f spine" style="background-image:url({esc(b.get("lombada", ""))})"></div>
      <div class="f pages"></div><div class="f topc"></div><div class="f botc"></div>
    </div>
    <div class="book-shadow" aria-hidden="true"></div>
  </div>
  <p class="drag-hint">Arraste para girar · <button class="more" data-flip style="color:var(--accent)">Ver quarta capa ↻</button></p>
</div>"""


def buy(b):
    out = ""
    if b.get("amazon"):
        out += f'<a class="btn solid" href="{esc(b["amazon"])}" target="_blank" rel="noopener">{ICON_AMZ} Comprar na Amazon</a>'
    if b.get("uiclap"):
        out += f'<a class="btn" href="{esc(b["uiclap"])}" target="_blank" rel="noopener">Livro impresso na UICLAP</a>'
    return f'<div class="btns">{out}</div>' if out else ""


def score_items(books):
    return "".join(f'<li><b>{nota_txt(b.get("nota"))}</b><span class="s">★★★★★</span><span>{esc(b.get("total_avaliacoes", ""))} avaliações · {esc(b["titulo"])}</span></li>'
                   for b in books if b.get("nota"))


def reviews(mode, title, eyebrow="Avaliações na Amazon"):
    books = BOOKS if mode == "todos" else [BY_SLUG[mode]]
    meta = [{"k": b.get("nome_avaliacoes") or b["titulo"], "t": b["titulo"], "c": "semente" if b.get("tema") == "vermelho" else "m"} for b in books]
    tabs = ""
    if mode == "todos" and len(books) > 1:
        tabs = '<div class="tabs" role="tablist" aria-label="Filtrar por livro"><button class="tab" role="tab" data-f="todos" aria-selected="true">Todos</button>' + \
               "".join(f'<button class="tab" role="tab" data-f="{esc(m["k"])}" aria-selected="false">{esc(m["t"])}</button>' for m in meta) + "</div>"
    return f"""<section class="sec" id="avaliacoes">
  <div class="wrap reviews" data-reviews="{esc("todos" if mode == "todos" else meta[0]["k"])}" data-books='{esc(json.dumps(meta, ensure_ascii=False))}'>
    <div class="sec-head"><p class="eyebrow">{esc(eyebrow)}</p><h2 class="h2">{inline(title)}</h2></div>
    <div class="rv-bar">{tabs}<ul class="facts" style="border:0;padding:0;margin:0">{score_items(books)}</ul></div>
    <div class="stage">
      <button class="nav prev" aria-label="Avaliação anterior">&#8592;</button>
      <div class="scene"><div class="card" style="display:grid;place-items:center"><p class="hint">Carregando avaliações…</p></div></div>
      <button class="nav next" aria-label="Próxima avaliação">&#8594;</button>
    </div>
    <div class="meter"><span class="count">00 / 00</span><div class="bar"><i></i></div></div>
    <p class="hint">Toque no cartão para ler a avaliação completa · deslize para o lado para trocar</p>
  </div>
</section>
"""


def video(src, poster, label):
    return f"""<div class="video">
  <video preload="none" playsinline poster="{esc(poster)}" aria-label="{esc(label)}">
    <source src="{esc(src)}" type="video/mp4">
  </video>
  <button class="play" aria-label="Assistir ao book trailer"><span>{ICON_PLAY}</span></button>
</div>"""


def lancamento(x):
    bg = f' style="background-image:url({esc(x["imagem_fundo"])})"' if x.get("imagem_fundo") else ""
    btn = f'<div class="btns"><a class="btn solid" href="{esc(x.get("botao_link") or "#assine")}">{esc(x.get("botao_texto") or "Quero ser avisado")}</a></div>' if x.get("botao_texto") else ""
    if x.get("estilo") == "dossie":
        faixa = ""
        if x.get("faixa"):
            t = esc(x["faixa"]) + " · "
            faixa = f'<div class="seq-tick" aria-hidden="true"><div><span>{t * 3}</span><span>{t * 3}</span></div></div>'
        words = " ".join(f"<span>{esc(w)}</span>" for w in str(x.get("titulo", "")).split())
        syn = esc(x.get("sinopse", ""))
        stamp = f'<span class="seq-stamp" aria-hidden="true">{esc(x["carimbo"])}</span>' if x.get("carimbo") else ""
        status = f'<span class="tag-soon">{esc(x["status"])}</span>' if x.get("status") else ""
        ficha = f'<div class="dossie-h"><span>{esc(x.get("ficha", ""))}</span><span class="rec">{esc(x.get("ficha_status", ""))}</span></div>' if (x.get("ficha") or x.get("ficha_status")) else ""
        return f"""<section class="seq" id="{esc(x.get("ancora", ""))}">
  <div class="seq-img" aria-hidden="true"{bg}></div>
  {faixa}
  <div class="wrap seq-in">
    <div class="seq-l">
      <p class="eyebrow">{esc(x.get("rotulo", ""))}</p>
      <h2 class="h1 seq-t">{words}</h2>
      <div class="seq-meta">{status}{stamp}</div>
    </div>
    <div class="dossie">
      {ficha}
      <p class="lead seq-syn"><span class="sr">{syn}</span><span class="type" aria-hidden="true" data-text="{syn}">{syn}</span></p>
      {btn}
    </div>
  </div>
</section>
"""
    linhas = "".join(f"<p>{inline(f)}</p>" for f in x.get("frases") or [])
    linhas += f'<p class="big">{inline(x.get("titulo", ""))}</p>'
    if x.get("status"):
        linhas += f'<p class="dim">{esc(x["status"])}</p>'
    return f"""<section class="soon" id="{esc(x.get("ancora", ""))}">
  <div class="soon-img" aria-hidden="true"{bg}></div>
  <div class="wrap">
    <p class="eyebrow">{esc(x.get("rotulo", ""))}</p>
    <div class="lines">{linhas}</div>
    {btn}
  </div>
</section>
"""


def signup():
    sub = G.get("substack", "")
    return f"""<section class="sec" id="assine">
  <div class="wrap">
    <div class="signup">
      <div>
        {f'<span class="tag-soon">{esc(ASS["selo"])}</span>' if ASS.get("selo") else ""}
        <h2 class="h2" style="margin-top:16px">{inline(ASS.get("titulo", ""))}</h2>
        <p class="lead muted" style="margin-top:14px">{inline(ASS.get("texto", ""))}</p>
      </div>
      <div data-substack="{esc(sub)}">
        <div class="form">
          <p class="muted" style="margin:0;font-size:15px">{inline(ASS.get("nota", ""))}</p>
          <div class="btns"><a class="btn solid" href="{esc(sub)}" target="_blank" rel="noopener">{esc(ASS.get("botao", "Assinar"))}</a></div>
        </div>
      </div>
    </div>
  </div>
</section>
"""


# ---------------------------------------------------------------- seções da página inicial
def s_letreiro():
    items = [x for x in G.get("letreiro") or [] if str(x).strip()]
    if not items:
        return ""
    one = "".join(f'<span>{esc(t)}</span><img class="vmark" src="assets/img/v-mark.png" alt="">' for t in items)
    while len(items) < 6 and items:
        one += one
        items = items * 2
    return f"""<div class="marquee" role="region" aria-label="Destaques">
  <ul class="sr">{"".join(f"<li>{esc(t)}</li>" for t in G.get("letreiro") or [])}</ul>
  <div class="mq-track" aria-hidden="true"><div>{one}</div><div>{one}</div></div>
</div>
"""


def s_livros():
    cards = ""
    for b in BOOKS:
        cards += f"""<article class="title-card {theme_cls(b)}"{theme_attr(b)}>
        {book3d(b)}
        <div style="display:grid;gap:14px">
          <span class="genre">{esc(b.get("rotulo_card", ""))}</span>
          <h3 class="h3">{esc(b["titulo"])}</h3>
          <p class="meta"><span>{esc(b.get("linha_card", ""))}</span>{f'<span class="s">★ {nota_txt(b["nota"])}</span><span>{esc(b.get("total_avaliacoes", ""))} avaliações</span>' if b.get("nota") else ""}</p>
          <p class="muted" style="margin:0">{inline(b.get("sinopse_curta", ""))}</p>
          <div class="btns"><a class="btn solid" href="{page_of(b)}">Sobre o livro</a>{f'<a class="btn" href="{esc(b["amazon"])}" target="_blank" rel="noopener">Comprar</a>' if b.get("amazon") else ""}</div>
        </div>
      </article>
"""
    return f"""<section class="sec" id="livros">
  <div class="wrap">
    <div class="sec-head"><p class="eyebrow">{esc(INI.get("livros_rotulo", ""))}</p><h2 class="h2">{inline(INI.get("livros_titulo", ""))}</h2></div>
    <div class="shelf">{cards}</div>
  </div>
</section>
"""


def s_trailer():
    if not INI.get("trailer_video"):
        return ""
    b = BY_SLUG.get(INI.get("trailer_livro", ""))
    return f"""<section class="sec" id="trailer">
  <div class="wrap trailer">
    {video(INI["trailer_video"], INI.get("trailer_capa", ""), "Book trailer")}
    <div style="display:grid;gap:16px">
      <h2 class="h2">{inline(INI.get("trailer_titulo", ""))}</h2>
      {buy(b) if b else ""}
    </div>
  </div>
</section>
"""


def s_premios():
    return f"""<section class="sec" id="premios">
  <div class="wrap">
    <div class="sec-head"><p class="eyebrow">{esc(INI.get("premios_rotulo", ""))}</p><h2 class="h2">{inline(INI.get("premios_titulo", ""))}</h2></div>
    <div data-premios></div>
  </div>
</section>
"""


def s_autor():
    return f"""<section class="sec" id="autor">
  <div class="wrap author">
    <figure class="portrait" style="margin:0"><img src="{esc(INI.get("autor_foto", ""))}" alt="{esc(INI.get("autor_foto_descricao", ""))}" loading="lazy"></figure>
    <div>
      <p class="eyebrow">{esc(INI.get("autor_rotulo", ""))}</p>
      <h2 class="h2" style="margin-top:12px">{inline(INI.get("autor_titulo", ""))}</h2>
      <div class="prose" style="margin-top:22px">{md(INI.get("autor_texto", ""))}</div>
      {f'<p class="endorse">{inline(INI["autor_destaque"])}</p>' if INI.get("autor_destaque") else ""}
      <a class="btn" href="sobre.html">{esc(INI.get("autor_botao", "Sobre o autor"))}</a>
    </div>
  </div>
</section>
"""


def s_noticias():
    return f"""<section class="sec" id="noticias">
  <div class="wrap">
    <div class="sec-head row"><div style="display:grid;gap:14px"><p class="eyebrow">{esc(INI.get("noticias_rotulo", ""))}</p><h2 class="h2">{inline(INI.get("noticias_titulo", ""))}</h2></div><a class="btn" href="noticias.html">Todas as notícias</a></div>
    <div class="news" data-news="{esc(INI.get("noticias_quantidade", 3))}"></div>
  </div>
</section>
"""


SECOES = {
    "letreiro": s_letreiro,
    "avaliacoes": lambda: reviews("todos", INI.get("avaliacoes_titulo", ""), INI.get("avaliacoes_rotulo", "")),
    "livros": s_livros, "trailer": s_trailer, "premios": s_premios, "autor": s_autor,
    "lancamentos": lambda: "".join(lancamento(x) for x in LANC if x.get("visivel")),
    "assinatura": signup, "noticias": s_noticias,
}

pages = {}

# ---------------------------------------------------------------- início
STARS = '<span class="s">★★★★★</span>'
numeros = "".join(
    f'<li><b>{esc(n.get("valor", ""))}</b>{STARS if n.get("estrelas") else ""}<span>{esc(n.get("rotulo", ""))}</span></li>'
    for n in INI.get("numeros") or [])
btns = ""
if INI.get("hero_botao1_texto"):
    btns += f'<a class="btn solid" href="{esc(INI.get("hero_botao1_link", "#"))}">{esc(INI["hero_botao1_texto"])}</a>'
if INI.get("hero_botao2_texto"):
    btns += f'<a class="btn" href="{esc(INI.get("hero_botao2_link", "#"))}">{esc(INI["hero_botao2_texto"])}</a>'
HERO_CLS = "cheia" if INI.get("hero_enquadramento") == "cheia" else "lateral"
if INI.get("hero_preto_branco"):
    HERO_CLS += " pb"
HERO_FOCO = {"topo": "0%", "centro": "50%", "baixo": "100%"}.get(INI.get("hero_foco") or "", "15%")
corpo = "".join(SECOES[s["secao"]]() for s in INI.get("secoes") or [] if s.get("visivel", True) and s.get("secao") in SECOES)
pages["index.html"] = head(G.get("seo_titulo", "Vinik"), G.get("seo_descricao", ""), path="", ld=[PERSON, WEBSITE]) + nav() + f"""<main>
<section class="hero">
  <div class="hero-img {HERO_CLS}" role="img" aria-label="{esc(INI.get("hero_imagem_descricao", ""))}" style="background-image:url({esc(INI.get("hero_imagem", ""))});--foco:{HERO_FOCO}"></div>
  <div class="wrap">
    <h1 class="sr">Vinik, escritor</h1>
    <div class="hero-logo rise" aria-hidden="true"></div>
    <div class="btns rise d2">{btns}</div>
    {f'<ul class="facts rise d3">{numeros}</ul>' if numeros else ""}
  </div>
</section>
{corpo}
</main>
""" + foot()

# ---------------------------------------------------------------- páginas dos livros
for b in BOOKS:
    cls = theme_cls(b)
    color = "color:var(--yellow)" if b.get("tema") != "vermelho" else "color:#fff"
    titlecls = "h1" + (" font-fell" if b.get("tema") == "vermelho" else "")
    quotes = "".join(f'<blockquote class="quote"><p>“{inline(q.get("texto", ""))}”</p><cite>{inline(q.get("autor", ""))}</cite></blockquote>' for q in b.get("citacoes") or [])
    trailer = ""
    if b.get("trailer_mostrar") and b.get("trailer_video"):
        trailer = f"""<section class="sec" id="trailer">
  <div class="wrap trailer">
    {video(b["trailer_video"], b.get("trailer_capa", ""), "Book trailer de " + b["titulo"])}
    <div style="display:grid;gap:16px"><p class="eyebrow">{esc(b.get("trailer_rotulo", ""))}</p><h2 class="h2">{inline(b.get("trailer_titulo", ""))}</h2><p class="muted" style="margin:0">{inline(b.get("trailer_texto", ""))}</p></div>
  </div>
</section>
"""
    extra = ""
    if b.get("extra_mostrar"):
        if b.get("extra_tipo") == "galeria":
            fotos = "".join(f'<img src="{esc(f.get("foto", ""))}" alt="{esc(f.get("descricao", ""))}" loading="lazy">' for f in b.get("extra_fotos") or [])
            extra = f"""<section class="sec">
  <div class="wrap" style="display:grid;gap:22px">
    <div class="sec-head" style="margin:0"><p class="eyebrow">{esc(b.get("extra_rotulo", ""))}</p><h2 class="h2{" font-fell" if b.get("tema") == "vermelho" else ""}">{inline(b.get("extra_titulo", ""))}</h2></div>
    {md(b.get("extra_texto", ""))}
    <div class="strip">{fotos}</div>
  </div>
</section>
"""
        else:
            xt = "".join(f'<p class="muted" style="margin:0">{inline(p)}</p>' for p in re.split(r"\n\s*\n", str(b.get("extra_texto", "")).strip()) if p.strip())
            bt = f'<a class="btn" href="{esc(b.get("extra_botao_link") or "sobre.html")}">{esc(b["extra_botao_texto"])}</a>' if b.get("extra_botao_texto") else ""
            img = f'<img src="{esc(b["extra_foto"])}" alt="{esc(b.get("extra_foto_descricao", ""))}" loading="lazy" style="border-radius:var(--r);width:100%">' if b.get("extra_foto") else ""
            extra = f"""<section class="sec">
  <div class="wrap trailer" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">
    {img}
    <div style="display:grid;gap:16px"><p class="eyebrow">{esc(b.get("extra_rotulo", ""))}</p><h2 class="h2">{inline(b.get("extra_titulo", ""))}</h2>{xt}{bt}</div>
  </div>
</section>
"""
    rel = "".join(lancamento(x) for x in LANC if x.get("visivel") and x.get("livro_relacionado") == b["endereco"])
    outros = ""
    for o in [x for x in BOOKS if x is not b]:
        oc = "color:var(--yellow)" if o.get("tema") != "vermelho" else "color:#fff"
        of = " font-fell" if o.get("tema") == "vermelho" else ""
        outros += f"""<section class="sec">
  <div class="wrap" style="display:grid;gap:22px;justify-items:start">
    <p class="eyebrow">Leia também</p>
    <h2 class="h2{of}" style="{oc}">{esc(o["titulo"])}</h2>
    <p class="lead muted">{inline(o.get("sinopse_curta", ""))}</p>
    <a class="btn" href="{page_of(o)}">{esc(o.get("leia_tambem_botao") or "Conheça o livro")}</a>
  </div>
</section>
"""
    ficha = "".join(f"<span>{esc(f)}</span>" for f in b.get("ficha") or [])
    score = f'<ul class="facts" style="border:0;padding:0;margin:0"><li><b>{nota_txt(b["nota"])}</b><span class="s">★★★★★</span><span>{esc(b.get("total_avaliacoes", ""))} avaliações na Amazon</span></li></ul>' if b.get("nota") else ""
    pages[page_of(b)] = head(b.get("seo_titulo") or b["titulo"], b.get("seo_descricao") or b.get("sinopse_curta", ""), book=b, og=b.get("capa_frente"), path=page_of(b), ld=[book_ld(b)]) + nav() + f"""<main>
<section class="book-hero {cls}">
  <div class="wrap">
    {book3d(b)}
    <div style="display:grid;gap:20px">
      <p class="eyebrow">{esc(b.get("rotulo_pagina", ""))}</p>
      <h1 class="{titlecls}" style="{color}">{esc(b["titulo"])}</h1>
      {f'<p class="h3" style="margin-top:-8px">{esc(b["subtitulo"])}</p>' if b.get("subtitulo") else ""}
      {score}
      <div class="prose">{md(b.get("sinopse", ""))}</div>
      {f'<div class="spec">{ficha}</div>' if ficha else ""}
      {buy(b)}
    </div>
  </div>
</section>
{f'<section class="sec"><div class="wrap quotes">{quotes}</div></section>' if quotes else ""}
{trailer}
{reviews(b["endereco"], b.get("avaliacoes_titulo") or "O que dizem os leitores")}
{extra}
{rel}
{outros}
</main>
""" + foot()

# ---------------------------------------------------------------- sobre
traj = "".join(f'<li><b>{esc(str(t.get("quando", "")).upper())}</b>{inline(t.get("texto", ""))}</li>' for t in SOB.get("trajetoria") or [])
gal = "".join(f'<figure><img src="{esc(g.get("foto", ""))}" alt="{esc(g.get("descricao", ""))}" loading="lazy"></figure>' for g in SOB.get("galeria") or [])
press = "".join(f'<a href="{esc(p.get("alta") or p.get("foto", ""))}" target="_blank"><img src="{esc(p.get("foto", ""))}" alt="" loading="lazy">{esc(p.get("nome", ""))}</a>' for p in SOB.get("imprensa_fotos") or [])
pages["sobre.html"] = head(SOB.get("seo_titulo", "Sobre"), SOB.get("seo_descricao", ""), og=SOB.get("foto"), path="sobre.html", ld=[{"@context": "https://schema.org", "@type": "ProfilePage", "mainEntity": PERSON}]) + nav() + f"""<main>
<section class="sec">
  <div class="wrap about-hero">
    <div style="display:grid;gap:22px">
      <p class="eyebrow">{esc(SOB.get("rotulo", ""))}</p>
      <h1 class="h1">{inline(SOB.get("titulo", ""))}</h1>
      <div class="prose">{md(SOB.get("texto", ""))}</div>
    </div>
    <figure class="portrait" style="margin:0;aspect-ratio:2/3"><img src="{esc(SOB.get("foto", ""))}" alt="{esc(SOB.get("foto_descricao", ""))}"></figure>
  </div>
</section>
{f'''<section class="sec">
  <div class="wrap author" style="align-items:start">
    <div>
      <p class="eyebrow">{esc(SOB.get("trajetoria_rotulo", ""))}</p>
      <h2 class="h2" style="margin:12px 0 30px">{inline(SOB.get("trajetoria_titulo", ""))}</h2>
      <ol class="timeline">{traj}</ol>
    </div>
    <figure class="portrait" style="margin:0"><img src="{esc(SOB.get("trajetoria_foto", ""))}" alt="{esc(SOB.get("trajetoria_foto_descricao", ""))}" loading="lazy"></figure>
  </div>
</section>''' if traj else ""}
{f'''<section class="sec">
  <div class="wrap">
    <div class="sec-head"><p class="eyebrow">{esc(SOB.get("galeria_rotulo", ""))}</p><h2 class="h2">{inline(SOB.get("galeria_titulo", ""))}</h2></div>
    <div class="gallery">{gal}</div>
  </div>
</section>''' if gal else ""}
<section class="sec" id="imprensa">
  <div class="wrap" style="display:grid;gap:28px">
    <div class="sec-head" style="margin:0"><p class="eyebrow">{esc(SOB.get("imprensa_rotulo", ""))}</p><h2 class="h2">{inline(SOB.get("imprensa_titulo", ""))}</h2></div>
    <div class="quote" style="max-width:780px"><p style="font-size:16.5px">{inline(SOB.get("bio_curta", ""))}</p><cite>Bio curta para divulgação</cite></div>
    {f'<p class="muted" style="margin:0">Fotos em alta resolução. Abra a imagem e salve.</p><div class="press">{press}</div>' if press else ""}
    <div class="btns"><a class="btn solid" href="contato.html">{esc(SOB.get("imprensa_botao", "Fale comigo"))}</a></div>
  </div>
</section>
</main>
""" + foot()

# ---------------------------------------------------------------- notícias
pages["noticias.html"] = head("Notícias de Vinik", "Notícias, lançamentos e textos de Vinik, incluindo as publicações do Substack.", path="noticias.html") + nav() + f"""<main>
<section class="sec">
  <div class="wrap">
    <div class="sec-head"><p class="eyebrow">{esc(NOTP.get("rotulo", ""))}</p><h1 class="h1">{inline(NOTP.get("titulo", ""))}</h1><p class="lead muted">{inline(NOTP.get("texto", ""))}</p></div>
    <div class="news" data-news data-full></div>
  </div>
</section>
{signup()}
</main>
""" + foot()

# ---------------------------------------------------------------- contato
socials = ""
for k, n in (("instagram", "Instagram"), ("tiktok", "TikTok"), ("substack", "Substack")):
    if G.get(k):
        socials += f'<a href="{esc(G[k])}" target="_blank" rel="noopener"><b>{n}</b><span>{esc(G.get(k + "_nome", ""))}</span></a>'
opts = "".join(f"<option>{esc(o)}</option>" for o in CON.get("assuntos") or ["Outro"])
pages["contato.html"] = head("Contato com Vinik", "Fale com Vinik: eventos, entrevistas, clubes do livro e parcerias.", path="contato.html") + nav() + f"""<main>
<section class="sec">
  <div class="wrap contact">
    <div>
      <p class="eyebrow">{esc(CON.get("rotulo", ""))}</p>
      <h1 class="h1" style="margin-top:12px">{inline(CON.get("titulo", ""))}</h1>
      <p class="lead muted" style="margin-top:18px">{inline(CON.get("texto", ""))}</p>
      <div class="copybox" style="margin-top:26px"><code>{esc(G.get("email", ""))}</code><button class="btn" data-copy="{esc(G.get("email", ""))}" style="padding:8px 14px">Copiar</button></div>
      <div class="socials">{socials}</div>
    </div>
    <form class="form signup js-contato" name="contato" method="POST" action="/contato.html?enviado=1" data-netlify="true" netlify-honeypot="empresa" data-ok="{esc(CON.get("mensagem_sucesso", ""))}" style="grid-template-columns:minmax(0,1fr)">
      <input type="hidden" name="form-name" value="contato">
      <p hidden><label>Não preencha: <input name="empresa"></label></p>
      <div class="field"><label for="c-nome">Nome</label><input id="c-nome" name="nome" required autocomplete="name"></div>
      <div class="field"><label for="c-email">E-mail</label><input id="c-email" name="email" type="email" required autocomplete="email"></div>
      <div class="field"><label for="c-assunto">Assunto</label><select id="c-assunto" name="assunto">{opts}</select></div>
      <div class="field"><label for="c-msg">Mensagem</label><textarea id="c-msg" name="mensagem" rows="6" required></textarea></div>
      <div class="btns"><button class="btn solid" type="submit">{esc(CON.get("botao", "Enviar"))}</button></div>
      <p class="form-note" role="status"></p>
    </form>
  </div>
</section>
</main>
""" + foot()

# ---------------------------------------------------------------- 404
pages["404.html"] = head("Página não encontrada · Vinik", "Página não encontrada.", noindex=True) + nav() + """<main>
<section class="wrap lost">
  <div style="display:grid;gap:20px;justify-items:start">
    <p class="eyebrow">Erro 404</p>
    <h1 class="h1">Você saiu da trilha.</h1>
    <p class="lead muted">Esta página não existe ou mudou de endereço.</p>
    <a class="btn solid" href="index.html">Voltar ao início</a>
  </div>
  <img src="assets/img/escalada.jpg" alt="Vinik rindo, como se escalasse a parede">
</section>
</main>
""" + foot()

# ---------------------------------------------------------------- gravação
if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)
for d in ("assets", "media", "admin", "content"):
    if os.path.isdir(os.path.join(ROOT, d)):
        shutil.copytree(os.path.join(ROOT, d), os.path.join(OUT, d))
for name, doc in pages.items():
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(doc)
urls = [""] + [page_of(b) for b in BOOKS] + ["sobre.html", "noticias.html", "contato.html"]
with open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            "".join(f"  <url><loc>{SITE}/{u}</loc></url>\n" for u in urls) + "</urlset>\n")
with open(os.path.join(OUT, "robots.txt"), "w", encoding="utf-8") as f:
    f.write(f"User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: {SITE}/sitemap.xml\n")
print("ok", sorted(pages))
