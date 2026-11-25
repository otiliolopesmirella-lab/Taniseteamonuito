export interface FixedWorldNpc {
  id: string;
  name: string;
  title: string;
  spriteUrl: string;
  x: number;
  y: number;
  targetHeight: number;
  collisionRadius: number;
  groundRingRadiusX?: number;
  groundShadowRadiusX?: number;
  animPhase?: number;
  hitBox: {
    halfWidth: number;
    height: number;
  };
  initialDialogue: string;
}

export const RICHARD_SAMPSON_NPC: FixedWorldNpc = {
  id: 'npc-richard-sampson',
  name: 'RICHARD SAMPSON',
  title: 'Comandante da DATS',
  spriteUrl:
    '/assets/aistudio/file_0000000053c8820eae813279e80351a1_7e409ad6.webp',
  x: 800,
  y: 362,
  targetHeight: 104,
  collisionRadius: 16,
  groundRingRadiusX: 28,
  groundShadowRadiusX: 22,
  animPhase: 0,
  hitBox: {
    halfWidth: 48,
    height: 132,
  },
  initialDialogue:
    'Olá, Tamer! Bem-vindo à DATS. Estamos sempre trabalhando para proteger o Mundo Digital. Prepare-se para sua próxima missão!',
};

export const MUDFRIGIMON_NPC: FixedWorldNpc = {
  id: 'npc-mudfrigimon',
  name: 'MUDFRIGIMON',
  title: 'NPC Oficial da DATS',
  spriteUrl: '/assets/aistudio/MudFrigimon_aef53577.png',
  x: 1046,
  y: 768,
  targetHeight: 96,
  collisionRadius: 20,
  groundRingRadiusX: 34,
  groundShadowRadiusX: 28,
  animPhase: 1.4,
  hitBox: {
    halfWidth: 46,
    height: 122,
  },
  initialDialogue:
    'Olá, Tamer! Eu sou o MudFrigimon da DATS Center. Fique de olho por aqui — em breve terei serviços e missões especiais para ajudar você e seu Digimon!',
};

export const DATS_FIXED_NPCS: readonly FixedWorldNpc[] = [
  RICHARD_SAMPSON_NPC,
  MUDFRIGIMON_NPC,
] as const;

const npcImageCache = new Map<string, HTMLImageElement>();
const npcPreloadCache = new Map<string, Promise<void>>();

export function preloadFixedNpcSprite(npc: FixedWorldNpc): Promise<void> {
  const existing = npcPreloadCache.get(npc.id);
  if (existing) return existing;

  const p = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      npcImageCache.set(npc.id, img);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = npc.spriteUrl;
  });

  npcPreloadCache.set(npc.id, p);
  return p;
}

export function isPointInsideNpcHitbox(
  npc: FixedWorldNpc,
  worldX: number,
  worldY: number
): boolean {
  return (
    worldX >= npc.x - npc.hitBox.halfWidth &&
    worldX <= npc.x + npc.hitBox.halfWidth &&
    worldY >= npc.y - npc.hitBox.height &&
    worldY <= npc.y + 14
  );
}

/**
 * Renders a fixed MMORPG NPC anchored firmly at its world coordinates (footX, footY)
 * using the exact provided sprite without altering face, outfit, or proportions.
 */
export function drawFixedWorldNpc(
  ctx: CanvasRenderingContext2D,
  npc: FixedWorldNpc,
  elapsedSec: number,
  options: { hovered?: boolean; nearby?: boolean }
): boolean {
  const img = npcImageCache.get(npc.id);
  const { hovered = false, nearby = false } = options;
  const phase = npc.animPhase ?? 0;
  const ringRx = npc.groundRingRadiusX ?? 28;
  const ringRy = Math.round(ringRx * 0.36);
  const shadowRx = npc.groundShadowRadiusX ?? 22;
  const shadowRy = Math.round(shadowRx * 0.34);

  // Ground aura ring + contact shadow
  ctx.save();
  const ringPulse = 1 + Math.sin(elapsedSec * 3.1 + phase) * 0.04;
  ctx.strokeStyle = hovered
    ? '#ffd43b'
    : nearby
      ? 'rgba(56, 232, 255, 0.9)'
      : 'rgba(56, 232, 255, 0.52)';
  ctx.lineWidth = hovered ? 2.6 : 1.8;
  ctx.beginPath();
  ctx.ellipse(
    npc.x,
    npc.y + 1,
    ringRx * ringPulse,
    ringRy * ringPulse,
    0,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  if (hovered || nearby) {
    ctx.fillStyle = hovered
      ? 'rgba(255, 212, 59, 0.22)'
      : 'rgba(56, 232, 255, 0.16)';
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(npc.x, npc.y + 2, shadowRx, shadowRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
    return false;
  }

  const aspect = img.naturalWidth / img.naturalHeight;
  const breath = Math.sin(elapsedSec * 2.4 + phase);
  const dh = npc.targetHeight * (1 + breath * 0.008);
  const dw = dh * aspect;

  ctx.save();
  ctx.translate(npc.x, npc.y);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium';
  ctx.drawImage(img, -dw / 2, -dh + 3, dw, dh);
  ctx.restore();

  // MMORPG Official NPC Nameplate + Interactive Speech Bubble Badge
  ctx.save();
  const tagY = npc.y - npc.targetHeight - 8;
  ctx.font = '800 11px "Exo 2", sans-serif';
  ctx.textAlign = 'center';
  const tw = ctx.measureText(npc.name).width + 20;

  ctx.fillStyle = hovered ? 'rgba(10, 34, 92, 0.96)' : 'rgba(4, 17, 46, 0.9)';
  ctx.beginPath();
  ctx.roundRect(npc.x - tw / 2, tagY - 14, tw, 18, 6);
  ctx.fill();
  ctx.strokeStyle = hovered ? '#fde047' : '#38e8ff';
  ctx.lineWidth = hovered ? 1.6 : 1.2;
  ctx.stroke();

  ctx.fillStyle = '#fde047';
  ctx.fillText(npc.name, npc.x, tagY - 1.5);

  // Subtle floating interactive NPC badge above nameplate
  const badgeBob = Math.sin(elapsedSec * 4 + phase) * 2.2;
  const badgeY = tagY - 27 + badgeBob;
  ctx.fillStyle = hovered ? '#fde047' : '#38e8ff';
  ctx.beginPath();
  ctx.roundRect(npc.x - 10, badgeY - 9, 20, 14, 4);
  ctx.fill();
  ctx.fillStyle = '#03102e';
  ctx.font = '900 10px "Exo 2", sans-serif';
  ctx.fillText('...', npc.x, badgeY + 1);
  ctx.restore();

  return true;
}
