/* Telas do Norte: painel do livro, catálogo de técnicas, criador guiado, estruturas e viradas */
const NorteUI = {
  fonte: f => f ? `<span class="fonte">${esc(f)}</span>` : '',

  /* ---------- gênero e técnicas do livro ---------- */
  escolherGenero(depois) {
    const b = App.book;
    const m = App.modal(`<h2>Gênero do livro</h2><p class="muted" style="margin:0">O app usa o gênero para lembrar o que o leitor espera, sugerir viradas e orientar o Claude. Dá para trocar quando quiser, ou deixar sem.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">${OFICIO.GENEROS.map(g => `<button class="card gpick ${b.generoId === g.id ? 'on' : ''}" data-g="${g.id}" style="text-align:left;padding:12px"><b>${esc(g.nome)}</b><div class="small muted" style="margin-top:4px">${esc(g.promessa)}</div></button>`).join('')}</div>
      <div class="acts"><button class="btn ghost" id="gsem" style="margin-right:auto">Sem gênero</button><button class="btn" data-close>Fechar</button></div>`, { wide: true });
    const set = async id => { b.generoId = id; if (id && !b.genre) b.genre = OFICIO.generoDe(b).nome; await App.saveBook(); m.close(); App.toast(id ? 'Gênero: ' + OFICIO.generoDe(b).nome : 'Sem gênero'); depois?.(); };
    $$('[data-g]', m).forEach(x => x.onclick = () => set(x.dataset.g));
    $('#gsem', m).onclick = () => set(null);
  },
  catalogo(depois) {
    const b = App.book; b.tecnicas = b.tecnicas || [];
    let cat = 'Todas', q = '';
    const m = App.modal(`<h2>Técnicas</h2><p class="muted" style="margin:0">Marque as que quer usar neste livro. Elas aparecem como lembrete no painel Norte, ao lado do texto. Nenhuma é obrigatória.</p>
      <input type="search" id="tq" placeholder="Buscar técnica"><div class="row" id="tcats" style="gap:6px"></div><div id="tlist" style="display:flex;flex-direction:column;gap:8px"></div>
      <div class="acts"><button class="btn pri" data-close>Pronto</button></div>`, { wide: true });
    const draw = () => {
      $('#tcats', m).innerHTML = ['Todas', 'No livro', ...OFICIO.CATS].map(c => `<button class="chip ${cat === c ? 'chipon' : ''}" data-c="${c}">${c}</button>`).join('');
      $$('[data-c]', m).forEach(x => x.onclick = () => { cat = x.dataset.c; draw(); });
      const lista = OFICIO.TECNICAS.filter(t => (cat === 'Todas' || (cat === 'No livro' ? b.tecnicas.includes(t.id) : t.cat === cat)) && (!q || (t.nome + t.como + t.fonte).toLowerCase().includes(q)));
      $('#tlist', m).innerHTML = lista.map(t => { const on = b.tecnicas.includes(t.id); return `<div class="card" style="padding:12px 14px;${on ? 'border-color:var(--cobalt);background:var(--cobalt-l)' : ''}"><div class="row" style="justify-content:space-between;flex-wrap:nowrap;align-items:flex-start"><div><b>${esc(t.nome)}</b> <span class="small muted">${esc(t.cat)}</span><div style="margin-top:4px;font-size:15px">${esc(t.como)}</div>${this.fonte(t.fonte)}</div><button class="btn sm ${on ? '' : 'pri'}" data-t="${t.id}" style="flex:none">${on ? 'Tirar' : 'Usar neste livro'}</button></div></div>`; }).join('') || '<p class="muted">Nada aqui.</p>';
      $$('[data-t]', m).forEach(x => x.onclick = async () => { const id = x.dataset.t; b.tecnicas = b.tecnicas.includes(id) ? b.tecnicas.filter(i => i !== id) : [...b.tecnicas, id]; await App.saveBook(); draw(); depois?.(); });
    };
    $('#tq', m).oninput = e => { q = e.target.value.toLowerCase(); draw(); };
    draw();
  },

  /* ---------- painel Norte no manuscrito ---------- */
  async painel(body) {
    const b = App.book, M = Manuscrito, g = OFICIO.generoDe(b);
    b.tecnicas = b.tecnicas || []; b.cenasOk = b.cenasOk || {};
    // Salve o gato: em que ponto do livro está o capítulo aberto
    let gato = '';
    const meta = b.goalWords || 0;
    if (meta) {
      let antes = 0; for (const c of M.chs) { if (c === M.cur) break; antes += c.words || 0; }
      const meio = antes + (M.cur.words || 0) / 2; const pct = Math.min(100, meio / meta * 100);
      const bat = OFICIO.batidaEm(pct); const prox = OFICIO.BATIDAS.find(x => x[1] > pct);
      gato = `<div class="ncard"><div class="row" style="justify-content:space-between"><b class="small">Salve o gato</b><span class="small muted">${pct.toFixed(0)}% do livro</span></div>
        <div class="bar" style="margin:8px 0"><i style="width:${pct}%"></i></div>
        <div><b>${esc(bat[0])}</b> <span class="small muted">(${bat[1]}–${bat[2]}%)</span><div class="small">${esc(bat[3])}</div></div>
        ${prox ? `<div class="small muted" style="margin-top:6px">Próxima: ${esc(prox[0])}, por volta da palavra ${nf(Math.round(meta * prox[1] / 100))}.</div>` : ''}
        ${this.fonte('Blake Snyder; Jessica Brody. Porcentagens de referência, não regra.')}</div>`;
    } else gato = `<div class="ncard small muted">Ponha uma meta de palavras no livro (Biblioteca → engrenagem) para ver em que batida do Salve o gato cada capítulo está.</div>`;
    const tec = b.tecnicas.map(id => OFICIO.tecnica(id)).filter(Boolean);
    body.innerHTML = `
      <div class="ncard"><div class="row" style="justify-content:space-between"><b class="small">Gênero</b><button class="btn sm ghost" id="ngen">${g ? 'Trocar' : 'Escolher'}</button></div>
        ${g ? `<div style="margin-top:4px"><b>${esc(g.nome)}</b><div class="small">${esc(g.promessa)}</div></div>
        <div class="small muted" style="margin-top:8px">O que o leitor espera (marque quando estiver no livro)</div>
        ${g.cenas.map((c, i) => `<label class="row small" style="gap:8px;flex-wrap:nowrap;align-items:flex-start;margin-top:4px"><input type="checkbox" data-cena="${i}" ${(b.cenasOk[g.id] || []).includes(i) ? 'checked' : ''}> <span>${esc(c)}</span></label>`).join('')}
        <details style="margin-top:8px"><summary class="small" style="cursor:pointer">Armadilhas e dicas</summary>${g.armadilhas.map(a => `<p class="small" style="margin:6px 0">• ${esc(a)}</p>`).join('')}${g.dicas.map(([d, f]) => `<p class="small" style="margin:6px 0">${esc(d)}${this.fonte(f)}</p>`).join('')}</details>` : '<p class="small muted" style="margin:4px 0 0">Sem gênero escolhido.</p>'}
      </div>
      ${gato}
      <div class="ncard"><div class="row" style="justify-content:space-between"><b class="small">Técnicas deste livro</b><button class="btn sm ghost" id="ntec">Escolher</button></div>
        ${tec.length ? tec.map(t => `<div style="margin-top:8px"><b class="small">${esc(t.nome)}</b><div class="small">${esc(t.lembrete)}</div></div>`).join('') : '<p class="small muted" style="margin:4px 0 0">Nenhuma marcada. Veja o catálogo: jornada do herói, Salve o gato, cena e sequela, narrador não confiável e mais.</p>'}
      </div>
      <div class="ncard"><b class="small">Ideias para este capítulo</b><p class="small muted" style="margin:4px 0 8px">O Claude lê o capítulo, as fichas, o gênero e as técnicas marcadas, e devolve perguntas e caminhos. Ele não escreve o texto.</p>
        <button class="btn sm pri" id="nide">Pedir ideias</button><div id="nideres" style="margin-top:8px"></div></div>`;
    $('#ngen').onclick = () => this.escolherGenero(() => M.renderAside());
    $('#ntec').onclick = () => this.catalogo(() => M.renderAside());
    $$('[data-cena]').forEach(x => x.onchange = async () => { const l = new Set(b.cenasOk[g.id] || []); x.checked ? l.add(+x.dataset.cena) : l.delete(+x.dataset.cena); b.cenasOk[g.id] = [...l]; await App.saveBook(); });
    $('#nide').onclick = () => this.ideias($('#nideres'));
  },
  async contexto() {
    const b = App.book, g = OFICIO.generoDe(b);
    const fichas = await DB.byBook('fichas', b.id);
    const tec = (b.tecnicas || []).map(id => OFICIO.tecnica(id)?.nome).filter(Boolean);
    const elenco = fichas.filter(f => f.kind === 'personagem').map(f => `- ${f.name}${f.papel ? ' (' + (NORTE.PAPEIS[f.papel]?.nome || f.papel) + ')' : ''}${f.summary ? ': ' + f.summary : ''}${(f.fields || []).filter(x => x.v).slice(0, 6).map(x => ` · ${x.k}: ${x.v}`).join('')}`).join('\n');
    return `Livro: ${b.title}${g ? '\nGênero: ' + g.nome + ' (promessa ao leitor: ' + g.promessa + ')' : ''}${tec.length ? '\nTécnicas que o autor escolheu usar: ' + tec.join(', ') : ''}\nPersonagens:\n${elenco || '(sem fichas)'}`;
  },
  SYS_IDEIAS: `Você é um editor de ficção conversando com um escritor brasileiro sobre o livro dele. Seu papel é abrir caminhos, não escrever por ele.
Responda em português do Brasil, em texto simples, sem markdown pesado, neste formato:
PERGUNTAS
1. ... (3 perguntas que façam o autor descobrir algo sobre a cena ou os personagens)
CAMINHOS
1. ... (3 direções possíveis para a história a partir daqui; inclua pelo menos uma ousada, que fuja do óbvio do gênero)
CUIDADO
- ... (1 ponto frágil, se houver)
Quando uma ideia vier de um autor ou livro de escrita (McKee, Truby, Vogler, Snyder, King, Othon Garcia, Piglia, Cortázar, Aristóteles etc.), diga de onde vem entre parênteses. Não escreva frases do livro, não reescreva o texto do autor, não resuma o capítulo de volta. A arte é livre: as técnicas são ferramentas, não regras.`,
  async ideias(res) {
    const M = Manuscrito; await M.saveNow();
    const txt = Claude.textoCap(M.cur.html); const trecho = txt.length > 14000 ? txt.slice(-14000) : txt;
    res.innerHTML = '<p class="small muted">Lendo…</p>';
    try {
      const out = await Claude.chamar({ system: this.SYS_IDEIAS, max: 1500, texto: `${await this.contexto()}\n\nCapítulo aberto: ${M.cur.title}${M.cur.synopsis ? '\nSinopse do autor: ' + M.cur.synopsis : ''}\n\nTexto do capítulo (até aqui):\n${trecho || '(capítulo ainda vazio)'}`, onParcial: t => { res.innerHTML = `<div class="ideias">${esc(t)}</div>`; } });
      res.innerHTML = `<div class="ideias">${esc(out)}</div>`;
    } catch (e) { res.innerHTML = Claude.erroHTML(e); }
  },

  /* ---------- criador guiado de personagem ---------- */
  criarPersonagem(papel, depois) {
    const R = NORTE.ROTEIRO; let i = -1; const resp = {}; let nome = '', funcao = papel || '';
    const g = OFICIO.generoDe(App.book);
    const m = App.modal('<div id="wz"></div>', { wide: true });
    const draw = () => {
      const wz = $('#wz', m);
      if (i === -1) {
        wz.innerHTML = `<h2>Novo personagem</h2><p class="muted" style="margin:0">Oito perguntas, todas opcionais. Pule o que não souber; a ficha fica aberta para mudar depois.</p>
          <label class="f">Nome<input type="text" id="wn" value="${esc(nome)}"></label>
          <label class="f">Função na história<select id="wf"><option value="">— ainda não sei</option>${Object.entries(NORTE.PAPEIS).map(([k, p]) => `<option value="${k}" ${funcao === k ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></label>
          <p class="small muted" id="wfd" style="margin:0"></p>
          <div class="acts"><button class="btn" data-close>Cancelar</button><button class="btn pri" id="wgo">Começar</button></div>`;
        const desc = () => { const p = NORTE.PAPEIS[$('#wf', m).value]; $('#wfd', m).innerHTML = p ? esc(p.desc) + this.fonte(p.fonte) : ''; };
        $('#wf', m).onchange = desc; desc();
        $('#wgo', m).onclick = () => { nome = $('#wn', m).value.trim(); funcao = $('#wf', m).value; i = 0; draw(); };
        setTimeout(() => $('#wn', m)?.focus(), 30);
        return;
      }
      if (i >= R.length) return salvar();
      const r = R[i]; const pool = NORTE.POOLS[r.pool] || [];
      wz.innerHTML = `<div class="row" style="justify-content:space-between"><span class="small muted">${i + 1} de ${R.length}${nome ? ' · ' + esc(nome) : ''}</span><div class="bar" style="width:140px"><i style="width:${(i + 1) / R.length * 100}%"></i></div></div>
        <h2 style="margin-top:6px">${esc(r.k)}</h2><p style="margin:0">${esc(r.p)}</p><p class="small muted" style="margin:4px 0 0">${esc(r.dica)}${this.fonte(r.fonte)}</p>
        <textarea id="wv" style="min-height:110px">${esc(resp[r.k] || '')}</textarea>
        <div class="small muted">Ideias para destravar (toque para usar e depois mude do seu jeito)${g ? ' · gênero: ' + esc(g.nome) : ''}</div>
        <div class="row" id="wsug" style="gap:6px"></div><button class="btn sm ghost" id="wmais">Outras ideias</button>
        <div class="acts"><button class="btn ghost" id="wvolta" style="margin-right:auto">Voltar</button><button class="btn" id="wpula">Pular</button><button class="btn pri" id="wprox">${i === R.length - 1 ? 'Criar ficha' : 'Próxima'}</button></div>`;
      const sug = () => { $('#wsug', m).innerHTML = NORTE.sorteia(pool, 3).map(s => `<button class="chip" data-s="${esc(s)}" style="text-align:left">${esc(s)}</button>`).join(''); $$('[data-s]', m).forEach(x => x.onclick = () => { $('#wv', m).value = x.dataset.s; $('#wv', m).focus(); }); };
      sug(); $('#wmais', m).onclick = sug;
      const guarda = () => { const v = $('#wv', m).value.trim(); if (v) resp[r.k] = v; else delete resp[r.k]; };
      $('#wprox', m).onclick = () => { guarda(); i++; draw(); };
      $('#wpula', m).onclick = () => { i++; draw(); };
      $('#wvolta', m).onclick = () => { guarda(); i--; draw(); };
      setTimeout(() => $('#wv', m)?.focus(), 30);
    };
    const salvar = async () => {
      const f = { id: DB.uid(), bookId: App.book.id, kind: 'personagem', name: nome || 'Sem nome', papel: funcao, role: funcao ? NORTE.PAPEIS[funcao].nome.toLowerCase() : '', aliases: '', summary: '', tags: '', img: '',
        fields: [{ k: 'Idade', v: '' }, { k: 'Aparência', v: '' }, { k: 'Cor dos olhos', v: '' }, ...R.map(r => ({ k: r.k, v: resp[r.k] || '' }))] };
      await DB.put('fichas', f); m.close(); App.toast('Ficha criada: ' + f.name);
      depois ? depois(f) : (Universo.sel = f.id, App.go('universo'));
    };
    draw();
  },

  /* ---------- sugestões para o elenco (Universo) ---------- */
  sugestoesHTML(fichas) {
    const b = App.book; const disp = b.sugDispensadas || [];
    let sug = NORTE.sugestoesElenco(fichas, disp);
    const g = OFICIO.generoDe(b);
    if (g && fichas.some(f => f.kind === 'personagem')) {
      const extra = { policial: ['detetive', 'Quem investiga?', 'O policial precisa de alguém que olha diferente dos outros: o jeito de investigar é o personagem.', 'tradição do policial'], suspense: ['ameaca', 'Quem ameaça, e por quê?', 'O vilão de suspense precisa de uma razão que faça sentido para ele.', 'McKee, Story: "O princípio do antagonismo"'], terror: ['monstro', 'O que é o mal desta história?', 'Monstro na casa: o monstro, o lugar fechado e o pecado que o atraiu.', 'Snyder, Salve o gato!'], romance_amor: ['par', 'Quem é a contraparte?', 'O par precisa completar o que falta no protagonista, e ter vida própria.', 'Snyder, Salve o gato!'] }[g.id];
      if (extra && !disp.includes(extra[0]) && !fichas.some(f => f.genSug === extra[0])) sug.push({ id: extra[0], titulo: extra[1], texto: extra[2], fonte: extra[3], acao: { tipo: 'criar', papel: '' } });
    }
    sug = sug.slice(0, 4);
    if (!sug.length) return '';
    return `<div class="sugbox"><div class="row" style="justify-content:space-between"><b>O elenco pede</b><span class="small muted">sugestões, não regras</span></div>
      <div class="suggrid">${sug.map(s => `<div class="sug"><b>${esc(s.titulo)}</b><p>${esc(s.texto)}</p>${this.fonte(s.fonte)}<div class="row" style="gap:6px;margin-top:8px">${s.acao.tipo === 'criar' ? `<button class="btn sm pri" data-criar="${esc(s.acao.papel)}">Criar com guia</button>` : s.acao.tipo === 'ficha' ? `<button class="btn sm" data-abrir="${s.acao.id}">Abrir ficha</button>` : ''}<button class="btn sm ghost" data-disp="${s.id}">Agora não</button></div></div>`).join('')}</div></div>`;
  },

  /* ---------- enredo: estruturas, viradas, checagem ---------- */
  estruturas(E) {
    const lista = [...NORTE.ESTRUTURAS.filter(x => x.id !== 'gato'), { id: 'gato', nome: 'Salve o gato (com porcentagens)', fonte: 'Blake Snyder, Salve o gato!; Jessica Brody, Save the Cat! Writes a Novel', quando: 'Ritmo e proporção: cada batida vem com a faixa do livro em que costuma cair.', etapas: OFICIO.BATIDAS.map(b => [b[0], `${b[3]} (${b[1]}–${b[2]}%)`, b[1] < 20 ? 1 : b[1] < 80 ? 2 : 3]) }];
    const m = App.modal(`<h2>Estruturas</h2><p class="muted" style="margin:0">Escolha um molde para pôr no quadro. Os cards chegam com a pergunta de cada etapa; responda, apague, troque de ordem. A estrutura é mapa, não trilho.</p>
      <div style="display:flex;flex-direction:column;gap:8px">${lista.map(e => `<div class="card" style="padding:12px 14px"><div class="row" style="justify-content:space-between;flex-wrap:nowrap;align-items:flex-start"><div><b>${esc(e.nome)}</b> <span class="small muted">${e.etapas.length} etapas</span><div style="font-size:15px;margin-top:4px">${esc(e.quando)}</div>${this.fonte(e.fonte)}</div><button class="btn sm pri" data-e="${e.id}" style="flex:none">Pôr no quadro</button></div></div>`).join('')}</div>
      <div class="card" style="padding:12px 14px"><b>Os 10 tipos de história do Salve o gato</b><div class="small" style="margin-top:6px;columns:2;column-gap:20px">${OFICIO.TIPOS_GATO.map(([n, d]) => `<p style="margin:0 0 6px;break-inside:avoid"><b>${esc(n)}:</b> ${esc(d)}</p>`).join('')}</div>${this.fonte('Blake Snyder, Salve o gato!')}</div>
      <div class="acts"><button class="btn danger" id="tiramolde" style="margin-right:auto">Tirar cards de molde não respondidos</button><button class="btn" data-close>Fechar</button></div>`, { wide: true });
    $$('[data-e]', m).forEach(x => x.onclick = async () => { const e = lista.find(l => l.id === x.dataset.e); m.close(); await this.porEstrutura(E, e); });
    $('#tiramolde', m).onclick = async () => { const ms = E.cards.filter(c => c.guia); for (const c of ms) { await DB.del('cards', c.id); for (const l of E.links.filter(l => l.from === c.id || l.to === c.id)) { await DB.del('links', l.id); } } E.links = E.links.filter(l => !ms.some(c => c.id === l.from || c.id === l.to)); E.cards = E.cards.filter(c => !c.guia); m.close(); E.renderCards(); App.toast(ms.length + ' cards de molde tirados'); };
  },
  async porEstrutura(E, e) {
    const cores = { 1: '#2346a8', 2: '#b07a1f', 3: '#e8553a' };
    if (!App.book.relTypes.some(r => r.id === 'sequencia')) { App.book.relTypes.push({ id: 'sequencia', name: 'Sequência', color: '#8a93a8' }); await App.saveBook(); E.renderRels(); }
    const r = $('#board').getBoundingClientRect(); const base = E.toWorld({ clientX: r.left + 60, clientY: r.top + 120 });
    const maxY = E.cards.length ? Math.max(...E.cards.map(c => c.y)) + 260 : base.y;
    let prev = null;
    for (let i = 0; i < e.etapas.length; i++) {
      const [t, p, ato] = e.etapas[i];
      const c = { id: DB.uid(), bookId: App.book.id, title: t, text: p, color: cores[ato] || '#2346a8', guia: true, estrutura: e.id, x: Math.round(base.x + (i % 5) * 250), y: Math.round(Math.max(base.y, maxY) + Math.floor(i / 5) * 230) };
      E.cards.push(c); await DB.put('cards', c);
      if (prev) { const l = { id: DB.uid(), bookId: App.book.id, from: prev.id, to: c.id, type: 'sequencia' }; E.links.push(l); await DB.put('links', l); }
      prev = c;
    }
    $('.board .empty')?.remove(); E.renderCards(); E.fit(); App.toast(e.nome + ' no quadro');
  },
  virada(E) {
    const g = OFICIO.generoDe(App.book);
    const pool = [...NORTE.VIRADAS, ...(g ? g.viradas.map(v => [v, 'Viradas típicas de ' + g.nome.toLowerCase()]) : [])];
    const m = App.modal(`<h2>Sortear uma virada</h2><p class="muted" style="margin:0">Uma provocação para quando a história empaca. Leve a sério, distorça ou jogue fora.</p><div id="vbox"></div>
      <div class="acts"><button class="btn" data-close>Fechar</button><button class="btn" id="voutra">Outra</button><button class="btn pri" id="vpor">Pôr no quadro</button></div>`);
    let atual;
    const nova = () => { atual = pool[Math.floor(Math.random() * pool.length)]; $('#vbox', m).innerHTML = `<div class="card" style="font-family:var(--serif);font-size:20px;line-height:1.4">${esc(atual[0])}${this.fonte(atual[1])}</div>`; };
    nova(); $('#voutra', m).onclick = nova;
    $('#vpor', m).onclick = async () => { m.close(); await E.newCard({ title: 'E se…', text: atual[0], color: '#e8553a', virada: true }); };
  },
  async checar(E) {
    const fichas = await DB.byBook('fichas', App.book.id);
    const itens = NORTE.checarEnredo(E.cards, E.links, fichas);
    const g = OFICIO.generoDe(App.book);
    if (g) { const ok = (App.book.cenasOk || {})[g.id] || []; const faltam = g.cenas.filter((c, i) => !ok.includes(i)); if (faltam.length) itens.push([`O que o leitor de ${g.nome.toLowerCase()} espera`, faltam.slice(0, 4).join(' · ') + '. Marque no painel Norte do Manuscrito quando estiverem no livro, ou ignore se a quebra for de propósito.', 'convenções do gênero']); }
    const m = App.modal(`<h2>Checar o enredo</h2>
      ${itens.length ? itens.map(([t, d, f]) => `<div class="card" style="padding:12px 14px"><b>${esc(t)}</b><div style="font-size:15px;margin-top:4px">${esc(d)}</div>${this.fonte(f)}</div>`).join('') : '<p style="color:var(--ok)">Nada chamou atenção na checagem rápida.</p>'}
      <div class="card" style="padding:12px 14px"><b>Leitura do Claude</b><p class="small muted" style="margin:4px 0 8px">Ele lê o quadro, as fichas, o gênero e as técnicas e devolve perguntas e caminhos.</p><button class="btn sm pri" id="cq">Pedir leitura</button><div id="cqres" style="margin-top:8px"></div></div>
      <div class="acts"><button class="btn" data-close>Fechar</button></div>`, { wide: true });
    $('#cq', m).onclick = async () => {
      const res = $('#cqres', m); res.innerHTML = '<p class="small muted">Lendo…</p>';
      const nomeCard = c => c.title || fichas.find(f => f.id === c.fichaId)?.name || 'card';
      const quadro = E.cards.map(c => `- [${c.id.slice(-4)}] ${nomeCard(c)}${c.text ? ': ' + c.text : ''}`).join('\n');
      const lig = E.links.map(l => { const a = E.cards.find(c => c.id === l.from), b = E.cards.find(c => c.id === l.to); return a && b ? `- ${nomeCard(a)} → ${nomeCard(b)} (${E.rel(l.type).name})` : ''; }).filter(Boolean).join('\n');
      try {
        const out = await Claude.chamar({ system: this.SYS_IDEIAS, max: 1500, texto: `${await this.contexto()}\n\nQuadro do enredo (cards):\n${quadro || '(vazio)'}\n\nLigações:\n${lig || '(nenhuma)'}`, onParcial: t => { res.innerHTML = `<div class="ideias">${esc(t)}</div>`; } });
        res.innerHTML = `<div class="ideias">${esc(out)}</div>`;
      } catch (e) { res.innerHTML = Claude.erroHTML(e); }
    };
  }
};
