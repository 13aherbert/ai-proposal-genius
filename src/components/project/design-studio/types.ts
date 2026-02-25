export type BlockType = 'cover' | 'toc' | 'heading' | 'text' | 'image' | 'table' | 'divider' | 'quote' | 'callout';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export interface DesignSettings {
  primaryColor: string;
  secondaryColor: string;
  headerFont: string;
  bodyFont: string;
  margins: 'narrow' | 'normal' | 'wide';
  logoUrl?: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  preview: string; // emoji or icon identifier
  defaults: DesignSettings;
  headerStyle: 'bold' | 'underline' | 'accent-bar' | 'minimal' | 'gradient';
  coverLayout: 'centered' | 'left-aligned' | 'split' | 'minimal' | 'full-bleed';
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
