/* Exportação: .docx, .md, .txt e EPUB */
const Exporta = {
  menu() {
    const m = App.modal(`<h3>Exportar “${esc(App.book.title)}”</h3><p class="muted" style="margin-top:0">O livro inteiro, na ordem dos capítulos.</p>
      <div style="display:grid;gap:8px">
        <button class="btn" data-x="docx">Word (.docx): com recuo, travessões e notas de rodapé</button>
        <button class="btn" data-x="epub">E-book (.epub): pronto para a Amazon KDP</button>
        <button class="btn" data-x="md">Markdown (.md)</button>
        <button class="btn" data-x="txt">Texto simples (.txt)</button>
        <button class="btn" data-x="pdf">PDF de gráfica: abre a Diagramação</button>
      </div><div class="acts"><button class="btn" data-close>Fechar</button></div>`);
    $$('[data-x]', m).forEach(b => b.onclick = async () => {
      m.close(); await Manuscrito.saveNow?.();
      const x = b.dataset.x;
      if (x === 'pdf') { Diagramacao.mode = 'miolo'; return App.go('diagramacao'); }
      try { await this[x](); } catch (e) { console.error(e); App.toast('Erro ao exportar: ' + e.message, 5000); }
    });
  },
  async data() { const chs = await App.chapters(); let n = 0; return chs.map(c => ({ ...c, label: c.type === 'capitulo' ? 'Capítulo ' + (++n) : CH_TYPES[c.type].split(' ')[0] })); },
  paras(html) { const d = document.createElement('div'); d.innerHTML = html; return [...d.children].filter(p => p.textContent.trim() || p.classList.contains('cena')); },
  async txt() {
    const chs = await this.data(); const b = App.book;
    let out = `${b.title}\n${b.author || ''}\n\n`;
    for (const c of chs) { out += `\n\n${c.type === 'capitulo' ? c.label + ' — ' : ''}${c.title}\n\n`; out += this.paras(c.html).map(p => p.classList.contains('cena') ? '* * *' : p.textContent.trim()).join('\n\n'); }
    await App.download(App.slug(b.title) + '.txt', out, 'text/plain;charset=utf-8');
  },
  inlineMd(el) { let s = ''; el.childNodes.forEach(n => { if (n.nodeType === 3) s += n.textContent; else if (n.tagName === 'EM') s += '*' + this.inlineMd(n) + '*'; else if (n.tagName === 'STRONG') s += '**' + this.inlineMd(n) + '**'; else if (n.classList?.contains('fnote')) s += `[^${n.textContent}]`; else s += this.inlineMd(n); }); return s; },
  async md() {
    const chs = await this.data(); const b = App.book;
    let out = `# ${b.title}\n\n_${b.author || ''}_\n`;
    for (const c of chs) {
      out += `\n\n## ${c.type === 'capitulo' ? c.label + ': ' : ''}${c.title}\n\n`;
      const ps = this.paras(c.html); const notes = [];
      out += ps.map(p => { $$('.fnote', p).forEach(f => notes.push(`[^${f.textContent}]: ${f.dataset.note}`)); return p.classList.contains('cena') ? '* * *' : this.inlineMd(p).trim(); }).join('\n\n');
      if (notes.length) out += '\n\n' + notes.join('\n');
    }
    await App.download(App.slug(b.title) + '.md', out, 'text/markdown;charset=utf-8');
  },
  x: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
  async docx() {
    const chs = await this.data(); const b = App.book; const X = this.x;
    let fnId = 1; const fns = [];
    const runs = (el, fmt = {}) => {
      let s = '';
      el.childNodes.forEach(n => {
        if (n.nodeType === 3) { if (n.textContent) s += `<w:r>${fmt.i || fmt.b ? `<w:rPr>${fmt.b ? '<w:b/>' : ''}${fmt.i ? '<w:i/>' : ''}</w:rPr>` : ''}<w:t xml:space="preserve">${X(n.textContent)}</w:t></w:r>`; }
        else if (n.tagName === 'EM' || n.tagName === 'I') s += runs(n, { ...fmt, i: true });
        else if (n.tagName === 'STRONG' || n.tagName === 'B') s += runs(n, { ...fmt, b: true });
        else if (n.tagName === 'BR') s += '<w:r><w:br/></w:r>';
        else if (n.classList?.contains('fnote')) { fnId++; fns.push(`<w:footnote w:id="${fnId}"><w:p><w:pPr><w:pStyle w:val="FootnoteText"/></w:pPr><w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:footnoteRef/></w:r><w:r><w:t xml:space="preserve"> ${X(n.dataset.note || '')}</w:t></w:r></w:p></w:footnote>`); s += `<w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:footnoteReference w:id="${fnId}"/></w:r>`; }
        else s += runs(n, fmt);
      });
      return s;
    };
    let body = `<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>${X(b.title)}</w:t></w:r></w:p><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>${X(b.author || '')}</w:t></w:r></w:p>`;
    for (const c of chs) {
      body += `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t xml:space="preserve">${X((c.type === 'capitulo' ? c.label + ' — ' : '') + c.title)}</w:t></w:r></w:p>`;
      let first = true, after = false;
      for (const p of this.paras(c.html)) {
        if (p.classList.contains('cena')) { body += `<w:p><w:pPr><w:pStyle w:val="Cena"/></w:pPr><w:r><w:t>* * *</w:t></w:r></w:p>`; after = true; continue; }
        const noind = first || after || p.classList.contains('noind'); first = after = false;
        body += `<w:p>${noind ? '<w:pPr><w:pStyle w:val="SemRecuo"/></w:pPr>' : ''}${runs(p)}</w:p>`;
      }
    }
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr><w:pgSz w:w="9071" w:h="13039"/><w:pgMar w:top="1134" w:right="907" w:bottom="1247" w:left="1247" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Garamond" w:hAnsi="Garamond" w:cs="Garamond"/><w:sz w:val="24"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:ind w:firstLine="709"/><w:jc w:val="both"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="SemRecuo"><w:name w:val="Sem recuo"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:firstLine="0"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Cena"><w:name w:val="Quebra de cena"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="240" w:after="240"/><w:ind w:firstLine="0"/><w:jc w:val="center"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="2400" w:after="240"/><w:ind w:firstLine="0"/><w:jc w:val="center"/></w:pPr><w:rPr><w:sz w:val="56"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="SemRecuo"/><w:pPr><w:keepNext/><w:pageBreakBefore/><w:spacing w:before="1800" w:after="600"/><w:ind w:firstLine="0"/><w:jc w:val="center"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:sz w:val="36"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="FootnoteText"><w:name w:val="footnote text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:line="240" w:lineRule="auto"/><w:ind w:firstLine="0"/></w:pPr><w:rPr><w:sz w:val="18"/></w:rPr></w:style></w:styles>`;
    const footnotes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:footnote w:type="separator" w:id="0"><w:p><w:r><w:separator/></w:r></w:p></w:footnote><w:footnote w:type="continuationSeparator" w:id="1"><w:p><w:r><w:continuationSeparator/></w:r></w:p></w:footnote>${fns.join('')}</w:footnotes>`;
    const z = new JSZip();
    z.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/></Types>`);
    z.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
    z.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/></Relationships>`);
    z.file('word/document.xml', doc); z.file('word/styles.xml', styles); z.file('word/footnotes.xml', footnotes);
    const blob = await z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    await App.download(App.slug(b.title) + '.docx', blob);
  },
  async coverJPG() {
    const b = App.book;
    if (b.cover) { const img = new Image(); img.src = b.cover; await img.decode(); const c = document.createElement('canvas'); c.width = 1600; c.height = 2560; const g = c.getContext('2d'); const k = Math.max(1600 / img.width, 2560 / img.height); g.drawImage(img, (1600 - img.width * k) / 2, (2560 - img.height * k) / 2, img.width * k, img.height * k); return new Promise(r => c.toBlob(r, 'image/jpeg', .9)); }
    const c = document.createElement('canvas'); c.width = 1600; c.height = 2560; const g = c.getContext('2d');
    g.fillStyle = b.color || '#2346a8'; g.fillRect(0, 0, 1600, 2560);
    g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 3;
    for (let x = 0; x < 1600; x += 160) for (let y = 0; y < 2560; y += 160) { g.strokeRect(x, y, 160, 160); g.beginPath(); g.moveTo(x + 80, y + 18); g.quadraticCurveTo(x + 96, y + 64, x + 142, y + 80); g.quadraticCurveTo(x + 96, y + 96, x + 80, y + 142); g.quadraticCurveTo(x + 64, y + 96, x + 18, y + 80); g.quadraticCurveTo(x + 64, y + 64, x + 80, y + 18); g.stroke(); }
    g.fillStyle = 'rgba(10,15,35,.55)'; g.fillRect(120, 760, 1360, 900);
    g.fillStyle = '#fff'; g.textAlign = 'center';
    await document.fonts.load('600 120px Fraunces').catch(() => { });
    const words = b.title.split(' '); let lines = [], cur = '';
    g.font = '600 130px Fraunces, Georgia, serif';
    words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > 1200) { lines.push(cur); cur = w; } else cur = t; }); lines.push(cur);
    lines.forEach((l, i) => g.fillText(l, 800, 1080 + i * 150 - (lines.length - 1) * 75));
    g.font = '500 64px Figtree, sans-serif'; g.fillText((b.author || '').toUpperCase(), 800, 1560);
    return new Promise(r => c.toBlob(r, 'image/jpeg', .9));
  },
  async epub() {
    const b = App.book, L = Diagramacao.L(), E = b.ebook || {}; const chs = await this.data();
    App.toast('Montando o EPUB…'); b.publicado = true;
    const X = this.x; const uid = 'urn:uuid:' + (b.epubId || (b.epubId = crypto.randomUUID?.() || DB.uid())); await App.saveBook();
    const page = (title, body, type = '') => `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="pt-BR" lang="pt-BR"><head><meta charset="UTF-8"/><title>${X(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head><body${type ? ` epub:type="${type}"` : ''}>${body}</body></html>`;
    const ser = new XMLSerializer();
    const toX = el => ser.serializeToString(el).replace(/ xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g, '');
    const files = [], toc = [];
    files.push({ id: 'titlepage', href: 'titlepage.xhtml', html: page(b.title, `<section epub:type="titlepage" class="titlepage"><p class="tp-author">${X(b.author || '')}</p><h1 class="tp-title">${X(b.title)}</h1>${b.subtitle ? `<p class="tp-sub">${X(b.subtitle)}</p>` : ''}<p class="tp-pub">${X(L.editora || '')}</p></section>`) });
    files.push({ id: 'copyright', href: 'copyright.xhtml', html: page('Créditos', `<section epub:type="copyright-page" class="copy"><p>© ${X(L.ano)} ${X(b.author || '')}</p><p>Todos os direitos reservados.</p><p>${X(L.edicao || '')}</p>${E.isbn ? `<p>ISBN ${X(E.isbn)}</p>` : ''}<p>${X(L.editora || '')}</p></section>`) });
    if (L.dedicatoria) files.push({ id: 'dedicatoria', href: 'dedicatoria.xhtml', html: page('Dedicatória', `<section epub:type="dedication" class="ded"><p>${X(L.dedicatoria).replace(/\n/g, '<br/>')}</p></section>`) });
    if (L.epigrafe) files.push({ id: 'epigrafe', href: 'epigrafe.xhtml', html: page('Epígrafe', `<section epub:type="epigraph" class="epi"><p>${X(L.epigrafe).replace(/\n/g, '<br/>')}</p>${L.epigrafeAutor ? `<p class="epi-a">${X(L.epigrafeAutor)}</p>` : ''}</section>`) });
    chs.forEach((c, i) => {
      const id = 'cap' + String(i + 1).padStart(3, '0');
      const ps = this.paras(c.html); let first = true, after = false; const notes = [];
      const body = ps.map(p => {
        if (p.classList.contains('cena')) { after = true; return '<p class="cena">* * *</p>'; }
        const q = document.createElement('p'); q.innerHTML = p.innerHTML;
        $$('.fnote', q).forEach(f => { const n = notes.length + 1; notes.push(f.dataset.note || ''); const a = document.createElement('a'); a.setAttribute('epub:type', 'noteref'); a.setAttribute('href', `#n${n}`); a.id = `r${n}`; a.className = 'nref'; a.textContent = n; f.replaceWith(a); });
        $$('mark,span', q).forEach(s => s.replaceWith(...s.childNodes));
        q.className = first ? (E.dropcap !== false && /^[\p{L}]/u.test(q.textContent.trim()) ? 'first drop' : 'first') : after || p.classList.contains('noind') ? 'noind' : '';
        if (!q.className) q.removeAttribute('class');
        first = after = false; return toX(q);
      }).join('\n');
      const nt = notes.length ? `<section class="notas" epub:type="endnotes"><hr/>${notes.map((n, k) => `<aside epub:type="footnote" id="n${k + 1}"><p><a href="#r${k + 1}">${k + 1}</a>. ${X(n)}</p></aside>`).join('')}</section>` : '';
      const head = c.type === 'parte' ? `<h1 class="parte">${X(c.title)}</h1>` : `<header>${c.type === 'capitulo' ? `<p class="cnum">${X(c.label)}</p>` : ''}<h1>${X(c.title)}</h1></header>`;
      files.push({ id, href: id + '.xhtml', html: page(c.title, `<section epub:type="${c.type === 'parte' ? 'part' : 'chapter'}">${head}\n${body}${nt}</section>`) });
      toc.push({ href: id + '.xhtml', t: (c.type === 'capitulo' ? c.label + ': ' : '') + c.title });
    });
    const css = `body{font-family:serif;line-height:1.5;margin:0 4%}p{margin:0;text-indent:1.4em;text-align:justify}p.first,p.noind{text-indent:0}p.cena{text-align:center;text-indent:0;margin:1.2em 0}
header{margin:3em 0 2em;text-align:center}h1{font-weight:normal;font-size:1.6em;text-align:center;margin:0 0 .6em}.cnum{text-indent:0;text-align:center;letter-spacing:.25em;font-size:.8em;text-transform:uppercase;margin-bottom:.5em}
h1.parte{margin-top:35%;font-size:1.8em}p.drop::first-letter{float:left;font-size:3.1em;line-height:.85;margin:.05em .08em 0 0}
.titlepage{text-align:center;margin-top:20%}.titlepage p{text-indent:0;text-align:center}.tp-title{font-size:2em;margin:2em 0 .4em}.tp-sub{font-style:italic}.tp-author{letter-spacing:.15em}.tp-pub{margin-top:4em;font-size:.85em}
.copy{margin-top:50%;font-size:.8em}.copy p{text-indent:0;text-align:left}.ded,.epi{margin:30% 0 0 30%;font-style:italic}.ded p,.epi p{text-indent:0;text-align:right}.epi-a{font-style:normal;font-size:.9em;margin-top:.6em}
a.nref{vertical-align:super;font-size:.65em;text-decoration:none}.notas{font-size:.85em;margin-top:2em}.notas p{text-indent:0}nav ol{list-style:none;padding:0}nav li{margin:.4em 0}`;
    const nav = page('Sumário', `<nav epub:type="toc" id="toc"><h1>Sumário</h1><ol>${toc.map(t => `<li><a href="${t.href}">${X(t.t)}</a></li>`).join('')}</ol></nav><nav epub:type="landmarks" hidden=""><ol><li><a epub:type="cover" href="cover.xhtml">Capa</a></li><li><a epub:type="toc" href="nav.xhtml">Sumário</a></li><li><a epub:type="bodymatter" href="${toc[0]?.href || 'titlepage.xhtml'}">Início</a></li></ol></nav>`);
    const ncx = `<?xml version="1.0" encoding="UTF-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${uid}"/></head><docTitle><text>${X(b.title)}</text></docTitle><navMap>${toc.map((t, i) => `<navPoint id="np${i + 1}" playOrder="${i + 1}"><navLabel><text>${X(t.t)}</text></navLabel><content src="${t.href}"/></navPoint>`).join('')}</navMap></ncx>`;
    const cover = page('Capa', `<div style="text-align:center;margin:0;padding:0"><img src="images/cover.jpg" alt="${X(b.title)}" style="max-width:100%;height:100%"/></div>`, 'cover');
    const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const opf = `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="pt-BR"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">${uid}</dc:identifier><dc:title>${X(b.title)}</dc:title><dc:creator id="autor">${X(b.author || '')}</dc:creator><meta refines="#autor" property="role" scheme="marc:relators">aut</meta><dc:language>pt-BR</dc:language>
${L.editora ? `<dc:publisher>${X(L.editora)}</dc:publisher>` : ''}${E.desc ? `<dc:description>${X(E.desc)}</dc:description>` : ''}${E.isbn ? `<dc:source>urn:isbn:${X(E.isbn.replace(/[^\dX]/gi, ''))}</dc:source>` : ''}<dc:date>${X(L.ano || '')}</dc:date><dc:rights>© ${X(L.ano)} ${X(b.author || '')}</dc:rights><meta property="dcterms:modified">${now}</meta><meta name="cover" content="cover-img"/></metadata>
<manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="css" href="style.css" media-type="text/css"/><item id="cover-img" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/><item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>
${files.map(f => `<item id="${f.id}" href="${f.href}" media-type="application/xhtml+xml"/>`).join('')}</manifest>
<spine toc="ncx"><itemref idref="cover" linear="no"/>${files.map((f, i) => `<itemref idref="${f.id}"/>${i === files.length - chs.length - 1 ? '<itemref idref="nav"/>' : ''}`).join('')}</spine><guide><reference type="cover" title="Capa" href="cover.xhtml"/><reference type="toc" title="Sumário" href="nav.xhtml"/><reference type="text" title="Início" href="${toc[0]?.href || 'titlepage.xhtml'}"/></guide></package>`;
    const z = new JSZip();
    z.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
    z.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);
    z.file('OEBPS/content.opf', opf); z.file('OEBPS/nav.xhtml', nav); z.file('OEBPS/toc.ncx', ncx); z.file('OEBPS/style.css', css); z.file('OEBPS/cover.xhtml', cover);
    z.file('OEBPS/images/cover.jpg', await this.coverJPG());
    files.forEach(f => z.file('OEBPS/' + f.href, f.html));
    const blob = await z.generateAsync({ type: 'blob', mimeType: 'application/epub+zip', compression: 'DEFLATE' });
    await App.download(App.slug(b.title) + '.epub', blob);
  }
};
