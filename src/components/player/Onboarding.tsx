'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Music, Hand, CheckCircle, ChevronRight, Check, type LucideIcon } from 'lucide-react';
import { GlassButton, FullscreenOverlay } from '../ui';
import { slideInRight } from '@/lib/animations';

interface OnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
}

interface Slide {
  title: string;
  description: string;
  icon: LucideIcon;
}

const slides: Slide[] = [
  {
    title: 'Welcome to LofAI',
    description: 'AI-generated lofi music that learns your taste. No playlists, no searching — just press play.',
    icon: Music,
  },
  {
    title: 'Gestures',
    description: 'Tap anywhere to show/hide controls. Swipe right to skip. Swipe left to like. Swipe up for settings.',
    icon: Hand,
  },
  {
    title: 'It Learns',
    description: 'The more you listen, the better it gets. Skip songs you don\'t like. It takes about 30 songs to personalize.',
    icon: CheckCircle,
  },
];

export function Onboarding({ isOpen, onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <FullscreenOverlay isOpen={isOpen} className="p-8">
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 text-text-muted text-sm hover:text-text transition-colors safe-area-top"
      >
        Skip
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          {...slideInRight}
          className="flex flex-col items-center text-center max-w-sm"
        >
          <div className="mb-8 p-6 rounded-full glass">
            <CurrentIcon size={48} className="text-accent" />
          </div>
          <h2 className="text-text-bright text-2xl font-medium mb-5">
            {slides[currentSlide].title}
          </h2>
          <p className="text-text leading-relaxed text-base">
            {slides[currentSlide].description}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 mt-12">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentSlide ? 'bg-accent' : 'bg-white/20'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="mt-8">
        <GlassButton variant="primary" size="lg" onClick={handleNext}>
          {currentSlide < slides.length - 1 ? (
            <ChevronRight size={24} />
          ) : (
            <Check size={24} />
          )}
        </GlassButton>
      </div>
    </FullscreenOverlay>
  );
}
