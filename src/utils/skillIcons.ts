import type { DigimonFormId } from '../types/digimon';

export type SkillSlotKey = 'f1' | 'f2';

export interface SkillSlotVisualTheme {
  readyBorder: string;
  readyShadow: string;
  keycapBorder: string;
  keycapText: string;
}

const FIRE_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-amber-300/85 hover:border-amber-200',
  readyShadow: 'shadow-[0_0_14px_rgba(251,146,60,0.52)] hover:shadow-[0_0_20px_rgba(251,191,36,0.78)]',
  keycapBorder: 'border-amber-300/75',
  keycapText: 'text-amber-200',
};

const SPEED_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-cyan-300/85 hover:border-sky-100',
  readyShadow: 'shadow-[0_0_14px_rgba(56,214,255,0.52)] hover:shadow-[0_0_20px_rgba(56,232,255,0.82)]',
  keycapBorder: 'border-cyan-300/75',
  keycapText: 'text-cyan-200',
};

const NATURE_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-emerald-300/85 hover:border-lime-200',
  readyShadow: 'shadow-[0_0_14px_rgba(52,211,153,0.52)] hover:shadow-[0_0_20px_rgba(74,222,128,0.8)]',
  keycapBorder: 'border-emerald-300/75',
  keycapText: 'text-emerald-200',
};

const BLOSSOM_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-fuchsia-300/85 hover:border-pink-200',
  readyShadow: 'shadow-[0_0_14px_rgba(232,121,249,0.55)] hover:shadow-[0_0_20px_rgba(244,114,182,0.82)]',
  keycapBorder: 'border-fuchsia-300/75',
  keycapText: 'text-fuchsia-200',
};

const ROSE_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-rose-400/90 hover:border-rose-200',
  readyShadow: 'shadow-[0_0_14px_rgba(244,63,94,0.58)] hover:shadow-[0_0_20px_rgba(251,113,133,0.85)]',
  keycapBorder: 'border-rose-300/80',
  keycapText: 'text-rose-200',
};

const CRIMSON_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-red-400/90 hover:border-rose-200',
  readyShadow: 'shadow-[0_0_14px_rgba(239,68,68,0.6)] hover:shadow-[0_0_20px_rgba(248,113,113,0.88)]',
  keycapBorder: 'border-red-300/80',
  keycapText: 'text-red-200',
};

const ROYAL_KNIGHT_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-amber-300/95 hover:border-yellow-100',
  readyShadow: 'shadow-[0_0_16px_rgba(250,204,21,0.65)] hover:shadow-[0_0_22px_rgba(253,224,71,0.92)]',
  keycapBorder: 'border-yellow-300/85',
  keycapText: 'text-yellow-200',
};

const ICE_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-sky-300/90 hover:border-cyan-100',
  readyShadow: 'shadow-[0_0_15px_rgba(56,189,248,0.58)] hover:shadow-[0_0_22px_rgba(125,211,252,0.88)]',
  keycapBorder: 'border-sky-300/80',
  keycapText: 'text-sky-200',
};

const DARK_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-violet-400/90 hover:border-fuchsia-200',
  readyShadow: 'shadow-[0_0_15px_rgba(139,92,246,0.6)] hover:shadow-[0_0_22px_rgba(192,132,252,0.9)]',
  keycapBorder: 'border-violet-300/80',
  keycapText: 'text-violet-200',
};

