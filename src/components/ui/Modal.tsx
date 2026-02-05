'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FullscreenOverlayProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FullscreenOverlay = memo(function FullscreenOverlay({
  isOpen,
  children,
  className = '',
}: FullscreenOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 bg-bg flex flex-col items-center justify-center ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
});
