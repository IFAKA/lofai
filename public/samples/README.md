# Audio Samples Directory

This directory contains audio samples for LofAI's sampled instruments.

## Directory Structure

```
samples/
├── piano/
│   ├── soft/     # Velocity layer 1 (soft, v < 0.4)
│   │   └── c3.mp3, eb3.mp3, gb3.mp3, a3.mp3, c4.mp3, eb4.mp3, gb4.mp3, a4.mp3, c5.mp3
│   ├── medium/   # Velocity layer 2 (medium, 0.4 ≤ v < 0.7)
│   │   └── (same 9 notes)
│   └── hard/     # Velocity layer 3 (hard, v ≥ 0.7)
│       └── (same 9 notes)
└── drums/
    ├── kick-1.mp3, kick-2.mp3, kick-3.mp3
    ├── snare-1.mp3, snare-2.mp3, snare-3.mp3
    └── hihat-1.mp3, hihat-2.mp3, hihat-3.mp3
```

## Sample Sources (CC0/CC-BY Royalty-Free)

### Piano Samples (~1.5MB total)
- **University of Iowa Electronic Music Studios Piano Samples** (public domain)
- **Salamander Grand Piano SF2** (CC-BY) - warm, slightly muffled
- Processing: Lowpass (6kHz) + saturation for lofi warmth

### Drum Samples (~500KB total)
- **Clark Audio Free Boom Bap Drum Kit** - 100% royalty-free
- **Apollo Sound LoFi Boombap Drums FREE** - warm lofi character
- **Freesound.org CC0 tagged drums**

## Sample Processing Pipeline

Before adding to project:
1. Normalize all samples to -3dB peak
2. Convert to mp3 (192kbps for instruments)
3. Trim silence from start/end
4. For piano: apply subtle lowpass (6kHz) + saturation for warmth
5. Test all in Tone.js before committing

## Cache Strategy

All samples are cached by the service worker using CacheFirst strategy for offline functionality.
