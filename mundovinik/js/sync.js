/* Sincronização entre aparelhos: tudo fica no aparelho e vai para a nuvem do site quando há internet.
   Vale o que foi mexido por último. Versões (snapshots) e ajustes ficam só em cada aparelho. */
const Sync = {
  TIPOS: ['books', 'chapters', 'fichas', 'cards', 'links', 'scenes', 'log', 'ideias', 'ajustes', 'referencias'],
  API: 'api/dados',
  ativo: false, enviando: false, ultimo: 0,
  pend() { try { return JSON.parse(localStorage.getItem('mv_pend') || '{}'); } catch (e) { return {}; } },
  savePend(p) { try { localStorage.setItem('mv_pend', JSON.stringify(p)); } catch (e) { } },
  marcar(tipo, id, apagado) {
    if (!this.TIPOS.includes(tipo)) return;
    const p = this.pend(); p[tipo + '/' + id] = apagado ? -Date.now() : Date.now(); this.savePend(p);
    this.agendar();
  },
  agendar: null,
  async start() {
    this.agendar = debounce(() => this.enviar(), 2500);
    DB.hook.change = (t, id, apagado) => this.marcar(t, id, apagado);
    let r;
    try { r = await fetch(this.API + '?op=indice', { credentials: 'same-origin', cache: 'no-store' }); } catch (e) { r = null; }
    if (r && r.status === 401) { location.href = 'entrar.html?volta=' + encodeURIComponent(location.pathname); return; }
    if (!r || !r.ok || !(r.headers.get('content-type') || '').includes('json')) { this.status('Salvo neste aparelho'); return; }
    this.ativo = true;
    await this.puxar(await r.json());
    setInterval(() => this.puxar(), 90000);
    addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.puxar(); else this.enviar(); });
    addEventListener('online', () => { this.enviar(); this.puxar(); });
  },
  status(t) { const el = $('#savestate'); if (el) el.textContent = t; },
  hora: () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  async puxar(dados) {
    if (!this.ativo || this.puxando) return;
    this.puxando = true;
    try {
      if (!dados) { const r = await fetch(this.API + '?op=indice', { cache: 'no-store' }); if (!r.ok) throw new Error(r.status); dados = await r.json(); }
      const remoto = dados.indice || {};
      const local = {};
      for (const t of this.TIPOS) for (const o of await DB.all(t)) local[t + '/' + o.id] = o.updatedAt || 0;
      const pend = this.pend();
      const baixar = [], apagar = [];
      for (const [k, em] of Object.entries(remoto)) {
        if (pend[k] && Math.abs(pend[k]) >= Math.abs(em)) continue;
        if (em > 0 && (!(k in local) || em > local[k])) baixar.push(k);
        if (em < 0 && k in local && -em >= local[k]) apagar.push(k);
      }
      for (const [k, em] of Object.entries(local)) if (!(k in remoto) || (remoto[k] > 0 && em > remoto[k])) if (!pend[k]) pend[k] = em;
      this.savePend(pend);
      const mudou = new Set();
      for (let i = 0; i < baixar.length; i += 40) {
        const r = await fetch(this.API + '?op=baixar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chaves: baixar.slice(i, i + 40) }) });
        if (!r.ok) throw new Error(r.status);
        const { itens } = await r.json();
        for (const [k, obj] of Object.entries(itens)) { if (!obj) continue; const [t] = k.split('/'); await DB.putRaw(t, obj); mudou.add(k); }
      }
      for (const k of apagar) { const [t, ...rest] = k.split('/'); await DB.delRaw(t, rest.join('/')); mudou.add(k); }
      if (mudou.size) await this.aplicar(mudou);
      if (Object.keys(pend).length) await this.enviar();
      this.ultimo = Date.now(); this.status('Sincronizado às ' + this.hora());
    } catch (e) { this.status('Sem conexão: salvo neste aparelho'); }
    this.puxando = false;
  },
  async aplicar(mudou) {
    App.books = (await DB.all('books')).sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0));
    if (App.book) App.book = App.books.find(b => b.id === App.book.id) || App.books[0] || null;
    else if (App.books.length) App.book = App.books[0];
    await App.carregarAjustes();
    const v = App.view;
    if (v === 'manuscrito' && Manuscrito.cur) {
      const cur = Manuscrito.cur;
      if (mudou.has('chapters/' + cur.id) && Date.now() - (Manuscrito.lastInput || 0) > 30000) App.go('manuscrito');
      else { Manuscrito.chs = (await App.chapters()).map(c => c.id === cur.id ? cur : c); Manuscrito.renderList(); }
      if (Espelho.ligado() && [...mudou].some(k => k.startsWith('referencias/') || k.startsWith('books/'))) Espelho.render();
    } else if (v !== 'diagramacao') App.go(v);
    App.renderNav();
    App.toast('Atualizado com o que você fez no outro aparelho');
  },
  async enviar() {
    if (!this.ativo || this.enviando) return;
    const pend = this.pend(); const chaves = Object.keys(pend); if (!chaves.length) return;
    this.enviando = true; this.status('Sincronizando…');
    try {
      let lote = { itens: [], apagar: [] }, tam = 0, feitos = [];
      const manda = async () => {
        if (!lote.itens.length && !lote.apagar.length) return;
        const r = await fetch(this.API + '?op=enviar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lote) });
        if (!r.ok) throw new Error(r.status);
        const p = this.pend(); feitos.forEach(([k, em]) => { if (p[k] === em) delete p[k]; }); this.savePend(p);
        lote = { itens: [], apagar: [] }; tam = 0; feitos = [];
      };
      for (const k of chaves) {
        const em = pend[k]; const [t, ...rest] = k.split('/'); const id = rest.join('/');
        if (em < 0) { lote.apagar.push({ chave: k, em: -em }); }
        else {
          const obj = await DB.get(t, id);
          if (!obj) { lote.apagar.push({ chave: k, em: Date.now() }); }
          else { const s = JSON.stringify(obj).length; if (tam + s > 3_500_000) await manda(); lote.itens.push({ tipo: t, obj }); tam += s; }
        }
        feitos.push([k, em]);
      }
      await manda();
      this.status('Sincronizado às ' + this.hora());
    } catch (e) { this.status('Sem conexão: salvo neste aparelho'); setTimeout(() => this.enviar(), 30000); }
    this.enviando = false;
    if (Object.keys(this.pend()).length && !this._again) { this._again = true; setTimeout(() => { this._again = false; this.enviar(); }, 1500); }
  }
};
