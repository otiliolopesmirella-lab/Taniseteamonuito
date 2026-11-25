import {
  clampHatchSizePct,
  computeHatchPowerMultiplier,
} from './itemsCatalog';
import {
  getDigimonAttributeMeta,
  getDigimonElementMeta,
  getDigimonFormClassification,
  getWildDigimonClassification,
  type DigimonElementId,
} from '../types/classification';
import type { DigimonFormId } from '../types/digimon';
import type { HatchQualityGrade } from '../types/hud';

export type DmoSkillSlot = 'f1' | 'f2';

export interface DmoSkillSpec {
  readonly slot: DmoSkillSlot;
  readonly name: string;
  readonly element: DigimonElementId;
  readonly rangeLabelPt: string;
  readonly dsCost: number;
  readonly cooldownSec: number;
  /** Official DMO-inspired base skill power before AT & level scaling */
  readonly baseDamage: number;
  /** How strongly the Digimon's live AT contributes to this skill's damage */
  readonly atScalingRatio: number;
  readonly descriptionPt: string;
}

export interface DigimonSkillPair {
  readonly f1: DmoSkillSpec;
  readonly f2: DmoSkillSpec;
}

export interface DmoSkillDamageBreakdown {
  readonly spec: DmoSkillSpec;
  readonly basePowerPart: number;
  readonly atBonusPart: number;
  /** Damage against a neutral mob (no attribute/element advantage) */
  readonly neutral: number;
  /** Damage with Attribute advantage (+25%) */
  readonly attrAdvantage: number;
  /** Damage with Element advantage (+25%) */
  readonly elemAdvantage: number;
  /** Damage with BOTH Attribute + Element advantage (+50%) */
  readonly fullAdvantage: number;
  /** Damage against a mob with resistance/disadvantage (-15%) */
  readonly disadvantage: number;
  /** Critical hit (1.5x) on a neutral mob */
  readonly critNeutral: number;
  /** Critical hit (1.5x) with Attribute advantage (1.875x) */
  readonly critAttrAdvantage: number;
  /** Critical hit (1.5x) with Double Advantage (2.25x) */
  readonly critFullAdvantage: number;
}

export interface DmoMatchupResult {
  readonly multiplier: number;
  readonly attrState: 'strong' | 'weak' | 'neutral';
  readonly elemState: 'strong' | 'weak' | 'neutral';
  readonly labelPt: string | null;
}

/**
 * Official Digimon Masters Online (DMO Wiki) F1 & F2 skill catalog for all 44 playable Digimon forms.
 * Skill names, elements, DS costs, cooldowns, base powers, and combat descriptions mirror DMO Wiki.
 */
