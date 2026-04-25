export type BlockType = 'cover' | 'toc' | 'heading' | 'text' | 'image' | 'table' | 'divider' | 'quote' | 'callout';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export type HeaderStyle = 'bold' | 'underline' | 'accent-bar' | 'minimal' | 'gradient' | 'boxed' | 'numbered' | 'pill';
export type CoverLayout = 'centered' | 'left-aligned' | 'split' | 'minimal' | 'full-bleed' | 'banner' | 'sidebar' | 'diagonal';

export interface DesignSettings {
  primaryColor: string;
  secondaryColor: string;
  headerFont: string;
  bodyFont: string;
  margins: 'narrow' | 'normal' | 'wide';
  logoUrl?: string;
  headerStyle?: HeaderStyle;
  coverLayout?: CoverLayout;
  sectionNumbering?: boolean;
  /** Schema 2 = free-form Canva-style canvas; absent or 1 = legacy block flow. */
  schemaVersion?: 1 | 2;
  /** Present when schemaVersion === 2. */
  canvasDocument?: import('./canvas/types').CanvasDocument;
}

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  preview: string; // emoji or icon identifier
  defaults: DesignSettings;
  headerStyle: HeaderStyle;
  coverLayout: CoverLayout;
}

export interface ProposalDesign {
  id: string;
  project_id: string;
  organization_id: string;
  user_id: string;
  template_id: string;
  design_settings: DesignSettings;
  content_blocks: ContentBlock[];
  created_at: string;
  updated_at: string;
}
