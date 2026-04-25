// Canvas (v2) data model — free-form, page-based editor (Canva-style).
// Stored inside ProposalDesign.design_settings.canvasDocument when schema_version === 2.

export type CanvasElementType =
  | 'text'
  | 'image'
  | 'shape'
  | 'icon'
  | 'line';

export type ShapeKind = 'rect' | 'circle' | 'triangle' | 'line' | 'arrow';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type ObjectFit = 'cover' | 'contain';
export type ShadowPreset = 'none' | 'soft' | 'medium' | 'hard';
export type FilterPreset = 'none' | 'grayscale' | 'sepia' | 'blur';
export type BackgroundType = 'solid' | 'gradient' | 'image';

export interface TextProps {
  html: string;                // TipTap-generated HTML
  fontFamily: string;
  fontSize: number;            // px
  fontWeight: number;          // 100..900
  italic?: boolean;
  underline?: boolean;
  color: string;               // hex or hsl()
  align: TextAlign;
  lineHeight: number;          // unitless multiplier
  letterSpacing: number;       // px
}

export interface ImageProps {
  url: string;
  objectFit: ObjectFit;
  opacity: number;             // 0..1
  borderRadius: number;        // px
  shadow: ShadowPreset;
  filter: FilterPreset;
  flipH?: boolean;
  flipV?: boolean;
}

export interface ShapeProps {
  kind: ShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;        // for rect
  shadow: ShadowPreset;
  opacity: number;             // 0..1
}

export interface IconProps {
  name: string;                // Lucide icon name (e.g. "Star")
  color: string;
  strokeWidth: number;
}

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;                   // px in page coordinates
  y: number;
  width: number;
  height: number;
  rotation: number;            // degrees
  zIndex: number;
  locked?: boolean;
  text?: TextProps;
  image?: ImageProps;
  shape?: ShapeProps;
  icon?: IconProps;
}

export interface CanvasBackground {
  type: BackgroundType;
  color?: string;                                       // for solid
  gradient?: { from: string; to: string; angle: number }; // degrees
  imageUrl?: string;
  overlayOpacity?: number;                              // 0..1
}

export interface CanvasPage {
  id: string;
  background: CanvasBackground;
  elements: CanvasElement[];
}

export interface CanvasDocument {
  pages: CanvasPage[];
  pageSize: { width: number; height: number };          // px @ 96dpi
}

// US Letter @ 96dpi
export const DEFAULT_PAGE_SIZE = { width: 816, height: 1056 };

export const DEFAULT_BACKGROUND: CanvasBackground = {
  type: 'solid',
  color: '#ffffff',
};

// Helpers ---------------------------------------------------------------

export function isCanvasDocument(v: unknown): v is CanvasDocument {
  return !!v && typeof v === 'object' && Array.isArray((v as CanvasDocument).pages);
}

export function shadowToCss(s: ShadowPreset): string {
  switch (s) {
    case 'soft':   return '0 4px 12px rgba(0,0,0,0.08)';
    case 'medium': return '0 8px 24px rgba(0,0,0,0.15)';
    case 'hard':   return '0 16px 40px rgba(0,0,0,0.28)';
    default:       return 'none';
  }
}

export function filterToCss(f: FilterPreset): string {
  switch (f) {
    case 'grayscale': return 'grayscale(100%)';
    case 'sepia':     return 'sepia(80%)';
    case 'blur':      return 'blur(3px)';
    default:          return 'none';
  }
}

export function backgroundToCss(bg: CanvasBackground): React.CSSProperties {
  if (bg.type === 'gradient' && bg.gradient) {
    return { background: `linear-gradient(${bg.gradient.angle}deg, ${bg.gradient.from}, ${bg.gradient.to})` };
  }
  if (bg.type === 'image' && bg.imageUrl) {
    return {
      backgroundImage: `url(${bg.imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { backgroundColor: bg.color || '#ffffff' };
}
