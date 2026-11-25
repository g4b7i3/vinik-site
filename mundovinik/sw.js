const V='mundovinik-v6';
const FILES=['entrar.html','nova-senha.html','js/norte.js','js/oficio.js','js/palavras.js','js/norte-ui.js','js/ideias.js','js/trilha.js','js/sync.js','js/claude.js','./','index.html','css/app.css','js/vendor/jszip.min.js','js/vendor/mammoth.browser.min.js','js/db.js','js/app.js','js/biblioteca.js','js/sinonimos.js','js/manuscrito.js','js/universo.js','js/enredo.js','js/diagramacao.js','js/exporta.js','icon.svg','manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))));self.clients.claim();});
// rede primeiro, cache se estiver sem internet: assim as atualizações chegam logo
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();if(r.ok&&new URL(e.request.url).origin===location.origin)caches.open(V).then(x=>x.put(e.request,c));return r;}).catch(()=>caches.match(e.request)));});
