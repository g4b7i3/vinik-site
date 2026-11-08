/* Léxico: os livros não ficam no site.
   O pacote lexico-livros e os PDFs são carregados uma vez por aparelho e
   guardados no IndexedDB deste navegador. Depois disso, o app abre como antes. */
(function () {
  'use strict';
  var BANCO = 'lexico-acervo', LOJA = 'arquivos';
  var PDFS = {
    'livros/dicionario-analogico.pdf': { chave: 'pdf-dicionario', nome: 'PDF do Dicionário analógico' },
    'livros/comunicacao-em-prosa-moderna.pdf': { chave: 'pdf-othon', nome: 'PDF de Comunicação em prosa moderna' }
  };
  var ITENS = [
    { chave: 'dados', nome: 'Dicionário analógico (índice e grupos)' },
    { chave: 'paginas', nome: 'Páginas dos dois livros' },
    { chave: 'pdf-dicionario', nome: 'PDF do Dicionário analógico', opcional: true },
    { chave: 'pdf-othon', nome: 'PDF de Comunicação em prosa moderna', opcional: true }
  ];

  window.LEXICO_OFFLINE_DATA = {};
  window.LEXICO_BOOK_PAGES = undefined;
  window.lexicoFetch = function (url) {
    var data = window.LEXICO_OFFLINE_DATA[url];
    return Promise.resolve({ ok: data !== undefined, json: function () { return Promise.resolve(data); } });
  };

  function abrir() {
    return new Promise(function (ok, erro) {
      if (!('indexedDB' in window)) return erro(new Error('sem IndexedDB'));
      var r = indexedDB.open(BANCO, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(LOJA); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { erro(r.error); };
    });
  }
  function op(modo, fn) {
    return abrir().then(function (db) {
      return new Promise(function (ok, erro) {
        var t = db.transaction(LOJA, modo), st = t.objectStore(LOJA), req = fn(st);
        t.oncomplete = function () { ok(req && req.result); db.close(); };
        t.onerror = t.onabort = function () { erro(t.error); db.close(); };
      });
    });
  }
  var ler = function (k) { return op('readonly', function (s) { return s.get(k); }); };
  var gravar = function (k, v) { return op('readwrite', function (s) { return s.put(v, k); }); };
  var chaves = function () { return op('readonly', function (s) { return s.getAllKeys(); }); };
  var limpar = function () { return op('readwrite', function (s) { return s.clear(); }); };

  function aviso(txt) {
    var t = document.getElementById('toast');
    if (!t) return alert(txt);
    t.textContent = txt; t.classList.add('show');
    clearTimeout(aviso._t); aviso._t = setTimeout(function () { t.classList.remove('show'); }, 4200);
  }

  function carregarScripts(lista, fim) {
    var i = 0;
    (function prox() {
      if (i >= lista.length) return fim && fim();
      var s = document.createElement('script');
      s.src = lista[i++]; s.onload = prox;
      s.onerror = function () { aviso('Não consegui abrir uma parte do app. Verifique a internet e abra de novo.'); };
      document.body.appendChild(s);
    })();
  }

  // ---------------------------------------------------------------- topo
  var temLivros = false;
  function montarTopo() {
    var acoes = document.querySelector('.top-actions');
    if (!acoes || document.getElementById('btn-acervo')) return;
    var voltar = document.createElement('a');
    voltar.href = '../'; voltar.className = 'estudio-voltar'; voltar.textContent = '‹ Estúdio';
    voltar.setAttribute('aria-label', 'Voltar ao Estúdio');
    var bc = document.querySelector('.breadcrumbs');
    if (bc) bc.parentNode.insertBefore(voltar, bc); else acoes.prepend(voltar);
    var b = document.createElement('button');
    b.id = 'btn-acervo'; b.type = 'button'; b.className = 'acervo-chip';
    b.addEventListener('click', abrirDialogo);
    acoes.prepend(b);
    pintarChip();
  }
  function pintarChip() {
    var b = document.getElementById('btn-acervo');
    if (!b) return;
    b.textContent = temLivros ? 'Livros ✓' : 'Livros neste aparelho';
    b.classList.toggle('falta', !temLivros);
  }

  // ---------------------------------------------------------------- diálogo
  function abrirDialogo() {
    var d = document.getElementById('acervo');
    atualizarLista().then(function () {
      if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    });
  }
  function atualizarLista() {
    return chaves().catch(function () { return []; }).then(function (ks) {
      var ul = document.getElementById('acervo-lista');
      ul.innerHTML = ITENS.map(function (it) {
        var tem = ks.indexOf(it.chave) >= 0;
        return '<li class="' + (tem ? 'ok' : '') + '"><span>' + (tem ? '✓' : (it.opcional ? '○' : '—')) + '</span>' +
          it.nome + (it.opcional && !tem ? ' <small>opcional</small>' : '') + '</li>';
      }).join('');
      return ks;
    });
  }
  function status(t) { document.getElementById('acervo-status').textContent = t; }

  function bytesDe(arq) {
    if (arq.arrayBuffer) return arq.arrayBuffer();
    return new Promise(function (ok, erro) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = erro; r.readAsArrayBuffer(arq); });
  }
  function textoDe(buf) {
    var u = new Uint8Array(buf);
    if (u[0] === 0x1f && u[1] === 0x8b) {
      if (!('DecompressionStream' in window)) throw new Error('Este navegador não abre .gz. Use o Chrome atualizado.');
      var s = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
      return new Response(s).text();
    }
    return Promise.resolve(new TextDecoder('utf-8').decode(u));
  }
  function qualPdf(arq) {
    var n = (arq.name || '').toLowerCase();
    if (/dicion|analog|thesaur/.test(n)) return 'pdf-dicionario';
    if (/comunic|prosa|othon|garcia/.test(n)) return 'pdf-othon';
    return arq.size > 20e6 ? 'pdf-dicionario' : 'pdf-othon';
  }
  function importar(lista) {
    var arquivos = Array.prototype.slice.call(lista);
    if (!arquivos.length) return;
    status('Guardando ' + arquivos.length + (arquivos.length > 1 ? ' arquivos…' : ' arquivo…'));
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
    var feitos = [], erros = [];
    return arquivos.reduce(function (p, arq) {
      return p.then(function () {
        var nome = (arq.name || '').toLowerCase();
        var ehPdf = arq.type === 'application/pdf' || /\.pdf$/.test(nome);
        if (ehPdf) {
          var k = qualPdf(arq);
          return gravar(k, new Blob([arq], { type: 'application/pdf' })).then(function () { feitos.push(k === 'pdf-dicionario' ? 'PDF do dicionário' : 'PDF de Comunicação'); });
        }
        return bytesDe(arq).then(textoDe).then(function (txt) {
          var pac = JSON.parse(txt);
          if (!pac || pac.formato !== 'lexico-livros' || !pac.dados || !pac.paginas) throw new Error('não é o pacote lexico-livros');
          return gravar('dados', pac.dados).then(function () { return gravar('paginas', pac.paginas); })
            .then(function () { feitos.push('pacote dos livros'); });
        });
      }).catch(function (e) { erros.push((arq.name || 'arquivo') + ': ' + (e && e.message || e)); });
    }, Promise.resolve()).then(function () {
      atualizarLista();
      if (erros.length) status('Não consegui guardar: ' + erros.join('; '));
      else { status('Pronto: ' + feitos.join(', ') + '. Abrindo de novo…'); setTimeout(function () { location.reload(); }, 900); }
    });
  }

  function ligarDialogo() {
    var inp = document.getElementById('acervo-arquivos');
    inp.addEventListener('change', function () { importar(inp.files); inp.value = ''; });
    document.getElementById('acervo-apagar').addEventListener('click', function () {
      if (!confirm('Apagar os livros guardados neste aparelho? Seu progresso nos exercícios continua.')) return;
      limpar().then(function () { status('Livros apagados deste aparelho.'); temLivros = false; pintarChip(); atualizarLista(); });
    });
  }

  // ---------------------------------------------------------------- PDFs
  var urls = {};
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var marca = href.indexOf('#') >= 0 ? href.slice(href.indexOf('#')) : '';
    var info = PDFS[href.split('#')[0]];
    if (!info) return;
    ev.preventDefault(); ev.stopPropagation();
    if (urls[info.chave]) return window.open(urls[info.chave] + marca, '_blank');
    var aba = window.open('', '_blank');
    ler(info.chave).then(function (blob) {
      if (!blob) {
        if (aba) aba.close();
        aviso('O ' + info.nome + ' ainda não está neste aparelho. Toque em "Livros neste aparelho" e escolha o arquivo.');
        return;
      }
      urls[info.chave] = URL.createObjectURL(blob);
      if (aba) aba.location.href = urls[info.chave] + marca; else location.href = urls[info.chave] + marca;
    }).catch(function () { if (aba) aba.close(); aviso('Não consegui abrir o PDF guardado.'); });
  }, true);

  // Links vindos do Estúdio: #leitor=othon:123  ·  #dicionario=palavra
  function irPeloEndereco() {
    var h = decodeURIComponent(location.hash.slice(1));
    try {
      var m = h.match(/^leitor=(othon|dicionario):(\d+)$/);
      if (m) { nav('leitor', { book: m[1], page: Number(m[2]) }); return; }
      m = h.match(/^dicionario=(.+)$/);
      if (m) { try { dictionaryQuery = m[1]; dictionaryPage = 0; } catch (e) {} nav('dicionario'); }
    } catch (e) {}
  }

  // ---------------------------------------------------------------- início
  montarTopo();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(function () {});
  ligarDialogo();
  Promise.all([ler('dados'), ler('paginas')]).catch(function () { return [null, null]; }).then(function (r) {
    if (r[0]) window.LEXICO_OFFLINE_DATA = r[0];
    if (r[1]) window.LEXICO_BOOK_PAGES = r[1];
    temLivros = !!(r[0] && r[1]);
    pintarChip();
    carregarScripts(['conteudo.js', 'academia.js', 'app.js'], function () {
      irPeloEndereco();
      window.addEventListener('hashchange', irPeloEndereco);
      if (!temLivros && !sessionStorage.getItem('lexico-aviso-livros')) {
        sessionStorage.setItem('lexico-aviso-livros', '1');
        setTimeout(function () { aviso('Para o dicionário e o leitor, carregue os livros em "Livros neste aparelho".'); }, 1200);
      }
    });
  });
})();

