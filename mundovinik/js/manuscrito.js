/* Manuscrito: capítulos, editor, foco, repetições, versões, importação */
const CH_TYPES = { capitulo: 'Capítulo', prologo: 'Prólogo', epilogo: 'Epílogo', interludio: 'Interlúdio', parte: 'Parte (divisória)', extra: 'Extra (sem número)' };
const STOP = new Set(('a o as os um uma uns umas de do da dos das em no na nos nas por pelo pela pelos pelas para pra com sem sob sobre entre até após ante desde ' +
  'e ou mas nem que se porque como quando onde quanto qual quais quem cujo cuja ' +
  'eu tu ele ela nós vós eles elas me te se lhe nos vos lhes mim ti si comigo contigo consigo meu minha meus minhas teu tua seu sua seus suas nosso nossa dele dela deles delas ' +
  'este esta estes estas esse essa esses essas aquele aquela aqueles aquelas isto isso aquilo aqui ali lá cá aí ' +
  'não sim já ainda mais menos muito pouco tão tanto bem mal só também então assim depois antes agora sempre nunca ' +
  'ser foi era são está estava estar estou estão tem tinha ter há havia houve fez faz fazer disse diz vai ia vou será seria ' +
  'ao aos à às num numa dum duma pelo nele nela neles nelas desse dessa deste desta daquele daquela disso disto daquilo nisso nisto ' +
  'você vocês senhor senhora todo toda todos todas outro outra outros outras mesmo mesma cada algum alguma nenhum nenhuma tudo nada ' +
  'pois porém contudo enquanto embora caso logo qualquer').split(/\s+/));
const MULETAS = ['então', 'de repente', 'simplesmente', 'realmente', 'apenas', 'somente', 'praticamente', 'basicamente', 'literalmente', 'certamente', 'obviamente', 'parecia', 'começou a', 'conseguiu', 'um pouco', 'meio que', 'de fato', 'na verdade', 'nesse momento', 'naquele momento'];

const Importa = {
  async file(f) {
    const name = f.name.toLowerCase();
    let paras = [];
    if (name.endsWith('.docx')) {
      const r = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() }, { styleMap: ["p[style-name='Title'] => h1:fresh", "p[style-name='Título'] => h1:fresh"] });
      const d = document.createElement('div'); d.innerHTML = r.value;
      for (const el of d.children) {
        const tag = el.tagName;
        if (/^H[1-3]$/.test(tag)) paras.push({ h: true, text: el.textContent.trim() });
        else if (tag === 'P' || tag === 'BLOCKQUOTE') paras.push({ html: this.clean(el.innerHTML), text: el.textContent.trim() });
        else if (tag === 'UL' || tag === 'OL') [...el.children].forEach(li => paras.push({ html: this.clean(li.innerHTML), text: li.textContent.trim() }));
        else if (tag === 'TABLE') paras.push({ html: esc(el.textContent.trim()), text: el.textContent.trim() });
      }
    } else {
      const t = (await f.text()).replace(/\r/g, '');
      const blocks = /\n\s*\n/.test(t) ? t.split(/\n\s*\n/) : t.split('\n');
      paras = blocks.map(b => b.replace(/\n/g, ' ').trim()).filter(Boolean).map(b => {
        const md = b.match(/^#{1,3}\s+(.*)$/);
        if (md) return { h: true, text: md[1] };
        let h = esc(b).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>');
        return { html: h, text: b };
      });
    }
    return this.split(paras);
  },
  clean(html) {
    const d = document.createElement('div'); d.innerHTML = html;
    d.querySelectorAll('*').forEach(el => {
      const t = el.tagName;
      if (t === 'EM' || t === 'I') { el.replaceWith(Object.assign(document.createElement('em'), { innerHTML: el.innerHTML })); }
      else if (t === 'STRONG' || t === 'B') { el.replaceWith(Object.assign(document.createElement('strong'), { innerHTML: el.innerHTML })); }
      else if (t === 'BR') { }
      else if (t === 'SUP' && el.querySelector('a')) el.remove();
      else el.replaceWith(...el.childNodes);
    });
    return d.innerHTML.trim();
  },
  headingRe: /^(cap[ií]tulo|pr[óo]logo|ep[íi]logo|interl[úu]dio|parte)\b[\s\S]{0,80}$|^[IVXLC]{1,7}\.?$|^\d{1,3}\.?$/i,
  split(paras) {
    const hasH = paras.some(p => p.h);
    const out = []; let cur = null;
    const start = (title) => {
      const low = title.toLowerCase();
      const type = /^pr[óo]logo/.test(low) ? 'prologo' : /^ep[íi]logo/.test(low) ? 'epilogo' : /^interl/.test(low) ? 'interludio' : /^parte\b/.test(low) ? 'parte' : 'capitulo';
      let t = title.replace(/^cap[ií]tulo\s+[\divxlc]+\s*[-–—:.]?\s*/i, '').trim();
      cur = { title: t || title, type, paras: [] }; out.push(cur);
    };
    for (const p of paras) {
      const isHead = p.h || (!hasH && p.text.length < 90 && this.headingRe.test(p.text));
      if (isHead) {
        if (cur && !cur.paras.length && /^cap[ií]tulo\s+[\divxlc]+\.?$/i.test(cur.title + '') ) { cur.title = p.text; continue; }
        start(p.text); continue;
      }
      if (!p.text) continue;
      if (!cur) start(out.length ? 'Sem título' : 'Capítulo 1');
      const cena = /^(\*\s*){3}$|^#$|^(~|-){3,}$|^\*{3}$/.test(p.text.replace(/\s/g, '').replace(/(.)/g, '$1 ').trim()) || /^[*#~⁂•\s]{1,9}$/.test(p.text);
      cur.paras.push(cena ? '<p class="cena">* * *</p>' : `<p>${p.html}</p>`);
    }
    if (!out.length) out.push({ title: 'Capítulo 1', type: 'capitulo', paras: ['<p><br></p>'] });
    return out.map(c => { const html = c.paras.join('') || '<p><br></p>'; return { title: c.title, type: c.type, html, words: countWords(textOf(html)) }; });
  }
};

