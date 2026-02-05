# Sample Generation Scripts

These scripts generate the lo-fi sample library using AI models running locally on your Mac.

## Requirements

- **Mac with Apple Silicon** (M1/M2/M3/M4) - Uses MPS for GPU acceleration
- **Python 3.10+**
- **16GB+ RAM** recommended (48GB is plenty)

## Setup

1. Create a virtual environment:
   ```bash
   cd scripts
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Generate Samples

Run the generation script (takes 15-30 minutes):

```bash
python generate-samples.py
```

This will:
1. Load the MusicGen 'medium' model (~3GB)
2. Generate all sample categories (drums, chords, melodies, bass, ambient, loops)
3. Save them to `public/samples/lofi/`

## Output Structure

```
public/samples/lofi/
├── drums/
│   ├── chill-01.mp3
│   ├── chill-02.mp3
│   └── groove-01.mp3
├── chords/
│   ├── jazzy-Cm-01.mp3
│   ├── dreamy-Am-01.mp3
│   └── ...
├── melodies/
│   ├── piano-Cm-01.mp3
│   └── ...
├── bass/
│   ├── mellow-Cm-01.mp3
│   └── ...
├── ambient/
│   ├── rain-01.mp3
│   ├── vinyl-01.mp3
│   └── ...
└── loops/
    ├── chill-Cm-01.mp3
    ├── dreamy-Am-01.mp3
    └── ...
```

## After Generation

1. **Listen to samples** and delete any that don't sound good
2. **Update the manifest** in `src/lib/audio/sampleLibrary/manifest.ts`
3. **Test in the app** with `npm run dev`

## Customization

Edit `generate-samples.py` to:
- Add more prompts for variety
- Change BPM ranges
- Use different model sizes ('small', 'medium', 'large')
- Adjust generation parameters

## Troubleshooting

### "MPS not available"
Make sure you're on macOS 12.3+ with Apple Silicon.

### Out of memory
Try using the 'small' model instead of 'medium'.

### Generation is slow
The 'medium' model takes ~10-15 seconds per sample on M4 Pro.
'small' is faster but lower quality.
