'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAudioAnalyzer } from '@/lib/audio/useAudioAnalyzer';
import { usePerformanceTier, useIsMobile } from '@/lib/hooks/useIsMobile';
import { useEffect, useState, useRef, useCallback, memo } from 'react';

interface Blob {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  heat: number;
  hue: number;
}

let blobId = 0;

const createBlob = (x: number, y: number, radius: number, heat = 0.2, hue = 265 + Math.random() * 30): Blob => ({
  id: blobId++, x, y, vx: 0, vy: 0, radius, heat, hue,
});

const TIER_CONFIG = {
  high:   { count: 7, radius: [14, 10], minBlobs: 5, maxBlobs: 10, maxRadius: 35, blur: 28, shadow: true,  interval: 33, size: 6 },
  medium: { count: 4, radius: [12, 8],  minBlobs: 3, maxBlobs: 6,  maxRadius: 28, blur: 20, shadow: false, interval: 40, size: 5 },
  low:    { count: 3, radius: [12, 8],  minBlobs: 3, maxBlobs: 4,  maxRadius: 28, blur: 14, shadow: false, interval: 50, size: 5 },
} as const;

const initBlobs = (tier: keyof typeof TIER_CONFIG): Blob[] => {
  const { count, radius: [base, range] } = TIER_CONFIG[tier];
  return Array.from({ length: count }, (_, i) =>
    createBlob(25 + (i / (count - 1)) * 50, 65 + Math.random() * 25, base + Math.random() * range, 0.1 + Math.random() * 0.2)
  );
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const LavaLamp = memo(function LavaLamp({ isPlaying, bpm }: { isPlaying: boolean; bpm: number }) {
  const { isMobile } = useIsMobile();
  const tier = usePerformanceTier();
  const { bass, mids, overall } = useAudioAnalyzer(isPlaying && !isMobile);
  const config = TIER_CONFIG[tier];

  const [hasEverPlayed, setHasEverPlayed] = useState(false);
  const [blobs, setBlobs] = useState<Blob[]>(() => initBlobs(tier));
  const [isTabVisible, setIsTabVisible] = useState(true);

  const audioRef = useRef({ bass: 0, mids: 0, overall: 0, bpm: 80 });
  audioRef.current = { bass, mids, overall, bpm };

  useEffect(() => { setBlobs(initBlobs(tier)); }, [tier]);
  useEffect(() => { if (isPlaying) setHasEverPlayed(true); }, [isPlaying]);

  useEffect(() => {
    const handler = () => setIsTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const tick = useCallback(() => {
    const { bass, mids, bpm: audioBpm } = audioRef.current;
    const bpmMult = clamp(audioBpm / 80, 0.5, 2);
    const heatPower = (0.4 + audioRef.current.overall * 0.3 + bass * 0.2) * bpmMult;
    const { minBlobs, maxBlobs, maxRadius } = config;

    const getHeatDelta = (y: number) =>
      y > 75 ? 0.025 * heatPower : y > 60 ? 0.012 * heatPower :
      y < 25 ? -0.035 * bpmMult : y < 40 ? -0.02 * bpmMult : -0.008 * bpmMult;

    setBlobs(prev => {
      // Physics update
      let updated = prev.map(blob => {
        const heat = clamp(blob.heat + getHeatDelta(blob.y), 0, 1);
        const buoyancy = (heat - 0.5) * 0.15 * bpmMult;
        const bassPush = bass > 0.55 ? (bass - 0.55) * 0.12 * bpmMult : 0;
        const wobble = Math.sin(Date.now() * 0.001 * bpmMult + blob.id * 1.7) * 0.04 * (0.6 + mids * 0.4);

        let vy = (blob.vy + 0.02 * bpmMult - buoyancy - bassPush) * 0.94;
        let vx = (blob.vx + wobble) * 0.91;
        let x = blob.x + vx, y = blob.y + vy;

        if (x < 15) { x = 15; vx = Math.abs(vx) * 0.3; }
        if (x > 85) { x = 85; vx = -Math.abs(vx) * 0.3; }
        if (y < 8)  { y = 8;  vy = Math.abs(vy) * 0.3; }
        if (y > 92) { y = 92; vy = -Math.abs(vy) * 0.3; }

        const pulse = bass > 0.35 ? (bass - 0.35) * 3.2 : 0;
        return { ...blob, x, y, vx, vy, heat, radius: Math.min(maxRadius, blob.radius + pulse) };
      });

      // Merge nearby blobs
      const merged = new Set<number>();
      const result: Blob[] = [];

      for (let i = 0; i < updated.length; i++) {
        if (merged.has(updated[i].id)) continue;
        let cur = updated[i];

        for (let j = i + 1; j < updated.length; j++) {
          if (merged.has(updated[j].id)) continue;
          const o = updated[j];
          const dist = Math.hypot(cur.x - o.x, cur.y - o.y);
          const combined = Math.hypot(cur.radius, o.radius);

          if (dist < (cur.radius + o.radius) * 0.35 && updated.length - merged.size > minBlobs && combined <= maxRadius) {
            merged.add(o.id);
            const total = cur.radius ** 2 + o.radius ** 2;
            const w1 = cur.radius ** 2 / total, w2 = o.radius ** 2 / total;
            cur = {
              id: blobId++, radius: combined, hue: cur.hue,
              x: cur.x * w1 + o.x * w2, y: cur.y * w1 + o.y * w2,
              vx: cur.vx * w1 + o.vx * w2, vy: cur.vy * w1 + o.vy * w2,
              heat: cur.heat * w1 + o.heat * w2,
            };
          }
        }
        result.push(cur);
      }

      // Split large/cold blobs
      const splitCandidate = result.find(b =>
        result.length < maxBlobs && (
          (b.radius > maxRadius * 0.75 && b.y < 30 && b.heat < 0.35) ||
          b.radius > maxRadius * 0.9 ||
          (b.radius > 20 && bass > 0.75 && Math.random() < 0.03)
        )
      );

      if (splitCandidate) {
        const { x, y, radius, heat, hue } = splitCandidate;
        const r = radius * 0.7;
        return [
          ...result.filter(b => b.id !== splitCandidate.id),
          { ...createBlob(x - 3, y, r, heat + 0.1, hue), vy: -0.5 },
          { ...createBlob(x + 3, y, r, heat - 0.05, hue), vy: 0.3 },
        ];
      }

      return result;
    });
  }, [config]);

  useEffect(() => {
    if (!isPlaying || !isTabVisible) return;

    let lastTime = 0;
    let rafId: number;

    const loop = (t: number) => {
      rafId = requestAnimationFrame(loop);
      if (t - lastTime >= config.interval) {
        lastTime = t;
        tick();
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, tick, config.interval, isTabVisible]);

  if (isMobile) return null;

  return (
    <AnimatePresence>
      {hasEverPlayed && (
        <motion.div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          <svg className="absolute w-0 h-0" aria-hidden="true">
            <defs>
              <filter id="goo" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation={config.blur} result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 10 -4" />
              </filter>
            </defs>
          </svg>

          <div
            className="absolute bottom-0 left-1/4 right-1/4 h-1/3"
            style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(168, 85, 247, 0.12) 0%, transparent 70%)' }}
          />

          <div className="absolute inset-0" style={{ filter: 'url(#goo)', contain: 'strict', willChange: 'contents' }}>
            {blobs.map(blob => {
              const size = blob.radius * config.size;
              const lightness = 40 + blob.heat * 25;
              const saturation = 65 + blob.heat * 20;
              const stretch = 1 + Math.min(0.55, Math.abs(blob.vy) * 0.4);
              const blur = size * 0.75;
              const color = `hsl(${blob.hue}, ${saturation}%, ${lightness}%)`;

              return (
                <div
                  key={blob.id}
                  className="absolute rounded-full"
                  style={{
                    width: size,
                    height: size,
                    left: `${blob.x}%`,
                    top: `${blob.y}%`,
                    transform: `translate(-50%, -50%) scaleY(${stretch})`,
                    backgroundColor: color,
                    boxShadow: config.shadow ? `0 0 ${blur}px ${blur * 0.5}px ${color}` : 'none',
                    willChange: 'transform',
                    contain: 'layout paint',
                  }}
                />
              );
            })}
          </div>

          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(139, 92, 246, 0.04) 0%, transparent 50%)' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
});
