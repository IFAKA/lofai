'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { GlassButton } from '../ui';
import { spinnerRotation } from '@/lib/animations';

interface GenerateButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const GenerateButton = memo(function GenerateButton({ onClick, disabled }: GenerateButtonProps) {
  return (
    <GlassButton
      variant="default"
      size="lg-responsive"
      onClick={onClick}
      disabled={disabled}
      aria-label="Generate new song"
    >
      {disabled ? (
        <motion.div {...spinnerRotation}>
          <RefreshCw className="w-6 h-6 text-text-muted" />
        </motion.div>
      ) : (
        <RefreshCw className="w-6 h-6 text-text-bright" />
      )}
    </GlassButton>
  );
});
