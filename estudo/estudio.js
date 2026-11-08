(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var norm = function (v) { return String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var hoje = new Date();
  var chaveDia = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');

  $('#data').textContent = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  // ------------------------------------------------------------ acervo (mesmo banco do Léxico)
  function abrirBanco() {
    return new Promise(function (ok, erro) {
      if (!('indexedDB' in window)) return erro(new Error('sem IndexedDB'));
      var r = indexedDB.open('lexico-acervo', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('arquivos'); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { erro(r.error); };
    });
  }
  var cache = {};
  function ler(k) {
    if (cache[k]) return cache[k];
    cache[k] = abrirBanco().then(function (db) {
      return new Promise(function (ok, erro) {
        var t = db.transaction('arquivos', 'readonly'), q = t.objectStore('arquivos').get(k);
        q.onsuccess = function () { ok(q.result); db.close(); };
        q.onerror = function () { erro(q.error); db.close(); };
      });
    }).catch(function () { return null; });
    return cache[k];
  }
  var semLivros = '<p class="apagado pequeno">Os livros ainda não estão neste aparelho. <a class="link-botao" href="lexico/">Abra o Léxico</a> e toque em <b>Livros neste aparelho</b>.</p>';

  // ------------------------------------------------------------ palavra do dia
  function semente(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  ler('dados').then(function (dados) {
    var alvo = $('#palavra-corpo');
    if (!dados) { alvo.innerHTML = semLivros; return; }
    var grupos = {}, lista = dados['/assets/data/analogia-grupos.json'] || [], indice = dados['/assets/data/analogia-indice.json'] || [];
    lista.forEach(function (g) { grupos[String(g[0])] = g; });
    // só verbetes limpos: uma palavra, sem ruído de leitura do PDF, com grupos válidos
    var bons = indice.filter(function (e) {
      if (!/^[a-záàâãéêíóôõúüç]{6,16}$/.test(e[0])) return false;
      var refs = String(e[1]).split(',');
      return refs.length >= 2 && refs.length <= 5 && refs.every(function (r) { return /^\d{1,3}$/.test(r) && grupos[r]; });
    });
    if (!bons.length) { alvo.innerHTML = '<p class="apagado">Sem verbetes para hoje.</p>'; return; }
    var e = bons[semente(chaveDia) % bons.length];
    var ideias = String(e[1]).split(',').map(function (r) { return grupos[r]; });
    alvo.innerHTML = '<p class="palavra-termo">' + esc(e[0]) + '</p>' +
      '<div class="palavra-ideias">' + ideias.map(function (g) { return '<span class="ideia">' + esc(g[0]) + ' · ' + esc(g[1]) + '</span>'; }).join('') + '</div>' +
      '<p class="apagado pequeno" style="margin-top:10px">Os grupos de ideias em que o dicionário analógico põe esta palavra. Antes de procurar, tente usá-la numa frase sua.</p>' +
      '<div class="palavra-acoes"><a class="link-botao" href="lexico/#dicionario=' + encodeURIComponent(e[0]) + '">Ver no dicionário</a>' +
      '<button class="link-botao" type="button" id="palavra-buscar">Procurar nos livros</button></div>';
    $('#palavra-buscar').addEventListener('click', function () { $('#busca').value = e[0]; buscar(); $('#busca').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  });

  // ------------------------------------------------------------ ritmo no Léxico
  try {
    var p = JSON.parse(localStorage.getItem('lexico-studio-progress-v1') || '{}');
    var n = (p.activity && p.activity[chaveDia]) || 0;
    $('#ritmo-hoje').textContent = Math.min(n, 99);
    $('#ritmo-barra').style.width = Math.min(100, n * 10) + '%';
    var dias = p.activity ? Object.keys(p.activity).filter(function (k) { return p.activity[k] > 0; }).length : 0;
    $('#ritmo-total').textContent = (p.xp || 0) + ' pontos no total · ' + dias + (dias === 1 ? ' dia de estudo' : ' dias de estudo');
  } catch (e) { $('#ritmo-total').textContent = ''; }

  // ------------------------------------------------------------ busca nos livros
  var NOMES = { dicionario: 'Dicionário analógico', othon: 'Comunicação em prosa moderna' };
  var normCache = {};
  function buscar(ev) {
    if (ev) ev.preventDefault();
    var q = $('#busca').value.trim(), out = $('#busca-resultados');
    var livro = (document.querySelector('input[name="livro"]:checked') || {}).value || 'todos';
    if (norm(q).length < 3) { out.innerHTML = '<p class="busca-nota">Digite ao menos três letras.</p>'; return; }
    out.innerHTML = '<p class="busca-nota">Procurando…</p>';
    ler('paginas').then(function (pag) {
      if (!pag) { out.innerHTML = semLivros; return; }
      var alvo = norm(q), achados = [], total = 0, LIMITE = 8;
      ['othon', 'dicionario'].forEach(function (b) {
        if (livro !== 'todos' && livro !== b) return;
        var paginas = pag[b] || [];
        normCache[b] = normCache[b] || paginas.map(norm);
        normCache[b].forEach(function (t, i) {
          var at = t.indexOf(alvo);
          if (at < 0) return;
          total++;
          if (achados.length < 60) achados.push({ b: b, p: i + 1, txt: paginas[i], at: at });
        });
      });
      if (!total) { out.innerHTML = '<p class="busca-nota">Nada encontrado para “' + esc(q) + '”. O texto vem da leitura automática dos PDFs; tente sem acento ou outra forma da palavra.</p>'; return; }
      out.innerHTML = '<p class="busca-nota">' + total + (total === 1 ? ' página' : ' páginas') + (total > achados.length ? ' · mostrando as ' + achados.length + ' primeiras' : '') + '</p>' +
        achados.map(function (a, n) {
          // o texto normalizado tem o mesmo tamanho do original na maioria dos casos
          var ini = Math.max(0, a.at - 90), fim = Math.min(a.txt.length, a.at + alvo.length + 140);
          var trecho = a.txt.slice(ini, fim).replace(/\s+/g, ' ');
          var rel = a.at - ini, antes = trecho.slice(0, rel), meio = trecho.slice(rel, rel + q.length), depois = trecho.slice(rel + q.length);
          var achouMeio = norm(meio) === alvo;
          var corpo = achouMeio ? esc(antes) + '<mark>' + esc(meio) + '</mark>' + esc(depois) : esc(trecho);
          return '<a class="achado"' + (n >= LIMITE ? ' hidden' : '') + ' href="lexico/#leitor=' + a.b + ':' + a.p + '"><div class="achado-cab"><b>' + NOMES[a.b] + '</b><span>página ' + a.p + '</span></div><p>' + (ini > 0 ? '…' : '') + corpo + (fim < a.txt.length ? '…' : '') + '</p></a>';
        }).join('') + (achados.length > LIMITE ? '<button type="button" class="link-botao mais" id="busca-mais">Ver mais ' + (achados.length - LIMITE) + '</button>' : '');
      var mais = document.getElementById('busca-mais');
      if (mais) mais.addEventListener('click', function () { out.querySelectorAll('.achado[hidden]').forEach(function (e) { e.hidden = false; }); mais.remove(); });
    });
  }
  $('#busca-form').addEventListener('submit', buscar);
  document.querySelectorAll('input[name="livro"]').forEach(function (r) { r.addEventListener('change', function () { if ($('#busca').value.trim()) buscar(); }); });

  // ------------------------------------------------------------ cards
  var CHAVE = 'estudio-cards-v1';
  function ajustes() { try { return JSON.parse(localStorage.getItem(CHAVE) || '{}'); } catch (e) { return {}; } }
  function guardar(a) { try { localStorage.setItem(CHAVE, JSON.stringify(a)); } catch (e) {} }
  function apps() {
    var a = ajustes(), muda = a.muda || {}, fora = a.fora || [];
    var base = (window.ESTUDIO_APPS || []).filter(function (x) { return fora.indexOf(x.id) < 0; }).map(function (x) {
      return Object.assign({}, x, muda[x.id] || {});
    });
    return base.concat(a.extras || []);
  }
  var editando = false, CORES = ['#7a6bd1', '#c2508a', '#2f9bb3', '#b58a2c', '#5f8b7d'];
  function desenhar() {
    var g = $('#grade');
    g.classList.toggle('editando', editando);
    g.innerHTML = apps().map(function (x) {
      var tem = !!x.url, ext = tem && !x.interno;
      var pe = !tem ? 'Toque para colar o link' : (x.interno ? 'Abre aqui no Estúdio' : 'Abre no navegador');
      var marca = x.marca || x.nome.slice(0, 1).toUpperCase();
      var dentro = '<span class="card-marca">' + esc(marca) + '</span><span class="card-nome">' + esc(x.nome) + '</span>' +
        (x.linha ? '<span class="card-linha">' + esc(x.linha) + '</span>' : '') + '<span class="card-pe">' + pe + '</span>' +
        (editando ? '<span class="card-lapis">Editar</span>' : '');
      var estilo = ' style="--cor:' + esc(x.cor || '#5f8b7d') + '"';
      if (editando || !tem) return '<button type="button" class="card' + (tem ? '' : ' sem-link') + '" data-id="' + esc(x.id) + '"' + estilo + '>' + dentro + '</button>';
      return '<a class="card" href="' + esc(x.url) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + estilo + '>' + dentro + '</a>';
    }).join('');
    $('#adicionar').hidden = !editando;
    $('#editar').textContent = editando ? 'Pronto' : 'Editar';
  }
  var emEdicao = null;
  function abrirForm(id) {
    var x = apps().filter(function (a) { return a.id === id; })[0] || { id: '', nome: '', url: '', linha: '' };
    emEdicao = x;
    var f = $('#card-campos');
    f.nome.value = x.nome || ''; f.url.value = x.url && !x.interno ? x.url : (x.interno ? new URL(x.url, location.href).href : '');
    f.linha.value = x.linha || '';
    f.url.readOnly = !!x.interno;
    $('#card-titulo').textContent = x.id ? x.nome : 'Novo app';
    $('#card-apagar').hidden = !x.id;
    $('#card-form').showModal();
  }
  $('#card-form').addEventListener('close', function () {
    var acao = $('#card-form').returnValue, f = $('#card-campos'), a = ajustes();
    a.muda = a.muda || {}; a.fora = a.fora || []; a.extras = a.extras || [];
    if (!emEdicao) return;
    var x = emEdicao; emEdicao = null;
    var ehExtra = a.extras.some(function (e) { return e.id === x.id; });
    if (acao === 'apagar' && x.id) {
      if (ehExtra) a.extras = a.extras.filter(function (e) { return e.id !== x.id; }); else a.fora.push(x.id);
    } else if (acao === 'salvar') {
      var url = f.url.value.trim();
      if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
      var dados = { nome: f.nome.value.trim() || x.nome, linha: f.linha.value.trim() };
      if (!x.interno) dados.url = url;
      if (!x.id) a.extras.push(Object.assign({ id: 'x' + Date.now(), cor: CORES[a.extras.length % CORES.length] }, dados));
      else if (ehExtra) a.extras = a.extras.map(function (e) { return e.id === x.id ? Object.assign({}, e, dados) : e; });
      else a.muda[x.id] = Object.assign({}, a.muda[x.id] || {}, dados);
    } else return;
    guardar(a); desenhar();
  });
  $('#grade').addEventListener('click', function (ev) {
    var b = ev.target.closest('button.card');
    if (b) abrirForm(b.dataset.id);
  });
  $('#editar').addEventListener('click', function () { editando = !editando; desenhar(); });
  $('#adicionar').addEventListener('click', function () { abrirForm(''); });
  desenhar();

  // ------------------------------------------------------------ instalar
  var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var pedido = null, bt = $('#instalar');
  if (!standalone) {
    bt.hidden = false;
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); pedido = e; });
    bt.addEventListener('click', function () {
      if (pedido) { pedido.prompt(); pedido.userChoice.finally(function () { pedido = null; }); return; }
      (ios ? $('#ios') : $('#ajuda')).showModal();
    });
    window.addEventListener('appinstalled', function () { bt.hidden = true; });
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {});
  }
})();
