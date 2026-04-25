import { lazy, Suspense } from 'react';
import { IconProps } from '../types';
// Lucide ships hundreds of icons; load the dynamic-icon helper only when needed.
import * as Lucide from 'lucide-react';

interface IconRendererProps {
  icon: IconProps;
}

export function IconRenderer({ icon }: IconRendererProps) {
  // Lookup component by exact name; fall back to Star.
  const Cmp = (Lucide as unknown as Record<string, React.ComponentType<{ color?: string; strokeWidth?: number; size?: number | string; style?: React.CSSProperties }>>)[icon.name] ?? Lucide.Star;
  return (
    <Cmp
      color={icon.color}
      strokeWidth={icon.strokeWidth}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
