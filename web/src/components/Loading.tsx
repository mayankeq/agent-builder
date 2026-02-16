import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ text = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <p className="text-secondary-600">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        {content}
      </div>
    );
  }

  return content;
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`skeleton ${className}`} />;
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="card space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex space-x-2 pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
};
