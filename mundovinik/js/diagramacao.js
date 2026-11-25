/* Diagramação: miolo paginado, lombada, capa e PDF de gráfica */
const MM = 96 / 25.4; // px por mm
const TRIMS = { '140x210': '14 × 21 cm', '160x230': '16 × 23 cm', '155x230': '15,5 × 23 cm', '148x210': 'A5 (14,8 × 21 cm)', '152x229': '6 × 9 pol. (KDP)', '127x203': '5 × 8 pol. (KDP)', '120x180': '12 × 18 cm (bolso)' };
const PAPERS = { offset75: ['Offset 75 g', .05], offset90: ['Offset 90 g', .06], polen80: ['Pólen soft 80 g', .06], polen90: ['Pólen bold 90 g', .075], custom: ['Outro (digite)', .06] };
const FONTS = { 'EB Garamond': 'EB Garamond', 'Crimson Pro': 'Crimson Pro', 'Cormorant Garamond': 'Cormorant Garamond', 'Literata': 'Literata' };
const OPENINGS = { classico: 'Clássica: “Capítulo 1” e título', romano: 'Numeral romano grande', ornamento: 'Título com ornamento de azulejo', titulo: 'Só o título' };
const LAYOUT_DEFAULT = { trim: '160x230', mi: 22, me: 16, mt: 20, mb: 22, font: 'EB Garamond', size: 11, lh: 1.38, ind: 1.3, chapterOdd: true, opening: 'classico', sink: 28, dropcap: true, smallcaps: true, header: true, headerMode: 'autor-titulo', paper: 'polen80', caliper: .06, bleed: 5, marks: true, multiple: 4, falsoRosto: true, rosto: true, creditos: true, sumario: true, dedicatoria: '', epigrafe: '', epigrafeAutor: '', editora: 'Edição do autor', cidade: 'São Luís', ano: String(new Date().getFullYear()), isbn: '', ficha: '', edicao: '1ª edição' };
const roman = n => { const r = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, l] of r) while (n >= v) { s += l; n -= v; } return s; };
const ORN = (w = 90) => `<svg class="orn" width="${w}" height="${w * .22}" viewBox="0 0 90 20" aria-hidden="true"><path d="M45 2c3 4 7 6 12 8-5 2-9 4-12 8-3-4-7-6-12-8 5-2 9-4 12-8z" fill="none" stroke="#222" stroke-width="1"/><circle cx="45" cy="10" r="1.6" fill="#222"/><path d="M4 10h24M62 10h24" stroke="#222" stroke-width=".7"/><circle cx="30" cy="10" r="1" fill="#222"/><circle cx="60" cy="10" r="1" fill="#222"/></svg>`;

(function () {
  const st = document.createElement('style');
  st.textContent = `.pg .txt{position:relative}.pg .notes{position:absolute;left:0;right:0;bottom:0;font-size:.78em;line-height:1.3;border-top:.5pt solid #333;padding-top:.35em}.pg .notes:empty{display:none}.pg .notes p{text-indent:0;margin:0 0 .2em}
  .pg sup.fnote{font-size:.62em;vertical-align:super;line-height:0;color:inherit}
  #measure{position:absolute;left:-30000px;top:0;visibility:hidden}
  .spread{content-visibility:auto;contain-intrinsic-size:auto 600px}
  .pgnum-label{font-size:12px;color:#e6e8ef;text-align:center;margin-top:6px}
  .covguide{position:absolute;border:1px dashed rgba(232,85,58,.9);pointer-events:none}
  .covtrim{position:absolute;border:1px solid rgba(0,200,255,.9);pointer-events:none}`;
  document.head.appendChild(st);
})();

