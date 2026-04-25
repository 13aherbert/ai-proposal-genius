import { ImageProps, shadowToCss, filterToCss } from '../types';
import { useSignedUrl } from '../../useSignedUrl';

interface ImageRendererProps {
  image: ImageProps;
}

export function ImageRenderer({ image }: ImageRendererProps) {
  const resolved = useSignedUrl(image.url);
  const src = resolved || image.url;

  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs rounded">
        No image
      </div>
    );
  }

  const transform = [
    image.flipH ? 'scaleX(-1)' : '',
    image.flipV ? 'scaleY(-1)' : '',
  ].filter(Boolean).join(' ');

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        width: '100%',
        height: '100%',
        objectFit: image.objectFit,
        opacity: image.opacity,
        borderRadius: image.borderRadius,
        boxShadow: shadowToCss(image.shadow),
        filter: filterToCss(image.filter),
        transform: transform || undefined,
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    />
  );
}
