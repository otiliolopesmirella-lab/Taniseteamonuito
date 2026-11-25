import type {
  DataElementType,
  DigiEggItemMetadata,
  HatchQualityGrade,
  InventoryCategory,
  InventoryItem,
  ItemRarity,
} from '../types/hud';
import type { DigimonFormId } from '../types/digimon';
import { MUDFRIGIMON_CONSUMABLES } from './mudfrigimonShopCatalog';

export const EVOLUTER_ITEM_KEY = 'evoluter';
export const EVOLUTER_ICON_URL =
  '/assets/aistudio/file_0000000005d8820e840fb4c06cd82842_f428bdab.png';

export const HATCH_BACKUP_ITEM_KEY = 'hatch_backup';
export const HATCH_BACKUP_ICON_URL =
  '/assets/aistudio/file_000000002b94820eaedef8a09e488c11_13f6b6d4.png';

export const XP_BOOST_1H_ITEM_KEY = 'xp_boost_1h';
export const XP_BOOST_2H_ITEM_KEY = 'xp_boost_2h';
export const XP_BOOST_3H_ITEM_KEY = 'xp_boost_3h';
export const XP_BOOST_4H_ITEM_KEY = 'xp_boost_4h';

export const XP_BOOST_1H_ICON_URL =
  '/assets/aistudio/file_000000003868820e8673497561715743_2ce4b078.png';
export const XP_BOOST_2H_ICON_URL =
  '/assets/aistudio/file_0000000049f8820e98a5476d2ec07909_38808647.png';
export const XP_BOOST_3H_ICON_URL =
  '/assets/aistudio/file_0000000002f4820ea2aa5b2febb60b77_c59cbb41.png';
export const XP_BOOST_4H_ICON_URL =
  '/assets/aistudio/file_00000000a5f8820e89905c5ba6d05dae_de58928f.png';

export interface XpBoostItemSpec {
  itemKey: string;
  name: string;
  shortLabel: string;
  hours: number;
  durationMs: number;
  bonusPct: number;
  iconUrl: string;
  rarity: ItemRarity;
  accentColor: string;
}

export const XP_BOOST_ITEMS_SPEC: readonly XpBoostItemSpec[] = [
  {
    itemKey: XP_BOOST_1H_ITEM_KEY,
    name: '⚡ 1H XP BOOST',
    shortLabel: '1H',
    hours: 1,
    durationMs: 1 * 60 * 60 * 1000,
    bonusPct: 100,
    iconUrl: XP_BOOST_1H_ICON_URL,
    rarity: 'raro',
    accentColor: '#38bdf8',
  },
  {
    itemKey: XP_BOOST_2H_ITEM_KEY,
    name: '⚡ 2H XP BOOST',
    shortLabel: '2H',
    hours: 2,
    durationMs: 2 * 60 * 60 * 1000,
    bonusPct: 100,
    iconUrl: XP_BOOST_2H_ICON_URL,
    rarity: 'raro',
    accentColor: '#818cf8',
  },
  {
    itemKey: XP_BOOST_3H_ITEM_KEY,
    name: '⚡ 3H XP BOOST',
    shortLabel: '3H',
    hours: 3,
    durationMs: 3 * 60 * 60 * 1000,
    bonusPct: 100,
    iconUrl: XP_BOOST_3H_ICON_URL,
    rarity: 'epico',
    accentColor: '#c084fc',
  },
  {
    itemKey: XP_BOOST_4H_ITEM_KEY,
    name: '👑 4H XP BOOST',
    shortLabel: '4H',
    hours: 4,
    durationMs: 4 * 60 * 60 * 1000,
    bonusPct: 100,
    iconUrl: XP_BOOST_4H_ICON_URL,
    rarity: 'lendario',
    accentColor: '#fbbf24',
  },
];

const XP_BOOST_BY_KEY = new Map<string, XpBoostItemSpec>(
  XP_BOOST_ITEMS_SPEC.map((spec) => [spec.itemKey, spec])
);
const XP_BOOST_ICON_URLS = new Set<string>(
  XP_BOOST_ITEMS_SPEC.map((spec) => spec.iconUrl)
);

export function getXpBoostSpecByKey(
  itemKey: string
): XpBoostItemSpec | undefined {
  return XP_BOOST_BY_KEY.get(itemKey);
}

export function isXpBoostIconUrl(url?: string): boolean {
  return Boolean(url && XP_BOOST_ICON_URLS.has(url));
}

export function getActiveXpBoostBonusPct(
  xpBoostUntilMs?: number | null,
  nowMs: number = Date.now()
): number {
  if (
    typeof xpBoostUntilMs !== 'number' ||
    !Number.isFinite(xpBoostUntilMs) ||
    xpBoostUntilMs <= nowMs
  ) {
    return 0;
  }
  return 100;
}

