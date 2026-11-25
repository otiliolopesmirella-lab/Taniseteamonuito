export interface FixedWorldNpc {
  id: string;
  name: string;
  title: string;
  spriteUrl: string;
  removeWhiteBg?: boolean;
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

export const MIKI_MARKET_NPC: FixedWorldNpc = {
  id: 'npc-miki-market',
  name: 'MIKI · MERCADO',
  title: 'Operadora do Mercado de Jogadores',
  spriteUrl: '/assets/aistudio/images__18__2930293b.jpeg',
  removeWhiteBg: true,
  x: 1190,
  y: 768,
  targetHeight: 104,
  collisionRadius: 18,
  groundRingRadiusX: 30,
  groundShadowRadiusX: 22,
  animPhase: 2.7,
  hitBox: {
    halfWidth: 46,
    height: 126,
  },
  initialDialogue:
    'Bem-vindo ao Mercado de Jogadores da DATS! Aqui Tamers compram e vendem DATA, DigiEggs e itens com vitrine pública de 2 minutos antes da liberação.',
};

export const DATS_FIXED_NPCS: readonly FixedWorldNpc[] = [
  RICHARD_SAMPSON_NPC,
  MUDFRIGIMON_NPC,
  MIKI_MARKET_NPC,
] as const;

type CachedNpcDrawable = HTMLImageElement | HTMLCanvasElement;

const npcImageCache = new Map<string, CachedNpcDrawable>();
const npcPortraitDataUrlCache = new Map<string, string>();
const npcPreloadCache = new Map<string, Promise<void>>();

/**
 * Flood-fills only the outer connected near-white background from the image borders
 * so internal white details (vest, socks, eyes) remain 100% opaque and crisp.
 */
function stripOuterWhiteBackground(img: HTMLImageElement): HTMLCanvasElement | HTMLImageElement {
  if (typeof document === 'undefined' || img.naturalWidth === 0 || img.naturalHeight === 0) {
    return img;
  }
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return img;
  ctx.drawImage(img, 0, 0);

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, w, h);
  } catch {
    return img;
  }
  const data = imageData.data;
  const total = w * h;
  const visited = new Uint8Array(total);
  const removed = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const isBgWhite = (idx: number): boolean => {
    const o = idx * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    return minC >= 224 && maxC - minC <= 26;
  };

  const enqueue = (x: number, y: number) => {
    const idx = y * w + x;
    if (visited[idx]) return;
    if (!isBgWhite(idx)) return;
    visited[idx] = 1;
    removed[idx] = 1;
    queue[tail++] = idx;
  };

  for (let x = 0; x < w; x++) {
    enqueue(x, 0);
    enqueue(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    enqueue(0, y);
    enqueue(w - 1, y);
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % w;
    const y = (idx - x) / w;
    if (x > 0) enqueue(x - 1, y);
    if (x + 1 < w) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y + 1 < h) enqueue(x, y + 1);
  }

  // Zero alpha on outer background pixels + softly feather 1px light edge fringe
  for (let i = 0; i < total; i++) {
    if (removed[i]) {
      data[i * 4 + 3] = 0;
    }
  }
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (removed[idx]) continue;
      if (
        removed[idx - 1] ||
        removed[idx + 1] ||
        removed[idx - w] ||
        removed[idx + w]
      ) {
        const o = idx * 4;
        const r = data[o];
        const g = data[o + 1];
        const b = data[o + 2];
        const lum = (r + g + b) / 3;
        const sat = Math.max(r, g, b) - Math.min(r, g, b);
        if (lum >= 205 && sat <= 32) {
          data[o + 3] = Math.round(data[o + 3] * 0.25);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function getProcessedNpcPortraitUrl(npc: FixedWorldNpc): string {
  return npcPortraitDataUrlCache.get(npc.id) ?? npc.spriteUrl;
}

export async function ensureProcessedNpcPortraitUrl(
  npc: FixedWorldNpc
): Promise<string> {
  await preloadFixedNpcSprite(npc);
  return getProcessedNpcPortraitUrl(npc);
}

export function preloadFixedNpcSprite(npc: FixedWorldNpc): Promise<void> {
  const existing = npcPreloadCache.get(npc.id);
  if (existing) return existing;

  const p = new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (npc.removeWhiteBg) {
        const processed = stripOuterWhiteBackground(img);
        npcImageCache.set(npc.id, processed);
        if (processed instanceof HTMLCanvasElement) {
          try {
            npcPortraitDataUrlCache.set(npc.id, processed.toDataURL('image/png'));
          } catch {
            // Keep original sprite URL fallback
          }
        }
      } else {
        npcImageCache.set(npc.id, img);
      }
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
  const drawable = npcImageCache.get(npc.id);
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

  if (!drawable) {
    return false;
  }

  const srcW =
    drawable instanceof HTMLCanvasElement
      ? drawable.width
      : drawable.naturalWidth;
  const srcH =
    drawable instanceof HTMLCanvasElement
      ? drawable.height
      : drawable.naturalHeight;

  if (
    srcW === 0 ||
    srcH === 0 ||
    (drawable instanceof HTMLImageElement && !drawable.complete)
  ) {
    return false;
  }

  const aspect = srcW / srcH;
  const breath = Math.sin(elapsedSec * 2.4 + phase);
  const dh = npc.targetHeight * (1 + breath * 0.008);
  const dw = dh * aspect;

  ctx.save();
  ctx.translate(npc.x, npc.y);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium';
  ctx.drawImage(drawable, -dw / 2, -dh + 3, dw, dh);
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
