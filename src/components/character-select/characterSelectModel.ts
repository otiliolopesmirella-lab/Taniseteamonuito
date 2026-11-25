import type { CardinalDirection, TamerMovementState } from '../../sprites/tamerRealSheets';
import type { TamerId } from '../../types/character';

export function validateTamerNameInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Digite o nome do seu Tamer antes de confirmar.';
  }
  if (trimmed.length < 3) {
    return 'O nome do Tamer deve ter pelo menos 3 caracteres.';
  }
  if (trimmed.length > 16) {
    return 'O nome do Tamer pode ter no máximo 16 caracteres.';
  }
  if (!/^[a-zA-Z0-9À-ÿ _-]+$/.test(trimmed)) {
    return 'Use apenas letras, números, espaços, _ ou -';
  }
  return null;
}

export interface CharacterSelectCardProfile {
  id: TamerId;
  displayName: string;
  code: string;
  colorName: 'Azul' | 'Vermelho' | 'Rosa' | 'Roxo';
  gender: 'Menino' | 'Menina';
  genderSymbol: '♂' | '♀';
  description: string;
  shortTrait: string;
  outfitNote: string;
  phaseOffsetSec: number;
  palette: {
    neonBorder: string;
    neonLight: string;
    neonDeep: string;
    glowRgba: string;
    softGlowRgba: string;
    cardGradient: string;
    badgeBg: string;
    nameplateBg: string;
    particleColors: readonly [string, string, string];
  };
}

export const CHARACTER_SELECT_ROSTER: readonly CharacterSelectCardProfile[] = [
  {
    id: 'kai',
    displayName: 'Kai',
    code: 'TAMER 01',
    colorName: 'Azul',
    gender: 'Menino',
    genderSymbol: '♂',
    description: 'Tamer Corajoso e Determinado',
    shortTrait: 'Corajoso',
    outfitNote: 'Cabelo castanho espetado, óculos azuis, jaqueta azul e shorts pretos',
    phaseOffsetSec: 0,
    palette: {
      neonBorder: '#00d8ff',
      neonLight: '#8ef5ff',
      neonDeep: '#0057d9',
      glowRgba: 'rgba(0, 200, 255, 0.78)',
      softGlowRgba: 'rgba(0, 148, 255, 0.34)',
      cardGradient:
        'linear-gradient(180deg, rgba(6, 56, 138, 0.92) 0%, rgba(4, 28, 78, 0.94) 58%, rgba(2, 14, 42, 0.97) 100%)',
      badgeBg: 'linear-gradient(180deg, #0b4db8 0%, #052263 100%)',
      nameplateBg: 'linear-gradient(180deg, rgba(5, 36, 98, 0.95) 0%, rgba(2, 16, 52, 0.98) 100%)',
      particleColors: ['#6ef3ff', '#00b7ff', '#ffffff'],
    },
  },
  {
    id: 'ren',
    displayName: 'Ren',
    code: 'TAMER 02',
    colorName: 'Vermelho',
    gender: 'Menino',
    genderSymbol: '♂',
    description: 'Tamer Estratégico e Inteligente',
    shortTrait: 'Estratégico',
    outfitNote: 'Cabelo preto espetado, jaqueta vermelha, calça preta e tênis vermelhos',
    phaseOffsetSec: 1.15,
    palette: {
      neonBorder: '#ff3050',
      neonLight: '#ff9cab',
      neonDeep: '#b91c1c',
      glowRgba: 'rgba(255, 48, 80, 0.78)',
      softGlowRgba: 'rgba(220, 38, 38, 0.34)',
      cardGradient:
        'linear-gradient(180deg, rgba(132, 14, 34, 0.92) 0%, rgba(72, 9, 24, 0.94) 58%, rgba(34, 4, 14, 0.97) 100%)',
      badgeBg: 'linear-gradient(180deg, #b91c1c 0%, #5c0a18 100%)',
      nameplateBg: 'linear-gradient(180deg, rgba(92, 12, 26, 0.95) 0%, rgba(42, 5, 14, 0.98) 100%)',
      particleColors: ['#ff8fa3', '#ff2e4c', '#ffd166'],
    },
  },
  {
    id: 'hina',
    displayName: 'Hina',
    code: 'TAMER 03',
    colorName: 'Rosa',
    gender: 'Menina',
    genderSymbol: '♀',
    description: 'Tamer Alegre e Persistente',
    shortTrait: 'Alegre',
    outfitNote: 'Cabelo castanho em rabo de cavalo, óculos rosa, jaqueta e saia rosa',
    phaseOffsetSec: 2.3,
    palette: {
      neonBorder: '#ff4fd8',
      neonLight: '#ffb5f0',
      neonDeep: '#be185d',
      glowRgba: 'rgba(255, 79, 216, 0.78)',
      softGlowRgba: 'rgba(219, 39, 119, 0.34)',
      cardGradient:
        'linear-gradient(180deg, rgba(136, 18, 108, 0.92) 0%, rgba(76, 10, 68, 0.94) 58%, rgba(36, 6, 38, 0.97) 100%)',
      badgeBg: 'linear-gradient(180deg, #c0268d 0%, #5e0d49 100%)',
      nameplateBg: 'linear-gradient(180deg, rgba(96, 14, 78, 0.95) 0%, rgba(46, 6, 44, 0.98) 100%)',
      particleColors: ['#ff9ee8', '#ff3ec9', '#fff0fa'],
    },
  },
  {
    id: 'yuna',
    displayName: 'Yuna',
    code: 'TAMER 04',
    colorName: 'Roxo',
    gender: 'Menina',
    genderSymbol: '♀',
    description: 'Tamer Sonhadora e Forte',
    shortTrait: 'Sonhadora',
    outfitNote: 'Cabelo longo roxo, presilha de flor, jaqueta roxa e saia escura',
    phaseOffsetSec: 3.45,
    palette: {
      neonBorder: '#b85cff',
      neonLight: '#e2b8ff',
      neonDeep: '#6d28d9',
      glowRgba: 'rgba(184, 92, 255, 0.8)',
      softGlowRgba: 'rgba(126, 34, 206, 0.36)',
      cardGradient:
        'linear-gradient(180deg, rgba(92, 24, 156, 0.92) 0%, rgba(50, 14, 92, 0.94) 58%, rgba(24, 6, 48, 0.97) 100%)',
      badgeBg: 'linear-gradient(180deg, #7e22ce 0%, #3d106b 100%)',
      nameplateBg: 'linear-gradient(180deg, rgba(66, 18, 114, 0.95) 0%, rgba(30, 8, 56, 0.98) 100%)',
      particleColors: ['#d8b4fe', '#a855f7', '#f5e1ff'],
    },
  },
] as const;

