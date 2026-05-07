// Auto-layout engine — converts legacy ContentBlock[] into a paginated CanvasDocument.
// Phase 1 rewrite: uses real DOM measurement, preserves HTML, paginates at block
// boundaries (never mid-sentence), and renders TOC + tables instead of dropping them.

import { v4 as uuidv4 } from 'uuid';
import type { ContentBlock, DesignSettings } from '../types';
import {
  CanvasDocument,
  CanvasPage,
  DEFAULT_BACKGROUND,
  DEFAULT_PAGE_SIZE,
} from './types';
import { measureHtmlHeight, splitHtmlIntoBlocks } from './measureText';

// US-Letter @ 96 dpi
const PAGE_W = DEFAULT_PAGE_SIZE.width;   // 816
const PAGE_H = DEFAULT_PAGE_SIZE.height;  // 1056
const MARGIN_MAP: Record<DesignSettings['margins'], number> = {
  narrow: 36,
  normal: 64,
  wide: 96,
};
const BLOCK_GAP = 16;
const BODY_LINE_HEIGHT = 1.55;

interface Cursor {
  pages: CanvasPage[];
  page: CanvasPage;
  y: number;
  margin: number;
  contentW: number;
  contentH: number;
}

function newPage(background = { ...DEFAULT_BACKGROUND }): CanvasPage {
  return { id: uuidv4(), background, elements: [] };
}

function newCursor(settings: DesignSettings): Cursor {
  const margin = MARGIN_MAP[settings.margins] ?? MARGIN_MAP.normal;
  const page = newPage();
  return {
    pages: [page],
    page,
    y: margin,
    margin,
    contentW: PAGE_W - margin * 2,
    contentH: PAGE_H - margin * 2,
  };
}

function pageBreak(c: Cursor, background = { ...DEFAULT_BACKGROUND }) {
  const p = newPage(background);
  c.pages.push(p);
  c.page = p;
  c.y = c.margin;
}

function ensureRoom(c: Cursor, h: number) {
  if (c.y + h > c.margin + c.contentH) pageBreak(c);
}

function pushZ(page: CanvasPage): number {
  return page.elements.length + 1;
}

