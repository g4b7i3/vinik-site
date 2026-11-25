/* Biblioteca e Progresso */
const BOOK_COLORS = ['#2346a8', '#1f6f78', '#7a2e3a', '#3b3f58', '#8a5a1f', '#4b2c6f', '#245c3a', '#b0442f'];

App.views.biblioteca = {
  async render(v, top) {
    top.innerHTML = `<h2>Biblioteca</h2>
      <button class="iconbtn" id="thm" title="Tema claro ou escuro">${ic('moon')}</button>
      <button class="btn sm" id="bkbanco">${ic('book')} Banco de palavras</button>
      <button class="btn sm" id="bkexp">${ic('dl')} Backup</button>
      <button class="btn sm" id="bkimp">${ic('ul')} Restaurar</button>
      <button class="btn pri sm" id="nb">${ic('plus')} Novo livro</button>${location.pathname.startsWith("/mundovinik") ? `<a class="btn sm ghost" href="nova-senha.html">Trocar senha</a><a class="btn sm ghost" href="sair" title="Sair deste aparelho">Sair</a>` : ''}`;
    $('#nb').onclick = () => this.editBook();
    $('#bkexp').onclick = () => this.backup();
    $('#bkbanco').onclick = async () => { const d = await Banco.carregar(); if (d && !(await App.confirm('O banco de palavras já está carregado (' + nf(Object.keys(d.idx).length) + ' palavras). Trocar pelo arquivo novo?', 'Trocar', false))) return; await Banco.subir(); };
    $('#bkimp').onclick = () => this.restore();
    $('#thm').onclick = async () => {
      const cur = App.settings.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      App.settings.theme = cur === 'dark' ? 'light' : 'dark'; App.applyTheme(); await App.saveSettings();
    };
    const books = App.books;
    const stats = {};
    let total = 0;
    for (const b of books) {
      const ch = await DB.byBook('chapters', b.id);
      const w = ch.reduce((s, c) => s + (c.words || 0), 0);
      stats[b.id] = { words: w, chaps: ch.filter(c => c.type === 'capitulo').length };
      total += w;
    }
    const logs = await DB.all('log');
    const byDay = {}; logs.forEach(l => byDay[l.date] = (byDay[l.date] || 0) + l.words);
    const today = byDay[todayKey()] || 0;
    let streak = 0; { const d = new Date(); if (!byDay[todayKey(d)]) d.setDate(d.getDate() - 1); while (byDay[todayKey(d)]) { streak++; d.setDate(d.getDate() - 1); } }
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const last = App.book;
    v.innerHTML = `<div class="pad">
      <div class="lib-head">
        <div class="hero"><svg class="tile" aria-hidden="true">${azulejo('#fff', 58)}</svg>
          <p class="small" style="opacity:.8">${greet}, Vinik</p>
          <h1>${last ? 'Continue de onde parou' : 'Seus livros moram aqui'}</h1>
          <p>${last ? esc(last.title) + (stats[last.id] ? ' · ' + nf(stats[last.id].words) + ' palavras' : '') : 'Crie um livro ou importe um .docx que você já começou.'}</p>
          <div class="row" style="margin-top:16px">${last ? `<button class="btn" id="cont" style="color:var(--cobalt-d)">${ic('pen')} Continuar escrevendo</button>` : `<button class="btn" id="first" style="color:var(--cobalt-d)">${ic('plus')} Criar o primeiro livro</button>`}</div>
        </div>
        <div class="stats">
          <div class="stat"><b>${nf(today)}</b><span>palavras hoje${App.settings.dailyGoal ? ' de ' + nf(App.settings.dailyGoal) : ''}</span></div>
          <div class="stat"><b>${streak}</b><span>${streak === 1 ? 'dia seguido escrevendo' : 'dias seguidos escrevendo'}</span></div>
          <div class="stat"><b>${nf(total)}</b><span>palavras em todos os livros</span></div>
          <div class="stat"><b>${books.length}</b><span>${books.length === 1 ? 'livro' : 'livros'} na biblioteca</span></div>
        </div>
      </div>
      <div class="sectitle"><h2>Livros</h2><span class="muted small">Toque na capa para abrir</span></div>
      <div class="books">
        ${books.map(b => {
          const st = stats[b.id], pct = b.goalWords ? Math.min(100, Math.round(st.words / b.goalWords * 100)) : 0;
          return `<div class="book"><button class="cover" data-open="${b.id}" style="border:0;padding:0" aria-label="Abrir ${esc(b.title)}">${coverHTML(b)}</button>
            <div class="row" style="justify-content:space-between;flex-wrap:nowrap;align-items:flex-start"><div><div class="t">${esc(b.title)}</div><div class="m">${nf(st.words)} palavras · ${st.chaps} cap.</div></div>
            <button class="iconbtn" data-edit="${b.id}" title="Editar livro">${ic('gear')}</button></div>
            ${b.goalWords ? `<div class="bar" title="${pct}% da meta"><i style="width:${pct}%"></i></div><div class="m">${pct}% de ${nf(b.goalWords)}</div>` : ''}
          </div>`;
        }).join('')}
        <button class="newbook" id="nb2">${ic('plus')}<span>Novo livro</span></button>
      </div>
    </div>`;
    $('#nb2').onclick = () => this.editBook();
    $('#cont') && ($('#cont').onclick = () => App.openBook(last.id));
    $('#first') && ($('#first').onclick = () => this.editBook());
    $$('[data-open]').forEach(b => b.onclick = () => App.openBook(b.dataset.open));
    $$('[data-edit]').forEach(b => b.onclick = () => this.editBook(App.books.find(x => x.id === b.dataset.edit)));
  },
  editBook(book) {
    const isNew = !book;
    const b = book ? { ...book } : { id: DB.uid(), title: '', author: 'Vinik', subtitle: '', genre: '', color: BOOK_COLORS[App.books.length % BOOK_COLORS.length], goalWords: 80000, deadline: '', createdAt: Date.now() };
    const m = App.modal(`<h2>${isNew ? 'Novo livro' : 'Editar livro'}</h2>
      <div class="grid2" style="grid-template-columns:140px minmax(0,1fr)">
        <div><button class="cover" id="cvbtn" style="border:0;padding:0;width:100%" title="Trocar capa">${coverHTML(b)}</button>
          <div class="row" style="margin-top:8px;gap:4px">${BOOK_COLORS.map(c => `<button data-c="${c}" style="width:20px;height:20px;border-radius:50%;border:2px solid ${c === b.color ? 'var(--ink)' : 'transparent'};background:${c}" aria-label="Cor"></button>`).join('')}</div>
          <button class="btn sm ghost" id="cvrm" style="margin-top:6px">${b.cover ? 'Tirar imagem' : 'Toque na capa para pôr imagem'}</button></div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <label class="f">Título<input type="text" id="bt" value="${esc(b.title)}"></label>
          <label class="f">Subtítulo<input type="text" id="bs" value="${esc(b.subtitle || '')}"></label>
          <label class="f">Autor<input type="text" id="ba" value="${esc(b.author || '')}"></label>
        </div>
      </div>
      <div class="grid3">
        <label class="f">Gênero (o app se ajusta)<select id="bgid"><option value="">— nenhum</option>${OFICIO.GENEROS.map(g => `<option value="${g.id}" ${b.generoId === g.id ? 'selected' : ''}>${esc(g.nome)}</option>`).join('')}</select></label>
        <label class="f">Meta de palavras<input type="number" id="bm" min="0" step="1000" value="${b.goalWords || ''}"></label>
        <label class="f">Data de entrega<input type="date" id="bd" value="${esc(b.deadline || '')}"></label>
      </div>
      ${isNew ? `<div class="drop-zone" id="dz">Já começou no Word? Solte aqui um <b>.docx</b> ou <b>.txt</b>, ou <button class="btn sm" id="dzb">escolha o arquivo</button>. Os capítulos são separados sozinhos.</div><div id="dzinfo" class="small muted"></div>` : ''}
      <div class="acts">${isNew ? '' : '<button class="btn danger" id="bdel" style="margin-right:auto">Excluir livro</button>'}<button class="btn" data-close>Cancelar</button><button class="btn pri" id="bok">${isNew ? 'Criar livro' : 'Salvar'}</button></div>`);
    let imported = null;
    const refreshCover = () => { $('#cvbtn', m).innerHTML = coverHTML({ ...b, title: $('#bt', m).value || 'Título', author: $('#ba', m).value }); };
    $('#bt', m).oninput = refreshCover; $('#ba', m).oninput = refreshCover;
    $$('[data-c]', m).forEach(x => x.onclick = () => { b.color = x.dataset.c; $$('[data-c]', m).forEach(y => y.style.borderColor = y === x ? 'var(--ink)' : 'transparent'); refreshCover(); });
    $('#cvbtn', m).onclick = async () => { const f = await App.pickFile('image/*'); if (!f) return; b.cover = await App.shrinkImage(f, 1200, .88); refreshCover(); $('#cvrm', m).textContent = 'Tirar imagem'; };
    $('#cvrm', m).onclick = () => { delete b.cover; refreshCover(); };
    if (isNew) {
      const take = async f => {
        if (!f) return;
        $('#dzinfo', m).textContent = 'Lendo ' + f.name + '…';
        try {
          imported = await Importa.file(f);
          if (!$('#bt', m).value) { $('#bt', m).value = f.name.replace(/\.(docx|txt|md)$/i, ''); refreshCover(); }
          $('#dzinfo', m).textContent = `${imported.length} ${imported.length === 1 ? 'capítulo encontrado' : 'capítulos encontrados'}, ${nf(imported.reduce((s, c) => s + c.words, 0))} palavras.`;
        } catch (e) { $('#dzinfo', m).textContent = 'Não consegui ler esse arquivo: ' + e.message; }
      };
      const dz = $('#dz', m);
      $('#dzb', m).onclick = async () => take(await App.pickFile('.docx,.txt,.md'));
      dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); };
      dz.ondragleave = () => dz.classList.remove('over');
      dz.ondrop = e => { e.preventDefault(); dz.classList.remove('over'); take(e.dataTransfer.files[0]); };
    }
    $('#bdel', m) && ($('#bdel', m).onclick = async () => {
      m.close();
      if (!await App.confirm(`Excluir "${b.title}" e tudo dele (capítulos, fichas, enredo)? Faça um backup antes, se tiver dúvida.`, 'Excluir para sempre')) return;
      await DB.clearBook(b.id); App.books = App.books.filter(x => x.id !== b.id);
      if (App.book?.id === b.id) App.book = App.books[0] || null;
      App.go('biblioteca');
    });
    $('#bok', m).onclick = async () => {
      b.title = $('#bt', m).value.trim() || 'Sem título';
      b.subtitle = $('#bs', m).value.trim(); b.author = $('#ba', m).value.trim();
      b.generoId = $('#bgid', m).value || null; b.genre = b.generoId ? OFICIO.generoDe(b).nome : ''; b.goalWords = +$('#bm', m).value || 0; b.deadline = $('#bd', m).value;
      b.lastOpened = Date.now();
      await DB.put('books', b);
      if (isNew) {
        App.books.unshift(b);
        const chs = imported && imported.length ? imported : [{ title: 'Capítulo 1', html: '<p><br></p>', words: 0 }];
        for (let i = 0; i < chs.length; i++) await DB.put('chapters', { id: DB.uid(), bookId: b.id, order: i, type: chs[i].type || 'capitulo', title: chs[i].title, html: chs[i].html, words: chs[i].words || 0, status: 'rascunho' });
        m.close(); App.openBook(b.id);
      } else {
        const i = App.books.findIndex(x => x.id === b.id); App.books[i] = b;
        if (App.book?.id === b.id) App.book = b;
        m.close(); App.go(App.view);
      }
    };
  },
  async backup() {
    const data = await DB.exportAll();
    await App.download(`mundo-vinik-backup-${todayKey()}.json`, JSON.stringify(data), 'application/json');
    App.settings.lastBackup = Date.now(); await App.saveSettings();
  },
  async restore() {
    const f = await App.pickFile('.json'); if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const n = (data.books || []).length;
      const m = App.modal(`<h3>Restaurar backup com ${n} ${n === 1 ? 'livro' : 'livros'}</h3><p class="muted">Juntar mantém o que já está aqui e acrescenta o do arquivo (itens iguais são atualizados). Substituir apaga tudo deste aparelho antes.</p>
        <div class="acts"><button class="btn" data-close>Cancelar</button><button class="btn danger" id="rsub">Substituir tudo</button><button class="btn pri" id="rjun">Juntar</button></div>`);
      const go = async rep => { m.close(); await DB.importAll(data, rep); App.books = (await DB.all('books')).sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0)); App.book = App.books[0] || null; App.toast('Backup restaurado'); App.go('biblioteca'); };
      $('#rsub', m).onclick = () => go(true); $('#rjun', m).onclick = () => go(false);
    } catch (e) { App.toast('Arquivo inválido: ' + e.message); }
  }
};

