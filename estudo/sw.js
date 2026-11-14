/* Estúdio: guarda o app para abrir sem internet. Os livros ficam no IndexedDB, não aqui. */
const VERSAO = 'estudio-v5';
const BASE = new URL('./', self.location).pathname; // /estudo/
const ARQUIVOS = ['', 'estudio.css', 'estudio.js', 'apps.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/apple-touch-icon.png', 'icons/logo-vinik.png', 'icons/badge-96.png',
  'lexico/', 'lexico/style.css', 'lexico/livros.css', 'lexico/livros.js',
  'lexico/conteudo.js', 'lexico/academia.js', 'lexico/app.js', 'lexico/fontes.json',
  'microciclo/', 'quiz/', 'quiz/catalogo-base.json', 'quiz/countries.json', 'quiz/capas.json', 'quiz/assets/world.svg'].map(a => BASE + a);
const LIVRES = [BASE + 'entrar', BASE + 'sair'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => Promise.all(ARQUIVOS.map(u =>
    fetch(u, { credentials: 'same-origin', cache: 'no-cache' }).then(r => { if (pode(r)) return c.put(u, r); }).catch(() => {})
  ))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('estudio-') && k !== VERSAO && k !== 'estudio-fontes').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
function pode(r) { return r && r.ok && !r.redirected && r.type === 'basic'; }

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open('estudio-fontes').then(c => c.match(req).then(m => m || fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }))));
    return;
  }
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
  if (LIVRES.some(p => url.pathname.startsWith(p))) return;
  if (url.pathname.startsWith(BASE + 'api/')) return; // dados sempre da rede

  if (req.mode === 'navigate') {
    // rede primeiro (pega a versão nova e respeita a senha); sem internet, a cópia guardada
    e.respondWith(fetch(req).then(r => {
      if (pode(r)) { const c = r.clone(); caches.open(VERSAO).then(ca => ca.put(url.pathname, c)); }
      return r;
    }).catch(() => caches.match(url.pathname).then(m => m || caches.match(BASE))));
    return;
  }
  // demais arquivos: responde do guardado e atualiza por trás
  e.respondWith(caches.open(VERSAO).then(c => c.match(url.pathname).then(m => {
    const rede = fetch(req).then(r => { if (pode(r)) c.put(url.pathname, r.clone()); return r; }).catch(() => m);
    return m || rede;
  })));
});

// Notificações do Microciclo (enviadas por netlify/functions/estudo-avisos.mjs)
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { corpo: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Microciclo', {
    body: d.corpo || '', tag: d.tag || undefined, renotify: !!d.tag,
    icon: BASE + 'icons/icon-192.png', badge: BASE + 'icons/badge-96.png',
    data: { url: d.url || BASE + 'microciclo/' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const alvo = new URL((e.notification.data && e.notification.data.url) || BASE + 'microciclo/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    const c = cs.find(c => c.url.includes('/estudo/microciclo/')) || cs.find(c => c.url.includes(BASE));
    if (c) return (c.navigate ? c.navigate(alvo).catch(() => c) : Promise.resolve(c)).then(w => (w || c).focus());
    return self.clients.openWindow(alvo);
  }));
});
