#!/usr/bin/env python3
"""
Lo-Fi Sample Generator using ACE-Step 1.5

ACE-Step 1.5 is the most powerful local music generation model (2025-2026).
- Generates up to 10 minutes of audio
- Less than 4GB VRAM required
- Faster than AudioCraft/MusicGen
- Quality between Suno v4.5 and v5

Requirements:
    1. Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh
    2. Clone ACE-Step: git clone https://github.com/ACE-Step/ACE-Step-1.5.git
    3. Run this script from inside the ACE-Step folder

Usage:
    cd ACE-Step-1.5
    uv run python ../seedtone/scripts/generate-samples.py

Your Mac M4 Pro with 48GB RAM will run this easily.
"""

import os
import sys
from pathlib import Path

# Try to import ACE-Step
try:
    from acestep import ACEStepPipeline
    HAS_ACESTEP = True
except ImportError:
    HAS_ACESTEP = False
    print("ACE-Step not found. Please run this from inside ACE-Step-1.5 folder")
    print("Or use the Gradio UI: cd ACE-Step-1.5 && uv run acestep")

# Output directory - adjust if running from different location
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "samples" / "lofi"

# ============================================================================
# SAMPLE DEFINITIONS - Prompts optimized for ACE-Step
# ============================================================================

# ACE-Step uses a different prompt format - more like song descriptions
LOFI_SAMPLES = {
    "drums": [
        {
            "id": "chill-01",
            "prompt": """[verse]
Dusty boom-bap drum loop, vinyl crackle texture
Mellow kick on 1 and 3, snare on 2 and 4
Lo-fi hip hop beat, relaxed swing feel
80 BPM, instrumental only, no vocals""",
            "duration": 8,
            "tags": "lofi, drums, boom-bap, dusty, vinyl",
        },
        {
            "id": "chill-02",
            "prompt": """[verse]
Soft brushed drums, minimal lo-fi beat
Gentle kick, quiet snare, subtle hi-hats
Jazz-influenced percussion, dreamy atmosphere
80 BPM, instrumental, ambient texture""",
            "duration": 8,
            "tags": "lofi, drums, soft, brushes, minimal",
        },
        {
            "id": "groove-01",
            "prompt": """[verse]
Punchy lo-fi drums with swing groove
Crisp hi-hats, solid kick and snare
Groovy hip hop beat, vinyl warmth
85 BPM, instrumental, head-nodding rhythm""",
            "duration": 8,
            "tags": "lofi, drums, groovy, punchy, swing",
        },
        {
            "id": "dreamy-01",
            "prompt": """[verse]
Distant reverbed drums, ethereal lo-fi beat
Soft kick, pillowy snare, atmospheric
Dream-like percussion, spacey texture
75 BPM, instrumental, ambient drums""",
            "duration": 8,
            "tags": "lofi, drums, dreamy, reverb, atmospheric",
        },
    ],
    "chords": [
        {
            "id": "jazzy-Cm-01",
            "prompt": """[verse]
Warm Rhodes electric piano chords
C minor to F minor jazz progression
7th chords, mellow voicings, nostalgic feel
Lo-fi aesthetic, vinyl warmth
80 BPM, instrumental, smooth jazz keys""",
            "duration": 16,
            "tags": "lofi, chords, rhodes, jazz, Cm",
        },
        {
            "id": "jazzy-Fm-01",
            "prompt": """[verse]
Smooth jazz piano chord progression
F minor key, gentle voicings
Warm piano tone, lo-fi texture
Relaxed tempo, mellow atmosphere
80 BPM, instrumental, chill keys""",
            "duration": 16,
            "tags": "lofi, chords, piano, jazz, Fm",
        },
        {
            "id": "dreamy-Am-01",
            "prompt": """[verse]
Ethereal pad chords, A minor key
Ambient synthesizer, reverb wash
Dreamy atmosphere, floating harmony
Spacey lo-fi texture, gentle
75 BPM, instrumental, atmospheric pads""",
            "duration": 16,
            "tags": "lofi, chords, pad, dreamy, Am",
        },
        {
            "id": "uplifting-C-01",
            "prompt": """[verse]
Bright piano chords, C major key
Hopeful progression, warm acoustic piano
Jazzy voicings, uplifting feel
Positive energy, lo-fi warmth
85 BPM, instrumental, sunny keys""",
            "duration": 16,
            "tags": "lofi, chords, piano, uplifting, C",
        },
        {
            "id": "melancholic-Dm-01",
            "prompt": """[verse]
Sad piano chord progression, D minor
Emotional, nostalgic, melancholic feel
Gentle touch, expressive dynamics
Lo-fi warmth, bittersweet harmony
78 BPM, instrumental, emotional keys""",
            "duration": 16,
            "tags": "lofi, chords, piano, sad, Dm",
        },
    ],
    "melodies": [
        {
            "id": "piano-Cm-01",
            "prompt": """[verse]
Simple piano melody, C minor key
Sparse notes, emotional phrasing
Melancholic feel, gentle touch
Lo-fi aesthetic, warm tone
80 BPM, instrumental, solo piano melody""",
            "duration": 16,
            "tags": "lofi, melody, piano, Cm, sparse",
        },
        {
            "id": "piano-Am-01",
            "prompt": """[verse]
Dreamy piano melody, A minor key
Floating notes, gentle phrasing
Soft touch, ethereal feel
Lo-fi texture, peaceful atmosphere
75 BPM, instrumental, ambient piano""",
            "duration": 16,
            "tags": "lofi, melody, piano, Am, dreamy",
        },
        {
            "id": "flute-C-01",
            "prompt": """[verse]
Soft flute melody, C major key
Airy and light, organic feel
Gentle phrasing, peaceful vibes
Lo-fi warmth, natural tone
85 BPM, instrumental, acoustic flute""",
            "duration": 8,
            "tags": "lofi, melody, flute, C, airy",
        },
        {
            "id": "guitar-Dm-01",
            "prompt": """[verse]
Gentle acoustic guitar melody, D minor
Fingerpicked notes, warm tone
Nostalgic feel, emotional phrasing
Lo-fi aesthetic, intimate
78 BPM, instrumental, solo guitar""",
            "duration": 16,
            "tags": "lofi, melody, guitar, Dm, fingerpicked",
        },
        {
            "id": "synth-Fm-01",
            "prompt": """[verse]
Warm analog synth melody, F minor
Soft lead sound, gentle vibrato
Lo-fi texture, vintage feel
Mellow phrasing, chill vibes
80 BPM, instrumental, retro synth""",
            "duration": 16,
            "tags": "lofi, melody, synth, Fm, analog",
        },
    ],
    "bass": [
        {
            "id": "mellow-Cm-01",
            "prompt": """[verse]
Mellow bass line, C minor key
Warm sub bass, simple pattern
Lo-fi hip hop style, deep tone
Supportive groove, steady rhythm
80 BPM, instrumental, sub bass""",
            "duration": 16,
            "tags": "lofi, bass, sub, Cm, mellow",
        },
        {
            "id": "groovy-C-01",
            "prompt": """[verse]
Groovy bass line, C major key
Funky pattern, walking feel
Active movement, upbeat energy
Lo-fi warmth, rhythmic drive
85 BPM, instrumental, funky bass""",
            "duration": 8,
            "tags": "lofi, bass, groovy, C, funky",
        },
        {
            "id": "deep-Am-01",
            "prompt": """[verse]
Deep bass, A minor key
Slow movement, sub frequencies
Atmospheric, ambient feel
Lo-fi texture, minimal pattern
75 BPM, instrumental, deep sub""",
            "duration": 16,
            "tags": "lofi, bass, deep, Am, atmospheric",
        },
    ],
    "ambient": [
        {
            "id": "rain-01",
            "prompt": """[ambient]
Gentle rain sounds, light rainfall
Cozy atmosphere, peaceful
Raindrops on window, no thunder
Calming nature sounds, continuous""",
            "duration": 30,
            "tags": "ambient, rain, nature, cozy",
        },
        {
            "id": "vinyl-01",
            "prompt": """[ambient]
Vinyl record crackle and pop
Warm analog noise texture
Nostalgic record player sound
Continuous lo-fi atmosphere""",
            "duration": 30,
            "tags": "ambient, vinyl, crackle, nostalgic",
        },
        {
            "id": "cafe-01",
            "prompt": """[ambient]
Coffee shop ambience background
Soft chatter, cups clinking gently
Cozy cafe atmosphere, muffled
Urban background, peaceful""",
            "duration": 30,
            "tags": "ambient, cafe, chatter, cozy",
        },
        {
            "id": "night-01",
            "prompt": """[ambient]
Night city ambience, distant traffic
Quiet urban night sounds
Peaceful background atmosphere
City at night, calm""",
            "duration": 30,
            "tags": "ambient, night, city, urban",
        },
    ],
    "loops": [
        {
            "id": "chill-Cm-01",
            "prompt": """[verse]
Complete lo-fi hip hop beat, C minor key
Dusty drums, jazzy piano chords
Mellow bass line, vinyl texture
Chill vibes, relaxed atmosphere
80 BPM, instrumental, full beat""",
            "duration": 16,
            "tags": "lofi, loop, complete, Cm, chill",
        },
        {
            "id": "dreamy-Am-01",
            "prompt": """[verse]
Dreamy lo-fi track, A minor key
Soft drums, ethereal pads
Gentle piano melody, spacey
Relaxing atmosphere, ambient
75 BPM, instrumental, dreamy beat""",
            "duration": 16,
            "tags": "lofi, loop, complete, Am, dreamy",
        },
        {
            "id": "uplifting-C-01",
            "prompt": """[verse]
Uplifting lo-fi beat, C major key
Positive vibes, warm piano
Groovy drums, hopeful melody
Sunny atmosphere, bright energy
85 BPM, instrumental, happy beat""",
            "duration": 16,
            "tags": "lofi, loop, complete, C, uplifting",
        },
        {
            "id": "melancholic-Dm-01",
            "prompt": """[verse]
Melancholic lo-fi beat, D minor key
Sad piano, emotional chords
Dusty drums, nostalgic feel
Bittersweet atmosphere, reflective
78 BPM, instrumental, sad beat""",
            "duration": 16,
            "tags": "lofi, loop, complete, Dm, melancholic",
        },
        {
            "id": "jazzy-Fm-01",
            "prompt": """[verse]
Jazzy lo-fi beat, F minor key
Smooth Rhodes, walking bass feel
Brushed drums, late night vibes
Cool atmosphere, sophisticated
80 BPM, instrumental, jazz beat""",
            "duration": 16,
            "tags": "lofi, loop, complete, Fm, jazzy",
        },
    ],
}


