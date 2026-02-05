'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

interface GlassButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'default' | 'primary' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'lg-responsive' | 'xl-responsive' | '2xl-responsive';
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    { className = '', variant = 'default', size = 'md', children, ...props },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-8 w-8 text-sm',
      md: 'h-12 w-12 text-base',
      lg: 'h-16 w-16 text-lg',
      xl: 'h-20 w-20 text-xl',
      '2xl': 'h-24 w-24 text-2xl',
      // Responsive variants: mobile-first, scales up at md breakpoint
      'lg-responsive': 'h-16 w-16 md:h-20 md:w-20 text-lg md:text-xl [&_svg]:w-5 [&_svg]:h-5 md:[&_svg]:w-7 md:[&_svg]:h-7',
      'xl-responsive': 'h-20 w-20 md:h-24 md:w-24 text-xl md:text-2xl [&_svg]:w-6 [&_svg]:h-6 md:[&_svg]:w-8 md:[&_svg]:h-8',
      '2xl-responsive': 'h-24 w-24 md:h-28 md:w-28 text-2xl [&_svg]:w-6 [&_svg]:h-6 md:[&_svg]:w-8 md:[&_svg]:h-8',
    };

    const variantClasses = {
      default: 'glass hover:bg-white/10',
      primary: 'bg-accent/20 hover:bg-accent/30 border-accent/30',
      icon: 'glass hover:bg-white/10',
    };

    return (
      <motion.button
        ref={ref}
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          rounded-full
          flex items-center justify-center
          text-text-bright
          transition-colors duration-200
          border border-white/5
          backdrop-blur-lg
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
