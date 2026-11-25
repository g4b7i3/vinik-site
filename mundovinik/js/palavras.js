/* Banco de palavras: ideias afins tiradas do dicionário analógico do Vinik.
   O arquivo fica na parte privada do site e numa cópia em cada aparelho. */
const Banco = {
  dados: null, carregando: null,
  async ler(buf) {
    const ds = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    return JSON.parse(await new Response(ds).text());
  },
  async carregar() {
    if (this.dados) return this.dados;
    if (this.carregando) return this.carregando;
    this.carregando = (async () => {
      try { const l = await DB.get('meta', 'banco'); if (l?.data) { this.dados = await this.ler(l.data); return this.dados; } } catch (e) { }
      try {
        const r = await fetch('api/dados?op=banco', { cache: 'no-store' });
        if (r.ok && (r.headers.get('content-type') || '').includes('gzip')) {
          const buf = await r.arrayBuffer(); this.dados = await this.ler(buf);
          try { await DB.putRaw('meta', { id: 'banco', data: buf, em: Date.now() }); } catch (e) { }
          return this.dados;
        }
      } catch (e) { }
      return null;
    })();
    const d = await this.carregando; this.carregando = null; return d;
  },
  async subir() {
    const f = await App.pickFile('.gz,application/gzip'); if (!f) return false;
    const buf = await f.arrayBuffer();
    try { this.dados = await this.ler(buf); } catch (e) { App.toast('Esse arquivo não é o banco de palavras (.json.gz)'); return false; }
    try { await DB.putRaw('meta', { id: 'banco', data: buf, em: Date.now() }); } catch (e) { }
    try {
      const r = await fetch('api/dados?op=banco', { method: 'PUT', headers: { 'Content-Type': 'application/gzip' }, body: buf });
      App.toast(r.ok ? 'Banco de palavras carregado neste aparelho e no site' : 'Carregado neste aparelho (o site não recebeu: ' + r.status + ')', 4000);
    } catch (e) { App.toast('Carregado neste aparelho; o site recebe quando houver internet'); }
    return true;
  },
  IRREG: { vinha: 'vir', vinham: 'vir', veio: 'vir', vieram: 'vir', vem: 'vir', tinha: 'ter', tinham: 'ter', teve: 'ter', tem: 'ter', era: 'ser', eram: 'ser', foi: 'ir', foram: 'ir', fez: 'fazer', fazia: 'fazer', fizeram: 'fazer', disse: 'dizer', dizia: 'dizer', disseram: 'dizer', viu: 'ver', via: 'ver', viram: 'ver', pôs: 'pôr', punha: 'pôr', deu: 'dar', dava: 'dar', quis: 'querer', queria: 'querer', pôde: 'poder', podia: 'poder', soube: 'saber', sabia: 'saber', trouxe: 'trazer', trazia: 'trazer', ouviu: 'ouvir', ouvia: 'ouvir', saiu: 'sair', saía: 'sair', caiu: 'cair', caía: 'cair', riu: 'rir', ria: 'rir', perdeu: 'perder', disseste: 'dizer' },
  formas(w) {
    w = w.toLowerCase().trim(); const out = this.IRREG[w] ? [this.IRREG[w], w] : [w];
    const add = x => { if (x && x.length > 2 && !out.includes(x)) out.push(x); };
    const r = (re, ...subs) => { if (re.test(w)) subs.forEach(s => add(w.replace(re, s))); };
    r(/mente$/, ''); if (/mente$/.test(w)) { const b = w.replace(/mente$/, ''); add(b.replace(/a$/, 'o')); }
    r(/ões$/, 'ão'); r(/ães$/, 'ão'); r(/is$/, 'l'); r(/eis$/, 'el'); r(/ns$/, 'm'); r(/es$/, ''); r(/s$/, '');
    const w0 = out[out.length - 1]; if (/as?$/.test(w)) add(w.replace(/as?$/, 'o'));
    r(/ou$/, 'ar'); r(/aram$/, 'ar'); r(/ava(m)?$/, 'ar'); r(/ando$/, 'ar'); r(/ad[oa]s?$/, 'ar'); r(/ara(m)?$/, 'ar'); r(/ei$/, 'ar'); r(/amos$/, 'ar'); r(/(a|e|o)u$/, '$1r');
    r(/eu$/, 'er'); r(/iu$/, 'ir'); r(/eram$/, 'er'); r(/iram$/, 'ir'); r(/ia(m)?$/, 'er', 'ir'); r(/endo$/, 'er'); r(/indo$/, 'ir'); r(/id[oa]s?$/, 'er', 'ir'); r(/era(m)?$/, 'er'); r(/ira(m)?$/, 'ir');
    r(/(a|e|i)$/, '$1r'); r(/o$/, 'ar');
    r(/ou-se$/, 'ar-se'); r(/eu-se$/, 'er-se'); r(/iu-se$/, 'ir-se');
    return out;
  },
  buscar(palavra) {
    const d = this.dados; if (!d) return [];
    const vistos = new Set(), out = [];
    for (const f of this.formas(palavra)) {
      const hits = d.idx[f]; if (!hits) continue;
      for (const [ci, tipo] of hits.slice().sort((a, b) => a[2] - b[2]).slice(0, 3)) {
        if (vistos.has(ci + tipo)) continue; vistos.add(ci + tipo);
        const c = d.cats[ci]; const lista = (c[tipo] || []).filter(x => x.toLowerCase() !== f).slice(0, 18);
        if (lista.length) out.push({ forma: f, titulo: c.t || '', tipo: { S: 'substantivos', V: 'verbos', A: 'adjetivos', D: 'advérbios' }[tipo], palavras: lista });
      }
      if (out.length >= 5) break;
    }
    return out.slice(0, 5);
  },
  /* popover de trocas para uma palavra marcada ou selecionada */
  async pop(alvo, palavra, aoEscolher) {
    $('.pop')?.remove();
    const desk = $('#desk'); const r = alvo.getBoundingClientRect(), dr = desk.getBoundingClientRect();
    const pop = document.createElement('div'); pop.className = 'pop'; pop.style.width = '320px';
    pop.style.left = Math.max(8, Math.min(r.left - dr.left, dr.width - 330)) + 'px'; pop.style.top = (r.bottom - dr.top + desk.scrollTop + 6) + 'px';
    desk.style.position = 'relative'; desk.appendChild(pop);
    const vaga = OFICIO.VAGAS[palavra.toLowerCase()];
    const sin = SINONIMOS[palavra.toLowerCase()];
    pop.innerHTML = `<div class="row" style="justify-content:space-between"><b style="font-family:var(--disp);font-size:18px">${esc(palavra)}</b><button class="iconbtn" data-x aria-label="Fechar">${ic('x')}</button></div>${vaga ? `<p class="small" style="margin:4px 0 8px;color:var(--coral)">${esc(vaga)}</p>` : ''}<div id="bancoTrocas"><p class="small muted">Procurando no banco…</p></div>`;
    $('[data-x]', pop).onclick = () => pop.remove();
    setTimeout(() => addEventListener('mousedown', function f(e) { if (!pop.contains(e.target)) { pop.remove(); removeEventListener('mousedown', f); } }), 10);
    const d = await this.carregar();
    const grupos = this.buscar(palavra);
    const box = $('#bancoTrocas', pop); if (!box) return;
    let html = '';
    if (sin) html += `<div class="small muted" style="margin-top:4px">Sinônimos de uso frequente</div><div class="row" style="gap:6px;margin:4px 0 8px">${sin.map(x => `<button class="chip" data-s="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;
    grupos.forEach(g => { html += `<div class="small muted" style="margin-top:6px">${esc(g.titulo)} · ${g.tipo}${g.forma !== palavra.toLowerCase() ? ' (de “' + esc(g.forma) + '”)' : ''}</div><div class="row" style="gap:6px;margin:4px 0">${g.palavras.map(x => `<button class="chip" data-s="${esc(x)}">${esc(x)}</button>`).join('')}</div>`; });
    if (!d) html += `<p class="small muted">O banco de palavras ainda não foi carregado. <button class="btn sm" data-sobe>Carregar banco</button></p>`;
    else if (!grupos.length && !sin) html += '<p class="small muted">Não achei essa palavra no banco. Tente a forma de dicionário (o infinitivo, o masculino singular).</p>';
    if (grupos.length) html += '<p class="small muted" style="margin:8px 0 0">As trocas vêm na forma de dicionário; ajuste o tempo do verbo e o plural ao colar. Fonte: dicionário analógico de F. F. dos Santos Azevedo.</p>';
    box.innerHTML = html;
    $('[data-sobe]', pop) && ($('[data-sobe]', pop).onclick = async () => { if (await this.subir()) this.pop(alvo, palavra, aoEscolher); });
    $$('[data-s]', pop).forEach(b => b.onclick = () => { let t = b.dataset.s; if (palavra[0] === palavra[0].toUpperCase() && palavra[0] !== palavra[0].toLowerCase()) t = t[0].toUpperCase() + t.slice(1); aoEscolher(t); pop.remove(); });
  }
};
