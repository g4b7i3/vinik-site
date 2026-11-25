/* Universo: fichário de personagens, lugares, objetos, grupos */
const UNIV_KINDS = { personagem: 'Personagem', lugar: 'Lugar', objeto: 'Objeto', grupo: 'Grupo ou família', criatura: 'Criatura', lore: 'História e regras do mundo' };
const UNIV_FIELDS = {
  personagem: ['Idade', 'Aparência', 'Cor dos olhos', 'O que quer', 'O que precisa (e não sabe)', 'Ferida / fantasma', 'A mentira em que acredita', 'Contradição', 'Sob pressão', 'Como fala', 'Segredo'],
  lugar: ['Onde fica', 'Clima', 'Cheiros e sons', 'Quem vive ali', 'Importância na história'],
  objeto: ['Dono', 'Aparência', 'Origem', 'Poder ou função'],
  grupo: ['Líder', 'Membros', 'Objetivo', 'Símbolo'],
  criatura: ['Aparência', 'Habitat', 'Comportamento', 'Fraqueza'],
  lore: ['Resumo', 'Regras', 'Exceções']
};

const Universo = App.views.universo = {
  fichas: [], sel: null, filter: 'todos', q: '',
  namesOf(f) { return [f.name, ...(f.aliases || '').split(',').map(s => s.trim())].filter(s => s && s.length > 1); },
  mentions(lowText, name) { const n = name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return new RegExp('(?<![\\p{L}])' + n + '(?![\\p{L}])', 'u').test(lowText); },
  countIn(lowText, name) { const n = name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return (lowText.match(new RegExp('(?<![\\p{L}])' + n + '(?![\\p{L}])', 'gu')) || []).length; },
  async render(v, top) {
    this.fichas = (await DB.byBook('fichas', App.book.id)).sort((a, b) => a.name.localeCompare(b.name));
    top.innerHTML = `<h2>Universo</h2><input type="search" id="uq" placeholder="Buscar por nome, apelido, texto" style="max-width:280px" value="${esc(this.q)}"><button class="btn sm" id="unew">${ic('plus')} Nova ficha</button><button class="btn pri sm" id="uguia">${ic('plus')} Criar personagem com guia</button>`;
    v.style.overflow = 'hidden';
    v.innerHTML = `<div class="u-wrap ${this.sel ? '' : 'closed'}" id="uw" style="height:100%"><div class="u-list pad" id="ul"></div><div class="u-edit ${this.sel ? '' : 'hide'}" id="ue"></div></div>`;
    $('#uq').oninput = e => { this.q = e.target.value; this.renderList(); };
    $('#unew').onclick = () => this.newFicha();
    $('#uguia').onclick = () => NorteUI.criarPersonagem('', f => { this.sel = f.id; App.go('universo'); });
    this.renderList();
    if (this.sel) { const f = this.fichas.find(x => x.id === this.sel); f ? this.edit(f) : this.close(); }
  },
  leave() { this.saveNow?.(); $('#view').style.overflow = ''; },
  renderList() {
    const q = this.q.toLowerCase();
    const list = this.fichas.filter(f => (this.filter === 'todos' || f.kind === this.filter) && (!q || JSON.stringify([f.name, f.aliases, f.role, f.summary, f.fields, f.tags]).toLowerCase().includes(q)));
    const counts = {}; this.fichas.forEach(f => counts[f.kind] = (counts[f.kind] || 0) + 1);
    const groups = {};
    list.forEach(f => { const g = (f.tags || '').split(',')[0].trim() || UNIV_KINDS[f.kind]; (groups[g] = groups[g] || []).push(f); });
    $('#ul').innerHTML = (this.q || this.filter !== 'todos' ? '' : NorteUI.sugestoesHTML(this.fichas)) + `<div class="row" style="margin-bottom:18px"><div class="seg" style="flex-wrap:wrap">${[['todos', 'Tudo', this.fichas.length], ...Object.entries(UNIV_KINDS).filter(([k]) => counts[k]).map(([k, l]) => [k, l.split(' ')[0], counts[k]])].map(([k, l, n]) => `<button data-k="${k}" class="${this.filter === k ? 'on' : ''}">${l} <span style="opacity:.6">${n}</span></button>`).join('')}</div></div>
      ${!this.fichas.length ? `<div class="empty"><h3>O fichário está vazio</h3><p>Cada personagem, lugar ou objeto ganha uma página com retrato e os campos que você quiser. Depois, enquanto escreve, ela fica a um toque no painel lateral do Manuscrito.</p><button class="btn pri" id="ufirst">${ic('plus')} Criar o protagonista com guia</button></div>` : ''}
      ${Object.entries(groups).map(([g, fs]) => `<div class="sectitle" style="margin-top:8px"><h3>${esc(g)}</h3><span class="muted small">${fs.length}</span></div><div class="fgrid">${fs.map(f => `<button class="fcard ${this.sel === f.id ? 'on' : ''}" data-id="${f.id}"><div class="pic">${f.img ? `<img src="${f.img}" alt="">` : esc((f.name || '?')[0])}</div><div class="info"><b>${esc(f.name)}</b><small>${esc(f.role || UNIV_KINDS[f.kind])}</small></div></button>`).join('')}</div>`).join('')}`;
    $$('#ul [data-k]').forEach(b => b.onclick = () => { this.filter = b.dataset.k; this.renderList(); });
    $$('#ul [data-id]').forEach(b => b.onclick = () => this.edit(this.fichas.find(f => f.id === b.dataset.id)));
    $('#ufirst') && ($('#ufirst').onclick = () => NorteUI.criarPersonagem('protagonista', f => { this.sel = f.id; App.go('universo'); }));
    $$('#ul [data-criar]').forEach(b => b.onclick = () => NorteUI.criarPersonagem(b.dataset.criar, f => { this.sel = f.id; App.go('universo'); }));
    $$('#ul [data-abrir]').forEach(b => b.onclick = () => this.edit(this.fichas.find(f => f.id === b.dataset.abrir)));
    $$('#ul [data-disp]').forEach(b => b.onclick = async () => { App.book.sugDispensadas = [...(App.book.sugDispensadas || []), b.dataset.disp]; await App.saveBook(); this.renderList(); });
  },
  async newFicha(kind = 'personagem') {
    const k = this.filter !== 'todos' ? this.filter : kind;
    const f = { id: DB.uid(), bookId: App.book.id, kind: k, name: 'Nova ficha', aliases: '', role: '', summary: '', tags: '', img: '', fields: UNIV_FIELDS[k].map(x => ({ k: x, v: '' })) };
    await DB.put('fichas', f); this.fichas.push(f); this.renderList(); this.edit(f);
    setTimeout(() => { $('#fname')?.select(); }, 50);
  },
  close() { this.sel = null; $('#ue').classList.add('hide'); $('#uw').classList.add('closed'); this.renderList(); },
  async edit(f) {
    this.sel = f.id; $('#uw').classList.remove('closed'); const ue = $('#ue'); ue.classList.remove('hide');
    $$('#ul .fcard').forEach(c => c.classList.toggle('on', c.dataset.id === f.id));
    const chs = await App.chapters();
    ue.innerHTML = `<div class="pad" style="display:flex;flex-direction:column;gap:14px">
      <div class="row" style="justify-content:space-between"><select id="fkind" style="width:auto">${Object.entries(UNIV_KINDS).map(([k, l]) => `<option value="${k}" ${f.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select><button class="iconbtn" id="fclose" title="Fechar">${ic('x')}</button></div>
      <button class="portrait" id="fpic" title="Trocar retrato">${f.img ? `<img src="${f.img}" alt="">` : `<span>${ic('img')}<br><span class="small">Pôr retrato</span></span>`}</button>
      <input type="text" id="fname" value="${esc(f.name)}" style="font-family:var(--disp);font-size:24px;font-weight:600;border-color:transparent;padding:4px 0" aria-label="Nome">
      <div class="grid2"><label class="f">Papel na história<input type="text" id="frole" value="${esc(f.role || '')}" placeholder="protagonista, mentor, cidade natal"></label><label class="f">Apelidos (separe por vírgula)<input type="text" id="falias" value="${esc(f.aliases || '')}"></label></div>
      ${f.kind === 'personagem' ? `<label class="f">Função na história<select id="fpapel"><option value="">— ainda não sei</option>${Object.entries(NORTE.PAPEIS).map(([k, p]) => `<option value="${k}" ${f.papel === k ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></label><p class="small muted" id="fpapeld" style="margin:-6px 0 0">${f.papel && NORTE.PAPEIS[f.papel] ? esc(NORTE.PAPEIS[f.papel].desc) + NorteUI.fonte(NORTE.PAPEIS[f.papel].fonte) : ''}</p>` : ''}
      <label class="f">Grupo ou etiqueta<input type="text" id="ftags" value="${esc(f.tags || '')}" placeholder="família Silva, Santene, núcleo do porto"></label>
      <label class="f">Resumo<textarea id="fsum" style="min-height:110px">${esc(f.summary || '')}</textarea></label>
      <div><b class="small">Campos</b><div id="ffields" style="display:flex;flex-direction:column;gap:6px;margin-top:6px">${(f.fields || []).map((x, i) => { const r = NORTE.ROTEIRO.find(q => q.k === x.k); const d = NORTE.dicaCampo(x.k); return `<div class="fieldrow"><input type="text" data-fk="${i}" value="${esc(x.k)}" style="font-weight:600;font-size:14px"><textarea data-fv="${i}" style="min-height:40px;font-size:15px" placeholder="${esc(r ? r.p : '')}">${esc(x.v)}</textarea><button class="iconbtn" data-fd="${i}" title="Tirar campo">${ic('x')}</button>${r || d ? `<div class="fhint">${esc(r ? r.dica : d.t)} — ${esc(r ? r.fonte : d.f)}</div>` : ''}</div>`; }).join('')}</div>
        <button class="btn sm" id="faddf" style="margin-top:8px">${ic('plus')} Campo</button></div>
      ${f.kind === 'personagem' ? `<div class="ncard"><div class="row" style="justify-content:space-between"><b class="small">Perguntas para aprofundar</b><button class="btn sm ghost" id="fqmais">Outras</button></div><div class="perguntas" id="fqs" style="margin-top:8px"></div><span class="fonte">Responda as que acenderem algo; "+ campo" guarda a pergunta na ficha.</span></div>` : ''}
      ${f.kind === 'personagem' ? `<label class="f">Sai de cena (morre, parte) no capítulo<select id="fexit"><option value="">— continua na história</option>${chs.map(c => `<option value="${c.id}" ${f.exitChapter === c.id ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</select></label>` : ''}
      <div id="fapp"></div>
      <div class="row" style="justify-content:space-between"><button class="btn sm danger" id="fdel">${ic('trash')} Excluir ficha</button><span class="small muted" id="fsaved"></span></div>
    </div>`;
    const collect = () => {
      f.kind = $('#fkind').value; f.name = $('#fname').value.trim() || 'Sem nome'; f.role = $('#frole').value; f.aliases = $('#falias').value; f.tags = $('#ftags').value; f.summary = $('#fsum').value;
      f.fields = $$('#ffields .fieldrow').map(r => ({ k: $('[data-fk]', r).value, v: $('[data-fv]', r).value }));
      if ($('#fexit')) f.exitChapter = $('#fexit').value;
      if ($('#fpapel')) f.papel = $('#fpapel').value;
    };
    const save = debounce(async () => { collect(); await DB.put('fichas', f); if ($('#fsaved')) $('#fsaved').textContent = 'Salvo'; if ($('#ul')) this.renderListLight(f); }, 500);
    this.saveNow = () => save.flush();
    $$('#ue input,#ue textarea,#ue select').forEach(el => el.addEventListener('input', save));
    $('#fkind').onchange = () => { save.flush(); };
    $('#fclose').onclick = () => { save.flush(); this.close(); };
    $('#fpic').onclick = async () => { const file = await App.pickFile('image/*'); if (!file) return; f.img = await App.shrinkImage(file, 700); await DB.put('fichas', f); this.edit(f); this.renderList(); };
    $('#faddf').onclick = async () => { collect(); f.fields.push({ k: 'Novo campo', v: '' }); await DB.put('fichas', f); this.edit(f); setTimeout(() => $$('#ffields [data-fk]').at(-1)?.select(), 30); };
    $$('[data-fd]').forEach(b => b.onclick = async () => { collect(); f.fields.splice(+b.dataset.fd, 1); await DB.put('fichas', f); this.edit(f); });
    $('#fdel').onclick = async () => { if (!await App.confirm(`Excluir a ficha "${f.name}"?`, 'Excluir')) return; await DB.del('fichas', f.id); this.fichas = this.fichas.filter(x => x !== f); this.close(); };
    if ($('#fqs')) {
      const qs = () => { $('#fqs').innerHTML = NORTE.sorteia(NORTE.PERGUNTAS, 3).map(q => `<div class="q"><span>${esc(q)}</span><button class="btn sm ghost" data-qf="${esc(q)}">+ campo</button></div>`).join(''); $$('#fqs [data-qf]').forEach(b => b.onclick = async () => { collect(); f.fields.push({ k: b.dataset.qf, v: '' }); await DB.put('fichas', f); this.edit(f); }); };
      qs(); $('#fqmais').onclick = qs;
    }
    $('#fpapel') && $('#fpapel').addEventListener('change', () => { const p = NORTE.PAPEIS[$('#fpapel').value]; $('#fpapeld').innerHTML = p ? esc(p.desc) + NorteUI.fonte(p.fonte) : ''; });
    this.appearances(f, chs);
  },
  renderListLight(f) { const c = $(`#ul [data-id="${f.id}"]`); if (c) { $('b', c).textContent = f.name; $('small', c).textContent = f.role || UNIV_KINDS[f.kind]; if (!f.img) $('.pic', c).textContent = (f.name || '?')[0]; } },
  /* checa olhos e cabelo do capítulo contra a ficha */
  TRAITS: [
    { field: /olho/i, trigger: /\bolhos?\b/i, colors: { azul: /\bazu(l|is)\b/, verde: /\bverdes?\b/, castanho: /\bcastanh[oa]s?\b/, preto: /\b(pret|negr)[oa]s?\b/, cinza: /\b(cinza|cinzent[oa]s?|acinzentad[oa]s?)\b/, mel: /\b(cor de mel|mel)\b/, 'âmbar': /âmbar/, violeta: /\bviolet[ao]s?\b/, vermelho: /\bvermelh[oa]s?\b/ }, label: 'olhos' },
    { field: /cabel/i, trigger: /\b(cabelos?|fios|mechas?|cachos)\b/i, colors: { loiro: /\b(loir|lour)[oa]s?\b/, ruivo: /\bruiv[oa]s?\b/, castanho: /\bcastanh[oa]s?\b/, preto: /\b(pret|negr)[oa]s?\b/, grisalho: /\bgrisalh[oa]s?\b/, branco: /\bbranc[oa]s?\b/ }, label: 'cabelo' }
  ],
  continuity(f, chs) {
    const warns = []; const names = this.namesOf(f).map(n => n.toLowerCase()); if (!names.length) return warns;
    for (const t of this.TRAITS) {
      const fld = (f.fields || []).find(x => t.field.test(x.k) && x.v.trim()); if (!fld) continue;
      const val = fld.v.toLowerCase(); const mine = Object.keys(t.colors).filter(c => t.colors[c].test(val)); if (!mine.length) continue;
      for (const c of chs) {
        const sents = textOf(c.html).split(/(?<=[.!?…])\s+|\n+/).filter(x => x.trim());
        sents.forEach((s, i) => {
          const low = s.toLowerCase(); const prev = (sents[i - 1] || '').toLowerCase();
          if (!t.trigger.test(low) || !names.some(n => this.mentions(low, n) || this.mentions(prev, n))) return;
          const m = low.match(new RegExp(t.trigger.source + '(\\s+\\S+){0,4}', 'i')); if (!m) return;
          const near = m[0]; const found = Object.keys(t.colors).filter(k => t.colors[k].test(near));
          if (found.length && !found.some(k => mine.includes(k))) warns.push({ chapter: c, snip: s.trim().slice(0, 160), msg: `na ficha, ${t.label} ${fld.v.trim()}; em “${c.title}” aparece ${found.join(', ')}.` });
        });
      }
    }
    return warns;
  },
  appearances(f, chs) {
    const names = this.namesOf(f);
    const rows = chs.map((c, i) => { const low = textOf(c.html).toLowerCase(); const n = names.reduce((s, nm) => s + this.countIn(low, nm), 0); return { c, i, n }; }).filter(x => x.n);
    let warn = '';
    if (f.exitChapter) {
      const ei = chs.findIndex(c => c.id === f.exitChapter);
      const after = rows.filter(r => r.i > ei);
      if (after.length) warn = `<div class="warnbox">Continuidade: ${esc(f.name)} sai de cena em “${esc(chs[ei].title)}”, mas o nome aparece depois em ${after.map(r => '“' + esc(r.c.title) + '”').join(', ')}. Pode ser lembrança de outro personagem; vale conferir.</div>`;
    }
    this.continuity(f, chs).forEach(w => warn += `<div class="warnbox">Continuidade: ${esc(w.msg)}<br><i class="small">“${esc(w.snip)}”</i></div>`);
    $('#fapp').innerHTML = `<b class="small">Aparece em</b><div class="appear" style="margin-top:6px">${rows.map(r => `<button class="chip" data-go="${r.c.id}">${esc(r.c.title)} · ${r.n}</button>`).join('') || '<span class="small muted">Ainda não citado no manuscrito.</span>'}</div>${warn}`;
    $$('#fapp [data-go]').forEach(b => b.onclick = async () => { App.book.lastChapter = b.dataset.go; await App.go('manuscrito'); Manuscrito.highlight(f.name, 'find'); });
  },
  /* edição rápida a partir do Manuscrito */
  quick(f, done) {
    const isNew = !f;
    f = f || { id: DB.uid(), bookId: App.book.id, kind: 'personagem', name: '', aliases: '', role: '', summary: '', tags: '', img: '', fields: UNIV_FIELDS.personagem.slice(0, 4).map(k => ({ k, v: '' })) };
    const m = App.modal(`<div class="row" style="align-items:flex-start;flex-wrap:nowrap">
        <button class="portrait" id="qpic" style="width:110px;aspect-ratio:4/5;flex:none">${f.img ? `<img src="${f.img}" alt="">` : ic('img')}</button>
        <div style="flex:1;display:flex;flex-direction:column;gap:8px"><input type="text" id="qn" value="${esc(f.name)}" placeholder="Nome" style="font-family:var(--disp);font-size:20px;font-weight:600">
        <select id="qk">${Object.entries(UNIV_KINDS).map(([k, l]) => `<option value="${k}" ${f.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <input type="text" id="qr" value="${esc(f.role || '')}" placeholder="Papel na história"></div></div>
      <textarea id="qs" placeholder="Resumo">${esc(f.summary || '')}</textarea>
      ${(f.fields || []).map((x, i) => `<label class="f">${esc(x.k)}<input type="text" data-q="${i}" value="${esc(x.v)}"></label>`).join('')}
      <div class="acts"><button class="btn" data-close>Fechar</button><button class="btn pri" id="qok">Salvar</button></div>`);
    $('#qpic', m).onclick = async () => { const file = await App.pickFile('image/*'); if (!file) return; f.img = await App.shrinkImage(file, 700); $('#qpic', m).innerHTML = `<img src="${f.img}" alt="">`; };
    $('#qok', m).onclick = async () => {
      f.name = $('#qn', m).value.trim() || 'Sem nome'; f.kind = $('#qk', m).value; f.role = $('#qr', m).value; f.summary = $('#qs', m).value;
      $$('[data-q]', m).forEach(i => f.fields[+i.dataset.q].v = i.value);
      await DB.put('fichas', f); m.close(); App.toast(isNew ? 'Ficha criada' : 'Ficha salva'); done?.();
    };
  }
};