export const DMO_SKILL_CATALOG: Record<DigimonFormId, DigimonSkillPair> = {
  // =========================================================================
  // 1. AGUMON (SAVERS) LINE — Agumon -> GeoGreymon -> RizeGreymon -> ShineGreymon
  // =========================================================================
  agumon: {
    f1: {
      slot: 'f1',
      name: 'Baby Burner',
      element: 'fire',
      rangeLabelPt: 'Média Distância · Alvo Único',
      dsCost: 15,
      cooldownSec: 3.0,
      baseDamage: 68,
      atScalingRatio: 1.55,
      descriptionPt:
        'Concentra chamas intensas na boca e dispara uma rajada de fogo mais quente que o Baby Flame diretamente no mob.',
    },
    f2: {
      slot: 'f2',
      name: 'Sharp Claws',
      element: 'fire',
      rangeLabelPt: 'Curto Alcance · Alvo Único',
      dsCost: 35,
      cooldownSec: 5.0,
      baseDamage: 148,
      atScalingRatio: 2.35,
      descriptionPt:
        'Avança sobre o inimigo desferindo um corte flamejante duplo com suas garras afiadas.',
    },
  },
  geogreymon: {
    f1: {
      slot: 'f1',
      name: 'Mega Flame',
      element: 'fire',
      rangeLabelPt: 'Média Distância · Alvo Único',
      dsCost: 32,
      cooldownSec: 4.0,
      baseDamage: 195,
      atScalingRatio: 1.72,
      descriptionPt:
        'Cospe uma esfera incandescente de altíssima temperatura que explode ao atingir o alvo.',
    },
    f2: {
      slot: 'f2',
      name: 'Mega Burst',
      element: 'fire',
      rangeLabelPt: 'Longa Distância · Explosão',
      dsCost: 65,
      cooldownSec: 6.0,
      baseDamage: 385,
      atScalingRatio: 2.58,
      descriptionPt:
        'Acumula energia ígnea ao extremo e libera uma onda térmica devastadora que incinera mobs à frente.',
    },
  },
  rizegreymon: {
    f1: {
      slot: 'f1',
      name: 'Trident Revolver',
      element: 'fire',
      rangeLabelPt: 'Longa Distância · Disparo Triplo',
      dsCost: 68,
      cooldownSec: 5.0,
      baseDamage: 465,
      atScalingRatio: 1.9,
      descriptionPt:
        'Dispara três projéteis superaquecidos em rápida sucessão pelo revólver Chrome Digizoid em seu braço.',
    },
    f2: {
      slot: 'f2',
      name: 'Rising Destroyer',
      element: 'fire',
      rangeLabelPt: 'Longa Distância · Raio Solar',
      dsCost: 125,
      cooldownSec: 8.0,
      baseDamage: 920,
      atScalingRatio: 2.85,
      descriptionPt:
        'Canaliza energia solar nas asas e no peito para disparar um feixe destruidor de alto impacto.',
    },
  },
  shinegreymon: {
    f1: {
      slot: 'f1',
      name: 'Glorious Burst',
      element: 'light',
      rangeLabelPt: 'Longa Distância · Explosão Solar',
      dsCost: 118,
      cooldownSec: 6.0,
      baseDamage: 1080,
      atScalingRatio: 2.15,
      descriptionPt:
        'Abre suas asas de energia luminosa e libera uma tempestade solar de atributo Luz sobre o inimigo.',
    },
    f2: {
      slot: 'f2',
      name: 'GeoGrey Sword',
      element: 'fire',
      rangeLabelPt: 'Curto/Médio Alcance · Corte Supremo',
      dsCost: 215,
      cooldownSec: 10.0,
      baseDamage: 2160,
      atScalingRatio: 3.15,
      descriptionPt:
        'Invoca a lendária Espada GeoGrey envolta em chamas solares para partir o alvo com dano massivo.',
    },
  },

  // =========================================================================
  // 2. AGUMON (CLASSIC) LINE — Agumon Classic -> Greymon -> MetalGreymon -> WarGreymon
  // =========================================================================
  agumon_classic: {
    f1: {
      slot: 'f1',
      name: 'Sharp Claws',
      element: 'fire',
      rangeLabelPt: 'Curto Alcance · Alvo Único',
      dsCost: 14,
      cooldownSec: 3.0,
      baseDamage: 66,
      atScalingRatio: 1.55,
      descriptionPt:
        'Salta para frente e rasga o inimigo com um golpe rápido de garras carregadas de calor.',
    },
    f2: {
      slot: 'f2',
      name: 'Pepper Breath',
      element: 'fire',
      rangeLabelPt: 'Média Distância · Projétil',
      dsCost: 32,
      cooldownSec: 5.0,
      baseDamage: 152,
      atScalingRatio: 2.42,
      descriptionPt:
        'A clássica bola de fogo Baby Flame disparada da boca com excelente dano por DS.',
    },
  },
  greymon: {
    f1: {
      slot: 'f1',
      name: 'Great Horn Attack',
      element: 'fire',
      rangeLabelPt: 'Curto Alcance · Investida',
      dsCost: 30,
      cooldownSec: 4.0,
      baseDamage: 198,
      atScalingRatio: 1.75,
      descriptionPt:
        'Avança com o elmo blindado e perfura o alvo com seus chifres gigantes em alta velocidade.',
    },
    f2: {
      slot: 'f2',
      name: 'Mega Flame',
      element: 'fire',
      rangeLabelPt: 'Média Distância · Explosão',
      dsCost: 62,
      cooldownSec: 6.0,
      baseDamage: 395,
      atScalingRatio: 2.62,
      descriptionPt:
        'Dispara uma gigantesca rajada de fogo de altíssima temperatura que pulveriza a defesa do mob.',
    },
  },
  metalgreymon: {
    f1: {
      slot: 'f1',
      name: 'Trident Arm',
      element: 'iron',
      rangeLabelPt: 'Média Distância · Garra Metálica',
      dsCost: 65,
      cooldownSec: 5.0,
      baseDamage: 475,
      atScalingRatio: 1.92,
      descriptionPt:
        'Lança sua garra cibernética de Chrome Digizoid conectada por cabo de aço para perfurar o alvo.',
    },
    f2: {
      slot: 'f2',
      name: 'Giga Destroyer',
      element: 'fire',
      rangeLabelPt: 'Longa Distância · Mísseis Duplos',
      dsCost: 120,
      cooldownSec: 8.0,
      baseDamage: 945,
      atScalingRatio: 2.9,
      descriptionPt:
        'Abre a escotilha peitoral e dispara dois mísseis orgânicos termonucleares com poder de destruição massivo.',
    },
  },
  wargreymon: {
    f1: {
      slot: 'f1',
      name: 'Great Tornado',
      element: 'fire',
      rangeLabelPt: 'Curto/Médio Alcance · Furacão',
      dsCost: 112,
      cooldownSec: 6.0,
      baseDamage: 1120,
      atScalingRatio: 2.2,
      descriptionPt:
        'Gira em velocidade supersônica como um tornado flamejante atravessando o inimigo com as Dramon Killers.',
    },
    f2: {
      slot: 'f2',
      name: 'Terra Force',
      element: 'fire',
      rangeLabelPt: 'Longa Distância · Esfera Solar',
      dsCost: 225,
      cooldownSec: 10.0,
      baseDamage: 2280,
      atScalingRatio: 3.28,
      descriptionPt:
        'Condensa toda a energia atmosférica em uma esfera solar colosal (Gaia Force) e arremessa sobre o alvo.',
    },
  },

  // =========================================================================
  // 3. GABUMON LINE — Gabumon -> Garurumon -> WereGarurumon -> MetalGarurumon
  // =========================================================================
  gabumon: {
    f1: {
      slot: 'f1',
      name: 'Little Horn',
      element: 'ice',
      rangeLabelPt: 'Curto Alcance · Alvo Único',
      dsCost: 14,
      cooldownSec: 3.0,
      baseDamage: 65,
      atScalingRatio: 1.54,
      descriptionPt:
        'Investe com o chifre frontal e garras gélidas em um golpe rápido e preciso.',
    },
    f2: {
      slot: 'f2',
      name: 'Blue Blaster',
      element: 'ice',
      rangeLabelPt: 'Média Distância · Chama Azul',
      dsCost: 32,
      cooldownSec: 5.0,
      baseDamage: 148,
      atScalingRatio: 2.4,
      descriptionPt:
        'Dispara chamas azuladas criogênicas (Petit Fire) que congelam e queimam o inimigo.',
    },
  },
  garurumon: {
    f1: {
      slot: 'f1',
      name: 'Freeze Fang',
      element: 'ice',
      rangeLabelPt: 'Curto Alcance · Mordida Glacial',
      dsCost: 30,
      cooldownSec: 4.0,
      baseDamage: 192,
      atScalingRatio: 1.74,
      descriptionPt:
        'Avança em alta velocidade mordendo o inimigo com presas revestidas de gelo intenso.',
    },
    f2: {
      slot: 'f2',
      name: 'Howling Blaster',
      element: 'ice',
      rangeLabelPt: 'Longa Distância · Chama Azul',
      dsCost: 60,
      cooldownSec: 6.0,
      baseDamage: 382,
      atScalingRatio: 2.58,
      descriptionPt:
        'Expele um jato azul de altíssima energia criogênica (Fox Fire) capaz de destruir mobs em linha.',
    },
  },
  weregarurumon: {
    f1: {
      slot: 'f1',
      name: 'Wolf Claw',
      element: 'ice',
      rangeLabelPt: 'Curto Alcance · Combo de Garras',
      dsCost: 64,
      cooldownSec: 5.0,
      baseDamage: 468,
      atScalingRatio: 1.94,
      descriptionPt:
        'Desfere uma sequência marcial de cortes gélidos com as garras afiadas de lobisomem.',
    },
    f2: {
      slot: 'f2',
      name: 'Kaiser Nail',
      element: 'ice',
      rangeLabelPt: 'Curto/Médio Alcance · Corte Cruzado',
      dsCost: 116,
      cooldownSec: 7.5,
      baseDamage: 915,
      atScalingRatio: 2.86,
      descriptionPt:
        'Salta e executa um corte cruzado devastador com energia glacial que rasga armaduras.',
    },
  },
  metalgarurumon: {
    f1: {
      slot: 'f1',
      name: 'Grace Cross Freezer',
      element: 'ice',
      rangeLabelPt: 'Longa Distância · Barragem de Mísseis',
      dsCost: 115,
      cooldownSec: 6.0,
      baseDamage: 1100,
      atScalingRatio: 2.18,
      descriptionPt:
        'Dispara uma salva de mísseis teleguiados congelantes de toda a sua armadura metálica.',
    },
    f2: {
      slot: 'f2',
      name: 'Metal Wolf Claw',
      element: 'ice',
      rangeLabelPt: 'Longa Distância · Zero Absoluto',
      dsCost: 218,
      cooldownSec: 10.0,
      baseDamage: 2210,
      atScalingRatio: 3.22,
      descriptionPt:
        'Libera o lendário Cocytus Breath no zero absoluto, congelando instantaneamente os dados vitais do mob.',
    },
  },

  // =========================================================================
  // 4. GAOMON LINE — Gaomon -> Gaogamon -> MachGaogamon -> MirageGaogamon
  // =========================================================================
  gaomon: {
    f1: {
      slot: 'f1',
      name: 'Rolling Upper',
      element: 'wind',
      rangeLabelPt: 'Curto Alcance · Gancho Rápido',
      dsCost: 14,
      cooldownSec: 3.0,
      baseDamage: 64,
      atScalingRatio: 1.56,
      descriptionPt:
        'Executa um gancho giratório veloz com suas luvas de boxe impulsionado por corrente de vento.',
    },
    f2: {
      slot: 'f2',
      name: 'Double Backhand',
      element: 'wind',
      rangeLabelPt: 'Curto Alcance · Combo Duplo',
      dsCost: 30,
      cooldownSec: 5.0,
      baseDamage: 142,
      atScalingRatio: 2.38,
      descriptionPt:
        'Dispara dois golpes velozes em sequência criando ondas de choque cortantes no ar.',
    },
  },
  gaogamon: {
    f1: {
      slot: 'f1',
      name: 'Dash Double Claw',
      element: 'wind',
      rangeLabelPt: 'Curto Alcance · Investida Dupla',
      dsCost: 28,
      cooldownSec: 4.0,
      baseDamage: 186,
      atScalingRatio: 1.76,
      descriptionPt:
        'Corre em alta velocidade e acerta um corte duplo aéreo com suas garras dianteiras.',
    },
    f2: {
      slot: 'f2',
      name: 'Spiral Blow',
      element: 'wind',
      rangeLabelPt: 'Longa Distância · Tornado',
      dsCost: 58,
      cooldownSec: 6.0,
      baseDamage: 372,
      atScalingRatio: 2.56,
      descriptionPt:
        'Uiva liberando um ciclone espiral cortante que varre o inimigo à distância.',
    },
  },
  machgaogamon: {
    f1: {
      slot: 'f1',
      name: 'Winning Knuckle',
      element: 'wind',
      rangeLabelPt: 'Curto Alcance · Soco Sônico',
      dsCost: 62,
      cooldownSec: 5.0,
      baseDamage: 460,
      atScalingRatio: 1.96,
      descriptionPt:
        'Ativa os propulsores nas costas para desferir um soco supersônico de impacto brutal.',
    },
    f2: {
      slot: 'f2',
      name: 'Howling Cannon',
      element: 'wind',
      rangeLabelPt: 'Longa Distância · Onda Sônica',
      dsCost: 118,
      cooldownSec: 7.5,
      baseDamage: 905,
      atScalingRatio: 2.84,
      descriptionPt:
        'Dispara um rugido supersônico concentrado que desintegra a defesa do alvo.',
    },
  },
  miragegaogamon: {
    f1: {
      slot: 'f1',
      name: 'Double Crescent Mirage',
      element: 'light',
      rangeLabelPt: 'Média Distância · Lâminas Lunares',
      dsCost: 112,
      cooldownSec: 6.0,
      baseDamage: 1065,
      atScalingRatio: 2.18,
      descriptionPt:
        'Lança ondas de choque em forma de lua crescente a partir das garras em velocidade de miragem.',
    },
    f2: {
      slot: 'f2',
      name: 'Full Moon Blaster',
      element: 'light',
      rangeLabelPt: 'Longa Distância · Canhão Peitoral',
      dsCost: 210,
      cooldownSec: 10.0,
      baseDamage: 2140,
      atScalingRatio: 3.16,
      descriptionPt:
        'Concentra luz lunar no emblema peitoral e dispara um feixe de energia pura devastador.',
    },
  },

  // =========================================================================
  // 5. LALAMON LINE — Lalamon -> Sunflowmon -> Lilamon -> Rosemon
  // =========================================================================
  lalamon: {
    f1: {
      slot: 'f1',
      name: 'Nuts Shoot',
      element: 'wood',
      rangeLabelPt: 'Longa Distância · Projétil',
      dsCost: 15,
      cooldownSec: 3.0,
      baseDamage: 66,
      atScalingRatio: 1.58,
      descriptionPt:
        'Dispara sementes rígidas em alta velocidade que atingem o alvo com grande precisão.',
    },
    f2: {
      slot: 'f2',
      name: 'Lala Screw',
      element: 'wood',
      rangeLabelPt: 'Curto/Médio Alcance · Giro Botânico',
      dsCost: 34,
      cooldownSec: 5.0,
      baseDamage: 146,
      atScalingRatio: 2.42,
      descriptionPt:
        'Gira velozmente usando suas folhas como hélices cortantes para golpear o mob.',
    },
  },
  sunflowmon: {
    f1: {
      slot: 'f1',
      name: 'Sunshine Beam',
      element: 'wood',
      rangeLabelPt: 'Longa Distância · Raio Solar',
      dsCost: 32,
      cooldownSec: 4.0,
      baseDamage: 194,
      atScalingRatio: 1.78,
      descriptionPt:
        'Absorve luz solar pelas pétalas e dispara um feixe fotossintético concentrado no inimigo.',
    },
    f2: {
      slot: 'f2',
      name: 'Cactus Tail',
      element: 'wood',
      rangeLabelPt: 'Curto/Médio Alcance · Chicote Espinhoso',
      dsCost: 62,
      cooldownSec: 6.0,
      baseDamage: 380,
      atScalingRatio: 2.62,
      descriptionPt:
        'Açoita o alvo com sua cauda cheia de espinhos venenosos causando dano contínuo intenso.',
    },
  },
  lilamon: {
    f1: {
      slot: 'f1',
      name: 'Lila Shower',
      element: 'wood',
      rangeLabelPt: 'Longa Distância · Chuva de Feixes',
      dsCost: 66,
      cooldownSec: 5.0,
      baseDamage: 472,
      atScalingRatio: 1.98,
      descriptionPt:
        'Dispara múltiplos feixes de energia floral pelas folhas dos braços contra o inimigo.',
    },
    f2: {
      slot: 'f2',
      name: 'Beauty Slap',
      element: 'wood',
      rangeLabelPt: 'Curto Alcance · Impacto Encantado',
      dsCost: 120,
      cooldownSec: 8.0,
      baseDamage: 925,
      atScalingRatio: 2.9,
      descriptionPt:
        'Desfere um golpe encantado de altíssimo poder espiritual que desestabiliza o alvo.',
    },
  },
  rosemon: {
    f1: {
      slot: 'f1',
      name: 'Thorn Whip',
      element: 'wood',
      rangeLabelPt: 'Média Distância · Chicote Espinhoso',
      dsCost: 114,
      cooldownSec: 6.0,
      baseDamage: 1095,
      atScalingRatio: 2.22,
      descriptionPt:
        'Golpeia com o chicote carregado de energia botânica de alta voltagem que domina o alvo.',
    },
    f2: {
      slot: 'f2',
      name: 'Forbidden Temptation',
      element: 'wood',
      rangeLabelPt: 'Longa Distância · Tempestade de Rosas',
      dsCost: 215,
      cooldownSec: 10.0,
      baseDamage: 2210,
      atScalingRatio: 3.24,
      descriptionPt:
        'Envolve o inimigo em uma tormenta fatal de pétalas brilhantes que destroem seus dados.',
    },
  },

  // =========================================================================
  // 6. GUILMON LINE — Guilmon -> Growlmon -> WarGrowlmon (MegaloGrowlmon) -> Dukemon
  // =========================================================================
  guilmon: {
    f1: {
      slot: 'f1',
      name: 'Rock Breaker',
      element: 'fire',
      rangeLabelPt: 'Curto Alcance · Garra Destruidora',
      dsCost: 15,
      cooldownSec: 3.0,
      baseDamage: 70,
      atScalingRatio: 1.58,
      descriptionPt:
        'Envolve as garras em energia térmica para estilhaçar a defesa rochosa do inimigo.',
    },
    f2: {
      slot: 'f2',
      name: 'Pyro Sphere',
      element: 'fire',
      rangeLabelPt: 'Média Distância · Bola de Fogo',
      dsCost: 34,
      cooldownSec: 5.0,
      baseDamage: 156,
      atScalingRatio: 2.45,
      descriptionPt:
        'Dispara uma esfera compacta de fogo carmesim (Fireball) de alta explosão ao impacto.',
    },
  },
  growlmon: {
    f1: {
      slot: 'f1',
      name: 'Plasma Blade',
      element: 'fire',
      rangeLabelPt: 'Curto Alcance · Lâminas nos Braços',
      dsCost: 32,
      cooldownSec: 4.0,
      baseDamage: 204,
      atScalingRatio: 1.78,
      descriptionPt:
        'Carrega as lâminas dos cotovelos com plasma ardente e corta o alvo em velocidade brutal.',
    },
    f2: {
      slot: 'f2',
      name: 'Pyro Blaster',
      element: 'fire',
      rangeLabelPt: 'Longa Distância · Chama Exaustiva',
      dsCost: 64,
      cooldownSec: 6.0,
      baseDamage: 405,
      atScalingRatio: 2.64,
      descriptionPt:
        'Rugindo com o Perigo Digital, dispara uma rajada vulcânica (Exhaust Flame) devastadora.',
    },
  },
  megalogrowlmon: {
    f1: {
      slot: 'f1',
      name: 'Double Edge',
      element: 'iron',
      rangeLabelPt: 'Curto/Médio Alcance · Lâminas Pêndulo',
      dsCost: 68,
      cooldownSec: 5.0,
      baseDamage: 485,
      atScalingRatio: 1.96,
      descriptionPt:
        'Avança rasgando o inimigo com as gigantescas lâminas metálicas de ambos os braços.',
    },
    f2: {
      slot: 'f2',
      name: 'Atomic Blaster',
      element: 'fire',
      rangeLabelPt: 'Longa Distância · Canhões Peitorais',
      dsCost: 124,
      cooldownSec: 8.0,
      baseDamage: 965,
      atScalingRatio: 2.94,
      descriptionPt:
        'Dispara energia atômica concentrada dos canhões no peito, obliterando o mob em nível molecular.',
    },
  },
  dukemon: {
    f1: {
      slot: 'f1',
      name: 'Royal Saber',
      element: 'light',
      rangeLabelPt: 'Média Distância · Lança Gram',
      dsCost: 118,
      cooldownSec: 6.0,
      baseDamage: 1140,
      atScalingRatio: 2.24,
      descriptionPt:
        'Dispara uma estocada sagrada de luz com a Lança Gram capaz de atravessar qualquer defesa.',
    },
    f2: {
      slot: 'f2',
      name: 'Final Elysion',
      element: 'light',
      rangeLabelPt: 'Longa Distância · Escudo Aegis',
      dsCost: 228,
      cooldownSec: 10.0,
      baseDamage: 2310,
      atScalingRatio: 3.3,
      descriptionPt:
        'Libera um feixe purificador colossal pelo Escudo Sagrado Aegis que aniquila inimigos sombrios.',
    },
  },

  // =========================================================================
  // 7. IMPMON LINE — Impmon -> IceDevimon -> SkullSatamon -> Beelzemon
  // =========================================================================
  impmon: {
    f1: {
      slot: 'f1',
      name: 'Bada Boom',
      element: 'fire',
      rangeLabelPt: 'Média Distância · Chama Sombria',
      dsCost: 16,
      cooldownSec: 3.0,
      baseDamage: 72,
      atScalingRatio: 1.62,
      descriptionPt:
        'Conjura uma esfera de chamas escuras (Night of Fire) na ponta dos dedos e arremessa no alvo.',
    },
    f2: {
      slot: 'f2',
      name: 'Infernal Funnel',
      element: 'darkness',
      rangeLabelPt: 'Média Distância · Fogo e Gelo',
      dsCost: 36,
      cooldownSec: 5.5,
      baseDamage: 162,
      atScalingRatio: 2.48,
      descriptionPt:
        'Invoca um vórtice elemental de fogo e gelo (Summon) que detona em torno do inimigo.',
    },
  },
  icedevimon: {
    f1: {
      slot: 'f1',
      name: 'Zero Freeze',
      element: 'ice',
      rangeLabelPt: 'Média Distância · Raio Glacial',
      dsCost: 34,
      cooldownSec: 4.0,
      baseDamage: 205,
      atScalingRatio: 1.8,
      descriptionPt:
        'Envolve o inimigo em uma rajada de frio abissal que retarda e perfura sua resistência.',
    },
    f2: {
      slot: 'f2',
      name: 'Frozen Claw',
      element: 'ice',
      rangeLabelPt: 'Curto Alcance · Garra Congelante',
      dsCost: 64,
      cooldownSec: 6.5,
      baseDamage: 412,
      atScalingRatio: 2.68,
      descriptionPt:
        'Estende suas garras demoníacas cobertas de gelo cortante para dilacerar o alvo.',
    },
  },
  skullsatamon: {
    f1: {
      slot: 'f1',
      name: 'Nail Bone',
      element: 'darkness',
      rangeLabelPt: 'Longa Distância · Raio Maldito',
      dsCost: 70,
      cooldownSec: 5.0,
      baseDamage: 495,
      atScalingRatio: 2.02,
      descriptionPt:
        'Dispara um feixe de dados corrompidos pelo cajado de ossos que paralisa e destrói o alvo.',
    },
    f2: {
      slot: 'f2',
      name: 'Skull Hammer',
      element: 'darkness',
      rangeLabelPt: 'Curto/Médio Alcance · Impacto Sombrio',
      dsCost: 126,
      cooldownSec: 8.0,
      baseDamage: 980,
      atScalingRatio: 2.98,
      descriptionPt:
        'Descarrega a fúria do cajado sombrio em um golpe esmagador carregado de energia trevosa.',
    },
  },
  beelzemon: {
    f1: {
      slot: 'f1',
      name: 'Darkness Claw',
      element: 'darkness',
      rangeLabelPt: 'Curto Alcance · Corte Demoníaco',
      dsCost: 116,
      cooldownSec: 5.5,
      baseDamage: 1165,
      atScalingRatio: 2.28,
      descriptionPt:
        'Rasga o inimigo em velocidade letal com garras envoltas em energia do Lorde Demônio.',
    },
    f2: {
      slot: 'f2',
      name: 'Double Impact',
      element: 'darkness',
      rangeLabelPt: 'Longa Distância · Berenjena Dupla',
      dsCost: 224,
      cooldownSec: 9.5,
      baseDamage: 2340,
      atScalingRatio: 3.34,
      descriptionPt:
        'Dispara rajadas contínuas de suas duas espingardas Berenjena com dano crítico extremo.',
    },
  },

  // =========================================================================
  // 8. VEEMON LINE — Veemon -> Veedramon -> AeroVeedramon -> UlforceVeedramon
  // =========================================================================
  veemon: {
    f1: {
      slot: 'f1',
      name: 'Vee Headbutt',
      element: 'light',
      rangeLabelPt: 'Curto Alcance · Cabeçada Veloz',
      dsCost: 14,
      cooldownSec: 3.0,
      baseDamage: 68,
      atScalingRatio: 1.58,
      descriptionPt:
        'Avança como um cometa azul atingindo o mob com uma cabeçada de enorme impacto.',
    },
    f2: {
      slot: 'f2',
      name: 'Vee Punch',
      element: 'light',
      rangeLabelPt: 'Curto Alcance · Soco Giratório',
      dsCost: 32,
      cooldownSec: 5.0,
      baseDamage: 150,
      atScalingRatio: 2.42,
      descriptionPt:
        'Gira os braços em alta velocidade desferindo um soco carregado com energia luminosa.',
    },
  },
  veedramon: {
    f1: {
      slot: 'f1',
      name: 'V-Breath Arrow',
      element: 'wind',
      rangeLabelPt: 'Longa Distância · Seta de Energia',
      dsCost: 30,
      cooldownSec: 4.0,
      baseDamage: 196,
      atScalingRatio: 1.78,
      descriptionPt:
        'Dispara da boca uma flecha de calor e vento em formato de V que perfura o inimigo.',
    },
    f2: {
      slot: 'f2',
      name: 'Hammer Punch',
      element: 'wind',
      rangeLabelPt: 'Curto Alcance · Golpe Martelo',
      dsCost: 60,
      cooldownSec: 6.0,
      baseDamage: 388,
      atScalingRatio: 2.62,
      descriptionPt:
        'Concentra força dracônica no punho e esmaga o alvo com uma onda de impacto azul.',
    },
  },
  aeroveedramon: {
    f1: {
      slot: 'f1',
      name: 'V-Wing Blade',
      element: 'wind',
      rangeLabelPt: 'Longa Distância · Lâmina Aérea',
      dsCost: 64,
      cooldownSec: 5.0,
      baseDamage: 480,
      atScalingRatio: 1.98,
      descriptionPt:
        'Dispara ondas cortantes em forma de V geradas pelo bater supersônico de suas asas.',
    },
    f2: {
      slot: 'f2',
      name: 'Dragon Impulse',
      element: 'wind',
      rangeLabelPt: 'Longa Distância · Aura Dracônica',
      dsCost: 122,
      cooldownSec: 8.0,
      baseDamage: 955,
      atScalingRatio: 2.92,
      descriptionPt:
        'Envolve-se em uma aura de dragão cintilante e atravessa o inimigo com velocidade avassaladora.',
    },
  },
  ulforceveedramon: {
    f1: {
      slot: 'f1',
      name: 'Ulforce Saber',
      element: 'light',
      rangeLabelPt: 'Curto/Médio Alcance · Sabre de Plasma',
      dsCost: 118,
      cooldownSec: 5.5,
      baseDamage: 1155,
      atScalingRatio: 2.26,
      descriptionPt:
        'Ativa o sabre de luz dos V-Bracelets e executa um corte divino na velocidade da luz.',
    },
    f2: {
      slot: 'f2',
      name: 'Shining V Force',
      element: 'light',
      rangeLabelPt: 'Longa Distância · Feixe em V Supremo',
      dsCost: 230,
      cooldownSec: 10.0,
      baseDamage: 2350,
      atScalingRatio: 3.34,
      descriptionPt:
        'Libera um feixe sagrado monumental em formato de V a partir da armadura peitoral de Chrome Digizoid.',
    },
  },

  // =========================================================================
  // 9. KERAMON LINE — Keramon -> Chrysalimon -> Infermon -> Diaboromon
  // =========================================================================
  keramon: {
    f1: {
      slot: 'f1',
      name: 'Crazy Giggle',
      element: 'darkness',
      rangeLabelPt: 'Longa Distância · Esfera Viral',
      dsCost: 16,
      cooldownSec: 3.0,
      baseDamage: 72,
      atScalingRatio: 1.62,
      descriptionPt:
        'Gargalha e dispara uma esfera destrutiva de dados corrompidos contra o inimigo.',
    },
    f2: {
      slot: 'f2',
      name: 'Network Eater',
      element: 'darkness',
      rangeLabelPt: 'Média Distância · Corrupção de Rede',
      dsCost: 36,
      cooldownSec: 5.5,
      baseDamage: 160,
      atScalingRatio: 2.48,
      descriptionPt:
        'Estende os braços e devora os pacotes de dados do mob causando forte dano anômalo.',
    },
  },
  chrysalimon: {
    f1: {
      slot: 'f1',
      name: 'Data Crusher',
      element: 'darkness',
      rangeLabelPt: 'Média Distância · Tentáculos',
      dsCost: 34,
      cooldownSec: 4.0,
      baseDamage: 204,
      atScalingRatio: 1.8,
      descriptionPt:
        'Esmaga o código do inimigo com tentáculos blindados carregados de energia sombria.',
    },
    f2: {
      slot: 'f2',
      name: 'Unconnect Buster',
      element: 'darkness',
      rangeLabelPt: 'Longa Distância · Detonação Viral',
      dsCost: 66,
      cooldownSec: 6.5,
      baseDamage: 410,
      atScalingRatio: 2.66,
      descriptionPt:
        'Dispara energia destrutiva das costas desconectando e estilhaçando a estrutura do alvo.',
    },
  },
  infermon: {
    f1: {
      slot: 'f1',
      name: 'Spider Shooter',
      element: 'darkness',
      rangeLabelPt: 'Longa Distância · Canhão Bucal',
      dsCost: 70,
      cooldownSec: 5.0,
      baseDamage: 495,
      atScalingRatio: 2.02,
      descriptionPt:
        'Dispara rajadas rápidas de plasma destrutivo pela boca em formato de aranha cibernética.',
    },
    f2: {
      slot: 'f2',
      name: "Hell's Grenade",
      element: 'darkness',
      rangeLabelPt: 'Longa Distância · Explosão Abissal',
      dsCost: 128,
      cooldownSec: 8.0,
      baseDamage: 985,
      atScalingRatio: 2.98,
      descriptionPt:
        'Lança um projétil explosivo de altíssima potência que incinera a rede ao redor do mob.',
    },
  },
  diaboromon: {
    f1: {
      slot: 'f1',
      name: 'Cable Crusher',
      element: 'darkness',
      rangeLabelPt: 'Curto/Médio Alcance · Garras Abissais',
      dsCost: 120,
      cooldownSec: 5.5,
      baseDamage: 1185,
      atScalingRatio: 2.3,
      descriptionPt:
        'Avança em velocidade errática rasgando os dados do inimigo com garras anômalas.',
    },
    f2: {
      slot: 'f2',
      name: 'Catastrophe Cannon',
      element: 'darkness',
      rangeLabelPt: 'Longa Distância · Canhão Peitoral',
      dsCost: 236,
      cooldownSec: 10.0,
      baseDamage: 2410,
      atScalingRatio: 3.38,
      descriptionPt:
        'Abre o peito e dispara o lendário Canhão da Catástrofe, com um dos maiores danos explosivos do jogo.',
    },
  },

  // =========================================================================
  // 10. DEMIMERAMON LINE — DemiMeramon -> Meramon -> SkullMeramon -> Boltmon
  // =========================================================================
  demimeramon: {
    f1: {
      slot: 'f1',
      name: 'Fireball',
      element: 'fire',
      rangeLabelPt: 'Média Distância · Esfera Ígnea',
      dsCost: 14,
      cooldownSec: 3.0,
      baseDamage: 66,
      atScalingRatio: 1.56,
      descriptionPt:
        'Lança uma pequena bola de chamas concentradas que queima o alvo ao contato.',
    },
    f2: {
      slot: 'f2',
      name: 'Flame Dash',
      element: 'fire',
      rangeLabelPt: 'Curto Alcance · Investida Ardente',
      dsCost: 32,
      cooldownSec: 5.0,
      baseDamage: 148,
      atScalingRatio: 2.4,
      descriptionPt:
        'Envolve todo o corpo em fogo intenso e colide contra o inimigo em uma explosão de faíscas.',
    },
  },
  meramon: {
    f1: {
      slot: 'f1',
      name: 'Burning Fist',
      element: 'fire',
      rangeLabelPt: 'Curto Alcance · Punho Flamejante',
      dsCost: 32,
      cooldownSec: 4.0,
      baseDamage: 198,
      atScalingRatio: 1.76,
      descriptionPt:
        'Golpeia com punhos incandescentes a mais de mil graus, deixando rastros de magma.',
    },
    f2: {
      slot: 'f2',
      name: 'Fireball',
      element: 'fire',
      rangeLabelPt: 'Longa Distância · Esfera Vulcânica',
      dsCost: 62,
      cooldownSec: 6.0,
      baseDamage: 392,
      atScalingRatio: 2.62,
      descriptionPt:
        'Concentra fogo de todo o corpo e arremessa uma esfera ardente colossal contra o mob.',
    },
  },
  skullmeramon: {
    f1: {
      slot: 'f1',
      name: 'Heavy Metal Fire',
      element: 'fire',
      rangeLabelPt: 'Média Distância · Corrente em Chamas',
      dsCost: 66,
      cooldownSec: 5.0,
      baseDamage: 482,
      atScalingRatio: 1.96,
      descriptionPt:
        'Dispara chamas azuis e correntes incandescentes superaquecidas que prendem e queimam o alvo.',
    },
    f2: {
      slot: 'f2',
      name: 'Metal Fireball',
      element: 'fire',
      rangeLabelPt: 'Longa Distância · Rajada Incandescente',
      dsCost: 122,
      cooldownSec: 8.0,
      baseDamage: 950,
      atScalingRatio: 2.92,
      descriptionPt:
        'Libera uma descarga vulcânica de fogo superaquecido reforçado por metal derretido.',
    },
  },
  boltmon: {
    f1: {
      slot: 'f1',
      name: 'Tomahawk Steiner',
      element: 'iron',
      rangeLabelPt: 'Curto/Médio Alcance · Machado Colossal',
      dsCost: 118,
      cooldownSec: 6.0,
      baseDamage: 1150,
      atScalingRatio: 2.24,
      descriptionPt:
        'Arremessa e golpeia com seu machado colossal de batalha com força cibernética esmagadora.',
    },
    f2: {
      slot: 'f2',
      name: 'Berserk',
      element: 'iron',
      rangeLabelPt: 'Curto/Médio Alcance · Impacto Sísmico',
      dsCost: 224,
      cooldownSec: 10.0,
      baseDamage: 2295,
      atScalingRatio: 3.3,
      descriptionPt:
        'Libera toda a sobrecarga elétrica do corpo em um golpe furioso que racha o solo sob o mob.',
    },
  },

  // =========================================================================
  // 11. HAWKMON LINE — Hawkmon -> Aquilamon -> Silphymon -> Gryphonmon
  // =========================================================================
  hawkmon: {
    f1: {
      slot: 'f1',
      name: 'Feather Slash',
      element: 'wind',
      rangeLabelPt: 'Média Distância · Pena Bumerangue',
      dsCost: 14,
      cooldownSec: 3.0,
      baseDamage: 66,
      atScalingRatio: 1.56,
      descriptionPt:
        'Lança a pena de sua cabeça como um bumerangue afiado cortando o ar até o inimigo.',
    },
    f2: {
      slot: 'f2',
      name: 'Beak Pecker',
      element: 'wind',
      rangeLabelPt: 'Curto Alcance · Investida Aérea',
      dsCost: 30,
      cooldownSec: 5.0,
      baseDamage: 145,
      atScalingRatio: 2.4,
      descriptionPt:
        'Mergulha rapidamente sobre o alvo desferindo bicadas rápidas impulsionadas pelo vento.',
    },
  },
  aquilamon: {
    f1: {
      slot: 'f1',
      name: 'Blast Laser',
      element: 'wind',
      rangeLabelPt: 'Longa Distância · Anel Sônico',
      dsCost: 30,
      cooldownSec: 4.0,
      baseDamage: 192,
      atScalingRatio: 1.76,
      descriptionPt:
        'Solta um grito supersônico formando anéis cortantes de vento que atravessam o alvo.',
    },
    f2: {
      slot: 'f2',
      name: 'Grand Horn',
      element: 'wind',
      rangeLabelPt: 'Curto Alcance · Investida dos Chifres',
      dsCost: 60,
      cooldownSec: 6.0,
      baseDamage: 384,
      atScalingRatio: 2.6,
      descriptionPt:
        'Mergulha dos céus em velocidade mach perfurando o mob com seus chifres gigantes.',
    },
  },
  silphymon: {
    f1: {
      slot: 'f1',
      name: 'Top Gun',
      element: 'wind',
      rangeLabelPt: 'Longa Distância · Esfera de Energia',
      dsCost: 64,
      cooldownSec: 5.0,
      baseDamage: 476,
      atScalingRatio: 1.98,
      descriptionPt:
        'Concentra energia cinética entre as mãos e dispara uma esfera cortante em alta velocidade.',
    },
    f2: {
      slot: 'f2',
      name: 'Static Force',
      element: 'wind',
      rangeLabelPt: 'Longa Distância · Onda de Choque',
      dsCost: 120,
      cooldownSec: 8.0,
      baseDamage: 940,
      atScalingRatio: 2.9,
      descriptionPt:
        'Cria uma imagem espectral sônica que avança e explode com força aerodinâmica intensa.',
    },
  },
  gryphonmon: {
    f1: {
      slot: 'f1',
      name: 'Supersonic Voice',
      element: 'wind',
      rangeLabelPt: 'Longa Distância · Rugido Sônico',
      dsCost: 114,
      cooldownSec: 5.5,
      baseDamage: 1125,
      atScalingRatio: 2.22,
      descriptionPt:
        'Emite uma onda acústica de altíssima frequência que estilhaça a armadura de qualquer mob.',
    },
    f2: {
      slot: 'f2',
      name: 'Legendary Blade',
      element: 'wind',
      rangeLabelPt: 'Média/Longa Distância · Lâmina Vendaval',
      dsCost: 220,
      cooldownSec: 9.5,
      baseDamage: 2260,
      atScalingRatio: 3.26,
      descriptionPt:
        'Dispara rajadas cortantes das asas lendárias formando uma lâmina de vento de dano extremo.',
    },
  },

  // ---------------------------------------------------------------------------
  // 12. TENTOMON LINE (Vaccine / Thunder)
  // ---------------------------------------------------------------------------
  tentomon: {
    f1: {
      slot: 'f1',
      name: 'Petit Thunder',
      element: 'thunder',
      rangeLabelPt: 'Longa Distância · Descarga Elétrica',
      dsCost: 15,
      cooldownSec: 3.0,
      baseDamage: 66,
      atScalingRatio: 1.54,
      descriptionPt:
        'Dispara uma faísca elétrica concentrada pelas antenas que eletrocuta o inimigo à distância.',
    },
    f2: {
      slot: 'f2',
      name: 'Hard Claws',
      element: 'thunder',
      rangeLabelPt: 'Curto Alcance · Garras Carregadas',
      dsCost: 34,
      cooldownSec: 5.0,
      baseDamage: 146,
      atScalingRatio: 2.34,
      descriptionPt:
        'Avança sobre o mob desferindo golpes rápidos com suas garras metálicas eletrificadas.',
    },
  },
  kabuterimon: {
    f1: {
      slot: 'f1',
      name: 'Electro Shocker',
      element: 'thunder',
      rangeLabelPt: 'Longa Distância · Esfera de Trovão',
      dsCost: 34,
      cooldownSec: 4.0,
      baseDamage: 204,
      atScalingRatio: 1.74,
      descriptionPt:
        'Arremessa uma esfera de eletricidade de altíssima voltagem que explode no impacto.',
    },
    f2: {
      slot: 'f2',
      name: 'Blink Thrust',
      element: 'thunder',
      rangeLabelPt: 'Curto Alcance · Investida Relâmpago',
      dsCost: 66,
      cooldownSec: 6.0,
      baseDamage: 395,
      atScalingRatio: 2.6,
      descriptionPt:
        'Acelera num piscar de olhos perfurando o alvo com o chifre blindado envolto em raios.',
    },
  },
  megakabuterimon: {
    f1: {
      slot: 'f1',
      name: 'Horn Buster',
      element: 'thunder',
      rangeLabelPt: 'Longa Distância · Canhão Elétrico',
      dsCost: 66,
      cooldownSec: 5.0,
      baseDamage: 492,
      atScalingRatio: 2.0,
      descriptionPt:
        'Concentra energia elétrica massiva no chifre vermelho e dispara um feixe devastador.',
    },
    f2: {
      slot: 'f2',
      name: 'Wild Scratch',
      element: 'iron',
      rangeLabelPt: 'Curto Alcance · Corte Brutal',
      dsCost: 122,
      cooldownSec: 8.0,
      baseDamage: 968,
      atScalingRatio: 2.94,
      descriptionPt:
        'Desfere uma sequência selvagem de cortes com suas garras blindadas de força colossal.',
    },
  },
  herculeskabuterimon: {
    f1: {
      slot: 'f1',
      name: 'Giga Scissor Claw',
      element: 'thunder',
      rangeLabelPt: 'Curto Alcance · Pinça Titânica',
      dsCost: 116,
      cooldownSec: 5.5,
      baseDamage: 1150,
      atScalingRatio: 2.24,
      descriptionPt:
        'Esmaga e corta o inimigo com sua pinça dourada gigante carregada de eletricidade pura.',
    },
    f2: {
      slot: 'f2',
      name: 'Giga Blaster',
      element: 'thunder',
      rangeLabelPt: 'Longa Distância · Trovão Supremo',
      dsCost: 226,
      cooldownSec: 9.5,
      baseDamage: 2340,
      atScalingRatio: 3.3,
      descriptionPt:
        'Dispara uma rajada elétrica suprema de potência absurda capaz de pulverizar qualquer mob.',
    },
  },

  // ---------------------------------------------------------------------------
  // 13. DRIMOGEMON LINE (Data Earth -> Vaccine Iron / Thunder)
  // ---------------------------------------------------------------------------
  drimogemon: {
    f1: {
      slot: 'f1',
      name: 'Drill Spin',
      element: 'earth',
      rangeLabelPt: 'Curto Alcance · Broca Giratória',
      dsCost: 16,
      cooldownSec: 3.0,
      baseDamage: 70,
      atScalingRatio: 1.56,
      descriptionPt:
        'Gira a broca de aço em altíssima rotação e investe perfurando a defesa do inimigo.',
    },
    f2: {
      slot: 'f2',
      name: 'Crusher Bone',
      element: 'earth',
      rangeLabelPt: 'Média Distância · Osso Esmagador',
      dsCost: 36,
      cooldownSec: 5.0,
      baseDamage: 152,
      atScalingRatio: 2.38,
      descriptionPt:
        'Arremessa um osso pesado escavado do subsolo com força sísmica sobre o alvo.',
    },
  },
  digmon: {
    f1: {
      slot: 'f1',
      name: 'Gold Rush',
      element: 'earth',
      rangeLabelPt: 'Longa Distância · Disparo de Brocas',
      dsCost: 34,
      cooldownSec: 4.0,
      baseDamage: 202,
      atScalingRatio: 1.72,
      descriptionPt:
        'Dispara suas brocas douradas em rotação turbo diretamente contra o mob alvo.',
    },
    f2: {
      slot: 'f2',
      name: 'Big Crack',
      element: 'earth',
      rangeLabelPt: 'Média Distância · Fissura Sísmica',
      dsCost: 68,
      cooldownSec: 6.5,
      baseDamage: 406,
      atScalingRatio: 2.62,
      descriptionPt:
        'Crava as brocas no chão abrindo uma fenda tectônica que erupciona sob o inimigo.',
    },
  },
  giromon: {
    f1: {
      slot: 'f1',
      name: 'Deadly Bomb',
      element: 'iron',
      rangeLabelPt: 'Longa Distância · Bomba Detonadora',
      dsCost: 66,
      cooldownSec: 5.0,
      baseDamage: 495,
      atScalingRatio: 2.02,
      descriptionPt:
        'Lança bombas explosivas de alta pressão que detonam em ondas de choque metálicas.',
    },
    f2: {
      slot: 'f2',
      name: 'Chainsaw',
      element: 'iron',
      rangeLabelPt: 'Curto Alcance · Motosserra Cortante',
      dsCost: 124,
      cooldownSec: 8.0,
      baseDamage: 980,
      atScalingRatio: 2.96,
      descriptionPt:
        'Avança girando sua motosserra em velocidade extrema fatiando a armadura do inimigo.',
    },
  },
  hiandromon: {
    f1: {
      slot: 'f1',
      name: 'Atomic Ray',
      element: 'thunder',
      rangeLabelPt: 'Longa Distância · Feixe Atômico',
      dsCost: 118,
      cooldownSec: 5.5,
      baseDamage: 1165,
      atScalingRatio: 2.26,
      descriptionPt:
        'Dispara feixes de energia atômica de nêutrons pelos canhões dos ombros com precisão cirúrgica.',
    },
    f2: {
      slot: 'f2',
      name: 'Copy Paste',
      element: 'iron',
      rangeLabelPt: 'Longa Distância · Onda Destrutiva',
      dsCost: 228,
      cooldownSec: 9.5,
      baseDamage: 2360,
      atScalingRatio: 3.32,
      descriptionPt:
        'Libera uma descarga de dados de alta densidade que desintegra a estrutura do alvo.',
    },
  },

  // ---------------------------------------------------------------------------
  // 14. KIWIMON LINE (Data Wood / Wind)
  // ---------------------------------------------------------------------------
  kiwimon: {
    f1: {
      slot: 'f1',
      name: 'Nose Mattock',
      element: 'wood',
      rangeLabelPt: 'Curto Alcance · Bicada Perfuração',
      dsCost: 15,
      cooldownSec: 3.0,
      baseDamage: 66,
      atScalingRatio: 1.54,
      descriptionPt:
        'Avança com o bico rígido como uma picareta perfurando o inimigo com precisão.',
    },
    f2: {
      slot: 'f2',
      name: 'Pummel Peck',
      element: 'wood',
      rangeLabelPt: 'Curto Alcance · Rajada de Bicadas',
      dsCost: 34,
      cooldownSec: 5.0,
      baseDamage: 146,
      atScalingRatio: 2.34,
      descriptionPt:
        'Desfere uma sequência veloz de bicadas seguidas de um impacto vegetal contundente.',
    },
  },
  deramon: {
    f1: {
      slot: 'f1',
      name: 'Royal Smasher',
      element: 'wind',
      rangeLabelPt: 'Longa Distância · Canhão Real',
      dsCost: 34,
      cooldownSec: 4.0,
      baseDamage: 198,
      atScalingRatio: 1.72,
      descriptionPt:
        'Dispara rajadas energéticas da coroa-canhão sobre a cabeça direto contra o alvo.',
    },
    f2: {
      slot: 'f2',
      name: 'Beak Buster',
      element: 'wind',
      rangeLabelPt: 'Curto Alcance · Investida Real',
      dsCost: 66,
      cooldownSec: 6.0,
      baseDamage: 392,
      atScalingRatio: 2.58,
      descriptionPt:
        'Concentra energia do vento nas asas douradas e atinge o mob com força avassaladora.',
    },
  },
  blossomon: {
    f1: {
      slot: 'f1',
      name: 'Spiral Flower',
      element: 'wood',
      rangeLabelPt: 'Longa Distância · Espiral de Pétalas',
      dsCost: 64,
      cooldownSec: 5.0,
      baseDamage: 484,
      atScalingRatio: 1.98,
      descriptionPt:
        'Lança pétalas afiadas girando em espiral que cortam e envolvem o alvo em energia floral.',
    },
    f2: {
      slot: 'f2',
      name: 'Thorn Whip',
      element: 'wood',
      rangeLabelPt: 'Média Distância · Chicote de Espinhos',
      dsCost: 120,
      cooldownSec: 8.0,
      baseDamage: 952,
      atScalingRatio: 2.92,
      descriptionPt:
        'Estende seus tentáculos espinhosos chicoteando o inimigo com múltiplos impactos venenosos.',
    },
  },
  griffomon: {
    f1: {
      slot: 'f1',
      name: 'Moebius Bite',
      element: 'wind',
      rangeLabelPt: 'Curto Alcance · Mordida Sônica',
      dsCost: 114,
      cooldownSec: 5.5,
      baseDamage: 1145,
      atScalingRatio: 2.24,
      descriptionPt:
        'Salta com suas asas demoníacas aplicando uma mordida supersônica de impacto dilacerante.',
    },
    f2: {
      slot: 'f2',
      name: 'Supersonic Voice',
      element: 'wind',
      rangeLabelPt: 'Longa Distância · Rugido Supersônico',
      dsCost: 222,
      cooldownSec: 9.5,
      baseDamage: 2310,
      atScalingRatio: 3.28,
      descriptionPt:
        'Solta um rugido acústico de frequência extrema que destroça a defesa de qualquer mob.',
    },
  },
  // 15. Gotsumon Line (Data Earth / Ice -> Virus Iron)
  gotsumon: {
    f1: {
      slot: 'f1',
      name: 'Rock Fist',
      element: 'earth',
      rangeLabelPt: 'Curto Alcance · Punho de Rocha',
      dsCost: 14,
      cooldownSec: 3.0,
      baseDamage: 102,
      atScalingRatio: 1.48,
      descriptionPt:
        'Golpeia o inimigo com seu punho mineral reforçado causando impacto sólido de terra.',
    },
    f2: {
      slot: 'f2',
      name: 'Crazy Crusher',
      element: 'earth',
      rangeLabelPt: 'Média Distância · Esmagamento Sísmico',
      dsCost: 28,
      cooldownSec: 5.5,
      baseDamage: 196,
      atScalingRatio: 2.16,
      descriptionPt:
        'Salta com fúria e golpeia o solo com rochas densas que abalam o alvo à frente.',
    },
  },
  icemon: {
    f1: {
      slot: 'f1',
      name: 'Iceball Bomb',
      element: 'ice',
      rangeLabelPt: 'Longa Distância · Bomba Glacial',
      dsCost: 34,
      cooldownSec: 4.0,
      baseDamage: 204,
      atScalingRatio: 1.74,
      descriptionPt:
        'Arremessa esferas de gelo supercondensado que explodem em estilhaços congelantes.',
    },
    f2: {
      slot: 'f2',
      name: 'Crystal Crusher',
      element: 'ice',
      rangeLabelPt: 'Curto Alcance · Impacto Cristalino',
      dsCost: 66,
      cooldownSec: 6.0,
      baseDamage: 404,
      atScalingRatio: 2.6,
      descriptionPt:
        'Reveste os punhos em gelo sólido e desfere um golpe esmagador de temperatura subzero.',
    },
  },
  insekimon: {
    f1: {
      slot: 'f1',
      name: 'Cosmic Flash',
      element: 'earth',
      rangeLabelPt: 'Longa Distância · Clarão Cósmico',
      dsCost: 64,
      cooldownSec: 5.0,
      baseDamage: 492,
      atScalingRatio: 2.0,
      descriptionPt:
        'Libera um pulso luminoso de energia meteórica que atinge e desorienta o mob alvo.',
    },
    f2: {
      slot: 'f2',
      name: 'Big Bang Tackle',
      element: 'earth',
      rangeLabelPt: 'Curto Alcance · Investida Meteórica',
      dsCost: 122,
      cooldownSec: 8.0,
      baseDamage: 978,
      atScalingRatio: 2.96,
      descriptionPt:
        'Avança como um meteoro imparável esmagando a defesa inimiga com massa planetária.',
    },
  },
  metaletemon: {
    f1: {
      slot: 'f1',
      name: 'Dark Spirits Deluxe',
      element: 'iron',
      rangeLabelPt: 'Longa Distância · Esfera Chrome Digizoid',
      dsCost: 118,
      cooldownSec: 5.5,
      baseDamage: 1190,
      atScalingRatio: 2.3,
      descriptionPt:
        'Dispara uma esfera concentrada de energia sombria reforçada por sua liga Chrome Digizoid.',
    },
    f2: {
      slot: 'f2',
      name: 'Banana Slip',
      element: 'iron',
      rangeLabelPt: 'Curto Alcance · Golpe Metálico Supremo',
      dsCost: 226,
      cooldownSec: 9.5,
      baseDamage: 2380,
      atScalingRatio: 3.36,
      descriptionPt:
        'Desequilibra o alvo e aplica uma sequência acrobática devastadora com força metálica brutal.',
    },
  },
  // 16. Elecmon Line (Data Thunder -> Vaccine Earth/Ice -> Data Iron)
  elecmon: {
    f1: {
      slot: 'f1',
      name: 'Tai Atari',
      element: 'thunder',
      rangeLabelPt: 'Curto Alcance · Investida Elétrica',
      dsCost: 14,
      cooldownSec: 3.0,
      baseDamage: 100,
      atScalingRatio: 1.48,
      descriptionPt:
        'Avança em alta velocidade carregado de estática acertando o oponente com choque direto.',
    },
    f2: {
      slot: 'f2',
      name: 'Sparkling Thunder',
      element: 'thunder',
      rangeLabelPt: 'Longa Distância · Raio Cintilante',
      dsCost: 29,
      cooldownSec: 5.5,
      baseDamage: 198,
      atScalingRatio: 2.2,
      descriptionPt:
        'Erigue suas nove caudas e dispara feixes elétricos faiscantes sobre o alvo.',
    },
  },
  leomon: {
    f1: {
      slot: 'f1',
      name: 'Beast King Fist',
      element: 'earth',
      rangeLabelPt: 'Longa Distância · Punho do Rei Fera',
      dsCost: 35,
      cooldownSec: 4.0,
      baseDamage: 214,
      atScalingRatio: 1.78,
      descriptionPt:
        'Desfere um soco marcial que projeta a aura flamejante de um leão contra o inimigo.',
    },
    f2: {
      slot: 'f2',
      name: 'Lion King Blade',
      element: 'earth',
      rangeLabelPt: 'Curto Alcance · Lâmina do Rei Leão',
      dsCost: 68,
      cooldownSec: 6.5,
      baseDamage: 418,
      atScalingRatio: 2.66,
      descriptionPt:
        'Empunha sua espada ancestral e executa um corte heroico de altíssimo impacto.',
    },
  },
  iceleomon: {
    f1: {
      slot: 'f1',
      name: 'Ice Beast King Fist',
      element: 'ice',
      rangeLabelPt: 'Longa Distância · Punho Glacial da Fera',
      dsCost: 66,
      cooldownSec: 5.0,
      baseDamage: 504,
      atScalingRatio: 2.04,
      descriptionPt:
        'Lança a projeção de uma fera de gelo puro que congela e dilacera o mob alvo.',
    },
    f2: {
      slot: 'f2',
      name: 'Cold Breath',
      element: 'ice',
      rangeLabelPt: 'Longa Distância · Sopro Ártico',
      dsCost: 124,
      cooldownSec: 8.0,
      baseDamage: 986,
      atScalingRatio: 2.98,
      descriptionPt:
        'Exala uma tempestade criogênica devastadora que reduz drasticamente a resistência do alvo.',
    },
  },
  saberleomon: {
    f1: {
      slot: 'f1',
      name: 'Nail Crusher',
      element: 'iron',
      rangeLabelPt: 'Curto Alcance · Garras Titânicas',
      dsCost: 118,
      cooldownSec: 5.5,
      baseDamage: 1210,
      atScalingRatio: 2.34,
      descriptionPt:
        'Avança em velocidade supersônica rasgando o inimigo com garras metálicas cortantes.',
    },
    f2: {
      slot: 'f2',
      name: 'Infinity Arrow',
      element: 'iron',
      rangeLabelPt: 'Longa Distância · Chuva de Agulhas',
      dsCost: 228,
      cooldownSec: 9.5,
      baseDamage: 2420,
      atScalingRatio: 3.4,
      descriptionPt:
        'Dispara uma saraivada implacável de espinhos energizados de sua juba contra o oponente.',
    },
  },
  // 17. Renamon Line (Data Wind -> Fire -> Light)
  renamon: {
    f1: {
      slot: 'f1',
      name: 'Fox Tail Strike',
      element: 'wind',
      rangeLabelPt: 'Curto Alcance · Golpe da Raposa',
      dsCost: 14,
      cooldownSec: 3.0,
      baseDamage: 98,
      atScalingRatio: 1.48,
      descriptionPt:
        'Executa uma sequência ágil de artes marciais combinando chute giratório e impacto de cauda.',
    },
    f2: {
      slot: 'f2',
      name: 'Diamond Storm',
      element: 'wind',
      rangeLabelPt: 'Longa Distância · Tempestade de Diamantes',
      dsCost: 30,
      cooldownSec: 5.5,
      baseDamage: 202,
      atScalingRatio: 2.22,
      descriptionPt:
        'Arremessa dezenas de folhas cristalinas cortantes que perfuram o alvo em alta velocidade.',
    },
  },
  kyubimon: {
    f1: {
      slot: 'f1',
      name: 'Fox Tail Inferno',
      element: 'fire',
      rangeLabelPt: 'Longa Distância · Chamas das Nove Caudas',
      dsCost: 36,
      cooldownSec: 4.0,
      baseDamage: 208,
      atScalingRatio: 1.76,
      descriptionPt:
        'Conjura esferas de fogo-fátuo azul que perseguem e incineram o inimigo.',
    },
    f2: {
      slot: 'f2',
      name: 'Dragon Wheel',
      element: 'fire',
      rangeLabelPt: 'Média Distância · Roda do Dragão',
      dsCost: 68,
      cooldownSec: 6.5,
      baseDamage: 412,
      atScalingRatio: 2.64,
      descriptionPt:
        'Envolve o próprio corpo em chamas espirituais e gira formando um dragão de fogo avassalador.',
    },
  },
  taomon: {
    f1: {
      slot: 'f1',
      name: 'Talisman of Light',
      element: 'light',
      rangeLabelPt: 'Longa Distância · Talismã da Luz',
      dsCost: 68,
      cooldownSec: 5.0,
      baseDamage: 500,
      atScalingRatio: 2.02,
      descriptionPt:
        'Arremessa pergaminhos sagrados que selam o alvo e explodem em energia espiritual pura.',
    },
    f2: {
      slot: 'f2',
      name: 'Bonhitsusen',
      element: 'light',
      rangeLabelPt: 'Longa Distância · Caligrafia Sagrada',
      dsCost: 128,
      cooldownSec: 8.0,
      baseDamage: 980,
      atScalingRatio: 2.98,
      descriptionPt:
        'Traça um ideograma místico no ar com seu pincel gigante liberando um feixe purificador.',
    },
  },
  sakuyamon: {
    f1: {
      slot: 'f1',
      name: 'Izuna',
      element: 'light',
      rangeLabelPt: 'Longa Distância · Espíritos Raposa',
      dsCost: 122,
      cooldownSec: 5.5,
      baseDamage: 1195,
      atScalingRatio: 2.32,
      descriptionPt:
        'Invoca quatro espíritos de raposa elementais que avançam simultaneamente sobre o inimigo.',
    },
    f2: {
      slot: 'f2',
      name: 'Amethyst Mandala',
      element: 'light',
      rangeLabelPt: 'Longa Distância · Mandala Purificadora',
      dsCost: 234,
      cooldownSec: 9.5,
      baseDamage: 2410,
      atScalingRatio: 3.38,
      descriptionPt:
        'Bate seu cajado sagrado criando um círculo de luz ametista que aniquila forças malignas.',
    },
  },
  // 18. Monodramon Line (Vaccine Fire -> Iron -> Light)
  monodramon: {
    f1: {
      slot: 'f1',
      name: 'Beat Knuckle',
      element: 'fire',
      rangeLabelPt: 'Curto Alcance · Soco Dracônico',
      dsCost: 14,
      cooldownSec: 3.0,
      baseDamage: 102,
      atScalingRatio: 1.5,
      descriptionPt:
        'Desfere socos consecutivos ferozes com suas garras dracônicas de impacto direto.',
    },
    f2: {
      slot: 'f2',
      name: 'Crack Bite',
      element: 'fire',
      rangeLabelPt: 'Curto Alcance · Mordida Destruidora',
      dsCost: 29,
      cooldownSec: 5.5,
      baseDamage: 200,
      atScalingRatio: 2.2,
      descriptionPt:
        'Salta sobre o oponente com uma mordida elétrica feroz capaz de rachar armaduras.',
    },
  },
  strikedramon: {
    f1: {
      slot: 'f1',
      name: 'Strike Fang',
      element: 'fire',
      rangeLabelPt: 'Média Distância · Presas em Chamas',
      dsCost: 35,
      cooldownSec: 4.0,
      baseDamage: 212,
      atScalingRatio: 1.78,
      descriptionPt:
        'Envolve os punhos em fogo escaldante e desfere um golpe perfurante contra o alvo.',
    },
    f2: {
      slot: 'f2',
      name: 'Strike Claw',
      element: 'fire',
      rangeLabelPt: 'Curto Alcance · Garras Ardentes',
      dsCost: 68,
      cooldownSec: 6.5,
      baseDamage: 416,
      atScalingRatio: 2.66,
      descriptionPt:
        'Corta o inimigo em alta velocidade com lâminas de fogo projetadas de suas manoplas.',
    },
  },
  cyberdramon: {
    f1: {
      slot: 'f1',
      name: 'Erase Claw',
      element: 'iron',
      rangeLabelPt: 'Curto Alcance · Garra Apagadora',
      dsCost: 66,
      cooldownSec: 5.0,
      baseDamage: 512,
      atScalingRatio: 2.06,
      descriptionPt:
        'Desfere um golpe letal com suas garras de dados que apaga a defesa do alvo.',
    },
    f2: {
      slot: 'f2',
      name: 'Cyber Nail',
      element: 'iron',
      rangeLabelPt: 'Média Distância · Corte Cibernético',
      dsCost: 124,
      cooldownSec: 8.0,
      baseDamage: 998,
      atScalingRatio: 3.0,
      descriptionPt:
        'Dispara ondas cortantes de energia cibernética em sequência devastadora.',
    },
  },
  justimon: {
    f1: {
      slot: 'f1',
      name: 'Justice Kick',
      element: 'light',
      rangeLabelPt: 'Curto Alcance · Chute da Justiça',
      dsCost: 120,
      cooldownSec: 5.5,
      baseDamage: 1220,
      atScalingRatio: 2.36,
      descriptionPt:
        'Salta nos céus e desce com um chute voador fulminante carregado de luz heroica.',
    },
    f2: {
      slot: 'f2',
      name: 'Trinity Arm',
      element: 'light',
      rangeLabelPt: 'Média Distância · Braço da Trindade',
      dsCost: 230,
      cooldownSec: 9.5,
      baseDamage: 2450,
      atScalingRatio: 3.44,
      descriptionPt:
        'Ativa o modo supremo de seu braço mecânico liberando um corte luminoso arrasador.',
    },
  },
  // === 19. LINHA BIYOMON (Birdramon / Garudamon / Phoenixmon) ===
  biyomon: {
    f1: {
      slot: 'f1',
      name: 'Spiral Twister',
      element: 'fire',
      rangeLabelPt: 'Média Distância · Espiral de Fogo',
      dsCost: 22,
      cooldownSec: 3.0,
      baseDamage: 185,
      atScalingRatio: 1.48,
      descriptionPt:
        'Dispara um redemoinho espiral de chamas esmeraldas e quentes contra o inimigo.',
    },
    f2: {
      slot: 'f2',
      name: 'Pecking Attack',
      element: 'wind',
      rangeLabelPt: 'Curto Alcance · Investida Veloz',
      dsCost: 42,
      cooldownSec: 5.5,
      baseDamage: 350,
      atScalingRatio: 2.2,
      descriptionPt:
        'Avança em voo rasante aplicando bicadas sucessivas carregadas de energia aérea.',
    },
  },
  birdramon: {
    f1: {
      slot: 'f1',
      name: 'Meteor Wing',
      element: 'fire',
      rangeLabelPt: 'Longa Distância · Chuva de Meteoros',
      dsCost: 46,
      cooldownSec: 4.0,
      baseDamage: 425,
      atScalingRatio: 1.76,
      descriptionPt:
        'Bate suas asas incandescentes lançando uma rajada de penas flamejantes como meteoros.',
    },
    f2: {
      slot: 'f2',
      name: 'Fire Flap',
      element: 'fire',
      rangeLabelPt: 'Área Frontal · Vendaval Ardente',
      dsCost: 82,
      cooldownSec: 6.5,
      baseDamage: 810,
      atScalingRatio: 2.64,
      descriptionPt:
        'Gera uma onda de choque de fogo puro com um bater colossal de asas.',
    },
  },
  garudamon: {
    f1: {
      slot: 'f1',
      name: 'Wing Blade',
      element: 'wind',
      rangeLabelPt: 'Longa Distância · Lâmina Supersônica',
      dsCost: 78,
      cooldownSec: 5.0,
      baseDamage: 745,
      atScalingRatio: 2.04,
      descriptionPt:
        'Dispara uma lâmina de vácuo em forma de pássaro flamejante na velocidade do som.',
    },
    f2: {
      slot: 'f2',
      name: 'Shadow Wing',
      element: 'fire',
      rangeLabelPt: 'Média Distância · Ciclone Escarlate',
      dsCost: 144,
      cooldownSec: 8.0,
      baseDamage: 1490,
      atScalingRatio: 3.0,
      descriptionPt:
        'Envolve-se em chamas escarlates e mergulha gerando um vórtice devastador.',
    },
  },
  phoenixmon: {
    f1: {
      slot: 'f1',
      name: 'Crimson Flame',
      element: 'fire',
      rangeLabelPt: 'Média Distância · Fogo Sagrado',
      dsCost: 120,
      cooldownSec: 5.5,
      baseDamage: 1200,
      atScalingRatio: 2.34,
      descriptionPt:
        'Libera chamas sagradas carmesins que purificam e incineram o alvo instantaneamente.',
    },
    f2: {
      slot: 'f2',
      name: 'Starlight Explosion',
      element: 'light',
      rangeLabelPt: 'Área Total · Chuva Estelar Dourada',
      dsCost: 232,
      cooldownSec: 9.5,
      baseDamage: 2420,
      atScalingRatio: 3.4,
      descriptionPt:
        'Faz chover incontáveis esferas douradas de luz estelar abençoada sobre o campo.',
    },
  },
  // === 20. LINHA KUNEMON (Flymon / Okuwamon / GranKuwagamon) ===
  kunemon: {
    f1: {
      slot: 'f1',
      name: 'Electric Thread',
      element: 'thunder',
      rangeLabelPt: 'Média Distância · Fio Eletrizado',
      dsCost: 22,
      cooldownSec: 3.0,
      baseDamage: 185,
      atScalingRatio: 1.48,
      descriptionPt:
        'Dispara fios de seda carregados com alta voltagem que paralisam e chocam o alvo.',
    },
    f2: {
      slot: 'f2',
      name: 'Poison Ride',
      element: 'wood',
      rangeLabelPt: 'Média Distância · Rajada Tóxica',
      dsCost: 42,
      cooldownSec: 5.5,
      baseDamage: 350,
      atScalingRatio: 2.2,
      descriptionPt:
        'Lança um ferrão venenoso envolto em toxina ácida roxo-esmeralda.',
    },
  },
  flymon: {
    f1: {
      slot: 'f1',
      name: 'Deadly Sting',
      element: 'wind',
      rangeLabelPt: 'Curto Alcance · Ferroada Letal',
      dsCost: 46,
      cooldownSec: 4.0,
      baseDamage: 430,
      atScalingRatio: 1.78,
      descriptionPt:
        'Mergulha do alto cravando seu ferrão gigante carregado de veneno concentrado.',
    },
    f2: {
      slot: 'f2',
      name: 'Poison Powder',
      element: 'wood',
      rangeLabelPt: 'Área · Nuvem Venenosa',
      dsCost: 82,
      cooldownSec: 6.5,
      baseDamage: 815,
      atScalingRatio: 2.66,
      descriptionPt:
        'Espalha pólen tóxico corrosivo batendo suas asas em alta frequência.',
    },
  },
  okuwamon: {
    f1: {
      slot: 'f1',
      name: 'Scissor Arms Double',
      element: 'wood',
      rangeLabelPt: 'Curto Alcance · Tesoura Dupla',
      dsCost: 78,
      cooldownSec: 5.0,
      baseDamage: 755,
      atScalingRatio: 2.06,
      descriptionPt:
        'Corta tudo à frente com suas pinças energizadas em um golpe em X devastador.',
    },
    f2: {
      slot: 'f2',
      name: 'Destructive Impulse',
      element: 'darkness',
      rangeLabelPt: 'Longa Distância · Feixe Destrutivo',
      dsCost: 145,
      cooldownSec: 8.0,
      baseDamage: 1500,
      atScalingRatio: 3.0,
      descriptionPt:
        'Dispara um feixe concentrado de energia destrutiva que atravessa blindagens.',
    },
  },
  grankuwagamon: {
    f1: {
      slot: 'f1',
      name: 'Dimension Scissor',
      element: 'darkness',
      rangeLabelPt: 'Curto Alcance · Corte Dimensional',
      dsCost: 122,
      cooldownSec: 5.5,
      baseDamage: 1225,
      atScalingRatio: 2.36,
      descriptionPt:
        'Fende o próprio espaço ao fechar suas pinças colossais sobre o inimigo.',
    },
    f2: {
      slot: 'f2',
      name: 'Gran Killers',
      element: 'darkness',
      rangeLabelPt: 'Área · Detonação Abissal',
      dsCost: 235,
      cooldownSec: 9.5,
      baseDamage: 2460,
      atScalingRatio: 3.44,
      descriptionPt:
        'Concentra energia abissal carmesim nas mandíbulas e detona uma explosão avassaladora.',
    },
  },
};

