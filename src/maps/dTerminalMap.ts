import type { DatsCollider, DatsInteractionPoint } from './datsCenterMap';
import {
  drawDimensionalPortalGate,
  drawDimensionalPortalGround,
} from './portalRenderer';
import {
  applyContrastAdaptiveSharpen,
  MAP_HIDPI_SCALE,
} from '../utils/canvasSharpen';

export const D_TERMINAL_MAP_ID = 'd-terminal' as const;

/**
 * Exact 3:2 world dimensions matching the 1536x1024 D-Terminal Trailmon hub artwork.
 */
export const D_TERMINAL_WORLD_W = 1800;
export const D_TERMINAL_WORLD_H = 1200;

export const D_TERMINAL_IMAGE_URL =
  '/assets/aistudio/file_000000000d14820eaf8cb868cb20d4cb__1__a9a73ca2.webp';
export const D_TERMINAL_BANNER_URL = D_TERMINAL_IMAGE_URL;

export const PAWNCHESSMON_BLACK_SPRITE_URL =
  '/assets/aistudio/PawnChessmon__28Black_29_dm_84f60933.webp';

/**
 * Player arrives cleanly on the wide south-central plaza facing north toward the
 * octagonal D-Terminal station core and within immediate sight of PawnChessmon (Black).
 */
export const D_TERMINAL_SPAWN_POINT = {
  x: 900,
  y: 868,
  facingDir: 'N' as const,
};

/**
 * Dimensional portal at the southern plaza returning directly to DATS Center.
 */
export const D_TERMINAL_RETURN_PORTAL = {
  x: 900,
  y: 1032,
  radius: 88,
} as const;

/**
 * Official D-Terminal Trailmon Conductor NPC: PawnChessmon (Black) standing directly
 * in front of the prominent southwest Trailmon boarding platform & green train beacon.
 */
export const D_TERMINAL_CONDUCTOR_NPC = {
  id: 'd-terminal-conductor',
  name: 'PawnChessmon (Black)',
  title: 'Condutor Trailmon',
  x: 452,
  y: 778,
  standX: 526,
  standY: 804,
  radius: 108,
} as const;

export const D_TERMINAL_COLLIDERS: readonly DatsCollider[] = [
  // Central octagonal glass terminal hub (allows full circular walking around the plaza & stairs)
  { id: 'dt-central-hub', x: 695, y: 175, w: 410, h: 405, kind: 'building' },
  // Outer station upper curved roof / tunnel wall perimeter
  { id: 'dt-north-wall', x: 0, y: 0, w: 1800, h: 215, kind: 'wall' },
  { id: 'dt-west-wall', x: 0, y: 215, w: 96, h: 985, kind: 'wall' },
  { id: 'dt-east-wall', x: 1704, y: 215, w: 96, h: 985, kind: 'wall' },
  { id: 'dt-south-wall', x: 0, y: 1138, w: 1800, h: 62, kind: 'wall' },
  // Southwest parked Trailmon carriage behind PawnChessmon (Black)
  { id: 'dt-sw-train-body', x: 170, y: 830, w: 235, h: 245, kind: 'building' },
  // West parked Trailmon carriages
  { id: 'dt-w-train-upper', x: 88, y: 405, w: 115, h: 215, kind: 'building' },
  { id: 'dt-w-train-lower', x: 88, y: 615, w: 115, h: 215, kind: 'building' },
  // Southeast parked Trailmon carriages
  { id: 'dt-se-train-lower', x: 1110, y: 920, w: 235, h: 210, kind: 'building' },
  { id: 'dt-se-train-mid', x: 1355, y: 785, w: 245, h: 230, kind: 'building' },
  { id: 'dt-e-train-mid', x: 1475, y: 585, w: 220, h: 175, kind: 'building' },
  // Northeast parked Trailmon carriages
  { id: 'dt-ne-train-a', x: 1230, y: 185, w: 215, h: 120, kind: 'building' },
  { id: 'dt-ne-train-b', x: 1455, y: 265, w: 225, h: 135, kind: 'building' },
];

export const D_TERMINAL_INTERACTION_POINTS: readonly DatsInteractionPoint[] = [
  {
    id: D_TERMINAL_CONDUCTOR_NPC.id,
    kind: 'world-portal',
    title: 'Estação Trailmon — D-Terminal',
    badge: 'Condutor PawnChessmon (Black)',
    description:
      'Saudações, Tamer! Sou o Condutor PawnChessmon. Escolha para qual mapa do Mundo Digital deseja embarcar no Trailmon ou avance pelos portais interligados em cada mapa.',
    futureModule: 'Transporte Trailmon — D-Terminal',
    x: D_TERMINAL_CONDUCTOR_NPC.x,
    y: D_TERMINAL_CONDUCTOR_NPC.y,
    radius: D_TERMINAL_CONDUCTOR_NPC.radius,
    accentColor: '#34d399',
  },
];

