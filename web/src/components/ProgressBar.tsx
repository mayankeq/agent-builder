import React from 'react';
import { cn } from '@/utils';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  showLabel = true,
}) => {
  const percentage = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={cn('space-y-1', className)}>
      <div className="w-full bg-secondary-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-secondary-600 text-right">{percentage.toFixed(0)}%</p>
      )}
    </div>
  );
};
