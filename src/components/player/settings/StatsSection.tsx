'use client';

interface StatsSectionProps {
  totalSongs: number;
  likeCount: number;
  skipCount: number;
}

export function StatsSection({ totalSongs, likeCount, skipCount }: StatsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-text text-sm">Your Stats</h3>
      <div className="grid grid-cols-3 gap-4">
        <StatCard value={totalSongs} label="songs" />
        <StatCard value={likeCount} label="likes" />
        <StatCard value={skipCount} label="skips" />
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
