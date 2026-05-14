import { TemplateConfig } from './types';

export const AVAILABLE_FONTS = [
  // Display / heading
  'Playfair Display',
  'Cormorant Garamond',
  'Libre Baskerville',
  'Space Grotesk',
  'Syne',
  // Body
  'Inter',
  'Karla',
  'IBM Plex Sans',
  'DM Sans',
  // Legacy (kept so older designs still resolve)
  'Georgia',
  'Merriweather',
  'Roboto',
] as const;

/**
 * Curated Editorial-Corporate template set.
 * All five share a refined, modern-corporate DNA but each has a clearly
 * distinct typographic + chromatic personality.
 */
export const templates: TemplateConfig[] = [
  {
    id: 'sterling',
    name: 'Sterling',
    description: 'Editorial corporate · navy & gold · serif headlines',
    preview: '🏛️',
    defaults: {
      primaryColor: '#0f1b3d',
      secondaryColor: '#c9a84c',
      headerFont: 'Playfair Display',
      bodyFont: 'Inter',
      margins: 'wide',
      headerStyle: 'underline',
      coverLayout: 'full-bleed',
    },
    headerStyle: 'underline',
    coverLayout: 'full-bleed',
  },
  {
    id: 'meridian',
    name: 'Meridian',
    description: 'Modern tech-corporate · deep indigo · clean sans',
    preview: '◆',
    defaults: {
      primaryColor: '#1e1e5a',
      secondaryColor: '#4f46e5',
      headerFont: 'Space Grotesk',
      bodyFont: 'Inter',
      margins: 'normal',
      headerStyle: 'accent-bar',
      coverLayout: 'split',
    },
    headerStyle: 'accent-bar',
    coverLayout: 'split',
  },
  {
    id: 'atelier',
    name: 'Atelier',
    description: 'Luxury minimal · cream & ink · thin gold rules',
    preview: '✦',
    defaults: {
      primaryColor: '#1a1a1a',
      secondaryColor: '#c9a84c',
      headerFont: 'Cormorant Garamond',
      bodyFont: 'Karla',
      margins: 'wide',
      headerStyle: 'minimal',
      coverLayout: 'minimal',
    },
    headerStyle: 'minimal',
    coverLayout: 'minimal',
  },
  {
    id: 'capitol',
    name: 'Capitol',
    description: 'Government & legal · navy serif · numbered sections',
    preview: '⚖',
    defaults: {
      primaryColor: '#0f1b3d',
      secondaryColor: '#475569',
      headerFont: 'Libre Baskerville',
      bodyFont: 'IBM Plex Sans',
      margins: 'normal',
      headerStyle: 'numbered',
      coverLayout: 'left-aligned',
      sectionNumbering: true,
    },
    headerStyle: 'numbered',
    coverLayout: 'left-aligned',
  },
  {
    id: 'vanguard',
    name: 'Vanguard',
    description: 'Bold consulting · charcoal & ember · confident',
    preview: '▲',
    defaults: {
      primaryColor: '#1a1a1a',
      secondaryColor: '#e85d3a',
      headerFont: 'Syne',
      bodyFont: 'DM Sans',
      margins: 'normal',
      headerStyle: 'pill',
      coverLayout: 'diagonal',
    },
    headerStyle: 'pill',
    coverLayout: 'diagonal',
  },
];

const LEGACY_ALIASES: Record<string, string> = {
  'modern-corporate': 'meridian',
  'clean-minimal': 'atelier',
  'government-contract': 'capitol',
  'consulting-proposal': 'meridian',
  'creative-agency': 'vanguard',
  'executive-brief': 'sterling',
  'technical-report': 'capitol',
  'bold-pitch': 'vanguard',
};

export function getTemplate(id: string): TemplateConfig {
  const direct = templates.find(t => t.id === id);
  if (direct) return direct;
  const aliased = LEGACY_ALIASES[id];
  if (aliased) {
    const t = templates.find(x => x.id === aliased);
    if (t) return t;
  }
  return templates[0];
}
