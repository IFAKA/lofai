const MODEL_URLS = {
  improv_rnn: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv',
  melody_rnn: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/melody_rnn',
} as const;

export type ModelType = keyof typeof MODEL_URLS;

export function getModelUrl(modelType: ModelType): string {
  return MODEL_URLS[modelType];
}
