
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  lazyLoad?: boolean;
  threshold?: number;
  placeholderColor?: string;
  withBlur?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallbackSrc,
  lazyLoad = true,
  threshold = 0.1,
  placeholderColor,
  withBlur = true,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [intersected, setIntersected] = useState(!lazyLoad);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!lazyLoad || !imgRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIntersected(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    
    observer.observe(imgRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [lazyLoad, threshold]);
  
  const handleLoad = () => {
    setLoaded(true);
  };
  
  const handleError = () => {
    setError(true);
    console.warn(`Failed to load image: ${src}`);
  };
  
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {(!loaded || !intersected) && (
        <Skeleton 
          className={cn(
            "absolute inset-0", 
            placeholderColor || "bg-muted"
          )} 
          style={{ 
            backgroundColor: placeholderColor
          }}
        />
      )}
      <img
        ref={imgRef}
        src={error ? fallbackSrc || '/placeholder.svg' : (intersected ? src : undefined)}
        data-src={src}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          !loaded && "opacity-0",
          loaded && "opacity-100",
          withBlur && !loaded && "blur-sm",
          withBlur && loaded && "blur-0"
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
}
