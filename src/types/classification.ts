import type { DigimonFormId } from './digimon';

/**
 * Visual classification system for Digimons.
 *
 * Strictly separates two independent taxonomies:
 *  1. Attributes (VA, VI, DA, NU, UN)
 *  2. Elements   (Fire, Light, Water, Ice, Wind, Thunder, Darkness, Wood, Iron, Earth, Neutral)
 *
 * Every Attribute and Element matchup in this registry is strictly symmetric:
 *   A is strongAgainst B  <==>  B is weakAgainst A.
 *
 * Does NOT alter existing Digimon sprites or combat stat calculations.
 */

export type ClassificationCategory = 'attribute' | 'element';

export type BuiltinDigimonAttributeId = 'VA' | 'VI' | 'DA' | 'NU' | 'UN';
export type DigimonAttributeId = BuiltinDigimonAttributeId | (string & {});

export type BuiltinDigimonElementId =
  | 'fire'
  | 'light'
  | 'water'
  | 'ice'
  | 'wind'
  | 'thunder'
  | 'darkness'
  | 'wood'
  | 'iron'
  | 'earth'
  | 'neutral';
export type DigimonElementId = BuiltinDigimonElementId | (string & {});

export interface ClassificationMatchup {
  /** Target ID within the SAME category */
  readonly targetId: string;
  /** Short tactical reason shown next to the target icon (e.g., "Incendeia", "Purifica") */
  readonly reasonPt: string;
}

export interface ClassificationMeta<TId extends string = string> {
  readonly id: TId;
  readonly category: ClassificationCategory;
  readonly code: string;
  readonly nameEn: string;
  readonly namePt: string;
  readonly roleLabelPt: string;
  readonly iconPath: string;
  readonly accentHex: string;
  readonly glowRgba: string;
  readonly descriptionPt: string;
  /** Tactical rule explaining how this classification behaves in combat */
  readonly combatRulePt: string;
  /** Matchups within the SAME category that this classification beats */
  readonly strongAgainst: readonly ClassificationMatchup[];
  /** Matchups within the SAME category that beat this classification */
  readonly weakAgainst: readonly ClassificationMatchup[];
  /** Optional tactical highlight note */
  readonly specialtyPt?: string;
  readonly optional?: boolean;
}

export interface DigimonClassification {
  readonly attribute: DigimonAttributeId;
  readonly element: DigimonElementId;
}

// ============================================================================
// 1. ATRIBUTOS (VA, VI, DA, NU, UN) — 100% Symmetric Attribute Matrix
// ============================================================================

const ATTRIBUTE_REGISTRY = new Map<
  DigimonAttributeId,
  ClassificationMeta<DigimonAttributeId>
