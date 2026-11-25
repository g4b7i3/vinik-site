/* Claude dentro do Mundo Vinik: revisão de português e caça de furos.
   O texto vai para a função do site, que chama a API do Claude com a chave guardada na Netlify. */
const Claude = {
  async chamar({ system, texto, max = 4000, onParcial }) {
    let r;
    try {
      r = await fetch('api/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system, max_tokens: max, messages: [{ role: 'user', content: texto }] }) });
    } catch (e) { throw new Error('Sem conexão com o site. A revisão precisa de internet.'); }
    const tipo = r.headers.get('content-type') || '';
    if (!r.ok || !tipo.includes('event-stream')) {
      let d = {}; try { d = await r.json(); } catch (e) { }
      if (r.status === 401) throw new Error('Sua sessão saiu. Entre de novo com a senha.');
      if (d.erro === 'sem-chave') throw new Error('SEM_CHAVE');
      if (r.status === 404 || !tipo.includes('json')) throw new Error('A revisão com o Claude funciona no seu site (vinikautor.com.br/mundovinik), não nesta prévia.');
      throw new Error('O Claude não respondeu (' + (d.status || r.status) + '). ' + (d.detalhe ? String(d.detalhe).slice(0, 160) : 'Tente de novo em instantes.'));
    }
    const leitor = r.body.getReader(), dec = new TextDecoder(); let buf = '', out = '';
    for (;;) {
      const { value, done } = await leitor.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i; while ((i = buf.indexOf('\n\n')) >= 0) {
        const ev = buf.slice(0, i); buf = buf.slice(i + 2);
        const linha = ev.split('\n').find(l => l.startsWith('data:')); if (!linha) continue;
        let d; try { d = JSON.parse(linha.slice(5)); } catch (e) { continue; }
        if (d.type === 'content_block_delta' && d.delta?.type === 'text_delta') { out += d.delta.text; onParcial?.(out); }
        if (d.type === 'error') throw new Error('O Claude parou no meio: ' + (d.error?.message || 'erro'));
      }
    }
    return out;
  },
  json(txt) { const a = txt.indexOf('['), b = txt.lastIndexOf(']'); if (a < 0 || b < a) return []; try { return JSON.parse(txt.slice(a, b + 1)); } catch (e) { return []; } },
  erroHTML(e) {
    if (e.message === 'SEM_CHAVE') return `<div class="warnbox"><b>Falta ligar o Claude no site.</b><br>A revisão usa a API do Claude, que é cobrada à parte do plano do app (centavos por capítulo). Para ligar:<ol style="margin:6px 0 0;padding-left:1.2em;line-height:1.6"><li>Em console.anthropic.com, entre com a sua conta, ponha crédito em Billing e crie uma chave em API Keys.</li><li>Na Netlify, no site vinikautor: Site configuration → Environment variables → Add variable. Nome: <b>ANTHROPIC_API_KEY</b>; valor: a chave.</li><li>Em Deploys, toque em Trigger deploy. Pronto.</li></ol></div>`;
    return `<div class="warnbox">${esc(e.message)}</div>`;
  },
  textoCap(html) { const d = document.createElement('div'); d.innerHTML = html; $$('sup.fnote', d).forEach(f => f.remove()); return [...d.children].map(p => p.classList.contains('cena') ? '* * *' : p.textContent.trim()).filter(Boolean).join('\n\n'); },

  /* ---------- revisão do capítulo ---------- */
  SYS_REV: `Você é revisor de texto literário em português do Brasil, contratado por um escritor. Corrija só erros objetivos: ortografia, acentuação, crase, concordância, regência, pontuação errada, palavras trocadas (mas/mais, a/há, mal/mau, paço/passo, onde/aonde) e erros de digitação.
Não mexa em estilo, ritmo, repetição proposital, escolha de palavras nem em frases corretas. A fala dos personagens pode ser oral de propósito ("tô", "pra", "cê", "a gente vamos" quando é marca da personagem): só aponte se for claramente erro de digitação. Travessão de diálogo é o padrão do autor.
Responda SOMENTE com um array JSON, sem nada antes ou depois:
[{"original":"trecho exato do texto, de 1 a 8 palavras, copiado letra por letra, incluindo a palavra errada","correcao":"o mesmo trecho já corrigido","tipo":"ortografia|acentuação|crase|concordância|regência|pontuação|digitação","motivo":"explicação curta, em até 12 palavras"}]
Se não houver erro, responda [].`,
  async revisar(body, soSelecao) {
    const M = Manuscrito;
    await M.saveNow();
    let texto = soSelecao ? String(getSelection()).trim() : this.textoCap(M.cur.html);
    if (!texto) { body.querySelector('#revres').innerHTML = '<p class="small muted">Selecione um trecho no texto antes.</p>'; return; }
    const partes = []; let atual = '';
    texto.split('\n\n').forEach(p => { if ((atual + p).length > 12000 && atual) { partes.push(atual); atual = ''; } atual += p + '\n\n'; }); if (atual.trim()) partes.push(atual);
    const res = $('#revres'); const btns = $$('#revgo,#revsel'); btns.forEach(b => b.disabled = true);
    M.rev = [];
    try {
      for (let i = 0; i < partes.length; i++) {
        res.innerHTML = `<p class="small muted">Lendo ${partes.length > 1 ? `parte ${i + 1} de ${partes.length}` : 'o capítulo'}… ${M.rev.length} ${M.rev.length === 1 ? 'correção' : 'correções'} até agora</p>`;
        const out = await this.chamar({ system: this.SYS_REV, texto: `Capítulo: ${M.cur.title}\n\n${partes[i]}`, max: 6000, onParcial: t => { const n = (t.match(/"original"/g) || []).length; res.firstElementChild.textContent = `Lendo… ${M.rev.length + n} ${M.rev.length + n === 1 ? 'correção' : 'correções'} até agora`; } });
        this.json(out).forEach(c => { if (c && c.original && c.correcao && c.original !== c.correcao) M.rev.push({ ...c, id: DB.uid() }); });
      }
      M.rev.forEach(c => c.achou = this.marcar(c));
      this.listaRev();
    } catch (e) { res.innerHTML = this.erroHTML(e); }
    btns.forEach(b => b.disabled = false);
  },
  marcar(c) {
    const w = document.createTreeWalker($('#ed'), NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const n = w.currentNode; if (n.parentElement.closest('mark')) continue;
      const i = n.textContent.indexOf(c.original); if (i < 0) continue;
      const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + c.original.length);
      const mk = document.createElement('mark'); mk.className = 'rev'; mk.dataset.rev = c.id; r.surroundContents(mk); return true;
    }
    return false;
  },
  listaRev() {
    const M = Manuscrito, res = $('#revres'); if (!res) return;
    const vivos = (M.rev || []).filter(c => !c.feito);
    if (!M.rev) { res.innerHTML = ''; return; }
    if (!vivos.length) { res.innerHTML = `<p class="small" style="color:var(--ok)">${M.rev.length ? 'Tudo resolvido neste capítulo.' : 'Nenhum erro encontrado neste capítulo.'}</p>`; return; }
    res.innerHTML = `<div class="row" style="justify-content:space-between"><b class="small">${vivos.length} ${vivos.length === 1 ? 'correção' : 'correções'}</b><button class="btn sm" id="revall">Aceitar todas</button></div>
      ${vivos.map(c => `<div class="revcard" data-id="${c.id}"><span class="chip" style="font-size:11px">${esc(c.tipo || 'revisão')}</span>
        <div style="margin:6px 0"><s style="color:var(--coral)">${esc(c.original)}</s> → <b>${esc(c.correcao)}</b></div>
        <div class="small muted">${esc(c.motivo || '')}${c.achou ? '' : ' · não achei o trecho exato no texto; corrija à mão'}</div>
        <div class="row" style="margin-top:8px;gap:6px">${c.achou ? `<button class="btn sm pri" data-ok>Aceitar</button><button class="btn sm" data-ver>Ver no texto</button>` : ''}<button class="btn sm ghost" data-no>Ignorar</button></div></div>`).join('')}`;
    const fim = (c, aceitar) => {
      const mk = $(`#ed mark.rev[data-rev="${c.id}"]`);
      if (mk) { if (aceitar) mk.replaceWith(document.createTextNode(c.correcao)); else mk.replaceWith(...mk.childNodes); $('#ed').normalize(); }
      c.feito = true; M.save(); M.liveCount();
    };
    $$('.revcard', res).forEach(card => {
      const c = M.rev.find(x => x.id === card.dataset.id);
      $('[data-ok]', card) && ($('[data-ok]', card).onclick = () => { fim(c, true); this.listaRev(); });
      $('[data-no]', card).onclick = () => { fim(c, false); this.listaRev(); };
      $('[data-ver]', card) && ($('[data-ver]', card).onclick = () => $(`#ed mark.rev[data-rev="${c.id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    });
    $('#revall').onclick = () => { vivos.filter(c => c.achou).forEach(c => fim(c, true)); this.listaRev(); };
  },
  abaRevisao(body) {
    body.innerHTML = `<p class="small muted" style="margin:0">O Claude lê o capítulo e aponta erros de português: ortografia, acentuação, crase, concordância, pontuação. Ele não reescreve nada; você aceita ou ignora cada correção.</p>
      <div class="row"><button class="btn pri sm" id="revgo">Revisar capítulo</button><button class="btn sm" id="revsel">Só o trecho selecionado</button></div>
      <div id="revres" style="display:flex;flex-direction:column;gap:8px"></div>`;
    let sel = '';
    $('#revsel').onmousedown = () => { sel = String(getSelection()); };
    $('#revgo').onclick = () => this.revisar(body, false);
    $('#revsel').onclick = () => { if (!sel.trim()) { $('#revres').innerHTML = '<p class="small muted">Selecione um trecho no texto antes.</p>'; return; } const r = getSelection(); this.revisarTexto(sel); };
    if (Manuscrito.rev) { Manuscrito.rev.filter(c => !c.feito).forEach(c => c.achou = this.marcar(c)); this.listaRev(); }
  },
  async revisarTexto(t) {
    const M = Manuscrito; M.rev = []; const res = $('#revres');
    res.innerHTML = '<p class="small muted">Lendo o trecho…</p>';
    try { const out = await this.chamar({ system: this.SYS_REV, texto: t, max: 3000 }); this.json(out).forEach(c => { if (c && c.original && c.correcao && c.original !== c.correcao) M.rev.push({ ...c, id: DB.uid() }); }); M.rev.forEach(c => c.achou = this.marcar(c)); this.listaRev(); }
    catch (e) { res.innerHTML = this.erroHTML(e); }
  },

  /* ---------- furos na história ---------- */
  SYS_FUROS: `Você é editor de ficção, atento à continuidade, lendo o livro de um escritor brasileiro. Aponte furos: contradições de fatos (idade, aparência, cor dos olhos, nomes, parentesco, datas, lugares, clima), personagem que morreu ou foi embora e volta sem explicação, objeto que some ou aparece, linha do tempo impossível, personagem que sabe algo que não poderia saber, promessa da trama que fica sem resposta, e contradições entre o texto e as fichas.
Não comente estilo nem gramática. Não reescreva o texto do autor.
Responda SOMENTE com um array JSON, sem nada antes ou depois:
[{"capitulo":"título exato do capítulo onde o problema aparece","trecho":"citação exata e curta desse capítulo, até 12 palavras, copiada letra por letra","problema":"o que não fecha, dizendo o que foi estabelecido antes e onde","gravidade":"alta|média|baixa","sugestao":"como resolver, em uma frase"}]
No máximo 25 itens, os mais graves primeiro. Se não achar nada, responda [].`,
  async furos() {
    await Manuscrito.saveNow?.();
    const b = App.book; const chs = await App.chapters(); const fichas = await DB.byBook('fichas', b.id);
    const ultimo = b.furos;
    const m = App.modal(`<h2>Furos na história</h2>
      <p class="muted" style="margin:0">O Claude lê o livro e as fichas do Universo e aponta o que não fecha: olho verde que vira azul, personagem morto que volta a falar, data que não bate. Você decide se foi de propósito.</p>
      <div class="row"><label class="row small" style="gap:6px"><input type="radio" name="fesc" value="tudo" checked> Livro inteiro</label><label class="row small" style="gap:6px"><input type="radio" name="fesc" value="ate"> Só até o capítulo aberto</label></div>
      <div class="row"><button class="btn pri" id="fgo">Procurar furos</button><span class="small muted" id="fcusto"></span></div>
      <div id="fres" style="display:flex;flex-direction:column;gap:10px"></div>
      <div class="acts"><button class="btn" data-close>Fechar</button></div>`, { wide: true });
    const montar = () => {
      const ate = $('input[name=fesc]:checked', m).value === 'ate';
      const fim = ate && Manuscrito.cur ? chs.findIndex(c => c.id === Manuscrito.cur.id) + 1 : chs.length;
      let n = 0;
      const livro = chs.slice(0, fim).map(c => `### ${c.type === 'capitulo' ? 'Capítulo ' + (++n) + ': ' : ''}${c.title}\n${this.textoCap(c.html)}`).join('\n\n');
      const fich = fichas.map(f => `- ${f.name} (${UNIV_KINDS[f.kind] || f.kind}${f.role ? ', ' + f.role : ''})${f.aliases ? ' · também chamado: ' + f.aliases : ''}${f.summary ? ': ' + f.summary : ''}${(f.fields || []).filter(x => x.v).map(x => ` · ${x.k}: ${x.v}`).join('')}`).join('\n');
      return `LIVRO: ${b.title}${b.author ? ', de ' + b.author : ''}\n\nFICHAS DO UNIVERSO:\n${fich || '(nenhuma)'}\n\nTEXTO:\n${livro}`;
    };
    const custo = () => { const t = montar().length; $('#fcusto', m).textContent = t > 480000 ? 'O livro passa do limite de leitura de uma vez; use "Só até o capítulo aberto".' : `cerca de ${nf(Math.round(t / 3.6 / 1000))} mil tokens de leitura`; };
    $$('input[name=fesc]', m).forEach(i => i.onchange = custo); custo();
    if (ultimo?.itens) this.listaFuros(ultimo, $('#fres', m), m);
    $('#fgo', m).onclick = async () => {
      const texto = montar(); if (texto.length > 480000) return App.toast('Grande demais de uma vez; escolha "Só até o capítulo aberto"');
      const res = $('#fres', m); $('#fgo', m).disabled = true;
      res.innerHTML = '<p class="muted">Lendo o livro inteiro. Leva de meio minuto a uns três minutos.</p>';
      try {
        const out = await this.chamar({ system: this.SYS_FUROS, texto, max: 8000, onParcial: t => { const n = (t.match(/"problema"/g) || []).length; res.firstElementChild.textContent = `Lendo… ${n} ${n === 1 ? 'furo encontrado' : 'furos encontrados'} até agora`; } });
        b.furos = { em: Date.now(), itens: this.json(out).filter(x => x && x.problema) };
        await App.saveBook();
        this.listaFuros(b.furos, res, m);
      } catch (e) { res.innerHTML = this.erroHTML(e); }
      $('#fgo', m).disabled = false;
    };
  },
  listaFuros(f, res, m) {
    const cor = { alta: 'var(--coral)', 'média': '#b07a1f', baixa: 'var(--mute)' };
    if (!f.itens.length) { res.innerHTML = `<p style="color:var(--ok)">Nenhum furo encontrado na leitura de ${new Date(f.em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}.</p>`; return; }
    res.innerHTML = `<p class="small muted" style="margin:0">Leitura de ${new Date(f.em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · ${f.itens.length} ${f.itens.length === 1 ? 'ponto' : 'pontos'} para conferir</p>` +
      f.itens.map((x, i) => `<div class="card" style="padding:14px;border-left:4px solid ${cor[x.gravidade] || 'var(--line)'}">
        <div class="row" style="justify-content:space-between"><b>${esc(x.capitulo || '')}</b><span class="chip" style="font-size:12px;color:${cor[x.gravidade] || 'inherit'}">${esc(x.gravidade || '')}</span></div>
        ${x.trecho ? `<p style="margin:8px 0;font-family:var(--serif);font-style:italic">“${esc(x.trecho)}”</p>` : ''}
        <p style="margin:6px 0">${esc(x.problema)}</p>${x.sugestao ? `<p class="small muted" style="margin:0">Sugestão: ${esc(x.sugestao)}</p>` : ''}
        <div class="row" style="margin-top:8px;gap:6px"><button class="btn sm" data-ir="${i}">Ir ao trecho</button><button class="btn sm ghost" data-ok="${i}">Resolvido</button></div></div>`).join('');
    $$('[data-ir]', res).forEach(bt => bt.onclick = async () => {
      const x = f.itens[+bt.dataset.ir]; const chs = await App.chapters();
      const alvo = chs.find(c => c.title.trim().toLowerCase() === String(x.capitulo || '').replace(/^cap[ií]tulo\s*\d+\s*[:.\-–—]\s*/i, '').trim().toLowerCase()) || chs.find(c => String(x.capitulo || '').toLowerCase().includes(c.title.toLowerCase()));
      m.close(); if (!alvo) return App.toast('Não achei o capítulo “' + x.capitulo + '”');
      App.book.lastChapter = alvo.id;
      if (App.view === 'manuscrito') { await Manuscrito.saveNow(); Manuscrito.load(Manuscrito.chs.find(c => c.id === alvo.id)); } else await App.go('manuscrito');
      if (x.trecho) { const ok = Manuscrito.highlight(x.trecho, 'find'); if (!ok) Manuscrito.highlight(x.trecho.split(/\s+/).slice(0, 4).join(' '), 'find'); }
    });
    $$('[data-ok]', res).forEach(bt => bt.onclick = async () => { f.itens.splice(+bt.dataset.ok, 1); await App.saveBook(); this.listaFuros(f, res, m); });
  }
};