export function getCharacterProfileById(
  id: TamerId | null
): CharacterSelectCardProfile | null {
  if (!id) return null;
  return CHARACTER_SELECT_ROSTER.find((c) => c.id === id) ?? null;
}

export interface CharacterSubmissionValidation {
  valid: boolean;
  field: 'character' | 'tamerName' | null;
  errorMessage: string | null;
}

export function validateCharacterSelectionSubmission(
  selectedId: TamerId | null,
  tamerName: string
): CharacterSubmissionValidation {
  if (!selectedId) {
    return {
      valid: false,
      field: 'character',
      errorMessage: 'Selecione um dos 4 personagens antes de confirmar.',
    };
  }

  const nameError = validateTamerNameInput(tamerName);
  if (nameError) {
    return {
      valid: false,
      field: 'tamerName',
      errorMessage: nameError,
    };
  }

  return {
    valid: true,
    field: null,
    errorMessage: null,
  };
}

export interface SpriteAnimationPose {
  state: TamerMovementState;
  direction: CardinalDirection;
  fps: number;
  breathScaleY: number;
  breathScaleX: number;
  hairSwaySkew: number;
  bobOffsetY: number;
  auraIntensity: number;
}

/**
 * Pure deterministic animation pose calculator for each Tamer card.
 * - Selected character performs an energetic walk-in ready step for 1.35s on tap,
 *   or continuous walk when previewMode === 'walk', then settles into an expressive
 *   multi-frame breathing idle with subtle hair/outfit sway.
 * - Unselected characters stay subtly alive with staggered breathing and micro-posture shifts.
 */
export function computeSpriteAnimationPose(params: {
  elapsedSec: number;
  phaseOffsetSec: number;
  isSelected: boolean;
  selectionAgeSec: number;
  previewState: 'auto' | 'walk' | 'idle';
  previewDirection: CardinalDirection;
  animationsEnabled: boolean;
}): SpriteAnimationPose {
  const {
    elapsedSec,
    phaseOffsetSec,
    isSelected,
    selectionAgeSec,
    previewState,
    previewDirection,
    animationsEnabled,
  } = params;

  const direction: CardinalDirection = isSelected ? previewDirection : 'S';

  if (!animationsEnabled) {
    return {
      state: 'idle',
      direction,
      fps: 0,
      breathScaleY: 1,
      breathScaleX: 1,
      hairSwaySkew: 0,
      bobOffsetY: 0,
      auraIntensity: isSelected ? 1 : 0.3,
    };
  }

  const t = elapsedSec + phaseOffsetSec;

  // Determine whether character should play walk-cycle frames or idle-cycle frames
  const isTapCelebrationStep =
    isSelected && previewState === 'auto' && selectionAgeSec >= 0 && selectionAgeSec < 1.35;
  // Periodic lively posture step every ~9s while selected in auto mode
  const periodicReadyStep =
    isSelected &&
    previewState === 'auto' &&
    selectionAgeSec >= 1.35 &&
    (t % 9.0) > 7.6;

  const state: TamerMovementState =
    isSelected && (previewState === 'walk' || isTapCelebrationStep || periodicReadyStep)
      ? 'walk'
      : 'idle';

  const fps = state === 'walk' ? 8.5 : isSelected ? 3.4 : 2.3;

  // Smooth organic breathing + soft hair/jacket flutter anchored at feet
  const breathWave = Math.sin(t * (isSelected ? 2.8 : 2.1));
  const secondaryFlutter = Math.sin(t * 4.4 + 0.8);

  const breathAmp = state === 'walk' ? 0.008 : isSelected ? 0.017 : 0.011;
  const breathScaleY = 1 + breathWave * breathAmp;
  const breathScaleX = 1 - breathWave * (breathAmp * 0.48);

  // Subtle top-body/hair sway skew (radians-like small shear)
  const hairSwaySkew =
    (Math.sin(t * 1.9) * 0.014 + secondaryFlutter * 0.006) *
    (isSelected ? 1.25 : 0.72);

  // Gentle vertical posture bounce
  const bobOffsetY =
    state === 'walk'
      ? -Math.abs(Math.sin(t * 8.5)) * 1.8
      : -Math.max(0, breathWave) * (isSelected ? 1.5 : 0.8);

  const auraPulse = 0.85 + 0.15 * Math.sin(t * 3.2);
  const auraIntensity = isSelected ? auraPulse : 0.28 + 0.08 * Math.sin(t * 1.6);

  return {
    state,
    direction,
    fps,
    breathScaleY,
    breathScaleX,
    hairSwaySkew,
    bobOffsetY,
    auraIntensity,
  };
}