>([
  [
    'VA',
    {
      id: 'VA',
      category: 'attribute',
      code: 'VA',
      nameEn: 'Vaccine',
      namePt: 'Vacina',
      roleLabelPt: 'Protocolo Imunológico',
      iconPath: '/assets/classifications/attributes/va.png',
      accentHex: '#38bdf8',
      glowRgba: 'rgba(56, 189, 248, 0.75)',
      descriptionPt:
        'Digimons guardiões programados para defender o equilíbrio do Mundo Digital e purificar códigos corrompidos.',
      combatRulePt:
        'No triângulo de atributos, Vacina causa dano ampliado contra Vírus (VI), mas sofre desvantagem tática contra Data (DA) e pressão anômala de Desconhecido (UN).',
      strongAgainst: [{ targetId: 'VI', reasonPt: 'Purifica códigos virais' }],
      weakAgainst: [
        { targetId: 'DA', reasonPt: 'Superado por análise Data' },
        { targetId: 'UN', reasonPt: 'Anomalia universal' },
      ],
    },
  ],
  [
    'VI',
    {
      id: 'VI',
      category: 'attribute',
      code: 'VI',
      nameEn: 'Virus',
      namePt: 'Vírus',
      roleLabelPt: 'Código Invasor',
      iconPath: '/assets/classifications/attributes/vi.png',
      accentHex: '#c084fc',
      glowRgba: 'rgba(192, 132, 252, 0.78)',
      descriptionPt:
        'Digimons ofensivos que alteram o ambiente digital ao redor, especializados em corromper e subjugar sistemas estruturados.',
      combatRulePt:
        'No triângulo de atributos, Vírus domina confrontos contra Data (DA), porém é vulnerável à contenção de Vacina (VA) e ao atributo Desconhecido (UN).',
      strongAgainst: [{ targetId: 'DA', reasonPt: 'Corrompe estruturas Data' }],
      weakAgainst: [
        { targetId: 'VA', reasonPt: 'Contido por Vacina' },
        { targetId: 'UN', reasonPt: 'Anomalia universal' },
      ],
    },
  ],
  [
    'DA',
    {
      id: 'DA',
      category: 'attribute',
      code: 'DA',
      nameEn: 'Data',
      namePt: 'Data',
      roleLabelPt: 'Estrutura Adaptativa',
      iconPath: '/assets/classifications/attributes/da.png',
      accentHex: '#4ade80',
      glowRgba: 'rgba(74, 222, 128, 0.75)',
      descriptionPt:
        'Digimons versáteis que se adaptam rapidamente ao campo de batalha, lendo e quebrando os padrões defensivos de guardiões.',
      combatRulePt:
        'No triângulo de atributos, Data leva vantagem direta sobre Vacina (VA), mas sua arquitetura é vulnerável à invasão de Vírus (VI) e a Desconhecido (UN).',
      strongAgainst: [{ targetId: 'VA', reasonPt: 'Quebra padrões Vacina' }],
      weakAgainst: [
        { targetId: 'VI', reasonPt: 'Corrompido por Vírus' },
        { targetId: 'UN', reasonPt: 'Anomalia universal' },
      ],
    },
  ],
  [
    'NU',
    {
      id: 'NU',
      category: 'attribute',
      code: 'NU',
      nameEn: 'Neutral',
      namePt: 'Neutro',
      roleLabelPt: 'Equilíbrio Independente',
      iconPath: '/assets/classifications/attributes/nu.png',
      accentHex: '#facc15',
      glowRgba: 'rgba(250, 204, 21, 0.75)',
      descriptionPt:
        'Atributo estável que opera fora do triângulo clássico (VA / VI / DA), mantendo consistência sem polarização.',
      combatRulePt:
        'Causa e recebe dano equilibrado contra Vacina, Vírus e Data — sem bônus ou penalidades entre eles. Sofre desvantagem apenas diante de Desconhecido (UN).',
      strongAgainst: [],
      weakAgainst: [{ targetId: 'UN', reasonPt: 'Anomalia universal' }],
      specialtyPt: 'Desempenho equilibrado contra VA, VI e DA.',
    },
  ],
  [
    'UN',
    {
      id: 'UN',
      category: 'attribute',
      code: 'UN',
      nameEn: 'Unknown',
      namePt: 'Desconhecido',
      roleLabelPt: 'Anomalia Digital',
      iconPath: '/assets/classifications/attributes/un.png',
      accentHex: '#e2e8f0',
      glowRgba: 'rgba(226, 232, 240, 0.7)',
      descriptionPt:
        'Classificação rara reservada a entidades anômalas que existem fora das regras convencionais do Mundo Digital.',
      combatRulePt:
        'Exerce pressão ofensiva superior sobre todos os atributos padrão (VA, VI, DA e NU) e não possui fraqueza de atributo.',
      strongAgainst: [
        { targetId: 'VA', reasonPt: 'Ignora defesa Vacina' },
        { targetId: 'VI', reasonPt: 'Supera código Vírus' },
        { targetId: 'DA', reasonPt: 'Quebra leitura Data' },
        { targetId: 'NU', reasonPt: 'Quebra neutralidade' },
      ],
      weakAgainst: [],
      specialtyPt: 'Sem fraqueza de atributo; apenas outro UN equilibra o duelo.',
    },
  ],
]);

// ============================================================================
// 2. ELEMENTOS (11 Elements) — 100% Symmetric & Intuitively Complete Matrix
//    Every strongAgainst edge has its exact inverse weakAgainst edge.
// ============================================================================

