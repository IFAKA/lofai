"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Headphones,
  Sliders,
  CheckCircle,
  ArrowRight,
  Play,
} from "lucide-react";
import { FullscreenOverlay } from "../ui";
import { slideInRight } from "@/lib/animations";
import type {
  OnboardingPreferences,
  TempoPreference,
  EnergyPreference,
} from "@/lib/preferences/warmStart";

interface OnboardingProps {
  isOpen: boolean;
  onComplete: (preferences: OnboardingPreferences) => void;
}

interface PreferenceButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function PreferenceButton({ label, selected, onClick }: PreferenceButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 py-3 px-4 rounded-xl transition-all text-sm font-medium
        ${
          selected
            ? "bg-accent text-white"
            : "glass text-text-muted hover:text-text hover:bg-white/10"
        }
      `}
    >
      {label}
    </button>
  );
}

interface PreferenceRowProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
}

function PreferenceRow({
  label,
  options,
  selected,
  onChange,
}: PreferenceRowProps) {
  return (
    <div className="w-full">
      <div className="text-text-muted text-xs mb-2 text-left">{label}</div>
      <div className="flex gap-3">
        {options.map((option) => (
          <PreferenceButton
            key={option.value}
            label={option.label}
            selected={selected === option.value}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

export function Onboarding({ isOpen, onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [tempo, setTempo] = useState<TempoPreference>("slower");
  const [energy, setEnergy] = useState<EnergyPreference>("chill");

  const totalSlides = 3;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete({ tempo, energy });
    }
  };

  const handleSkip = () => {
    onComplete({ tempo, energy });
  };

  const renderSlideContent = () => {
    switch (currentSlide) {
      case 0:
        return (
          <motion.div
            key="slide-0"
            {...slideInRight}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="mb-8 p-6 rounded-full glass">
              <Headphones size={48} className="text-accent" />
            </div>
            <h2 className="text-text-bright text-2xl font-medium mb-5">
              Focus music for your brain
            </h2>
            <p className="text-text leading-relaxed text-base">
              Generative lofi that adapts to help you concentrate. No playlists,
              no decisions.
            </p>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="slide-1"
            {...slideInRight}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="mb-8 p-6 rounded-full glass">
              <Sliders size={48} className="text-accent" />
            </div>
            <h2 className="text-text-bright text-2xl font-medium mb-5">
              Quick setup
            </h2>
            <p className="text-text leading-relaxed text-base mb-8">
              Two choices so your first song fits you.
            </p>
            <div
              className="w-full flex flex-col gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <PreferenceRow
                label="Tempo"
                options={[
                  { value: "slower", label: "Slower" },
                  { value: "faster", label: "Faster" },
                ]}
                selected={tempo}
                onChange={(v) => setTempo(v as TempoPreference)}
              />
              <PreferenceRow
                label="Energy"
                options={[
                  { value: "chill", label: "Chill" },
                  { value: "energetic", label: "Energetic" },
                ]}
                selected={energy}
                onChange={(v) => setEnergy(v as EnergyPreference)}
              />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="slide-2"
            {...slideInRight}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="mb-8 p-6 rounded-full glass">
              <CheckCircle size={48} className="text-accent" />
            </div>
            <h2 className="text-text-bright text-2xl font-medium mb-5">
              You're ready
            </h2>
            <p className="text-text leading-relaxed text-base">
              Swipe or tap buttons to skip and like songs. Find the focus timer
              and background noise in Settings.
            </p>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <FullscreenOverlay isOpen={isOpen} className="p-8">
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 text-text-muted text-sm hover:text-text transition-colors safe-area-top"
      >
        Skip
      </button>

      {/* Content wrapper */}
      <div className="flex flex-col items-center h-full w-full">
        {/* Slide content - centered in available space */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[340px]">
          <AnimatePresence mode="wait">{renderSlideContent()}</AnimatePresence>
        </div>

        {/* Bottom navigation - anchored at bottom */}
        <div className="flex flex-col items-center gap-6 pb-6 safe-area-bottom">
          {/* Progress dots */}
          <div className="flex gap-3">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 md:w-2 md:h-2 rounded-full transition-colors ${
                  index === currentSlide ? "bg-accent" : "bg-white/20"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={handleNext}
            className="w-14 h-14 md:w-12 md:h-12 rounded-full bg-accent hover:bg-accent/90 active:scale-95 transition-all flex items-center justify-center"
            aria-label={
              currentSlide < totalSlides - 1 ? "Next" : "Start Focusing"
            }
          >
            {currentSlide < totalSlides - 1 ? (
              <ArrowRight size={24} className="text-white" />
            ) : (
              <Play size={24} className="text-white ml-1" />
            )}
          </button>
        </div>
      </div>
    </FullscreenOverlay>
  );
}