export function getDigimonSkillSpecs(formId: DigimonFormId): DigimonSkillPair {
  return DMO_SKILL_CATALOG[formId] ?? DMO_SKILL_CATALOG.agumon;
}

export function getDmoSkillSpec(
  formId: DigimonFormId,
  slot: DmoSkillSlot
): DmoSkillSpec {
  const pair = getDigimonSkillSpecs(formId);
  return slot === 'f2' ? pair.f2 : pair.f1;
}

/**
 * Unified DMO-faithful damage formula shared identically by:
 * 1) Digimon Tab clickable F1/F2 Skill Inspector
 * 2) hudGameService.ts (computed attributes)
 * 3) TamerWorldCanvas.tsx (real live mob damage!)
 *
 * Ensures the exact numbers shown when the player clicks F1 or F2 match what lands on mobs.
 */
export function computeDmoSkillDamageBreakdown(
  formId: DigimonFormId,
  slot: DmoSkillSlot,
  attack: number,
  level: number,
  hatchGrade: HatchQualityGrade = 3,
  hatchSizePct?: number
): DmoSkillDamageBreakdown {
  const spec = getDmoSkillSpec(formId, slot);
  const clampedSize = clampHatchSizePct(hatchGrade, hatchSizePct);
  const hatchMult = computeHatchPowerMultiplier(hatchGrade, clampedSize);
  // Modest skill-rank growth with Digimon level (mirrors leveling F1/F2 skill points in DMO)
  const skillRankMult = 1 + Math.min(0.65, Math.max(0, level - 1) * 0.012);

  const basePowerPart = Math.round(spec.baseDamage * skillRankMult * hatchMult);
  const atBonusPart = Math.round(attack * spec.atScalingRatio);
  const neutral = Math.max(24, basePowerPart + atBonusPart);

  const attrAdvantage = Math.round(neutral * 1.25);
  const elemAdvantage = Math.round(neutral * 1.25);
  const fullAdvantage = Math.round(neutral * 1.5);
  const disadvantage = Math.max(12, Math.round(neutral * 0.85));

  const critNeutral = Math.round(neutral * 1.5);
  const critAttrAdvantage = Math.round(attrAdvantage * 1.5);
  const critFullAdvantage = Math.round(fullAdvantage * 1.5);

  return {
    spec,
    basePowerPart,
    atBonusPart,
    neutral,
    attrAdvantage,
    elemAdvantage,
    fullAdvantage,
    disadvantage,
    critNeutral,
    critAttrAdvantage,
    critFullAdvantage,
  };
}

