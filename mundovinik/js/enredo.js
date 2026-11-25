/* Enredo: quadro de cards ligados e escaleta de cenas */
const REL_DEFAULT = [
  { id: 'amor', name: 'Amor', color: '#e8553a' }, { id: 'inimizade', name: 'Inimizade', color: '#7a1f2b' },
  { id: 'lealdade', name: 'Lealdade', color: '#2346a8' }, { id: 'familia', name: 'Família', color: '#2f8f5b' },
  { id: 'causa', name: 'Causa e efeito', color: '#b07a1f' }, { id: 'segredo', name: 'Segredo', color: '#6b4fa0' }
];
const CARD_COLORS = ['#2346a8', '#e8553a', '#2f8f5b', '#b07a1f', '#6b4fa0', '#1f6f78', '#7a1f2b', '#5d6378'];

App.views.enredo = {
  tab: 'quadro', cards: [], links: [], fichas: [], view: { x: 40, y: 40, z: 1 }, relSel: 'causa', sel: null,
  async render(v, top) {
    top.innerHTML = `<h2>Enredo</h2><div class="seg"><button data-tab="quadro" class="${this.tab === 'quadro' ? 'on' : ''}">Quadro</button><button data-tab="escaleta" class="${this.tab === 'escaleta' ? 'on' : ''}">Escaleta</button></div>`;
    $$('[data-tab]', top).forEach(b => b.onclick = () => { this.tab = b.dataset.tab; App.go('enredo'); });
    this.fichas = await DB.byBook('fichas', App.book.id);
    if (!App.book.relTypes) App.book.relTypes = REL_DEFAULT.map(r => ({ ...r }));
    if (this.tab === 'quadro') return this.board(v);
    return this.escaleta(v);
  },
  leave() { $('#view').style.overflow = ''; },
  rel(id) { return App.book.relTypes.find(r => r.id === id) || { name: '?', color: '#888' }; },

  async board(v) {
    v.style.overflow = 'hidden';
    this.cards = await DB.byBook('cards', App.book.id);
    this.links = await DB.byBook('links', App.book.id);
    this.view = App.book.boardView || { x: 40, y: 40, z: 1 };
    v.innerHTML = `<div class="board" id="board">
      <div class="boardtools"><button class="btn sm pri" id="bnew">${ic('plus')} Card</button><button class="btn sm" id="bfich">${ic('globe')} Trazer fichas</button>
        <button class="btn sm" id="zout" aria-label="Diminuir zoom">−</button><button class="btn sm" id="zin" aria-label="Aumentar zoom">+</button><button class="btn sm" id="zfit">Ver tudo</button></div>
      <div class="legend"><b>Ligações</b><div class="small muted" style="margin:2px 0 6px">Arraste a bolinha coral de um card até outro. A cor marcada abaixo é a que será usada.</div>
        <div id="rels"></div><button class="btn sm ghost" id="addrel">${ic('plus')} Tipo de ligação</button></div>
      <div class="world" id="world"><svg class="wires" id="wires" width="1" height="1"></svg><div id="cardsl"></div></div>
      ${!this.cards.length ? `<div class="empty" style="position:absolute;inset:30% 0 auto;pointer-events:none"><h3>Sua trama, fora da cabeça</h3><p>Cada cena, virada ou personagem vira um card. Ligue os cards para ver quem ama quem, quem trai quem, o que causou o quê.</p></div>` : ''}
    </div>`;
    this.renderRels();
    this.renderCards();
    this.applyView();
    this.bindBoard();
  },
  renderRels() {
    $('#rels').innerHTML = App.book.relTypes.map(r => `<div class="li"><input type="radio" name="rel" value="${r.id}" ${this.relSel === r.id ? 'checked' : ''} aria-label="Usar ${esc(r.name)}"><i style="background:${r.color}"></i><input type="text" value="${esc(r.name)}" data-rn="${r.id}"><input type="color" value="${r.color}" data-rc="${r.id}" style="width:26px;height:22px;padding:0;border:0;background:none"></div>`).join('');
    $$('#rels [name=rel]').forEach(i => i.onchange = () => this.relSel = i.value);
    $$('#rels [data-rn]').forEach(i => i.onchange = () => { this.rel(i.dataset.rn).name = i.value; App.saveBook(); this.renderWires(); });
    $$('#rels [data-rc]').forEach(i => i.oninput = () => { this.rel(i.dataset.rc).color = i.value; App.saveBook(); this.renderRels(); this.renderWires(); });
    $('#addrel').onclick = async () => { const n = await App.ask('Novo tipo de ligação', '', 'Nome (ex.: Rivalidade, Dívida)'); if (!n) return; const r = { id: DB.uid(), name: n, color: CARD_COLORS[App.book.relTypes.length % CARD_COLORS.length] }; App.book.relTypes.push(r); this.relSel = r.id; await App.saveBook(); this.renderRels(); };
  },
  cardHTML(c) {
    const f = c.fichaId && this.fichas.find(x => x.id === c.fichaId);
    const img = c.img || f?.img;
    return `<div class="pcard ${this.sel === c.id ? 'sel' : ''}" data-c="${c.id}" style="left:${c.x}px;top:${c.y}px;--cc:${c.color || '#2346a8'}">${img ? `<div class="pimg"><img src="${img}" alt=""></div>` : ''}<div class="pb"><b>${esc(c.title || f?.name || 'Sem título')}</b>${c.text || f?.summary ? `<p>${esc(c.text || f?.summary)}</p>` : ''}${f ? `<span class="chip" style="margin-top:6px;font-size:11px">${esc(UNIV_KINDS[f.kind] || 'Ficha')}</span>` : ''}</div><span class="dot" data-dot="${c.id}" title="Arraste até outro card para ligar"></span></div>`;
  },
  renderCards() { $('#cardsl').innerHTML = this.cards.map(c => this.cardHTML(c)).join(''); this.renderWires(); },
  center(c) { const el = $(`[data-c="${c.id}"]`); const w = el?.offsetWidth || 210, h = el?.offsetHeight || 80; return { x: c.x + w / 2, y: c.y + h / 2, w, h }; },
  edgePt(a, b) { const dx = b.x - a.x, dy = b.y - a.y; const sx = (a.w / 2) / Math.abs(dx || 1e-6), sy = (a.h / 2) / Math.abs(dy || 1e-6); const s = Math.min(sx, sy, 1); return { x: a.x + dx * s, y: a.y + dy * s }; },
  renderWires(temp) {
    const parts = this.links.map(l => {
      const A = this.cards.find(c => c.id === l.from), B = this.cards.find(c => c.id === l.to); if (!A || !B) return '';
      const a = this.center(A), b = this.center(B), p = this.edgePt(a, b), q = this.edgePt(b, a);
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2; const r = this.rel(l.type);
      const ang = Math.atan2(q.y - p.y, q.x - p.x), ah = 10;
      return `<g><path d="M${p.x} ${p.y}L${q.x} ${q.y}" stroke="${r.color}" stroke-width="2.5" fill="none" data-l="${l.id}" style="stroke-linecap:round"/><path d="M${p.x} ${p.y}L${q.x} ${q.y}" stroke="transparent" stroke-width="14" fill="none" data-l="${l.id}"/>
        <path d="M${q.x} ${q.y}l${-ah * Math.cos(ang - .45)} ${-ah * Math.sin(ang - .45)}M${q.x} ${q.y}l${-ah * Math.cos(ang + .45)} ${-ah * Math.sin(ang + .45)}" stroke="${r.color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <g transform="translate(${mx},${my})" style="pointer-events:none"><rect x="${-(r.name.length * 3.6 + 8)}" y="-10" width="${r.name.length * 7.2 + 16}" height="20" rx="10" fill="var(--panel)" stroke="${r.color}"/><text text-anchor="middle" y="4" font-size="11" fill="var(--ink)" font-family="Figtree">${esc(l.label || r.name)}</text></g></g>`;
    }).join('');
    $('#wires').innerHTML = parts + (temp ? `<path d="M${temp.x1} ${temp.y1}L${temp.x2} ${temp.y2}" stroke="${this.rel(this.relSel).color}" stroke-width="2.5" stroke-dasharray="6 5" fill="none"/>` : '');
  },
  applyView() { const { x, y, z } = this.view; $('#world').style.transform = `translate(${x}px,${y}px) scale(${z})`; },
  saveView: debounce(function () { App.book.boardView = App.views.enredo.view; App.saveBook(); }, 600),
  toWorld(e) { const r = $('#board').getBoundingClientRect(); return { x: (e.clientX - r.left - this.view.x) / this.view.z, y: (e.clientY - r.top - this.view.y) / this.view.z }; },
  zoomAt(k, cx, cy) {
    const z = Math.max(.25, Math.min(2.2, this.view.z * k)); const r = $('#board').getBoundingClientRect();
    cx = cx ?? r.width / 2; cy = cy ?? r.height / 2;
    this.view.x = cx - (cx - this.view.x) * z / this.view.z; this.view.y = cy - (cy - this.view.y) * z / this.view.z; this.view.z = z;
    this.applyView(); this.saveView();
  },
  bindBoard() {
    const board = $('#board');
    let mode = null, start = null, item = null, moved = false;
    const ptrs = new Map(); let pinch = null;
    board.addEventListener('pointerdown', e => {
      if (e.target.closest('.boardtools,.legend')) return;
      const wire = e.target.closest('[data-l]');
      if (wire) { this.editLink(this.links.find(l => l.id === wire.dataset.l)); return; }
      ptrs.set(e.pointerId, e);
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: this.view.z }; mode = 'pinch'; return; }
      const dot = e.target.closest('[data-dot]'), card = e.target.closest('[data-c]');
      board.setPointerCapture(e.pointerId); moved = false;
      if (dot) { mode = 'link'; item = this.cards.find(c => c.id === dot.dataset.dot); $(`[data-c="${item.id}"]`).classList.add('linking'); }
      else if (card) { mode = 'drag'; item = this.cards.find(c => c.id === card.dataset.c); const w = this.toWorld(e); start = { dx: w.x - item.x, dy: w.y - item.y }; }
      else { mode = 'pan'; start = { x: e.clientX - this.view.x, y: e.clientY - this.view.y }; this.select(null); }
    });
    board.addEventListener('pointermove', e => {
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, e);
      if (mode === 'pinch' && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); this.zoomAt(pinch.z * d / pinch.d / this.view.z); return; }
      if (!mode) return; moved = true;
      if (mode === 'pan') { this.view.x = e.clientX - start.x; this.view.y = e.clientY - start.y; this.applyView(); }
      if (mode === 'drag') { const w = this.toWorld(e); item.x = Math.round(w.x - start.dx); item.y = Math.round(w.y - start.dy); const el = $(`[data-c="${item.id}"]`); el.style.left = item.x + 'px'; el.style.top = item.y + 'px'; this.renderWires(); }
      if (mode === 'link') { const a = this.center(item), w = this.toWorld(e); this.renderWires({ x1: a.x, y1: a.y, x2: w.x, y2: w.y }); }
    });
    const end = async e => {
      ptrs.delete(e.pointerId);
      if (mode === 'pinch') { if (ptrs.size < 2) mode = null; return; }
      if (mode === 'drag') { if (moved) await DB.put('cards', item); else { this.select(item.id); this.editCard(item); } }
      if (mode === 'pan') this.saveView();
      if (mode === 'link') {
        $$('.pcard.linking').forEach(x => x.classList.remove('linking'));
        const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-c]');
        if (el && el.dataset.c !== item.id) { const l = { id: DB.uid(), bookId: App.book.id, from: item.id, to: el.dataset.c, type: this.relSel }; this.links.push(l); await DB.put('links', l); }
        this.renderWires();
      }
      mode = null; item = null;
    };
    board.addEventListener('pointerup', end); board.addEventListener('pointercancel', end);
    board.addEventListener('wheel', e => { e.preventDefault(); const r = board.getBoundingClientRect(); this.zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    $('#zin').onclick = () => this.zoomAt(1.2); $('#zout').onclick = () => this.zoomAt(1 / 1.2);
    $('#zfit').onclick = () => this.fit();
    $('#bnew').onclick = () => this.newCard();
    $('#bfich').onclick = () => this.bringFichas();
  },
  select(id) { this.sel = id; $$('.pcard').forEach(c => c.classList.toggle('sel', c.dataset.c === id)); },
  fit() {
    if (!this.cards.length) return;
    const xs = this.cards.map(c => c.x), ys = this.cards.map(c => c.y);
    const minx = Math.min(...xs) - 40, miny = Math.min(...ys) - 40, maxx = Math.max(...xs) + 260, maxy = Math.max(...ys) + 240;
    const r = $('#board').getBoundingClientRect();
    const z = Math.max(.25, Math.min(1.4, Math.min(r.width / (maxx - minx), r.height / (maxy - miny))));
    this.view = { z, x: -minx * z + (r.width - (maxx - minx) * z) / 2, y: -miny * z + (r.height - (maxy - miny) * z) / 2 };
    this.applyView(); this.saveView();
  },
  async newCard(extra = {}) {
    const r = $('#board').getBoundingClientRect();
    const c = { id: DB.uid(), bookId: App.book.id, title: '', text: '', color: CARD_COLORS[this.cards.length % CARD_COLORS.length], x: Math.round((r.width / 2 - this.view.x) / this.view.z - 105 + (Math.random() * 60 - 30)), y: Math.round((r.height / 2 - this.view.y) / this.view.z - 50 + (Math.random() * 60 - 30)), ...extra };
    this.cards.push(c); await DB.put('cards', c);
    $('.board .empty')?.remove();
    this.renderCards(); if (!extra.fichaId) this.editCard(c);
    return c;
  },
  async bringFichas() {
    const on = new Set(this.cards.map(c => c.fichaId).filter(Boolean));
    const todo = this.fichas.filter(f => !on.has(f.id));
    if (!todo.length) return App.toast(this.fichas.length ? 'Todas as fichas já estão no quadro' : 'Crie fichas no Universo primeiro');
    const base = this.toWorld({ clientX: $('#board').getBoundingClientRect().left + 60, clientY: $('#board').getBoundingClientRect().top + 90 });
    for (let i = 0; i < todo.length; i++) {
      const f = todo[i];
      const c = { id: DB.uid(), bookId: App.book.id, title: '', text: '', fichaId: f.id, color: f.kind === 'personagem' ? '#2346a8' : f.kind === 'lugar' ? '#2f8f5b' : '#b07a1f', x: Math.round(base.x + (i % 5) * 250), y: Math.round(base.y + Math.floor(i / 5) * 280) };
      this.cards.push(c); await DB.put('cards', c);
    }
    $('.board .empty')?.remove(); this.renderCards(); App.toast(todo.length + ' fichas trazidas para o quadro');
  },
  editCard(c) {
    const m = App.modal(`<h3>Card</h3>
      <label class="f">Título<input type="text" id="ct" value="${esc(c.title)}" placeholder="${c.fichaId ? 'Usa o nome da ficha' : 'Ex.: Eddie descobre a carta'}"></label>
      <label class="f">Texto<textarea id="cx">${esc(c.text || '')}</textarea></label>
      <label class="f">Ligado à ficha<select id="cf"><option value="">— nenhuma</option>${this.fichas.sort((a, b) => a.name.localeCompare(b.name)).map(f => `<option value="${f.id}" ${c.fichaId === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></label>
      <div class="row">${CARD_COLORS.map(x => `<button data-cc="${x}" style="width:26px;height:26px;border-radius:50%;background:${x};border:3px solid ${c.color === x ? 'var(--ink)' : 'transparent'}" aria-label="Cor"></button>`).join('')}</div>
      <div class="row"><button class="btn sm" id="cimg">${ic('img')} ${c.img ? 'Trocar imagem' : 'Pôr imagem'}</button>${c.img ? '<button class="btn sm ghost" id="crmimg">Tirar imagem</button>' : ''}${c.fichaId ? '<button class="btn sm ghost" id="copenf">Abrir ficha</button>' : ''}</div>
      <div class="acts"><button class="btn danger" id="cdel" style="margin-right:auto">${ic('trash')} Excluir</button><button class="btn" data-close>Fechar</button><button class="btn pri" id="cok">Salvar</button></div>`);
    $$('[data-cc]', m).forEach(b => b.onclick = () => { c.color = b.dataset.cc; $$('[data-cc]', m).forEach(x => x.style.borderColor = x === b ? 'var(--ink)' : 'transparent'); });
    $('#cimg', m).onclick = async () => { const f = await App.pickFile('image/*'); if (!f) return; c.img = await App.shrinkImage(f, 600); App.toast('Imagem pronta; toque em Salvar'); };
    $('#crmimg', m) && ($('#crmimg', m).onclick = () => { delete c.img; App.toast('Imagem tirada; toque em Salvar'); });
    $('#copenf', m) && ($('#copenf', m).onclick = () => { m.close(); Universo.sel = c.fichaId; App.go('universo'); });
    $('#cok', m).onclick = async () => { c.title = $('#ct', m).value; c.text = $('#cx', m).value; c.fichaId = $('#cf', m).value || null; await DB.put('cards', c); m.close(); this.renderCards(); };
    $('#cdel', m).onclick = async () => {
      m.close(); await DB.del('cards', c.id); this.cards = this.cards.filter(x => x !== c);
      for (const l of this.links.filter(l => l.from === c.id || l.to === c.id)) await DB.del('links', l.id);
      this.links = this.links.filter(l => l.from !== c.id && l.to !== c.id); this.renderCards();
    };
  },
  editLink(l) {
    const A = this.cards.find(c => c.id === l.from), B = this.cards.find(c => c.id === l.to);
    const nm = c => c.title || this.fichas.find(f => f.id === c.fichaId)?.name || 'card';
    const m = App.modal(`<h3>${esc(nm(A))} → ${esc(nm(B))}</h3>
      <label class="f">Tipo<select id="lt">${App.book.relTypes.map(r => `<option value="${r.id}" ${l.type === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></label>
      <label class="f">Rótulo próprio (opcional)<input type="text" id="ll" value="${esc(l.label || '')}" placeholder="ex.: deve dinheiro a"></label>
      <div class="acts"><button class="btn danger" id="ldel" style="margin-right:auto">Apagar ligação</button><button class="btn" id="linv">Inverter sentido</button><button class="btn pri" id="lok">Salvar</button></div>`);
    $('#lok', m).onclick = async () => { l.type = $('#lt', m).value; l.label = $('#ll', m).value.trim(); await DB.put('links', l); m.close(); this.renderWires(); };
    $('#linv', m).onclick = async () => { [l.from, l.to] = [l.to, l.from]; await DB.put('links', l); m.close(); this.renderWires(); };
    $('#ldel', m).onclick = async () => { await DB.del('links', l.id); this.links = this.links.filter(x => x !== l); m.close(); this.renderWires(); };
  },

  /* escaleta */
  async escaleta(v) {
    v.style.overflow = '';
    const scenes = (await DB.byBook('scenes', App.book.id)).sort((a, b) => a.order - b.order);
    const chs = await App.chapters();
    const chars = this.fichas.filter(f => f.kind === 'personagem').map(f => f.name).sort();
    const places = this.fichas.filter(f => f.kind === 'lugar').map(f => f.name).sort();
    v.innerHTML = `<div class="pad"><div class="row" style="justify-content:space-between;margin-bottom:14px"><p class="muted" style="margin:0;max-width:62ch">A escaleta é o livro cena a cena: quem conta, onde, o que está em jogo. Serve para ver o ritmo e os furos antes de escrever.</p>
      <div class="row"><button class="btn sm" id="sfrom">Criar a partir dos capítulos</button><button class="btn pri sm" id="snew">${ic('plus')} Cena</button></div></div>
      <datalist id="dlpov">${chars.map(n => `<option value="${esc(n)}">`).join('')}</datalist><datalist id="dlpl">${places.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
      ${scenes.length ? `<div class="card" style="padding:6px;overflow-x:auto"><table class="scenes" style="min-width:900px"><thead><tr><th style="width:36px">#</th><th>Cena</th><th>Capítulo</th><th>Ponto de vista</th><th>Lugar</th><th>O que está em jogo</th><th>Estado</th><th style="width:90px"></th></tr></thead><tbody>
      ${scenes.map((s, i) => `<tr data-s="${s.id}"><td class="muted">${i + 1}</td><td><input type="text" data-k="title" value="${esc(s.title)}" placeholder="Nome da cena"></td>
        <td><select data-k="chapterId"><option value="">—</option>${chs.map(c => `<option value="${c.id}" ${s.chapterId === c.id ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</select></td>
        <td><input type="text" data-k="pov" list="dlpov" value="${esc(s.pov || '')}"></td><td><input type="text" data-k="place" list="dlpl" value="${esc(s.place || '')}"></td>
        <td><textarea data-k="goal" rows="1">${esc(s.goal || '')}</textarea></td>
        <td><select data-k="status">${['ideia', 'escrita', 'revisada', 'cortar'].map(x => `<option ${s.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></td>
        <td><div class="row" style="gap:0;flex-wrap:nowrap"><button class="iconbtn" data-mv="-1" aria-label="Subir">${ic('up')}</button><button class="iconbtn" data-mv="1" aria-label="Descer">${ic('down')}</button><button class="iconbtn" data-del aria-label="Excluir">${ic('trash')}</button></div></td></tr>`).join('')}
      </tbody></table></div>
      <p class="small muted">${scenes.length} cenas · ${scenes.filter(s => s.status === 'escrita' || s.status === 'revisada').length} escritas · ${new Set(scenes.map(s => s.pov).filter(Boolean)).size} pontos de vista</p>`
      : `<div class="empty"><h3>Nenhuma cena ainda</h3><p>Crie cena por cena, ou gere uma cena para cada capítulo usando as sinopses que você já escreveu.</p></div>`}</div>`;
    const add = async (extra = {}) => { const s = { id: DB.uid(), bookId: App.book.id, order: scenes.length, title: '', status: 'ideia', ...extra }; scenes.push(s); await DB.put('scenes', s); };
    $('#snew').onclick = async () => { await add(); App.go('enredo'); };
    $('#sfrom').onclick = async () => { for (const c of chs) await add({ title: c.title, chapterId: c.id, pov: c.pov || '', place: c.setting || '', goal: c.synopsis || '', status: c.words > 200 ? 'escrita' : 'ideia' }); App.go('enredo'); };
    $$('tr[data-s]').forEach(tr => {
      const s = scenes.find(x => x.id === tr.dataset.s);
      const save = debounce(async () => { $$('[data-k]', tr).forEach(el => s[el.dataset.k] = el.value); await DB.put('scenes', s); }, 400);
      $$('[data-k]', tr).forEach(el => el.addEventListener('input', save));
      $$('[data-mv]', tr).forEach(b => b.onclick = async () => { const i = scenes.indexOf(s), j = i + +b.dataset.mv; if (j < 0 || j >= scenes.length) return; [scenes[i], scenes[j]] = [scenes[j], scenes[i]]; for (let k = 0; k < scenes.length; k++) { scenes[k].order = k; await DB.put('scenes', scenes[k]); } App.go('enredo'); });
      $('[data-del]', tr).onclick = async () => { await DB.del('scenes', s.id); App.go('enredo'); };
    });
  }
};
