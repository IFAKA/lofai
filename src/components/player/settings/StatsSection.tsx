'use client';

import { Skeleton } from '../../ui/Skeleton';

interface StatsSectionProps {
  totalSongs: number;
  likeCount: number;
  skipCount: number;
  isLoading?: boolean;
}

export function StatsSection({ totalSongs, likeCount, skipCount, isLoading }: StatsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-text text-sm">Your Stats</h3>
      <div className="grid grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard value={totalSongs} label="songs" />
            <StatCard value={likeCount} label="likes" />
            <StatCard value={skipCount} label="skips" />
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass-light rounded-xl p-4 text-center">
      <div className="text-text-bright text-xl">{value}</div>
      <div className="text-text-muted text-xs mt-1">{label}</div>
    </div>
  );
}

function SkeletonStatCard() {
  return (
    <div className="glass-light rounded-xl p-4 flex flex-col items-center gap-2">
      <Skeleton className="h-6 w-8" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}
