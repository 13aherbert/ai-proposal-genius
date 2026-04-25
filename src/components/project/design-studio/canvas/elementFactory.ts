import { v4 as uuidv4 } from 'uuid';
import {
  CanvasDocument,
  CanvasElement,
  CanvasPage,
  DEFAULT_BACKGROUND,
  DEFAULT_PAGE_SIZE,
  TextProps,
  ImageProps,
  ShapeProps,
  ShapeKind,
} from './types';

const DEFAULT_TEXT: TextProps = {
  html: '<p>Click to edit</p>',
  fontFamily: 'Inter',
  fontSize: 18,
  fontWeight: 400,
  color: '#1a1a1a',
  align: 'left',
  lineHeight: 1.5,
  letterSpacing: 0,
};

const DEFAULT_IMAGE: ImageProps = {
  url: '',
  objectFit: 'cover',
  opacity: 1,
  borderRadius: 0,
  shadow: 'none',
  filter: 'none',
};

const DEFAULT_SHAPE: ShapeProps = {
  kind: 'rect',
  fill: '#3B82F6',
  stroke: 'transparent',
  strokeWidth: 0,
  borderRadius: 8,
  shadow: 'none',
  opacity: 1,
};

let zCounter = 1;
export function nextZ() { return ++zCounter; }

export function makeTextElement(partial: Partial<CanvasElement> = {}, text: Partial<TextProps> = {}): CanvasElement {
  return {
    id: uuidv4(),
    type: 'text',
    x: 80, y: 80, width: 400, height: 80,
    rotation: 0,
    zIndex: nextZ(),
    text: { ...DEFAULT_TEXT, ...text },
    ...partial,
  };
}

export function makeImageElement(url: string, partial: Partial<CanvasElement> = {}): CanvasElement {
  return {
    id: uuidv4(),
    type: 'image',
    x: 100, y: 100, width: 320, height: 220,
    rotation: 0,
    zIndex: nextZ(),
    image: { ...DEFAULT_IMAGE, url },
    ...partial,
  };
}

export function makeShapeElement(kind: ShapeKind, partial: Partial<CanvasElement> = {}): CanvasElement {
  const base: Partial<CanvasElement> =
    kind === 'line' || kind === 'arrow'
      ? { width: 200, height: 4 }
      : kind === 'circle'
        ? { width: 160, height: 160 }
        : { width: 200, height: 140 };

  return {
    id: uuidv4(),
    type: 'shape',
    x: 120, y: 120,
    rotation: 0,
    zIndex: nextZ(),
    shape: { ...DEFAULT_SHAPE, kind, borderRadius: kind === 'rect' ? 8 : 0 },
    ...base,
    ...partial,
  };
}

export function makeIconElement(name: string, partial: Partial<CanvasElement> = {}): CanvasElement {
  return {
    id: uuidv4(),
    type: 'icon',
    x: 140, y: 140, width: 64, height: 64,
    rotation: 0,
    zIndex: nextZ(),
    icon: { name, color: '#1a1a1a', strokeWidth: 2 },
    ...partial,
  };
}

export function makePage(partial: Partial<CanvasPage> = {}): CanvasPage {
  return {
    id: uuidv4(),
    background: { ...DEFAULT_BACKGROUND },
    elements: [],
    ...partial,
  };
}

export function makeBlankDocument(): CanvasDocument {
  return {
    pages: [makePage()],
    pageSize: { ...DEFAULT_PAGE_SIZE },
  };
}

// Text presets shown in the left sidebar.
export const TEXT_PRESETS: Array<{ label: string; props: Partial<TextProps>; size: { w: number; h: number }; html: string }> = [
  { label: 'Heading 1', props: { fontSize: 56, fontWeight: 700, lineHeight: 1.1 }, size: { w: 600, h: 80 }, html: '<p>Heading 1</p>' },
  { label: 'Heading 2', props: { fontSize: 40, fontWeight: 700, lineHeight: 1.2 }, size: { w: 520, h: 64 }, html: '<p>Heading 2</p>' },
  { label: 'Heading 3', props: { fontSize: 28, fontWeight: 600, lineHeight: 1.3 }, size: { w: 440, h: 50 }, html: '<p>Heading 3</p>' },
  { label: 'Body',      props: { fontSize: 16, fontWeight: 400, lineHeight: 1.55 }, size: { w: 400, h: 100 }, html: '<p>Body text. Click to edit and add your content.</p>' },
  { label: 'Caption',   props: { fontSize: 12, fontWeight: 400, color: '#6b7280' }, size: { w: 300, h: 32 }, html: '<p>Caption</p>' },
  { label: 'Quote',     props: { fontSize: 22, fontWeight: 400, italic: true, lineHeight: 1.4 }, size: { w: 480, h: 90 }, html: '<p>"A meaningful quote."</p>' },
];
