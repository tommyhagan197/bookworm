import { extractEpub, paginateParas, renderPageHTML } from './extractor.js';
import { dbPut, dbGet, dbGetAll, dbGetAllKeys, STORE_BOOKS, STORE_PAGES } from '../db/index.js';

export async function processEpubBuffer(source, filename, opts = {}, callbacks = {}) {
  const { onProgress } = callbacks;
  const silent = !!opts.silent;
  const gutenbergId = (typeof opts.gutenbergId === 'number') ? opts.gutenbergId : null;
  const seId = (typeof opts.seId === 'string' && opts.seId) ? opts.seId : null;

  const progress = (msg, pct) => { if (onProgress) onProgress(msg, pct); };

  if (!silent) progress('Reading EPUB…', 5);

  const { title: epubTitle, author: epubAuthor, paras } = await extractEpub(source, filename);

  const title = opts.metaTitle || epubTitle;
  const author = opts.metaAuthor || epubAuthor;

  if (!silent) progress('Measuring pages…', 50);
  await new Promise(r => setTimeout(r, 80));

  const pages = paginateParas(paras);
  if (pages.length === 0) throw new Error('No readable content');

  if (!silent) progress('Saving to library…', 70);

  const bookId = 'book_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const colorIndex = Math.floor(Math.random() * 6);

  const record = {
    id: bookId,
    title,
    author,
    totalPages: pages.length,
    currentPage: 0,
    addedAt: Date.now(),
    colorIndex
  };
  if (gutenbergId !== null) record.gutenbergId = gutenbergId;
  if (seId !== null) record.seId = seId;
  if (opts.coverUrl) record.coverUrl = opts.coverUrl;

  await dbPut(STORE_BOOKS, record);

  for (let i = 0; i < pages.length; i++) {
    if (i % 30 === 0) {
      if (!silent) progress(`Saving pages… ${i}/${pages.length}`, 70 + Math.floor((i / pages.length) * 25));
      await new Promise(r => setTimeout(r, 0));
    }
    await dbPut(STORE_PAGES, { key: `${bookId}:${i}`, html: renderPageHTML(pages[i]) });
  }

  if (!silent) progress('Done!', 100);

  return { bookId, title, author, totalPages: pages.length };
}

export { dbGet, dbGetAll, dbGetAllKeys, STORE_BOOKS, STORE_PAGES };
