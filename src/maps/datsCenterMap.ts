import type { CardinalDirection } from '../sprites/tamerRealSheets';
import {
  drawDimensionalPortalGate,
  drawDimensionalPortalGround,
} from './portalRenderer';

export const DATS_MAP_ID = 'dats-center' as const;
export const DATS_WORLD_W = 1600;
export const DATS_WORLD_H = 1480;
export const DATS_PLAZA_CENTER = { x: 800, y: 815 } as const;

export interface DatsCollider {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind:
    | 'building'
    | 'wall'
    | 'pillar'
    | 'tree'
    | 'bench'
    | 'terminal'
    | 'pavilion'
    | 'planter'
    | 'totem'
    | 'lamp'
    | 'incubator'
    | 'archive';
}

export type DatsInteractionKind =
  | 'main-entrance'
  | 'mission-npc'
  | 'info-npc'
  | 'tamer-terminal'
  | 'digimon-incubator'
  | 'digimon-archive'
  | 'world-portal';

export interface DatsInteractionPoint {
  id: string;
  kind: DatsInteractionKind;
  title: string;
  badge: string;
  description: string;
  futureModule: string;
  x: number;
  y: number;
  radius: number;
  accentColor: string;
}

export interface DatsSpawnSlot {
  index: number;
  x: number;
  y: number;
  facingDir: CardinalDirection;
}

/**
 * Eight non-overlapping spawn positions placed neatly around the central DATS floor emblem.
 */
export const DATS_SPAWN_SLOTS: readonly DatsSpawnSlot[] = [
  { index: 0, x: 800, y: 925, facingDir: 'S' },
  { index: 1, x: 742, y: 912, facingDir: 'E' },
  { index: 2, x: 858, y: 912, facingDir: 'W' },
  { index: 3, x: 760, y: 865, facingDir: 'S' },
  { index: 4, x: 840, y: 865, facingDir: 'S' },
  { index: 5, x: 728, y: 882, facingDir: 'E' },
  { index: 6, x: 872, y: 882, facingDir: 'W' },
  { index: 7, x: 800, y: 855, facingDir: 'S' },
] as const;

export function getSpawnSlotForAccount(accountUsername: string): DatsSpawnSlot {
  const clean = (accountUsername.trim() || 'tamer_local').toLowerCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  return DATS_SPAWN_SLOTS[hash % DATS_SPAWN_SLOTS.length];
}

export const DATS_INCUBATOR_STATION = {
  id: 'dats-digimon-incubator',
  x: 525,
  y: 778,
  standX: 525,
  standY: 794,
} as const;

export const DATS_ARCHIVE_STATION = {
  id: 'dats-digimon-archive',
  x: 380,
  y: 778,
  standX: 380,
  standY: 794,
} as const;

/**
 * Prepared interaction hotspots matching DATS Center installations & future MMORPG hooks.
 */
export const DATS_INTERACTION_POINTS: readonly DatsInteractionPoint[] = [
  {
    id: 'dats-main-entrance',
    kind: 'main-entrance',
    title: 'Entrada Principal — Prédio DATS',
    badge: 'Instalação DATS',
    description:
      'Acesso principal ao interior do Quartel-General da DATS no Mundo Digital.',
    futureModule: 'Acesso interno ao Hall da DATS e Salas de Comando',
    x: 800,
    y: 356,
    radius: 76,
    accentColor: '#38e8ff',
  },
  {
    id: 'dats-tamer-terminal',
    kind: 'tamer-terminal',
    title: 'Terminal de Gerenciamento dos Tamers',
    badge: 'Terminal',
    description:
      'Estação holográfica destinada à gestão de registro, status e equipamentos do Tamer.',
    futureModule: 'Gerenciamento de Perfil, Inventário e Digivice',
    x: 416,
    y: 668,
    radius: 74,
    accentColor: '#2be3ff',
  },
  {
    id: 'dats-digimon-archive',
    kind: 'digimon-archive',
    title: 'Digimon Archive',
    badge: 'Archive',
    description:
      'Terminal oficial da DATS para armazenar, gerenciar e alternar seus Digimons parceiros (50 slots totais).',
    futureModule: 'Armazenamento e Troca de Digimons Parceiros',
    x: DATS_ARCHIVE_STATION.x,
    y: DATS_ARCHIVE_STATION.y,
    radius: 84,
    accentColor: '#e879f9',
  },
  {
    id: 'dats-digimon-incubator',
    kind: 'digimon-incubator',
    title: 'Incubadora de Digimon',
    badge: 'Incubadora',
    description:
      'Estação tecnológica da DATS para chocar e reforçar DigiEggs do inventário.',
    futureModule: 'Chocador de DigiEgg e Reforço',
    x: DATS_INCUBATOR_STATION.x,
    y: DATS_INCUBATOR_STATION.y,
    radius: 86,
    accentColor: '#38e8ff',
  },
  {
    id: 'dats-mission-npc',
    kind: 'mission-npc',
    title: 'Posto de Missões DATS (NPC)',
    badge: 'Missões',
    description:
      'Pavilhão de atendimento preparado para os oficiais responsáveis pelas missões iniciais.',
    futureModule: 'Sistema de Missões Principais e Diárias da DATS',
    x: 1178,
    y: 668,
    radius: 78,
    accentColor: '#60a5fa',
  },
  {
    id: 'dats-info-npc',
    kind: 'info-npc',
    title: 'Balcão de Informações DATS (NPC)',
    badge: 'Informações',
    description:
      'Ponto de orientação para novos Tamers sobre rotas, mapa e regras do Mundo Digital.',
    futureModule: 'Guia Interativo e Tutorial do Mundo Digital',
    x: 988,
    y: 584,
    radius: 66,
    accentColor: '#34d399',
  },
  {
    id: 'dats-mudfrigimon-npc',
    kind: 'info-npc',
    title: 'MudFrigimon — NPC Oficial da DATS',
    badge: 'MudFrigimon',
    description:
      'Converse com o MudFrigimon na praça do DATS Center.',
    futureModule: 'Serviços e Missões Especiais do MudFrigimon',
    x: 1046,
    y: 768,
    radius: 86,
    accentColor: '#38e8ff',
  },
  {
    id: 'dats-player-market-npc',
    kind: 'info-npc',
    title: 'Miki — Mercado de Jogadores',
    badge: 'Mercado P2P',
    description:
      'Compre e venda DATA, DigiEggs e itens entre jogadores com vitrine pública de 2 minutos antes da liberação.',
    futureModule: 'Mercado de Jogadores da DATS',
    x: 1190,
    y: 768,
    radius: 86,
    accentColor: '#c084fc',
  },
  {
    id: 'digital-world-portal',
    kind: 'world-portal',
    title: 'Portal para D-Terminal',
    badge: 'D-Terminal',
    description:
      'Portal dimensional que leva diretamente à Estação D-Terminal, onde o Condutor PawnChessmon (Black) embarca os Tamers nos trens Trailmon.',
    futureModule: 'Acesso Direto ao D-Terminal',
    x: 800,
    y: 1318,
    radius: 86,
    accentColor: '#ffd43b',
  },
] as const;

