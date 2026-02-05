import { createDefaultArmState } from './types';
import { saveArmState } from './storage';

export type TempoPreference = 'slower' | 'faster';
export type EnergyPreference = 'chill' | 'energetic';

export interface OnboardingPreferences {
  tempo: TempoPreference;
  energy: EnergyPreference;
}

const BOOST_AMOUNT = 3;

export async function applyWarmStart(prefs: OnboardingPreferences): Promise<void> {
  const state = createDefaultArmState();

  // Apply tempo preference
  if (prefs.tempo === 'slower') {
    state.tempo['focus'].alpha += BOOST_AMOUNT;
    state.tempo['60-70'].alpha += BOOST_AMOUNT - 1;
  } else {
    state.tempo['90-100'].alpha += BOOST_AMOUNT;
    state.tempo['80-90'].alpha += BOOST_AMOUNT - 1;
  }

  // Apply energy preference
  if (prefs.energy === 'chill') {
    state.energy.low.alpha += BOOST_AMOUNT;
    state.danceability.chill.alpha += BOOST_AMOUNT;
  } else {
    state.energy.high.alpha += BOOST_AMOUNT;
    state.danceability.groovy.alpha += BOOST_AMOUNT - 1;
    state.danceability.bouncy.alpha += BOOST_AMOUNT - 1;
  }

  await saveArmState(state);
}