export function formatXpBoostRemainingLabel(
  xpBoostUntilMs?: number | null,
  nowMs: number = Date.now()
): string | null {
  if (
    typeof xpBoostUntilMs !== 'number' ||
    !Number.isFinite(xpBoostUntilMs) ||
    xpBoostUntilMs <= nowMs
  ) {
    return null;
  }
  const totalSec = Math.max(1, Math.ceil((xpBoostUntilMs - nowMs) / 1000));
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hours > 0) {
    return `${hours}h ${String(mins).padStart(2, '0')}m`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export interface HatchQualityProfile {
  grade: HatchQualityGrade;
  label: '3/5' | '4/5' | '5/5';
  qualityName: string;
  minSizePct: number;
  maxSizePct: number;
  sizeRangeLabel: string;
  defaultSizePct: number;
  powerBonusPct: number;
  statMultiplier: number;
  badgeColor: string;
  description: string;
}

export const MIN_HATCHABLE_LEVEL = 3;
export const MAX_HATCHABLE_LEVEL = 5;

export const DMO_HATCH_QUALITY_PROFILES: Record<
  HatchQualityGrade,
  HatchQualityProfile
> = {
  3: {
    grade: 3,
    label: '3/5',
    qualityName: 'Normal',
    minSizePct: 80,
    maxSizePct: 100,
    sizeRangeLabel: '80%–100%',
    defaultSizePct: 100,
    powerBonusPct: 0,
    statMultiplier: 1.0,
    badgeColor: '#38bdf8',
    description:
      'Chocagem 3/5: +0% de bônus de estágio. Qualidade sorteada entre 80% e 100%.',
  },
  4: {
    grade: 4,
    label: '4/5',
    qualityName: 'Forte',
    minSizePct: 100,
    maxSizePct: 120,
    sizeRangeLabel: '100%–120%',
    defaultSizePct: 110,
    powerBonusPct: 7,
    statMultiplier: 1.07,
    badgeColor: '#c084fc',
    description:
      'Chocagem 4/5: ganha +7% em todos os atributos e qualidade sorteada entre 100% e 120%.',
  },
  5: {
    grade: 5,
    label: '5/5',
    qualityName: 'Muito Forte',
    minSizePct: 120,
    maxSizePct: 140,
    sizeRangeLabel: '120%–140%',
    defaultSizePct: 130,
    powerBonusPct: 15,
    statMultiplier: 1.15,
    badgeColor: '#fbbf24',
    description:
      'Chocagem 5/5: ganha +15% em todos os atributos e qualidade sorteada entre 120% e 140%.',
  },
};

export function getHatchQualityProfile(grade?: number): HatchQualityProfile {
  if (grade === 5) return DMO_HATCH_QUALITY_PROFILES[5];
  if (grade === 4) return DMO_HATCH_QUALITY_PROFILES[4];
  return DMO_HATCH_QUALITY_PROFILES[3];
}

export function clampHatchSizePct(grade?: number, sizePct?: number): number {
  const profile = getHatchQualityProfile(grade);
  if (typeof sizePct !== 'number' || !Number.isFinite(sizePct)) {
    return profile.defaultSizePct;
  }
  return Math.max(
    profile.minSizePct,
    Math.min(profile.maxSizePct, Math.round(sizePct))
  );
}

export function rollHatchSizePct(
  grade?: number,
  rng: () => number = Math.random
): number {
  const profile = getHatchQualityProfile(grade);
  const span = profile.maxSizePct - profile.minSizePct + 1;
  const raw = Math.floor(Math.max(0, Math.min(0.999999, rng())) * span);
  return profile.minSizePct + raw;
}

/**
 * Bônus percentual em todos os atributos conforme a faixa de qualidade (%) do Digimon:
 * - 80% a 90%:  +0,10%
 * - 91% a 100%: +0,20%
 * - 101% a 110%: +0,30%
 * - 111% a 120%: +0,40%
 * - 121% a 130%: +0,50%
 * - 131% a 140%: +0,60%
 */
export function getQualitySizeBonusPct(sizePct?: number): number {
  if (typeof sizePct !== 'number' || !Number.isFinite(sizePct) || sizePct < 80) {
    return 0;
  }
  if (sizePct <= 90) return 0.1;
  if (sizePct <= 100) return 0.2;
  if (sizePct <= 110) return 0.3;
  if (sizePct <= 120) return 0.4;
  if (sizePct <= 130) return 0.5;
  return 0.6;
}

/**
 * Soma total de bônus percentual (%) aplicado a todos os atributos do Digimon:
 * estágio de chocagem (3/5 = 0%, 4/5 = +7%, 5/5 = +15%) + faixa de qualidade (+0,10% a +0,60%).
 */
export function computeTotalHatchBonusPct(
  grade?: number,
  sizePct?: number
): number {
  const profile = getHatchQualityProfile(grade);
  const effectiveSize = clampHatchSizePct(profile.grade, sizePct);
  return Number(
    (profile.powerBonusPct + getQualitySizeBonusPct(effectiveSize)).toFixed(2)
  );
}

/**
 * Multiplicador final aplicado a todos os atributos do Digimon
 * combinando estágio de chocagem (3/5, 4/5, 5/5) + faixa de qualidade (80%–140%).
 */
export function computeHatchPowerMultiplier(
  grade?: number,
  sizePct?: number
): number {
  return 1 + computeTotalHatchBonusPct(grade, sizePct) / 100;
}

/**
 * Escala visual sutil do Digimon no mapa conforme sua qualidade/tamanho (%)
 * (100% = 1.00× padrão, 80% = 0.92×, 120% = 1.08×, 140% = 1.16×).
 */
export function computeHatchVisualScale(sizePct?: number): number {
  if (typeof sizePct !== 'number' || !Number.isFinite(sizePct)) {
    return 1.0;
  }
  const scaled = 1 + (sizePct - 100) * 0.004;
  return Math.max(0.92, Math.min(1.16, scaled));
}

export interface DataInjectionStepConfig {
  fromLevel: number;
  toLevel: number;
  successChance: number;
  breakChanceOnFail: number;
  unlocksHatch: boolean;
  resultingGrade?: HatchQualityGrade;
}

/**
 * Probabilidades hardcore de incubação mercenária:
 * - 0/5 -> 1/5: 50% acerto · Seguro (não quebra, apenas consome DATA).
 * - 1/5 -> 2/5: 35% acerto · 25% de quebra em caso de falha.
 * - 2/5 -> 3/5: 20% acerto · 45% de quebra em caso de falha (libera 3/5 Normal).
 * - 3/5 -> 4/5: 10% acerto · 65% de quebra em caso de falha (libera 4/5 Forte).
 * - 4/5 -> 5/5: 1% acerto · 80% de quebra em caso de falha (libera 5/5 Muito Forte).
 */
export const DMO_DATA_INJECTION_STEPS: readonly DataInjectionStepConfig[] = [
  {
    fromLevel: 0,
    toLevel: 1,
    successChance: 0.5,
    breakChanceOnFail: 0.0,
    unlocksHatch: false,
  },
  {
    fromLevel: 1,
    toLevel: 2,
    successChance: 0.35,
    breakChanceOnFail: 0.25,
    unlocksHatch: false,
  },
  {
    fromLevel: 2,
    toLevel: 3,
    successChance: 0.2,
    breakChanceOnFail: 0.45,
    unlocksHatch: true,
    resultingGrade: 3,
  },
  {
    fromLevel: 3,
    toLevel: 4,
    successChance: 0.1,
    breakChanceOnFail: 0.65,
    unlocksHatch: true,
    resultingGrade: 4,
  },
  {
    fromLevel: 4,
    toLevel: 5,
    successChance: 0.01,
    breakChanceOnFail: 0.8,
    unlocksHatch: true,
    resultingGrade: 5,
  },
];

export function getNextInjectionStepInfo(
  currentLevel: number
): DataInjectionStepConfig | null {
  const safe = Math.max(0, Math.floor(currentLevel));
  return DMO_DATA_INJECTION_STEPS.find((s) => s.fromLevel === safe) ?? null;
}

export interface RarityVisualMeta {
  id: ItemRarity;
  label: string;
  badgeClass: string;
  borderHex: string;
  glowRgba: string;
  textHex: string;
}

export const ITEM_RARITY_META: Record<ItemRarity, RarityVisualMeta> = {
  comum: {
    id: 'comum',
    label: 'Comum',
    badgeClass: 'border-slate-400/70 bg-slate-800/85 text-slate-200',
    borderHex: '#94a3b8',
    glowRgba: 'rgba(148, 163, 184, 0.35)',
    textHex: '#e2e8f0',
  },
  incomum: {
    id: 'incomum',
    label: 'Incomum',
    badgeClass: 'border-emerald-400/80 bg-emerald-950/85 text-emerald-200',
    borderHex: '#34d399',
    glowRgba: 'rgba(52, 211, 153, 0.48)',
    textHex: '#6ee7b7',
  },
  raro: {
    id: 'raro',
    label: 'Raro',
    badgeClass: 'border-cyan-300/85 bg-cyan-950/90 text-cyan-200',
    borderHex: '#38bdf8',
    glowRgba: 'rgba(56, 189, 248, 0.58)',
    textHex: '#7dd3fc',
  },
  epico: {
    id: 'epico',
    label: 'Épico',
    badgeClass: 'border-purple-300/85 bg-purple-950/90 text-purple-200',
    borderHex: '#c084fc',
    glowRgba: 'rgba(192, 132, 252, 0.65)',
    textHex: '#e9d5ff',
  },
  lendario: {
    id: 'lendario',
    label: 'Lendário',
    badgeClass: 'border-amber-300/90 bg-amber-950/90 text-amber-200',
    borderHex: '#fbbf24',
    glowRgba: 'rgba(251, 191, 36, 0.72)',
    textHex: '#fde68a',
  },
};

export interface CatalogItemDefinition {
  itemKey: string;
  name: string;
  category: Exclude<InventoryCategory, 'all'>;
  description: string;
  iconUrl?: string;
  rarity: ItemRarity;
  dataType?: DataElementType;
  usageInfo: string;
  accentColor: string;
  hpRestore?: number;
  dsRestore?: number;
  eggData?: DigiEggItemMetadata;
}

export interface DataItemConfigInput {
  dataType: DataElementType;
  itemKey: string;
  name: string;
  iconUrl: string;
  rarity: ItemRarity;
  accentColor: string;
  description: string;
  usageInfo: string;
}

export interface DigiEggConfigInput {
  dataType: DataElementType;
  itemKey: string;
  name: string;
  iconUrl: string;
  accentColor: string;
  speciesLabel: string;
  hatchedFormId?: DigimonFormId;
  description: string;
  usageRequirements: string;
}

/**
 * Configuracao central e ajustavel das receitas de injecao de DATA na Incubadora do DATS.
 * Cada tentativa de avancar um estagio (0/5 -> 5/5) consome `requiredDataQuantity` de DATA correspondente.
 */
export const DIGIEGG_HATCH_RECIPE_CONFIG: {
  defaultDataQuantity: number;
  defaultMaxReinforceLevel: number;
  byEggKey: Partial<
    Record<
      string,
      {
        requiredDataQuantity?: number;
        maxHatchLevel?: number;
        extraMaterials?: Array<{ itemKey: string; name: string; quantity: number }>;
      }
    >
  >;
} = {
  defaultDataQuantity: 5,
  defaultMaxReinforceLevel: 5,
  byEggKey: {
    // Os 15 DigiEggs personalizados oficiais
    digiegg_drimogemon: { requiredDataQuantity: 5 },
    digiegg_gotsumon: { requiredDataQuantity: 5 },
    digiegg_biyomon: { requiredDataQuantity: 5 },
    digiegg_hawkmon: { requiredDataQuantity: 5 },
    digiegg_monodramon: { requiredDataQuantity: 7 },
    digiegg_impmon: { requiredDataQuantity: 9 },
    digiegg_renamon: { requiredDataQuantity: 7 },
    digiegg_elecmon: { requiredDataQuantity: 6 },
    digiegg_guilmon: { requiredDataQuantity: 9 },
    digiegg_gabumon: { requiredDataQuantity: 7 },
    digiegg_agumon_classic: { requiredDataQuantity: 7 },
    digiegg_tentomon: { requiredDataQuantity: 6 },
    digiegg_kunemon: { requiredDataQuantity: 5 },
    digiegg_demimeramon: { requiredDataQuantity: 7 },
    digiegg_keramon: { requiredDataQuantity: 10 },
    digiegg_veemon: { requiredDataQuantity: 10 },
  },
};

/**
 * Os 9 tipos oficiais de DATA (colecao oficial fatiada em PNG individual).
 * Raridades, nomes e descricoes sao 100% configuraveis aqui.
 */
export const DATA_ITEMS_CONFIG: readonly DataItemConfigInput[] = [
  {
    dataType: 'dragon',
    itemKey: 'data_dragon',
    name: 'DATA DRAGON',
    iconUrl: '/assets/items/data/data_dragon.png',
    rarity: 'raro',
    accentColor: '#ef4444',
    description:
      'Fragmento de dados dracônicos de alta densidade energética extraído de Digimons da linhagem Dragon.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar DRAGON DIGIEGG.',
  },
  {
    dataType: 'fire',
    itemKey: 'data_fire',
    name: 'DATA FIRE',
    iconUrl: '/assets/items/data/data_fire.png',
    rarity: 'incomum',
    accentColor: '#f97316',
    description:
      'Pacote de dados térmicos condensados carregado com energia ígnea digital.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar FIRE DIGIEGG.',
  },
  {
    dataType: 'bird',
    itemKey: 'data_bird',
    name: 'DATA BIRD',
    iconUrl: '/assets/items/data/data_bird.png',
    rarity: 'incomum',
    accentColor: '#38bdf8',
    description:
      'Código aerodinâmico leve coletado de Digimons aviários e velozes do Mundo Digital.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar BIRD DIGIEGG.',
  },
  {
    dataType: 'plant',
    itemKey: 'data_plant',
    name: 'DATA PLANT',
    iconUrl: '/assets/items/data/data_plant.png',
    rarity: 'incomum',
    accentColor: '#22c55e',
    description:
      'Dados orgânicos botânicos sintetizados por Digimons vegetais e guardiões das florestas.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar PLANT DIGIEGG.',
  },
  {
    dataType: 'rock',
    itemKey: 'data_rock',
    name: 'DATA ROCK',
    iconUrl: '/assets/items/data/data_rock.png',
    rarity: 'incomum',
    accentColor: '#eab308',
    description:
      'Estrutura mineral compactada com alta resistência defensiva e estabilidade de código.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar ROCK DIGIEGG.',
  },
  {
    dataType: 'insect',
    itemKey: 'data_insect',
    name: 'DATA INSECT',
    iconUrl: '/assets/items/data/data_insect.png',
    rarity: 'incomum',
    accentColor: '#10b981',
    description:
      'Sequência de dados quitinosos e bioelétricos obtida de Digimons insetoides.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar INSECT DIGIEGG.',
  },
  {
    dataType: 'aquatic',
    itemKey: 'data_aquatic',
    name: 'DATA AQUATIC',
    iconUrl: '/assets/items/data/data_aquatic.png',
    rarity: 'incomum',
    accentColor: '#06b6d4',
    description:
      'Matriz fluida de dados marinhos presente em Digimons aquáticos e habitantes de lagos digitais.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar AQUATIC DIGIEGG.',
  },
  {
    dataType: 'devil',
    itemKey: 'data_devil',
    name: 'DATA DEVIL',
    iconUrl: '/assets/items/data/data_devil.png',
    rarity: 'raro',
    accentColor: '#c084fc',
    description:
      'Dados sombrios de polaridade abissal extraídos de Digimons demoníacos e noturnos.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar DEVIL DIGIEGG.',
  },
  {
    dataType: 'beast',
    itemKey: 'data_beast',
    name: 'DATA BEAST',
    iconUrl: '/assets/items/data/data_beast.png',
    rarity: 'incomum',
    accentColor: '#f59e0b',
    description:
      'Código feroz e instintivo obtido de Digimons feras e predadores ágeis das pradarias.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar BEAST DIGIEGG.',
  },
];

/**
 * Os 15 DigiEggs personalizados oficiais do jogo.
 * Cada DigiEgg vincula automaticamente seu tipo de DATA e receita configuravel.
 */
export const DIGIEGG_ITEMS_CONFIG: readonly DigiEggConfigInput[] = [
  // === DIGIEGGS DROPÁVEIS — PLANÍCIE DIGITAL (Nv. 1–10) ===
  {
    dataType: 'rock',
    itemKey: 'digiegg_drimogemon',
    name: 'DigiEgg: Drimogemon',
    iconUrl: '/assets/items/digieggs/egg_drimogemon.png?v=drimo2',
    accentColor: '#eab308',
    speciesLabel: 'Drimogemon',
    hatchedFormId: 'drimogemon',
    description:
      'DigiEgg Mercenário de Drimogemon (linha evolutiva: Drimogemon → Digmon → Giromon → HiAndromon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA ROCK até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
  {
    dataType: 'rock',
    itemKey: 'digiegg_gotsumon',
    name: 'DigiEgg: Gotsumon',
    iconUrl: '/assets/items/digieggs/egg_gotsumon.png',
    accentColor: '#94a3b8',
    speciesLabel: 'Gotsumon',
    hatchedFormId: 'gotsumon',
    description:
      'DigiEgg Mercenário de Gotsumon (linha evolutiva: Gotsumon → Icemon → Insekimon → MetalEtemon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA ROCK até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
  {
    dataType: 'bird',
    itemKey: 'digiegg_biyomon',
    name: 'DigiEgg: Biyomon',
    iconUrl: '/assets/items/digieggs/egg_biyomon.png',
    accentColor: '#f472b6',
    speciesLabel: 'Biyomon',
    hatchedFormId: 'biyomon',
    description:
      'DigiEgg Mercenário de Biyomon com plumagem rosa e crista celeste (linhagem Bird: Biyomon → Birdramon → Garudamon → Phoenixmon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA BIRD até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
  {
    dataType: 'bird',
    itemKey: 'digiegg_hawkmon',
    name: 'DigiEgg: Hawkmon',
    iconUrl: '/assets/items/digieggs/egg_hawkmon.png',
    accentColor: '#38bdf8',
    speciesLabel: 'Hawkmon',
    hatchedFormId: 'hawkmon',
    description:
      'DigiEgg Mercenário de Hawkmon (linha evolutiva: Hawkmon → Aquilamon → Silphymon → Gryphonmon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA BIRD até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
  {
    dataType: 'dragon',
    itemKey: 'digiegg_monodramon',
    name: 'DigiEgg: Monodramon',
    iconUrl: '/assets/items/digieggs/egg_monodramon.png',
    accentColor: '#a855f7',
    speciesLabel: 'Monodramon',
    hatchedFormId: 'monodramon',
    description:
      'DigiEgg Mercenário de Monodramon (linha evolutiva: Monodramon → Strikedramon → Cyberdramon → Justimon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA DRAGON até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
  // === DIGIEGGS DROPÁVEIS — FLORESTA DE DADOS (Nv. 10–20 + RAID) ===
  {
    dataType: 'devil',
    itemKey: 'digiegg_impmon',
    name: 'DigiEgg: Impmon',
    iconUrl: '/assets/items/digieggs/egg_impmon.png',
    accentColor: '#c084fc',
    speciesLabel: 'Impmon',
    hatchedFormId: 'impmon',
    description:
      'DigiEgg Mercenário de Impmon (linha evolutiva: Impmon → IceDevimon → SkullSatamon → Beelzemon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA DEVIL até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
  {
    dataType: 'beast',
    itemKey: 'digiegg_renamon',
    name: 'DigiEgg: Renamon',
    iconUrl: '/assets/items/digieggs/egg_renamon.png',
    accentColor: '#facc15',
    speciesLabel: 'Renamon',
    hatchedFormId: 'renamon',
    description:
      'DigiEgg Mercenário de Renamon (linha evolutiva: Renamon → Kyubimon → Taomon → Sakuyamon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA BEAST até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
  {
    dataType: 'beast',
    itemKey: 'digiegg_elecmon',
    name: 'DigiEgg: Elecmon',
    iconUrl: '/assets/items/digieggs/egg_elecmon.png',
    accentColor: '#fb923c',
    speciesLabel: 'Elecmon',
    hatchedFormId: 'elecmon',
    description:
      'DigiEgg Mercenário de Elecmon carregado de energia elétrica (linha evolutiva: Elecmon → Leomon → IceLeomon → SaberLeomon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA BEAST até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
  {
    dataType: 'dragon',
    itemKey: 'digiegg_guilmon',
    name: 'DigiEgg: Guilmon',
    iconUrl: '/assets/items/digieggs/egg_guilmon.png',
    accentColor: '#ef4444',
    speciesLabel: 'Guilmon',
    hatchedFormId: 'guilmon',
    description:
      'DigiEgg Mercenário de Guilmon (linha evolutiva: Guilmon → Growlmon → WarGrowlmon → Dukemon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA DRAGON até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
  {
    dataType: 'beast',
    itemKey: 'digiegg_gabumon',
    name: 'DigiEgg: Gabumon',
    iconUrl: '/assets/items/digieggs/egg_gabumon.png',
    accentColor: '#38bdf8',
    speciesLabel: 'Gabumon',
    hatchedFormId: 'gabumon',
    description:
      'DigiEgg Mercenário de Gabumon (linha evolutiva: Gabumon → Garurumon → WereGarurumon → MetalGarurumon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA BEAST até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
  {
    dataType: 'fire',
    itemKey: 'digiegg_agumon_classic',
    name: 'DigiEgg: Agumon (Clássico)',
    iconUrl: '/assets/items/digieggs/egg_agumon_classic.png',
    accentColor: '#f97316',
    speciesLabel: 'Agumon (Clássico)',
    hatchedFormId: 'agumon_classic',
    description:
      'DigiEgg Mercenário de Agumon Clássico (linha evolutiva: Agumon → Greymon → MetalGreymon → WarGreymon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA FIRE até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
  {
    dataType: 'insect',
    itemKey: 'digiegg_tentomon',
    name: 'DigiEgg: Tentomon',
    iconUrl: '/assets/items/digieggs/egg_tentomon.png',
    accentColor: '#10b981',
    speciesLabel: 'Tentomon',
    hatchedFormId: 'tentomon',
    description:
      'DigiEgg Mercenário de Tentomon obtido em combates de insetos (linha: Tentomon → Kabuterimon → MegaKabuterimon → HerculesKabuterimon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA INSECT até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
  {
    dataType: 'insect',
    itemKey: 'digiegg_kunemon',
    name: 'DigiEgg: Kunemon',
    iconUrl: '/assets/items/digieggs/egg_kunemon.png',
    accentColor: '#eab308',
    speciesLabel: 'Kunemon',
    hatchedFormId: 'kunemon',
    description:
      'DigiEgg Mercenário de Kunemon (linha: Kunemon → Flymon → Okuwamon → GranKuwagamon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA INSECT até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
  // === DIGIEGGS DROPÁVEIS — MONTANHA DIGI (Nv. 20–30) ===
  {
    dataType: 'fire',
    itemKey: 'digiegg_demimeramon',
    name: 'DigiEgg: DemiMeramon',
    iconUrl: '/assets/items/digieggs/egg_demimeramon.png',
    accentColor: '#fb713b',
    speciesLabel: 'DemiMeramon',
    hatchedFormId: 'demimeramon',
    description:
      'DigiEgg Mercenário de DemiMeramon dropado por Meramon na Montanha Digi (linha: DemiMeramon → Meramon → SkullMeramon → Boltmon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA FIRE até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
  {
    dataType: 'devil',
    itemKey: 'digiegg_keramon',
    name: 'DigiEgg: Keramon',
    iconUrl: '/assets/items/digieggs/egg_keramon.png',
    accentColor: '#a855f7',
    speciesLabel: 'Keramon',
    hatchedFormId: 'keramon',
    description:
      'DigiEgg Mercenário de Keramon dropado por Chrysalimon na Caverna dos Cristais Roxos (linha: Keramon → Chrysalimon → Infermon → Diaboromon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA DEVIL até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
  {
    dataType: 'dragon',
    itemKey: 'digiegg_veemon',
    name: 'DigiEgg: Veemon',
    iconUrl: '/assets/items/digieggs/egg_veemon.png',
    accentColor: '#38bdf8',
    speciesLabel: 'Veemon',
    hatchedFormId: 'veemon',
    description:
      'DigiEgg Mercenário de Veemon dropado por Veedramon na Fortaleza Tecnológica Central (linha: Veemon → Veedramon → AeroVeedramon → UlforceVeedramon).',
    usageRequirements:
      'Inserir na Incubadora do DATS com DATA DRAGON até atingir 3/5, 4/5 ou 5/5 para chocar.',
  },
];

const CATALOG_REGISTRY = new Map<string, CatalogItemDefinition>();
const DATA_BY_TYPE = new Map<DataElementType, CatalogItemDefinition>();
const EGG_BY_TYPE = new Map<DataElementType, CatalogItemDefinition>();

function buildDataEntry(cfg: DataItemConfigInput): CatalogItemDefinition {
  return {
    itemKey: cfg.itemKey,
    name: cfg.name,
    category: 'data',
    description: cfg.description,
    iconUrl: cfg.iconUrl,
    rarity: cfg.rarity,
    dataType: cfg.dataType,
    usageInfo: cfg.usageInfo,
    accentColor: cfg.accentColor,
  };
}

function buildDigiEggEntry(cfg: DigiEggConfigInput): CatalogItemDefinition {
  const dataDef = DATA_BY_TYPE.get(cfg.dataType);
  const recipeOverride = DIGIEGG_HATCH_RECIPE_CONFIG.byEggKey[cfg.itemKey];
  const requiredDataQuantity = Math.max(
    1,
    recipeOverride?.requiredDataQuantity ?? DIGIEGG_HATCH_RECIPE_CONFIG.defaultDataQuantity
  );
  const maxHatchLevel = Math.max(
    1,
    recipeOverride?.maxHatchLevel ?? DIGIEGG_HATCH_RECIPE_CONFIG.defaultMaxReinforceLevel
  );
  const dataItemKey = dataDef?.itemKey ?? `data_${cfg.dataType}`;
  const dataName = dataDef?.name ?? `DATA ${cfg.dataType.toUpperCase()}`;

  const requiredMaterials = [
    {
      itemKey: dataItemKey,
      name: dataName,
      quantity: requiredDataQuantity,
    },
    ...(recipeOverride?.extraMaterials ?? []),
  ];

  return {
    itemKey: cfg.itemKey,
    name: cfg.name,
    category: 'digiegg',
    description: cfg.description,
    iconUrl: cfg.iconUrl,
    rarity: 'comum',
    dataType: cfg.dataType,
    usageInfo: cfg.usageRequirements,
    accentColor: cfg.accentColor,
    eggData: {
      speciesName: cfg.speciesLabel,
      hatchedFormId: cfg.hatchedFormId,
      rarity: 'DigiEgg',
      dataType: cfg.dataType,
      requiredDataKey: dataItemKey,
      requiredDataQuantity,
      hatchLevel: 0,
      maxHatchLevel,
      accentColor: cfg.accentColor,
      usageRequirements: cfg.usageRequirements,
      requiredMaterials,
    },
  };
}

export function registerDataCatalogItem(cfg: DataItemConfigInput): CatalogItemDefinition {
  const entry = buildDataEntry(cfg);
  CATALOG_REGISTRY.set(entry.itemKey, entry);
  DATA_BY_TYPE.set(cfg.dataType, entry);
  return entry;
}

export function registerDigiEggCatalogItem(cfg: DigiEggConfigInput): CatalogItemDefinition {
  const entry = buildDigiEggEntry(cfg);
  CATALOG_REGISTRY.set(entry.itemKey, entry);
  if (!EGG_BY_TYPE.has(cfg.dataType)) {
    EGG_BY_TYPE.set(cfg.dataType, entry);
  }
  return entry;
}

// Initialize all 9 DATA + 9 DigiEggs
for (const d of DATA_ITEMS_CONFIG) {
  registerDataCatalogItem(d);
}
for (const egg of DIGIEGG_ITEMS_CONFIG) {
  registerDigiEggCatalogItem(egg);
}
for (const c of MUDFRIGIMON_CONSUMABLES) {
  CATALOG_REGISTRY.set(c.itemKey, {
    itemKey: c.itemKey,
    name: c.name,
    category: 'consumable',
    description: c.description,
    iconUrl: c.iconUrl,
    rarity: c.rarity,
    usageInfo: c.usageInfo,
    accentColor: c.shopCategory === 'hp-food' ? '#fb7185' : '#38e8ff',
    hpRestore: c.hpRestore,
    dsRestore: c.dsRestore,
  });
}

export const EVOLUTER_CATALOG_DEFINITION: CatalogItemDefinition = {
  itemKey: EVOLUTER_ITEM_KEY,
  name: 'Evoluter',
  category: 'other',
  description:
    'Núcleo energético de digievolução avançada necessário para desbloquear os estágios Ultimate e Mega de Digimons Mercenários.',
  iconUrl: EVOLUTER_ICON_URL,
  rarity: 'epico',
  usageInfo:
    'Use na janela do Digimon ou clicando na evolução bloqueada na barra inferior quando atingir o nível necessário. Digimons Iniciais (Agumon, Gaomon e Lalamon) não consomem Evoluters.',
  accentColor: '#e879f9',
};

CATALOG_REGISTRY.set(EVOLUTER_ITEM_KEY, EVOLUTER_CATALOG_DEFINITION);

export const HATCH_BACKUP_CATALOG_DEFINITION: CatalogItemDefinition = {
  itemKey: HATCH_BACKUP_ITEM_KEY,
  name: 'Hatch Backup',
  category: 'other',
  description:
    'Disco de proteção quântica para a Incubadora DATS. Impede que o seu DigiEgg quebre caso a inserção de DATA falhe.',
  iconUrl: HATCH_BACKUP_ICON_URL,
  rarity: 'epico',
  usageInfo:
    'Ative na Incubadora do DATS antes de inserir DATA em estágios com risco de quebra (1/5 → 2/5 até 4/5 → 5/5). Só é consumido se a tentativa falhar.',
  accentColor: '#38bdf8',
};

CATALOG_REGISTRY.set(HATCH_BACKUP_ITEM_KEY, HATCH_BACKUP_CATALOG_DEFINITION);

for (const spec of XP_BOOST_ITEMS_SPEC) {
  CATALOG_REGISTRY.set(spec.itemKey, {
    itemKey: spec.itemKey,
    name: spec.name,
    category: 'consumable',
    description: `Amplificador de Experiência (+${spec.bonusPct}% XP) com duração de ${spec.hours} hora${
      spec.hours > 1 ? 's' : ''
    } para Tamer e Digimon em combates e Raids.`,
    iconUrl: spec.iconUrl,
    rarity: spec.rarity,
    usageInfo: `Clique em "Usar" no Inventário para ativar +${spec.bonusPct}% de EXP por ${spec.hours}h. Se já houver um boost ativo, o tempo é acumulado automaticamente.`,
    accentColor: spec.accentColor,
  });
}

export function getCatalogItemByKey(itemKey: string): CatalogItemDefinition | undefined {
  return CATALOG_REGISTRY.get(itemKey);
}

export function getDataItemDefinition(
  dataType: DataElementType
): CatalogItemDefinition | undefined {
  return DATA_BY_TYPE.get(dataType);
}

export function getDigiEggDefinition(
  dataType: DataElementType
): CatalogItemDefinition | undefined {
  return EGG_BY_TYPE.get(dataType);
}

export function listAllDataDefinitions(): readonly CatalogItemDefinition[] {
  return DATA_ITEMS_CONFIG.map((d) => CATALOG_REGISTRY.get(d.itemKey)!).filter(Boolean);
}

export function listAllDigiEggDefinitions(): readonly CatalogItemDefinition[] {
  return DIGIEGG_ITEMS_CONFIG.map((e) => CATALOG_REGISTRY.get(e.itemKey)!).filter(Boolean);
}

export function createInventoryPayloadFromCatalog(
  itemKey: string,
  quantity = 1
): Omit<InventoryItem, 'id'> | null {
  const def = CATALOG_REGISTRY.get(itemKey);
  if (!def) return null;
  return {
    itemKey: def.itemKey,
    name: def.name,
    category: def.category,
    quantity: Math.max(1, Math.round(quantity)),
    description: def.description,
    iconUrl: def.iconUrl,
    rarity: def.rarity,
    dataType: def.dataType,
    usageInfo: def.usageInfo,
    hpRestore: def.hpRestore,
    dsRestore: def.dsRestore,
    eggData: def.eggData
      ? {
          ...def.eggData,
          requiredMaterials: def.eggData.requiredMaterials?.map((m) => ({ ...m })),
        }
      : undefined,
  };
}

/**
 * Itens antigos removidos permanentemente do jogo (DigiEggs genericos antigos e
 * consumiveis antigos de HP/DS substituidos pela Loja da MudFrigimon).
 */
export const REMOVED_LEGACY_ITEM_KEYS: ReadonlySet<string> = new Set([
  'digiegg_dragon',
  'digiegg_fire',
  'digiegg_bird',
  'digiegg_plant',
  'digiegg_rock',
  'digiegg_insect',
  'digiegg_aquatic',
  'digiegg_devil',
  'digiegg_beast',
  'digiegg_kiwimon',
  'chip_hp_small',
  'disk_ds_small',
  'equip_cap_dats',
  'equip_jacket_dats',
  'equip_gloves_dats',
  'equip_ring_digital',
  'equip_digivice_proto',
]);

export function isRemovedLegacyItemKey(itemKey: string): boolean {
  return REMOVED_LEGACY_ITEM_KEYS.has(itemKey);
}

export function sanitizeInventoryItems(
  items: readonly InventoryItem[]
): InventoryItem[] {
  return items
    .filter((item) => item && !isRemovedLegacyItemKey(item.itemKey) && item.quantity > 0)
    .map(enrichInventoryItem);
}

/**
 * Verifica se um item do inventário não pode ser vendido em lojas ou negociações.
 * Regra oficial: DigiEgg de DemiMeramon e ovos especiais do Tutorial não podem ser vendidos.
 */
export function isItemNonSellable(
  item: Pick<InventoryItem, 'itemKey' | 'nonSellable' | 'eggData'>
): boolean {
  if (item.nonSellable === true) return true;
  if (item.itemKey === 'digiegg_demimeramon') return true;
  if (item.eggData?.isTutorialGift === true) return true;
  return false;
}

/**
 * Garante que itens antigos ou carregados da nuvem recebam icone oficial,
 * categoria correta, raridade e metadados atualizados do catalogo.
 */
export function enrichInventoryItem(item: InventoryItem): InventoryItem {
  const def = CATALOG_REGISTRY.get(item.itemKey);
  const nonSellable = isItemNonSellable(item);
  if (!def) {
    // Preserve existing items cleanly while ensuring sensible defaults
    return {
      ...item,
      rarity: item.rarity ?? (item.category === 'equip' ? 'incomum' : 'comum'),
      ...(nonSellable ? { nonSellable: true } : {}),
    };
  }

  const isTutorialEgg = Boolean(item.eggData?.isTutorialGift);
  const guaranteedUpTo = item.eggData?.guaranteedUpToLevel;
  const preUnlockedForms = item.eggData?.preUnlockedFormIds;
  const hasPreUnlockedBonus = Boolean(preUnlockedForms && preUnlockedForms.length > 2);

  return {
    ...item,
    name:
      isTutorialEgg && guaranteedUpTo
        ? `${def.name} (${guaranteedUpTo}/5 Garantido)`
        : def.name,
    category: def.category,
    description: isTutorialEgg
      ? `${def.description} Presente do Tutorial DATS: 100% garantido até ${guaranteedUpTo ?? 3}/5${hasPreUnlockedBonus ? ' e já nasce com Ultimate e Mega desbloqueadas!' : '.'}`
      : def.description,
    iconUrl: def.iconUrl,
    rarity: isTutorialEgg
      ? 'epico'
      : def.category === 'digiegg'
        ? 'comum'
        : (item.rarity ?? def.rarity),
    dataType: def.dataType,
    usageInfo: isTutorialEgg
      ? `Injete DATA na Incubadora do DATS com 100% de sucesso garantido até ${guaranteedUpTo ?? 3}/5 (sem risco de quebra).${hasPreUnlockedBonus ? ' Nasce com Ultimate e Mega já abertas!' : ''}`
      : def.usageInfo,
    hpRestore: def.hpRestore ?? item.hpRestore,
    dsRestore: def.dsRestore ?? item.dsRestore,
    ...(nonSellable ? { nonSellable: true } : {}),
    eggData: def.eggData
      ? {
          ...def.eggData,
          hatchLevel: item.eggData?.hatchLevel ?? def.eggData.hatchLevel ?? 0,
          maxHatchLevel: item.eggData?.maxHatchLevel ?? def.eggData.maxHatchLevel ?? 5,
          hatchedFormId: item.eggData?.hatchedFormId ?? def.eggData.hatchedFormId,
          requiredMaterials: def.eggData.requiredMaterials?.map((m) => ({ ...m })),
          usageRequirements: isTutorialEgg
            ? `Presente do Comandante Sampson: 100% garantido até ${guaranteedUpTo ?? 3}/5 (0% quebra) e nasce com Ultimate + Mega desbloqueadas!`
            : def.eggData.usageRequirements,
          ...(guaranteedUpTo ? { guaranteedUpToLevel: guaranteedUpTo } : {}),
          ...(preUnlockedForms && preUnlockedForms.length > 0
            ? { preUnlockedFormIds: [...preUnlockedForms] }
            : {}),
          ...(isTutorialEgg ? { isTutorialGift: true } : {}),
        }
      : item.eggData,
  };
}
