import * as Tone from 'tone';

export interface FrequencyBands {
  bass: number;
  mids: number;
  highs: number;
  overall: number;
}

class AudioAnalyzer {
  private analyser: Tone.Analyser | null = null;
  private animationFrame: number | null = null;
  private listeners: Set<(bands: FrequencyBands) => void> = new Set();
  private currentBands: FrequencyBands = { bass: 0, mids: 0, highs: 0, overall: 0 };
  private lastUpdateTime = 0;

  private smoothing = 0.25;

  private throttleInterval = 0;

  initialize(): void {
    if (this.analyser) return;

    this.analyser = new Tone.Analyser('fft', 256);

    Tone.getDestination().connect(this.analyser);
  }

  setThrottleInterval(ms: number): void {
    this.throttleInterval = ms;
  }

  start(): void {
    if (!this.analyser) {
      this.initialize();
    }

    if (this.animationFrame) return;

    const analyze = (currentTime: number) => {
      this.animationFrame = requestAnimationFrame(analyze);

      if (!this.analyser || this.listeners.size === 0) {
        return;
      }

      if (this.throttleInterval > 0 && currentTime - this.lastUpdateTime < this.throttleInterval) {
        return;
      }
      this.lastUpdateTime = currentTime;

      const fftData = this.analyser.getValue() as Float32Array;
      const bands = this.extractBands(fftData);

      this.currentBands = {
        bass: this.smooth(this.currentBands.bass, bands.bass),
        mids: this.smooth(this.currentBands.mids, bands.mids),
        highs: this.smooth(this.currentBands.highs, bands.highs),
        overall: this.smooth(this.currentBands.overall, bands.overall),
      };

      this.listeners.forEach(listener => listener(this.currentBands));
    };

    this.animationFrame = requestAnimationFrame(analyze);
  }

  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private smooth(current: number, target: number): number {
    return current * this.smoothing + target * (1 - this.smoothing);
  }

  private extractBands(fftData: Float32Array): FrequencyBands {
    const binCount = fftData.length;

    const bassEnd = Math.floor(binCount * 0.02);
    const midsEnd = Math.floor(binCount * 0.15);
    const highsEnd = Math.floor(binCount * 0.5);

    let bassSum = 0;
    let midsSum = 0;
    let highsSum = 0;
    let totalSum = 0;

    for (let i = 0; i < binCount; i++) {
      const value = Math.max(0, (fftData[i] + 100) / 100);

      if (i < bassEnd) {
        bassSum += value;
      } else if (i < midsEnd) {
        midsSum += value;
      } else if (i < highsEnd) {
        highsSum += value;
      }
      totalSum += value;
    }

    const bass = bassEnd > 0 ? bassSum / bassEnd : 0;
    const mids = (midsEnd - bassEnd) > 0 ? midsSum / (midsEnd - bassEnd) : 0;
    const highs = (highsEnd - midsEnd) > 0 ? highsSum / (highsEnd - midsEnd) : 0;
    const overall = binCount > 0 ? totalSum / binCount : 0;

    return {
      bass: Math.min(1, bass * 3.5),
      mids: Math.min(1, mids * 2.8),
      highs: Math.min(1, highs * 3.2),
      overall: Math.min(1, overall * 2.5),
    };
  }

  subscribe(listener: (bands: FrequencyBands) => void): () => void {
    this.listeners.add(listener);

    if (this.listeners.size === 1) {
      this.start();
    }

    return () => {
      this.listeners.delete(listener);

      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  getBands(): FrequencyBands {
    return { ...this.currentBands };
  }

  dispose(): void {
    this.stop();
    if (this.analyser) {
      this.analyser.dispose();
      this.analyser = null;
    }
    this.listeners.clear();
  }
}

export const audioAnalyzer = new AudioAnalyzer();