App.views.progresso = {
  async render(v, top) {
    top.innerHTML = `<h2>Progresso</h2><label class="f" style="flex-direction:row;align-items:center;gap:8px">Meta diária<input type="number" id="dg" style="width:110px" min="0" step="50" value="${App.settings.dailyGoal || ''}" placeholder="ex.: 800"></label>`;
    $('#dg').onchange = async e => { App.settings.dailyGoal = +e.target.value || 0; await App.saveSettings(); App.go('progresso'); };
    const goal = App.settings.dailyGoal || 0;
    const logs = await DB.all('log');
    const byDay = {}; logs.forEach(l => byDay[l.date] = (byDay[l.date] || 0) + l.words);
    const days = []; const d = new Date(); d.setDate(d.getDate() - 29);
    for (let i = 0; i < 30; i++) { days.push({ k: todayKey(d), w: byDay[todayKey(d)] || 0, lab: d.getDate() }); d.setDate(d.getDate() + 1); }
    const mx = Math.max(goal, ...days.map(x => x.w), 1);
    const sum30 = days.reduce((s, x) => s + x.w, 0);
    const best = Math.max(...days.map(x => x.w));
    let html = `<div class="pad"><div class="card"><div class="row" style="justify-content:space-between"><h3>Palavras por dia, últimos 30 dias</h3><span class="muted small">${nf(sum30)} no total · melhor dia ${nf(best)}</span></div>
      <div class="days" style="margin-top:16px" role="img" aria-label="Gráfico de palavras por dia">${days.map((x, i) => `<i class="${goal && x.w >= goal ? 'hit' : ''} ${i === 29 ? 'today' : ''}" style="height:${Math.max(3, x.w / mx * 100)}%" title="${x.k.split('-').reverse().join('/')}: ${nf(x.w)} palavras"></i>`).join('')}</div>
      <div class="row small muted" style="justify-content:space-between;margin-top:6px"><span>${days[0].k.split('-').reverse().slice(0, 2).join('/')}</span><span>${goal ? 'Barras escuras: meta de ' + nf(goal) + ' batida' : 'Defina uma meta diária acima'}</span><span>hoje</span></div></div>`;
    if (App.book) {
      const b = App.book, ch = await App.chapters();
      const words = ch.reduce((s, c) => s + (c.words || 0), 0);
      const pct = b.goalWords ? Math.min(100, words / b.goalWords * 100) : 0;
      let dl = '';
      if (b.deadline) {
        const left = Math.ceil((new Date(b.deadline + 'T23:59') - new Date()) / 864e5);
        const need = Math.max(0, (b.goalWords || 0) - words);
        dl = left >= 0 ? `<div class="stat"><b>${left}</b><span>dias até ${b.deadline.split('-').reverse().join('/')}${need && left ? ' · ' + nf(Math.ceil(need / Math.max(1, left))) + ' palavras/dia para fechar a meta' : ''}</span></div>` : `<div class="stat"><b style="color:var(--coral)">${-left}</b><span>dias depois da data de entrega</span></div>`;
      }
      const mxc = Math.max(1, ...ch.map(c => c.words || 0));
      html += `<div class="sectitle"><h2>${esc(b.title)}</h2></div>
        <div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
          <div class="stat"><b>${nf(words)}</b><span>palavras${b.goalWords ? ' de ' + nf(b.goalWords) + ' (' + pct.toFixed(0) + '%)' : ''}</span>${b.goalWords ? `<div class="bar" style="margin-top:8px"><i style="width:${pct}%"></i></div>` : ''}</div>
          <div class="stat"><b>${ch.filter(c => c.type === 'capitulo').length}</b><span>capítulos · média ${nf(Math.round(words / Math.max(1, ch.length)))} palavras</span></div>
          <div class="stat"><b>${Math.round(words / 250)}</b><span>páginas de livro, aproximadamente (250 palavras/página)</span></div>
          ${dl}
        </div>
        <div class="card" style="margin-top:16px"><h3 style="margin-bottom:12px">Tamanho de cada capítulo</h3>
        ${ch.map((c, i) => `<div style="display:grid;grid-template-columns:minmax(0,220px) minmax(0,1fr) 80px;gap:12px;align-items:center;padding:5px 0;font-size:14px"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.title)}</span><div class="bar"><i style="width:${(c.words || 0) / mxc * 100}%;background:${c.status === 'revisado' ? 'var(--ok)' : c.status === 'pronto' ? 'var(--cobalt)' : '#8fa3db'}"></i></div><span style="text-align:right;font-variant-numeric:tabular-nums">${nf(c.words)}</span></div>`).join('')}
        <p class="small muted" style="margin-bottom:0">Cor clara: rascunho · azul: pronto · verde: revisado. O estado de cada capítulo muda no painel lateral do Manuscrito.</p></div>`;
    }
    v.innerHTML = html + '</div>';
  }
};