/* Fontes: liga exercícios e lições à página do Othon mais próxima do tema (fontes.json só tem números de página).
   Questões de vocabulário levam ao dicionário analógico. */
(function () {
  var mapa = {};
  fetch('fontes.json').then(function (r) { return r.ok ? r.json() : {}; }).then(function (m) { mapa = m || {}; }).catch(function () {});
  var chave = function (t) { return String(t || '').replace(/\s+/g, ' ').toLowerCase().normalize('NFD').replace(/[^\x00-\x7f]/g, '').trim().slice(0, 120); };
  var link = function (href, txt) { return '<a class="fonte-link" href="' + href + '">' + txt + '</a>'; };
  window.fonteOthon = function (tipo, valor, bloco) {
    var p = mapa[tipo + (tipo === 'l:' ? valor : chave(valor))];
    if (!p) return '';
    return (bloco ? '<p class="fonte-bloco">' : ' ') + link('#leitor=othon:' + p, 'Ler sobre isso no Othon · pág. ' + p + ' do PDF') + (bloco ? '</p>' : '');
  };
  window.fonteQuestao = function (q) {
    if (!q) return '';
    var m = /^q(?:def|term)(v\d+)$/.exec(q.id || '');
    if (m && window.LEXICO_CONTENT) {
      var v = (window.LEXICO_CONTENT.vocab || []).filter(function (x) { return String(x.id) === m[1]; })[0];
      if (v) return ' ' + link('#dicionario=' + encodeURIComponent(v.term), 'Procurar “' + v.term + '” no dicionário analógico');
    }
    return window.fonteOthon('q:', q.prompt);
  };
})();
