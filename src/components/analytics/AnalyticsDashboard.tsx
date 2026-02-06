'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart } from './BarChart';
import { LineChart } from './LineChart';
import { getDailyStats, getParamPopularity, summarizeTopPreferences, type DailyStat, type ParamPopularity } from '@/lib/preferences/analytics';
import { Skeleton } from '../ui/Skeleton';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnalyticsDashboard({ isOpen, onClose }: AnalyticsDashboardProps) {
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [paramPopularity, setParamPopularity] = useState<ParamPopularity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    Promise.all([getDailyStats(14), getParamPopularity()])
      .then(([daily, params]) => {
        setDailyStats(daily);
        setParamPopularity(params);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  const topPrefs = summarizeTopPreferences(paramPopularity);
  const totalSongs = dailyStats.reduce((s, d) => s + d.songCount, 0);
  const totalMinutes = Math.round(dailyStats.reduce((s, d) => s + d.listenMinutes, 0));

  const songsPerDay = dailyStats.map(d => ({
    label: d.date.slice(5),
    value: d.songCount,
  }));

  const minutesPerDay = dailyStats.map(d => ({
    label: d.date.slice(5),
    value: Math.round(d.listenMinutes),
  }));

  const topParams = paramPopularity.slice(0, 8).map(p => ({
    label: p.arm,
    value: p.count,
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl glass p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-text-bright text-lg font-medium">Your Insights</h2>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text transition-colors text-sm"
              >
                Close
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-light rounded-xl p-4 text-center">
                    <div className="text-text-bright text-2xl">{totalSongs}</div>
                    <div className="text-text-muted text-xs mt-1">songs (14 days)</div>
                  </div>
                  <div className="glass-light rounded-xl p-4 text-center">
                    <div className="text-text-bright text-2xl">{totalMinutes}</div>
                    <div className="text-text-muted text-xs mt-1">minutes focused</div>
                  </div>
                </div>

                {/* Songs per day */}
                <div className="space-y-2">
                  <h3 className="text-text text-sm">Songs Per Day</h3>
                  <div className="glass-light rounded-xl p-3 overflow-hidden">
                    <BarChart data={songsPerDay} />
                  </div>
                </div>

                {/* Listen time trend */}
                <div className="space-y-2">
                  <h3 className="text-text text-sm">Focus Minutes</h3>
                  <div className="glass-light rounded-xl p-3 overflow-hidden">
                    <LineChart data={minutesPerDay} />
                  </div>
                </div>

                {/* Favorite params */}
                {topParams.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-text text-sm">Most Played Styles</h3>
                    <div className="glass-light rounded-xl p-3 overflow-hidden">
                      <BarChart data={topParams} barColor="rgba(192, 132, 252, 0.6)" />
                    </div>
                  </div>
                )}

                {/* Top preferences summary */}
                {topPrefs.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-text text-sm">Your Taste</h3>
                    <div className="flex flex-wrap gap-2">
                      {topPrefs.map((pref) => (
                        <span
                          key={pref}
                          className="px-3 py-1.5 rounded-full glass-light text-text-muted text-xs"
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
