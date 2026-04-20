import JSZip from 'jszip';

const FRONTMATTER_TYPES = new Set([
  'cover','titlepage','title-page','halftitlepage','copyright-page',
  'dedication','epigraph','foreword','preface','preamble','introduction',
  'acknowledgments','acknowledgements','seriespage','other-credits',
  'toc','lot','lof','landmarks'
]);
const FRONTMATTER_FILENAME_RE = /cover|title[_-]?page|copyright|dedication|epigraph|foreword|preface|preamble|acknowledgem|front[_-]?matter|toc|table[_-]?of[_-]?contents/i;
const FRONTMATTER_CONTENT_RE = /copyright\s+[\u00a9©]|all rights reserved|published by|first published|isbn[\s\-:]/i;

export async function extractEpub(source, fallbackName) {
  const zip = await JSZip.loadAsync(source);

  const containerXml = await zip.file('META-INF/container.xml').async('text');
  const containerDoc = new DOMParser().parseFromString(containerXml, 'application/xml');
  const opfPath = containerDoc.querySelector('rootfile')?.getAttribute('full-path') || '';
  if (!opfPath) throw new Error('No OPF found');

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
  const opfText = await zip.file(opfPath).async('text');
  const opfDoc = new DOMParser().parseFromString(opfText, 'application/xml');

  const manifest = {};
  opfDoc.querySelectorAll('manifest item').forEach(item => {
    manifest[item.getAttribute('id')] = {
      href: item.getAttribute('href'),
      mediaType: item.getAttribute('media-type') || '',
      epubType: item.getAttribute('epub:type') || ''
    };
  });

  const spineIds = [...opfDoc.querySelectorAll('spine itemref')].map(r => r.getAttribute('idref'));
  const rawName = (source && source.name) || fallbackName || 'Untitled';
  const title = opfDoc.querySelector('metadata title')?.textContent?.trim() || rawName.replace(/\.epub$/i, '');
  const author = opfDoc.querySelector('metadata creator')?.textContent?.trim() || 'Unknown Author';

  let allParas = [];
  let contentStarted = false;

  for (let i = 0; i < spineIds.length; i++) {
    const id = spineIds[i];
    const item = manifest[id];
    if (!item || !item.mediaType.includes('html')) continue;

    const href = opfDir + item.href;
    const chapterFile = zip.file(href) || zip.file(item.href);
    if (!chapterFile) continue;

    const html = await chapterFile.async('text');
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Layer 1: OPF epub:type on manifest item
    if (!contentStarted && item.epubType) {
      const types = item.epubType.toLowerCase().split(/\s+/);
      if (types.some(t => FRONTMATTER_TYPES.has(t))) continue;
      if (types.includes('bodymatter') || types.includes('chapter')) contentStarted = true;
    }

    // Layer 2: Filename pattern
    if (!contentStarted && FRONTMATTER_FILENAME_RE.test(item.href)) continue;

    // Layer 3: Body epub:type inside the HTML file
    if (!contentStarted) {
      const bodyType = (doc.body?.getAttribute('epub:type') || '').toLowerCase();
      if (bodyType) {
        const types = bodyType.split(/\s+/);
        if (types.some(t => FRONTMATTER_TYPES.has(t))) continue;
        if (types.includes('chapter') || types.includes('bodymatter')) contentStarted = true;
      }
    }

    // Layer 4: Content fingerprint (first 10 spine items)
    if (!contentStarted && i < 10) {
      const bodyText = (doc.body?.textContent || '').substring(0, 2000);
      if (FRONTMATTER_CONTENT_RE.test(bodyText)) continue;
    }

    const paras = extractParas(doc);
    if (paras.length === 0) continue;
    contentStarted = true;
    allParas = allParas.concat(paras);
  }

  return { title, author, paras: allParas };
}

function extractParas(doc) {
  const paras = [];
  const walker = document.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        const tag = node.tagName.toLowerCase();
        if (['nav','aside','figure'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (['h1','h2','h3','h4','h5','h6','p'].includes(tag)) return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      }
    }
  );

  let node;
  while ((node = walker.nextNode())) {
    const tag = node.tagName.toLowerCase();
    const text = node.textContent.trim();
    if (!text) continue;
    if (tag === 'p') {
      const links = node.querySelectorAll('a');
      if (links.length === 1 && links[0].textContent.trim() === text && text.length < 120) continue;
    }
    const isHeading = /^h[1-6]$/.test(tag);
    const clone = node.cloneNode(true);
    clone.querySelectorAll('nav,aside,figure').forEach(e => e.remove());
    let html = clone.innerHTML.trim();
    html = html.replace(/<b([^>]*)>/gi,'<strong>').replace(/<\/b>/gi,'</strong>');
    html = html.replace(/<i([^>]*)>/gi,'<em>').replace(/<\/i>/gi,'</em>');
    paras.push({ html, isHeading });
  }
  return paras;
}

export function buildParaEl(para) {
  const el = document.createElement('p');
  if (para.isHeading) {
    const plain = para.html.replace(/<[^>]+>/g, '').trim();
    el.className = plain.length < 40 ? 'para-chapter' : 'heading';
  }
  el.innerHTML = para.html;
  return el;
}

export function paginateParas(paras) {
  const measure = document.createElement('div');
  measure.className = 'reader-page';
  measure.style.cssText = `position:fixed;top:-9999px;left:0;width:${window.innerWidth}px;visibility:hidden;pointer-events:none;overflow:visible;height:auto;`;
  document.body.appendChild(measure);

  const pageHeight = window.innerHeight - 160;
  const pages = [];
  let currentParas = [];
  let currentHeight = 0;

  for (const para of paras) {
    const el = buildParaEl(para);
    measure.appendChild(el);
    const h = el.getBoundingClientRect().height;
    const margin = para.isHeading ? 48 : 16;

    if (currentHeight + h + margin > pageHeight && currentParas.length > 0) {
      pages.push([...currentParas]);
      currentParas = [];
      currentHeight = 0;
      measure.innerHTML = '';
    }

    currentParas.push(para);
    currentHeight += h + margin;
  }

  if (currentParas.length > 0) pages.push(currentParas);
  document.body.removeChild(measure);
  return pages;
}

export function renderPageHTML(paras) {
  return paras.map(para => buildParaEl(para).outerHTML).join('');
}
