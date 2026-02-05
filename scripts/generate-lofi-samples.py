#!/usr/bin/env python3
"""
Lo-Fi Sample Generator using ACE-Step 1.5 Programmatic API

This script generates all lofi samples for the lofai web app using ACE-Step's
Python API instead of the Gradio UI.

Usage:
    cd /Users/iskaypet/code/no-work/web/ACE-Step-1.5
    uv run python ../lofai/scripts/generate-lofi-samples.py

Requirements:
    - ACE-Step 1.5 installed and checkpoints downloaded
    - Run from inside ACE-Step-1.5 directory
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Any

# Add ACE-Step to path
ACE_STEP_DIR = Path("/Users/iskaypet/code/no-work/web/ACE-Step-1.5")
sys.path.insert(0, str(ACE_STEP_DIR))

# Output directory for samples
OUTPUT_DIR = Path("/Users/iskaypet/code/no-work/web/lofai/public/samples/lofi")

# ============================================================================
# SAMPLE DEFINITIONS - Optimized for ACE-Step text2music
# ============================================================================

LOFI_SAMPLES: Dict[str, List[Dict[str, Any]]] = {
    "drums": [
        {
            "id": "chill-01",
            "caption": "Dusty boom-bap drum loop with vinyl crackle texture. Mellow kick on 1 and 3, snare on 2 and 4. Lo-fi hip hop beat with relaxed swing feel. Instrumental only, no vocals.",
            "lyrics": "[Instrumental]",
            "duration": 8,
            "bpm": 80,
        },
        {
            "id": "chill-02",
            "caption": "Soft brushed drums, minimal lo-fi beat. Gentle kick, quiet snare, subtle hi-hats. Jazz-influenced percussion with dreamy atmosphere. Instrumental, ambient texture.",
            "lyrics": "[Instrumental]",
            "duration": 8,
            "bpm": 80,
        },
        {
            "id": "groove-01",
            "caption": "Punchy lo-fi drums with swing groove. Crisp hi-hats, solid kick and snare. Groovy hip hop beat with vinyl warmth. Instrumental, head-nodding rhythm.",
            "lyrics": "[Instrumental]",
            "duration": 8,
            "bpm": 85,
        },
        {
            "id": "dreamy-01",
            "caption": "Distant reverbed drums, ethereal lo-fi beat. Soft kick, pillowy snare, atmospheric percussion. Dream-like texture with spacey ambience. Instrumental, ambient drums.",
            "lyrics": "[Instrumental]",
            "duration": 8,
            "bpm": 75,
        },
    ],
    "chords": [
        {
            "id": "jazzy-Cm-01",
            "caption": "Warm Rhodes electric piano chords. C minor to F minor jazz progression with 7th chords and mellow voicings. Nostalgic feel with lo-fi aesthetic and vinyl warmth. Smooth jazz keys, instrumental.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 80,
            "keyscale": "C Minor",
        },
        {
            "id": "jazzy-Fm-01",
            "caption": "Smooth jazz piano chord progression in F minor key with gentle voicings. Warm piano tone with lo-fi texture. Relaxed tempo, mellow atmosphere. Instrumental, chill keys.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 80,
            "keyscale": "F Minor",
        },
        {
            "id": "dreamy-Am-01",
            "caption": "Ethereal pad chords in A minor key. Ambient synthesizer with reverb wash. Dreamy atmosphere with floating harmony. Spacey lo-fi texture, gentle and peaceful. Instrumental, atmospheric pads.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 75,
            "keyscale": "A Minor",
        },
        {
            "id": "uplifting-C-01",
            "caption": "Bright piano chords in C major key. Hopeful progression with warm acoustic piano and jazzy voicings. Uplifting feel with positive energy and lo-fi warmth. Instrumental, sunny keys.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 85,
            "keyscale": "C Major",
        },
        {
            "id": "melancholic-Dm-01",
            "caption": "Sad piano chord progression in D minor. Emotional and nostalgic with melancholic feel. Gentle touch with expressive dynamics. Lo-fi warmth and bittersweet harmony. Instrumental, emotional keys.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 78,
            "keyscale": "D Minor",
        },
    ],
    "melodies": [
        {
            "id": "piano-Cm-01",
            "caption": "Simple piano melody in C minor key. Sparse notes with emotional phrasing. Melancholic feel with gentle touch. Lo-fi aesthetic with warm tone. Solo piano melody, instrumental.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 80,
            "keyscale": "C Minor",
        },
        {
            "id": "piano-Am-01",
            "caption": "Dreamy piano melody in A minor key. Floating notes with gentle phrasing. Soft touch with ethereal feel. Lo-fi texture with peaceful atmosphere. Ambient piano, instrumental.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 75,
            "keyscale": "A Minor",
        },
        {
            "id": "flute-C-01",
            "caption": "Soft flute melody in C major key. Airy and light with organic feel. Gentle phrasing with peaceful vibes. Lo-fi warmth and natural tone. Acoustic flute, instrumental.",
            "lyrics": "[Instrumental]",
            "duration": 8,
            "bpm": 85,
            "keyscale": "C Major",
        },
        {
            "id": "guitar-Dm-01",
            "caption": "Gentle acoustic guitar melody in D minor. Fingerpicked notes with warm tone. Nostalgic feel with emotional phrasing. Lo-fi aesthetic, intimate. Solo guitar, instrumental.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 78,
            "keyscale": "D Minor",
        },
        {
            "id": "synth-Fm-01",
            "caption": "Warm analog synth melody in F minor. Soft lead sound with gentle vibrato. Lo-fi texture with vintage feel. Mellow phrasing with chill vibes. Retro synth, instrumental.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 80,
            "keyscale": "F Minor",
        },
    ],
    "bass": [
        {
            "id": "mellow-Cm-01",
            "caption": "Mellow bass line in C minor key. Warm sub bass with simple pattern. Lo-fi hip hop style with deep tone. Supportive groove with steady rhythm. Sub bass, instrumental.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 80,
            "keyscale": "C Minor",
        },
        {
            "id": "groovy-C-01",
            "caption": "Groovy bass line in C major key. Funky pattern with walking feel. Active movement with upbeat energy. Lo-fi warmth with rhythmic drive. Funky bass, instrumental.",
            "lyrics": "[Instrumental]",
            "duration": 8,
            "bpm": 85,
            "keyscale": "C Major",
        },
        {
            "id": "deep-Am-01",
            "caption": "Deep bass in A minor key. Slow movement with sub frequencies. Atmospheric and ambient feel. Lo-fi texture with minimal pattern. Deep sub, instrumental.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 75,
            "keyscale": "A Minor",
        },
    ],
    "ambient": [
        {
            "id": "rain-01",
            "caption": "Gentle rain sounds, light rainfall. Cozy atmosphere, peaceful raindrops on window. No thunder, calming nature sounds. Continuous ambient texture.",
            "lyrics": "[Instrumental]",
            "duration": 30,
            "bpm": None,  # Ambient, no tempo
        },
        {
            "id": "vinyl-01",
            "caption": "Vinyl record crackle and pop. Warm analog noise texture. Nostalgic record player sound. Continuous lo-fi atmosphere, vintage feel.",
            "lyrics": "[Instrumental]",
            "duration": 30,
            "bpm": None,
        },
        {
            "id": "cafe-01",
            "caption": "Coffee shop ambience background. Soft chatter, cups clinking gently. Cozy cafe atmosphere, muffled urban background. Peaceful and relaxing.",
            "lyrics": "[Instrumental]",
            "duration": 30,
            "bpm": None,
        },
        {
            "id": "night-01",
            "caption": "Night city ambience, distant traffic. Quiet urban night sounds. Peaceful background atmosphere. City at night, calm and serene.",
            "lyrics": "[Instrumental]",
            "duration": 30,
            "bpm": None,
        },
    ],
    "loops": [
        {
            "id": "chill-Cm-01",
            "caption": "Complete lo-fi hip hop beat in C minor key. Dusty drums, jazzy piano chords, mellow bass line, vinyl texture. Chill vibes with relaxed atmosphere. Full beat, instrumental.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 80,
            "keyscale": "C Minor",
        },
        {
            "id": "dreamy-Am-01",
            "caption": "Dreamy lo-fi track in A minor key. Soft drums, ethereal pads, gentle piano melody, spacey atmosphere. Relaxing and ambient. Dreamy beat, instrumental.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 75,
            "keyscale": "A Minor",
        },
        {
            "id": "uplifting-C-01",
            "caption": "Uplifting lo-fi beat in C major key. Positive vibes, warm piano, groovy drums, hopeful melody. Sunny atmosphere with bright energy. Happy beat, instrumental.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 85,
            "keyscale": "C Major",
        },
        {
            "id": "melancholic-Dm-01",
            "caption": "Melancholic lo-fi beat in D minor key. Sad piano, emotional chords, dusty drums, nostalgic feel. Bittersweet atmosphere, reflective. Sad beat, instrumental.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 78,
            "keyscale": "D Minor",
        },
        {
            "id": "jazzy-Fm-01",
            "caption": "Jazzy lo-fi beat in F minor key. Smooth Rhodes, walking bass feel, brushed drums, late night vibes. Cool atmosphere, sophisticated. Jazz beat, instrumental.",
            "lyrics": "[Instrumental]",
            "duration": 16,
            "bpm": 80,
            "keyscale": "F Minor",
        },
    ],
}


def setup_directories():
    """Create output directories for each category"""
    for category in LOFI_SAMPLES.keys():
        (OUTPUT_DIR / category).mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR}")


def generate_samples():
    """Generate all lofi samples using ACE-Step programmatic API"""
    import torch
    from acestep.handler import AceStepHandler
    from acestep.inference import generate_music, GenerationParams, GenerationConfig

    print("=" * 70)
    print("LO-FI SAMPLE GENERATOR - ACE-Step 1.5")
    print("=" * 70)

    setup_directories()

    # Determine device
    if torch.cuda.is_available():
        device = "cuda"
        print(f"Using CUDA GPU")
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        device = "mps"
        print(f"Using Apple MPS (Metal)")
    else:
        device = "cpu"
        print(f"Using CPU (this will be slow)")

    # Initialize DiT Handler
    print("\nInitializing ACE-Step DiT model...")
    dit_handler = AceStepHandler()

    checkpoint_dir = str(ACE_STEP_DIR / "checkpoints")

    # Check available models
    available_models = dit_handler.get_available_acestep_v15_models()
    if not available_models:
        print("ERROR: No ACE-Step v15 models found!")
        print("Please run: cd ACE-Step-1.5 && uv run acestep  (to download models)")
        return

    # Prefer turbo model for faster generation
    config_path = "acestep-v15-turbo" if "acestep-v15-turbo" in available_models else available_models[0]
    print(f"Using model: {config_path}")

    status, success = dit_handler.initialize_service(
        project_root=checkpoint_dir,
        config_path=config_path,
        device=device,
        use_flash_attention=False,  # Not available on Mac
        compile_model=False,
        offload_to_cpu=False,
    )

    if not success:
        print(f"ERROR: Failed to initialize DiT model: {status}")
        return

    print(f"DiT model initialized: {status}")

    # We skip LLM initialization for now - direct generation without CoT reasoning
    # This is faster and we have explicit metadata in our prompts
    llm_handler = None

    # Generate samples
    total_samples = sum(len(samples) for samples in LOFI_SAMPLES.values())
    generated = 0
    failed = 0

    print(f"\nGenerating {total_samples} samples...")
    print("=" * 70)

    for category, samples in LOFI_SAMPLES.items():
        print(f"\n{'='*60}")
        print(f"  {category.upper()} ({len(samples)} samples)")
        print(f"{'='*60}")

        category_dir = OUTPUT_DIR / category

        for sample in samples:
            output_file = category_dir / f"{sample['id']}.wav"
            print(f"\n  Generating: {sample['id']} ({sample['duration']}s)")

            try:
                # Configure generation parameters
                params = GenerationParams(
                    task_type="text2music",
                    caption=sample["caption"],
                    lyrics=sample["lyrics"],
                    instrumental=True,
                    duration=float(sample["duration"]),
                    bpm=sample.get("bpm"),
                    keyscale=sample.get("keyscale", ""),
                    inference_steps=8,  # Turbo model uses 8 steps
                    guidance_scale=7.0,
                    seed=-1,  # Random seed
                    thinking=False,  # Disable LLM chain-of-thought
                )

                config = GenerationConfig(
                    batch_size=1,
                    use_random_seed=True,
                    audio_format="wav",
                )

                # Generate audio
                result = generate_music(
                    dit_handler=dit_handler,
                    llm_handler=llm_handler,
                    params=params,
                    config=config,
                    save_dir=str(category_dir),
                )

                if result.success and result.audios:
                    # Rename the output file to our desired name
                    generated_path = result.audios[0].get("path")
                    if generated_path and os.path.exists(generated_path):
                        # Move/rename to our target filename
                        import shutil
                        shutil.move(generated_path, str(output_file))
                        print(f"  ✓ Saved: {output_file.name}")
                        generated += 1
                    else:
                        print(f"  ✗ Audio generated but file not found")
                        failed += 1
                else:
                    print(f"  ✗ Generation failed: {result.error or result.status_message}")
                    failed += 1

            except Exception as e:
                print(f"  ✗ Error: {e}")
                import traceback
                traceback.print_exc()
                failed += 1

    # Summary
    print(f"\n{'='*70}")
    print(f"GENERATION COMPLETE")
    print(f"{'='*70}")
    print(f"  Successfully generated: {generated}/{total_samples}")
    print(f"  Failed: {failed}/{total_samples}")
    print(f"  Output directory: {OUTPUT_DIR}")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    generate_samples()