function stripHtml(html: string): string {
  if (typeof document !== 'undefined') {
    const d = document.createElement('div');
    d.innerHTML = html;
    return (d.textContent ?? '').trim();
  }
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

// --- Block converters -------------------------------------------------------

function addCover(c: Cursor, block: ContentBlock, settings: DesignSettings) {
  if (c.page.elements.length > 0) pageBreak(c);

  c.page.background = {
    type: 'solid',
    color: settings.primaryColor || '#3B82F6',
  };

  const title = String(block.content.title || 'Proposal');
  const subtitle = String(block.content.subtitle || '');
  const date = String(block.content.date || '');

  const titleFont = settings.headerFont || 'Inter';
  const bodyFont = settings.bodyFont || 'Inter';
  const titleSize = 48;
  const subSize = 22;
  const dateSize = 14;
  const titleW = Math.round(c.contentW * 0.85);
  const titleX = c.margin + Math.round((c.contentW - titleW) / 2);

  const titleH = measureHtmlHeight({
    html: `<p>${title}</p>`, width: titleW,
    fontFamily: titleFont, fontSize: titleSize, fontWeight: 800, lineHeight: 1.15,
  });
  const subH = subtitle
    ? measureHtmlHeight({
        html: `<p>${subtitle}</p>`, width: titleW,
        fontFamily: bodyFont, fontSize: subSize, fontWeight: 400, lineHeight: 1.4,
      })
    : 0;

  const stackH = titleH + (subtitle ? 24 + subH : 0);
  const startY = Math.round((PAGE_H - stackH) / 2);

  c.page.elements.push({
    id: uuidv4(), type: 'text', x: titleX, y: startY,
    width: titleW, height: titleH,
    rotation: 0, zIndex: pushZ(c.page),
    text: {
      html: `<p>${title}</p>`, fontFamily: titleFont, fontSize: titleSize,
      fontWeight: 800, color: '#ffffff', align: 'center', lineHeight: 1.15, letterSpacing: 0,
    },
  });

  if (subtitle) {
    c.page.elements.push({
      id: uuidv4(), type: 'text', x: titleX, y: startY + titleH + 24,
      width: titleW, height: subH,
      rotation: 0, zIndex: pushZ(c.page),
      text: {
        html: `<p>${subtitle}</p>`, fontFamily: bodyFont, fontSize: subSize,
        fontWeight: 400, color: '#ffffff', align: 'center', lineHeight: 1.4, letterSpacing: 0,
      },
    });
  }

  if (date) {
    const dateH = measureHtmlHeight({
      html: `<p>${date}</p>`, width: c.contentW,
      fontFamily: bodyFont, fontSize: dateSize, fontWeight: 400, lineHeight: 1.4,
    });
    c.page.elements.push({
      id: uuidv4(), type: 'text', x: c.margin, y: PAGE_H - c.margin - dateH,
      width: c.contentW, height: dateH,
      rotation: 0, zIndex: pushZ(c.page),
      text: {
        html: `<p>${date}</p>`, fontFamily: bodyFont, fontSize: dateSize,
        fontWeight: 400, color: '#ffffff', align: 'center', lineHeight: 1.4, letterSpacing: 0,
      },
    });
  }

  pageBreak(c);
}

function addToc(c: Cursor, blocks: ContentBlock[], settings: DesignSettings) {
  if (c.page.elements.length > 0) pageBreak(c);

  // Title
  const title = 'Table of Contents';
  const titleSize = 28;
  const titleH = measureHtmlHeight({
    html: `<p>${title}</p>`, width: c.contentW,
    fontFamily: settings.headerFont || 'Inter', fontSize: titleSize, fontWeight: 700, lineHeight: 1.3,
  });
  c.page.elements.push({
    id: uuidv4(), type: 'text', x: c.margin, y: c.y,
    width: c.contentW, height: titleH,
    rotation: 0, zIndex: pushZ(c.page),
    text: {
      html: `<p>${title}</p>`, fontFamily: settings.headerFont || 'Inter',
      fontSize: titleSize, fontWeight: 700,
      color: settings.primaryColor || '#1a1a1a',
      align: 'left', lineHeight: 1.3, letterSpacing: 0,
    },
  });
  c.y += titleH + BLOCK_GAP * 2;

  // List entries: pull every heading
  const headings = blocks.filter(b => b.type === 'heading');
  const fontSize = 16;
  const rowH = Math.ceil(fontSize * 1.6);
  for (const h of headings) {
    const text = String(h.content.text || '');
    const lvl = Number(h.content.level) || 2;
    const indent = (lvl - 1) * 20;
    ensureRoom(c, rowH + 4);
    c.page.elements.push({
      id: uuidv4(), type: 'text', x: c.margin + indent, y: c.y,
      width: c.contentW - indent, height: rowH,
      rotation: 0, zIndex: pushZ(c.page),
      text: {
        html: `<p>${text}</p>`, fontFamily: settings.bodyFont || 'Inter',
        fontSize, fontWeight: lvl <= 2 ? 600 : 400,
        color: '#1a1a1a', align: 'left', lineHeight: 1.5, letterSpacing: 0,
      },
    });
    c.y += rowH + 4;
  }
  c.y += BLOCK_GAP;
}

function addHeading(c: Cursor, block: ContentBlock, settings: DesignSettings) {
  const lvl = Number(block.content.level) || 2;
  const sizes: Record<number, number> = { 1: 32, 2: 24, 3: 20, 4: 16 };
  const fontSize = sizes[lvl] || 22;
  const text = String(block.content.text || '');
  const html = `<p>${text}</p>`;
  const h = measureHtmlHeight({
    html, width: c.contentW,
    fontFamily: settings.headerFont || 'Inter',
    fontSize, fontWeight: 700, lineHeight: 1.3,
  });

  ensureRoom(c, h + BLOCK_GAP);
  c.page.elements.push({
    id: uuidv4(), type: 'text', x: c.margin, y: c.y,
    width: c.contentW, height: h,
    rotation: 0, zIndex: pushZ(c.page),
    text: {
      html, fontFamily: settings.headerFont || 'Inter',
      fontSize, fontWeight: 700,
      color: settings.primaryColor || '#1a1a1a',
      align: 'left', lineHeight: 1.3, letterSpacing: 0,
    },
  });
  c.y += h + BLOCK_GAP;
}

function addText(c: Cursor, block: ContentBlock, settings: DesignSettings) {
  const html = String(block.content.text || '');
  if (!html.trim()) return;
  const fontSize = 14;
  const fontFamily = settings.bodyFont || 'Inter';

  // Split into top-level blocks (paragraphs, lists, headings, etc.) and
  // greedily pack them onto pages — never breaking a block in the middle.
  const fragments = splitHtmlIntoBlocks(html);
  let buffer: string[] = [];
  let bufferHeight = 0;

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    const fragHtml = buffer.join('');
    c.page.elements.push({
      id: uuidv4(), type: 'text', x: c.margin, y: c.y,
      width: c.contentW, height: bufferHeight,
      rotation: 0, zIndex: pushZ(c.page),
      text: {
        html: fragHtml, fontFamily, fontSize, fontWeight: 400,
        color: '#1a1a1a', align: 'left', lineHeight: BODY_LINE_HEIGHT, letterSpacing: 0,
      },
    });
    c.y += bufferHeight + BLOCK_GAP;
    buffer = [];
    bufferHeight = 0;
  };

  for (const frag of fragments) {
    const fragH = measureHtmlHeight({
      html: frag, width: c.contentW,
      fontFamily, fontSize, fontWeight: 400, lineHeight: BODY_LINE_HEIGHT,
    });
    const available = c.margin + c.contentH - c.y - bufferHeight;

    if (fragH > available) {
      // Doesn't fit on the current page — flush what we have, then break.
      flushBuffer();
      // If the single fragment is taller than a full page, render it anyway
      // (it will overflow visually, but content is preserved). Otherwise break.
      if (fragH <= c.contentH) {
        pageBreak(c);
      }
    }

    buffer.push(frag);
    bufferHeight += fragH;
  }
  flushBuffer();
}

