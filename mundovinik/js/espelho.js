/* Modo espelho: uma história de referência aberta ao lado do capítulo.
   A referência pode vir de um arquivo, de texto colado, de outro livro do app ou do Claude.
   Fica guardada na gaveta "referencias" e sincroniza com os outros aparelhos. */
const Espelho = {
  ligado() { return !!App.settings.espelho; },
  async alternar() {
    App.settings.espelho = !App.settings.espelho; await App.saveSettings();
    if (App.settings.espelho && Manuscrito.showAside && innerWidth < 1700) { Manuscrito.showAside = false; $('#ms')?.classList.add('noaside'); }
    this.montar();
  },
  montar() {
    const desk = $('#desk'); if (!desk) return;
    const on = this.ligado();
    desk.classList.toggle('esp', on);
    $('#esp')?.classList.toggle('pri', on);
    $('#refpane').hidden = !on;
    if (on) this.render(); else $('#refpane').innerHTML = '';
  },
  async lista() { return (await DB.all('referencias')).sort((a, b) => (b.em || 0) - (a.em || 0)); },
  async atual() {
    const id = App.book.refId; if (!id) return null;
    return await DB.get('referencias', id) || null;
  },
  async htmlDe(ref) {
    if (ref.origem !== 'livro') return ref.html || '';
    const chs = await App.chapters(ref.livroId);
    if (!chs.length) return '<p class="muted">Esse livro foi apagado ou ainda não tem capítulos.</p>';
    return chs.map((c, i) => `<h3>${esc(c.title || 'Capítulo ' + (i + 1))}</h3>${(c.html || '').replace(/<sup class="fnote"[\s\S]*?<\/sup>/g, '')}`).join('');
  },
  async render() {
    const pane = $('#refpane'); if (!pane) return;
    const refs = await this.lista();
    const ref = await this.atual();
    pane.innerHTML = `<div class="refhd">
        <select id="refsel" aria-label="História de referência"><option value="">Escolher história…</option>${refs.map(r => `<option value="${r.id}" ${ref && ref.id === r.id ? 'selected' : ''}>${esc(r.titulo || 'Sem título')}</option>`).join('')}</select>
        <button class="btn sm" id="refnova">${ic('plus')} Nova</button>
        ${ref ? `<button class="iconbtn" id="refmais" title="Mais opções">${ic('gear')}</button>` : ''}
        <button class="iconbtn" id="refx" title="Fechar o espelho">${ic('x')}</button>
      </div>
      <div class="esptabs mobonly"><button data-v="ref" class="on">Referência</button><button data-v="meu">Meu texto</button></div>
      <div class="refbody" id="refbody"></div>`;
    $('#refsel').onchange = async e => { App.book.refId = e.target.value || null; await App.saveBook(); this.render(); };
    $('#refnova').onclick = () => this.nova();
    $('#refx').onclick = () => this.alternar();
    if ($('#refmais')) $('#refmais').onclick = () => this.opcoes(ref);
    $$('.esptabs button', pane).forEach(b => b.onclick = () => {
      $$('.esptabs button', pane).forEach(x => x.classList.toggle('on', x === b));
      $('#desk').classList.toggle('vermeu', b.dataset.v === 'meu');
      if (b.dataset.v === 'meu') this.abaMeu();
    });
    const body = $('#refbody');
    if (!ref) {
      body.innerHTML = `<div class="refvazio"><h3>Escreva olhando para outra história</h3>
        <p>Abra aqui um texto para ler enquanto escreve o seu: um conto que você admira, um livro seu, ou uma história que o Claude cria a partir da sua ideia. Ela fica só para leitura; o seu capítulo continua do outro lado.</p>
        <button class="btn pri" id="refcomeca">${ic('plus')} Abrir uma história</button></div>`;
      $('#refcomeca').onclick = () => this.nova();
      return;
    }
    const html = await this.htmlDe(ref);
    body.innerHTML = `<article class="reftxt" style="--efs:${App.settings.edFont || 19}px"><h2>${esc(ref.titulo || '')}</h2>${ref.origem === 'claude' && ref.premissa ? `<p class="refnota">Gerada pelo Claude a partir de: ${esc(ref.premissa)}</p>` : ''}${html}</article>`;
    const chave = 'mv_refpos_' + ref.id;
    try { const pos = +localStorage.getItem(chave) || 0; requestAnimationFrame(() => body.scrollTop = pos); } catch (e) { }
    body.onscroll = debounce(() => { try { localStorage.setItem(chave, body.scrollTop); } catch (e) { } }, 400);
  },
  /* no celular: um botão flutuante devolve para a referência */
  abaMeu() {
    if ($('#voltaref')) return;
    const b = document.createElement('button'); b.id = 'voltaref'; b.className = 'btn sm voltaref mobonly'; b.innerHTML = `${ic('book')} Ver referência`;
    b.onclick = () => { $('#desk').classList.remove('vermeu'); b.remove(); $$('.esptabs button').forEach(x => x.classList.toggle('on', x.dataset.v === 'ref')); };
    $('#desk').appendChild(b);
  },
  opcoes(ref) {
    const m = App.modal(`<h3>${esc(ref.titulo || 'História de referência')}</h3>
      <label class="f">Título<input type="text" id="rtit" value="${esc(ref.titulo || '')}"></label>
      <p class="small muted">${{ arquivo: 'Veio de um arquivo', colado: 'Texto colado', livro: 'Um livro seu (mostra sempre a versão atual dele)', claude: 'Gerada pelo Claude' }[ref.origem] || ''}${ref.origem !== 'livro' ? ' · ' + nf(countWords(textOf(ref.html || ''))) + ' palavras' : ''}</p>
      <div class="acts"><button class="btn ghost danger" id="rdel">${ic('trash')} Apagar referência</button><button class="btn" data-close>Cancelar</button><button class="btn pri" id="rok">Salvar</button></div>`);
    $('#rok', m).onclick = async () => { ref.titulo = $('#rtit', m).value.trim() || ref.titulo; await DB.put('referencias', ref); m.close(); this.render(); };
    $('#rdel', m).onclick = async () => {
      m.close();
      if (!await App.confirm('Apagar esta história de referência? O seu livro não é afetado.', 'Apagar')) return;
      await DB.del('referencias', ref.id);
      for (const b of App.books) if (b.refId === ref.id) { b.refId = null; await DB.put('books', b); }
      this.render();
    };
  },
  async guardar(r) {
    const ref = { id: DB.uid(), bookId: 'refs', em: Date.now(), ...r };
    await DB.put('referencias', ref);
    App.book.refId = ref.id; await App.saveBook();
    this.render();
    return ref;
  },
  nova() {
    const m = App.modal(`<h3>Abrir uma história ao lado</h3>
      <div class="refopcoes">
        <button class="card" data-o="claude"><b>${ic('spark')} O Claude escreve uma</b><span>A partir da sua ideia, do gênero e do tamanho. Você lê e escreve a sua versão.</span></button>
        <button class="card" data-o="colar"><b>${ic('quote')} Colar um texto</b><span>Uma história que está no WhatsApp, no e-mail ou numa conversa com o Claude.</span></button>
        <button class="card" data-o="arquivo"><b>${ic('ul')} Abrir um arquivo</b><span>Word (.docx), EPUB, .txt ou .md.</span></button>
        <button class="card" data-o="livro"><b>${ic('book')} Um livro seu daqui</b><span>Por exemplo, o primeiro volume aberto enquanto escreve o segundo.</span></button>
      </div><div class="acts"><button class="btn" data-close>Cancelar</button></div>`, { wide: true });
    $$('[data-o]', m).forEach(b => b.onclick = () => { m.close(); this['de_' + b.dataset.o](); });
  },
  async de_arquivo() {
    const f = await App.pickFile('.docx,.epub,.txt,.md'); if (!f) return;
    App.toast('Lendo o arquivo…');
    try {
      const chs = f.name.toLowerCase().endsWith('.epub') ? await this.epub(f) : await Importa.file(f);
      const html = this.juntar(chs);
      if (!textOf(html).trim()) throw new Error('não achei texto nele');
      await this.guardar({ titulo: f.name.replace(/\.[^.]+$/, ''), origem: 'arquivo', html });
      App.toast('História aberta ao lado');
    } catch (e) { App.toast('Não consegui ler: ' + e.message); }
  },
  de_colar() {
    const m = App.modal(`<h3>Colar uma história</h3>
      <label class="f">Título<input type="text" id="ctit" placeholder="ex.: Conto de Natal, versão do Claude"></label>
      <label class="f">Texto<textarea id="ctxt" rows="12" placeholder="Cole aqui. Linhas em branco separam os parágrafos; linhas começando com # viram títulos."></textarea></label>
      <div class="acts"><button class="btn" data-close>Cancelar</button><button class="btn pri" id="cok">Abrir ao lado</button></div>`, { wide: true });
    $('#cok', m).onclick = async () => {
      const t = $('#ctxt', m).value.trim(); if (!t) return;
      const chs = await Importa.file(new File([t], 'colado.txt', { type: 'text/plain' }));
      await this.guardar({ titulo: $('#ctit', m).value.trim() || t.split('\n')[0].replace(/^#+\s*/, '').slice(0, 60), origem: 'colado', html: this.juntar(chs, true) });
      m.close();
    };
  },
  de_livro() {
    const outros = App.books.filter(b => b.id !== App.book.id);
    if (!outros.length) { App.toast('Você ainda não tem outro livro aqui.'); return; }
    const m = App.modal(`<h3>Qual livro abrir ao lado?</h3><div class="reflivros">${outros.map(b => `<button class="card" data-b="${b.id}"><b>${esc(b.title)}</b><span class="small muted">${esc(b.author || '')}</span></button>`).join('')}</div><div class="acts"><button class="btn" data-close>Cancelar</button></div>`);
    $$('[data-b]', m).forEach(x => x.onclick = async () => {
      const b = outros.find(o => o.id === x.dataset.b); m.close();
      const ja = (await this.lista()).find(r => r.origem === 'livro' && r.livroId === b.id);
      if (ja) { App.book.refId = ja.id; await App.saveBook(); this.render(); return; }
      await this.guardar({ titulo: b.title, origem: 'livro', livroId: b.id });
    });
  },
  TAMANHOS: { curto: ['Conto curto', 'entre 1.200 e 1.600 palavras', 3500], conto: ['Conto', 'entre 2.500 e 3.200 palavras', 7000], capitulo: ['Primeiro capítulo de um romance', 'entre 2.000 e 2.800 palavras, terminando com uma pergunta aberta que puxe o capítulo seguinte', 6000] },
  SYS: `Você é um ficcionista brasileiro experiente. Escreva em português do Brasil uma história original que servirá de referência para outro escritor: ele vai ler a sua versão e escrever a dele, então ela precisa mostrar escolhas claras de cena, ritmo e ponto de vista.
Como escrever:
- Cenas, não resumo. Cada cena com alguém que quer algo, um obstáculo e uma mudança de valor no fim (McKee).
- Detalhe concreto e específico: nomes, lugares, objetos, cheiros, horas. Palavras exatas em vez de gerais.
- Subtexto: os personagens não explicam o que sentem; o leitor percebe pelo que fazem e pelo que evitam dizer.
- Diálogo com travessão (—), curto, com marcas de fala de gente real.
- Frases de tamanhos variados. Nada de "não é apenas X, é Y", perguntas retóricas respondidas na sequência, trios automáticos, "de repente", "mergulhar", "jornada", "vibrante", "crucial".
- Final que fecha a mudança da personagem sem explicar a lição nem resumir a história.
Formato da resposta: primeira linha "# Título". Depois só a história, com parágrafos separados por linha em branco e "* * *" sozinho na linha para quebra de cena. Sem comentários antes ou depois.`,
  async de_claude() {
    const b = App.book;
    const ideias = (await DB.all('ideias')).sort((x, y) => (y.em || 0) - (x.em || 0)).slice(0, 30);
    const gen = OFICIO.generoDe(b);
    const m = App.modal(`<h3>O Claude escreve uma história para você ler ao lado</h3>
      ${ideias.length ? `<label class="f">Partir de uma ideia guardada<select id="gid"><option value="">—</option>${ideias.map(i => `<option value="${i.id}">${esc((i.titulo || i.premissa || '').slice(0, 70))}</option>`).join('')}</select></label>` : ''}
      <label class="f">A ideia<textarea id="gprem" rows="4" placeholder="Quem é, o que quer, o que atrapalha. Ex.: um entregador de São Luís precisa entregar a última encomenda na noite de Natal, e o endereço é a casa do pai com quem não fala há dez anos.">${esc(b.premissa || '')}</textarea></label>
      <div class="grid2"><label class="f">Gênero<select id="ggen"><option value="">Livre</option>${OFICIO.GENEROS.map(g => `<option value="${g.id}" ${gen && gen.id === g.id ? 'selected' : ''}>${esc(g.nome)}</option>`).join('')}</select></label>
      <label class="f">Tamanho<select id="gtam">${Object.entries(this.TAMANHOS).map(([k, [n]]) => `<option value="${k}">${n}</option>`).join('')}</select></label></div>
      <label class="f">Tom, ponto de vista, lugar, o que mais quiser (opcional)<textarea id="gobs" rows="3" placeholder="ex.: primeira pessoa, conforto, Nordeste, sem final trágico"></textarea></label>
      <p class="small muted">Leva um ou dois minutos. A história aparece no painel enquanto é escrita.</p>
      <div class="acts"><button class="btn" data-close>Cancelar</button><button class="btn pri" id="gok">${ic('spark')} Escrever</button></div>`, { wide: true });
    if ($('#gid', m)) $('#gid', m).onchange = e => { const i = ideias.find(x => x.id === e.target.value); if (!i) return; $('#gprem', m).value = i.premissa || ''; if (i.genero) $('#ggen', m).value = i.genero; };
    $('#gok', m).onclick = () => {
      const premissa = $('#gprem', m).value.trim(); if (premissa.length < 10) { App.toast('Escreva a ideia em pelo menos uma frase.'); return; }
      const g = OFICIO.GENEROS.find(x => x.id === $('#ggen', m).value);
      const [tnome, tdesc, max] = this.TAMANHOS[$('#gtam', m).value];
      const obs = $('#gobs', m).value.trim();
      m.close();
      this.gerar({ premissa, g, tnome, tdesc, max, obs });
    };
  },
  async gerar({ premissa, g, tnome, tdesc, max, obs }) {
    if (!this.ligado()) await this.alternar();
    const body = $('#refbody'); if (!body) return;
    $('#desk').classList.remove('vermeu');
    body.innerHTML = `<article class="reftxt" style="--efs:${App.settings.edFont || 19}px"><p class="refnota">${ic('spark')} O Claude está escrevendo…</p><div id="gout"></div></article>`;
    const texto = `Ideia: ${premissa}\nGênero: ${g ? g.nome + ' (promessa do gênero: ' + g.promessa + ')' : 'livre'}\nTamanho: ${tnome}, ${tdesc}.${obs ? '\nPedidos do autor: ' + obs : ''}`;
    const paraHTML = t => this.juntar(Importa.split(t.replace(/\r/g, '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean).map(x => { const h = x.match(/^#{1,3}\s+(.*)$/); return h ? { h: true, text: h[1] } : { html: esc(x.replace(/\n/g, ' ')).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>'), text: x }; })), true);
    try {
      const out = await Claude.chamar({ system: this.SYS, texto, max, onParcial: t => { const el = $('#gout'); if (el) el.innerHTML = t.replace(/^#\s+.*\n?/, '').split(/\n\s*\n/).map(p => `<p>${esc(p.trim())}</p>`).join(''); } });
      const titulo = (out.match(/^#\s+(.+)$/m) || [])[1] || premissa.slice(0, 50);
      await this.guardar({ titulo: titulo.trim(), origem: 'claude', premissa, html: paraHTML(out.replace(/^#\s+.+$/m, '')) });
      App.toast('História pronta e guardada. Ela aparece também nos outros aparelhos.');
    } catch (e) { body.innerHTML = `<div class="refvazio">${Claude.erroHTML(e)}<button class="btn" id="refvolta">Voltar</button></div>`; $('#refvolta').onclick = () => this.render(); }
  },
  /* capítulos [{title, html}] → um texto só, com títulos */
  juntar(chs, semTituloUnico) {
    if (semTituloUnico && chs.length === 1 && /^(Capítulo 1|Sem título)$/.test(chs[0].title)) return chs[0].html;
    return chs.map(c => `<h3>${esc(c.title)}</h3>${c.html}`).join('');
  },
  async epub(f) {
    const zip = await JSZip.loadAsync(f);
    const ler = async p => { const e = zip.file(p) || zip.file(decodeURIComponent(p)); return e ? e.async('string') : ''; };
    const xml = s => new DOMParser().parseFromString(s, 'application/xml');
    const cont = xml(await ler('META-INF/container.xml'));
    const opfPath = cont.querySelector('rootfile')?.getAttribute('full-path'); if (!opfPath) throw new Error('EPUB sem índice');
    const base = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
    const opf = xml(await ler(opfPath));
    const man = {}; opf.querySelectorAll('manifest > item, manifest item').forEach(i => man[i.getAttribute('id')] = i.getAttribute('href'));
    const paras = [];
    for (const it of opf.querySelectorAll('spine itemref')) {
      const href = man[it.getAttribute('idref')]; if (!href) continue;
      const src = await ler(base + href.split('#')[0]); if (!src) continue;
      let doc = new DOMParser().parseFromString(src, 'application/xhtml+xml');
      if (doc.querySelector('parsererror')) doc = new DOMParser().parseFromString(src, 'text/html');
      const corpo = doc.querySelector('body'); if (!corpo) continue;
      corpo.querySelectorAll('h1,h2,h3,p,blockquote,li').forEach(el => {
        const tag = el.tagName.toUpperCase();
        if (el.closest('li') && tag !== 'LI') return;
        if (tag !== 'P' && el.querySelector('p')) return;
        const text = el.textContent.replace(/\s+/g, ' ').trim(); if (!text) return;
        if (/^H[1-3]$/.test(tag)) paras.push({ h: true, text });
        else paras.push({ html: Importa.clean(el.innerHTML.replace(/\s+/g, ' ')), text });
      });
    }
    return Importa.split(paras);
  }
};
