/* Ideias: gerador de histórias, por sorteio ou com o Claude */
const IDEIAS = {
  LUGARES: ['um porto de pesca com a maré baixa', 'o centro histórico de uma cidade de azulejos, com casarões caindo', 'uma oficina mecânica fechada há anos', 'um ônibus interestadual na madrugada', 'uma festa de bumba meu boi', 'um hospital de interior com um só médico', 'uma pensão de estudantes', 'um povoado que vai ser alagado por uma represa', 'uma igreja onde ninguém reza mais', 'um condomínio de luxo com segurança armada', 'uma feira livre ao amanhecer', 'um barco que faz a travessia da baía', 'uma escola pública em greve', 'um velório que dura a noite inteira', 'uma corrida de rua de 42 quilômetros', 'um quartel no meio do nada', 'uma rádio comunitária', 'uma cidade praiana fora de temporada', 'um apartamento herdado com tudo dentro', 'uma ilha onde só se chega de barco'],
  OFICIOS: ['pescador', 'enfermeira do turno da noite', 'professor de história aposentado', 'mototaxista', 'corredora de rua', 'radialista', 'coveiro', 'dona de pensão', 'policial afastado', 'fotógrafo de casamento', 'cobrador de dívidas', 'benzedeira', 'jogador de futebol que não deu certo', 'escritora fantasma', 'motorista de ambulância', 'pastor', 'garçom de bar antigo', 'estudante de medicina', 'vendedor de seguros', 'cuidadora de idosos'],
  SITUACOES: ['recebe uma carta endereçada a alguém que morreu há vinte anos', 'encontra o próprio nome numa lista que não deveria existir', 'é a única testemunha de algo que ninguém quer que seja visto', 'herda uma casa com uma condição estranha no testamento', 'volta à cidade natal para um enterro e descobre que o morto não era quem pensava', 'aceita um trabalho simples demais para ser verdade', 'perde a memória de uma noite inteira', 'é confundido com outra pessoa e decide não desfazer o engano', 'precisa atravessar o estado em três dias', 'acha uma criança sozinha num lugar onde não devia haver ninguém', 'ganha um prêmio que não pediu', 'descobre que o melhor amigo mentiu sobre tudo por anos', 'é obrigado a dividir a casa com quem mais detesta', 'promete algo a um moribundo e se arrepende', 'vê alguém que devia estar morto'],
  OBSTACULOS: ['o tempo: só tem até o fim de semana', 'a família, que prefere que nada mude', 'a própria mentira, que cresceu demais', 'um homem poderoso da cidade', 'a doença que esconde de todos', 'o dinheiro, que nunca chega', 'a lei, que está do lado errado', 'a pessoa que ama, que quer o contrário', 'o passado, que alguém conhece', 'o medo de ser visto como fraco'],
  TONS: ['seco e direto', 'lírico', 'irônico', 'sombrio', 'terno', 'tenso', 'melancólico', 'cômico por baixo da tristeza'],
  pecas() {
    const g = OFICIO.generoDe({ generoId: this.genero }) || null;
    return {
      quem: () => `${NORTE.sorteia(this.OFICIOS, 1)[0]}`,
      quer: () => NORTE.sorteia(NORTE.POOLS.desejos, 1)[0],
      onde: () => NORTE.sorteia(this.LUGARES, 1)[0],
      ese: () => NORTE.sorteia(this.SITUACOES, 1)[0],
      contra: () => NORTE.sorteia(this.OBSTACULOS, 1)[0],
      ferida: () => NORTE.sorteia(NORTE.POOLS.feridas, 1)[0],
      virada: () => NORTE.sorteia(g ? [...g.viradas, ...NORTE.VIRADAS.map(v => v[0])] : NORTE.VIRADAS.map(v => v[0]), 1)[0],
      tom: () => NORTE.sorteia(this.TONS, 1)[0],
      tipo: () => { const t = NORTE.sorteia(OFICIO.TIPOS_GATO, 1)[0]; return `${t[0]}: ${t[1]}`; }
    };
  },
  ROTULOS: { quem: 'Quem', quer: 'O que quer', onde: 'Onde', ese: 'E se…', contra: 'O que impede', ferida: 'O que carrega do passado', virada: 'Uma virada possível', tom: 'Tom', tipo: 'Tipo de história (Salve o gato)' },
  genero: '', atual: {}, travas: {}
};