def setup_directories():
    """Create output directories"""
    for category in LOFI_SAMPLES.keys():
        (OUTPUT_DIR / category).mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR}")


def print_manual_instructions():
    """Print instructions for manual generation using ACE-Step Gradio UI"""
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                         LO-FI SAMPLE GENERATION                               ║
║                           Using ACE-Step 1.5                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

ACE-Step 1.5 is the best local music generation model available (2025-2026).
Quality is between Suno v4.5 and v5, and it runs locally on your Mac!

SETUP INSTRUCTIONS:
═══════════════════

1. Install uv (if not already):
   curl -LsSf https://astral.sh/uv/install.sh | sh

2. Clone ACE-Step 1.5:
   cd /Users/iskaypet/code/no-work/web
   git clone https://github.com/ACE-Step/ACE-Step-1.5.git
   cd ACE-Step-1.5

3. Launch the Gradio UI:
   uv run acestep

4. Open http://localhost:7860 in your browser

5. Use the prompts below to generate each sample, then save to:
   public/samples/lofi/

═══════════════════════════════════════════════════════════════════════════════
SAMPLE PROMPTS TO GENERATE:
═══════════════════════════════════════════════════════════════════════════════
""")

    total = 0
    for category, samples in LOFI_SAMPLES.items():
        print(f"\n{'='*60}")
        print(f"  {category.upper()} ({len(samples)} samples)")
        print(f"  Save to: public/samples/lofi/{category}/")
        print(f"{'='*60}")

        for sample in samples:
            total += 1
            print(f"\n--- {sample['id']}.wav ({sample['duration']}s) ---")
            print(f"Tags: {sample['tags']}")
            print(f"Prompt:\n{sample['prompt']}")

    print(f"""
