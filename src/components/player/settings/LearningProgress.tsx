'use client';

interface LearningProgressProps {
  exploitationRatio: number;
  totalSongs: number;
}

export function LearningProgress({ exploitationRatio, totalSongs }: LearningProgressProps) {
  const getMessage = () => {
    if (totalSongs < 10) return 'Keep listening! Need more data to learn your taste.';
    if (totalSongs < 30) return 'Getting to know you. Patterns are emerging.';
    if (exploitationRatio < 0.5) return 'Still exploring to find what you like best.';
    return 'Well personalized! Still exploring occasionally.';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-text text-sm">Learning Progress</h3>
      <div className="glass-light rounded-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-text-muted text-xs">Personalization</span>
          <span className="text-text-bright text-xs">
            {Math.round(exploitationRatio * 100)}%
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${exploitationRatio * 100}%` }}
          />
        </div>
        <p className="text-text-muted text-xs mt-3">{getMessage()}</p>
      </div>
    </div>
  );
}
