'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePreferenceStore } from '@/stores/preferenceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudioStore } from '@/stores/audioStore';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { Modal, Switch, Slider } from '../ui';
import {
  StatsSection,
  LearningProgress,
  LearnedPreferences,
} from './settings/index';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLEEP_TIMER_OPTIONS = [
  { label: 'Off', value: null },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
] as const;

function isTimerOptionActive(
  optionValue: number | null,
  sleepTimerMinutes: number | null,
  sleepTimerEndTime: number | null
): boolean {
  if (optionValue === null) return sleepTimerEndTime === null;
  return sleepTimerMinutes === optionValue && sleepTimerEndTime !== null;
}

function getExplorationLabel(value: number): string {
  if (value < 0.25) return 'Familiar';
  if (value < 0.5) return 'Mostly Familiar';
  if (value < 0.75) return 'Balanced';
  if (value < 0.9) return 'Mostly New';
  return 'Discover';
}

function getExplorationDescription(value: number): string {
  if (value < 0.3) return 'Sticks to your learned preferences';
  if (value < 0.7) return 'Balances favorites with new discoveries';
  return 'Explores more variety in music styles';
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const {
    totalSongs,
    likeCount,
    skipCount,
    exploitationRatio,
    bestParams,
    loadStats,
    resetPreferences,
    isLoading,
  } = usePreferenceStore();

  const {
    bpmMin,
    bpmMax,
    explorationLevel,
    sleepTimerMinutes,
    sleepTimerEndTime,
    backgroundEnabled,
    setBpmRange,
    setExplorationLevel,
    setSleepTimer,
    clearSleepTimer,
    setBackgroundEnabled,
  } = useSettingsStore();

  const { pause } = useAudioStore();
  const { isDesktop } = useIsMobile();

  const [localBpmMin, setLocalBpmMin] = useState(bpmMin);
  const [localBpmMax, setLocalBpmMax] = useState(bpmMax);
  const [localExploration, setLocalExploration] = useState(explorationLevel);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  useEffect(() => {
    setLocalBpmMin(bpmMin);
    setLocalBpmMax(bpmMax);
    setLocalExploration(explorationLevel);
  }, [bpmMin, bpmMax, explorationLevel]);

  useEffect(() => {
    if (!sleepTimerEndTime) {
      setTimeRemaining(null);
      return;
    }

    const updateRemaining = () => {
      const remaining = sleepTimerEndTime - Date.now();
      if (remaining <= 0) {
        pause();
        clearSleepTimer();
        setTimeRemaining(null);
        return;
      }
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerEndTime, pause, clearSleepTimer]);

  useEffect(() => {
    if (isOpen) loadStats();
  }, [isOpen, loadStats]);

  const handleBpmMinCommit = useCallback(() => {
    const min = Math.min(localBpmMin, localBpmMax);
    const max = Math.max(localBpmMin, localBpmMax);
    setBpmRange(min, max);
  }, [localBpmMin, localBpmMax, setBpmRange]);

  const handleBpmMaxCommit = useCallback(() => {
    const min = Math.min(localBpmMin, localBpmMax);
    const max = Math.max(localBpmMin, localBpmMax);
    setBpmRange(min, max);
  }, [localBpmMin, localBpmMax, setBpmRange]);

  const handleExplorationCommit = useCallback(() => {
    setExplorationLevel(localExploration);
  }, [localExploration, setExplorationLevel]);

  const handleReset = async () => {
    if (confirm('Reset all learned preferences? This cannot be undone.')) {
      await resetPreferences();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant={isDesktop ? 'modal' : 'sheet'}
      maxWidth="max-w-md"
      maxHeight="80vh"
    >
      <div className="space-y-8">
        <h2 className="text-text-bright text-lg font-medium">Settings</h2>

        {/* Sleep Timer */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-text text-sm">Sleep Timer</h3>
            {timeRemaining && (
              <span className="text-accent text-sm font-mono">{timeRemaining}</span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {SLEEP_TIMER_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => setSleepTimer(option.value)}
                className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                  isTimerOptionActive(option.value, sleepTimerMinutes, sleepTimerEndTime)
                    ? 'glass-light text-text-bright'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* BPM Range */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-text text-sm">BPM Range</h3>
            <span className="text-text-muted text-xs font-mono">
              {localBpmMin} - {localBpmMax} BPM
            </span>
          </div>
          <div className="glass-light rounded-xl p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-text-muted">
                <span>Min</span>
                <span>{localBpmMin} BPM</span>
              </div>
              <Slider
                value={[localBpmMin]}
                onValueChange={([v]) => setLocalBpmMin(v)}
                onValueCommit={handleBpmMinCommit}
                min={60}
                max={100}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-text-muted">
                <span>Max</span>
                <span>{localBpmMax} BPM</span>
              </div>
              <Slider
                value={[localBpmMax]}
                onValueChange={([v]) => setLocalBpmMax(v)}
                onValueCommit={handleBpmMaxCommit}
                min={60}
                max={100}
                step={5}
              />
            </div>
            <p className="text-text-muted text-xs">
              Restricts generated songs to this tempo range
            </p>
          </div>
        </div>

        {/* Discovery Mode */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-text text-sm">Discovery Mode</h3>
            <span className="text-text-muted text-xs">
              {getExplorationLabel(localExploration)}
            </span>
          </div>
          <div className="glass-light rounded-xl p-5 space-y-3">
            <div className="flex justify-between text-xs text-text-muted">
              <span>Familiar</span>
              <span>Discover</span>
            </div>
            <Slider
              value={[localExploration]}
              onValueChange={([v]) => setLocalExploration(v)}
              onValueCommit={handleExplorationCommit}
              min={0}
              max={1}
              step={0.05}
            />
            <p className="text-text-muted text-xs">
              {getExplorationDescription(localExploration)}
            </p>
          </div>
        </div>

        {/* Background Animation - Desktop only */}
        {isDesktop && (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div>
                <h3 className="text-text text-sm">Background Animation</h3>
                <p className="text-text-muted text-xs mt-1">Disable for better performance</p>
              </div>
              <Switch
                checked={backgroundEnabled}
                onCheckedChange={setBackgroundEnabled}
                aria-label="Background animation"
              />
            </div>
          </div>
        )}

        <StatsSection totalSongs={totalSongs} likeCount={likeCount} skipCount={skipCount} />
        <LearningProgress exploitationRatio={exploitationRatio} totalSongs={totalSongs} />
        <LearnedPreferences bestParams={bestParams} />

        {/* Reset Button */}
        <button
          onClick={handleReset}
          disabled={isLoading}
          className="w-full py-3 rounded-xl border border-error/30 text-error text-sm hover:bg-error/10 transition-colors disabled:opacity-50"
        >
          Reset Learned Preferences
        </button>

        {/* About */}
        <div className="text-center space-y-2 pt-6">
          <p className="text-text-muted text-xs">LofAI v1.0.0</p>
          <p className="text-text-muted text-xs">
            AI-generated lofi music that learns your taste
          </p>
        </div>
      </div>
    </Modal>
  );
}