export interface DTerminalDepthDrawable {
  sortY: number;
  draw: (ctx: CanvasRenderingContext2D, elapsed: number) => void;
}

// ============================================================================
// HIGH-RES D-TERMINAL STATIC LAYER (HiDPI sharpened from uploaded artwork)
// ============================================================================
export function buildDTerminalStaticLayer(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(D_TERMINAL_WORLD_W * MAP_HIDPI_SCALE);
  canvas.height = Math.round(D_TERMINAL_WORLD_H * MAP_HIDPI_SCALE);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();
  ctx.scale(MAP_HIDPI_SCALE, MAP_HIDPI_SCALE);

  // Instant dark-teal cyber floor fallback while WebP streams in
  const fallback = ctx.createRadialGradient(900, 560, 80, 900, 600, 1080);
  fallback.addColorStop(0, '#1c3a50');
  fallback.addColorStop(0.55, '#13283a');
  fallback.addColorStop(1, '#09131e');
  ctx.fillStyle = fallback;
  ctx.fillRect(0, 0, D_TERMINAL_WORLD_W, D_TERMINAL_WORLD_H);
  ctx.restore();

  if (typeof window !== 'undefined') {
    const img = new Image();
    img.decoding = 'async';
    img.src = D_TERMINAL_IMAGE_URL;
    img.onload = () => {
      const c2 = canvas.getContext('2d');
      if (!c2) return;
      c2.save();
      c2.clearRect(0, 0, canvas.width, canvas.height);
      c2.imageSmoothingEnabled = true;
      c2.imageSmoothingQuality = 'high';
      c2.drawImage(img, 0, 0, canvas.width, canvas.height);
      applyContrastAdaptiveSharpen(c2, canvas.width, canvas.height, 1.08);
      c2.restore();
    };
  }

  return canvas;
}

// ============================================================================
// PAWNCHESSMON (BLACK) SPRITE LOADER WITH REAL-TIME GREEN-EDGE DESPILL
// ============================================================================
let pawnChessmonCleanedCanvas: HTMLCanvasElement | null = null;
let pawnChessmonLoading = false;

