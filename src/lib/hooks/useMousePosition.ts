'use client';

import { useEffect, useRef } from 'react';

interface MouseState {
  x: number;
  y: number;
  active: boolean;
}

export function useMousePosition() {
  const state = useRef<MouseState>({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const onMove = (e: MouseEvent) => {
      state.current.x = e.clientX;
      state.current.y = e.clientY;
      state.current.active = true;
      clearTimeout(timeout);
      timeout = setTimeout(() => { state.current.active = false; }, 150);
    };

    const onLeave = () => {
      state.current.active = false;
      state.current.x = -9999;
      state.current.y = -9999;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      clearTimeout(timeout);
    };
  }, []);

  return state;
}
