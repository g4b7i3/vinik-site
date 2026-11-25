/* Mundo Vinik — núcleo: estado, navegação, utilidades */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = n => Number(n || 0).toLocaleString('pt-BR');
const todayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const textOf = html => { const d = document.createElement('div'); d.innerHTML = String(html || '').replace(/<sup class="fnote"[^>]*>.*?<\/sup>/g, '').replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '$&\n'); return d.textContent || ''; };
const countWords = t => (String(t || '').match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || []).length;
const debounce = (fn, ms) => { let t; const f = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; f.flush = (...a) => { clearTimeout(t); fn(...a); }; return f; };

const ICON = {
  lib: '<path d="M4 4h4v16H4zM10 4h4v16h-4zM16.5 5l3.6-.9 3 15.6-3.6.9z"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  web: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="9" cy="18" r="2.5"/><path d="M8.3 7l7.4.8M7 8.3l1.6 7.3M16.6 10l-5.8 6.5"/>',
  layout: '<rect x="3" y="4" width="8" height="16" rx="1"/><rect x="13" y="4" width="8" height="16" rx="1"/><path d="M5.5 8h3M5.5 11h3M5.5 14h3M15.5 8h3M15.5 11h3"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  focus: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  bold: '<path d="M7 5h6a3.5 3.5 0 010 7H7zM7 12h7a3.5 3.5 0 010 7H7z"/>',
  ital: '<path d="M10 5h8M6 19h8M14 5l-4 14"/>',
  star: '<path d="M12 4l2 5h5l-4 3.5 1.5 5.5-4.5-3-4.5 3L9 12.5 5 9h5z"/>',
  quote: '<path d="M7 7h4v5H7c0 3 1 4 3 5M14 7h4v5h-4c0 3 1 4 3 5"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 000 12h3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
  panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>', down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  dl: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>', ul: '<path d="M12 20V8M6 14l6-6 6 6M4 4h16"/>',
  img: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  moon: '<path d="M20 14A8 8 0 0110 4a8 8 0 1010 10z"/>', book: '<path d="M4 4h7a3 3 0 013 3v13a2 2 0 00-2-2H4zM20 4h-6M20 4v14h-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  scene: '<path d="M4 6h16M4 6l2 4h12l2-4M6 10v9h12v-9"/>', fn: '<path d="M8 4h6M11 4v16M8 20h6M17 7h3"/>'
};
const ic = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n] || ''}</svg>`;

/* azulejo: padrão desenhado para capas e fundos */
function azulejo(color = '#fff', size = 46, id = 'az' + Math.random().toString(36).slice(2, 7)) {
  const s = size, h = s / 2;
  return `<defs><pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
    <rect width="${s}" height="${s}" fill="none" stroke="${color}" stroke-width=".8"/>
    <path d="M${h} ${s * .12}C${h + s * .1} ${h - s * .1} ${h + s * .1} ${h - s * .1} ${s * .88} ${h}C${h + s * .1} ${h + s * .1} ${h + s * .1} ${h + s * .1} ${h} ${s * .88}C${h - s * .1} ${h + s * .1} ${h - s * .1} ${h + s * .1} ${s * .12} ${h}C${h - s * .1} ${h - s * .1} ${h - s * .1} ${h - s * .1} ${h} ${s * .12}z" fill="none" stroke="${color}" stroke-width="1.2"/>
    <circle cx="${h}" cy="${h}" r="${s * .07}" fill="${color}"/>
    <path d="M0 ${s * .18}A${s * .18} ${s * .18} 0 0 0 ${s * .18} 0M${s} ${s * .18}A${s * .18} ${s * .18} 0 0 1 ${s * .82} 0M0 ${s * .82}A${s * .18} ${s * .18} 0 0 1 ${s * .18} ${s}M${s} ${s * .82}A${s * .18} ${s * .18} 0 0 0 ${s * .82} ${s}" fill="none" stroke="${color}" stroke-width="1"/>
  </pattern></defs><rect width="100%" height="100%" fill="url(#${id})"/>`;
}

const App = {
  books: [], book: null, view: 'biblioteca', settings: {},
  views: {},
  nav: [
    ['biblioteca', 'Biblioteca', 'lib'], ['manuscrito', 'Manuscrito', 'pen'], ['universo', 'Universo', 'globe'],
    ['enredo', 'Enredo', 'web'], ['diagramacao', 'Diagramação', 'layout'], ['progresso', 'Progresso', 'chart']
  ],
  async start() {
    const s = await DB.get('meta', 'settings');
    this.settings = s || { id: 'settings', theme: '', lastBook: null };
    this.applyTheme();
    document.body.dataset.skin = this.settings.skin || 'papel';
    $('#sidetile').innerHTML = azulejo('#fff', 52);
    this.books = (await DB.all('books')).sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0));
    if (this.settings.lastBook) this.book = this.books.find(b => b.id === this.settings.lastBook) || null;
    if (!this.book && this.books.length) this.book = this.books[0];
    $('#bookpick').onclick = () => this.go('biblioteca');
    const h = location.hash.slice(1);
    this.go(this.nav.some(n => n[0] === h) ? h : 'biblioteca');
    addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v && v !== this.view && this.nav.some(n => n[0] === v)) this.go(v); });
    addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); this.views[this.view]?.saveNow?.(); this.toast('Salvo'); }
      if (e.key === 'Escape' && document.body.classList.contains('focus')) Manuscrito.toggleFocus(false);
    });
    addEventListener('beforeunload', () => { this.views[this.view]?.saveNow?.(); });
    if (!this.books.length) this.ensureDemo();
    if (typeof Sync !== 'undefined') Sync.start();
    if (location.search.includes('senha=ok')) { this.toast('Senha salva. Este aparelho fica liberado por 10 anos.', 4000); try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { } }
  },
  async ensureDemo() { /* sem dados: a biblioteca mostra o convite para criar o primeiro livro */ },
  applyTheme() {
    const t = this.settings.theme;
    if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  },
  async saveSettings() { await DB.put('meta', this.settings); },
  renderNav() {
    $('#nav').innerHTML = this.nav.map(([k, l, i]) => `<button data-v="${k}" class="${this.view === k ? 'on' : ''}">${ic(i)}<span>${l}</span></button>`).join('');
    $$('#nav button').forEach(b => b.onclick = () => this.go(b.dataset.v));
    $('#bookname').textContent = this.book ? this.book.title : 'Nenhum livro';
  },
  async go(v) {
    const cur = this.views[this.view];
    if (cur?.leave) await cur.leave();
    if (v !== 'biblioteca' && v !== 'progresso' && !this.book) { this.toast('Crie ou abra um livro primeiro'); v = 'biblioteca'; }
    this.view = v;
    if (location.hash.slice(1) !== v) try { history.replaceState(null, '', '#' + v); } catch (e) { }
    document.body.classList.remove('focus');
    this.renderNav();
    $('#view').innerHTML = ''; $('#top').innerHTML = '';
    $('#view').scrollTop = 0;
    await this.views[v].render($('#view'), $('#top'));
  },
  async openBook(id) {
    this.book = this.books.find(b => b.id === id);
    this.book.lastOpened = Date.now();
    await DB.put('books', this.book);
    this.settings.lastBook = id; await this.saveSettings();
    this.go('manuscrito');
  },
  async saveBook() { if (this.book) { await DB.put('books', this.book); this.mark(); } },
  mark(msg) {
    const el = $('#savestate'); if (!el) return;
    const t = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    el.textContent = msg || (typeof Sync !== 'undefined' && Sync.ativo ? 'Salvo às ' + t + ' · sincronizando' : 'Salvo neste aparelho às ' + t);
  },
  toast(msg, ms = 2600) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), ms);
  },
  modal(html, { wide } = {}) {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="box ${wide ? 'wide' : ''}" role="dialog">${html}</div>`;
    document.body.appendChild(m);
    m.addEventListener('mousedown', e => { if (e.target === m) m.remove(); });
    m.close = () => m.remove();
    $$('[data-close]', m).forEach(b => b.onclick = () => m.remove());
    setTimeout(() => $('input,textarea', m)?.focus(), 30);
    return m;
  },
  confirm(msg, okLabel = 'Confirmar', danger = true) {
    return new Promise(res => {
      const m = this.modal(`<h3>${esc(msg)}</h3><div class="acts"><button class="btn" data-no>Cancelar</button><button class="btn ${danger ? 'danger' : 'pri'}" data-ok>${esc(okLabel)}</button></div>`);
      $('[data-no]', m).onclick = () => { m.close(); res(false); };
      $('[data-ok]', m).onclick = () => { m.close(); res(true); };
    });
  },
  ask(title, value = '', label = '') {
    return new Promise(res => {
      const m = this.modal(`<h3>${esc(title)}</h3><label class="f">${esc(label)}<input type="text" id="askv" value="${esc(value)}"></label><div class="acts"><button class="btn" data-no>Cancelar</button><button class="btn pri" data-ok>OK</button></div>`);
      const ok = () => { const v = $('#askv', m).value.trim(); m.close(); res(v || null); };
      $('[data-no]', m).onclick = () => { m.close(); res(null); };
      $('[data-ok]', m).onclick = ok;
      $('#askv', m).onkeydown = e => { if (e.key === 'Enter') ok(); };
    });
  },
  pickFile(accept, multiple = false) {
    return new Promise(res => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = multiple;
      i.onchange = () => res(multiple ? [...i.files] : i.files[0]);
      i.click();
    });
  },
  readAsDataURL: f => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); }),
  async shrinkImage(file, max = 900, q = .85) {
    const url = await this.readAsDataURL(file);
    const img = new Image(); img.src = url; await img.decode().catch(() => { });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    if (k >= 1 && file.size < 400000) return url;
    const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', q);
  },
  async download(filename, data, type = 'application/octet-stream') {
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    try {
      if (window.claude?.use) {
        const d = await window.claude.use('downloads');
        if (d) { await d.save({ filename, data: blob }); return true; }
      }
    } catch (e) { if (e && e.code !== 'unavailable') { this.toast('Download cancelado'); return false; } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    return true;
  },
  slug: s => String(s || 'livro').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'livro',
  async chapters(bookId = this.book?.id) { return (await DB.byBook('chapters', bookId)).sort((a, b) => a.order - b.order); },
  async logWords(delta) {
    if (!this.book || delta <= 0) return;
    const id = this.book.id + ':' + todayKey();
    const l = (await DB.get('log', id)) || { id, bookId: this.book.id, date: todayKey(), words: 0 };
    l.words += delta; await DB.put('log', l);
  }
};

function coverHTML(b) {
  if (b.cover) return `<img src="${b.cover}" alt="">`;
  const id = 'cv' + b.id;
  return `<div class="gen" style="background:${esc(b.color || '#2346a8')}"><svg aria-hidden="true">${azulejo('#fff', 34, id)}</svg><b>${esc(b.title)}</b><i>${esc(b.author || '')}</i></div>`;
}
