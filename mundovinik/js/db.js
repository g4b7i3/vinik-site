/* Mundo Vinik — armazenamento local (IndexedDB), pronto para sincronizar depois */
const DB = (() => {
  const NAME = 'mundovinik', VER = 4;
  const STORES = ['books', 'chapters', 'fichas', 'cards', 'links', 'scenes', 'snapshots', 'log', 'meta', 'ideias', 'ajustes', 'referencias'];
  let dbp = null;
  let memory = null; // fallback se IndexedDB não existir

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res) => {
      let req;
      try { req = indexedDB.open(NAME, VER); } catch (e) { memory = {}; STORES.forEach(s => memory[s] = new Map()); return res(null); }
      req.onupgradeneeded = () => {
        const d = req.result;
        STORES.forEach(s => {
          if (!d.objectStoreNames.contains(s)) {
            const st = d.createObjectStore(s, { keyPath: 'id' });
            if (s !== 'books' && s !== 'meta' && s !== 'ajustes') st.createIndex('bookId', 'bookId');
          }
        });
      };
      req.onsuccess = () => res(req.result);
      req.onerror = () => { memory = {}; STORES.forEach(s => memory[s] = new Map()); res(null); };
    });
    return dbp;
  }

  async function tx(store, mode, fn) {
    const d = await open();
    if (!d) return fn(null);
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode);
      const st = t.objectStore(store);
      let out;
      Promise.resolve(fn(st)).then(v => out = v);
      t.oncomplete = () => res(out);
      t.onerror = () => rej(t.error);
    });
  }
  const wrap = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  const hook = { change: null };
  async function putRaw(store, obj) {
    if (memory) { memory[store].set(obj.id, structuredClone(obj)); return obj; }
    await tx(store, 'readwrite', st => st.put(obj));
    return obj;
  }
  async function put(store, obj) {
    obj.updatedAt = Date.now();
    await putRaw(store, obj);
    hook.change?.(store, obj.id, false);
    return obj;
  }
  async function delRaw(store, id) {
    if (memory) { memory[store].delete(id); return; }
    await tx(store, 'readwrite', st => st.delete(id));
  }
  async function get(store, id) {
    if (memory) return structuredClone(memory[store].get(id));
    const d = await open();
    return wrap(d.transaction(store).objectStore(store).get(id));
  }
  async function all(store) {
    if (memory) return [...memory[store].values()].map(o => structuredClone(o));
    const d = await open();
    return wrap(d.transaction(store).objectStore(store).getAll());
  }
  async function byBook(store, bookId) {
    if (memory) return [...memory[store].values()].filter(o => o.bookId === bookId).map(o => structuredClone(o));
    const d = await open();
    return wrap(d.transaction(store).objectStore(store).index('bookId').getAll(bookId));
  }
  async function del(store, id) { await delRaw(store, id); hook.change?.(store, id, true); }
  async function clearBook(bookId) {
    for (const s of STORES) {
      if (s === 'books' || s === 'meta') continue;
      const items = await byBook(s, bookId);
      for (const it of items) await del(s, it.id);
    }
    await del('books', bookId);
  }
  async function exportAll() {
    const out = { app: 'Mundo Vinik', versao: 1, exportadoEm: new Date().toISOString() };
    for (const s of STORES) out[s] = await all(s);
    return out;
  }
  async function importAll(data, replace) {
    if (!data || data.app !== 'Mundo Vinik') throw new Error('Arquivo de backup inválido');
    for (const s of STORES) {
      if (replace) for (const o of await all(s)) await del(s, o.id);
      for (const o of (data[s] || [])) {
        await put(s, o);
      }
    }
  }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return { open, put, putRaw, get, all, byBook, del, delRaw, clearBook, exportAll, importAll, uid, hook };
})();