/**
 * Physical collision bounds for buildings, railings, kiosks, benches, trees, planters & lamp posts.
 * Central stairway (x: 682..918, y: 318..530) and southern stairway (x: 685..915, y: 1140..1360) remain cleanly walkable.
 */
export const DATS_COLLIDERS: readonly DatsCollider[] = [
  // North HQ facade & flanking wing walls (split around the open central stairway!)
  { id: 'hq-left-facade', x: 510, y: 0, w: 174, h: 318, kind: 'building' },
  { id: 'hq-back-doors', x: 684, y: 0, w: 232, h: 316, kind: 'building' },
  { id: 'hq-right-facade', x: 916, y: 0, w: 174, h: 318, kind: 'building' },

  // Left & Right curved wing buildings + upper terrace railings beside central stairway
  { id: 'wing-left-bldg', x: 0, y: 0, w: 510, h: 436, kind: 'building' },
  { id: 'terrace-left', x: 510, y: 318, w: 138, h: 118, kind: 'wall' },
  { id: 'terrace-right', x: 952, y: 318, w: 138, h: 118, kind: 'wall' },
  { id: 'wing-right-bldg', x: 1090, y: 0, w: 510, h: 436, kind: 'building' },

  // Staircase glowing side walls/planters flanking central steps
  { id: 'stair-wall-left', x: 648, y: 318, w: 34, h: 214, kind: 'wall' },
  { id: 'stair-wall-right', x: 918, y: 318, w: 34, h: 214, kind: 'wall' },

  // Upper terrace trees flanking the stairs
  { id: 'tree-terrace-l', x: 548, y: 392, w: 66, h: 60, kind: 'tree' },
  { id: 'tree-terrace-r', x: 986, y: 392, w: 66, h: 60, kind: 'tree' },

  // Left Plaza Terminal Kiosk + Flanking Info Totems
  { id: 'left-terminal-booth', x: 332, y: 518, w: 168, h: 98, kind: 'terminal' },
  { id: 'left-totem-1', x: 266, y: 548, w: 38, h: 44, kind: 'totem' },
  { id: 'left-totem-2', x: 526, y: 548, w: 38, h: 44, kind: 'totem' },

  // Digimon Archive Terminal (positioned cleanly beside the Digimon Incubator)
  { id: 'dats-digimon-archive', x: 332, y: 696, w: 96, h: 64, kind: 'archive' },

  // Digimon Incubator Station (left-center plaza beside the central DATS emblem)
  { id: 'dats-digimon-incubator', x: 472, y: 696, w: 106, h: 64, kind: 'incubator' },

  // Right Plaza Glass Reception / Mission Pavilion + Info Totems
  { id: 'right-pavilion', x: 1094, y: 506, w: 184, h: 112, kind: 'pavilion' },
  { id: 'right-totem-info', x: 968, y: 506, w: 40, h: 44, kind: 'totem' },
  { id: 'right-totem-outer', x: 1304, y: 546, w: 38, h: 44, kind: 'totem' },

  // Inner stair banner light posts
  { id: 'lamp-inner-left', x: 616, y: 520, w: 32, h: 32, kind: 'lamp' },
  { id: 'lamp-inner-right', x: 952, y: 520, w: 32, h: 32, kind: 'lamp' },

  // Left & Right Plaza Greenery Borders, Trees & Benches
  { id: 'garden-left-top', x: 40, y: 470, w: 118, h: 140, kind: 'tree' },
  { id: 'garden-left-mid', x: 40, y: 690, w: 108, h: 130, kind: 'tree' },
  { id: 'garden-left-bot', x: 40, y: 900, w: 114, h: 130, kind: 'tree' },
  { id: 'bench-left-1', x: 166, y: 634, w: 34, h: 74, kind: 'bench' },
  { id: 'bench-left-2', x: 166, y: 834, w: 34, h: 74, kind: 'bench' },

  { id: 'garden-right-top', x: 1442, y: 470, w: 118, h: 140, kind: 'tree' },
  { id: 'garden-right-mid', x: 1452, y: 690, w: 108, h: 130, kind: 'tree' },
  { id: 'garden-right-bot', x: 1446, y: 900, w: 114, h: 130, kind: 'tree' },
  { id: 'bench-right-1', x: 1400, y: 634, w: 34, h: 74, kind: 'bench' },
  { id: 'bench-right-2', x: 1400, y: 834, w: 34, h: 74, kind: 'bench' },

  // Foreground Left & Right Stone Planters + Lamp Posts framing South Exit Stairs
  { id: 'planter-south-left', x: 140, y: 1110, w: 460, h: 112, kind: 'planter' },
  { id: 'planter-south-right', x: 1000, y: 1110, w: 460, h: 112, kind: 'planter' },
  { id: 'lamp-fg-left', x: 478, y: 1088, w: 36, h: 36, kind: 'lamp' },
  { id: 'lamp-fg-right', x: 1086, y: 1088, w: 36, h: 36, kind: 'lamp' },

  // Perimeter trees along southern plaza wings
  { id: 'tree-south-left', x: 52, y: 1255, w: 104, h: 104, kind: 'tree' },
  { id: 'tree-south-right', x: 1444, y: 1255, w: 104, h: 104, kind: 'tree' },
] as const;

