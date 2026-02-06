'use client';

import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioAnalyzer } from '@/lib/audio/useAudioAnalyzer';
import type { VisualizerProps } from './types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  life: number;
}

const MAX_PARTICLES = 80;

export const ParticleField = memo(function ParticleField({ isPlaying, bpm }: VisualizerProps) {
  const { bass, overall } = useAudioAnalyzer(isPlaying);
  const [hasEverPlayed, setHasEverPlayed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const audioRef = useRef({ bass: 0, overall: 0, bpm: 78 });

  audioRef.current = { bass, overall, bpm };

  useEffect(() => {
    if (isPlaying) setHasEverPlayed(true);
  }, [isPlaying]);

  const spawnParticle = useCallback((w: number, h: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.7;
    return {
      x: w * 0.3 + Math.random() * w * 0.4,
      y: h * 0.5 + Math.random() * h * 0.3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      size: 2 + Math.random() * 3,
      hue: 255 + Math.random() * 40,
      life: 1,
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      rafId = requestAnimationFrame(loop);

      const w = canvas.width;
      const h = canvas.height;
      const { bass: b, overall: o, bpm: audioBpm } = audioRef.current;
      const bpmMult = Math.max(0.5, audioBpm / 80);

      ctx.clearRect(0, 0, w, h);

      // Spawn new particles based on audio intensity
      const spawnRate = Math.floor(1 + b * 3 + o * 2);
      if (particlesRef.current.length < MAX_PARTICLES) {
        for (let i = 0; i < spawnRate; i++) {
          particlesRef.current.push(spawnParticle(w, h));
        }
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.life -= 0.005 + o * 0.005;
        if (p.life <= 0) return false;

        p.vy -= 0.02 * bpmMult;
        p.vx += (Math.random() - 0.5) * 0.1;
        p.x += p.vx * bpmMult;
        p.y += p.vy * bpmMult;

        // Bass pulses expand particles
        const sizeBoost = b > 0.5 ? (b - 0.5) * 4 : 0;
        const drawSize = p.size + sizeBoost;
        const alpha = p.life * 0.7;

        ctx.beginPath();
        ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${alpha})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, drawSize * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${alpha * 0.15})`;
        ctx.fill();

        return true;
      });
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [isPlaying, spawnParticle]);

  return (
    <AnimatePresence>
      {hasEverPlayed && (
        <motion.canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        />
      )}
    </AnimatePresence>
  );
});
