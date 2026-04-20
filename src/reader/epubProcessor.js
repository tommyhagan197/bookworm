// src/reader/epubProcessor.js
// Full EPUB extraction + pagination + IndexedDB write.
// This is the protected core ported from BookWorm.html — behavior unchanged.

import JSZip from "jszip";
import { openDB, dbPut } from "../db/idb";

const SCREEN_HEIGHT = window.innerHeight;
const WORDS_PER_PAGE = Math.round(SCREEN_HEIGHT / 22 * 12);

// ── Four-layer front matter detection ────────────────────────────────────────

function isFrontMatterByOpfType(item) {
  const t = (item?.properties || "").toLowerCase();
  return ["cover","title-page","copyright-page","dedication","epigraph","foreword","preface","introduction","halftitlepage"].some(x => t.includes(x));
}

function isFrontMatterByFilename(filename, idx, total) {
  if (idx >= Math.min(8, total * 0.2)) return false;
  const f = filename.toLowerCase().replace(/.*\//, "");
  return /^(cover|title|copyright|colophon|dedication|preface|foreword|intro|front|halftitle|rights|legal|toc|contents|nav)/.test(f);
}

function isFrontMatterByBodyType(doc) {
  const body = doc.querySelector("body");
  const t = (body?.getAttribute("epub:type") || body?.getAttribute("data-type") || "").toLowerCase();
  return ["cover","title-page","copyright-page","dedication","foreword","preface","introduction"].some(x => t.includes(x));
}

function isFrontMatterByContent(text) {
  const t = text.slice(0, 1200).toLowerCase();
  const signals = ["all rights reserved","copyright ©","copyright (c)","published by","printed in","isbn","first published","first edition","no part of this","unauthorized reproduction","library of congress"];
  return signals.filter(s => t.includes(s)).length >= 2;
}

// ── TreeWalker paragraph extractor ───────────────────────────────────────────

function extractParas(doc) {
  const paras = [];
  const walker = document.createTreeWalker(
    doc.body || doc.documentElement,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        const tag = node.tagName.toLowerCase();
        if (["h1","h2","h3","h4","h5","h6","p"].includes(tag)) return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      }
    }
  );
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent.trim();
    if (!text || text.length < 2) continue;
    // Filter TOC links — a paragraph whose only child is an <a> is navigation noise
    const children = Array.from(node.children);
    if (children.length === 1 && children[0].tagName.toLowerCase() === "a" && text === children[0].textContent.trim()) continue;
    const tag = node.tagName.toLowerCase();
    const isHeading = ["h1","h2","h3","h4","h5","h6"].includes(tag);
    paras.push({ html: node.innerHTML.trim(), isHeading, text });
  }
  return paras;
}

// ── Paginator ─────────────────────────────────────────────────────────────────

function paginateParas(paras) {
  const pages = [];
  let current = [];
  let wordCount = 0;

  for (const para of paras) {
    const words = para.text.split(/\s+/).length;
    if (wordCount + words > WORDS_PER_PAGE && current.length > 0) {
      pages.push([...current]);
      current = [];
      wordCount = 0;
    }
    current.push({ html: para.html, isHeading: para.isHeading });
    wordCount += words;
  }
  if (current.length) pages.push(current);
  return pages;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function processEpubBuffer(buffer, filename, opts = {}) {
  const zip = await JSZip.loadAsync(buffer);

  // Parse container.xml → find OPF path
  const containerXml = await zip.file("META-INF/container.xml").async("text");
  const containerDoc = new DOMParser().parseFromString(containerXml, "application/xml");
  const opfPath = containerDoc.querySelector("rootfile")?.getAttribute("full-path");
  if (!opfPath) throw new Error("No OPF path found");

  const opfDir = opfPath.includes("/") ? opfPath.substring(0, opfPath.lastIndexOf("/") + 1) : "";
  const opfXml = await zip.file(opfPath).async("text");
  const opfDoc = new DOMParser().parseFromString(opfXml, "application/xml");

  // Build item map
  const items = {};
  opfDoc.querySelectorAll("manifest item").forEach(item => {
    items[item.getAttribute("id")] = {
      href: item.getAttribute("href"),
      mediaType: item.getAttribute("media-type"),
      properties: item.getAttribute("properties") || ""
    };
  });

  // Build spine order
  const spineIds = Array.from(opfDoc.querySelectorAll("spine itemref")).map(r => r.getAttribute("idref"));
  const spineItems = spineIds.map(id => ({ id, ...items[id] })).filter(i => i.href);

  // Extract metadata
  const metaTitle = opts.metaTitle || opfDoc.querySelector("metadata title, dc\\:title, title")?.textContent?.trim() || filename.replace(".epub","");
  const metaAuthor = opts.metaAuthor || opfDoc.querySelector("metadata creator, dc\\:creator, creator")?.textContent?.trim() || "Unknown";

  // Process spine: skip front matter, collect all paragraphs
  const allParas = [];
  let contentStarted = false;

  for (let idx = 0; idx < spineItems.length; idx++) {
    const item = spineItems[idx];
    if (!item.mediaType?.includes("html") && !item.mediaType?.includes("xhtml")) continue;

    const chapterPath = opfDir + item.href.split("#")[0];
    const chapterFile = zip.file(chapterPath) || zip.file(item.href.split("#")[0]);
    if (!chapterFile) continue;

    const html = await chapterFile.async("text");
    const doc = new DOMParser().parseFromString(html, "text/html");
    const bodyText = doc.body?.textContent || "";

    // Four-layer front matter check (only before content has started)
    if (!contentStarted) {
      if (isFrontMatterByOpfType(item)) continue;
      if (isFrontMatterByFilename(item.href, idx, spineItems.length)) continue;
      if (isFrontMatterByBodyType(doc)) continue;
      if (isFrontMatterByContent(bodyText)) continue;
    }

    const paras = extractParas(doc);
    if (paras.length === 0) continue;

    contentStarted = true;
    allParas.push(...paras);
  }

  if (allParas.length === 0) throw new Error("No readable content found in EPUB");

  // Paginate
  const pages = paginateParas(allParas);
  const bookId = `book_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

  // Write book record
  const db = await openDB();
  const bookRecord = {
    id: bookId,
    title: metaTitle,
    author: metaAuthor,
    totalPages: pages.length,
    progress: 0,
    currentPage: 0,
    addedAt: Date.now(),
    ...(opts.gutenbergId ? { gutenbergId: opts.gutenbergId } : {})
  };

  await dbPut("books", bookRecord);

  // Write pages in batches
  const tx = db.transaction("pages", "readwrite");
  const store = tx.objectStore("pages");
  for (let i = 0; i < pages.length; i++) {
    store.put({ key: `${bookId}:${i}`, content: pages[i] });
  }
  await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });

  return bookRecord;
}
