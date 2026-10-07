/* VINIK — scripts do site */
document.documentElement.classList.add("js");
const LIVE = /(^|\.)vinikautor\.com\.br$|netlify\.app$/.test(location.hostname);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const fmtData = d => { if (!d) return ""; const [y, m, dd] = String(d).slice(0, 10).split("-"); return dd ? `${+dd} ${MESES[+m - 1]} ${y}` : y; };
const getJSON = url => fetch(url, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });

/* ---------- menu ---------- */
(() => {
  const b = $(".burger"); if (!b) return;
  b.addEventListener("click", () => { const o = document.body.classList.toggle("nav-open"); b.setAttribute("aria-expanded", o); });
  $$(".menu a").forEach(a => a.addEventListener("click", () => document.body.classList.remove("nav-open")));
  const here = location.pathname.split("/").pop() || "index.html";
  $$(".menu a").forEach(a => { const h = a.getAttribute("href"); if (h === here || (here === "" && h === "index.html") || (h.replace(".html", "") === here)) a.setAttribute("aria-current", "page"); });
})();

/* ---------- livro 3D (arrastar para girar) ---------- */
$$(".book").forEach(book => {
  let ry = parseFloat(book.dataset.ry ?? -28), rx = 4, drag = false, x0 = 0, y0 = 0, r0 = 0, x0r = 0, idle;
  const set = () => { book.style.setProperty("--ry", ry + "deg"); book.style.setProperty("--rx", rx + "deg"); };
  set();
  const stage = book.closest(".book-stage") || book;
  stage.addEventListener("pointerdown", e => { drag = true; x0 = e.clientX; y0 = e.clientY; r0 = ry; x0r = rx; book.classList.add("dragging"); stage.setPointerCapture(e.pointerId); clearTimeout(idle); });
  stage.addEventListener("pointermove", e => { if (!drag) return; ry = r0 + (e.clientX - x0) * 0.6; rx = Math.max(-18, Math.min(18, x0r - (e.clientY - y0) * 0.2)); set(); });
  const end = () => { if (!drag) return; drag = false; book.classList.remove("dragging"); };
  stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end);
  stage.addEventListener("keydown", e => { if (e.key === "ArrowLeft") { ry -= 20; set(); } if (e.key === "ArrowRight") { ry += 20; set(); } });
  // leve movimento ao passar o mouse
  if (!reduce) stage.addEventListener("mousemove", e => { if (drag) return; const r = stage.getBoundingClientRect(); const dx = (e.clientX - r.left) / r.width - .5; book.style.setProperty("--ry", (ry + dx * 14) + "deg"); });
  stage.addEventListener("mouseleave", () => { if (!drag) set(); });
  // botão "ver a quarta capa"
  const flip = book.closest("[data-book-wrap]")?.querySelector("[data-flip]");
  flip?.addEventListener("click", () => { const back = Math.abs(((ry % 360) + 360) % 360 - 180) < 90; ry = back ? -28 : 180 - 20; set(); flip.textContent = back ? "Ver quarta capa ↻" : "Ver capa ↺"; });
});