const FORM_SKILL_THEMES: Record<DigimonFormId, SkillSlotVisualTheme> = {
  agumon: FIRE_THEME,
  geogreymon: FIRE_THEME,
  rizegreymon: FIRE_THEME,
  shinegreymon: FIRE_THEME,
  agumon_classic: FIRE_THEME,
  greymon: FIRE_THEME,
  metalgreymon: FIRE_THEME,
  wargreymon: ROYAL_KNIGHT_THEME,
  gabumon: ICE_THEME,
  garurumon: ICE_THEME,
  weregarurumon: ICE_THEME,
  metalgarurumon: ICE_THEME,
  impmon: DARK_THEME,
  icedevimon: ICE_THEME,
  skullsatamon: CRIMSON_THEME,
  beelzemon: DARK_THEME,
  gaomon: SPEED_THEME,
  gaogamon: SPEED_THEME,
  machgaogamon: SPEED_THEME,
  miragegaogamon: SPEED_THEME,
  lalamon: NATURE_THEME,
  sunflowmon: NATURE_THEME,
  lilamon: BLOSSOM_THEME,
  rosemon: ROSE_THEME,
  guilmon: CRIMSON_THEME,
  growlmon: CRIMSON_THEME,
  megalogrowlmon: CRIMSON_THEME,
  dukemon: ROYAL_KNIGHT_THEME,
  veemon: SPEED_THEME,
  veedramon: SPEED_THEME,
  aeroveedramon: SPEED_THEME,
  ulforceveedramon: ROYAL_KNIGHT_THEME,
  keramon: DARK_THEME,
  chrysalimon: DARK_THEME,
  infermon: CRIMSON_THEME,
  diaboromon: DARK_THEME,
  demimeramon: FIRE_THEME,
  meramon: FIRE_THEME,
  skullmeramon: CRIMSON_THEME,
  boltmon: NATURE_THEME,
  hawkmon: SPEED_THEME,
  aquilamon: FIRE_THEME,
  silphymon: SPEED_THEME,
  gryphonmon: ROYAL_KNIGHT_THEME,
  tentomon: CRIMSON_THEME,
  kabuterimon: SPEED_THEME,
  megakabuterimon: CRIMSON_THEME,
  herculeskabuterimon: ROYAL_KNIGHT_THEME,
  drimogemon: DARK_THEME,
  digmon: ROYAL_KNIGHT_THEME,
  giromon: DARK_THEME,
  hiandromon: SPEED_THEME,
  kiwimon: NATURE_THEME,
  deramon: ROYAL_KNIGHT_THEME,
  blossomon: BLOSSOM_THEME,
  griffomon: ROYAL_KNIGHT_THEME,
  gotsumon: FIRE_THEME,
  icemon: ICE_THEME,
  insekimon: FIRE_THEME,
  metaletemon: ROYAL_KNIGHT_THEME,
  elecmon: ROYAL_KNIGHT_THEME,
  leomon: FIRE_THEME,
  iceleomon: ICE_THEME,
  saberleomon: ROYAL_KNIGHT_THEME,
  renamon: ROYAL_KNIGHT_THEME,
  kyubimon: FIRE_THEME,
  taomon: BLOSSOM_THEME,
  sakuyamon: ROYAL_KNIGHT_THEME,
  monodramon: DARK_THEME,
  strikedramon: CRIMSON_THEME,
  cyberdramon: CRIMSON_THEME,
  justimon: SPEED_THEME,
  biyomon: BLOSSOM_THEME,
  birdramon: FIRE_THEME,
  garudamon: CRIMSON_THEME,
  phoenixmon: ROYAL_KNIGHT_THEME,
  kunemon: NATURE_THEME,
  flymon: NATURE_THEME,
  okuwamon: CRIMSON_THEME,
  grankuwagamon: DARK_THEME,
  salamon: ROYAL_KNIGHT_THEME,
  gatomon: ROYAL_KNIGHT_THEME,
  angewomon: BLOSSOM_THEME,
  magnadramon: ROSE_THEME,
  patamon: FIRE_THEME,
  angemon: SPEED_THEME,
  magnaangemon: DARK_THEME,
  seraphimon: ROYAL_KNIGHT_THEME,
  starmon: ROYAL_KNIGHT_THEME,
  superstarmon: ROYAL_KNIGHT_THEME,
};

const IMPMON_LINE_FORMS: ReadonlySet<DigimonFormId> = new Set<DigimonFormId>([
  'impmon',
  'icedevimon',
  'skullsatamon',
  'beelzemon',
]);

const VK_LINE_FORMS: ReadonlySet<DigimonFormId> = new Set<DigimonFormId>([
  'veemon',
  'veedramon',
  'aeroveedramon',
  'ulforceveedramon',
  'keramon',
  'chrysalimon',
  'infermon',
  'diaboromon',
]);

