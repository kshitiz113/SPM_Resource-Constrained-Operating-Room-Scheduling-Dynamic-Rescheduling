import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading operational data...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Loader2 className={`${sizeClasses} text-teal-400 animate-spin mb-3`} />
      {label && <p className="text-sm font-medium text-slate-400 tracking-wide">{label}</p>}
    </div>
  );
};