═══════════════════════════════════════════════════════════════════════════════
TOTAL: {total} samples to generate

TIPS FOR ACE-STEP UI:
- Set duration to match the seconds shown above
- Use "instrumental" tag to avoid vocals
- Save as WAV for best quality
- After generating, move files to the correct folders

ALTERNATIVE - Use Suno.ai:
If ACE-Step doesn't work well, you can use https://suno.ai (free tier: 50 songs/day)
Use the same prompts above - Suno understands them well.
═══════════════════════════════════════════════════════════════════════════════
""")


def generate_with_acestep():
    """Generate samples using ACE-Step programmatically"""
    if not HAS_ACESTEP:
        print("ACE-Step not available. Using manual instructions instead.")
        print_manual_instructions()
        return

    print("Loading ACE-Step 1.5 model...")
    pipeline = ACEStepPipeline()

    setup_directories()

    total = 0
    for category, samples in LOFI_SAMPLES.items():
        print(f"\n=== Generating {category.upper()} ===")

        for sample in samples:
            output_path = OUTPUT_DIR / category / f"{sample['id']}.wav"
            print(f"  Generating: {sample['id']} ({sample['duration']}s)")

            try:
                audio = pipeline.generate(
                    prompt=sample['prompt'],
                    duration=sample['duration'],
                    tags=sample['tags'],
                )

                # Save audio
                import torchaudio
                torchaudio.save(str(output_path), audio, 44100)
                print(f"  ✓ Saved: {output_path.name}")
                total += 1

            except Exception as e:
                print(f"  ✗ Error: {e}")

    print(f"\n{'='*60}")
    print(f"Generated {total} samples")
    print(f"Location: {OUTPUT_DIR}")


def main():
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                         LO-FI SAMPLE GENERATOR                                ║
║                                                                               ║
║  Recommended: ACE-Step 1.5 (best quality, runs locally)                      ║
║  Alternative: AudioCraft/MusicGen, Suno.ai                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
""")

    if HAS_ACESTEP:
        generate_with_acestep()
    else:
        # Print manual instructions with all the prompts
        print_manual_instructions()
        setup_directories()


if __name__ == "__main__":
    main()
