'use client';

import { memo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { overlayAnimation, modalAnimation, sheetAnimation } from '@/lib/animations';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** 'modal' for centered dialog, 'sheet' for bottom sheet */
  variant?: 'modal' | 'sheet';
  /** Max width for modal variant */
  maxWidth?: string;
  /** Max height */
  maxHeight?: string;
  /** Whether clicking backdrop closes the modal */
  closeOnBackdrop?: boolean;
  /** Custom className for the content container */
  className?: string;
}

export const Modal = memo(function Modal({
  isOpen,
  onClose,
  children,
  variant = 'modal',
  maxWidth = 'max-w-md',
  maxHeight = '80vh',
  closeOnBackdrop = true,
  className = '',
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdrop) {
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            {...overlayAnimation}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={handleBackdropClick}
          />

          {variant === 'modal' ? (
            /* Centered Modal */
            <motion.div
              {...overlayAnimation}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={handleBackdropClick}
            >
              <motion.div
                {...modalAnimation}
                className={`glass rounded-2xl w-full ${maxWidth} overflow-hidden ${className}`}
                onClick={handleContentClick}
              >
                <div
                  className="overflow-y-auto p-6"
                  style={{ maxHeight }}
                >
                  {children}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            /* Bottom Sheet */
            <motion.div
              {...sheetAnimation}
              className={`fixed bottom-0 left-0 right-0 z-50 glass rounded-t-3xl safe-area-bottom ${className}`}
              style={{ maxHeight }}
              onClick={handleContentClick}
              onTouchStart={handleTouchStart}
            >
              {/* Drag handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div
                className="overflow-y-auto overscroll-contain px-6 pb-10"
                style={{
                  maxHeight: `calc(${maxHeight} - 40px)`,
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                }}
                onTouchMove={(e) => e.stopPropagation()}
              >
                {children}
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
});

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
