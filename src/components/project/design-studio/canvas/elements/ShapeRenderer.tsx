import { ShapeProps, shadowToCss } from '../types';

interface ShapeRendererProps {
  shape: ShapeProps;
  width: number;
  height: number;
}

export function ShapeRenderer({ shape, width, height }: ShapeRendererProps) {
  const { kind, fill, stroke, strokeWidth, borderRadius, shadow, opacity } = shape;

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    opacity,
    filter: shadow !== 'none' ? `drop-shadow(${shadowToCss(shadow)})` : undefined,
  };

  if (kind === 'rect') {
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: fill,
          border: strokeWidth > 0 ? `${strokeWidth}px solid ${stroke}` : 'none',
          borderRadius,
        }}
      />
    );
  }

  if (kind === 'circle') {
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: fill,
          border: strokeWidth > 0 ? `${strokeWidth}px solid ${stroke}` : 'none',
          borderRadius: '50%',
        }}
      />
    );
  }

  if (kind === 'triangle') {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={baseStyle}>
        <polygon
          points={`${width / 2},0 ${width},${height} 0,${height}`}
          fill={fill}
          stroke={strokeWidth > 0 ? stroke : 'none'}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  if (kind === 'line') {
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: fill,
          height: Math.max(strokeWidth || 2, 1),
          marginTop: (height - Math.max(strokeWidth || 2, 1)) / 2,
        }}
      />
    );
  }

  if (kind === 'arrow') {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={baseStyle}>
        <defs>
          <marker id={`arrowhead-${fill.replace('#', '')}`} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill={fill} />
          </marker>
        </defs>
        <line
          x1={0} y1={height / 2} x2={width - 10} y2={height / 2}
          stroke={fill}
          strokeWidth={Math.max(strokeWidth || 3, 2)}
          markerEnd={`url(#arrowhead-${fill.replace('#', '')})`}
        />
      </svg>
    );
  }

  return null;
}