const MH_LINE_FORMS: ReadonlySet<DigimonFormId> = new Set<DigimonFormId>([
  'demimeramon',
  'meramon',
  'skullmeramon',
  'boltmon',
  'hawkmon',
  'aquilamon',
  'silphymon',
  'gryphonmon',
]);

const TDK_LINE_FORMS: ReadonlySet<DigimonFormId> = new Set<DigimonFormId>([
  'tentomon',
  'kabuterimon',
  'megakabuterimon',
  'herculeskabuterimon',
  'drimogemon',
  'digmon',
  'giromon',
  'hiandromon',
  'kiwimon',
  'deramon',
  'blossomon',
  'griffomon',
]);

const GERM_LINE_FORMS: ReadonlySet<DigimonFormId> = new Set<DigimonFormId>([
  'gotsumon',
  'icemon',
  'insekimon',
  'metaletemon',
  'elecmon',
  'leomon',
  'iceleomon',
  'saberleomon',
  'renamon',
  'kyubimon',
  'taomon',
  'sakuyamon',
  'monodramon',
  'strikedramon',
  'cyberdramon',
  'justimon',
]);

const BK_LINE_FORMS: ReadonlySet<DigimonFormId> = new Set<DigimonFormId>([
  'biyomon',
  'birdramon',
  'garudamon',
  'phoenixmon',
  'kunemon',
  'flymon',
  'okuwamon',
  'grankuwagamon',
]);

const HOLY_STAR_LINE_FORMS: ReadonlySet<DigimonFormId> = new Set<DigimonFormId>([
  'salamon',
  'gatomon',
  'angewomon',
  'magnadramon',
  'patamon',
  'angemon',
  'magnaangemon',
  'seraphimon',
  'starmon',
  'superstarmon',
]);

const POLISHED_SKILL_FORMS: ReadonlySet<DigimonFormId> = new Set<DigimonFormId>([
  'lilamon',
  'rosemon',
  'justimon',
]);

/**
 * Returns the individual 256x256 MMORPG combat skill icon path for any Digimon form (F1 or F2).
 */
export function getDigimonSkillIconUrl(
  formId: DigimonFormId,
  slot: SkillSlotKey
): string {
  const version = HOLY_STAR_LINE_FORMS.has(formId)
    ? '?v=holy1'
    : POLISHED_SKILL_FORMS.has(formId)
      ? '?v=lalamon_icon3'
      : IMPMON_LINE_FORMS.has(formId)
        ? '?v=impmon_icon2'
        : VK_LINE_FORMS.has(formId)
          ? '?v=vk1'
          : MH_LINE_FORMS.has(formId)
            ? '?v=mh1'
            : TDK_LINE_FORMS.has(formId)
              ? '?v=tdk1'
              : GERM_LINE_FORMS.has(formId)
                ? '?v=germ1'
                : BK_LINE_FORMS.has(formId)
                  ? '?v=bk1'
                  : '';
  return `/assets/skills/${formId}_${slot}.png${version}`;
}

/**
 * Fallback sprite FX path in case an asset fails to load.
 */
export function getDigimonSkillFallbackUrl(
  formId: DigimonFormId,
  slot: SkillSlotKey
): string {
  const version = HOLY_STAR_LINE_FORMS.has(formId)
    ? '?v=holy_fx1'
    : POLISHED_SKILL_FORMS.has(formId)
      ? '?v=lalamon_fx3'
      : IMPMON_LINE_FORMS.has(formId)
        ? '?v=impmon_fx2'
        : VK_LINE_FORMS.has(formId)
          ? '?v=vk_fx1'
          : MH_LINE_FORMS.has(formId)
            ? '?v=mh_fx2'
            : TDK_LINE_FORMS.has(formId)
              ? '?v=tdk_fx2'
              : GERM_LINE_FORMS.has(formId)
                ? '?v=germ_fx2'
                : BK_LINE_FORMS.has(formId)
                  ? '?v=bk_fx1'
                  : '?v=fx3';
  return `/assets/sprites/digimon/${formId}/${slot === 'f1' ? 'atk1_fx' : 'atk2_fx'}.png${version}`;
}

export function getDigimonSkillTheme(formId: DigimonFormId): SkillSlotVisualTheme {
  return FORM_SKILL_THEMES[formId] ?? SPEED_THEME;
}
