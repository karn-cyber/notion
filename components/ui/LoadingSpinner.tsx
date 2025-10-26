import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'icon';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 20, 
  className = "",
  variant = 'default'
}) => {
  if (variant === 'icon') {
    return (
      <Loader2 
        size={size} 
        className={cn("animate-spin text-muted-foreground", className)} 
      />
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn("flex space-x-1", className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-current rounded-full animate-pulse"
            style={{ 
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div 
        className={cn("rounded-full bg-current animate-pulse opacity-75", className)}
        style={{ width: size, height: size }}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]",
        className
      )}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;