export type TamerId = 'kai' | 'ren' | 'hina' | 'yuna';

export type Direction8 = 'S' | 'SW' | 'W' | 'NW' | 'N' | 'NE' | 'E' | 'SE';

export type TamerAnimationState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'attack'
  | 'hurt'
  | 'victory';

export const DIRECTIONS_8: readonly Direction8[] = [
  'S',
  'SW',
  'W',
  'NW',
  'N',
  'NE',
  'E',
  'SE',
] as const;

export const DIRECTION_LABELS: Record<Direction8, string> = {
  N: 'Norte',
  NE: 'Nordeste',
  E: 'Leste',
  SE: 'Sudeste',
  S: 'Sul',
  SW: 'Sudoeste',
  W: 'Oeste',
  NW: 'Noroeste',
};

export const ANIMATION_LABELS: Record<TamerAnimationState, string> = {
  idle: 'Parado',
  walk: 'Caminhando',
  run: 'Correndo',
  attack: 'Atacando',
  hurt: 'Recebendo Dano',
  victory: 'Vitória',
};

export interface TamerTheme {
  accentHex: string;
  glowRgba: string;
  borderGradient: string;
  cardBgGradient: string;
  pedestalColor: string;
}

export interface SpriteFrameRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface TamerSpritesheetData {
  id: TamerId;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  directions: readonly Direction8[];
  spritesheetCanvas: HTMLCanvasElement;
  spritesheetUrl: string;
  showcaseSpriteUrl: string;
  topDownFrames: Record<Direction8, [string, string, string, string]>;
  getFrameRect: (
    state: TamerAnimationState,
    direction: Direction8,
    frameIndex: number
  ) => SpriteFrameRect;
}

export interface TamerCharacter {
  id: TamerId;
  code: string;
  gender: 'Menino' | 'Menina';
  archetypeTitle: string;
  shortLabel: string;
  appearanceSummary: string;
  theme: TamerTheme;
}

export interface SavedCharacterSelection {
  accountUsername: string;
  characterId: TamerId;
  tamerName: string;
  spritesheetMeta: {
    frameWidth: number;
    frameHeight: number;
    columns: number;
    rows: number;
    directions: readonly Direction8[];
  };
  updatedAt: string;
}
