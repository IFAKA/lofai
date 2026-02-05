'use client';

import { useEffect, useState, useRef } from 'react';

export function FPSCounter() {
  const [fps, setFps] = useState(0);
  const frameDeltasRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef(performance.now());
  const lastDisplayUpdateRef = useRef(performance.now());
  const rafIdRef = useRef<number>(undefined);

  useEffect(() => {
    const updateFPS = (currentTime: number) => {
      // Measure actual time since last frame
      const delta = currentTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentTime;

      // Store recent frame deltas (keep last 30 frames)
      frameDeltasRef.current.push(delta);
      if (frameDeltasRef.current.length > 30) {
        frameDeltasRef.current.shift();
      }

      // Update display every 200ms
      if (currentTime - lastDisplayUpdateRef.current >= 200) {
        lastDisplayUpdateRef.current = currentTime;

        const deltas = frameDeltasRef.current;
        if (deltas.length > 0) {
          // Calculate average frame time
          const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
          // Convert to FPS (1000ms / avgDelta)
          const currentFps = Math.round(1000 / avgDelta);
          setFps(currentFps);
        }
      }

      rafIdRef.current = requestAnimationFrame(updateFPS);
    };

    rafIdRef.current = requestAnimationFrame(updateFPS);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <div
      className="fixed top-4 left-4 z-50 px-2 py-1 rounded bg-black/50 text-white/80 font-mono text-xs"
      style={{ pointerEvents: 'none' }}
    >
      {fps} FPS
    </div>
  );
}