/* ---------- flashcards de avaliações ---------- */
(async () => {
  const root = $("[data-reviews]"); if (!root) return;
  let data; try { data = await getJSON("content/avaliacoes.json"); } catch { root.querySelector(".scene").innerHTML = `<p class="news-empty">Não foi possível carregar as avaliações agora.</p>`; return; }
  const fixed = root.dataset.reviews; // "todos" ou o nome do livro
  let books = []; try { books = JSON.parse(root.dataset.books || "[]"); } catch { }
  const bookOf = r => books.find(b => (r.livro || "") === b.k) || books.find(b => (r.livro || "").startsWith(b.k)) || null;
  const nome = n => (n === n.toUpperCase() && n.length > 3) ? n.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase()) : n.charAt(0).toUpperCase() + n.slice(1);
  const trecho = (t, max = 220) => { t = t.replace(/\s+/g, " ").trim(); if (t.length <= max) return { txt: t, cut: false }; const s = t.slice(0, max); const p = Math.max(s.lastIndexOf(". "), s.lastIndexOf("! "), s.lastIndexOf("? ")); return p > 90 ? { txt: s.slice(0, p + 1), cut: true } : { txt: s.slice(0, s.lastIndexOf(" ")) + "…", cut: true }; };
  const ord = a => [...a].sort((x, y) => (y.estrelas - x.estrelas) || ((y.texto || "").length - (x.texto || "").length));
  const L = {};
  books.forEach(b => { L[b.k] = ord(data.avaliacoes.filter(r => bookOf(r) === b)); });
  const T = []; const mx = Math.max(0, ...books.map(b => L[b.k].length));
  for (let i = 0; i < mx; i++) books.forEach(b => { if (L[b.k][i]) T.push(L[b.k][i]); });
  L.todos = T;
  const scene = $(".scene", root), count = $(".count", root), bar = $(".bar i", root);
  let filtro = fixed === "todos" ? "todos" : fixed, idx = 0, dir = 1, paused = reduce, timer;
  if (!L[filtro] || !L[filtro].length) { scene.innerHTML = `<p class="news-empty">Ainda não há avaliações aqui.</p>`; return; }
  const DUR = 8000;
  const stars = n => `<span class="stars" aria-label="${n} de 5 estrelas">${"★".repeat(n)}<span class="off">${"★".repeat(5 - n)}</span></span>`;
  function render() {
    const r = L[filtro][idx]; if (!r) return; const bk = bookOf(r) || { t: r.livro, c: "m" }; const t = trecho(r.texto || ""), cls = bk.c;
    const who = `<div class="who"><b>${esc(nome(r.nome || ""))}</b><small>${fmtData(r.data)} · avaliado na Amazon</small></div>`;
    scene.innerHTML = `<div class="card enter" tabindex="0" role="button" aria-pressed="false" aria-label="Avaliação de ${esc(nome(r.nome || ""))} sobre ${esc(bk.t)}. Toque para ler completa." style="--dx:${dir * 40}px;--ry:${dir * -8}deg">
      <article class="face front ${cls}"><div class="fc-top"><span class="seal">${esc(bk.t)}</span>${stars(r.estrelas)}</div>
        <div class="qmark" aria-hidden="true">“</div><h3 class="fc-title">${esc(r.titulo)}</h3><p class="fc-text">${esc(t.txt)}</p>
        <div class="fc-foot">${who}${t.cut ? `<span class="more">Ler completa ↻</span>` : ""}</div></article>
      <article class="face back ${cls}" aria-hidden="true"><div class="fc-top"><span class="seal">${esc(bk.t)}</span>${stars(r.estrelas)}</div>
        <h3 class="fc-title">${esc(r.titulo)}</h3><div class="full">${esc(r.texto)}</div>
        <div class="fc-foot">${who}<span class="more">Voltar ↺</span></div></article></div>`;
    const card = scene.firstElementChild;
    const flip = () => { const f = card.classList.toggle("flipped"); card.setAttribute("aria-pressed", f); card.querySelector(".back").setAttribute("aria-hidden", !f); card.querySelector(".front").setAttribute("aria-hidden", f); pause(f); };
    card.addEventListener("click", e => { if (e.target.closest(".full") && card.classList.contains("flipped")) return; flip(); });
    card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
    count.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(L[filtro].length).padStart(2, "0")}`;
    bar.classList.remove("run"); void bar.offsetWidth; bar.style.setProperty("--dur", DUR + "ms"); if (!reduce) bar.classList.add("run");
    root.classList.toggle("paused", paused);
  }
  const go = d => { dir = d; idx = (idx + d + L[filtro].length) % L[filtro].length; render(); };
  const schedule = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => { if (!paused) go(1); }, DUR); };
  function pause(p) { paused = p; root.classList.toggle("paused", p); if (!p) { bar.classList.remove("run"); void bar.offsetWidth; if (!reduce) bar.classList.add("run"); schedule(); } }
  $(".next", root).onclick = () => { go(1); schedule(); };
  $(".prev", root).onclick = () => { go(-1); schedule(); };
  $$(".tab", root).forEach(t => t.onclick = () => { if (!L[t.dataset.f] || !L[t.dataset.f].length) return; $$(".tab", root).forEach(x => x.setAttribute("aria-selected", x === t)); filtro = t.dataset.f; idx = 0; dir = 1; render(); schedule(); });
  scene.addEventListener("mouseenter", () => pause(true));
  scene.addEventListener("mouseleave", () => { if (!scene.querySelector(".flipped")) pause(false); });
  let x0 = null;
  scene.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  scene.addEventListener("touchend", e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) { go(dx < 0 ? 1 : -1); schedule(); } });
  render(); schedule();
})();

/* ---------- trailer ---------- */
$$(".video").forEach(v => {
  const video = $("video", v), btn = $(".play", v); if (!video || !btn) return;
  btn.addEventListener("click", () => { btn.hidden = true; video.controls = true; video.play().catch(() => { }); });
  video.addEventListener("ended", () => { btn.hidden = false; video.controls = false; });
});

/* ---------- em breve: frases uma a uma ---------- */
(() => {
  const ps = $$(".soon .lines p"); if (!ps.length) return;
  const show = () => ps.forEach((p, i) => setTimeout(() => p.classList.add("on"), reduce ? 0 : i * 700));
  if (!("IntersectionObserver" in window)) return show();
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { show(); io.disconnect(); } }, { threshold: .35 });
  io.observe($(".soon .lines"));
})();

/* ---------- prêmios ---------- */
(async () => {
  const el = $("[data-premios]"); if (!el) return;
  try {
    const { premios } = await getJSON("content/premios.json");
    el.innerHTML = premios.map(p => `<div class="award">
      <div class="medal" aria-hidden="true"><div><b>${esc(p.ano)}</b><small>Selecionado · ${esc(p.resultado.replace(/^Selecionad[oa] na /i, ""))}</small></div></div>
      <div><p class="eyebrow">${esc(p.instituicao)}</p><h3 class="h3" style="margin-top:10px">${esc(p.titulo)}</h3>
        <p class="obra">${esc(p.obra)}</p><p class="lead muted">${esc(p.descricao)}</p>
        <dl><dt>Resultado</dt><dd>${esc(p.resultado)}</dd><dt>Ano</dt><dd>${esc(p.ano)}</dd></dl></div></div>`).join('<hr style="border:0;border-top:1px solid var(--rule);margin:48px 0">');
  } catch { }
})();

/* ---------- notícias (painel + Substack) ---------- */
(async () => {
  const el = $("[data-news]"); if (!el) return;
  const limit = +el.dataset.news || 99, full = el.hasAttribute("data-full");
  let local = [], subs = [], subsOk = false;
  try { local = (await getJSON("content/noticias.json")).posts.map(p => ({ ...p, fonte: "site" })); } catch { }
  try { const r = await getJSON("api/substack"); subs = r.posts.map(p => ({ ...p, fonte: "substack" })); subsOk = true; } catch { }
  const all = [...local, ...subs].sort((a, b) => String(b.data).localeCompare(String(a.data))).slice(0, limit);
  if (!all.length) { el.innerHTML = `<p class="news-empty">Nenhuma notícia publicada ainda.</p>`; return; }
  el.innerHTML = all.map((p, i) => {
    const thumb = p.imagem ? `<div class="thumb" style="background-image:url('${esc(p.imagem)}')"></div>` : `<div class="thumb" style="background:linear-gradient(135deg,#1b1e18,#0b0c0a)"></div>`;
    const src = `<div class="src"><span>${fmtData(p.data)}</span>${p.fonte === "substack" ? "<em>Substack</em>" : ""}</div>`;
    if (p.fonte === "substack") return `<a class="post" href="${esc(p.link)}" target="_blank" rel="noopener">${thumb}<div class="body">${src}<h3>${esc(p.titulo)}</h3><p>${esc(p.resumo)}</p><p class="mono" style="font-size:12px;color:var(--accent)">Ler no Substack →</p></div></a>`;
    if (full) return `<details class="post" ${i === 0 ? "open" : ""}><summary style="list-style:none;cursor:pointer">${thumb}<div class="body">${src}<h3>${esc(p.titulo)}</h3><p>${esc(p.resumo)}</p></div></summary><div class="body post-full" style="padding-top:0">${esc(p.corpo)}</div></details>`;
    return `<a class="post" href="noticias.html">${thumb}<div class="body">${src}<h3>${esc(p.titulo)}</h3><p>${esc(p.resumo)}</p></div></a>`;
  }).join("") + (full && !subsOk ? `<p class="news-empty">Os textos do Substack aparecem aqui automaticamente quando o site estiver publicado em vinikautor.com.br.</p>` : "");
})();

/* ---------- inscrição (Substack) ---------- */
$$("[data-substack]").forEach(box => {
  const url = box.dataset.substack;
  // o quadro do Substack vem primeiro; o botão continua embaixo, para quem não vir o campo de e-mail
  if (LIVE && url) box.insertAdjacentHTML("afterbegin", `<iframe src="${url}/embed" title="Inscrição no Substack de Vinik" style="width:100%;height:320px;border:1px solid var(--rule);border-radius:12px;background:#fff;margin-bottom:18px" frameborder="0" scrolling="no"></iframe>`);
});

/* ---------- copiar e-mail ---------- */
$$("[data-copy]").forEach(b => b.addEventListener("click", async () => {
  const t = b.dataset.copy;
  try { await navigator.clipboard.writeText(t); b.textContent = "Copiado"; }
  catch { const c = b.parentElement.querySelector("code"); if (c) { const r = document.createRange(); r.selectNodeContents(c); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } b.textContent = "Selecionado, use Ctrl+C"; }
  setTimeout(() => b.textContent = "Copiar", 2200);
}));

/* ---------- formulário de contato (Netlify Forms) ---------- */
$$("form.js-contato").forEach(f => {
  const note = $(".form-note", f), okMsg = f.dataset.ok || "Mensagem enviada.";
  if (/[?&]enviado=1/.test(location.search)) { note.className = "form-note ok"; note.textContent = okMsg; }
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = $("button[type=submit]", f);
    if (!f.checkValidity()) { f.reportValidity(); return; }
    btn.disabled = true; note.className = "form-note"; note.textContent = "Enviando…";
    try {
      const r = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(f)).toString() });
      if (!r.ok) throw 0;
      f.reset(); note.className = "form-note ok"; note.textContent = okMsg;
    } catch {
      note.className = "form-note err"; note.textContent = LIVE ? "Não foi possível enviar agora. Tente de novo ou use o e-mail ao lado." : "O envio funciona quando o site estiver publicado.";
    } finally { btn.disabled = false; }
  });
});

/* ---------- lançamento estilo dossiê: entrada + máquina de escrever ---------- */
$$(".seq").forEach(sec => {
  const t = $(".type", sec), full = t ? t.dataset.text : "";
  const start = () => {
    sec.classList.add("on");
    if (!t || reduce) return;
    t.textContent = ""; t.classList.add("typing"); let i = 0;
    setTimeout(function step() { i += 2; t.textContent = full.slice(0, i); if (i < full.length) setTimeout(step, 28); else setTimeout(() => t.classList.remove("typing"), 2400); }, 900);
  };
  if (!("IntersectionObserver" in window)) return start();
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { start(); io.disconnect(); } }, { threshold: .15 });
  io.observe(sec);
});
