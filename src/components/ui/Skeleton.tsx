import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-white/10', className)}
      style={{ width, height }}
    />
  );
}
