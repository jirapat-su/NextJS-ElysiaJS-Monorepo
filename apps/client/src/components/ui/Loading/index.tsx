import { cn } from '@repo/shadcn/lib/utils';
import { Loader2 } from 'lucide-react';
import { memo } from 'react';

type LoadingProps = {
  className?: string;
  size?: number;
  text?: string;
  fullScreen?: boolean;
};

export const Loading = memo(
  ({ className, size = 32, text, fullScreen = false }: LoadingProps) => {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 text-muted-foreground',
          fullScreen &&
            'fixed inset-0 z-50 h-screen w-screen bg-background/80 backdrop-blur-sm',
          className
        )}
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute h-full w-full animate-ping rounded-full bg-primary/20 opacity-75 duration-1000" />
          <Loader2 className="relative animate-spin text-primary" size={size} />
        </div>
        {text && <p className="animate-pulse font-medium text-sm">{text}</p>}
      </div>
    );
  }
);

Loading.displayName = 'Loading';