const ELEMENT_REGISTRY = new Map<
  DigimonElementId,
  ClassificationMeta<DigimonElementId>
>([
  [
    'fire',
    {
      id: 'fire',
      category: 'element',
      code: 'FIRE',
      nameEn: 'Fire',
      namePt: 'Fogo',
      roleLabelPt: 'Combustão & Fusão',
      iconPath: '/assets/classifications/elements/fire.png',
      accentHex: '#fb713b',
      glowRgba: 'rgba(249, 115, 22, 0.78)',
      descriptionPt:
        'Energia térmica de alto poder destrutivo. Consome vegetação e madeira, derrete defesas criogênicas e funde ligas metálicas sob calor extremo.',
      combatRulePt:
        'Excelente ofensiva contra Madeira/Planta, Gelo e Ferro. Deve evitar confrontos diretos contra Água (extingue chamas) e Terra (abafa a combustão).',
      strongAgainst: [
        { targetId: 'wood', reasonPt: 'Incendeia plantas e madeira' },
        { targetId: 'ice', reasonPt: 'Derrete defesas de gelo' },
        { targetId: 'iron', reasonPt: 'Funde armaduras metálicas' },
      ],
      weakAgainst: [
        { targetId: 'water', reasonPt: 'Extingue as chamas' },
        { targetId: 'earth', reasonPt: 'Abafa a combustão' },
      ],
    },
  ],
  [
    'water',
    {
      id: 'water',
      category: 'element',
      code: 'WATER',
      nameEn: 'Water',
      namePt: 'Água',
      roleLabelPt: 'Pressão Hidráulica',
      iconPath: '/assets/classifications/elements/water.png',
      accentHex: '#3b82f6',
      glowRgba: 'rgba(59, 130, 246, 0.78)',
      descriptionPt:
        'Força fluida e adaptável capaz de extinguir incêndios e desgastar rochas sólidas com pressão constante.',
      combatRulePt:
        'Domina Fogo e erode Terra com facilidade. Sofre forte vulnerabilidade contra Gelo (congelamento), Trovão (alta condutividade) e Madeira/Planta (absorção).',
      strongAgainst: [
        { targetId: 'fire', reasonPt: 'Apaga chamas intensas' },
        { targetId: 'earth', reasonPt: 'Erode rocha e solo' },
      ],
      weakAgainst: [
        { targetId: 'ice', reasonPt: 'Congela o fluxo de água' },
        { targetId: 'thunder', reasonPt: 'Conduz descarga elétrica' },
        { targetId: 'wood', reasonPt: 'Absorvida por raízes' },
      ],
    },
  ],
  [
    'ice',
    {
      id: 'ice',
      category: 'element',
      code: 'ICE',
      nameEn: 'Ice',
      namePt: 'Gelo',
      roleLabelPt: 'Zero Absoluto',
      iconPath: '/assets/classifications/elements/ice.png',
      accentHex: '#67e8f9',
      glowRgba: 'rgba(103, 232, 249, 0.78)',
      descriptionPt:
        'Energia criogênica cristalina capaz de solidificar líquidos, queimar vegetação com geada severa e congelar correntes aéreas.',
      combatRulePt:
        'Vantagem decisiva contra Água, Madeira/Planta e Vento. Porém, derrete rapidamente diante do Fogo e se estilhaça sob impactos de Ferro.',
      strongAgainst: [
        { targetId: 'water', reasonPt: 'Congela a água' },
        { targetId: 'wood', reasonPt: 'Geada seca plantas' },
        { targetId: 'wind', reasonPt: 'Congela correntes aéreas' },
      ],
      weakAgainst: [
        { targetId: 'fire', reasonPt: 'Derretido pelo calor' },
        { targetId: 'iron', reasonPt: 'Estilhaçado por metal' },
      ],
    },
  ],
  [
    'wood',
    {
      id: 'wood',
      category: 'element',
      code: 'WOOD',
      nameEn: 'Wood',
      namePt: 'Madeira / Planta',
      roleLabelPt: 'Vitalidade Botânica',
      iconPath: '/assets/classifications/elements/wood.png',
      accentHex: '#4ade80',
      glowRgba: 'rgba(74, 222, 128, 0.75)',
      descriptionPt:
        'Energia orgânica das florestas digitais. Suas raízes drenam água, rompem rochas e atuam como isolante natural contra descargas elétricas.',
      combatRulePt:
        'Forte contra Água (absorção), Terra (raízes rompem o solo) e Trovão (isolante natural). Vulnerável a Fogo (combustão), Gelo (geada) e Vento (cortes aéreos).',
      strongAgainst: [
        { targetId: 'water', reasonPt: 'Absorve e drena água' },
        { targetId: 'earth', reasonPt: 'Raízes rompem o solo' },
        { targetId: 'thunder', reasonPt: 'Isola descargas elétricas' },
      ],
      weakAgainst: [
        { targetId: 'fire', reasonPt: 'Queima rapidamente' },
        { targetId: 'ice', reasonPt: 'Sofre com geada intensa' },
        { targetId: 'wind', reasonPt: 'Cortada por ventos' },
      ],
    },
  ],
  [
    'earth',
    {
      id: 'earth',
      category: 'element',
      code: 'EARTH',
      nameEn: 'Earth',
      namePt: 'Terra',
      roleLabelPt: 'Força Sísmica',
      iconPath: '/assets/classifications/elements/earth.png',
      accentHex: '#f59e0b',
      glowRgba: 'rgba(245, 158, 11, 0.76)',
      descriptionPt:
        'Poder telúrico e rochoso de altíssima resistência. Sufoca incêndios, aterra relâmpagos e esmaga blindagens metálicas com impacto sísmico.',
      combatRulePt:
        'Excelente contra Fogo, Trovão e Ferro. Sofre desvantagem diante de Água (erosão), Madeira/Planta (raízes) e Vento (tempestades e superioridade aérea).',
      strongAgainst: [
        { targetId: 'fire', reasonPt: 'Abafa e sufoca o fogo' },
        { targetId: 'thunder', reasonPt: 'Aterra a eletricidade' },
        { targetId: 'iron', reasonPt: 'Esmaga armaduras rígidas' },
      ],
      weakAgainst: [
        { targetId: 'water', reasonPt: 'Erodida pela água' },
        { targetId: 'wood', reasonPt: 'Rompida por raízes' },
        { targetId: 'wind', reasonPt: 'Dispersa por vendavais' },
      ],
    },
  ],
  [
    'thunder',
    {
      id: 'thunder',
      category: 'element',
      code: 'THUNDER',
      nameEn: 'Thunder',
      namePt: 'Trovão',
      roleLabelPt: 'Alta Voltagem',
      iconPath: '/assets/classifications/elements/thunder.png',
      accentHex: '#facc15',
      glowRgba: 'rgba(250, 204, 21, 0.8)',
      descriptionPt:
        'Descargas elétricas instantâneas que percorrem meios condutores e rasgam os céus em alta velocidade.',
      combatRulePt:
        'Devastador contra Água, Ferro (alta condutividade) e Vento (domínio de tempestades). Neutralizado por Terra (aterramento) e Madeira/Planta (isolamento).',
      strongAgainst: [
        { targetId: 'water', reasonPt: 'Eletrifica meios líquidos' },
        { targetId: 'iron', reasonPt: 'Sobrecarrega metais' },
        { targetId: 'wind', reasonPt: 'Rasga correntes aéreas' },
      ],
      weakAgainst: [
        { targetId: 'earth', reasonPt: 'Aterrado pelo solo' },
        { targetId: 'wood', reasonPt: 'Bloqueado por isolante' },
      ],
    },
  ],
  [
    'iron',
    {
      id: 'iron',
      category: 'element',
      code: 'IRON',
      nameEn: 'Iron',
      namePt: 'Ferro',
      roleLabelPt: 'Liga Blindada',
      iconPath: '/assets/classifications/elements/iron.png',
      accentHex: '#cbd5e1',
      glowRgba: 'rgba(203, 213, 225, 0.72)',
      descriptionPt:
        'Metal pesado e ligas tecnológicas de alta dureza capazes de estilhaçar gelo sólido e resistir a rajadas cortantes.',
      combatRulePt:
        'Supera Gelo (impacto sólido) e Vento (peso e corte aerodinâmico). Vulnerável a Fogo (fusão), Trovão (condução elétrica) e Terra (pressão sísmica).',
      strongAgainst: [
        { targetId: 'ice', reasonPt: 'Estilhaça cristais de gelo' },
        { targetId: 'wind', reasonPt: 'Corta e resiste a rajadas' },
      ],
      weakAgainst: [
        { targetId: 'fire', reasonPt: 'Fundido por calor extremo' },
        { targetId: 'thunder', reasonPt: 'Conduz sobrecarga elétrica' },
        { targetId: 'earth', reasonPt: 'Esmagado por força sísmica' },
      ],
    },
  ],
  [
    'wind',
    {
      id: 'wind',
      category: 'element',
      code: 'WIND',
      nameEn: 'Wind',
      namePt: 'Vento',
      roleLabelPt: 'Velocidade & Corte Aéreo',
      iconPath: '/assets/classifications/elements/wind.png',
      accentHex: '#34d399',
      glowRgba: 'rgba(52, 211, 153, 0.75)',
      descriptionPt:
        'Lâminas atmosféricas e ciclones velozes que rasgam folhagens e dominam alvos terrestres a partir do ar.',
      combatRulePt:
        'Forte contra Madeira/Planta (lâminas de vento) e Terra (erosão eólica e mobilidade aérea). Sofre contra Gelo, Trovão e armaduras densas de Ferro.',
      strongAgainst: [
        { targetId: 'wood', reasonPt: 'Corta folhas e galhos' },
        { targetId: 'earth', reasonPt: 'Superioridade aérea / erosão' },
      ],
      weakAgainst: [
        { targetId: 'ice', reasonPt: 'Congelado por tempestades' },
        { targetId: 'thunder', reasonPt: 'Rompido por relâmpagos' },
        { targetId: 'iron', reasonPt: 'Bloqueado por blindagem' },
      ],
    },
  ],
  [
    'light',
    {
      id: 'light',
      category: 'element',
      code: 'LIGHT',
      nameEn: 'Light',
      namePt: 'Luz',
      roleLabelPt: 'Energia Radiante',
      iconPath: '/assets/classifications/elements/light.png',
      accentHex: '#fde047',
      glowRgba: 'rgba(253, 224, 71, 0.78)',
      descriptionPt:
        'Radiação solar e energia sagrada de altíssima pureza, mantida fora do ciclo natural e oposta diretamente às trevas.',
      combatRulePt:
        'Em confronto polarizado com Escuridão, ambos causam e recebem dano amplificado entre si. Mantém neutralidade estável contra todos os demais elementos.',
      strongAgainst: [
        { targetId: 'darkness', reasonPt: 'Purifica energia sombria' },
      ],
      weakAgainst: [
        { targetId: 'darkness', reasonPt: 'Duelo polarizado (mútuo)' },
      ],
      specialtyPt: 'Neutro contra os 8 elementos naturais.',
    },
  ],
  [
    'darkness',
    {
      id: 'darkness',
      category: 'element',
      code: 'DARK',
      nameEn: 'Darkness',
      namePt: 'Escuridão',
      roleLabelPt: 'Energia Abissal',
      iconPath: '/assets/classifications/elements/darkness.png',
      accentHex: '#a855f7',
      glowRgba: 'rgba(168, 85, 247, 0.78)',
      descriptionPt:
        'Energia sombria e corrosiva originada das regiões obscuras do Mundo Digital, em oposição direta à Luz.',
      combatRulePt:
        'Em confronto polarizado com Luz, ambos causam e recebem dano crítico mútuo. Mantém neutralidade estável diante dos elementos naturais.',
      strongAgainst: [{ targetId: 'light', reasonPt: 'Corrompe energia luminosa' }],
      weakAgainst: [{ targetId: 'light', reasonPt: 'Duelo polarizado (mútuo)' }],
      specialtyPt: 'Neutro contra os 8 elementos naturais.',
    },
  ],
  [
    'neutral',
    {
      id: 'neutral',
      category: 'element',
      code: 'NEUTRAL',
      nameEn: 'Neutral',
      namePt: 'Neutro',
      roleLabelPt: 'Sem Polaridade',
      iconPath: '/assets/classifications/elements/neutral.png',
      accentHex: '#e2e8f0',
      glowRgba: 'rgba(226, 232, 240, 0.68)',
      descriptionPt:
        'Elemento puro sem afinidade elemental específica, priorizando golpes físicos e energia digital bruta.',
      combatRulePt:
        'Não recebe bônus elemental, mas também não sofre nenhuma fraqueza contra os 10 elementos ativos — garantindo dano confiável em qualquer batalha.',
      strongAgainst: [],
      weakAgainst: [],
      specialtyPt: 'Estabilidade total: zero fraquezas elementais.',
      optional: true,
    },
  ],
]);

