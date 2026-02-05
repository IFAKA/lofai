/**
 * Sample Library Module
 *
 * This module provides sample-based music generation as a replacement
 * for ML-based real-time generation. Samples are pre-generated using
 * AI tools (AudioCraft, MusicGen) and mixed at runtime for variety.
 */

export * from './types';
export * from './manifest';
export { SampleMixer, sampleMixer } from './mixer';