App.views.ideias = {
  aba: 'sorteio',
  async render(v, top) {
    top.innerHTML = `<h2>Ideias</h2><div class="seg"><button data-a="sorteio" class="${this.aba === 'sorteio' ? 'on' : ''}">Sorteio</button><button data-a="claude" class="${this.aba === 'claude' ? 'on' : ''}">Com o Claude</button><button data-a="guardadas" class="${this.aba === 'guardadas' ? 'on' : ''}">Guardadas</button></div>`;
    $$('[data-a]', top).forEach(b => b.onclick = () => { this.aba = b.dataset.a; App.go('ideias'); });
    if (this.aba === 'sorteio') return this.sorteio(v);
    if (this.aba === 'claude') return this.claude(v);
    return this.guardadas(v);
  },
  generoSel() { return `<select id="igen" style="max-width:260px"><option value="">Qualquer gênero</option>${OFICIO.GENEROS.map(g => `<option value="${g.id}" ${IDEIAS.genero === g.id ? 'selected' : ''}>${esc(g.nome)}</option>`).join('')}</select>`; },
  sortear(tudo) { const P = IDEIAS.pecas(); for (const k of Object.keys(IDEIAS.ROTULOS)) if (tudo || !IDEIAS.travas[k] || !IDEIAS.atual[k]) IDEIAS.atual[k] = P[k](); },
  sorteio(v) {
    if (!IDEIAS.atual.quem) this.sortear(true);
    const A = IDEIAS.atual;
    v.innerHTML = `<div class="pad" style="max-width:980px">
      <div class="row" style="justify-content:space-between;margin-bottom:16px"><p class="muted" style="margin:0;max-width:60ch">Peças soltas para acender uma história. Trave o que gostou (cadeado) e sorteie o resto. Mude qualquer peça escrevendo por cima.</p>${this.generoSel()}</div>
      <div class="ideiagrid">${Object.entries(IDEIAS.ROTULOS).map(([k, r]) => `<div class="peca ${IDEIAS.travas[k] ? 'travada' : ''}"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><b class="small">${r}</b><button class="iconbtn" data-trava="${k}" title="${IDEIAS.travas[k] ? 'Destravar' : 'Travar'}">${ic('lock')}</button></div><textarea data-p="${k}" rows="2">${esc(A[k])}</textarea></div>`).join('')}</div>
      <div class="card" style="margin-top:18px"><b class="small muted">A premissa, junta</b><p id="ipremissa" style="font-family:var(--serif);font-size:19px;line-height:1.5;margin:6px 0 0"></p></div>
      <div class="row" style="margin-top:16px"><button class="btn pri" id="isort">${ic('dice')} Sortear o que não está travado</button><button class="btn" id="iguarda">Guardar ideia</button><button class="btn" id="ilivro">${ic('book')} Virar livro</button><button class="btn ghost" id="iclaude">Desenvolver com o Claude</button></div>
    </div>`;
    const premissa = () => { $('#ipremissa').textContent = `${A.quem.charAt(0).toUpperCase() + A.quem.slice(1)}, em ${A.onde}, ${A.ese}. Quer ${A.quer}, mas tem contra si ${A.contra}. Carrega isto: ${A.ferida}. No meio do caminho: ${A.virada.charAt(0).toLowerCase() + A.virada.slice(1)} Tom ${A.tom}.`; };
    premissa();
    $$('[data-p]').forEach(t => t.oninput = () => { A[t.dataset.p] = t.value; premissa(); });
    $$('[data-trava]').forEach(b => b.onclick = () => { IDEIAS.travas[b.dataset.trava] = !IDEIAS.travas[b.dataset.trava]; this.sorteio(v); });
    $('#igen').onchange = e => { IDEIAS.genero = e.target.value; };
    $('#isort').onclick = () => { this.sortear(false); this.sorteio(v); };
    $('#iguarda').onclick = () => this.guardar({ titulo: A.ese, premissa: $('#ipremissa').textContent, pecas: { ...A }, genero: IDEIAS.genero, origem: 'sorteio' });
    $('#ilivro').onclick = () => this.virarLivro({ titulo: '', premissa: $('#ipremissa').textContent, pecas: { ...A }, genero: IDEIAS.genero });
    $('#iclaude').onclick = () => { this.pistas = $('#ipremissa').textContent; this.aba = 'claude'; App.go('ideias'); };
  },
  SYS: `Você ajuda um escritor brasileiro de ficção, com o dia corrido, a achar histórias para escrever. Gere premissas originais, concretas e cheias de conflito, em português do Brasil. Evite clichês de IA (nada de "jornada", "tapeçaria", "segredos sombrios do passado" genéricos) e finais redentores fáceis: personagens podem não sair limpos.
Responda SOMENTE com um array JSON, sem texto antes ou depois:
[{"titulo":"título provisório","logline":"uma ou duas frases: quem, o que quer, o que impede, o que está em jogo","protagonista":"nome, idade, ofício e a contradição dele","desejo":"o que quer","necessidade":"o que precisa e não sabe","oponente":"quem ou o que se opõe, e por quê","incidente":"o acontecimento que dá a partida","virada":"uma virada no meio que muda tudo","final_possivel":"um final possível, que o autor pode jogar fora","por_que_funciona":"uma frase citando a técnica de escrita por trás (Truby, McKee, Snyder, Piglia, Cortázar, Aristóteles etc.)"}]`,
  claude(v) {
    v.innerHTML = `<div class="pad" style="max-width:980px">
      <p class="muted" style="margin:0 0 12px;max-width:62ch">Diga só o que quiser: um lugar, um tema, uma imagem que ficou na cabeça, uma notícia. Ou deixe em branco e o Claude inventa do zero. Ele devolve três premissas; você escolhe, mistura ou descarta.</p>
      <div class="grid3"><label class="f">Gênero${this.generoSel()}</label><label class="f">Tamanho<select id="itam"><option>conto</option><option selected>romance</option><option>novela</option></select></label><label class="f">Tom<select id="itom"><option value="">qualquer</option>${IDEIAS.TONS.map(t => `<option>${t}</option>`).join('')}</select></label></div>
      <label class="f" style="margin-top:12px">Pistas (opcional)<textarea id="ipistas" placeholder="ex.: São Luís, maré, um pai que some, corrida de rua">${esc(this.pistas || '')}</textarea></label>
      <div class="row" style="margin-top:12px"><button class="btn pri" id="igerar">Gerar três premissas</button><span class="small muted" id="iinfo"></span></div>
      <div id="ires" style="display:grid;gap:14px;margin-top:18px"></div></div>`;
    $('#igen').onchange = e => { IDEIAS.genero = e.target.value; };
    $('#igerar').onclick = async () => {
      const g = OFICIO.generoDe({ generoId: $('#igen').value });
      const pedido = `Gere 3 premissas para um ${$('#itam').value}${g ? ' de ' + g.nome.toLowerCase() + ' (o leitor espera: ' + g.promessa + ')' : ''}${$('#itom').value ? ', tom ' + $('#itom').value : ''}.${$('#ipistas').value.trim() ? '\nPistas do autor: ' + $('#ipistas').value.trim() : '\nSem pistas: invente com liberdade, de preferência com chão brasileiro.'}`;
      const res = $('#ires'); $('#igerar').disabled = true; res.innerHTML = '<p class="muted">Pensando…</p>';
      try {
        const out = await Claude.chamar({ system: this.SYS, texto: pedido, max: 3000, onParcial: t => { const n = (t.match(/"logline"/g) || []).length; $('#iinfo').textContent = n ? n + ' de 3 premissas' : ''; } });
        const lista = Claude.json(out); if (!lista.length) throw new Error('O Claude não devolveu premissas. Tente de novo.');
        res.innerHTML = lista.map((p, i) => this.cardPremissa(p, i)).join('');
        $$('[data-pg]', res).forEach(b => b.onclick = () => { const p = lista[+b.dataset.pg]; this.guardar({ titulo: p.titulo, premissa: p.logline, detalhe: p, genero: $('#igen').value, origem: 'claude' }); });
        $$('[data-pl]', res).forEach(b => b.onclick = () => { const p = lista[+b.dataset.pl]; this.virarLivro({ titulo: p.titulo, premissa: p.logline, detalhe: p, genero: $('#igen').value }); });
      } catch (e) { res.innerHTML = Claude.erroHTML(e); }
      $('#igerar').disabled = false; $('#iinfo').textContent = '';
    };
  },
  cardPremissa(p, i) {
    const campo = (k, r) => p[k] ? `<p style="margin:6px 0"><b class="small">${r}:</b> ${esc(p[k])}</p>` : '';
    return `<div class="card"><h3>${esc(p.titulo || 'Sem título')}</h3><p style="font-family:var(--serif);font-size:18px;line-height:1.5;margin:8px 0">${esc(p.logline || '')}</p>
      ${campo('protagonista', 'Protagonista')}${campo('desejo', 'Quer')}${campo('necessidade', 'Precisa')}${campo('oponente', 'Contra')}${campo('incidente', 'Incidente incitante')}${campo('virada', 'Virada')}${campo('final_possivel', 'Final possível')}
      ${p.por_que_funciona ? `<span class="fonte">${esc(p.por_que_funciona)}</span>` : ''}
      ${i !== undefined ? `<div class="row" style="margin-top:10px"><button class="btn sm" data-pg="${i}">Guardar</button><button class="btn sm pri" data-pl="${i}">${ic('book')} Virar livro</button></div>` : ''}</div>`;
  },
  async guardar(ideia) {
    await DB.put('ideias', { id: DB.uid(), bookId: 'ideias', em: Date.now(), ...ideia });
    App.toast('Ideia guardada (aba Guardadas)');
  },
  async guardadas(v) {
    const lista = (await DB.all('ideias')).sort((a, b) => (b.em || 0) - (a.em || 0));
    v.innerHTML = `<div class="pad" style="max-width:980px">${lista.length ? lista.map(x => `<div class="card" style="margin-bottom:12px"><div class="row" style="justify-content:space-between"><b>${esc(x.titulo || 'Ideia')}</b><span class="small muted">${new Date(x.em).toLocaleDateString('pt-BR')} · ${x.origem === 'claude' ? 'Claude' : 'sorteio'}${x.genero ? ' · ' + esc(OFICIO.generoDe({ generoId: x.genero })?.nome || '') : ''}</span></div>
      <p style="font-family:var(--serif);font-size:17px;line-height:1.5;margin:8px 0">${esc(x.premissa || '')}</p>
      ${x.detalhe ? `<details><summary class="small" style="cursor:pointer">Detalhes</summary>${this.cardPremissa(x.detalhe)}</details>` : ''}
      <div class="row" style="margin-top:8px"><button class="btn sm pri" data-vl="${x.id}">${ic('book')} Virar livro</button><button class="btn sm ghost danger" data-del="${x.id}">${ic('trash')} Apagar</button></div></div>`).join('') : '<div class="empty"><h3>Nenhuma ideia guardada</h3><p>Sorteie ou peça ao Claude e guarde as que quiser trabalhar depois.</p></div>'}</div>`;
    $$('[data-vl]').forEach(b => b.onclick = () => this.virarLivro(lista.find(x => x.id === b.dataset.vl)));
    $$('[data-del]').forEach(b => b.onclick = async () => { await DB.del('ideias', b.dataset.del); this.guardadas(v); });
  },
  async virarLivro(ideia) {
    const d = ideia.detalhe || {}, P = ideia.pecas || {};
    const titulo = ideia.titulo && ideia.titulo.length < 60 ? ideia.titulo : (await App.ask('Título provisório do livro', '', 'Pode mudar depois')) || 'Nova história';
    const b = { id: DB.uid(), title: titulo, author: App.books[0]?.author || 'Vinik', subtitle: '', generoId: ideia.genero || null, genre: ideia.genero ? OFICIO.generoDe({ generoId: ideia.genero }).nome : '', color: BOOK_COLORS[App.books.length % BOOK_COLORS.length], goalWords: ideia.detalhe?.tamanho === 'conto' ? 8000 : 70000, createdAt: Date.now(), lastOpened: Date.now(), premissa: ideia.premissa };
    await DB.put('books', b); App.books.unshift(b);
    await DB.put('chapters', { id: DB.uid(), bookId: b.id, order: 0, type: 'capitulo', title: 'Capítulo 1', html: '<p><br></p>', words: 0, status: 'rascunho', notes: 'Premissa: ' + (ideia.premissa || ''), synopsis: d.incidente || '' });
    const nomeProt = (d.protagonista || '').split(',')[0].trim();
    const prot = { id: DB.uid(), bookId: b.id, kind: 'personagem', name: nomeProt && nomeProt.length < 40 ? nomeProt : 'Protagonista', papel: 'protagonista', role: 'protagonista', aliases: '', summary: d.protagonista || (P.quem ? 'Ofício: ' + P.quem : ''), tags: '', img: '',
      fields: [{ k: 'O que quer', v: d.desejo || P.quer || '' }, { k: 'O que precisa (e não sabe)', v: d.necessidade || '' }, { k: 'Ferida / fantasma', v: P.ferida || '' }, { k: 'A mentira em que acredita', v: '' }, { k: 'Contradição', v: '' }, { k: 'Sob pressão', v: '' }, { k: 'Como fala', v: '' }, { k: 'Segredo', v: '' }] };
    await DB.put('fichas', prot);
    const cards = [['Premissa', ideia.premissa || ''], ['Incidente incitante', d.incidente || P.ese || ''], ['O que impede', d.oponente || P.contra || ''], ['Virada', d.virada || P.virada || ''], ['Final possível', d.final_possivel || '']].filter(c => c[1]);
    let prev = null;
    for (let i = 0; i < cards.length; i++) {
      const c = { id: DB.uid(), bookId: b.id, title: cards[i][0], text: cards[i][1], color: ['#2346a8', '#2346a8', '#7a1f2b', '#e8553a', '#b07a1f'][i] || '#2346a8', x: 60 + i * 250, y: 80 };
      await DB.put('cards', c);
      if (prev) await DB.put('links', { id: DB.uid(), bookId: b.id, from: prev.id, to: c.id, type: 'causa' });
      prev = c;
    }
    App.toast('Livro criado a partir da ideia'); App.openBook(b.id);
  }
};