// ============================================================================
// EXTENSIBLE REGISTRY API (allows adding new classifications cleanly)
// ============================================================================

export function registerDigimonAttribute(
  meta: Omit<ClassificationMeta<DigimonAttributeId>, 'category'>
): void {
  ATTRIBUTE_REGISTRY.set(meta.id, { ...meta, category: 'attribute' });
}

export function registerDigimonElement(
  meta: Omit<ClassificationMeta<DigimonElementId>, 'category'>
): void {
  ELEMENT_REGISTRY.set(meta.id, { ...meta, category: 'element' });
}

export function getDigimonAttributeMeta(
  id: DigimonAttributeId
): ClassificationMeta<DigimonAttributeId> {
  return ATTRIBUTE_REGISTRY.get(id) ?? ATTRIBUTE_REGISTRY.get('UN')!;
}

export function getDigimonElementMeta(
  id: DigimonElementId
): ClassificationMeta<DigimonElementId> {
  return ELEMENT_REGISTRY.get(id) ?? ELEMENT_REGISTRY.get('neutral')!;
}

export function getClassificationMetaByCategory(
  category: ClassificationCategory,
  id: string
): ClassificationMeta {
  if (category === 'attribute') return getDigimonAttributeMeta(id);
  return getDigimonElementMeta(id);
}

