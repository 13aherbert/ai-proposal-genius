// Measures rendered HTML text height using a detached DOM node.
// Far more accurate than the previous character-based heuristic.

interface MeasureOptions {
  html: string;
  width: number;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number | string;
  lineHeight?: number;
  letterSpacing?: number;
  italic?: boolean;
}

let measureNode: HTMLDivElement | null = null;

function getMeasureNode(): HTMLDivElement {
  if (measureNode && document.body.contains(measureNode)) return measureNode;
  const node = document.createElement('div');
  node.setAttribute('aria-hidden', 'true');
  node.style.cssText = [
    'position:absolute',
    'visibility:hidden',
    'pointer-events:none',
    'top:-99999px',
    'left:-99999px',
    'box-sizing:border-box',
    'word-break:break-word',
    'white-space:normal',
    'padding:0',
    'margin:0',
  ].join(';');
  // Ensure paragraph spacing matches TipTap defaults closely enough.
  document.body.appendChild(node);
  measureNode = node;
  return node;
}

export function measureHtmlHeight(opts: MeasureOptions): number {
  // SSR / non-browser fallback — rough estimate.
  if (typeof document === 'undefined') {
    const charsPerLine = Math.max(1, Math.floor(opts.width / (opts.fontSize * 0.52)));
    const plain = opts.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const lines = Math.max(1, Math.ceil(plain.length / charsPerLine));
    return Math.ceil(lines * opts.fontSize * (opts.lineHeight ?? 1.5));
  }
  const node = getMeasureNode();
  node.style.width = `${opts.width}px`;
  node.style.fontFamily = opts.fontFamily;
  node.style.fontSize = `${opts.fontSize}px`;
  node.style.fontWeight = String(opts.fontWeight ?? 400);
  node.style.lineHeight = String(opts.lineHeight ?? 1.5);
  node.style.letterSpacing = `${opts.letterSpacing ?? 0}px`;
  node.style.fontStyle = opts.italic ? 'italic' : 'normal';
  node.innerHTML = opts.html;
  // Add small buffer for sub-pixel rounding so boxes never under-fit.
  return Math.ceil(node.getBoundingClientRect().height) + 2;
}

/**
 * Split HTML into top-level "block" fragments (paragraphs, headings, list items, lists, etc.)
 * so we can paginate at safe boundaries and keep markup intact.
 */
export function splitHtmlIntoBlocks(html: string): string[] {
  if (typeof document === 'undefined') {
    // Fallback: split on </p>
    return html.split(/<\/p>/i).map(s => s.trim()).filter(Boolean).map(s => s + '</p>');
  }
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  const out: string[] = [];
  wrap.childNodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      out.push((node as HTMLElement).outerHTML);
    } else if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent ?? '').trim();
      if (t) out.push(`<p>${t}</p>`);
    }
  });
  if (out.length === 0 && html.trim()) out.push(`<p>${html}</p>`);
  return out;
}
