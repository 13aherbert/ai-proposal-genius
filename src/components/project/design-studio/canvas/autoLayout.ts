// Auto-layout engine — converts legacy ContentBlock[] into a paginated CanvasDocument.
// Uses heuristic measurements (no DOM access) to flow content across US-Letter pages.

import { v4 as uuidv4 } from 'uuid';
import type { ContentBlock, DesignSettings } from '../types';
import {
  CanvasDocument,
  CanvasElement,
  CanvasPage,
  DEFAULT_BACKGROUND,
  DEFAULT_PAGE_SIZE,
} from './types';

// US-Letter @ 96 dpi
const PAGE_W = DEFAULT_PAGE_SIZE.width;   // 816
const PAGE_H = DEFAULT_PAGE_SIZE.height;  // 1056
const MARGIN_MAP: Record<DesignSettings['margins'], number> = {
  narrow: 36,
  normal: 64,
  wide: 96,
};

// Rough glyph-width estimate (in px at 16px font). Multiplied by font-size factor.
const AVG_CHAR_WIDTH = 0.52;
const LINE_HEIGHT = 1.5;
const BLOCK_GAP = 24;

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

function approxTextHeight(text: string, fontSize: number, contentW: number): number {
  const charsPerLine = Math.max(1, Math.floor(contentW / (fontSize * AVG_CHAR_WIDTH)));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return Math.ceil(lines * fontSize * LINE_HEIGHT);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

// --- Block converters -------------------------------------------------------

function addCover(c: Cursor, block: ContentBlock, settings: DesignSettings) {
  // Use the entire current page as a full-bleed cover.
  if (c.page.elements.length > 0) pageBreak(c);

  c.page.background = {
    type: 'solid',
    color: settings.primaryColor || '#3B82F6',
  };

  const title = String(block.content.title || 'Proposal');
  const subtitle = String(block.content.subtitle || '');
  const date = String(block.content.date || '');

  c.page.elements.push({
    id: uuidv4(),
    type: 'text',
    x: c.margin,
    y: PAGE_H * 0.4,
    width: c.contentW,
    height: 80,
    rotation: 0,
    zIndex: pushZ(c.page),
    text: {
      html: `<p>${title}</p>`,
      fontFamily: settings.headerFont || 'Inter',
      fontSize: 48,
      fontWeight: 800,
      color: '#ffffff',
      align: 'center',
      lineHeight: 1.2,
      letterSpacing: 0,
    },
  });

  if (subtitle) {
    c.page.elements.push({
      id: uuidv4(),
      type: 'text',
      x: c.margin,
      y: PAGE_H * 0.4 + 90,
      width: c.contentW,
      height: 40,
      rotation: 0,
      zIndex: pushZ(c.page),
      text: {
        html: `<p>${subtitle}</p>`,
        fontFamily: settings.bodyFont || 'Inter',
        fontSize: 22,
        fontWeight: 400,
        color: '#ffffff',
        align: 'center',
        lineHeight: 1.4,
        letterSpacing: 0,
      },
    });
  }

  if (date) {
    c.page.elements.push({
      id: uuidv4(),
      type: 'text',
      x: c.margin,
      y: PAGE_H - c.margin - 30,
      width: c.contentW,
      height: 24,
      rotation: 0,
      zIndex: pushZ(c.page),
      text: {
        html: `<p>${date}</p>`,
        fontFamily: settings.bodyFont || 'Inter',
        fontSize: 14,
        fontWeight: 400,
        color: '#ffffff',
        align: 'center',
        lineHeight: 1.4,
        letterSpacing: 0,
      },
    });
  }

  pageBreak(c);
}

function addHeading(c: Cursor, block: ContentBlock, settings: DesignSettings) {
  const lvl = Number(block.content.level) || 2;
  const sizes: Record<number, number> = { 1: 32, 2: 24, 3: 20, 4: 16 };
  const fontSize = sizes[lvl] || 22;
  const text = String(block.content.text || '');
  const h = Math.max(fontSize * LINE_HEIGHT, approxTextHeight(text, fontSize, c.contentW));

  ensureRoom(c, h + BLOCK_GAP);
  c.page.elements.push({
    id: uuidv4(),
    type: 'text',
    x: c.margin,
    y: c.y,
    width: c.contentW,
    height: h,
    rotation: 0,
    zIndex: pushZ(c.page),
    text: {
      html: `<p>${text}</p>`,
      fontFamily: settings.headerFont || 'Inter',
      fontSize,
      fontWeight: 700,
      color: settings.primaryColor || '#1a1a1a',
      align: 'left',
      lineHeight: 1.3,
      letterSpacing: 0,
    },
  });
  c.y += h + BLOCK_GAP;
}

function addText(c: Cursor, block: ContentBlock, settings: DesignSettings) {
  const html = String(block.content.text || '');
  const plain = stripHtml(html);
  const fontSize = 14;

  // Split text into chunks that fit remaining page space.
  // Approach: estimate total height, then split by characters proportionally
  // so each chunk fits the remaining vertical space on its page.
  let remaining = plain;
  let remainingHtml = html;

  while (remaining.length > 0) {
    const available = c.margin + c.contentH - c.y;
    if (available < fontSize * LINE_HEIGHT * 2) {
      pageBreak(c);
      continue;
    }

    const charsPerLine = Math.max(1, Math.floor(c.contentW / (fontSize * AVG_CHAR_WIDTH)));
    const linesAvail = Math.floor(available / (fontSize * LINE_HEIGHT));
    const charsThatFit = charsPerLine * linesAvail;

    if (remaining.length <= charsThatFit) {
      // All remaining fits.
      const h = approxTextHeight(remaining, fontSize, c.contentW);
      c.page.elements.push({
        id: uuidv4(),
        type: 'text',
        x: c.margin,
        y: c.y,
        width: c.contentW,
        height: h,
        rotation: 0,
        zIndex: pushZ(c.page),
        text: {
          html: remainingHtml,
          fontFamily: settings.bodyFont || 'Inter',
          fontSize,
          fontWeight: 400,
          color: '#1a1a1a',
          align: 'left',
          lineHeight: LINE_HEIGHT,
          letterSpacing: 0,
        },
      });
      c.y += h + BLOCK_GAP;
      remaining = '';
      remainingHtml = '';
    } else {
      // Find a good break point near charsThatFit (prefer space).
      let cut = charsThatFit;
      const space = remaining.lastIndexOf(' ', cut);
      if (space > cut * 0.6) cut = space;
      const chunk = remaining.slice(0, cut);
      const h = approxTextHeight(chunk, fontSize, c.contentW);

      c.page.elements.push({
        id: uuidv4(),
        type: 'text',
        x: c.margin,
        y: c.y,
        width: c.contentW,
        height: h,
        rotation: 0,
        zIndex: pushZ(c.page),
        text: {
          html: `<p>${chunk}</p>`,
          fontFamily: settings.bodyFont || 'Inter',
          fontSize,
          fontWeight: 400,
          color: '#1a1a1a',
          align: 'left',
          lineHeight: LINE_HEIGHT,
          letterSpacing: 0,
        },
      });
      remaining = remaining.slice(cut).trimStart();
      remainingHtml = `<p>${remaining}</p>`;
      pageBreak(c);
    }
  }
}

function addImage(c: Cursor, block: ContentBlock) {
  const url = String(block.content.url || '');
  if (!url) return;
  const w = Math.min(c.contentW, 480);
  const h = Math.round(w * 0.6);
  ensureRoom(c, h + BLOCK_GAP);
  c.page.elements.push({
    id: uuidv4(),
    type: 'image',
    x: c.margin + (c.contentW - w) / 2,
    y: c.y,
    width: w,
    height: h,
    rotation: 0,
    zIndex: pushZ(c.page),
    image: {
      url,
      objectFit: 'cover',
      opacity: 1,
      borderRadius: 8,
      shadow: 'soft',
      filter: 'none',
    },
  });
  c.y += h + BLOCK_GAP;
}

function addQuote(c: Cursor, block: ContentBlock, settings: DesignSettings) {
  const text = stripHtml(String(block.content.text || ''));
  const fontSize = 18;
  const h = Math.max(60, approxTextHeight(text, fontSize, c.contentW - 24));
  ensureRoom(c, h + BLOCK_GAP);

  // Accent bar
  c.page.elements.push({
    id: uuidv4(),
    type: 'shape',
    x: c.margin,
    y: c.y,
    width: 4,
    height: h,
    rotation: 0,
    zIndex: pushZ(c.page),
    shape: {
      kind: 'rect',
      fill: settings.primaryColor || '#3B82F6',
      stroke: 'transparent',
      strokeWidth: 0,
      borderRadius: 2,
      shadow: 'none',
      opacity: 1,
    },
  });

  c.page.elements.push({
    id: uuidv4(),
    type: 'text',
    x: c.margin + 16,
    y: c.y,
    width: c.contentW - 16,
    height: h,
    rotation: 0,
    zIndex: pushZ(c.page),
    text: {
      html: `<p>${text}</p>`,
      fontFamily: settings.bodyFont || 'Inter',
      fontSize,
      fontWeight: 400,
      italic: true,
      color: '#374151',
      align: 'left',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
  });
  c.y += h + BLOCK_GAP;
}

function addDivider(c: Cursor, block: ContentBlock) {
  const isPageBreak = (block.content.isPageBreak as boolean) ?? true;
  if (isPageBreak) {
    pageBreak(c);
    return;
  }
  ensureRoom(c, 24);
  c.page.elements.push({
    id: uuidv4(),
    type: 'shape',
    x: c.margin,
    y: c.y + 8,
    width: c.contentW,
    height: 1,
    rotation: 0,
    zIndex: pushZ(c.page),
    shape: {
      kind: 'rect',
      fill: '#e5e7eb',
      stroke: 'transparent',
      strokeWidth: 0,
      borderRadius: 0,
      shadow: 'none',
      opacity: 1,
    },
  });
  c.y += 32;
}

function addCallout(c: Cursor, block: ContentBlock, settings: DesignSettings) {
  const text = stripHtml(String(block.content.text || ''));
  const fontSize = 14;
  const innerW = c.contentW - 32;
  const textH = approxTextHeight(text, fontSize, innerW);
  const h = textH + 32;
  ensureRoom(c, h + BLOCK_GAP);

  c.page.elements.push({
    id: uuidv4(),
    type: 'shape',
    x: c.margin,
    y: c.y,
    width: c.contentW,
    height: h,
    rotation: 0,
    zIndex: pushZ(c.page),
    shape: {
      kind: 'rect',
      fill: '#dbeafe',
      stroke: settings.primaryColor || '#3b82f6',
      strokeWidth: 1,
      borderRadius: 8,
      shadow: 'none',
      opacity: 1,
    },
  });

  c.page.elements.push({
    id: uuidv4(),
    type: 'text',
    x: c.margin + 16,
    y: c.y + 16,
    width: innerW,
    height: textH,
    rotation: 0,
    zIndex: pushZ(c.page),
    text: {
      html: `<p>${text}</p>`,
      fontFamily: settings.bodyFont || 'Inter',
      fontSize,
      fontWeight: 400,
      color: '#1e40af',
      align: 'left',
      lineHeight: LINE_HEIGHT,
      letterSpacing: 0,
    },
  });
  c.y += h + BLOCK_GAP;
}

// --- Public API -------------------------------------------------------------

/**
 * Convert legacy block-based content into a paginated CanvasDocument.
 * The conversion is heuristic — users can adjust positions on the canvas afterwards.
 */
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
        // Skip — auto-generated TOCs don't translate to free-form well.
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
      // 'table' is intentionally skipped — tables remain in v1 flow.
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