const Diagramacao = App.views.diagramacao = {
  mode: 'miolo', pages: [], run: 0, result: null,
  L() { const L = App.book.layout || (App.book.layout = {}); for (const k in LAYOUT_DEFAULT) if (!(k in L)) L[k] = LAYOUT_DEFAULT[k]; return L; },
  dims(L = this.L()) { const [w, h] = L.trim.split('x').map(Number); return { w, h }; },
  async render(v, top) {
    const L = this.L();
    top.innerHTML = `<h2>Diagramação</h2><div class="seg">${[['miolo', 'Miolo'], ['capa', 'Capa'], ['ebook', 'E-book']].map(([k, l]) => `<button data-m="${k}" class="${this.mode === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <button class="btn pri sm" id="pdf">${ic('dl')} ${this.mode === 'capa' ? 'PDF da capa' : this.mode === 'ebook' ? 'Gerar EPUB' : 'PDF do miolo'}</button>`;
    $$('[data-m]', top).forEach(b => b.onclick = () => { this.mode = b.dataset.m; App.go('diagramacao'); });
    v.style.overflow = 'hidden';
    if (this.mode === 'ebook') { v.style.overflow = ''; $('#pdf').onclick = () => Exporta.epub(); return this.ebookView(v); }
    v.innerHTML = `<div class="dg"><div class="ctrl" id="ctrl"></div><div class="stage" id="stage"><div class="summary" id="summ">Calculando…</div><div class="spreads" id="spreads"></div></div></div><div id="measure"></div>`;
    if (this.mode === 'miolo') { this.controlsMiolo(); $('#pdf').onclick = () => this.printMiolo(); await this.paginate(); }
    else { this.controlsCapa(); $('#pdf').onclick = () => this.printCapa(); if (!this.result || this.result.bookId !== App.book.id) await this.paginate(true); this.renderCapa(); }
    this.ro = new ResizeObserver(() => this.mode === 'miolo' ? this.scalePreview() : this.renderCapa()); this.ro.observe($('#stage'));
  },
  leave() { this.run++; this.ro?.disconnect(); $('#view').style.overflow = ''; },

  /* controles */
  rng(id, label, min, max, step, val, unit = '') { return `<label class="f">${label}<div class="rng"><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><output id="${id}o">${String(val).replace('.', ',')}${unit}</output></div></label>`; },
  controlsMiolo() {
    const L = this.L();
    $('#ctrl').innerHTML = `
      <details open><summary>Formato e papel</summary><div>
        <label class="f">Tamanho do livro<select id="trim">${Object.entries(TRIMS).map(([k, l]) => `<option value="${k}" ${L.trim === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="f">Papel do miolo<select id="paper">${Object.entries(PAPERS).map(([k, [l]]) => `<option value="${k}" ${L.paper === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="f">Espessura por página (mm)<input type="number" id="caliper" step=".005" min=".03" max=".15" value="${L.caliper}"></label>
        <p class="small muted" style="margin:0">A lombada sai de páginas × espessura. Os valores são médios; confirme com a gráfica, que costuma passar a fórmula dela.</p>
        <label class="f">Completar páginas até múltiplo de<select id="multiple">${[1, 2, 4, 8, 16].map(n => `<option ${+L.multiple === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      </div></details>
      <details open><summary>Texto</summary><div>
        <label class="f">Fonte<select id="font">${Object.keys(FONTS).map(f => `<option ${L.font === f ? 'selected' : ''}>${f}</option>`).join('')}</select></label>
        ${this.rng('size', 'Corpo', 9, 13, .5, L.size, ' pt')}
        ${this.rng('lh', 'Entrelinha', 1.15, 1.7, .01, L.lh)}
        ${this.rng('ind', 'Recuo do parágrafo', 0, 2.5, .1, L.ind, ' em')}
      </div></details>
      <details><summary>Margens (mm)</summary><div class="grid2">
        ${this.rng('mi', 'Interna (lombada)', 12, 30, 1, L.mi)}${this.rng('me', 'Externa', 10, 25, 1, L.me)}${this.rng('mt', 'Superior', 10, 30, 1, L.mt)}${this.rng('mb', 'Inferior', 12, 32, 1, L.mb)}
      </div></details>
      <details open><summary>Abertura dos capítulos</summary><div>
        <label class="f">Estilo<select id="opening">${Object.entries(OPENINGS).map(([k, l]) => `<option value="${k}" ${L.opening === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        ${this.rng('sink', 'Descida do título (% da página)', 0, 45, 1, L.sink, '%')}
        <label class="row small" style="gap:8px"><input type="checkbox" id="chapterOdd" ${L.chapterOdd ? 'checked' : ''}> Capítulo sempre em página ímpar</label>
        <label class="row small" style="gap:8px"><input type="checkbox" id="dropcap" ${L.dropcap ? 'checked' : ''}> Letra capitular</label>
        <label class="row small" style="gap:8px"><input type="checkbox" id="smallcaps" ${L.smallcaps ? 'checked' : ''}> Primeiras palavras em versalete</label>
        <label class="row small" style="gap:8px"><input type="checkbox" id="header" ${L.header ? 'checked' : ''}> Cabeçalho (autor à esquerda, título à direita)</label>
      </div></details>
      <details><summary>Páginas iniciais</summary><div>
        <label class="row small" style="gap:8px"><input type="checkbox" id="falsoRosto" ${L.falsoRosto ? 'checked' : ''}> Falso rosto</label>
        <label class="row small" style="gap:8px"><input type="checkbox" id="rosto" ${L.rosto ? 'checked' : ''}> Folha de rosto</label>
        <label class="row small" style="gap:8px"><input type="checkbox" id="creditos" ${L.creditos ? 'checked' : ''}> Página de créditos</label>
        <label class="row small" style="gap:8px"><input type="checkbox" id="sumario" ${L.sumario ? 'checked' : ''}> Sumário</label>
        <label class="f">Editora ou selo<input type="text" id="editora" value="${esc(L.editora)}"></label>
        <div class="grid2"><label class="f">Cidade<input type="text" id="cidade" value="${esc(L.cidade)}"></label><label class="f">Ano<input type="text" id="ano" value="${esc(L.ano)}"></label></div>
        <div class="grid2"><label class="f">Edição<input type="text" id="edicao" value="${esc(L.edicao)}"></label><label class="f">ISBN<input type="text" id="isbn" value="${esc(L.isbn)}"></label></div>
        <label class="f">Ficha catalográfica (cole a que a bibliotecária fizer)<textarea id="ficha">${esc(L.ficha)}</textarea></label>
        <label class="f">Dedicatória<textarea id="dedicatoria">${esc(L.dedicatoria)}</textarea></label>
        <label class="f">Epígrafe<textarea id="epigrafe">${esc(L.epigrafe)}</textarea></label>
        <label class="f">Autor da epígrafe<input type="text" id="epigrafeAutor" value="${esc(L.epigrafeAutor)}"></label>
      </div></details>
      <details><summary>Para a gráfica</summary><div>
        ${this.rng('bleed', 'Sangria', 0, 5, 1, L.bleed, ' mm')}
        <label class="row small" style="gap:8px"><input type="checkbox" id="marks" ${L.marks ? 'checked' : ''}> Marcas de corte no PDF</label>
      </div></details>
      <button class="btn sm ghost" id="reset">Voltar ao padrão</button>`;
    const upd = debounce(async () => { await App.saveBook(); this.paginate(); }, 450);
    $$('#ctrl input,#ctrl select,#ctrl textarea').forEach(el => el.addEventListener('input', () => {
      const k = el.id; if (!k) return;
      let val = el.type === 'checkbox' ? el.checked : el.type === 'range' || el.type === 'number' ? +el.value : el.value;
      L[k] = val;
      if (k === 'paper' && val !== 'custom') { L.caliper = PAPERS[val][1]; $('#caliper').value = L.caliper; }
      if ($('#' + k + 'o')) $('#' + k + 'o').textContent = String(val).replace('.', ',') + ($('#' + k + 'o').textContent.match(/[a-z%]+$/i)?.[0] ? ' ' + $('#' + k + 'o').textContent.match(/[a-z%]+$/i)[0] : '');
      if (['paper', 'caliper', 'bleed', 'marks'].includes(k)) { App.saveBook(); this.summary(); return; }
      upd();
    }));
    $('#reset').onclick = async () => { App.book.layout = { ...LAYOUT_DEFAULT, dedicatoria: L.dedicatoria, epigrafe: L.epigrafe, epigrafeAutor: L.epigrafeAutor, isbn: L.isbn, ficha: L.ficha }; await App.saveBook(); App.go('diagramacao'); };
  },

  /* paginação */
  async paginate(silent) {
    const my = ++this.run;
    const L = this.L(), { w, h } = this.dims(L), b = App.book;
    const chs = (await App.chapters()).filter(c => textOf(c.html).trim() || c.type === 'parte');
    const meas = $('#measure'); if (!meas) return;
    if (!silent) $('#summ').innerHTML = '<span>Recalculando o miolo…</span>';
    try { await Promise.all(['400', 'italic 400', '500'].map(s => document.fonts.load(`${s} ${L.size}pt "${L.font}"`))); } catch (e) { }
    meas.innerHTML = '';
    const W = w * MM, H = h * MM;
    const pages = []; let tocPages = 1, toc = [];
    for (let pass = 0; pass < 2; pass++) {
      pages.length = 0; meas.innerHTML = ''; toc = [];
      const newPage = (kind = 'text') => {
        const n = pages.length + 1, odd = n % 2 === 1;
        const pg = document.createElement('div'); pg.className = 'pg';
        pg.style.cssText = `width:${W}px;height:${H}px;font-family:'${L.font}',serif;font-size:${L.size}pt;line-height:${L.lh};--ind:${L.ind}em`;
        const left = (odd ? L.mi : L.me) * MM, right = (odd ? L.me : L.mi) * MM;
        pg.innerHTML = `<div class="hdr"></div><div class="bodyarea bk" style="left:${left}px;top:${L.mt * MM}px;width:${W - left - right}px;height:${H - (L.mt + L.mb) * MM}px"><div class="txt"></div><div class="notes"></div></div><div class="ftr"></div>`;
        $('.hdr', pg).style.top = (L.mt * .42) * MM + 'px'; $('.hdr', pg).style.padding = `0 ${right}px 0 ${left}px`;
        $('.ftr', pg).style.bottom = (L.mb * .38) * MM + 'px';
        meas.appendChild(pg);
        const p = { el: pg, n, kind, chapter: null };
        pages.push(p); return p;
      };
      const body = p => $('.bodyarea', p.el), txt = p => $('.txt', p.el);
      const overflow = p => { const notes = $('.notes', p.el); notes.innerHTML = $$('.txt sup.fnote', p.el).map(f => `<p>${esc(f.textContent)}. ${esc(f.dataset.note)}</p>`).join(''); return txt(p).offsetHeight + (notes.innerHTML ? notes.offsetHeight + 6 : 0) > body(p).clientHeight + .5; };
      const toOdd = () => { if (pages.length % 2 === 1) newPage('blank'); };
      const fullPage = (html, kind = 'front', valign = 'center') => { const p = newPage(kind); txt(p).innerHTML = `<div class="front" style="height:${body(p).clientHeight}px;justify-content:${valign}">${html}</div>`; return p; };
      // páginas iniciais
      if (L.falsoRosto) { fullPage(`<div style="margin-top:30%;font-size:1.5em;letter-spacing:.06em">${esc(b.title)}</div>`); newPage('blank'); }
      if (L.rosto) { fullPage(`<div style="margin-top:12%;letter-spacing:.12em;font-size:1.05em">${esc((b.author || '').toUpperCase())}</div><div style="margin-top:22%;font-size:2.1em;line-height:1.1">${esc(b.title)}</div>${b.subtitle ? `<div style="margin-top:.6em;font-style:italic">${esc(b.subtitle)}</div>` : ''}<div style="margin-top:auto;font-size:.85em;letter-spacing:.1em">${esc(L.editora || '')}${L.cidade ? '<br>' + esc(L.cidade) : ''}</div>`, 'front', 'flex-start'); }
      if (L.creditos) { const pc = L.rosto ? null : null; if (pages.length % 2 === 0) newPage('blank'); fullPage(`<div style="margin-top:auto;font-size:.78em;line-height:1.45;text-align:left;width:100%">© ${esc(L.ano)} ${esc(b.author || '')}<br>Todos os direitos reservados.<br><br>${esc(L.edicao)}${L.cidade ? ' · ' + esc(L.cidade) : ''}${L.isbn ? '<br>ISBN ' + esc(L.isbn) : ''}${L.ficha ? `<div style="border:.5pt solid #333;padding:.6em;margin-top:1em;white-space:pre-wrap;font-size:.95em">${esc(L.ficha)}</div>` : ''}<br>${esc(L.editora || '')}</div>`, 'front', 'flex-end'); }
      if (L.dedicatoria) { toOdd(); fullPage(`<div style="margin-top:30%;margin-left:auto;width:70%;text-align:right;font-style:italic;white-space:pre-wrap">${esc(L.dedicatoria)}</div>`, 'front', 'flex-start'); }
      if (L.epigrafe) { toOdd(); fullPage(`<div style="margin-top:30%;margin-left:auto;width:72%;text-align:right;font-style:italic;white-space:pre-wrap">${esc(L.epigrafe)}</div>${L.epigrafeAutor ? `<div style="margin-left:auto;text-align:right;margin-top:.6em;font-size:.9em">${esc(L.epigrafeAutor)}</div>` : ''}`, 'front', 'flex-start'); }
      let tocStart = 0;
      if (L.sumario) { toOdd(); tocStart = pages.length; for (let i = 0; i < tocPages; i++) newPage('toc'); }
      // capítulos
      let capN = 0, notesN = 0;
      for (let ci = 0; ci < chs.length; ci++) {
        if (my !== this.run) return;
        const c = chs[ci];
        if (L.chapterOdd || c.type === 'parte') toOdd();
        if (c.type === 'parte') { const p = fullPage(`<div style="margin-top:35%;font-size:.85em;letter-spacing:.3em">PARTE</div><div style="font-size:1.9em;margin-top:.4em">${esc(c.title)}</div>`, 'parte', 'flex-start'); p.chapter = c; toc.push({ t: c.title, p: p.n, parte: true }); newPage('blank'); continue; }
        const numbered = c.type === 'capitulo'; if (numbered) capN++;
        let p = newPage('open'); p.chapter = c;
        toc.push({ t: (numbered ? capN + '. ' : '') + c.title, p: p.n });
        const lbl = numbered ? (L.opening === 'romano' ? roman(capN) : 'Capítulo ' + capN) : CH_TYPES[c.type].split(' ')[0];
        const sinkPx = body(p).clientHeight * L.sink / 100;
        let head = '';
        if (L.opening === 'classico') head = `<div class="num">${esc(lbl)}</div><div class="ttl">${esc(c.title)}</div>`;
        if (L.opening === 'romano') head = `<div class="ttl" style="font-size:3.4em;line-height:1">${esc(numbered ? lbl : '')}</div><div style="font-style:italic;font-size:1.25em;margin-top:.2em">${esc(c.title)}</div>`;
        if (L.opening === 'ornamento') head = `<div class="num">${esc(lbl)}</div><div class="ttl">${esc(c.title)}</div>${ORN()}`;
        if (L.opening === 'titulo') head = `<div class="ttl">${esc(c.title)}</div>`;
        txt(p).innerHTML = `<div class="chopen" style="padding-top:${sinkPx}px;padding-bottom:${L.size * 2.2}pt">${head}</div>`;
        // parágrafos
        const src = document.createElement('div'); src.innerHTML = c.html;
        $$('sup.fnote', src).forEach(f => { notesN++; f.textContent = notesN; f.removeAttribute('contenteditable'); });
        let paras = [...src.children].filter(el => el.textContent.trim() || el.classList.contains('cena'));
        let first = true, afterCena = false;
        for (let el of paras) {
          if (my !== this.run) return;
          let node;
          if (el.classList.contains('cena')) { node = document.createElement('p'); node.className = 'cena'; node.innerHTML = L.opening === 'ornamento' ? ORN(60) : '*'; afterCena = true; }
          else {
            node = document.createElement('p'); node.innerHTML = el.innerHTML; if (el.classList.contains('noind')) node.className = 'noind';
            if (first) { const t = node.textContent.trim(); node.classList.add('noind'); if (L.dropcap && /^[\p{L}\p{N}]/u.test(t)) node.classList.add('drop'); else if (L.smallcaps) this.smallcaps(node); if (L.dropcap && L.smallcaps && /^[\p{L}\p{N}]/u.test(t)) this.smallcaps(node, true); first = false; }
            else if (afterCena) { node.classList.add('noind'); afterCena = false; }
          }
          txt(p).appendChild(node);
          while (overflow(p)) {
            const rest = this.split(node, () => overflow(p));
            if (rest === node) { node.remove(); p = newPage(); p.chapter = c; txt(p).appendChild(node); if (overflow(p)) { /* parágrafo maior que a página: força divisão */ const r2 = this.split(node, () => overflow(p), true); if (r2 === node) break; p = newPage(); p.chapter = c; txt(p).appendChild(r2); node = r2; continue; } break; }
            p = newPage(); p.chapter = c; txt(p).appendChild(rest); node = rest;
          }
          if (pages.length % 40 === 0) await new Promise(r => setTimeout(r));
        }
      }
      while (L.multiple > 1 && pages.length % L.multiple) newPage('blank');
      // sumário
      if (L.sumario) {
        const need = this.tocPagesNeeded(toc, pages[tocStart]);
        if (need !== tocPages && pass === 0) { tocPages = need; continue; }
        this.fillToc(toc, pages.slice(tocStart, tocStart + tocPages));
      }
      break;
    }
    if (my !== this.run) return;
    // cabeçalhos e números
    for (const p of pages) {
      const show = p.kind === 'text' || p.kind === 'toc' && false;
      if (p.kind === 'text') {
        $('.ftr', p.el).innerHTML = `<span class="pgnum">${p.n}</span>`;
        if (L.header) { const odd = p.n % 2 === 1; $('.hdr', p.el).innerHTML = `<span style="font-size:.78em;letter-spacing:.14em;display:block;text-align:${odd ? 'right' : 'left'}">${esc(odd ? (b.title || '').toUpperCase() : (b.author || '').toUpperCase())}</span>`; $('.hdr', p.el).style.textAlign = odd ? 'right' : 'left'; }
      } else if (p.kind === 'open') $('.ftr', p.el).innerHTML = `<span class="pgnum">${p.n}</span>`;
    }
    this.pages = pages;
    const words = chs.reduce((s, c) => s + (c.words || 0), 0);
    this.result = { bookId: b.id, count: pages.length, words, w, h };
    if (silent) { meas.innerHTML = ''; return; }
    this.renderPreview(); this.summary();
  },
  smallcaps(p, skipFirst) {
    const tn = [...p.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()); if (!tn || tn !== p.firstChild) return;
    const m = tn.textContent.match(/^(\s*\S+(?:\s+\S+){0,2})/); if (!m) return;
    let head = m[1]; if (skipFirst) { const ch = head.trimStart()[0]; const pre = head.slice(0, head.indexOf(ch) + 1); const sp = document.createElement('span'); sp.className = 'smallcaps'; sp.textContent = head.slice(pre.length); if (!sp.textContent.trim()) return; tn.textContent = tn.textContent.slice(head.length); p.insertBefore(sp, tn); p.insertBefore(document.createTextNode(pre), sp); return; }
    const sp = document.createElement('span'); sp.className = 'smallcaps'; sp.textContent = head; tn.textContent = tn.textContent.slice(head.length); p.insertBefore(sp, tn);
  },
  /* divide o parágrafo no ponto em que a página enche; devolve o resto (ou o próprio nó se nada coube) */
  split(node, over, force) {
    const full = node.textContent; const cuts = [];
    for (const m of full.matchAll(/\s+/g)) cuts.push(m.index + m[0].length);
    if (!cuts.length) return node;
    const locate = off => { const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT); let acc = 0, n; while ((n = w.nextNode())) { if (acc + n.length >= off) return [n, off - acc]; acc += n.length; } return null; };
    const original = node.cloneNode(true);
    const build = k => { // primeiros k cortes
      const tmp = original.cloneNode(true); node.replaceChildren(...tmp.childNodes);
      const loc = locate(cuts[k]); const r = document.createRange(); r.setStart(loc[0], loc[1]); r.setEndAfter(node.lastChild); r.deleteContents();
    };
    let lo = 0, hi = cuts.length - 1, best = -1;
    // mínimo de 2 linhas: se nem a 1ª linha cabe, desiste
    while (lo <= hi) { const mid = (lo + hi) >> 1; build(mid); if (!over()) { best = mid; lo = mid + 1; } else hi = mid - 1; }
    if (best < 0 && !force) { node.replaceChildren(...original.cloneNode(true).childNodes); return node; }
    if (best < 0) best = 0;
    // evita viúva: se o pedaço que fica tem menos de ~6 palavras, joga tudo pra frente
    if (!force && best < 5) { node.replaceChildren(...original.cloneNode(true).childNodes); return node; }
    build(best);
    const rest = original.cloneNode(false); rest.classList.remove('drop'); rest.classList.add('cont');
    const tmp = original.cloneNode(true); const holder = document.createElement('div'); holder.appendChild(tmp);
    const w2 = document.createTreeWalker(tmp, NodeFilter.SHOW_TEXT); let acc = 0, n, loc = null; while ((n = w2.nextNode())) { if (acc + n.length >= cuts[best]) { loc = [n, cuts[best] - acc]; break; } acc += n.length; }
    const r = document.createRange(); r.setStart(tmp, 0); r.setEnd(loc[0], loc[1]); r.deleteContents();
    rest.append(...tmp.childNodes);
    // o final da linha da página anterior fica justificado: marca com classe
    node.style.textAlignLast = 'justify';
    return rest;
  },
  tocPagesNeeded(toc, page) { if (!page) return 1; const lines = toc.length + 3; const per = Math.floor($('.bodyarea', page.el).clientHeight / (this.L().size * 1.333 * this.L().lh * 1.15)); return Math.max(1, Math.ceil(lines / Math.max(8, per))); },
  fillToc(toc, tps) {
    let i = 0;
    tps.forEach((p, k) => {
      const area = $('.txt', p.el); const max = $('.bodyarea', p.el).clientHeight;
      area.innerHTML = k === 0 ? `<div style="text-align:center;font-size:1.5em;margin:12% 0 1.4em;letter-spacing:.06em">Sumário</div>` : '';
      while (i < toc.length) {
        const e = toc[i]; const d = document.createElement('div');
        d.style.cssText = `display:flex;gap:.4em;align-items:baseline;margin:.18em 0;${e.parte ? 'margin-top:.8em;letter-spacing:.1em;font-size:.9em' : ''}`;
        d.innerHTML = `<span>${esc(e.t)}</span><span style="flex:1;border-bottom:1px dotted #777;transform:translateY(-.25em)"></span><span>${e.p}</span>`;
        area.appendChild(d); if (area.offsetHeight > max) { d.remove(); break; } i++;
      }
    });
  },
  lombada() { const L = this.L(); return this.result ? this.result.count * (+L.caliper || .06) : 0; },
  summary() {
    if (!this.result || !$('#summ')) return;
    const L = this.L(); const r = this.result;
    $('#summ').innerHTML = `<div><b>${r.count}</b><span>páginas no ${TRIMS[L.trim].split(' (')[0]}</span></div><div><b>${this.lombada().toFixed(1).replace('.', ',')} mm</b><span>lombada (${PAPERS[L.paper][0].toLowerCase()})</span></div><div><b>${nf(r.words)}</b><span>palavras</span></div><div><b>${Math.round(r.words / Math.max(1, r.count))}</b><span>palavras por página</span></div><span class="small muted" style="margin-left:auto">Mexa nos controles: o miolo se refaz sozinho.</span>`;
  },
  renderPreview() {
    const sp = $('#spreads'); sp.innerHTML = '';
    const pages = this.pages;
    const groups = [[pages[0]]]; for (let i = 1; i < pages.length; i += 2) groups.push(pages.slice(i, i + 2));
    for (const g of groups) {
      const s = document.createElement('div'); s.className = 'spread';
      g.forEach(p => { const wrap = document.createElement('div'); wrap.className = 'pgwrap'; wrap.appendChild(p.el); const lab = document.createElement('div'); lab.className = 'pgnum-label'; lab.textContent = p.n; wrap.appendChild(lab); s.appendChild(wrap); });
      if (g.length === 1 && g[0].n === 1) s.style.justifyContent = 'flex-end';
      sp.appendChild(s);
    }
    $('#measure').innerHTML = '';
    this.scalePreview();
  },
  scalePreview() {
    if (!this.result || !$('#stage')) return;
    const { w, h } = this.result; const W = w * MM, H = h * MM;
    const avail = $('#stage').clientWidth - 50; const k = Math.min(1.1, avail / (2 * W + 4));
    $$('#spreads .pgwrap').forEach(wr => { wr.style.transform = `scale(${k})`; wr.style.width = W + 'px'; wr.style.marginRight = (W * k - W) + 'px'; wr.style.marginBottom = (H * k - H) + 'px'; });
    $$('#spreads .spread').forEach(s => { s.style.width = (2 * W * k + 4) + 'px'; s.style.containIntrinsicSize = `auto ${H * k + 24}px`; });
  },

  /* impressão para PDF */
  printDialog(onGo) {
    const inFrame = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
    const m = App.modal(`<h3>Gerar PDF para a gráfica</h3>
      <p>Vai abrir a janela de impressão do navegador. Nela, escolha:</p>
      <ol style="margin:0;padding-left:1.2em;line-height:1.7"><li>Destino: <b>Salvar como PDF</b></li><li>Margens: <b>Nenhuma</b></li><li>Mais definições: marque <b>Gráficos de fundo</b> e desmarque <b>Cabeçalhos e rodapés</b></li></ol>
      <p class="small muted">Use o Chrome ou o Edge no computador: o tamanho da página sai exato, com sangria${this.L().marks ? ' e marcas de corte' : ''}. O texto fica em vetor, como a gráfica pede.</p>
      ${inFrame ? '<div class="warnbox">Aqui na prévia do Claude a impressão fica bloqueada. No seu site (vinikautor.com.br/mundovinik) o botão funciona normalmente.</div>' : ''}
      <div class="acts"><button class="btn" data-close>Cancelar</button><button class="btn pri" id="pgo">Abrir impressão</button></div>`);
    $('#pgo', m).onclick = () => { m.close(); onGo(); };
  },
  printPages(els, wmm, hmm, opts = {}) {
    const L = this.L(); const bleed = opts.bleed ?? +L.bleed, marks = opts.marks ?? L.marks;
    const off = bleed + (marks ? 10 : 0);
    const PW = wmm + 2 * off, PH = hmm + 2 * off;
    const root = $('#printroot');
    const mk = () => { if (!marks) return ''; const l = (x, y, w, h) => `<div style="position:absolute;left:${x}mm;top:${y}mm;width:${w}mm;height:${h}mm;background:#000"></div>`; const t = .25, len = 7, g = bleed + 1.5; const xs = [off, off + wmm], ys = [off, off + hmm]; let s = ''; xs.forEach(x => { s += l(x - t / 2, ys[0] - g - len, t, len) + l(x - t / 2, ys[1] + g, t, len); }); ys.forEach(y => { s += l(xs[0] - g - len, y - t / 2, len, t) + l(xs[1] + g, y - t / 2, len, t); }); return s; };
    root.innerHTML = `<style>@page{size:${PW}mm ${PH}mm;margin:0}#printroot .pp{width:${PW}mm;height:${PH}mm}</style>` + els.map(el => `<div class="pp"><div style="position:absolute;left:${off - bleed}mm;top:${off - bleed}mm;width:${wmm + 2 * bleed}mm;height:${hmm + 2 * bleed}mm;background:${opts.bg || '#fff'}"></div><div style="position:absolute;left:${off}mm;top:${off}mm;width:${wmm}mm;height:${hmm}mm">${el.outerHTML}</div>${mk()}</div>`).join('');
    $$('#printroot .pg').forEach(p => { p.style.boxShadow = 'none'; p.style.transform = 'none'; });
    setTimeout(() => { try { window.print(); } catch (e) { App.toast('A impressão foi bloqueada aqui; abra pelo seu site.'); } }, 120);
  },
  printMiolo() { if (!this.pages.length) return App.toast('Espere o miolo terminar de calcular'); this.printDialog(() => this.printPages(this.pages.map(p => p.el), this.result.w, this.result.h)); },

  /* capa */
  C() { const L = this.L(); const C = L.cover || (L.cover = {}); const d = { back: '', bg: '#16307a', ink: '#ffffff', spineText: true, guides: true, backImg: '' }; for (const k in d) if (!(k in C)) C[k] = d[k]; return C; },
  controlsCapa() {
    const C = this.C(), L = this.L();
    $('#ctrl').innerHTML = `<p class="small muted" style="margin:0">A capa usa o número de páginas do miolo para calcular a lombada. Mude o papel ou o miolo na aba Miolo.</p>
      <label class="f">Frente (imagem 16 × 23 sem texto, ou com o título já na arte)<button class="btn sm" id="cfront">${ic('img')} ${App.book.cover ? 'Trocar imagem da frente' : 'Pôr imagem da frente'}</button></label>
      <label class="f">Quarta capa (fundo)<button class="btn sm" id="cbackimg">${ic('img')} ${C.backImg ? 'Trocar imagem do fundo' : 'Imagem de fundo (opcional)'}</button></label>
      ${C.backImg ? '<button class="btn sm ghost" id="cbackrm">Tirar imagem do fundo</button>' : ''}
      <div class="grid2"><label class="f">Cor de fundo<input type="color" id="cbg" value="${C.bg}" style="height:42px"></label><label class="f">Cor do texto<input type="color" id="cink" value="${C.ink}" style="height:42px"></label></div>
      <label class="f">Texto da quarta capa<textarea id="cback" style="min-height:160px">${esc(C.back)}</textarea></label>
      <label class="row small" style="gap:8px"><input type="checkbox" id="cspine" ${C.spineText ? 'checked' : ''}> Título e autor na lombada</label>
      <label class="row small" style="gap:8px"><input type="checkbox" id="cguides" ${C.guides ? 'checked' : ''}> Mostrar guias (corte em azul, área segura em coral)</label>
      <p class="small muted" style="margin:0">Deixe 5 mm de folga do corte para textos importantes (linha coral). Se a lombada tiver menos de 6 mm, a maioria das gráficas não imprime texto nela.</p>`;
    const save = debounce(async () => { await App.saveBook(); this.renderCapa(); }, 300);
    $('#cbg').oninput = e => { C.bg = e.target.value; save(); }; $('#cink').oninput = e => { C.ink = e.target.value; save(); };
    $('#cback').oninput = e => { C.back = e.target.value; save(); };
    $('#cspine').onchange = e => { C.spineText = e.target.checked; save(); }; $('#cguides').onchange = e => { C.guides = e.target.checked; save(); };
    $('#cfront').onclick = async () => { const f = await App.pickFile('image/*'); if (!f) return; App.book.cover = await App.shrinkImage(f, 2400, .92); await App.saveBook(); this.controlsCapa(); this.renderCapa(); };
    $('#cbackimg').onclick = async () => { const f = await App.pickFile('image/*'); if (!f) return; C.backImg = await App.shrinkImage(f, 2400, .9); await App.saveBook(); this.controlsCapa(); this.renderCapa(); };
    $('#cbackrm') && ($('#cbackrm').onclick = async () => { C.backImg = ''; await App.saveBook(); this.controlsCapa(); this.renderCapa(); });
  },
  coverEl(forPrint) {
    const L = this.L(), C = this.C(), b = App.book, { w, h } = this.dims(L);
    const sp = Math.max(1, this.lombada()), bl = +L.bleed;
    const TW = 2 * w + sp + 2 * bl, TH = h + 2 * bl;
    const el = document.createElement('div'); el.className = 'pg';
    el.style.cssText = `width:${TW}mm;height:${TH}mm;background:${C.bg};color:${C.ink};font-family:'${L.font}',serif;position:relative;overflow:hidden`;
    const back = `<div style="position:absolute;left:0;top:0;width:${bl + w}mm;height:${TH}mm;${C.backImg ? `background:url(${C.backImg}) center/cover` : ''}"></div>
      <div style="position:absolute;left:${bl + 14}mm;top:${bl + 22}mm;width:${w - 28}mm;font-size:10.5pt;line-height:1.5;white-space:pre-wrap;text-align:justify">${esc(C.back)}</div>
      <div style="position:absolute;left:${bl + 14}mm;bottom:${bl + 14}mm;font-size:8pt;letter-spacing:.12em">${esc((L.editora || '').toUpperCase())}</div>
      <div style="position:absolute;right:${bl + w - (w - 14)}mm;bottom:${bl + 12}mm;width:40mm;height:22mm;background:#fff;color:#000;font:7pt Figtree,sans-serif;display:grid;place-items:center;text-align:center">${L.isbn ? 'ISBN ' + esc(L.isbn) + '<br>código de barras' : 'espaço do<br>código de barras'}</div>`;
    const spine = `<div style="position:absolute;left:${bl + w}mm;top:0;width:${sp}mm;height:${TH}mm;display:flex;align-items:center;justify-content:center">${C.spineText && sp >= 6 ? `<div style="transform:rotate(90deg);white-space:nowrap;font-size:${Math.min(12, sp * 1.6)}pt;letter-spacing:.08em">${esc(b.title)} <span style="opacity:.75">· ${esc(b.author || '')}</span></div>` : ''}</div>`;
    const front = `<div style="position:absolute;left:${bl + w + sp}mm;top:0;width:${w + bl}mm;height:${TH}mm">${b.cover ? `<img src="${b.cover}" style="width:100%;height:100%;object-fit:cover;display:block" alt="">` : `<div style="position:absolute;inset:0;opacity:.25"><svg width="100%" height="100%">${azulejo(C.ink, 46, 'cvz')}</svg></div><div style="position:absolute;left:14mm;right:${bl + 14}mm;top:${bl + 40}mm;text-align:center"><div style="font-size:30pt;line-height:1.05">${esc(b.title)}</div>${b.subtitle ? `<div style="font-style:italic;margin-top:4mm;font-size:13pt">${esc(b.subtitle)}</div>` : ''}</div><div style="position:absolute;left:0;right:${bl}mm;bottom:${bl + 22}mm;text-align:center;letter-spacing:.2em;font-size:11pt">${esc((b.author || '').toUpperCase())}</div>`}</div>`;
    const guides = !forPrint && C.guides ? `<div class="covtrim" style="left:${bl}mm;top:${bl}mm;width:${TW - 2 * bl}mm;height:${h}mm"></div><div class="covtrim" style="left:${bl + w}mm;top:${bl}mm;width:${sp}mm;height:${h}mm"></div><div class="covguide" style="left:${bl + 5}mm;top:${bl + 5}mm;width:${w - 10}mm;height:${h - 10}mm"></div><div class="covguide" style="left:${bl + w + sp + 5}mm;top:${bl + 5}mm;width:${w - 10}mm;height:${h - 10}mm"></div>` : '';
    el.innerHTML = back + spine + front + guides;
    return { el, TW, TH, sp };
  },
  renderCapa() {
    if (this.mode !== 'capa' || !$('#spreads')) return;
    const { el, TW, TH, sp } = this.coverEl();
    const L = this.L(), { w, h } = this.dims(L);
    $('#summ').innerHTML = `<div><b>${(TW / 10).toFixed(1).replace('.', ',')} × ${(TH / 10).toFixed(1).replace('.', ',')} cm</b><span>capa aberta com sangria</span></div><div><b>${sp.toFixed(1).replace('.', ',')} mm</b><span>lombada · ${this.result?.count || '?'} páginas</span></div><div><b>${w / 10} × ${h / 10} cm</b><span>frente e quarta capa</span></div>`;
    const box = document.createElement('div'); box.className = 'covstage';
    const k = Math.min(1, ($('#stage').clientWidth - 50) / (TW * MM));
    const wrap = document.createElement('div'); wrap.style.cssText = `width:${TW * MM * k}px;height:${TH * MM * k}px`;
    el.style.transform = `scale(${k})`; el.style.transformOrigin = '0 0'; el.style.boxShadow = '0 10px 30px rgba(0,0,0,.4)';
    wrap.appendChild(el); box.appendChild(wrap);
    $('#spreads').replaceChildren(box);
  },
  printCapa() {
    this.printDialog(() => { const { el, TW, TH } = this.coverEl(true); const bl = +this.L().bleed; el.style.transform = 'none'; this.printPages([el], TW - 2 * bl, TH - 2 * bl, { bg: this.C().bg }); $$('#printroot .pp > div:nth-child(2)').forEach(d => { d.style.left = (parseFloat(d.style.left) - bl) + 'mm'; d.style.top = (parseFloat(d.style.top) - bl) + 'mm'; d.style.width = TW + 'mm'; d.style.height = TH + 'mm'; }); });
  },

  /* e-book */
  async ebookView(v) {
    const b = App.book, L = this.L(); const chs = await App.chapters();
    b.ebook = { lang: 'pt-BR', desc: '', ...(b.ebook || {}) };
    v.innerHTML = `<div class="pad" style="max-width:900px">
      <div class="lib-head" style="grid-template-columns:160px minmax(0,1fr)"><div class="cover">${coverHTML(b)}</div>
        <div><h1 style="margin-bottom:8px">${esc(b.title)}</h1><p class="muted" style="margin-top:0">O mesmo manuscrito sai como EPUB 3, com a capa embutida, folha de rosto, página de créditos, sumário navegável e os dados do livro preenchidos. É o arquivo que a Amazon KDP aceita sem conversor.</p>
        <div class="row"><span class="chip">${chs.length} capítulos</span><span class="chip">${nf(chs.reduce((s, c) => s + (c.words || 0), 0))} palavras</span><span class="chip">${b.cover ? 'capa pronta' : 'sem imagem de capa: vai a capa gerada'}</span></div></div></div>
      <div class="card" style="display:flex;flex-direction:column;gap:12px">
        <label class="f">Descrição (sinopse para a loja)<textarea id="edesc" style="min-height:120px">${esc(b.ebook.desc || L.cover?.back || '')}</textarea></label>
        <div class="grid3"><label class="f">ISBN do e-book (opcional)<input type="text" id="eisbn" value="${esc(b.ebook.isbn || '')}"></label><label class="f">Editora<input type="text" id="eed" value="${esc(L.editora)}"></label><label class="f">Ano<input type="text" id="eano" value="${esc(L.ano)}"></label></div>
        <label class="row small" style="gap:8px"><input type="checkbox" id="edrop" ${b.ebook.dropcap !== false ? 'checked' : ''}> Letra capitular no começo dos capítulos</label>
        <div class="row"><button class="btn pri" id="ego">${ic('dl')} Gerar EPUB</button><span class="small muted">Dedicatória e epígrafe vêm da aba Miolo.</span></div>
      </div></div>`;
    const save = debounce(async () => { b.ebook.desc = $('#edesc').value; b.ebook.isbn = $('#eisbn').value; L.editora = $('#eed').value; L.ano = $('#eano').value; b.ebook.dropcap = $('#edrop').checked; await App.saveBook(); }, 300);
    $$('#view input,#view textarea').forEach(el => el.addEventListener('input', save));
    $('#ego').onclick = async () => { save.flush(); Exporta.epub(); };
  }
};