export function getPawnChessmonBlackSprite(): HTMLCanvasElement | null {
  if (typeof window === 'undefined') return null;
  if (pawnChessmonCleanedCanvas) return pawnChessmonCleanedCanvas;
  if (!pawnChessmonLoading) {
    pawnChessmonLoading = true;
    const img = new Image();
    img.decoding = 'async';
    img.src = PAWNCHESSMON_BLACK_SPRITE_URL;
    img.onload = () => {
      const w = img.naturalWidth || 250;
      const h = img.naturalHeight || 443;
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const octx = off.getContext('2d');
      if (octx) {
        octx.drawImage(img, 0, 0, w, h);
        try {
          const imgData = octx.getImageData(0, 0, w, h);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const a = d[i + 3];
            if (a === 0) continue;
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            const maxRB = Math.max(r, b);
            // Strip pure chroma-green halo fringe pixels while keeping gold helmet & armor untouched
            if (g > 110 && g - maxRB > 55 && r < 140) {
              d[i + 3] = 0;
            } else if (g > maxRB + 22 && r < 155) {
              d[i + 1] = maxRB;
              if (a < 210) {
                d[i + 3] = Math.max(0, a - 65);
              }
            }
          }
          octx.putImageData(imgData, 0, 0);
        } catch {
          // Cross-origin fallback: draw raw sprite cleanly
        }
      }
      pawnChessmonCleanedCanvas = off;
    };
  }
  return pawnChessmonCleanedCanvas;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawDTerminalGroundAnimations(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  nearConductor: boolean,
  nearReturnPortal: boolean
): void {
  const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;

  // 1. Return Dimensional Portal floor projection to DATS Center
  drawDimensionalPortalGround(
    ctx,
    D_TERMINAL_RETURN_PORTAL.x,
    D_TERMINAL_RETURN_PORTAL.y,
    safeElapsed,
    nearReturnPortal,
    { scale: 1.0, theme: 'digital' }
  );

  // 2. Trailmon Boarding Beacon Ring under PawnChessmon (Black)
  const cx = D_TERMINAL_CONDUCTOR_NPC.x;
  const cy = D_TERMINAL_CONDUCTOR_NPC.y;
  const pulse = 1 + Math.sin(safeElapsed * 3.4) * 0.08;

  ctx.save();
  const aura = ctx.createRadialGradient(cx, cy, 8, cx, cy, 78 * pulse);
  aura.addColorStop(
    0,
    nearConductor ? 'rgba(253, 224, 71, 0.42)' : 'rgba(52, 211, 153, 0.34)'
  );
  aura.addColorStop(0.55, 'rgba(16, 185, 129, 0.14)');
  aura.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 72 * pulse, 28 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = nearConductor
    ? 'rgba(253, 224, 71, 0.92)'
    : 'rgba(52, 211, 153, 0.78)';
  ctx.lineWidth = nearConductor ? 2.6 : 1.9;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 46 * pulse, 17 * pulse, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle ambient emerald sparks around boarding platform
  for (let i = 0; i < 6; i++) {
    const phase = (safeElapsed * 0.45 + i * 0.166) % 1;
    const mx = cx + Math.sin(safeElapsed * 1.9 + i * 1.7) * 34;
    const my = cy + 6 - phase * 95;
    const alpha = Math.sin(phase * Math.PI) * 0.65;
    ctx.fillStyle = nearConductor
      ? `rgba(254, 240, 138, ${alpha.toFixed(3)})`
      : `rgba(110, 231, 183, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function buildDTerminalDepthProps(options?: {
  isConductorNearby?: () => boolean;
  isConductorHovered?: () => boolean;
  isReturnPortalNearby?: () => boolean;
}): DTerminalDepthDrawable[] {
  const drawables: DTerminalDepthDrawable[] = [];

  // 1. Return Dimensional Portal Gate back to DATS Center
  drawables.push({
    sortY: D_TERMINAL_RETURN_PORTAL.y,
    draw: (ctx, elapsed) => {
      drawDimensionalPortalGate(
        ctx,
        D_TERMINAL_RETURN_PORTAL.x,
        D_TERMINAL_RETURN_PORTAL.y,
        elapsed,
        options?.isReturnPortalNearby?.() ?? false,
        {
          scale: 1.0,
          theme: 'digital',
          title: 'DATS Center',
          subtitle: 'Voltar ao DATS',
        }
      );
    },
  });

  // 2. PawnChessmon (Black) — Official D-Terminal Trailmon Conductor NPC
  drawables.push({
    sortY: D_TERMINAL_CONDUCTOR_NPC.y,
    draw: (ctx, elapsed) => {
      const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
      const cx = D_TERMINAL_CONDUCTOR_NPC.x;
      const baseY = D_TERMINAL_CONDUCTOR_NPC.y;
      const isNearby = options?.isConductorNearby?.() ?? false;
      const isHovered = options?.isConductorHovered?.() ?? false;
      const bob = Math.sin(safeElapsed * 2.8) * 2.4;

      ctx.save();

      // Ground contact shadow
      ctx.fillStyle = 'rgba(2, 6, 23, 0.56)';
      ctx.beginPath();
      ctx.ellipse(cx, baseY + 5, 34, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      const sprite = getPawnChessmonBlackSprite();
      const drawH = 122;
      if (sprite && sprite.width > 0 && sprite.height > 0) {
        const aspect = sprite.width / sprite.height;
        const drawW = Math.round(drawH * aspect);
        ctx.save();
        if (isNearby || isHovered) {
          ctx.shadowColor = 'rgba(253, 224, 71, 0.65)';
          ctx.shadowBlur = 16;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          sprite,
          cx - drawW / 2,
          baseY - drawH + 8 + bob,
          drawW,
          drawH
        );
        ctx.restore();
      } else {
        // Minimal silhouette fallback during first millisecond of image load
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.ellipse(cx, baseY - 46 + bob, 24, 38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(cx, baseY - 76 + bob, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Overhead Nameplate + Interactive Prompt
      const tagW = 168;
      const tagH = 34;
      const tagX = cx - tagW / 2;
      const tagY = baseY - drawH - 36 + bob * 0.7;

      ctx.fillStyle = 'rgba(4, 21, 56, 0.94)';
      drawRoundedRect(ctx, tagX, tagY, tagW, tagH, 8);
      ctx.fill();
      ctx.strokeStyle =
        isNearby || isHovered ? '#fde047' : 'rgba(52, 211, 153, 0.9)';
      ctx.lineWidth = isNearby || isHovered ? 2.1 : 1.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 10.5px "Exo 2", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('PawnChessmon (Black)', cx, tagY + 11.5);

      ctx.font = '800 9.5px "Exo 2", sans-serif';
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText('Condutor Trailmon · Viajar', cx, tagY + 24);

      if (isNearby || isHovered) {
        ctx.font = '900 9.5px "Exo 2", sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.fillText('Toque ou [E] Embarcar', cx, tagY - 10);
      }

      ctx.restore();
    },
  });

  return drawables;
}
