/* Estudos do Vinik: banco de questões com revisão espaçada.
   O progresso fica no aparelho (localStorage) e sincroniza pelo Netlify Blobs do próprio site
   (loja "estudos", chave "progresso"), pela função netlify/functions/estudos-estado.mjs. */
(function () {
  'use strict';
  const LIVROS = window.ESTUDOS_LIVROS || [];
  const QUESTOES = window.ESTUDOS_QUESTOES || [];
  const POR_ID = Object.fromEntries(QUESTOES.map(q => [q.id, q]));
  const CHAVE = 'estudos-vinik-v1';
  const API = 'api/estado';
  const $ = s => document.querySelector(s);
  const tela = $('#tela');

  /* ---------------- datas ---------------- */
  const hojeStr = () => isoDia(new Date());
  function isoDia(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function somaDias(iso, n) { const [a, m, d] = iso.split('-').map(Number); return isoDia(new Date(a, m - 1, d + n)); }
  function difDias(a, b) { const p = s => { const [x, y, z] = s.split('-').map(Number); return Date.UTC(x, y - 1, z); }; return Math.round((p(b) - p(a)) / 864e5); }

  /* ---------------- estado ---------------- */
  function vazio() { return { v: 1, cartoes: {}, dias: {}, cfg: { novasDia: 15, cfgEm: 0 } }; }
  let S = carregar();
  function carregar() {
    try { const s = JSON.parse(localStorage.getItem(CHAVE)); if (s && s.cartoes) { s.cfg = Object.assign(vazio().cfg, s.cfg || {}); s.dias = s.dias || {}; return s; } } catch (_) {}
    return vazio();
  }
  function guardar(enviar = true) {
    try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch (_) {}
    if (enviar) agendarEnvio();
  }

  /* ---------------- sincronização ---------------- */
  let envioTimer = null, enviando = false;
  function sinc(t) { $('#sinc').textContent = t; }
  function agendarEnvio() { clearTimeout(envioTimer); envioTimer = setTimeout(enviar, 1500); }
  async function enviar() {
    if (enviando) { agendarEnvio(); return; }
    enviando = true;
    try {
      const r = await fetch(API, { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: S }) });
      if (r.status === 401) sinc('Salvo neste aparelho · entre de novo para sincronizar');
      else if (!r.ok) throw 0;
      else sinc('Sincronizado');
    } catch (_) { sinc('Salvo neste aparelho · sincroniza quando houver internet'); }
    enviando = false;
  }
  function juntar(a, b) {
    if (!b || !b.cartoes) return a;
    const r = vazio();
    const ids = new Set([...Object.keys(a.cartoes), ...Object.keys(b.cartoes)]);
    ids.forEach(id => {
      const x = a.cartoes[id], y = b.cartoes[id];
      r.cartoes[id] = !x ? y : !y ? x : ((y.ult || 0) > (x.ult || 0) ? y : x);
    });
    const dias = new Set([...Object.keys(a.dias || {}), ...Object.keys(b.dias || {})]);
    dias.forEach(d => {
      const x = (a.dias || {})[d], y = (b.dias || {})[d];
      r.dias[d] = !x ? y : !y ? x : ((y.feitas || 0) > (x.feitas || 0) ? y : x);
    });
    r.cfg = ((b.cfg || {}).cfgEm || 0) > ((a.cfg || {}).cfgEm || 0) ? Object.assign(vazio().cfg, b.cfg) : a.cfg;
    return r;
  }
  async function puxar() {
    try {
      const r = await fetch(API, { credentials: 'same-origin', cache: 'no-store' });
      if (r.status === 401) { sinc('Salvo neste aparelho · entre de novo para sincronizar'); return; }
      if (!r.ok) throw 0;
      const d = await r.json();
      const antes = JSON.stringify(S);
      S = juntar(S, d.estado);
      guardar(false);
      if (JSON.stringify(S) !== JSON.stringify(d.estado)) enviar(); else sinc('Sincronizado');
      if (antes !== JSON.stringify(S) && !sessao) mostrar(abaAtual);
    } catch (_) { sinc('Salvo neste aparelho · sem conexão agora'); }
  }

  /* ---------------- revisão espaçada (SM-2 simplificado) ----------------
     nota: 0 errei · 1 difícil · 2 bom · 3 fácil */
  function avaliar(id, nota, resposta) {
    const hoje = hojeStr();
    const c = S.cartoes[id] || { rep: 0, int: 0, ease: 2.5, vistos: 0, acertos: 0, lapsos: 0 };
    const nova = !S.cartoes[id];
    c.vistos++;
    if (nota === 0) {
      c.rep = 0; c.int = 1; c.ease = Math.max(1.3, c.ease - 0.2); c.lapsos = (c.lapsos || 0) + 1;
    } else {
      c.acertos++;
      if (c.rep === 0) c.int = [0, 1, 2, 4][nota];
      else if (c.rep === 1) c.int = [0, 3, 6, 9][nota];
      else c.int = Math.max(c.int + 1, Math.round(c.int * (nota === 1 ? 1.2 : nota === 2 ? c.ease : c.ease * 1.3)));
      c.int = Math.min(c.int, 365);
      c.ease = Math.max(1.3, Math.min(3, c.ease + (nota === 1 ? -0.15 : nota === 3 ? 0.15 : 0)));
      c.rep++;
    }
    c.prox = somaDias(hoje, c.int);
    c.ult = Date.now();
    c.nota = nota;
    if (resposta) c.resp = resposta.slice(0, 1500);
    S.cartoes[id] = c;
    const d = S.dias[hoje] || (S.dias[hoje] = { feitas: 0, acertos: 0, novas: 0 });
    d.feitas++; if (nota > 0) d.acertos++; if (nova) d.novas++;
    guardar();
  }
  const pendentes = () => QUESTOES.filter(q => S.cartoes[q.id] && S.cartoes[q.id].prox <= hojeStr());
  function novasDisponiveis() {
    const ja = (S.dias[hojeStr()] || {}).novas || 0;
    const resta = Math.max(0, S.cfg.novasDia - ja);
    // as novas vêm em rodízio pelos capítulos (1, 2, 3… e de novo), para misturar os assuntos desde o começo
    const grupos = {};
    QUESTOES.forEach(q => { if (!S.cartoes[q.id]) (grupos[q.livro + '|' + q.cap] = grupos[q.livro + '|' + q.cap] || []).push(q); });
    const filas = Object.values(grupos), out = [];
    for (let r = 0; out.length < resta && filas.some(f => f.length); r++) filas.forEach(f => { if (f.length && out.length < resta) out.push(f.shift()); });
    return out;
  }
  const firme = id => S.cartoes[id] && S.cartoes[id].int >= 21;

  /* ---------------- utilidades ---------------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function embaralhar(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function intercalar(revisoes, novas) {
    // espalha as novas no meio das revisões e evita duas seguidas do mesmo capítulo quando dá
    const r = embaralhar(revisoes), out = [];
    const passo = novas.length ? Math.max(1, Math.floor(r.length / novas.length)) : 0;
    let n = 0;
    r.forEach((q, i) => { out.push(q); if (passo && (i + 1) % passo === 0 && n < novas.length) out.push(novas[n++]); });
    while (n < novas.length) out.push(novas[n++]);
    for (let i = 1; i < out.length; i++) {
      if (out[i].cap === out[i - 1].cap && out[i].livro === out[i - 1].livro) {
        const j = out.findIndex((q, k) => k > i && !(q.cap === out[i - 1].cap && q.livro === out[i - 1].livro));
        if (j > 0) [out[i], out[j]] = [out[j], out[i]];
      }
    }
    return out;
  }
  const livroDe = id => LIVROS.find(l => l.id === id);
  const capDe = q => (livroDe(q.livro) || { capitulos: [] }).capitulos.find(c => c.n === q.cap) || { titulo: '' };
  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }
  function sequencia() {
    let n = 0, d = hojeStr();
    if (!(S.dias[d] && S.dias[d].feitas)) d = somaDias(d, -1);
    while (S.dias[d] && S.dias[d].feitas) { n++; d = somaDias(d, -1); }
    return n;
  }

  /* ---------------- telas ---------------- */
  let abaAtual = 'hoje', sessao = null;
  function mostrar(aba) {
    abaAtual = aba;
    document.querySelectorAll('#abas button').forEach(b => b.classList.toggle('ativa', b.dataset.aba === aba));
    ({ hoje: telaHoje, livros: telaLivros, progresso: telaProgresso, ajustes: telaAjustes })[aba]();
    window.scrollTo(0, 0);
  }

  function telaHoje() {
    const rev = pendentes(), nov = novasDisponiveis(), hoje = S.dias[hojeStr()] || { feitas: 0, acertos: 0 };
    const amanha = QUESTOES.filter(q => S.cartoes[q.id] && S.cartoes[q.id].prox === somaDias(hojeStr(), 1)).length;
    const total = rev.length + nov.length, seq = sequencia();
    const lendo = LIVROS.filter(l => l.situacao !== 'terminado').map(l => l.titulo);
    let html = `<section class="bloco">
      <p class="rotulo">Revisão de hoje</p>
      <div class="placar">
        <div class="num"><b>${rev.length}</b><span>${rev.length === 1 ? 'questão para revisar' : 'questões para revisar'}</span></div>
        <div class="num"><b>${nov.length}</b><span>${nov.length === 1 ? 'questão nova' : 'questões novas'}</span></div>
      </div>
      ${total ? `<button class="botao largo" data-acao="comecar">Começar · ${plural(total, 'questão', 'questões')}</button>`
              : `<p class="apagado">${hoje.feitas ? 'Tudo em dia. As próximas voltam quando estiverem perto de ser esquecidas.' : 'Nada pendente hoje.'}</p>
                 <div class="acoes"><button class="botao fantasma" data-acao="adiantar">Adiantar 10 revisões</button></div>`}
      <div class="linha-info">
        <span>${seq ? plural(seq, 'dia seguido', 'dias seguidos') : 'Comece a sequência hoje'}</span>
        ${amanha ? `<span>Amanhã: ${amanha}</span>` : ''}
      </div>
    </section>`;
    if (hoje.feitas) html += `<section class="bloco"><p class="rotulo">Feito hoje</p>
      <div class="feito"><b>${hoje.feitas}</b><span>${hoje.feitas === 1 ? 'resposta' : 'respostas'} · ${Math.round(100 * hoje.acertos / hoje.feitas)}% de acerto</span></div></section>`;
    if (lendo.length) html += `<section class="bloco"><p class="rotulo">Lendo agora</p><p>${lendo.map(esc).join(' · ')}</p>
      <div class="acoes"><button class="link" data-ir="livros">Estudar por capítulo</button></div></section>`;
    tela.innerHTML = html;
  }

  function telaLivros() {
    tela.innerHTML = LIVROS.map(l => {
      const qs = QUESTOES.filter(q => q.livro === l.id);
      const vistas = qs.filter(q => S.cartoes[q.id]).length, firmes = qs.filter(q => firme(q.id)).length;
      let parte = '';
      const caps = l.capitulos.map(c => {
        const cq = qs.filter(q => q.cap === c.n);
        if (!cq.length) return '';
        const v = cq.filter(q => S.cartoes[q.id]).length, f = cq.filter(q => firme(q.id)).length;
        let cab = '';
        if (c.parte && c.parte !== parte) { parte = c.parte; cab = `<p class="parte">Parte ${esc(parte)}</p>`; }
        return cab + `<button class="cap" data-acao="capitulo" data-livro="${l.id}" data-cap="${c.n}">
          <span class="cap-n">${c.n}</span><span class="cap-t">${esc(c.titulo)}</span>
          <span class="cap-q">${v}/${cq.length}${f ? ` · ${f} firmes` : ''}</span>
          <span class="trilho"><i style="width:${Math.round(100 * v / cq.length)}%"></i></span></button>`;
      }).join('');
      return `<section class="bloco">
        <div class="livro-cab"><div><p class="rotulo">${esc(l.area || 'Livro')}${l.autor ? ' · ' + esc(l.autor) : ''}</p><h2>${esc(l.titulo)}</h2></div>
        <span class="selo ${l.situacao === 'terminado' ? 'terminado' : ''}">${l.situacao === 'terminado' ? 'Terminado' : 'Lendo'}</span></div>
        <p class="apagado pequeno" style="margin:10px 0 8px">${qs.length} questões · ${vistas} já respondidas · ${firmes} firmes na memória</p>
        <div class="trilho"><i class="firme" style="width:${Math.round(100 * firmes / qs.length)}%"></i></div>
        ${caps}
        <div class="acoes"><button class="botao fantasma" data-acao="prova" data-livro="${l.id}">Prova do livro · 20 questões</button></div>
      </section>`;
    }).join('') + `<p class="apagado pequeno" style="text-align:center">"Firme" é a questão que você acertou tantas vezes que só volta daqui a três semanas ou mais.</p>`;
  }

  function telaProgresso() {
    const dias = [];
    for (let i = 13; i >= 0; i--) dias.push(somaDias(hojeStr(), -i));
    const max = Math.max(5, ...dias.map(d => (S.dias[d] || {}).feitas || 0));
    const todas = Object.values(S.dias).reduce((a, d) => ({ f: a.f + (d.feitas || 0), c: a.c + (d.acertos || 0) }), { f: 0, c: 0 });
    const vistas = QUESTOES.filter(q => S.cartoes[q.id]).length, firmes = QUESTOES.filter(q => firme(q.id)).length;
    const semana = [1, 2, 3, 4, 5, 6, 7].map(n => QUESTOES.filter(q => S.cartoes[q.id] && S.cartoes[q.id].prox === somaDias(hojeStr(), n)).length);
    const dificeis = QUESTOES.filter(q => S.cartoes[q.id] && (S.cartoes[q.id].lapsos || 0) > 0)
      .sort((a, b) => (S.cartoes[b.id].lapsos - S.cartoes[a.id].lapsos) || (S.cartoes[a.id].ease - S.cartoes[b.id].ease)).slice(0, 8);
    tela.innerHTML = `<section class="bloco"><p class="rotulo">Últimos 14 dias</p>
      <div class="dias">${dias.map(d => { const f = (S.dias[d] || {}).feitas || 0; return `<div class="dia ${f ? 'cheio' : ''} ${d === hojeStr() ? 'hoje' : ''}" style="height:${Math.max(6, Math.round(100 * f / max))}%" title="${d}: ${f}"></div>`; }).join('')}</div>
      <div class="dias-legenda"><span>${dias[0].slice(8)}/${dias[0].slice(5, 7)}</span><span>hoje</span></div></section>
      <section class="bloco"><table class="tabela">
        <tr><td>Respostas no total</td><td>${todas.f}</td></tr>
        <tr><td>Acerto geral</td><td>${todas.f ? Math.round(100 * todas.c / todas.f) + '%' : '—'}</td></tr>
        <tr><td>Questões já vistas</td><td>${vistas} de ${QUESTOES.length}</td></tr>
        <tr><td>Firmes na memória</td><td>${firmes}</td></tr>
        <tr><td>Sequência atual</td><td>${plural(sequencia(), 'dia', 'dias')}</td></tr>
        <tr><td>Voltam nos próximos 7 dias</td><td>${semana.reduce((a, b) => a + b, 0)}</td></tr>
      </table></section>
      ${dificeis.length ? `<section class="bloco"><p class="rotulo">As que mais escapam</p><div class="dificeis">${dificeis.map(q =>
        `<div class="dificil">${esc(q.p)}<small>Cap. ${q.cap} · errou ${plural(S.cartoes[q.id].lapsos, 'vez', 'vezes')}</small></div>`).join('')}</div>
        <div class="acoes"><button class="botao fantasma" data-acao="dificeis">Treinar estas agora</button></div></section>` : ''}`;
  }

  function telaAjustes() {
    tela.innerHTML = `<section class="bloco"><p class="rotulo">Ritmo</p>
      <label class="campo"><span>Questões novas por dia</span>
        <select id="novasDia">${[5, 10, 15, 20, 30, 50].map(n => `<option ${n === S.cfg.novasDia ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <p class="apagado pequeno">As revisões não têm limite: todas as que vencerem no dia aparecem.</p></section>
      <section class="bloco texto"><p class="rotulo">Como funciona</p>
        <p>Cada questão nova entra na revisão do dia. Depois de responder, você diz como foi: <b>Errei</b> traz a questão de volta no fim da sessão e amanhã; <b>Difícil</b>, <b>Bom</b> e <b>Fácil</b> empurram a próxima revisão para cada vez mais longe (1, 3, 7, 18, 45 dias…), sempre perto do ponto em que você estaria esquecendo.</p>
        <p>Nas questões abertas, escreva antes de ver a resposta. Tirar a informação da memória com as próprias palavras fixa muito mais do que reler.</p>
        <p>As questões novas aparecem misturadas às revisões e de capítulos diferentes, de propósito.</p></section>
      <section class="bloco"><p class="rotulo">Cópia de segurança</p>
        <p class="apagado pequeno" style="margin-bottom:12px">O progresso sincroniza sozinho entre os aparelhos em que você entrou com a senha. Se quiser uma cópia fora do site:</p>
        <div class="acoes"><button class="botao fantasma" data-acao="baixar">Baixar cópia</button>
        <label class="botao fantasma">Restaurar cópia<input type="file" accept=".json,application/json" id="restaurar" hidden></label></div>
        <div class="acoes" style="margin-top:18px"><button class="link perigo" data-acao="zerar">Apagar todo o progresso</button></div></section>`;
    $('#novasDia').onchange = e => { S.cfg.novasDia = +e.target.value; S.cfg.cfgEm = Date.now(); guardar(); };
    $('#restaurar').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => { const d = JSON.parse(t); if (!d.cartoes) throw 0; S = juntar(vazio(), d); S.cfg.cfgEm = Date.now(); guardar(); sinc('Cópia restaurada'); mostrar('hoje'); })
        .catch(() => sinc('Esse arquivo não é uma cópia do Estudos'));
    };
  }

  /* ---------------- sessão de perguntas ---------------- */
  function iniciar(fila, titulo) {
    if (!fila.length) { sinc('Nenhuma questão aqui ainda'); return; }
    sessao = { fila, i: 0, titulo, feitas: 0, acertos: 0, voltas: new Set(), respondidas: new Set() };
    document.body.classList.add('em-sessao');
    desenharQuestao();
  }
  function sair() { sessao = null; document.body.classList.remove('em-sessao'); mostrar(abaAtual); }

  function desenharQuestao() {
    const s = sessao, q = s.fila[s.i];
    if (!q) return desenharFim();
    const cap = capDe(q), livro = livroDe(q.livro) || {};
    const nova = !S.cartoes[q.id];
    let corpo;
    if (q.tipo === 'escolha') {
      s.ordem = embaralhar(q.op.map((t, k) => k));
      corpo = `<div class="opcoes">${s.ordem.map((k, j) => `<button class="opcao" data-op="${k}"><span class="letra">${'ABCDEF'[j]}</span><span>${esc(q.op[k])}</span></button>`).join('')}</div><div id="depois"></div>`;
    } else {
      corpo = `<textarea id="resp" placeholder="Escreva com as suas palavras antes de ver a resposta">${''}</textarea>
        <div class="acoes" id="acoes-aberta"><button class="botao largo" data-acao="corrigir">Corrigir</button>
        <button class="link" data-acao="revelar">Só ver a resposta</button></div><div id="depois"></div>`;
    }
    tela.innerHTML = `<div class="sessao-topo"><button class="fechar" data-acao="sair" aria-label="Sair da sessão">×</button>
        <div class="trilho"><i style="width:${Math.round(100 * s.i / s.fila.length)}%"></i></div><span class="contagem">${s.i + 1}/${s.fila.length}</span></div>
      <section class="bloco">
        <p class="origem"><b>${esc(livro.titulo || '')}</b> · Cap. ${q.cap} · ${esc(cap.titulo)}${nova ? ' · nova' : ''}</p>
        <p class="pergunta">${esc(q.p)}</p>
        ${corpo}
      </section>`;
    window.scrollTo(0, 0);
  }

  function responderEscolha(k) {
    const s = sessao, q = s.fila[s.i], certa = k === q.c;
    tela.querySelectorAll('.opcao').forEach(b => {
      const v = +b.dataset.op; b.disabled = true;
      if (v === q.c) b.classList.add('certa'); else if (v === k) b.classList.add('errada'); else b.classList.add('apagada');
    });
    $('#depois').innerHTML = `<div class="explica"><p class="veredito ${certa ? 'ok' : 'nao'}">${certa ? 'Certo.' : 'Não foi dessa vez.'}</p>${esc(q.r)}</div>` +
      (certa ? botoesNota(true) : `<div class="acoes"><button class="botao largo" data-nota="0">Continuar</button></div>`);
    $('#depois').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function revelar(aviso) {
    const q = sessao.fila[sessao.i], t = $('#resp').value.trim();
    sessao.resp = t;
    $('#resp').readOnly = true;
    const ac = $('#acoes-aberta'); if (ac) ac.remove();
    $('#depois').innerHTML = (aviso ? `<p class="dica-nota" style="margin-top:14px">${esc(aviso)}</p>` : '') +
      `<div class="explica"><p class="rotulo">Resposta</p>${esc(q.r)}</div>` + botoesNota(false) +
      `<p class="dica-nota">Compare com o que você escreveu: é isso que decide quando ela volta.</p>`;
    $('#depois').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  async function corrigir() {
    const s = sessao, q = s.fila[s.i], t = $('#resp').value.trim();
    if (!t) { $('#resp').focus(); $('#resp').placeholder = 'Escreva alguma coisa antes, mesmo que seja só o que lembrar'; return; }
    const b = tela.querySelector('[data-acao="corrigir"]');
    b.disabled = true; b.textContent = 'Corrigindo…';
    $('#resp').readOnly = true;
    let o = null;
    try {
      const ctl = new AbortController(); const tempo = setTimeout(() => ctl.abort(), 30000);
      const r = await fetch('api/corrigir', { method: 'POST', credentials: 'same-origin', signal: ctl.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pergunta: q.p, referencia: q.r, resposta: t }) });
      clearTimeout(tempo);
      o = await r.json().catch(() => null);
      if (!r.ok) o = { erro: (o && o.erro) || r.status };
    } catch (_) { o = { erro: 'rede' }; }
    if (sessao !== s || s.fila[s.i] !== q) return; // saiu da questão enquanto corrigia
    if (!o || o.erro !== undefined) {
      const msg = o && o.erro === 'sem-chave' ? 'A correção automática ainda não está ligada no site. Compare você mesmo desta vez.'
        : o && o.erro === 'rede' ? 'Sem internet agora, então não deu para corrigir. Compare você mesmo.'
        : 'Não consegui corrigir agora. Compare você mesmo desta vez.';
      $('#resp').readOnly = false; revelar(msg); return;
    }
    s.resp = t;
    const ac = $('#acoes-aberta'); if (ac) ac.remove();
    const nomes = ['Errei', 'Difícil', 'Bom', 'Fácil'];
    const vered = ['Não foi dessa vez.', 'Acertou em parte.', 'Certo.', 'Certo e completo.'][o.nota];
    s.sugerida = o.nota;
    $('#depois').innerHTML = `<div class="explica"><p class="veredito ${o.nota >= 2 ? 'ok' : o.nota === 1 ? 'meio' : 'nao'}">${vered}</p>
        ${o.acertou ? `<p><b>Acertou:</b> ${esc(o.acertou)}</p>` : ''}
        ${o.faltou ? `<p style="margin-top:6px"><b>Faltou:</b> ${esc(o.faltou)}</p>` : ''}
        ${o.dica ? `<p style="margin-top:6px" class="apagado">${esc(o.dica)}</p>` : ''}</div>
      <details class="referencia"><summary>Ver a resposta completa</summary><p>${esc(q.r)}</p></details>
      <div class="acoes"><button class="botao largo" data-nota="${o.nota}">Continuar · ${nomes[o.nota]}, ${previsao(q.id, o.nota)}</button></div>
      <details class="trocar"><summary>Discorda da nota?</summary>${botoesNota(false)}</details>`;
    $('#depois').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function previsao(id, nota) {
    const c = S.cartoes[id] || { rep: 0, int: 0, ease: 2.5 };
    if (nota === 0) return 'volta já';
    let n;
    if (c.rep === 0) n = [0, 1, 2, 4][nota]; else if (c.rep === 1) n = [0, 3, 6, 9][nota];
    else n = Math.min(365, Math.max(c.int + 1, Math.round(c.int * (nota === 1 ? 1.2 : nota === 2 ? c.ease : c.ease * 1.3))));
    return n === 1 ? 'amanhã' : n < 31 ? n + ' dias' : n < 365 ? Math.round(n / 30) + (Math.round(n / 30) === 1 ? ' mês' : ' meses') : '1 ano';
  }
  function botoesNota(acertou) {
    const id = sessao.fila[sessao.i].id;
    const ns = acertou ? [1, 2, 3] : [0, 1, 2, 3];
    const nomes = ['Errei', 'Difícil', 'Bom', 'Fácil'];
    return `<div class="notas ${acertou ? 'tres' : ''}">${ns.map(n => `<button class="nota n${n}" data-nota="${n}"><b>${nomes[n]}</b><small>${previsao(id, n)}</small></button>`).join('')}</div>`;
  }
  function darNota(n) {
    const s = sessao, q = s.fila[s.i];
    // a repetição de uma errada na mesma sessão só serve de treino: a próxima revisão continua amanhã
    if (!s.respondidas.has(q.id)) avaliar(q.id, n, q.tipo === 'aberta' ? s.resp : '');
    s.respondidas.add(q.id);
    s.feitas++; if (n > 0) s.acertos++;
    if (n === 0 && !s.voltas.has(q.id)) { s.voltas.add(q.id); s.fila.push(q); }
    s.resp = '';
    s.i++;
    desenharQuestao();
  }
  function desenharFim() {
    const s = sessao;
    const pct = s.feitas ? Math.round(100 * s.acertos / s.feitas) : 0;
    const rest = pendentes().length + novasDisponiveis().length;
    tela.innerHTML = `<section class="bloco fim"><p class="rotulo">${esc(s.titulo)}</p>
      <h2>${plural(s.feitas, 'resposta', 'respostas')}, ${pct}% de acerto.</h2>
      <p class="apagado">${s.voltas.size ? `${plural(s.voltas.size, 'questão errada voltou', 'questões erradas voltaram')} no fim e ${s.voltas.size === 1 ? 'volta' : 'voltam'} amanhã. ` : ''}${rest ? `Ainda há ${plural(rest, 'questão', 'questões')} para hoje.` : 'Nada mais pendente hoje.'}</p>
      <div class="acoes"><button class="botao" data-acao="sair">Concluir</button>${rest ? '<button class="botao fantasma" data-acao="comecar">Continuar</button>' : ''}</div></section>`;
  }

  /* ---------------- ações ---------------- */
  let zerarArmado = 0;
  document.addEventListener('click', e => {
    const aba = e.target.closest('#abas button');
    if (aba) { mostrar(aba.dataset.aba); return; }
    const ir = e.target.closest('[data-ir]');
    if (ir) { mostrar(ir.dataset.ir); return; }
    const op = e.target.closest('.opcao');
    if (op && !op.disabled && sessao) { responderEscolha(+op.dataset.op); return; }
    const nota = e.target.closest('[data-nota]');
    if (nota && sessao) { darNota(+nota.dataset.nota); return; }
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    const a = b.dataset.acao;
    if (a === 'comecar') { if (sessao) sessao = null; iniciar(intercalar(pendentes(), novasDisponiveis()), 'Revisão do dia'); }
    else if (a === 'adiantar') {
      const prox = QUESTOES.filter(q => S.cartoes[q.id]).sort((x, y) => S.cartoes[x.id].prox < S.cartoes[y.id].prox ? -1 : 1).slice(0, 10);
      iniciar(intercalar(prox, []), 'Revisões adiantadas');
    }
    else if (a === 'capitulo') {
      const l = b.dataset.livro, c = +b.dataset.cap;
      iniciar(embaralhar(QUESTOES.filter(q => q.livro === l && q.cap === c)), 'Capítulo ' + c + ' · ' + (capDe({ livro: l, cap: c }).titulo));
    }
    else if (a === 'prova') { const l = b.dataset.livro; iniciar(intercalar(embaralhar(QUESTOES.filter(q => q.livro === l)).slice(0, 20), []), 'Prova · ' + livroDe(l).titulo); }
    else if (a === 'dificeis') {
      const ds = QUESTOES.filter(q => S.cartoes[q.id] && (S.cartoes[q.id].lapsos || 0) > 0).sort((x, y) => S.cartoes[y.id].lapsos - S.cartoes[x.id].lapsos).slice(0, 8);
      iniciar(embaralhar(ds), 'As que mais escapam');
    }
    else if (a === 'revelar') revelar();
    else if (a === 'corrigir') corrigir();
    else if (a === 'sair') sair();
    else if (a === 'baixar') {
      const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
      const u = URL.createObjectURL(blob), l = document.createElement('a');
      l.href = u; l.download = 'estudos-vinik-' + hojeStr() + '.json'; l.click(); setTimeout(() => URL.revokeObjectURL(u), 2000);
    }
    else if (a === 'zerar') {
      if (Date.now() - zerarArmado < 4000) { S = vazio(); S.cfg.cfgEm = Date.now(); guardar(); zerarArmado = 0; sinc('Progresso apagado'); mostrar('hoje'); }
      else { zerarArmado = Date.now(); b.textContent = 'Toque de novo para confirmar'; setTimeout(() => { if (b.isConnected) b.textContent = 'Apagar todo o progresso'; }, 4000); }
    }
  });
  document.addEventListener('keydown', e => {
    if (!sessao || e.target.tagName === 'TEXTAREA') return;
    const notas = [...tela.querySelectorAll('.notas [data-nota]')].filter(b => b.offsetParent);
    if (notas.length && /^[1-4]$/.test(e.key)) { const b = notas[+e.key - 1]; if (b) b.click(); }
    else if (e.key === 'Enter') { const b = tela.querySelector('.acoes [data-nota]'); if (b) b.click(); }
    else if (!notas.length && /^[1-6]$/.test(e.key)) { const b = tela.querySelectorAll('.opcao')[+e.key - 1]; if (b && !b.disabled) b.click(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { if (!sessao) mostrar(abaAtual); puxar(); } });

  /* ---------------- início ---------------- */
  $('#data').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  mostrar('hoje');
  puxar();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
})();