export function listDigimonAttributes(): readonly ClassificationMeta<DigimonAttributeId>[] {
  return Array.from(ATTRIBUTE_REGISTRY.values());
}

export function listDigimonElements(): readonly ClassificationMeta<DigimonElementId>[] {
  return Array.from(ELEMENT_REGISTRY.values());
}

// ============================================================================
// CANONICAL DIGIMON FORM & WILD MONSTER CLASSIFICATIONS
// (Independent visual metadata — does NOT alter sprites or combat stats)
// ============================================================================

const PLAYABLE_CLASSIFICATION_MAP = new Map<string, DigimonClassification>([
  // Agumon Evolution Line (Savers)
  ['agumon', { attribute: 'VA', element: 'fire' }],
  ['geogreymon', { attribute: 'VA', element: 'fire' }],
  ['rizegreymon', { attribute: 'VA', element: 'fire' }],
  ['shinegreymon', { attribute: 'VA', element: 'light' }],

  // Agumon Classic Evolution Line
  ['agumon_classic', { attribute: 'VA', element: 'fire' }],
  ['greymon', { attribute: 'VA', element: 'fire' }],
  ['metalgreymon', { attribute: 'VA', element: 'fire' }],
  ['wargreymon', { attribute: 'VA', element: 'fire' }],

  // Gaomon Evolution Line
  ['gaomon', { attribute: 'DA', element: 'wind' }],
  ['gaogamon', { attribute: 'DA', element: 'wind' }],
  ['machgaogamon', { attribute: 'DA', element: 'wind' }],
  ['miragegaogamon', { attribute: 'DA', element: 'light' }],

  // Lalamon Evolution Line
  ['lalamon', { attribute: 'DA', element: 'wood' }],
  ['sunflowmon', { attribute: 'DA', element: 'wood' }],
  ['lilamon', { attribute: 'DA', element: 'wood' }],
  ['rosemon', { attribute: 'DA', element: 'wood' }],

  // Guilmon Evolution Line
  ['guilmon', { attribute: 'VI', element: 'fire' }],
  ['growlmon', { attribute: 'VI', element: 'fire' }],
  ['megalogrowlmon', { attribute: 'VI', element: 'fire' }],
  ['dukemon', { attribute: 'VI', element: 'light' }],

  // Gabumon Classic Evolution Line (DMO: entire line is Data / Ice)
  ['gabumon', { attribute: 'DA', element: 'ice' }],
  ['garurumon', { attribute: 'DA', element: 'ice' }],
  ['weregarurumon', { attribute: 'DA', element: 'ice' }],
  ['metalgarurumon', { attribute: 'DA', element: 'ice' }],

  // Impmon Evolution Line (Seven Great Demon Lords — Beelzemon)
  ['impmon', { attribute: 'VI', element: 'darkness' }],
  ['icedevimon', { attribute: 'VI', element: 'ice' }],
  ['skullsatamon', { attribute: 'VI', element: 'darkness' }],
  ['beelzemon', { attribute: 'VI', element: 'darkness' }],

  // Veemon Evolution Line (Royal Knights — UlforceVeedramon)
  ['veemon', { attribute: 'VA', element: 'light' }],
  ['veedramon', { attribute: 'VA', element: 'wind' }],
  ['aeroveedramon', { attribute: 'VA', element: 'wind' }],
  ['ulforceveedramon', { attribute: 'VA', element: 'light' }],

  // Keramon Evolution Line (Digital Anomaly — Diaboromon)
  ['keramon', { attribute: 'UN', element: 'darkness' }],
  ['chrysalimon', { attribute: 'UN', element: 'darkness' }],
  ['infermon', { attribute: 'UN', element: 'darkness' }],
  ['diaboromon', { attribute: 'UN', element: 'darkness' }],

  // DemiMeramon Evolution Line (Meramon / Boltmon)
  ['demimeramon', { attribute: 'DA', element: 'fire' }],
  ['meramon', { attribute: 'DA', element: 'fire' }],
  ['skullmeramon', { attribute: 'DA', element: 'fire' }],
  ['boltmon', { attribute: 'DA', element: 'iron' }],

  // Hawkmon Evolution Line (Silphymon / Gryphonmon)
  ['hawkmon', { attribute: 'DA', element: 'wind' }],
  ['aquilamon', { attribute: 'DA', element: 'wind' }],
  ['silphymon', { attribute: 'DA', element: 'wind' }],
  ['gryphonmon', { attribute: 'DA', element: 'wind' }],

  // Tentomon Evolution Line (Kabuterimon / HerculesKabuterimon)
  ['tentomon', { attribute: 'VA', element: 'thunder' }],
  ['kabuterimon', { attribute: 'VA', element: 'thunder' }],
  ['megakabuterimon', { attribute: 'VA', element: 'thunder' }],
  ['herculeskabuterimon', { attribute: 'VA', element: 'thunder' }],

  // Drimogemon Evolution Line (Digmon / Giromon / HiAndromon)
  ['drimogemon', { attribute: 'DA', element: 'earth' }],
  ['digmon', { attribute: 'DA', element: 'earth' }],
  ['giromon', { attribute: 'VA', element: 'iron' }],
  ['hiandromon', { attribute: 'VA', element: 'thunder' }],

  // Kiwimon Evolution Line (Deramon / Blossomon / Griffomon)
  ['kiwimon', { attribute: 'DA', element: 'wood' }],
  ['deramon', { attribute: 'DA', element: 'wind' }],
  ['blossomon', { attribute: 'DA', element: 'wood' }],
  ['griffomon', { attribute: 'DA', element: 'wind' }],

  // Gotsumon Evolution Line (Icemon / Insekimon / MetalEtemon)
  ['gotsumon', { attribute: 'DA', element: 'earth' }],
  ['icemon', { attribute: 'DA', element: 'ice' }],
  ['insekimon', { attribute: 'DA', element: 'earth' }],
  ['metaletemon', { attribute: 'VI', element: 'iron' }],

  // Elecmon Evolution Line (Leomon / IceLeomon / SaberLeomon)
  ['elecmon', { attribute: 'DA', element: 'thunder' }],
  ['leomon', { attribute: 'VA', element: 'earth' }],
  ['iceleomon', { attribute: 'VA', element: 'ice' }],
  ['saberleomon', { attribute: 'DA', element: 'iron' }],

  // Renamon Evolution Line (Kyubimon / Taomon / Sakuyamon)
  ['renamon', { attribute: 'DA', element: 'wind' }],
  ['kyubimon', { attribute: 'DA', element: 'fire' }],
  ['taomon', { attribute: 'DA', element: 'light' }],
  ['sakuyamon', { attribute: 'DA', element: 'light' }],

  // Monodramon Evolution Line (Strikedramon / Cyberdramon / Justimon)
  ['monodramon', { attribute: 'VA', element: 'fire' }],
  ['strikedramon', { attribute: 'VA', element: 'fire' }],
  ['cyberdramon', { attribute: 'VA', element: 'iron' }],
  ['justimon', { attribute: 'VA', element: 'light' }],

  // Biyomon Evolution Line (Birdramon / Garudamon / Phoenixmon)
  ['biyomon', { attribute: 'VA', element: 'wind' }],
  ['birdramon', { attribute: 'VA', element: 'fire' }],
  ['garudamon', { attribute: 'VA', element: 'wind' }],
  ['phoenixmon', { attribute: 'VA', element: 'fire' }],

  // Kunemon Evolution Line (Flymon / Okuwamon / GranKuwagamon)
  ['kunemon', { attribute: 'VI', element: 'thunder' }],
  ['flymon', { attribute: 'VI', element: 'wind' }],
  ['okuwamon', { attribute: 'VI', element: 'wood' }],
  ['grankuwagamon', { attribute: 'VI', element: 'darkness' }],
]);