interface DepthProp {
  sortY: number;
  draw: (ctx: CanvasRenderingContext2D, elapsed: number) => void;
}

function drawDatsEmblem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  drawText: boolean
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer glowing neon ring
  ctx.fillStyle = 'rgba(0, 128, 255, 0.24)';
  ctx.beginPath();
  ctx.ellipse(0, 0, rx + 12, ry + 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#07368c';
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#38e8ff';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Inner segmented tech ring
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.85)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([28, 12]);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.84, ry * 0.82, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#0a52c7';
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.72, ry * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stylized white DATS spiral emblem
  ctx.save();
  ctx.scale(1, ry / rx);
  ctx.translate(0, drawText ? -rx * 0.19 : 0);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, rx * 0.16, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3, rx * 0.065);
  ctx.lineCap = 'round';
  for (let a = 0; a < 3; a++) {
    const startA = (a * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.arc(0, 0, rx * 0.29, startA, startA + 1.35);
    ctx.stroke();
  }
  ctx.restore();

  if (drawText) {
    ctx.font = `900 ${Math.round(ry * 0.34)}px "Russo One", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(56, 232, 255, 0.75)';
    ctx.lineWidth = 3;
    ctx.strokeText('DATS', 0, ry * 0.34);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('DATS', 0, ry * 0.34);
  }

  ctx.restore();
}

function drawRoundedPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/**
 * Generates an offscreen static canvas (1600x1480) of the DATS Center ground,
 * central floor emblem, sky/buildings silhouette, billboards, stairs, and skybridge
 * for ultra-smooth 60fps mobile Canvas 2D exploration.
 */
export function buildDatsCenterStaticLayer(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = DATS_WORLD_W;
  canvas.height = DATS_WORLD_H;
  const ctx = canvas.getContext('2d')!;

  // 1. Vibrant blue Digital World sky & distant futuristic towers behind HQ
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 440);
  skyGrad.addColorStop(0, '#0a4cc4');
  skyGrad.addColorStop(0.55, '#1e88e5');
  skyGrad.addColorStop(1, '#5ec8ff');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, DATS_WORLD_W, 440);

  // Crisp anime-style clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  const clouds = [
    [130, 62, 60],
    [180, 56, 48],
    [430, 74, 52],
    [1180, 52, 58],
    [1240, 62, 46],
    [1460, 72, 54],
  ];
  for (const [cx, cy, cr] of clouds) {
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant city skyline towers (matching reference image upper right/left towers)
  const towers = [
    { x: 460, y: 38, w: 68, h: 250, spire: false },
    { x: 1095, y: 24, w: 54, h: 265, spire: true },
    { x: 1215, y: 68, w: 72, h: 220, spire: false },
    { x: 1410, y: 16, w: 120, h: 280, spire: false },
  ];
  for (const t of towers) {
    ctx.fillStyle = '#3b6cb7';
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.fillStyle = '#60a5fa';
    for (let wy = t.y + 14; wy < t.y + t.h - 20; wy += 16) {
      ctx.fillRect(t.x + 8, wy, t.w - 16, 7);
    }
    if (t.spire) {
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(t.x + t.w / 2 - 4, t.y - 42, 8, 42);
      ctx.beginPath();
      ctx.ellipse(t.x + t.w / 2, t.y + 44, 34, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Plaza Tiled Pavement (clean silver-blue metallic/stone tiles)
  const floorGrad = ctx.createLinearGradient(0, 420, 0, DATS_WORLD_H);
  floorGrad.addColorStop(0, '#9fb6d6');
  floorGrad.addColorStop(0.45, '#b8cbe3');
  floorGrad.addColorStop(1, '#8ea6c9');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 420, DATS_WORLD_W, DATS_WORLD_H - 420);

  // Plaza tile seams & subtle glossy blue reflection bands
  const tileSize = 64;
  ctx.strokeStyle = 'rgba(30, 58, 110, 0.28)';
  ctx.lineWidth = 1.5;
  for (let y = 420; y < DATS_WORLD_H; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(DATS_WORLD_W, y);
    ctx.stroke();
  }
  for (let x = 0; x <= DATS_WORLD_W; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 420);
    ctx.lineTo(x, DATS_WORLD_H);
    ctx.stroke();
  }

  // Subtle blue glass reflection stripes on the plaza
  ctx.fillStyle = 'rgba(56, 189, 248, 0.11)';
  ctx.fillRect(220, 440, 1160, 120);
  ctx.fillRect(580, 560, 440, 560);

  // Neon cyan plaza floor border lines
  ctx.strokeStyle = 'rgba(14, 165, 233, 0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(175, 458, 1250, 646);

  // 3. Central Inlaid DATS Emblem Medallion on the Plaza Floor
  drawDatsEmblem(
    ctx,
    DATS_PLAZA_CENTER.x,
    DATS_PLAZA_CENTER.y,
    185,
    118,
    true
  );

  // 4. Elevated Right Glass Skybridge connecting Center HQ to Right Wing
  ctx.fillStyle = '#0c4a9e';
  ctx.fillRect(1020, 178, 140, 56);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(1020, 188, 140, 32);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.strokeRect(1020, 178, 140, 56);

  // 5. Left & Right Flanking DATS Wing Buildings + "BEM-VINDOS AO MUNDO DIGITAL" Billboards
  function drawWingBuilding(
    bx: number,
    bw: number,
    align: 'left' | 'right'
  ) {
    // Main white/silver concrete structure
    const bGrad = ctx.createLinearGradient(bx, 20, bx, 430);
    bGrad.addColorStop(0, '#d8e4f2');
    bGrad.addColorStop(0.6, '#b4c6de');
    bGrad.addColorStop(1, '#7a94b8');
    ctx.fillStyle = bGrad;
    ctx.fillRect(bx, 34, bw, 396);

    // Upper blue glass stories
    ctx.fillStyle = '#0a3a82';
    ctx.fillRect(bx + 18, 52, bw - 36, 72);
    ctx.fillStyle = '#1e78d6';
    for (let wx = bx + 28; wx < bx + bw - 48; wx += 44) {
      ctx.fillRect(wx, 60, 34, 56);
    }

    // Lower arcade & glass storefront under terrace balcony
    ctx.fillStyle = '#08275e';
    ctx.fillRect(bx + 14, 304, bw - 28, 126);
    ctx.fillStyle = '#0ea5e9';
    for (let wx = bx + 26; wx < bx + bw - 52; wx += 58) {
      ctx.fillRect(wx, 316, 44, 102);
    }

    // Terrace Balcony & Steel Railing Band
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(bx, 286, bw, 22);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(bx, 306, bw, 4);

    // Massive LED Billboard ("BEM-VINDOS AO MUNDO DIGITAL")
    const screenX = align === 'left' ? bx + 42 : bx + 28;
    const screenW = bw - 70;
    const screenY = 122;
    const screenH = 148;

    ctx.fillStyle = '#1e293b';
    drawRoundedPanel(ctx, screenX - 6, screenY - 6, screenW + 12, screenH + 12, 8);
    ctx.fill();

    const scrGrad = ctx.createLinearGradient(screenX, screenY, screenX, screenY + screenH);
    scrGrad.addColorStop(0, '#002a7a');
    scrGrad.addColorStop(0.5, '#0055c9');
    scrGrad.addColorStop(1, '#002266');
    ctx.fillStyle = scrGrad;
    drawRoundedPanel(ctx, screenX, screenY, screenW, screenH, 5);
    ctx.fill();

    ctx.strokeStyle = '#38e8ff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Corner circuit accents
    ctx.strokeStyle = 'rgba(56, 232, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX + 8, screenY + 8, screenW - 16, screenH - 16);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 30px "Russo One", sans-serif';
    ctx.fillText('BEM-VINDOS', screenX + screenW / 2, screenY + 42);
    ctx.font = '800 22px "Russo One", sans-serif';
    ctx.fillText('AO', screenX + screenW / 2, screenY + 76);
    ctx.fillStyle = '#38e8ff';
    ctx.font = '900 32px "Russo One", sans-serif';
    ctx.fillText('MUNDO DIGITAL', screenX + screenW / 2, screenY + 114);
  }

  drawWingBuilding(0, 504, 'left');
  drawWingBuilding(1096, 504, 'right');

  // 6. Central DATS Headquarters Building
  // Stepped white/silver tower silhouette
  const hqX = 504;
  const hqW = 592;
  const hqGrad = ctx.createLinearGradient(hqX, 0, hqX, 340);
  hqGrad.addColorStop(0, '#e2ebf5');
  hqGrad.addColorStop(0.5, '#bfd1e6');
  hqGrad.addColorStop(1, '#8aa5c7');
  ctx.fillStyle = hqGrad;
  ctx.fillRect(hqX, 46, hqW, 294);

  // Central glass spire crown
  ctx.fillStyle = '#b4c6de';
  ctx.fillRect(710, 0, 180, 60);
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(736, 4, 128, 52);

  // Curved glass wall bays flanking center
  ctx.fillStyle = '#07357a';
  ctx.fillRect(520, 74, 560, 240);
  ctx.fillStyle = '#146bc9';
  for (let gx = 532; gx <= 1030; gx += 48) {
    ctx.fillRect(gx, 84, 34, 210);
  }

  // Central Curved DATS Header Screen
  ctx.fillStyle = '#0f172a';
  drawRoundedPanel(ctx, 624, 96, 352, 138, 10);
  ctx.fill();
  const cScr = ctx.createLinearGradient(630, 102, 630, 228);
  cScr.addColorStop(0, '#00246b');
  cScr.addColorStop(1, '#0056cc');
  ctx.fillStyle = cScr;
  drawRoundedPanel(ctx, 630, 102, 340, 126, 7);
  ctx.fill();
  ctx.strokeStyle = '#38e8ff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Swirl + DATS inside central HQ screen
  ctx.save();
  ctx.translate(800, 146);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  for (let a = 0; a < 3; a++) {
    const startA = (a * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.arc(0, 0, 18, startA, startA + 1.35);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 34px "Russo One", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DATS', 800, 200);

  // Main Entrance Canopy & Glowing Glass Double Doors (y = 246..320)
  ctx.fillStyle = '#082d6e';
  drawRoundedPanel(ctx, 682, 242, 236, 78, 6);
  ctx.fill();
  ctx.strokeStyle = '#38e8ff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 18px "Russo One", sans-serif';
  ctx.fillText('DATS', 800, 260);

  // Glowing Cyan Glass Doors
  const doorGrad = ctx.createLinearGradient(736, 270, 736, 320);
  doorGrad.addColorStop(0, '#38e8ff');
  doorGrad.addColorStop(1, '#0284c7');
  ctx.fillStyle = doorGrad;
  ctx.fillRect(732, 270, 66, 50);
  ctx.fillRect(802, 270, 66, 50);
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 2;
  ctx.strokeRect(732, 270, 66, 50);
  ctx.strokeRect(802, 270, 66, 50);

  // Upper Terrace Ground Band & Balcony Railing (y = 318..436)
  ctx.fillStyle = '#9bb3d4';
  ctx.fillRect(504, 318, 592, 118);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(504, 422, 146, 14);
  ctx.fillRect(950, 422, 146, 14);
  ctx.strokeStyle = '#38e8ff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(504, 434);
  ctx.lineTo(650, 434);
  ctx.moveTo(950, 434);
  ctx.lineTo(1096, 434);
  ctx.stroke();
  // Balcony rail posts
  ctx.fillStyle = '#e2e8f0';
  for (let rx = 516; rx <= 640; rx += 28) ctx.fillRect(rx, 412, 4, 14);
  for (let rx = 960; rx <= 1084; rx += 28) ctx.fillRect(rx, 412, 4, 14);
  ctx.fillRect(504, 410, 146, 3);
  ctx.fillRect(950, 410, 146, 3);

  // 7. Grand Central Walkable Stairway (x = 682..918, y = 320..532)
  const stairX = 682;
  const stairW = 236;
  const stepCount = 13;
  const stepH = (532 - 320) / stepCount;
  for (let i = 0; i < stepCount; i++) {
    const sy = 320 + i * stepH;
    ctx.fillStyle = i % 2 === 0 ? '#b7cae2' : '#9ab2d1';
    ctx.fillRect(stairX, sy, stairW, stepH);
    ctx.fillStyle = '#475569';
    ctx.fillRect(stairX, sy + stepH - 2, stairW, 2);
  }
  // Glowing blue staircase side walls
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(650, 318, 32, 214);
  ctx.fillRect(918, 318, 32, 214);
  ctx.fillStyle = '#00c8ff';
  ctx.fillRect(676, 318, 6, 214);
  ctx.fillRect(918, 318, 6, 214);

  // 8. Southern Stairway & Digital World Portal Promenade (y = 1110..1480)
  ctx.fillStyle = '#7c95ba';
  ctx.fillRect(0, 1222, DATS_WORLD_W, 258);

  // South staircase steps (x = 602..998, y = 1114..1222)
  const sSteps = 6;
  const sStepH = 108 / sSteps;
  for (let i = 0; i < sSteps; i++) {
    const sy = 1114 + i * sStepH;
    ctx.fillStyle = i % 2 === 0 ? '#aebfd9' : '#8ea6c7';
    ctx.fillRect(602, sy, 396, sStepH);
    ctx.fillStyle = '#475569';
    ctx.fillRect(602, sy + sStepH - 2, 396, 2);
  }
  // Neon side trims on south stairs
  ctx.fillStyle = '#00c8ff';
  ctx.fillRect(600, 1112, 6, 112);
  ctx.fillRect(994, 1112, 6, 112);

  // Southern Portal Platform Base
  ctx.fillStyle = '#0b2252';
  ctx.beginPath();
  ctx.ellipse(800, 1326, 116, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#38e8ff';
  ctx.lineWidth = 4;
  ctx.stroke();

  return canvas;
}

function drawTreeOrGreenery(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  // Stone planter border
  ctx.fillStyle = '#94a3b8';
  drawRoundedPanel(ctx, x, y + h * 0.45, w, h * 0.55, 10);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Lush foliage canopy
  const cx = x + w / 2;
  const cy = y + h * 0.34;
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(cx, cy + 6, w * 0.42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 4, w * 0.33, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.arc(cx + 6, cy - 10, w * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBench(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.fillRect(x + 4, y + 6, w, h);

  ctx.fillStyle = '#475569';
  drawRoundedPanel(ctx, x, y, w, h, 5);
  ctx.fill();

  // Warm wood slats matching reference image side benches
  ctx.fillStyle = '#b45309';
  ctx.fillRect(x + 4, y + 5, w - 8, h - 10);
  ctx.fillStyle = '#d97706';
  ctx.fillRect(x + 6, y + 8, w - 12, (h - 16) * 0.42);
  ctx.fillRect(x + 6, y + h * 0.54, w - 12, (h - 16) * 0.36);
  ctx.restore();
}

function drawLampWithBanner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const cx = x + w / 2;
  const baseY = y + h;
  ctx.save();

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pedestal base with glowing cyan core
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx - 9, baseY - 38, 18, 38);
  ctx.fillStyle = '#00d4ff';
  ctx.fillRect(cx - 4, baseY - 32, 8, 22);

  // Pole
  ctx.fillStyle = '#334155';
  ctx.fillRect(cx - 3, baseY - 118, 6, 82);

  // Hanging vertical DATS Blue Banner
  ctx.fillStyle = '#0055cc';
  ctx.beginPath();
  ctx.moveTo(cx - 16, baseY - 98);
  ctx.lineTo(cx + 16, baseY - 98);
  ctx.lineTo(cx + 16, baseY - 46);
  ctx.lineTo(cx, baseY - 36);
  ctx.lineTo(cx - 16, baseY - 46);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Mini white DATS label on banner
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 7.5px "Russo One", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DATS', cx, baseY - 60);

  // Lantern head
  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.arc(cx, baseY - 122, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(56, 232, 255, 0.35)';
  ctx.beginPath();
  ctx.arc(cx, baseY - 122, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawGlassTerminalOrPavilion(
  ctx: CanvasRenderingContext2D,
  c: DatsCollider,
  elapsed: number,
  isPavilion: boolean
) {
  ctx.save();
  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  drawRoundedPanel(ctx, c.x + 4, c.y + 8, c.w, c.h, 12);
  ctx.fill();

  // Futuristic metallic base
  ctx.fillStyle = '#1e3a6e';
  drawRoundedPanel(ctx, c.x, c.y + 18, c.w, c.h - 18, 10);
  ctx.fill();

  // Glowing cyan glass booth body
  const glassGrad = ctx.createLinearGradient(c.x, c.y, c.x, c.y + c.h);
  glassGrad.addColorStop(0, 'rgba(56, 232, 255, 0.55)');
  glassGrad.addColorStop(1, 'rgba(0, 102, 230, 0.8)');
  ctx.fillStyle = glassGrad;
  drawRoundedPanel(ctx, c.x + 8, c.y + 6, c.w - 16, c.h - 24, 8);
  ctx.fill();
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Roof frame
  ctx.fillStyle = '#cbd5e1';
  drawRoundedPanel(ctx, c.x - 4, c.y - 10, c.w + 8, 24, 8);
  ctx.fill();
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(c.x + 6, c.y + 10, c.w - 12, 4);

  // Subtle holographic pulse inside glass booth
  const pulse = 0.55 + Math.sin(elapsed * 3.2) * 0.25;
  ctx.fillStyle = `rgba(186, 230, 253, ${pulse})`;
  if (isPavilion) {
    ctx.fillRect(c.x + 28, c.y + 24, c.w - 56, 36);
    ctx.font = '800 10px "Russo One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('MISSÕES', c.x + c.w / 2, c.y + 46);
  } else {
    ctx.fillRect(c.x + 24, c.y + 24, c.w - 48, 30);
    ctx.font = '800 10px "Russo One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('TERMINAL', c.x + c.w / 2, c.y + 43);
  }

  ctx.restore();
}

function drawTotem(
  ctx: CanvasRenderingContext2D,
  c: DatsCollider,
  elapsed: number
) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(c.x + 3, c.y + 8, c.w, c.h - 4);

  ctx.fillStyle = '#cbd5e1';
  drawRoundedPanel(ctx, c.x, c.y - 16, c.w, c.h + 16, 6);
  ctx.fill();

  const glow = 0.72 + Math.sin(elapsed * 4) * 0.2;
  ctx.fillStyle = `rgba(0, 175, 255, ${glow})`;
  ctx.fillRect(c.x + 6, c.y - 8, c.w - 12, c.h - 4);
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(c.x + 6, c.y - 8, c.w - 12, c.h - 4);
  ctx.restore();
}

function drawSouthPlanter(ctx: CanvasRenderingContext2D, c: DatsCollider) {
  ctx.save();
  // Stone wall planter box
  ctx.fillStyle = '#cbd5e1';
  drawRoundedPanel(ctx, c.x, c.y + 18, c.w, c.h - 18, 10);
  ctx.fill();
  ctx.strokeStyle = '#38e8ff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Blue neon underglow strip
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(c.x + 8, c.y + c.h - 8, c.w - 16, 5);

  // Shrubbery & small colorful flowers inside stone bed
  ctx.fillStyle = '#16a34a';
  drawRoundedPanel(ctx, c.x + 12, c.y + 6, c.w - 24, c.h - 38, 12);
  ctx.fill();
  ctx.fillStyle = '#4ade80';
  for (let fx = c.x + 32; fx < c.x + c.w - 30; fx += 44) {
    ctx.beginPath();
    ctx.arc(fx, c.y + 30, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.fillRect(fx - 3, c.y + 28, 4, 4);
    ctx.fillStyle = '#4ade80';
  }
  ctx.restore();
}

/**
 * Draws the animated ground details (central DATS floor pulse, southern Digital World Portal swirl,
 * and subtle interaction point floor rings) below characters and depth props.
 */
export function drawDatsGroundAnimations(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  activePointId: string | null
) {
  // Subtle rotating energy ring around central DATS medallion
  ctx.save();
  ctx.translate(DATS_PLAZA_CENTER.x, DATS_PLAZA_CENTER.y);
  ctx.rotate(elapsed * 0.25);
  ctx.strokeStyle = 'rgba(56, 232, 255, 0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([22, 18]);
  ctx.beginPath();
  ctx.ellipse(0, 0, 196, 126, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Animated Southern Digital World Portal (real dimensional dais + energy pool)
  drawDimensionalPortalGround(
    ctx,
    800,
    1326,
    elapsed,
    activePointId === 'digital-world-portal',
    { scale: 1.1, theme: 'digital' }
  );

  // Interaction Point floor markers (skip fixed NPCs and portal that render their own fitted aura)
  for (const pt of DATS_INTERACTION_POINTS) {
    if (
      pt.id === 'dats-mudfrigimon-npc' ||
      pt.id === 'dats-player-market-npc' ||
      pt.id === 'digital-world-portal' ||
      pt.id === 'dats-digimon-incubator' ||
      pt.id === 'dats-digimon-archive'
    ) {
      continue;
    }
    const isNear = pt.id === activePointId;
    const pPulse = 1 + Math.sin(elapsed * 4.2) * (isNear ? 0.14 : 0.06);
    ctx.save();
    ctx.strokeStyle = isNear ? '#ffd43b' : pt.accentColor;
    ctx.globalAlpha = isNear ? 0.95 : 0.48;
    ctx.lineWidth = isNear ? 3 : 2;
    ctx.beginPath();
    ctx.ellipse(pt.x, pt.y, 26 * pPulse, 14 * pPulse, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = isNear ? 'rgba(255, 212, 59, 0.24)' : 'rgba(56, 232, 255, 0.14)';
    ctx.fill();
    ctx.restore();
  }
}

let incubatorMachineImg: HTMLImageElement | null = null;
let incubatorMachineImgLoaded = false;

function getIncubatorMachineSprite(): HTMLImageElement | null {
  if (typeof window === 'undefined') return null;
  if (!incubatorMachineImg) {
    incubatorMachineImg = new Image();
    incubatorMachineImg.onload = () => {
      incubatorMachineImgLoaded = true;
    };
    incubatorMachineImg.src = '/assets/dats/digimon_incubator_machine.png';
  }
  return incubatorMachineImgLoaded && incubatorMachineImg.naturalWidth > 0
    ? incubatorMachineImg
    : null;
}

function drawIncubatorMachine(
  ctx: CanvasRenderingContext2D,
  c: DatsCollider,
  elapsed: number,
  world3DCanvas: HTMLCanvasElement | null,
  isNearby: boolean
) {
  const cx = c.x + c.w / 2;
  const baseY = c.y + c.h - 14;
  const pulse = 0.65 + Math.sin(elapsed * 3.2) * 0.35;

  ctx.save();

  // 1. Soft ambient cyan plaza pool blending seamlessly with DATS tiles
  const glowGrad = ctx.createRadialGradient(cx, baseY + 6, 10, cx, baseY + 6, 86);
  glowGrad.addColorStop(0, `rgba(56, 232, 255, ${isNearby ? 0.48 : 0.3})`);
  glowGrad.addColorStop(0.55, `rgba(14, 165, 233, ${0.14 + pulse * 0.06})`);
  glowGrad.addColorStop(1, 'rgba(0, 120, 255, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 6, 84, 34, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Architectural DATS Recessed Floor Pad & Contact Shadow (grounds the 3D machine in the plaza)
  ctx.fillStyle = 'rgba(2, 8, 26, 0.45)';
  ctx.beginPath();
  ctx.ellipse(cx + 3, baseY + 8, 60, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  const padGrad = ctx.createLinearGradient(cx - 56, baseY - 12, cx + 56, baseY + 20);
  padGrad.addColorStop(0, '#1e293b');
  padGrad.addColorStop(0.5, '#334155');
  padGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = padGrad;
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 4, 58, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isNearby ? '#fde047' : 'rgba(56, 232, 255, 0.8)';
  ctx.lineWidth = isNearby ? 2.4 : 1.8;
  ctx.stroke();

  // Inner tech floor ring
  ctx.save();
  ctx.translate(cx, baseY + 4);
  ctx.strokeStyle = isNearby
    ? 'rgba(253, 224, 71, 0.8)'
    : `rgba(125, 211, 252, ${0.45 + pulse * 0.35})`;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([12, 9]);
  ctx.lineDashOffset = -elapsed * 18;
  ctx.beginPath();
  ctx.ellipse(0, 0, 66, 26, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 3. Official Digimon Incubator Machine Sprite seated flush on the DATS dock pad (matching Digimon Archive)
  const sprite = getIncubatorMachineSprite();
  if (sprite) {
    const drawH = 148;
    const drawW = Math.round((sprite.naturalWidth / sprite.naturalHeight) * drawH);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      sprite,
      cx - drawW / 2,
      baseY - drawH + 14,
      drawW,
      drawH
    );
    ctx.restore();

    // Subtle live holographic shimmer pulse over the central cyan DigiEgg glass chamber
    const chamberPulse = 0.08 + Math.sin(elapsed * 4.0) * 0.06;
    ctx.fillStyle = `rgba(56, 232, 255, ${chamberPulse})`;
    ctx.beginPath();
    ctx.ellipse(cx, baseY - 64, 24, 28, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (world3DCanvas) {
    const drawSize = 188;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      world3DCanvas,
      cx - drawSize / 2,
      baseY - drawSize * 0.72,
      drawSize,
      drawSize
    );
    ctx.restore();
  } else {
    ctx.fillStyle = '#6b2fd6';
    drawRoundedPanel(ctx, cx - 32, baseY - 88, 64, 80, 18);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    drawRoundedPanel(ctx, cx - 50, baseY - 76, 16, 60, 6);
    ctx.fill();
    drawRoundedPanel(ctx, cx + 34, baseY - 76, 16, 60, 6);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(cx - 50, baseY - 82, 16, 8);
    ctx.fillRect(cx + 34, baseY - 82, 16, 8);
  }

  // 4. Rising subtle digital energy motes
  for (let i = 0; i < 4; i++) {
    const phase = (elapsed * 0.58 + i * 0.25) % 1;
    const px = cx + Math.sin(elapsed * 2.1 + i * 1.8) * 30;
    const py = baseY - 12 - phase * 92;
    ctx.fillStyle = `rgba(125, 249, 255, ${(1 - phase) * 0.65})`;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Clean Floating DATS Overhead Tag (exact same height & proportion as Digimon Archive)
  const bob = Math.sin(elapsed * 2.6) * 2;
  const tagW = 128;
  const tagH = 30;
  const tagX = cx - tagW / 2;
  const tagY = baseY - 166 + bob;

  ctx.fillStyle = 'rgba(4, 21, 62, 0.92)';
  drawRoundedPanel(ctx, tagX, tagY, tagW, tagH, 7);
  ctx.fill();
  ctx.strokeStyle = isNearby ? '#fde047' : 'rgba(56, 232, 255, 0.88)';
  ctx.lineWidth = isNearby ? 2 : 1.4;
  ctx.stroke();

  // Mini Incubator Capsule + DigiEgg emblem on left of sign (matching Archive mini terminal style)
  ctx.fillStyle = '#4f46e5';
  drawRoundedPanel(ctx, tagX + 8, tagY + 6, 14, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#38e8ff';
  drawRoundedPanel(ctx, tagX + 10, tagY + 9, 10, 12, 3);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(tagX + 15, tagY + 15, 3.2, 4.4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '800 10px "Exo 2", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Incubadora', tagX + 27, tagY + 10);
  ctx.fillStyle = '#fde047';
  ctx.font = '800 9.5px "Exo 2", sans-serif';
  ctx.fillText('de Digimon', tagX + 27, tagY + 21);

  if (isNearby) {
    ctx.textAlign = 'center';
    ctx.font = '900 9.5px "Exo 2", sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('Toque ou [E] Chocar', cx, tagY - 9);
  }

  ctx.restore();
}

let archiveMachineImg: HTMLImageElement | null = null;
let archiveMachineImgLoaded = false;

function getArchiveMachineSprite(): HTMLImageElement | null {
  if (typeof window === 'undefined') return null;
  if (!archiveMachineImg) {
    archiveMachineImg = new Image();
    archiveMachineImg.onload = () => {
      archiveMachineImgLoaded = true;
    };
    archiveMachineImg.src = '/assets/dats/digimon_archive_machine.png';
  }
  return archiveMachineImgLoaded && archiveMachineImg.naturalWidth > 0
    ? archiveMachineImg
    : null;
}

function drawDigimonArchiveMachine(
  ctx: CanvasRenderingContext2D,
  c: DatsCollider,
  elapsed: number,
  isNearby: boolean
) {
  const cx = c.x + c.w / 2;
  const baseY = c.y + c.h - 14;
  const pulse = 0.65 + Math.sin(elapsed * 3.1 + 1.1) * 0.35;

  ctx.save();

  // 1. Ambient cyan-magenta DATS plaza glow pool (matches Incubator dock style)
  const glowGrad = ctx.createRadialGradient(cx, baseY + 6, 10, cx, baseY + 6, 84);
  glowGrad.addColorStop(0, `rgba(56, 232, 255, ${isNearby ? 0.5 : 0.32})`);
  glowGrad.addColorStop(0.5, `rgba(217, 70, 239, ${0.16 + pulse * 0.06})`);
  glowGrad.addColorStop(1, 'rgba(0, 120, 255, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 6, 80, 32, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Architectural DATS Recessed Floor Pad & Contact Shadow
  ctx.fillStyle = 'rgba(2, 8, 26, 0.48)';
  ctx.beginPath();
  ctx.ellipse(cx + 3, baseY + 8, 56, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  const padGrad = ctx.createLinearGradient(cx - 52, baseY - 12, cx + 52, baseY + 20);
  padGrad.addColorStop(0, '#1e293b');
  padGrad.addColorStop(0.5, '#334155');
  padGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = padGrad;
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 4, 54, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isNearby ? '#fde047' : 'rgba(232, 121, 249, 0.85)';
  ctx.lineWidth = isNearby ? 2.4 : 1.8;
  ctx.stroke();

  // Rotating holographic floor ring
  ctx.save();
  ctx.translate(cx, baseY + 4);
  ctx.strokeStyle = isNearby
    ? 'rgba(253, 224, 71, 0.85)'
    : `rgba(56, 232, 255, ${0.45 + pulse * 0.35})`;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([12, 9]);
  ctx.lineDashOffset = elapsed * 18;
  ctx.beginPath();
  ctx.ellipse(0, 0, 62, 24, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 3. Official Digimon Archive Machine Sprite seated flush on the DATS dock pad
  const sprite = getArchiveMachineSprite();
  if (sprite) {
    const drawH = 148;
    const drawW = Math.round((sprite.naturalWidth / sprite.naturalHeight) * drawH);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      sprite,
      cx - drawW / 2,
      baseY - drawH + 14,
      drawW,
      drawH
    );
    ctx.restore();

    // Subtle live holographic shimmer pulse over the blue screen area
    const screenPulse = 0.08 + Math.sin(elapsed * 4.2) * 0.06;
    ctx.fillStyle = `rgba(56, 232, 255, ${screenPulse})`;
    ctx.beginPath();
    ctx.ellipse(cx - 4, baseY - 78, 22, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Crisp vector fallback while image finishes loading
    ctx.fillStyle = '#c026d3';
    drawRoundedPanel(ctx, cx - 34, baseY - 122, 68, 126, 12);
    ctx.fill();
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(cx - 24, baseY - 94, 48, 34);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(cx - 22, baseY - 50, 44, 28);
  }

  // 4. Rising digital data motes
  for (let i = 0; i < 4; i++) {
    const phase = (elapsed * 0.54 + i * 0.25 + 0.12) % 1;
    const px = cx + Math.sin(elapsed * 2.0 + i * 1.9) * 28;
    const py = baseY - 12 - phase * 92;
    ctx.fillStyle =
      i % 2 === 0
        ? `rgba(232, 121, 249, ${(1 - phase) * 0.65})`
        : `rgba(125, 249, 255, ${(1 - phase) * 0.65})`;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Clean Floating DATS Overhead Tag (matching Incubator nameplate)
  const bob = Math.sin(elapsed * 2.6 + 0.8) * 2;
  const tagW = 128;
  const tagH = 30;
  const tagX = cx - tagW / 2;
  const tagY = baseY - 166 + bob;

  ctx.fillStyle = 'rgba(4, 21, 62, 0.92)';
  drawRoundedPanel(ctx, tagX, tagY, tagW, tagH, 7);
  ctx.fill();
  ctx.strokeStyle = isNearby ? '#fde047' : 'rgba(232, 121, 249, 0.88)';
  ctx.lineWidth = isNearby ? 2 : 1.4;
  ctx.stroke();

  // Mini Archive Terminal emblem on left of sign
  ctx.fillStyle = '#d946ef';
  drawRoundedPanel(ctx, tagX + 8, tagY + 6, 14, 18, 3);
  ctx.fill();
  ctx.fillStyle = '#38e8ff';
  ctx.fillRect(tagX + 10, tagY + 9, 10, 6);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(tagX + 10, tagY + 17, 10, 4);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '800 10px "Exo 2", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Digimon', tagX + 27, tagY + 10);
  ctx.fillStyle = '#f0abfc';
  ctx.font = '800 9.5px "Exo 2", sans-serif';
  ctx.fillText('Archive', tagX + 27, tagY + 21);

  if (isNearby) {
    ctx.textAlign = 'center';
    ctx.font = '900 9.5px "Exo 2", sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('[E] Abrir Archive', cx, tagY - 9);
  }

  ctx.restore();
}

/**
 * Returns Y-sorted foreground/midground DATS props so the Tamer walks naturally behind/in front of them.
 */
export function buildDatsDepthProps(options?: {
  getIncubatorCanvas?: (elapsed: number) => HTMLCanvasElement | null;
  isIncubatorNearby?: () => boolean;
  isArchiveNearby?: () => boolean;
  isPortalNearby?: () => boolean;
}): DepthProp[] {
  const props: DepthProp[] = [];
  for (const c of DATS_COLLIDERS) {
    if (c.kind === 'building' || c.kind === 'wall') continue;
    props.push({
      sortY: c.y + c.h,
      draw: (ctx, elapsed) => {
        if (c.kind === 'tree') {
          drawTreeOrGreenery(ctx, c.x, c.y, c.w, c.h);
        } else if (c.kind === 'bench') {
          drawBench(ctx, c.x, c.y, c.w, c.h);
        } else if (c.kind === 'lamp') {
          drawLampWithBanner(ctx, c.x, c.y, c.w, c.h);
        } else if (c.kind === 'terminal') {
          drawGlassTerminalOrPavilion(ctx, c, elapsed, false);
        } else if (c.kind === 'pavilion') {
          drawGlassTerminalOrPavilion(ctx, c, elapsed, true);
        } else if (c.kind === 'totem') {
          drawTotem(ctx, c, elapsed);
        } else if (c.kind === 'planter') {
          drawSouthPlanter(ctx, c);
        } else if (c.kind === 'incubator') {
          drawIncubatorMachine(
            ctx,
            c,
            elapsed,
            options?.getIncubatorCanvas?.(elapsed) ?? null,
            options?.isIncubatorNearby?.() ?? false
          );
        } else if (c.kind === 'archive') {
          drawDigimonArchiveMachine(
            ctx,
            c,
            elapsed,
            options?.isArchiveNearby?.() ?? false
          );
        }
      },
    });
  }

  // Upright Southern Digital World Dimensional Portal Gateway (depth-sorted with Tamers)
  props.push({
    sortY: 1326,
    draw: (ctx, elapsed) => {
      drawDimensionalPortalGate(
        ctx,
        800,
        1326,
        elapsed,
        options?.isPortalNearby?.() ?? false,
        {
          scale: 1.1,
          theme: 'digital',
          title: 'D-Terminal',
          subtitle: 'Estação Trailmon',
        }
      );
    },
  });

  return props;
}