function addImage(c: Cursor, block: ContentBlock) {
  const url = String(block.content.url || '');
  if (!url) return;
  const w = Math.min(c.contentW, 480);
  const h = Math.round(w * 0.6);
  ensureRoom(c, h + BLOCK_GAP);
  c.page.elements.push({
    id: uuidv4(), type: 'image',
    x: c.margin + (c.contentW - w) / 2, y: c.y,
    width: w, height: h,
    rotation: 0, zIndex: pushZ(c.page),
    image: { url, objectFit: 'cover', opacity: 1, borderRadius: 8, shadow: 'soft', filter: 'none' },
  });
  c.y += h + BLOCK_GAP;
}

function addQuote(c: Cursor, block: ContentBlock, settings: DesignSettings) {
  const text = stripHtml(String(block.content.text || ''));
  if (!text) return;
  const fontSize = 18;
  const innerW = c.contentW - 24;
  const h = Math.max(60, measureHtmlHeight({
    html: `<p>${text}</p>`, width: innerW,
    fontFamily: settings.bodyFont || 'Inter',
    fontSize, fontWeight: 400, italic: true, lineHeight: 1.5,
  }));
  ensureRoom(c, h + BLOCK_GAP);

  c.page.elements.push({
    id: uuidv4(), type: 'shape',
    x: c.margin, y: c.y, width: 4, height: h,
    rotation: 0, zIndex: pushZ(c.page),
    shape: {
      kind: 'rect', fill: settings.primaryColor || '#3B82F6', stroke: 'transparent',
      strokeWidth: 0, borderRadius: 2, shadow: 'none', opacity: 1,
    },
  });
  c.page.elements.push({
    id: uuidv4(), type: 'text',
    x: c.margin + 16, y: c.y, width: innerW, height: h,
    rotation: 0, zIndex: pushZ(c.page),
    text: {
      html: `<p>${text}</p>`, fontFamily: settings.bodyFont || 'Inter',
      fontSize, fontWeight: 400, italic: true, color: '#374151',
      align: 'left', lineHeight: 1.5, letterSpacing: 0,
    },
  });
  c.y += h + BLOCK_GAP;
}

function addDivider(c: Cursor, block: ContentBlock) {
  const isPageBreak = (block.content.isPageBreak as boolean) ?? true;
  if (isPageBreak) { pageBreak(c); return; }
  ensureRoom(c, 24);
  c.page.elements.push({
    id: uuidv4(), type: 'shape',
    x: c.margin, y: c.y + 8, width: c.contentW, height: 1,
    rotation: 0, zIndex: pushZ(c.page),
    shape: {
      kind: 'rect', fill: '#e5e7eb', stroke: 'transparent',
      strokeWidth: 0, borderRadius: 0, shadow: 'none', opacity: 1,
    },
  });
  c.y += 32;
}

function addCallout(c: Cursor, block: ContentBlock, settings: DesignSettings) {
  const text = stripHtml(String(block.content.text || ''));
  if (!text) return;
  const fontSize = 14;
  const innerW = c.contentW - 32;
  const textH = measureHtmlHeight({
    html: `<p>${text}</p>`, width: innerW,
    fontFamily: settings.bodyFont || 'Inter',
    fontSize, fontWeight: 400, lineHeight: BODY_LINE_HEIGHT,
  });
  const h = textH + 32;
  ensureRoom(c, h + BLOCK_GAP);

  c.page.elements.push({
    id: uuidv4(), type: 'shape',
    x: c.margin, y: c.y, width: c.contentW, height: h,
    rotation: 0, zIndex: pushZ(c.page),
    shape: {
      kind: 'rect', fill: '#dbeafe',
      stroke: settings.primaryColor || '#3b82f6',
      strokeWidth: 1, borderRadius: 8, shadow: 'none', opacity: 1,
    },
  });
  c.page.elements.push({
    id: uuidv4(), type: 'text',
    x: c.margin + 16, y: c.y + 16, width: innerW, height: textH,
    rotation: 0, zIndex: pushZ(c.page),
    text: {
      html: `<p>${text}</p>`, fontFamily: settings.bodyFont || 'Inter',
      fontSize, fontWeight: 400, color: '#1e40af',
      align: 'left', lineHeight: BODY_LINE_HEIGHT, letterSpacing: 0,
    },
  });
  c.y += h + BLOCK_GAP;
}