const Manuscrito = App.views.manuscrito = {
  chs: [], cur: null, asideTab: 'norte', showAside: innerWidth > 1100, lastSnap: 0, sprint: null,
  async render(v, top) {
    if (innerWidth <= 1100) this.showAside = false;
    this.chs = await App.chapters();
    if (!this.chs.length) { await this.addChapter(); }
    const want = App.book.lastChapter && this.chs.find(c => c.id === App.book.lastChapter);
    this.cur = want || this.chs[0];
    top.innerHTML = `<button class="iconbtn mobonly" id="chtog" title="Capítulos">${ic('list')}</button><h2>${esc(App.book.title)}</h2>
      <button class="btn sm" id="find">${ic('search')} Buscar</button>
      <button class="btn sm" id="imp">${ic('ul')} Importar</button>
      <button class="btn sm" id="exp">${ic('dl')} Exportar</button>
      <button class="btn sm" id="furos">${ic('search')} Furos</button>
      <button class="btn sm" id="esp" title="Abrir outra história ao lado para ler enquanto escreve">${ic('book')} Espelho</button>
      <button class="btn pri sm" id="foc">${ic('focus')} Modo foco</button>`;
    v.style.overflow = 'hidden';
    v.innerHTML = `<div class="ms ${this.showAside ? '' : 'noaside'} nochaps" id="ms">
      <div class="chaps"><div class="hd"><b style="flex:1">Capítulos</b><button class="iconbtn" id="addch" title="Novo capítulo">${ic('plus')}</button><button class="iconbtn mobonly" id="chclose">${ic('x')}</button></div><ol id="chlist"></ol>
        <div class="small muted" style="padding:10px 14px;border-top:1px solid var(--line)" id="booktotal"></div></div>
      <div class="desk" id="desk">
        <div class="tools">
          <button class="iconbtn hidefocus" data-cmd="undo" title="Desfazer">${ic('undo')}</button>
          <button class="iconbtn hidefocus" data-cmd="redo" title="Refazer">${ic('redo')}</button><span class="sep hidefocus"></span>
          <button class="iconbtn" data-cmd="bold" title="Negrito (Ctrl+B)">${ic('bold')}</button>
          <button class="iconbtn" data-cmd="italic" title="Itálico (Ctrl+I)">${ic('ital')}</button>
          <button class="iconbtn" id="cena" title="Quebra de cena">${ic('star')}</button>
          <button class="iconbtn hidefocus" id="noind" title="Parágrafo sem recuo (citação, carta)">${ic('quote')}</button>
          <button class="iconbtn hidefocus" id="fnote" title="Nota de rodapé">${ic('fn')}</button>
          <button class="iconbtn" id="trocar" title="Trocar palavra (selecione a palavra)">${ic('book')}</button><span class="sep hidefocus"></span>
          <button class="iconbtn" id="skin" title="Cenário do editor">${ic('img')}</button>
          <button class="btn sm ghost" id="fsm" title="Letra menor">A−</button><button class="btn sm ghost" id="fbg" title="Letra maior">A+</button>
          <span class="focusbar"><span class="sep"></span><span class="timer" id="timer"></span><button class="btn sm" id="sprint">${ic('clock')} Sprint</button><button class="btn sm" id="exitf">Sair do foco</button></span>
          <span class="count" id="count"></span>
          <button class="iconbtn hidefocus" id="asidetog" title="Painel lateral">${ic('panel')}</button>
        </div>
        <div class="duo"><div class="refpane" id="refpane" hidden></div><div class="sheetwrap">
        <div class="sheet"><input class="ctitle" id="ctitle" aria-label="Título do capítulo"><div class="editor" id="ed" contenteditable="true" spellcheck="true" lang="pt-BR"></div></div>
        </div></div>
      </div>
      <aside class="aside" id="aside"></aside>
    </div>`;
    const fs = App.settings.edFont || 19; $('#ed').style.setProperty('--efs', fs + 'px');
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) { }
    this.bind();
    this.renderList();
    this.load(this.cur);
    $('#esp').onclick = () => Espelho.alternar();
    Espelho.montar();
  },
  bind() {
    const ed = $('#ed');
    this.save = debounce(() => this.saveNow(), 900);
    ed.addEventListener('input', e => { this.lastInput = Date.now(); this.autoReplace(e); this.clearMarks(true); this.save(); this.liveCount(); });
    ed.addEventListener('paste', e => this.paste(e));
    ed.addEventListener('keydown', e => {
      if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '— '); }
    });
    ed.addEventListener('click', e => {
      const fn = e.target.closest('.fnote');
      if (fn) this.editNote(fn);
      const mk = e.target.closest('mark.rep');
      if (mk) Banco.pop(mk, mk.textContent, t => { mk.replaceWith(document.createTextNode(t)); $('#ed').normalize(); this.save(); this.liveCount(); });
    });
    $('#ctitle').oninput = () => { this.cur.title = $('#ctitle').value; this.save(); this.renderList(); };
    $$('[data-cmd]').forEach(b => b.onmousedown = e => { e.preventDefault(); document.execCommand(b.dataset.cmd); this.save(); });
    $('#cena').onmousedown = e => { e.preventDefault(); this.insertBlock('<p class="cena">* * *</p><p><br></p>'); };
    $('#noind').onmousedown = e => { e.preventDefault(); const p = this.curPara(); if (p) { p.classList.toggle('noind'); this.save(); } };
    $('#fnote').onmousedown = async e => { e.preventDefault(); const r = this.saveRange(); const t = await App.ask('Nota de rodapé', '', 'Texto da nota'); if (!t) return; this.restoreRange(r); document.execCommand('insertHTML', false, `<sup class="fnote" contenteditable="false" data-note="${esc(t)}">*</sup>`); this.renumberNotes(); this.save(); };
    const setF = d => { const fs = Math.max(14, Math.min(28, (App.settings.edFont || 19) + d)); App.settings.edFont = fs; $('#ed').style.setProperty('--efs', fs + 'px'); $('.reftxt')?.style.setProperty('--efs', fs + 'px'); App.saveSettings(); };
    $('#fsm').onclick = () => setF(-1); $('#fbg').onclick = () => setF(1);
    $('#addch').onclick = async () => { await this.saveNow(); const c = await this.addChapter(this.cur); this.renderList(); this.load(c); $('#ctitle').select(); };
    $('#asidetog').onclick = () => { this.showAside = !this.showAside; $('#ms').classList.toggle('noaside', !this.showAside); if (this.showAside) this.renderAside(); };
    $('#chtog').onclick = () => $('#ms').classList.remove('nochaps');
    $('#chclose').onclick = () => $('#ms').classList.add('nochaps');
    $('#foc').onclick = () => this.toggleFocus(true);
    $('#exitf').onclick = () => this.toggleFocus(false);
    $('#sprint').onclick = () => this.sprintMenu();
    $('#find').onclick = () => this.findReplace();
    $('#imp').onclick = () => this.importMore();
    $('#exp').onclick = () => Exporta.menu();
    $('#furos').onclick = () => Claude.furos();
    $('#trocar').onmousedown = e => {
      e.preventDefault();
      const s = getSelection(); if (!s.rangeCount || !$('#ed').contains(s.anchorNode)) return App.toast('Selecione uma palavra no texto');
      let r = s.getRangeAt(0);
      if (r.collapsed) { s.modify?.('move', 'backward', 'word'); s.modify?.('extend', 'forward', 'word'); r = s.getRangeAt(0); }
      const w = String(s).trim().replace(/[.,;:!?…"“”'’()\-—]+$/g, ''); if (!w || w.split(/\s+/).length > 3) return App.toast('Selecione uma palavra');
      const rr = r.cloneRange(); const rect = rr.getBoundingClientRect();
      const alvo = { getBoundingClientRect: () => rect };
      Banco.pop(alvo, w, t => { const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rr); document.execCommand('insertText', false, t + (String(rr).endsWith(' ') ? ' ' : '')); this.save(); });
    };
    $('#skin').onclick = e => this.skinMenu(e.currentTarget);
  },
  async addChapter(after) {
    const n = this.chs.filter(c => c.type === 'capitulo').length + 1;
    const pos = after ? after.order + 0.5 : this.chs.length;
    const c = { id: DB.uid(), bookId: App.book.id, order: pos, type: 'capitulo', title: 'Capítulo ' + n, html: '<p><br></p>', words: 0, status: 'rascunho' };
    this.chs.push(c); this.chs.sort((a, b) => a.order - b.order);
    await this.reorder();
    return c;
  },
  async reorder() { for (let i = 0; i < this.chs.length; i++) { if (this.chs[i].order !== i || !this.chs[i].updatedAt) { this.chs[i].order = i; await DB.put('chapters', this.chs[i]); } } },
  chapterLabel(c) {
    if (c.type !== 'capitulo') return CH_TYPES[c.type].split(' ')[0];
    return this.chs.filter(x => x.type === 'capitulo').indexOf(c) + 1;
  },
  renderList() {
    if (!$('#chlist')) return;
    const total = this.chs.reduce((s, c) => s + (c.words || 0), 0);
    $('#chlist').innerHTML = this.chs.map(c => `<li draggable="true" data-id="${c.id}" class="${c === this.cur ? 'on' : ''}"><span class="n">${c.type === 'capitulo' ? this.chapterLabel(c) : '·'}</span><span class="tt">${esc(c.title || 'Sem título')}</span><span class="w">${c.words >= 1000 ? (c.words / 1000).toFixed(1).replace('.', ',') + 'k' : c.words || 0}</span></li>`).join('');
    $('#booktotal').textContent = nf(total) + ' palavras no livro';
    let drag = null;
    $$('#chlist li').forEach(li => {
      li.onclick = async () => { const c = this.chs.find(x => x.id === li.dataset.id); if (c === this.cur) return; await this.saveNow(); this.load(c); if (innerWidth <= 780) $('#ms').classList.add('nochaps'); };
      li.ondragstart = () => drag = li.dataset.id;
      li.ondragover = e => { e.preventDefault(); li.classList.add('dragover'); };
      li.ondragleave = () => li.classList.remove('dragover');
      li.ondrop = async e => {
        e.preventDefault(); li.classList.remove('dragover');
        if (!drag || drag === li.dataset.id) return;
        const a = this.chs.findIndex(c => c.id === drag); const [m] = this.chs.splice(a, 1);
        const b = this.chs.findIndex(c => c.id === li.dataset.id); this.chs.splice(b, 0, m);
        this.chs.forEach((c, i) => c.order = i); for (const c of this.chs) await DB.put('chapters', c);
        this.renderList();
      };
    });
  },
  load(c) {
    if (this.cur !== c) this.rev = null;
    this.cur = c; App.book.lastChapter = c.id; DB.put('books', App.book);
    $('#ctitle').value = c.title || ''; this.savedTitle = c.title;
    $('#ed').innerHTML = c.html || '<p><br></p>';
    this.baseWords = c.words || 0;
    this.lastSnap = Date.now();
    this.renderList(); this.liveCount(); this.renderAside();
    $('#desk').scrollTop = 0;
  },
  liveCount() {
    if (!$('#count') || !$('#ed')) return;
    const w = countWords($('#ed').innerText);
    const total = this.chs.reduce((s, c) => s + (c === this.cur ? w : c.words || 0), 0);
    const sp = this.sprint ? ` · sprint +${Math.max(0, total - this.sprint.start)}` : '';
    $('#count').textContent = `${nf(w)} palavras · livro ${nf(total)}${sp}`;
  },
  cleanHTML() {
    const d = $('#ed').cloneNode(true);
    d.querySelectorAll('mark').forEach(m => m.replaceWith(...m.childNodes));
    d.querySelectorAll('div').forEach(x => { const p = document.createElement('p'); p.innerHTML = x.innerHTML; if (x.className) p.className = x.className; x.replaceWith(p); });
    d.querySelectorAll('span:not(.fnote)').forEach(s => s.replaceWith(...s.childNodes));
    d.querySelectorAll('[style]').forEach(s => s.removeAttribute('style'));
    d.querySelectorAll('font').forEach(s => s.replaceWith(...s.childNodes));
    d.querySelectorAll('b').forEach(s => s.replaceWith(Object.assign(document.createElement('strong'), { innerHTML: s.innerHTML })));
    d.querySelectorAll('i').forEach(s => s.replaceWith(Object.assign(document.createElement('em'), { innerHTML: s.innerHTML })));
    [...d.childNodes].forEach(n => { if (n.nodeType === 3 && n.textContent.trim()) { const p = document.createElement('p'); p.textContent = n.textContent; n.replaceWith(p); } });
    return d.innerHTML;
  },
  async saveNow() {
    if (!this.cur || !$('#ed')) return;
    const html = this.cleanHTML();
    const c = this.cur;
    const words = countWords(textOf(html));
    if (html === c.html && c.title === this.savedTitle && words === c.words) { return; }
    const delta = words - (c.words || 0);
    c.html = html; c.words = words; this.savedTitle = c.title;
    const save = { ...c }; delete save._t;
    await DB.put('chapters', save);
    if (delta > 0) await App.logWords(delta);
    if (Date.now() - this.lastSnap > 10 * 60 * 1000) await this.snapshot();
    App.mark(); this.renderList();
  },
  async snapshot(label) {
    const c = this.cur; if (!c || !c.html) return;
    this.lastSnap = Date.now();
    const prev = (await DB.byBook('snapshots', App.book.id)).filter(s => s.chapterId === c.id).sort((a, b) => b.at - a.at)[0];
    if (prev && prev.html === c.html && label !== 'manual') return;
    await DB.put('snapshots', { id: DB.uid(), bookId: App.book.id, chapterId: c.id, html: c.html, words: c.words, title: c.title, at: Date.now(), label: label || '' });
    const all = (await DB.byBook('snapshots', App.book.id)).filter(s => s.chapterId === c.id).sort((a, b) => b.at - a.at);
    for (const s of all.slice(40)) await DB.del('snapshots', s.id);
  },
  async leave() { await this.saveNow(); if (this.cur) await this.snapshot('ao sair'); this.toggleFocus(false); clearInterval(this.sprint?.t); this.sprint = null; $('#view').style.overflow = ''; },
  autoReplace(e) {
    if (e.inputType !== 'insertText' || !e.data) return;
    const sel = getSelection(); if (!sel.rangeCount) return;
    const r = sel.getRangeAt(0); const node = r.startContainer; if (node.nodeType !== 3) return;
    const off = r.startOffset; const t = node.textContent;
    const rep = (from, len, str) => { const rr = document.createRange(); rr.setStart(node, from); rr.setEnd(node, from + len); sel.removeAllRanges(); sel.addRange(rr); document.execCommand('insertText', false, str); };
    if (e.data === '-' && t[off - 2] === '-') return rep(off - 2, 2, '—');
    if (e.data === ' ' && off === 2 && /^-[\s\u00a0]$/.test(t.slice(0, 2))) { const p = node.parentElement.closest('p'); if (p && p.firstChild === node) return rep(0, 2, '— '); }
    if (e.data === '"') { const prev = t[off - 2]; return rep(off - 1, 1, !prev || /[\s(\[—]/.test(prev) ? '“' : '”'); }
    if (e.data === "'") { const prev = t[off - 2]; return rep(off - 1, 1, !prev || /[\s(\[—]/.test(prev) ? '‘' : '’'); }
    if (e.data === '.' && t.slice(off - 3, off) === '...') return rep(off - 3, 3, '…');
  },
  paste(e) {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const txt = e.clipboardData.getData('text/plain');
    let out;
    if (html) {
      const d = document.createElement('div'); d.innerHTML = html;
      const blocks = [...d.querySelectorAll('p,h1,h2,h3,li,div')].filter(b => !b.querySelector('p,div,li'));
      out = blocks.length ? blocks.map(b => `<p>${Importa.clean(b.innerHTML)}</p>`).join('') : null;
    }
    if (!out) {
      const parts = txt.replace(/\r/g, '').split(/\n+/).filter(s => s.trim());
      if (parts.length <= 1) { document.execCommand('insertText', false, txt); return; }
      out = parts.map(s => `<p>${esc(s.trim())}</p>`).join('');
    }
    document.execCommand('insertHTML', false, out);
  },
  curPara() { const s = getSelection(); if (!s.rangeCount) return null; let n = s.anchorNode; if (n?.nodeType === 3) n = n.parentElement; return n?.closest?.('#ed p'); },
  insertBlock(html) {
    const p = this.curPara();
    if (p) { p.insertAdjacentHTML('afterend', html); const next = p.nextElementSibling?.nextElementSibling; if (next) { const r = document.createRange(); r.setStart(next, 0); r.collapse(true); getSelection().removeAllRanges(); getSelection().addRange(r); } }
    else $('#ed').insertAdjacentHTML('beforeend', html);
    this.save();
  },
  saveRange() { const s = getSelection(); return s.rangeCount ? s.getRangeAt(0).cloneRange() : null; },
  restoreRange(r) { if (!r) return; $('#ed').focus(); const s = getSelection(); s.removeAllRanges(); s.addRange(r); },
  renumberNotes() { $$('#ed .fnote').forEach((n, i) => n.textContent = i + 1); },
  editNote(fn) {
    const m = App.modal(`<h3>Nota de rodapé ${esc(fn.textContent)}</h3><textarea id="nt">${esc(fn.dataset.note)}</textarea><div class="acts"><button class="btn danger" id="nrm" style="margin-right:auto">Apagar nota</button><button class="btn" data-close>Cancelar</button><button class="btn pri" id="nok">Salvar</button></div>`);
    $('#nok', m).onclick = () => { fn.dataset.note = $('#nt', m).value; m.close(); this.save(); };
    $('#nrm', m).onclick = () => { fn.remove(); this.renumberNotes(); m.close(); this.save(); };
  },
  skinMenu(btn) {
    $('.pop')?.remove();
    const skins = [['papel', 'Papel', '#efede8', '#fffdf8'], ['sepia', 'Sépia', '#e6dcc4', '#f6eedb'], ['noite', 'Noite', '#0c111d', '#151c2e'], ['mar', 'Maré', '#1b6f86', '#fffdf8'], ['cosmos', 'Cosmos', '#090b1a', '#1a1d3a']];
    const pop = document.createElement('div'); pop.className = 'pop'; pop.style.width = '260px';
    const r = btn.getBoundingClientRect(), dr = $('#desk').getBoundingClientRect();
    pop.style.left = Math.max(8, r.left - dr.left - 100) + 'px'; pop.style.top = (r.bottom - dr.top + $('#desk').scrollTop + 6) + 'px';
    pop.innerHTML = `<b class="small">Cenário do editor</b><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:10px">${skins.map(([k, l, a, b]) => `<button data-sk="${k}" title="${l}" style="border:2px solid ${(App.settings.skin || 'papel') === k ? 'var(--cobalt)' : 'var(--line)'};border-radius:10px;padding:0;height:52px;background:linear-gradient(135deg,${a} 50%,${b} 50%)"></button>`).join('')}</div><div class="row small muted" style="justify-content:space-between;margin-top:6px">${skins.map(s => `<span>${s[1]}</span>`).join('')}</div>`;
    $('#desk').style.position = 'relative'; $('#desk').appendChild(pop);
    $$('[data-sk]', pop).forEach(b => b.onclick = () => { App.settings.skin = b.dataset.sk; document.body.dataset.skin = b.dataset.sk; App.saveSettings(); pop.remove(); });
    setTimeout(() => addEventListener('mousedown', function f(e) { if (!pop.contains(e.target)) { pop.remove(); removeEventListener('mousedown', f); } }), 10);
  },
  toggleFocus(on) {
    document.body.classList.toggle('focus', on);
    if (on) { try { document.documentElement.requestFullscreen?.().catch(() => { }); } catch (e) { } $('#ed')?.focus(); }
    else if (document.fullscreenElement) document.exitFullscreen?.().catch(() => { });
  },
  sprintMenu() {
    if (this.sprint) { clearInterval(this.sprint.t); const gain = this.totalNow() - this.sprint.start; this.sprint = null; $('#timer').textContent = ''; App.toast(`Sprint encerrado: +${nf(Math.max(0, gain))} palavras`); this.liveCount(); return; }
    const m = App.modal(`<h3>Sprint de escrita</h3><p class="muted">Escolha o tempo. O contador mostra as palavras que você escreveu durante o sprint.</p><div class="row">${[10, 15, 25, 45, 60].map(n => `<button class="btn" data-m="${n}">${n} min</button>`).join('')}</div><div class="acts"><button class="btn" data-close>Cancelar</button></div>`);
    $$('[data-m]', m).forEach(b => b.onclick = () => {
      m.close(); const end = Date.now() + b.dataset.m * 60000;
      this.sprint = { start: this.totalNow(), end };
      const tick = () => {
        const left = Math.max(0, end - Date.now()); const mm = Math.floor(left / 60000), ss = Math.floor(left % 60000 / 1000);
        $('#timer') && ($('#timer').textContent = `${mm}:${String(ss).padStart(2, '0')}`);
        if (!left) { const gain = this.totalNow() - this.sprint.start; clearInterval(this.sprint.t); this.sprint = null; $('#timer').textContent = ''; App.toast(`Tempo! Você escreveu ${nf(Math.max(0, gain))} palavras.`, 6000); }
      };
      this.sprint.t = setInterval(tick, 1000); tick(); $('#ed').focus();
    });
  },
  totalNow() { const w = countWords($('#ed')?.innerText || ''); return this.chs.reduce((s, c) => s + (c === this.cur ? w : c.words || 0), 0); },

  /* painel lateral */
  async renderAside() {
    if (!this.showAside || !$('#aside')) return;
    const tabs = [['norte', 'Norte'], ['notas', 'Capítulo'], ['fichas', 'Fichas'], ['rep', 'Palavras'], ['rev', 'Revisão'], ['versoes', 'Versões']];
    $('#aside').innerHTML = `<div class="tabs">${tabs.map(([k, l]) => `<button data-t="${k}" class="${this.asideTab === k ? 'on' : ''}">${l}</button>`).join('')}<button class="iconbtn mobonly" id="asx">${ic('x')}</button></div><div class="body" id="abody"></div>`;
    $$('#aside [data-t]').forEach(b => b.onclick = () => { this.asideTab = b.dataset.t; this.clearMarks(); this.renderAside(); });
    $('#asx') && ($('#asx').onclick = () => $('#asidetog').click());
    const body = $('#abody');
    if (this.asideTab === 'notas') this.asideNotas(body);
    if (this.asideTab === 'fichas') await this.asideFichas(body);
    if (this.asideTab === 'rep') this.asideRep(body);
    if (this.asideTab === 'versoes') await this.asideVersoes(body);
    if (this.asideTab === 'rev') Claude.abaRevisao(body);
    if (this.asideTab === 'norte') { await NorteUI.painel(body); const t = document.createElement('div'); body.prepend(t); TRILHA.cartao(t, true); }
  },
  asideNotas(body) {
    const c = this.cur;
    body.innerHTML = `<div class="grid2"><label class="f">Tipo<select id="ctype">${Object.entries(CH_TYPES).map(([k, l]) => `<option value="${k}" ${c.type === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="f">Estado<select id="cstat">${['rascunho', 'pronto', 'revisado'].map(s => `<option ${c.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label></div>
      <label class="f">Sinopse do capítulo<textarea id="csyn" placeholder="O que acontece aqui, em duas linhas">${esc(c.synopsis || '')}</textarea></label>
      <div class="grid2"><label class="f">Ponto de vista<input type="text" id="cpov" value="${esc(c.pov || '')}"></label><label class="f">Cenário<input type="text" id="cset" value="${esc(c.setting || '')}"></label></div>
      <div class="ncard"><b class="small">Bússola da cena</b>
        <label class="f" style="margin-top:6px">O que o personagem quer nesta cena<input type="text" id="cquer" value="${esc(c.cenaQuer || '')}" placeholder="um objetivo que dá para ver"></label>
        <label class="f">O que muda até o fim<input type="text" id="cvira" value="${esc(c.cenaVira || '')}" placeholder="de confiança para suspeita, de vivo para morto…"></label>
        <span class="fonte">Cena: objetivo, conflito, desastre (Swain). Toda cena vira um valor (McKee, Story: "Design de cena").</span></div>
      <label class="f">Notas do autor<textarea id="cnot" style="min-height:120px">${esc(c.notes || '')}</textarea></label>
      <div class="row"><button class="btn sm" id="cup">${ic('up')} Subir</button><button class="btn sm" id="cdn">${ic('down')} Descer</button><button class="btn sm" id="cdup">Duplicar</button><button class="btn sm danger" id="cdel">${ic('trash')} Excluir</button></div>
      <p class="small muted">Prólogo, epílogo, interlúdio e extras não entram na numeração dos capítulos. Atalhos: “--” vira travessão, “- ” no começo do parágrafo vira travessão de fala, Tab insere travessão, “...” vira reticências.</p>`;
    const upd = debounce(async () => { c.type = $('#ctype').value; c.status = $('#cstat').value; c.synopsis = $('#csyn').value; c.pov = $('#cpov').value; c.setting = $('#cset').value; c.cenaQuer = $('#cquer').value; c.cenaVira = $('#cvira').value; c.notes = $('#cnot').value; const s = { ...c }; delete s._t; await DB.put('chapters', s); this.renderList(); App.mark(); }, 500);
    $$('#abody select,#abody input,#abody textarea').forEach(el => el.oninput = el.onchange = upd);
    const move = async d => { const i = this.chs.indexOf(c), j = i + d; if (j < 0 || j >= this.chs.length) return; [this.chs[i], this.chs[j]] = [this.chs[j], this.chs[i]]; this.chs.forEach((x, k) => x.order = k); for (const x of this.chs) await DB.put('chapters', x); this.renderList(); };
    $('#cup').onclick = () => move(-1); $('#cdn').onclick = () => move(1);
    $('#cdup').onclick = async () => { await this.saveNow(); const n = { ...c, id: DB.uid(), title: c.title + ' (cópia)', order: c.order + .5 }; delete n._t; this.chs.push(n); this.chs.sort((a, b) => a.order - b.order); await this.reorder(); this.renderList(); this.load(n); };
    $('#cdel').onclick = async () => {
      if (this.chs.length === 1) return App.toast('O livro precisa de pelo menos um capítulo');
      if (!await App.confirm(`Excluir "${c.title}"? Não dá para desfazer; faça um backup antes se tiver dúvida.`, 'Excluir capítulo')) return;
      await DB.del('chapters', c.id); const i = this.chs.indexOf(c); this.chs.splice(i, 1); await this.reorder(); this.load(this.chs[Math.max(0, i - 1)]);
    };
  },
  async asideFichas(body) {
    const fichas = (await DB.byBook('fichas', App.book.id)).sort((a, b) => a.name.localeCompare(b.name));
    const text = $('#ed').innerText.toLowerCase();
    const here = fichas.filter(f => Universo.namesOf(f).some(n => n && Universo.mentions(text, n)));
    const mini = f => `<div class="mini" data-f="${f.id}">${f.img ? `<img src="${f.img}" alt="">` : `<span class="ph">${esc((f.name || '?')[0])}</span>`}<div>${esc(f.name)}<small>${esc(f.role || UNIV_KINDS[f.kind] || '')}</small></div></div>`;
    body.innerHTML = `<input type="search" id="fq" placeholder="Buscar ficha">
      <div><b class="small">Neste capítulo</b><div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">${here.map(mini).join('') || '<span class="small muted">Nenhuma ficha citada ainda.</span>'}</div></div>
      ${this.contHTML(here)}
      <div><b class="small">Todas</b><div id="fall" style="display:flex;flex-direction:column;gap:6px;margin-top:6px">${fichas.map(mini).join('') || '<span class="small muted">Crie fichas na aba Universo.</span>'}</div></div>
      <button class="btn sm" id="fnew">${ic('plus')} Nova ficha</button>`;
    $('#fq').oninput = e => { const q = e.target.value.toLowerCase(); $$('#fall .mini').forEach(m => m.style.display = m.textContent.toLowerCase().includes(q) ? '' : 'none'); };
    $$('#abody [data-f]').forEach(m => m.onclick = () => Universo.quick(fichas.find(f => f.id === m.dataset.f), () => this.renderAside()));
    $('#fnew').onclick = () => Universo.quick(null, () => this.renderAside());
  },
  contHTML(fichas) {
    const out = [];
    fichas.forEach(f => Universo.continuity(f, [this.cur]).forEach(w => out.push(`<div class="warnbox"><b>${esc(f.name)}</b>: ${esc(w.msg)}<br><i class="small">“${esc(w.snip)}”</i></div>`)));
    return out.length ? `<div style="display:flex;flex-direction:column;gap:6px"><b class="small">Continuidade</b>${out.join('')}</div>` : '';
  },
  analyze(text) {
    const raw = [...text.matchAll(/[\p{L}]+(?:-[\p{L}]+)*/gu)].map(m => m[0]);
    const toks = raw.map(w => w.toLowerCase());
    const lowerSeen = new Set(); raw.forEach(w => { if (w[0] === w[0].toLowerCase()) lowerSeen.add(w.toLowerCase()); });
    const pos = {}; toks.forEach((w, i) => { if (w.length < 4 || STOP.has(w) || !lowerSeen.has(w)) return; (pos[w] = pos[w] || []).push(i); });
    const near = [];
    for (const [w, ps] of Object.entries(pos)) {
      let n = 0; for (let i = 1; i < ps.length; i++) if (ps[i] - ps[i - 1] <= 60) n++;
      if (n) near.push({ w, n, total: ps.length });
    }
    near.sort((a, b) => b.n - a.n || b.total - a.total);
    const freq = Object.entries(pos).map(([w, ps]) => ({ w, total: ps.length })).sort((a, b) => b.total - a.total).slice(0, 15);
    const low = text.toLowerCase();
    const mul = MULETAS.map(w => ({ w, total: (low.match(new RegExp('(?<![\\p{L}])' + w + '(?![\\p{L}])', 'gu')) || []).length })).filter(x => x.total);
    const mente = toks.filter(w => w.length > 6 && w.endsWith('mente') && !['mente', 'semente', 'demente', 'clemente'].includes(w));
    const vc = {}; toks.forEach(w => { if (OFICIO.VAGAS[w]) vc[w] = (vc[w] || 0) + 1; });
    const vagas = Object.entries(vc).map(([w, total]) => ({ w, total })).sort((a, b) => b.total - a.total);
    return { near: near.slice(0, 25), freq, mul, mente, vagas, total: toks.length };
  },
  synOf(w) { return SINONIMOS[w.toLowerCase()] || null; },
  synPop(mk) {
    $('.pop')?.remove();
    const w = mk.textContent, list = this.synOf(w);
    const total = $$('#ed mark.rep').length;
    const r = mk.getBoundingClientRect(), dr = $('#desk').getBoundingClientRect();
    const pop = document.createElement('div'); pop.className = 'pop';
    pop.style.left = Math.max(8, Math.min(r.left - dr.left, dr.width - 310)) + 'px';
    pop.style.top = (r.bottom - dr.top + $('#desk').scrollTop + 6) + 'px';
    pop.innerHTML = `<div class="row" style="justify-content:space-between"><b style="font-family:var(--disp);font-size:18px">${esc(w)}</b><button class="iconbtn" data-x>${ic('x')}</button></div>
      <p class="small muted" style="margin:4px 0 10px">Aparece ${total} ${total === 1 ? 'vez' : 'vezes'} neste capítulo.${list ? ' Trocar esta por:' : ''}</p>
      ${list ? `<div class="row" style="gap:6px">${list.map(x => `<button class="chip" data-s="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : '<p class="small muted" style="margin:0">Não tenho sinônimos guardados para esta palavra. Vale reescrever a frase ou cortar.</p>'}
      <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-n>Próxima ocorrência</button></div>`;
    $('#desk').style.position = 'relative'; $('#desk').appendChild(pop);
    $('[data-x]', pop).onclick = () => pop.remove();
    $('[data-n]', pop).onclick = () => { const ms = $$('#ed mark.rep'); const nx = ms[(ms.indexOf(mk) + 1) % ms.length]; nx.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => this.synPop(nx), 300); };
    $$('[data-s]', pop).forEach(b => b.onclick = () => {
      let t = b.dataset.s; if (w[0] === w[0].toUpperCase()) t = t[0].toUpperCase() + t.slice(1);
      mk.replaceWith(document.createTextNode(t)); $('#ed').normalize(); pop.remove(); this.save(); this.liveCount();
    });
  },
  asideRep(body) {
    const a = this.analyze($('#ed').innerText);
    const list = (arr, key) => arr.map(x => `<button data-w="${esc(x.w)}"><span><b>${esc(x.w)}</b>${this.synOf(x.w) ? ' <span class="small" style="color:var(--cobalt)">· sinônimos</span>' : ''}${key === 'near' ? ` <span class="muted small">${x.n} ${x.n === 1 ? 'vez' : 'vezes'} perto</span>` : ''}</span><span class="muted">${x.total}×</span></button>`).join('');
    body.innerHTML = `<p class="small muted" style="margin:0">Palavras que voltam a aparecer a menos de 60 palavras de distância. Toque numa delas para marcar no texto; depois toque numa marcação para ver sinônimos e trocar.</p>
      <div class="replist">${list(a.near, 'near') || '<span class="small muted">Nada repetido de perto. Bom sinal.</span>'}</div>
      ${a.mul.length ? `<b class="small">Muletas</b><div class="replist">${list(a.mul)}</div>` : ''}
      <div class="chip">Advérbios em -mente: <b>${a.mente.length}</b>${a.total ? ' · 1 a cada ' + Math.round(a.total / Math.max(1, a.mente.length)) + ' palavras' : ''}</div>
      ${a.mente.length ? `<div class="replist">${list([...new Set(a.mente)].map(w => ({ w, total: a.mente.filter(x => x === w).length })))}</div>` : ''}
      ${a.vagas.length ? `<b class="small">Palavras gerais</b><p class="small muted" style="margin:0">Dê nome aos bois: a palavra específica é mais concreta e precisa que a geral. Toque numa marcação no texto para ver trocas do seu banco.<span class="fonte">Othon M. Garcia, Comunicação em prosa moderna</span></p><div class="replist">${list(a.vagas)}</div>` : ''}
      <b class="small">Mais usadas no capítulo</b><div class="replist">${list(a.freq)}</div>
      <button class="btn sm" id="bancoBt">${ic('book')} ${Banco.dados ? 'Banco de palavras carregado' : 'Carregar banco de palavras'}</button>
      <button class="btn sm" id="clr">Limpar marcações</button>`;
    $$('#abody [data-w]').forEach(b => b.onclick = () => { $$('#abody [data-w]').forEach(x => x.classList.toggle('on', x === b)); this.highlight(b.dataset.w); });
    $('#clr').onclick = () => { this.clearMarks(); $$('#abody [data-w]').forEach(x => x.classList.remove('on')); };
    $('#bancoBt').onclick = async () => { if (!Banco.dados && !(await Banco.carregar())) { await Banco.subir(); } else App.toast('Banco pronto: toque numa palavra marcada ou selecione uma e use o botão do livro na barra'); this.renderAside(); };
  },
  highlight(word, cls = 'rep') {
    this.clearMarks();
    const ed = $('#ed'); const re = new RegExp('(?<![\\p{L}])' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\p{L}])', 'giu');
    const walker = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    let first = null;
    for (const n of nodes) {
      const t = n.textContent; const ms = [...t.matchAll(re)]; if (!ms.length) continue;
      const frag = document.createDocumentFragment(); let last = 0;
      for (const m of ms) { frag.append(t.slice(last, m.index)); const mk = document.createElement('mark'); mk.className = cls; mk.textContent = m[0]; frag.append(mk); first = first || mk; last = m.index + m[0].length; }
      frag.append(t.slice(last)); n.replaceWith(frag);
    }
    first?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return $$('#ed mark').length;
  },
  clearMarks(fromInput) {
    let ms = $$('#ed mark'); if (!ms.length) return;
    if (fromInput) {
      const s = getSelection(); const inMark = s.anchorNode && s.anchorNode.parentElement?.closest('mark'); if (!inMark) return;
      if (inMark.classList.contains('rev')) { inMark.replaceWith(...inMark.childNodes); $('#ed').normalize(); return; }
      ms = ms.filter(m => !m.classList.contains('rev'));
    }
    ms.forEach(m => m.replaceWith(...m.childNodes)); $('#ed').normalize();
  },
  async asideVersoes(body) {
    const snaps = (await DB.byBook('snapshots', App.book.id)).filter(s => s.chapterId === this.cur.id).sort((a, b) => b.at - a.at);
    body.innerHTML = `<p class="small muted" style="margin:0">A cada 10 minutos de escrita, e sempre que você sai do capítulo, uma cópia fica guardada aqui. As 40 mais recentes ficam.</p>
      <button class="btn sm" id="snapnow">Guardar versão agora</button>
      <div>${snaps.map(s => `<div class="snap"><span>${new Date(s.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}<br><span class="muted">${nf(s.words)} palavras${s.label ? ' · ' + esc(s.label) : ''}</span></span><span class="row" style="gap:4px"><button class="btn sm" data-see="${s.id}">Ver</button><button class="btn sm" data-res="${s.id}">Restaurar</button></span></div>`).join('') || '<span class="small muted">Nenhuma versão ainda.</span>'}</div>`;
    $('#snapnow').onclick = async () => { await this.saveNow(); await this.snapshot('manual'); App.toast('Versão guardada'); this.renderAside(); };
    $$('[data-see]').forEach(b => b.onclick = () => { const s = snaps.find(x => x.id === b.dataset.see); App.modal(`<h3>${esc(s.title)} · ${new Date(s.at).toLocaleString('pt-BR')}</h3><div class="editor" style="font-size:16px;background:var(--paper);color:var(--paper-ink);padding:20px;border-radius:8px;max-height:60vh;overflow:auto">${s.html}</div><div class="acts"><button class="btn" data-close>Fechar</button></div>`, { wide: true }); });
    $$('[data-res]').forEach(b => b.onclick = async () => {
      const s = snaps.find(x => x.id === b.dataset.res);
      if (!await App.confirm('Restaurar esta versão? A versão atual fica guardada antes.', 'Restaurar', false)) return;
      await this.saveNow(); await this.snapshot('antes de restaurar');
      this.cur.html = s.html; this.cur.words = s.words; await DB.put('chapters', { ...this.cur }); this.load(this.cur); App.toast('Versão restaurada');
    });
  },
  findReplace() {
    const m = App.modal(`<h3>Buscar e substituir</h3><label class="f">Buscar<input type="text" id="fq"></label><label class="f">Substituir por<input type="text" id="fr"></label>
      <div class="row"><label class="row small" style="gap:6px"><input type="checkbox" id="fw"> palavra inteira</label><label class="row small" style="gap:6px"><input type="checkbox" id="fc"> diferenciar maiúsculas</label><label class="row small" style="gap:6px"><input type="checkbox" id="fb" checked> livro inteiro</label></div>
      <div id="fres" class="small muted"></div>
      <div class="acts"><button class="btn" data-close>Fechar</button><button class="btn" id="fgo">Buscar</button><button class="btn pri" id="frep">Substituir tudo</button></div>`);
    const mkRe = () => { const q = $('#fq', m).value; if (!q) return null; let s = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); if ($('#fw', m).checked) s = '(?<![\\p{L}])' + s + '(?![\\p{L}])'; return new RegExp(s, $('#fc', m).checked ? 'gu' : 'giu'); };
    $('#fgo', m).onclick = async () => {
      const re = mkRe(); if (!re) return; await this.saveNow();
      const res = this.chs.map(c => ({ c, n: (textOf(c.html).match(re) || []).length })).filter(x => x.n);
      $('#fres', m).innerHTML = res.length ? res.map(x => `<button class="btn sm ghost" data-c="${x.c.id}">${esc(x.c.title)} (${x.n})</button>`).join(' ') : 'Nada encontrado.';
      $$('[data-c]', m).forEach(b => b.onclick = () => { this.load(this.chs.find(c => c.id === b.dataset.c)); this.highlight($('#fq', m).value, 'find'); m.close(); });
    };
    $('#frep', m).onclick = async () => {
      const re = mkRe(); if (!re) return; await this.saveNow();
      const rep = $('#fr', m).value; let total = 0;
      const targets = $('#fb', m).checked ? this.chs : [this.cur];
      for (const c of targets) {
        const d = document.createElement('div'); d.innerHTML = c.html;
        const w = document.createTreeWalker(d, NodeFilter.SHOW_TEXT); const ns = []; while (w.nextNode()) ns.push(w.currentNode);
        let n = 0; ns.forEach(x => { const t = x.textContent; const nt = t.replace(re, () => { n++; return rep; }); if (nt !== t) x.textContent = nt; });
        if (n) { total += n; c.html = d.innerHTML; c.words = countWords(d.innerText || d.textContent); await DB.put('chapters', { ...c }); }
      }
      this.load(this.cur); $('#fres', m).textContent = `${total} ${total === 1 ? 'troca feita' : 'trocas feitas'}.`;
    };
  },
  async importMore() {
    const f = await App.pickFile('.docx,.txt,.md'); if (!f) return;
    try {
      const chs = await Importa.file(f);
      if (!await App.confirm(`Acrescentar ${chs.length} ${chs.length === 1 ? 'capítulo' : 'capítulos'} (${nf(chs.reduce((s, c) => s + c.words, 0))} palavras) ao fim do livro?`, 'Acrescentar', false)) return;
      await this.saveNow();
      for (const c of chs) this.chs.push({ id: DB.uid(), bookId: App.book.id, order: this.chs.length, type: c.type, title: c.title, html: c.html, words: c.words, status: 'rascunho' });
      await this.reorder(); this.renderList(); App.toast('Capítulos importados');
    } catch (e) { App.toast('Não consegui ler: ' + e.message); }
  }
};