const WILD_CLASSIFICATION_MAP = new Map<string, DigimonClassification>([
  ['koromon', { attribute: 'DA', element: 'fire' }],
  ['tsunomon', { attribute: 'DA', element: 'earth' }],
  ['gizamon', { attribute: 'VI', element: 'thunder' }],
  ['goblimon', { attribute: 'VI', element: 'fire' }],
  ['demidevimon', { attribute: 'VI', element: 'darkness' }],
  ['palmon', { attribute: 'DA', element: 'wood' }],
  ['kunemon', { attribute: 'VI', element: 'thunder' }],
  ['mushroomon', { attribute: 'VI', element: 'wood' }],
  ['woodmon', { attribute: 'VI', element: 'wood' }],
  ['kiwimon', { attribute: 'DA', element: 'wood' }],
  ['kuwagamon', { attribute: 'VI', element: 'wood' }],
]);

const FALLBACK_CLASSIFICATION: DigimonClassification = {
  attribute: 'UN',
  element: 'neutral',
};

export function registerDigimonFormClassification(
  formId: DigimonFormId | string,
  classification: DigimonClassification
): void {
  PLAYABLE_CLASSIFICATION_MAP.set(formId, classification);
}

export function registerWildDigimonClassification(
  speciesId: string,
  classification: DigimonClassification
): void {
  WILD_CLASSIFICATION_MAP.set(speciesId, classification);
}

export function getDigimonFormClassification(
  formId: DigimonFormId | string
): DigimonClassification {
  return PLAYABLE_CLASSIFICATION_MAP.get(formId) ?? FALLBACK_CLASSIFICATION;
}

export function getWildDigimonClassification(
  speciesId: string
): DigimonClassification {
  return (
    PLAYABLE_CLASSIFICATION_MAP.get(speciesId) ??
    WILD_CLASSIFICATION_MAP.get(speciesId) ??
    FALLBACK_CLASSIFICATION
  );
}