function addTable(c: Cursor, block: ContentBlock, settings: DesignSettings) {
  const headers = (block.content as { headers?: string[] }).headers ?? [];
  const rows = (block.content as { rows?: string[][] }).rows ?? [];
  if (headers.length === 0 && rows.length === 0) return;

  const cols = Math.max(1, headers.length || (rows[0]?.length ?? 1));
  const colW = Math.floor(c.contentW / cols);
  const fontSize = 12;
  const fontFamily = settings.bodyFont || 'Inter';
  const cellPad = 8;
  const headerColor = settings.primaryColor || '#3B82F6';

  const measureRowH = (cells: string[], weight: number) => {
    let max = 0;
    for (const cell of cells) {
      const html = `<p>${stripHtml(cell || '')}</p>`;
      const h = measureHtmlHeight({
        html, width: colW - cellPad * 2,
        fontFamily, fontSize, fontWeight: weight, lineHeight: 1.4,
      });
      if (h > max) max = h;
    }
    return Math.max(fontSize * 1.6, max) + cellPad * 2;
  };

  const renderRow = (cells: string[], rowH: number, opts: { header?: boolean }) => {
    if (opts.header) {
      c.page.elements.push({
        id: uuidv4(), type: 'shape',
        x: c.margin, y: c.y, width: colW * cols, height: rowH,
        rotation: 0, zIndex: pushZ(c.page),
        shape: { kind: 'rect', fill: headerColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0, shadow: 'none', opacity: 1 },
      });
    } else {
      // Subtle row separator
      c.page.elements.push({
        id: uuidv4(), type: 'shape',
        x: c.margin, y: c.y + rowH - 1, width: colW * cols, height: 1,
        rotation: 0, zIndex: pushZ(c.page),
        shape: { kind: 'rect', fill: '#e5e7eb', stroke: 'transparent', strokeWidth: 0, borderRadius: 0, shadow: 'none', opacity: 1 },
      });
    }
    cells.forEach((cell, i) => {
      c.page.elements.push({
        id: uuidv4(), type: 'text',
        x: c.margin + i * colW + cellPad, y: c.y + cellPad,
        width: colW - cellPad * 2, height: rowH - cellPad * 2,
        rotation: 0, zIndex: pushZ(c.page),
        text: {
          html: `<p>${stripHtml(cell || '')}</p>`,
          fontFamily, fontSize, fontWeight: opts.header ? 600 : 400,
          color: opts.header ? '#ffffff' : '#1a1a1a',
          align: 'left', lineHeight: 1.4, letterSpacing: 0,
        },
      });
    });
    c.y += rowH;
  };

  if (headers.length > 0) {
    const hH = measureRowH(headers, 600);
    ensureRoom(c, hH + 24);
    renderRow(headers, hH, { header: true });
  }
  for (const row of rows) {
    const rH = measureRowH(row, 400);
    if (c.y + rH > c.margin + c.contentH) {
      pageBreak(c);
      // re-render header on new page
      if (headers.length > 0) {
        const hH = measureRowH(headers, 600);
        renderRow(headers, hH, { header: true });
      }
    }
    renderRow(row, rH, {});
  }
  c.y += BLOCK_GAP;
}

// --- Public API -------------------------------------------------------------

export function blocksToCanvasDocument(
  blocks: ContentBlock[],
  settings: DesignSettings
): CanvasDocument {
  const c = newCursor(settings);

  for (const block of blocks) {
    switch (block.type) {
      case 'cover':
        addCover(c, block, settings);
        break;
      case 'toc':
        addToc(c, blocks, settings);
        break;
      case 'heading':
        addHeading(c, block, settings);
        break;
      case 'text':
        addText(c, block, settings);
        break;
      case 'image':
        addImage(c, block);
        break;
      case 'quote':
        addQuote(c, block, settings);
        break;
      case 'divider':
        addDivider(c, block);
        break;
      case 'callout':
        addCallout(c, block, settings);
        break;
      case 'table':
        addTable(c, block, settings);
        break;
    }
  }

  // Strip trailing empty page if the last operation was a page break.
  while (c.pages.length > 1 && c.pages[c.pages.length - 1].elements.length === 0) {
    c.pages.pop();
  }

  return {
    pages: c.pages,
    pageSize: { width: PAGE_W, height: PAGE_H },
  };
}
