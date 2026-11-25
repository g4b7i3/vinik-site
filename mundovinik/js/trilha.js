/* Trilha do livro: o caminho em passos simples, para quem nunca estudou escrita criativa.
   Cada passo sabe se já foi feito e leva direto para onde se faz. */
const TRILHA = {
  PASSOS: [
    { id: 'premissa', nome: 'A ideia em uma frase', simples: 'Quem é a pessoa, o que ela quer muito, e o que atrapalha.', porque: 'Com essa frase clara, todo o resto fica mais fácil de decidir. É a bússola do livro.', fonte: 'Truby: desejo e oposição; McKee: a substância da estória', botao: 'Escrever a frase' },
    { id: 'protagonista', nome: 'O protagonista', simples: 'Crie a pessoa principal respondendo a perguntas simples: o que quer, o que esconde, do que tem medo.', porque: 'O leitor segue uma pessoa, não um enredo. Se ele se importa com ela, vira as páginas.', fonte: 'Truby; McKee: personagem contra caracterização', botao: 'Criar com guia' },
    { id: 'elenco', nome: 'Quem atrapalha e quem ajuda', simples: 'Crie alguém que quer impedir o protagonista, e mais duas ou três pessoas importantes.', porque: 'Sem resistência não há história. Um bom oponente faz o protagonista mostrar quem é.', fonte: 'McKee: o princípio do antagonismo', botao: 'Ver o que o elenco pede' },
    { id: 'estrutura', nome: 'O esqueleto da história', simples: 'Escolha um molde pronto (começo, meio e fim) e responda cada cartão com uma frase.', porque: 'É o mapa. Você pode sair dele quando quiser, mas não se perde no meio.', fonte: 'Vogler; Snyder; McKee', botao: 'Escolher um molde' },
    { id: 'surpresa', nome: 'Pôr surpresas', simples: 'Sorteie viradas e escolha uma ou duas para o meio e o fim da história.', porque: 'O leitor adivinha o óbvio. A virada que faz sentido depois é o que torna o livro surpreendente.', fonte: 'Aristóteles: peripécia e reconhecimento', botao: 'Sortear viradas' },
    { id: 'capitulos', nome: 'Os capítulos, um por um', simples: 'Transforme os cartões em capítulos, com uma linha dizendo o que acontece em cada um.', porque: 'Na hora de escrever, você já sabe o que vem. Nada de página em branco.', fonte: 'Swain: cena e sequela', botao: 'Montar a escaleta' },
    { id: 'escrever', nome: 'Escrever', simples: 'Escreva um pouco todo dia, sem voltar para corrigir. Use o modo foco e o sprint.', porque: 'Primeiro rascunho é para existir, não para ser bom. A qualidade vem na revisão.', fonte: 'Stephen King, Sobre a escrita: a porta fechada', botao: 'Abrir o manuscrito' },
    { id: 'revisar', nome: 'Revisar', simples: 'Veja palavras repetidas e vagas, peça a revisão de português e procure furos na história.', porque: 'É na revisão que o livro fica bom. Segunda versão é a primeira menos uns dez por cento.', fonte: 'King, Sobre a escrita; Othon M. Garcia', botao: 'Começar a revisão' },
    { id: 'publicar', nome: 'Livro pronto', simples: 'Monte as páginas, a capa e o e-book para a gráfica e para a Amazon.', porque: 'O app calcula páginas e lombada e gera os arquivos que a gráfica e a Amazon pedem.', fonte: '', botao: 'Abrir a diagramação' }
  ],
  async estado(b) {
    const [fichas, cards, chs, scenes] = await Promise.all([DB.byBook('fichas', b.id), DB.byBook('cards', b.id), App.chapters(b.id), DB.byBook('scenes', b.id)]);
    const ps = fichas.filter(f => f.kind === 'personagem');
    const prot = ps.find(f => f.papel === 'protagonista');
    const words = chs.reduce((s, c) => s + (c.words || 0), 0);
    const metaEscrita = b.goalWords ? b.goalWords * 0.6 : 15000;
    const feito = {
      premissa: !!(b.premissa && b.premissa.trim().length > 15),
      protagonista: !!(prot && NORTE.campo(prot, /quer|desejo/i)),
      elenco: ps.some(f => f.papel === 'oponente') && ps.length >= 3,
      estrutura: cards.filter(c => !c.guia).length >= 5,
      surpresa: cards.some(c => c.virada) || !!b.viradaFeita,
      capitulos: chs.filter(c => c.synopsis && c.synopsis.trim()).length >= 3 || scenes.length >= 5 || chs.length >= 5,
      escrever: words >= metaEscrita,
      revisar: !!b.furos || chs.some(c => c.status === 'revisado'),
      publicar: !!b.publicado
    };
    const prog = { escrever: Math.min(1, words / metaEscrita) };
    const proximo = this.PASSOS.find(p => !feito[p.id]) || null;
    return { feito, prog, proximo, total: this.PASSOS.filter(p => feito[p.id]).length, words, metaEscrita };
  },
  async agir(id) {
    const b = App.book;
    if (id === 'premissa') return this.premissa();
    if (id === 'protagonista') return NorteUI.criarPersonagem('protagonista', f => { Universo.sel = f.id; App.go('universo'); });
    if (id === 'elenco') { Universo.sel = null; Universo.filter = 'todos'; Universo.q = ''; return App.go('universo'); }
    if (id === 'estrutura') { App.views.enredo.tab = 'quadro'; await App.go('enredo'); return NorteUI.estruturas(App.views.enredo); }
    if (id === 'surpresa') { App.views.enredo.tab = 'quadro'; await App.go('enredo'); return NorteUI.virada(App.views.enredo); }
    if (id === 'capitulos') { App.views.enredo.tab = 'escaleta'; return App.go('enredo'); }
    if (id === 'escrever') return App.go('manuscrito');
    if (id === 'revisar') { Manuscrito.asideTab = 'rep'; Manuscrito.showAside = true; return App.go('manuscrito'); }
    if (id === 'publicar') { Diagramacao.mode = 'miolo'; return App.go('diagramacao'); }
  },
  premissa() {
    const b = App.book;
    const m = App.modal(`<h2>A ideia em uma frase</h2>
      <p class="muted" style="margin:0">Preencha as três partes. Não precisa ficar bonito: é para você.</p>
      <label class="f">Quem é a pessoa principal?<input type="text" id="pq" value="${esc(b.premQuem || '')}" placeholder="ex.: um mecânico que voltou para a cidade natal"></label>
      <label class="f">O que ela quer muito?<input type="text" id="pw" value="${esc(b.premQuer || '')}" placeholder="ex.: recuperar o barco que era do pai"></label>
      <label class="f">O que atrapalha?<input type="text" id="pc" value="${esc(b.premContra || '')}" placeholder="ex.: o padrinho, que comprou o barco e não quer vender"></label>
      <label class="f">E o que ela perde se falhar? (opcional)<input type="text" id="pr" value="${esc(b.premRisco || '')}" placeholder="ex.: a última ligação com o pai"></label>
      <div class="card" style="background:var(--panel2)"><b class="small muted">A frase</b><p id="pfrase" style="font-family:var(--serif);font-size:18px;line-height:1.5;margin:6px 0 0"></p></div>
      <p class="small muted" style="margin:0">Sem ideia? <button class="btn sm ghost" id="pideia">Abrir o gerador de ideias</button></p>
      <div class="acts"><button class="btn" data-close>Cancelar</button><button class="btn pri" id="pok">Guardar</button></div>`);
    const frase = () => {
      const q = $('#pq', m).value.trim(), w = $('#pw', m).value.trim(), c = $('#pc', m).value.trim(), r = $('#pr', m).value.trim();
      const t = q || w || c ? `${q ? q.charAt(0).toUpperCase() + q.slice(1) : 'Alguém'} quer ${w || '…'}. O que atrapalha: ${c || '…'}.${r ? ' Se falhar, perde ' + r + '.' : ''}` : '';
      $('#pfrase', m).textContent = t || 'Preencha acima e a frase aparece aqui.'; return t;
    };
    $$('input', m).forEach(i => i.oninput = frase); frase();
    $('#pideia', m).onclick = () => { m.close(); App.go('ideias'); };
    $('#pok', m).onclick = async () => { b.premQuem = $('#pq', m).value.trim(); b.premQuer = $('#pw', m).value.trim(); b.premContra = $('#pc', m).value.trim(); b.premRisco = $('#pr', m).value.trim(); b.premissa = frase(); await App.saveBook(); m.close(); App.toast('Frase guardada. Próximo passo: o protagonista.'); App.go(App.view); };
  },
  /* cartão do próximo passo (Biblioteca e painel Norte) */
  async cartao(el, compacto) {
    const b = App.book; if (!b || !el) return;
    if (b.trilhaOculta) { el.innerHTML = compacto ? `<div class="ncard small"><button class="btn sm ghost" id="tmostra">Mostrar a trilha do livro</button></div>` : ''; $('#tmostra', el) && ($('#tmostra', el).onclick = async () => { b.trilhaOculta = false; await App.saveBook(); this.cartao(el, compacto); }); return; }
    const e = await this.estado(b); const p = e.proximo; const n = this.PASSOS.length;
    el.innerHTML = `<div class="trilha ${compacto ? 'comp' : ''}"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><b class="small">Trilha do livro · ${e.total} de ${n}</b><span class="row" style="gap:2px;flex-wrap:nowrap"><button class="btn sm ghost" id="tver">Ver tudo</button><button class="iconbtn" id="tesc" title="Esconder a trilha" aria-label="Esconder a trilha">${ic('x')}</button></span></div>
      <div class="tpassos">${this.PASSOS.map(x => `<i class="${e.feito[x.id] ? 'ok' : x === p ? 'agora' : ''}" title="${esc(x.nome)}"></i>`).join('')}</div>
      ${p ? `<div class="tprox"><span class="small muted">Próximo passo</span><b>${esc(p.nome)}</b><p>${esc(p.simples)}</p>${compacto ? '' : `<p class="small muted" style="margin:0">${esc(p.porque)}</p>`}${p.id === 'escrever' ? `<div class="bar" style="margin:8px 0"><i style="width:${(e.prog.escrever * 100).toFixed(0)}%"></i></div><span class="small muted">${nf(e.words)} de ${nf(Math.round(e.metaEscrita))} palavras para o rascunho</span>` : ''}<div class="row" style="margin-top:8px"><button class="btn sm pri" id="tgo">${esc(p.botao)}</button></div></div>` : `<div class="tprox"><b>Livro completo.</b><p>Todos os passos feitos. Volte a qualquer um quando quiser.</p></div>`}</div>`;
    $('#tgo', el) && ($('#tgo', el).onclick = () => this.agir(p.id));
    $('#tver', el).onclick = () => this.completa();
    $('#tesc', el).onclick = async () => { b.trilhaOculta = true; await App.saveBook(); this.cartao(el, compacto); };
  },
  async completa() {
    const b = App.book; const e = await this.estado(b);
    const m = App.modal(`<h2>Trilha do livro</h2><p class="muted" style="margin:0">Nove passos, do zero ao livro impresso. A ordem ajuda, mas não manda: pule, volte, faça do seu jeito. Os passos se marcam sozinhos quando o app percebe que foram feitos.</p>
      <ol class="tlista">${this.PASSOS.map((x, i) => `<li class="${e.feito[x.id] ? 'ok' : x === e.proximo ? 'agora' : ''}"><div><b>${i + 1}. ${esc(x.nome)}</b>${e.feito[x.id] ? ' <span class="chip" style="font-size:11px;color:var(--ok)">feito</span>' : ''}<p style="margin:4px 0">${esc(x.simples)}</p><p class="small muted" style="margin:0">${esc(x.porque)}</p>${x.fonte ? `<span class="fonte">${esc(x.fonte)}</span>` : ''}</div><button class="btn sm ${x === e.proximo ? 'pri' : ''}" data-ag="${x.id}">${esc(x.botao)}</button></li>`).join('')}</ol>
      <div class="acts"><button class="btn ghost" id="tglos" style="margin-right:auto">O que quer dizer cada termo?</button><button class="btn" data-close>Fechar</button></div>`, { wide: true });
    $$('[data-ag]', m).forEach(x => x.onclick = () => { m.close(); this.agir(x.dataset.ag); });
    $('#tglos', m).onclick = () => { m.close(); this.glossario(); };
  },
  GLOSSARIO: [
    ['Premissa', 'A ideia do livro em uma frase: quem quer o quê, e o que atrapalha.'],
    ['Protagonista', 'A pessoa principal, aquela que o leitor acompanha.'],
    ['Oponente / antagonista', 'Quem ou o que atrapalha o protagonista. Não precisa ser vilão: pode ser alguém que ele ama, ou ele mesmo.'],
    ['Conflito', 'Quando alguém quer uma coisa e algo impede. Sem conflito, não há história.'],
    ['Incidente incitante', 'O acontecimento que tira a vida do protagonista do lugar e dá a partida na história.'],
    ['Virada', 'Um acontecimento que muda a direção da história. A boa virada surpreende e, depois, parece que só podia ser assim.'],
    ['Clímax', 'O momento de maior tensão, perto do fim, em que tudo se decide.'],
    ['Arco do personagem', 'A mudança por dentro que o personagem vive (ou recusa) do começo ao fim.'],
    ['Cena', 'Um trecho em que algo acontece num lugar e num tempo, com alguém querendo alguma coisa.'],
    ['Escaleta', 'A lista das cenas ou capítulos, em ordem, com uma linha sobre cada um.'],
    ['Ponto de vista', 'De quem são os olhos que contam a história: eu (primeira pessoa) ou ele/ela (terceira).'],
    ['Subtexto', 'O que os personagens sentem e não dizem. Aparece em gestos e silêncios.'],
    ['Mostrar e contar', 'Mostrar é deixar o leitor ver a cena; contar é resumir. Os dois servem; o truque é saber quando usar cada um.'],
    ['Gancho', 'O final de capítulo que deixa uma pergunta no ar e faz virar a página.'],
    ['Diagramação', 'Arrumar o texto em páginas de livro, com margens, fonte e números, pronto para imprimir.'],
    ['Lombada', 'A parte do livro que fica à mostra na estante; a largura depende do número de páginas.']
  ],
  glossario() {
    App.modal(`<h2>O que quer dizer cada termo</h2><div style="display:flex;flex-direction:column;gap:10px">${this.GLOSSARIO.map(([t, d]) => `<div><b>${esc(t)}</b><p style="margin:2px 0 0">${esc(d)}</p></div>`).join('')}</div><div class="acts"><button class="btn pri" data-close>Entendi</button></div>`);
  }
};