/**
 * Evaluates live DMO Attribute + Skill Element advantage against a wild mob species.
 * Uses the exact symmetric registry in classification.ts:
 *  - Attribute advantage: +25% | Attribute disadvantage: -15%
 *  - Skill Element advantage: +25% | Element disadvantage: -10%
 *  - Both Strong (Attribute + Element): +50% (1.50x)
 */
export function computeDmoMatchupMultiplier(
  attackerFormId: DigimonFormId,
  targetSpeciesId: string,
  skillElement?: DigimonElementId
): DmoMatchupResult {
  const atkClass = getDigimonFormClassification(attackerFormId);
  const defClass = getWildDigimonClassification(targetSpeciesId);

  const atkAttrMeta = getDigimonAttributeMeta(atkClass.attribute);
  const attrStrong = atkAttrMeta.strongAgainst.some(
    (m) => m.targetId === defClass.attribute
  );
  const attrWeak = atkAttrMeta.weakAgainst.some(
    (m) => m.targetId === defClass.attribute
  );
  const attrState: 'strong' | 'weak' | 'neutral' = attrStrong
    ? 'strong'
    : attrWeak
      ? 'weak'
      : 'neutral';

  const effectiveElem = skillElement ?? atkClass.element;
  const atkElemMeta = getDigimonElementMeta(effectiveElem);
  const elemStrong = atkElemMeta.strongAgainst.some(
    (m) => m.targetId === defClass.element
  );
  // Light vs Darkness is mutually polarized — attacker gets the offensive bonus!
  const elemWeak =
    !elemStrong &&
    atkElemMeta.weakAgainst.some((m) => m.targetId === defClass.element);
  const elemState: 'strong' | 'weak' | 'neutral' = elemStrong
    ? 'strong'
    : elemWeak
      ? 'weak'
      : 'neutral';

  let bonus = 0;
  if (attrState === 'strong') bonus += 0.25;
  else if (attrState === 'weak') bonus -= 0.15;

  if (elemState === 'strong') bonus += 0.25;
  else if (elemState === 'weak') bonus -= 0.1;

  const multiplier = Number(Math.max(0.75, Math.min(1.5, 1 + bonus)).toFixed(2));
  const labelPt =
    attrState === 'strong' && elemState === 'strong'
      ? 'SUPER EFETIVO +50%'
      : attrState === 'strong' || elemState === 'strong'
        ? 'VANTAGEM +25%'
        : multiplier < 1
          ? 'RESISTIDO'
          : null;

  return {
    multiplier,
    attrState,
    elemState,
    labelPt,
  };
}
