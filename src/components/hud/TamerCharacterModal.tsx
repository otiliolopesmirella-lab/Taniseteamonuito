import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Lock,
  RotateCcw,
  User,
  X,
} from 'lucide-react';
import {
  processAvatarPhotoUpload,
  processCoverPhotoUpload,
} from '../../utils/avatarPhoto';
import { TamerPortraitAvatar } from './TamerPortraitAvatar';
import {
  computeTamerAttributes,
  EQUIPMENT_SLOT_LABELS,
} from '../../services/hudGameService';
import {
  drawTamerMovementFrame,
  preloadTamerSheets,
  TAMER_FRAME_WRAP,
  type CardinalDirection,
} from '../../sprites/tamerRealSheets';
import type { TamerCharacter } from '../../types/character';
import type {
  EquipmentSlotId,
  InventoryItem,
  TamerRuntimeStats,
} from '../../types/hud';

interface TamerCharacterModalProps {
  character: TamerCharacter;
  tamerName: string;
  tamerStats: TamerRuntimeStats;
  tamerPhotoUrl?: string | null;
  tamerCoverUrl?: string | null;
  equippedItems: Partial<Record<EquipmentSlotId, InventoryItem>>;
  inventory: InventoryItem[];
  guildName: string | null;
  onEquipItem: (item: InventoryItem) => void;
  onUnequipSlot: (slot: EquipmentSlotId) => void;
  onUpdateTamerPhoto?: (photoUrl: string | null) => void;
  onUpdateTamerCover?: (coverUrl: string | null) => void;
  onClose: () => void;
}

type CharacterTabId = 'perfil' | 'equipamentos' | 'habilidades';

const ARMOR_SLOTS: readonly EquipmentSlotId[] = [
  'head',
  'top',
  'gloves',
  'bottom',
  'shoes',
] as const;

const ACCESSORY_SLOTS: readonly EquipmentSlotId[] = [
  'necklace',
  'ring',
  'digivice',
  'cape',
  'crest',
] as const;

const ROTATION_DIRS: readonly CardinalDirection[] = ['S', 'E', 'N', 'W'] as const;

function formatStatBonuses(item: InventoryItem): string {
  const b = item.statBonuses;
  if (!b) return 'Sem bônus adicionais';
  const parts: string[] = [];
  if (b.hp) parts.push(`+${b.hp} HP`);
  if (b.ds) parts.push(`+${b.ds} DS`);
  if (b.attack) parts.push(`+${b.attack} AT`);
  if (b.defense) parts.push(`+${b.defense} DE`);
  if (b.speed) parts.push(`+${b.speed} Vel.`);
  if (b.critRate) parts.push(`+${b.critRate.toFixed(1)}% CT`);
  if (b.accuracy) parts.push(`+${b.accuracy} HT`);
  if (b.evasion) parts.push(`+${b.evasion.toFixed(1)}% EV`);
  return parts.length > 0 ? parts.join(' · ') : 'Equipamento do Tamer';
}

function deriveItemRarity(item: InventoryItem): {
  label: string;
  textClass: string;
} {
  const b = item.statBonuses;
  if (!b) {
    return { label: 'Padrão DATS', textClass: 'text-slate-200' };
  }
  const activeBonusCount = Object.values(b).filter(
    (v) => typeof v === 'number' && v > 0
  ).length;
  if (activeBonusCount >= 3) {
    return { label: 'Raro DATS', textClass: 'text-amber-300' };
  }
  if (activeBonusCount === 2) {
    return { label: 'Incomum DATS', textClass: 'text-cyan-300' };
  }
  return { label: 'Comum DATS', textClass: 'text-sky-100' };
}

/* Crisp multi-tone SVG artwork for all 10 equipment slots */
const SlotArtwork = memo(function SlotArtwork({
  slot,
  equipped,
  sizeClass = 'h-6 w-6 sm:h-7 sm:w-7',
}: {
  slot: EquipmentSlotId;
  equipped: boolean;
  sizeClass?: string;
}) {
  const rim = equipped ? '#fef08a' : '#d6f4ff';
  const fill = equipped ? '#f59e0b' : '#4a9bff';
  const hi = equipped ? '#fde047' : '#85cbff';
  const detail = equipped ? '#78350f' : '#082766';

  switch (slot) {
    case 'head':
      return (
        <svg viewBox="0 0 40 40" className={sizeClass}>
          <path
            d="M8.5 23.5c0-7.2 5-12.2 11.5-12.2s11.5 5 11.5 12.2H8.5z"
            fill={fill}
            stroke={rim}
            strokeWidth="1.5"
          />
          <path
            d="M15 12c3.2 1.8 4.8 6.4 4.8 11.5M25 12c-2.2 2.4-3.2 6.2-3.2 11.5"
            fill="none"
            stroke={detail}
            strokeWidth="1.2"
          />
          <path
            d="M6.8 23.8h26.4c1.6 0 2.2 2.2-.2 3-3 1-7.8 1.4-13 1.4s-10-.4-13-1.4c-2.4-.8-1.8-3-.2-3z"
            fill={hi}
            stroke={rim}
            strokeWidth="1.3"
          />
          <circle cx="20" cy="10.2" r="1.4" fill={rim} />
        </svg>
      );

    case 'top':
      return (
        <svg viewBox="0 0 40 40" className={sizeClass}>
          <path
            d="M13 8.5l7 2.8 7-2.8 7 5.8-3.8 5.1-3.2-1.5V31.5H13V17.9l-3.2 1.5L6 14.3l7-5.8z"
            fill={fill}
            stroke={rim}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M15.8 9.8a4.5 4.5 0 0 0 8.4 0" fill="none" stroke={detail} strokeWidth="1.6" />
          <path d="M16 18.8h2.6M21.4 18.8H24" stroke={rim} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case 'gloves':
      return (
        <svg viewBox="0 0 40 40" className={sizeClass}>
          <path
            d="M12.5 19.5V10a1.7 1.7 0 0 1 3.4 0v7.5m0-8.8a1.7 1.7 0 0 1 3.4 0v8.8m0-7.8a1.7 1.7 0 0 1 3.4 0v7.8m0-5.4a1.7 1.7 0 0 1 3.4 0v9.8c0 5.6-3.2 9.2-7.8 9.2H16c-4 0-6.6-2.7-6.9-7l-.4-5.2a1.7 1.7 0 0 1 3.3-.6l.5 2.4z"
            fill={fill}
            stroke={rim}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polygon points="20,21 22.8,24 20,27 17.2,24" fill={rim} />
        </svg>
      );

    case 'bottom':
      return (
        <svg viewBox="0 0 40 40" className={sizeClass}>
          <path
            d="M11 8.5h18l2 23H22.2l-2.2-12.5-2.2 12.5H9l2-23z"
            fill={hi}
            stroke={rim}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M11 12.8h18M20 8.5v5.5" stroke={detail} strokeWidth="1.3" />
          <path d="M12 16l2.4 2.4M28 16l-2.4 2.4" stroke={rim} strokeWidth="1.2" />
        </svg>
      );

    case 'shoes':
      return (
        <svg viewBox="0 0 40 40" className={sizeClass}>
          <path
            d="M11.5 8.5h10v12.2l7.5 3c1.8.8 2.8 2.2 2.8 4.2v3.6H9.5v-23h2z"
            fill={fill}
            stroke={rim}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M9.5 28h22.3" stroke={rim} strokeWidth="1.7" />
          <path d="M16 14h5M16 17.5h5" stroke={rim} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'necklace':
      return (
        <svg viewBox="0 0 40 40" className={sizeClass}>
          <path
            d="M10.5 8.5c0 7.5 4.1 13.5 9.5 13.5s9.5-6 9.5-13.5"
            fill="none"
            stroke={rim}
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeDasharray="2.5 1.8"
          />
          <circle cx="20" cy="26.8" r="5.2" fill={hi} stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="20" cy="26.8" r="2.7" fill={detail} />
        </svg>
      );

    case 'ring':
      return (
        <svg viewBox="0 0 40 40" className={sizeClass}>
          <ellipse cx="20" cy="22" rx="11" ry="8.8" fill="none" stroke={hi} strokeWidth="4.2" />
          <ellipse cx="20" cy="22" rx="11" ry="8.8" fill="none" stroke="#ffffff" strokeWidth="1.2" />
          <rect x="15.5" y="9.5" width="9" height="5.5" rx="1.8" fill={rim} stroke={detail} strokeWidth="1.3" />
        </svg>
      );

    case 'digivice':
      return (
        <svg viewBox="0 0 40 40" className={sizeClass}>
          <circle cx="20" cy="20" r="11" fill={hi} stroke="#ffffff" strokeWidth="1.6" />
          <circle cx="20" cy="20" r="6.2" fill="#062563" stroke={rim} strokeWidth="1.8" />
          <circle cx="20" cy="20" r="3" fill={rim} />
          <path d="M9 16.8H5.8v6.4H9M31 16.8h3.2v6.4H31" fill={fill} stroke="#ffffff" strokeWidth="1.3" />
        </svg>
      );

    case 'cape':
      return (
        <svg viewBox="0 0 40 40" className={sizeClass}>
          <path
            d="M13 8.5h14l5.5 22-8-2.4-4.5 3.4-4.5-3.4-8 2.4L13 8.5z"
            fill={fill}
            stroke={rim}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M16 10l4 7.5 4-7.5M20 17.5v13" fill="none" stroke={detail} strokeWidth="1.5" />
        </svg>
      );

    case 'crest':
      return (
        <svg viewBox="0 0 40 40" className={sizeClass}>
          <path
            d="M5.5 14l8.5 3.8L20 7.5l6 10.3L34.5 14l-3.8 11.5L20 32.5 9.3 25.5 5.5 14z"
            fill="#e0f2fe"
            stroke="#38bdf8"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M20 11.5l5 8.5-5 8.5-5-8.5 5-8.5z"
            fill="#f59e0b"
            stroke="#fef08a"
            strokeWidth="1.2"
          />
          <circle cx="20" cy="20" r="3.4" fill="#38e8ff" stroke="#ffffff" strokeWidth="1.1" />
        </svg>
      );
  }
});

/* Crisp custom attribute icons for HP, DS, AT, DE, VEL, CT, HT, EV */
const StatRowIcon = memo(function StatRowIcon({
  kind,
}: {
  kind: 'HP' | 'DS' | 'AT' | 'DE' | 'SPD' | 'CT' | 'HT' | 'EV';
}) {
  const iconCls =
    'h-3.5 w-3.5 shrink-0 sm:h-[18px] sm:w-[18px] [@media(max-height:500px)]:h-3 [@media(max-height:500px)]:w-3';
  switch (kind) {
    case 'HP':
      return (
        <svg viewBox="0 0 24 24" className={iconCls}>
          <defs>
            <linearGradient id="dmoHeartFull" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff8a96" />
              <stop offset="50%" stopColor="#ef1d2e" />
              <stop offset="100%" stopColor="#880814" />
            </linearGradient>
          </defs>
          <path
            d="M12 21.2C12 21.2 3 15.2 3 8.8 3 5.7 5.4 3.5 8.2 3.5c1.7 0 3.1.9 3.8 2.2.7-1.3 2.1-2.2 3.8-2.2 2.8 0 5.2 2.2 5.2 5.3 0 6.4-9 12.4-9 12.4z"
            fill="url(#dmoHeartFull)"
            stroke="#fecdd3"
            strokeWidth="0.9"
          />
        </svg>
      );
    case 'DS':
      return (
        <svg viewBox="0 0 24 24" className={iconCls}>
          <path
            d="M13.8 2L4.8 13.4h6.3L9.6 22 19.2 10.4h-6.4L13.8 2z"
            fill="#fde047"
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'AT':
      return (
        <svg viewBox="0 0 24 24" className={iconCls}>
          <path
            d="M19.8 3.2L9.2 13.8l2 2L21.8 5.2l-2-2z"
            fill="#e0f2fe"
            stroke="#38bdf8"
            strokeWidth="1.1"
          />
          <path
            d="M7.5 12.5l4 4-1.8 1.8-1.4-1.4-2.6 2.6-2.2-2.2 2.6-2.6-1.4-1.4 1.8-1.8z"
            fill="#0ea5e9"
            stroke="#e0f2fe"
            strokeWidth="1"
          />
        </svg>
      );
    case 'DE':
      return (
        <svg viewBox="0 0 24 24" className={iconCls}>
          <path
            d="M12 2.5l8 3.2v6.4c0 5.2-3.4 8.6-8 10.2-4.6-1.6-8-5-8-10.2V5.7l8-3.2z"
            fill="#38bdf8"
            stroke="#e0f2fe"
            strokeWidth="1.2"
          />
          <path d="M12 5.2l5.2 2.1v4.7c0 3.7-2.2 6.2-5.2 7.5V5.2z" fill="#0284c7" />
        </svg>
      );
    case 'SPD':
      return (
        <svg viewBox="0 0 24 24" className={iconCls}>
          <path
            d="M7 4.5h6.5v8l4.8 1.9c1.3.5 2 1.6 2 3.1v2H6V4.5h1z"
            fill="#38bdf8"
            stroke="#e0f2fe"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M2.5 9h4M1.5 12.5h5M3 16h3.5" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'CT':
      return (
        <svg viewBox="0 0 24 24" className={iconCls}>
          <circle cx="12" cy="12" r="7.8" fill="none" stroke="#facc15" strokeWidth="2.1" />
          <circle cx="12" cy="12" r="3.2" fill="#fde047" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'HT':
      return (
        <svg viewBox="0 0 24 24" className={iconCls}>
          <circle cx="12" cy="12" r="7.8" fill="none" stroke="#f43f5e" strokeWidth="2.1" />
          <circle cx="12" cy="12" r="3.1" fill="#fb7185" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'EV':
      return (
        <svg viewBox="0 0 24 24" className={iconCls}>
          <path
            d="M3 9.8c4.4-4.8 9.6-5 13.5-1.4-2.7 0-5 1-6.7 2.8 3.3-.6 6.4.1 8.8 2.4-3.1.2-5.7 1.4-7.6 3.5-3.3-1.4-6.2-3.9-8-7.3z"
            fill="#f0f9ff"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
});

/* Live Animated Tamer Stage with pre-baked digital radar & holographic pedestal */
const TamerPreviewStage = memo(function TamerPreviewStage({
  tamerId,
  tamerName,
  direction,
  equippedItems,
}: {
  tamerId: TamerCharacter['id'];
  tamerName: string;
  direction: CardinalDirection;
  equippedItems: Partial<Record<EquipmentSlotId, InventoryItem>>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const equippedRef = useRef(equippedItems);
  const dirRef = useRef(direction);

  useEffect(() => {
    equippedRef.current = equippedItems;
  }, [equippedItems]);

  useEffect(() => {
    dirRef.current = direction;
  }, [direction]);

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let frameTimer = 0;
    let frameIndex = 0;
    let elapsed = 0;
    let lastTs = performance.now();
    let lastDrawMs = 0;
    let staticStageCanvas: HTMLCanvasElement | null = null;

    preloadTamerSheets(tamerId).then(() => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = 230;
      const h = 300;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.4);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      const cx = w / 2;
      const footY = 256;
      const reticleCY = 132;

      // Pre-bake static radar glow, concentric rings, beam rays & pedestal base once
      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = canvas.width;
      bgCanvas.height = canvas.height;
      const bctx = bgCanvas.getContext('2d');
      if (bctx) {
        bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const bgGlow = bctx.createRadialGradient(cx, reticleCY, 12, cx, reticleCY, 112);
        bgGlow.addColorStop(0, 'rgba(34, 197, 255, 0.32)');
        bgGlow.addColorStop(0.6, 'rgba(14, 96, 232, 0.18)');
        bgGlow.addColorStop(1, 'rgba(2, 14, 52, 0)');
        bctx.fillStyle = bgGlow;
        bctx.beginPath();
        bctx.arc(cx, reticleCY, 112, 0, Math.PI * 2);
        bctx.fill();

        bctx.strokeStyle = 'rgba(72, 218, 255, 0.28)';
        bctx.lineWidth = 1.2;
        for (const r of [44, 70, 98]) {
          bctx.beginPath();
          bctx.arc(cx, reticleCY, r, 0, Math.PI * 2);
          bctx.stroke();
        }

        const beamGrad = bctx.createLinearGradient(0, footY - 175, 0, footY + 8);
        beamGrad.addColorStop(0, 'rgba(56, 224, 255, 0)');
        beamGrad.addColorStop(0.55, 'rgba(14, 165, 233, 0.22)');
        beamGrad.addColorStop(1, 'rgba(56, 232, 255, 0.5)');
        bctx.fillStyle = beamGrad;
        bctx.beginPath();
        bctx.moveTo(cx - 56, footY - 165);
        bctx.lineTo(cx + 56, footY - 165);
        bctx.lineTo(cx + 80, footY + 8);
        bctx.lineTo(cx - 80, footY + 8);
        bctx.closePath();
        bctx.fill();

        bctx.fillStyle = 'rgba(2, 22, 74, 0.9)';
        bctx.beginPath();
        bctx.ellipse(cx, footY + 10, 96, 25, 0, 0, Math.PI * 2);
        bctx.fill();

        bctx.strokeStyle = 'rgba(56, 214, 255, 0.95)';
        bctx.lineWidth = 1.8;
        bctx.beginPath();
        bctx.ellipse(cx, footY + 5, 44, 10, 0, 0, Math.PI * 2);
        bctx.stroke();

        bctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        bctx.beginPath();
        bctx.ellipse(cx, footY + 3, 30, 8, 0, 0, Math.PI * 2);
        bctx.fill();
        staticStageCanvas = bgCanvas;
      }

      const capeGlowGrad = ctx.createRadialGradient(cx, footY - 88, 10, cx, footY - 88, 70);
      capeGlowGrad.addColorStop(0, 'rgba(56, 214, 255, 0.34)');
      capeGlowGrad.addColorStop(1, 'rgba(56, 214, 255, 0)');

      const render = (now: number) => {
        if (cancelled) return;
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          lastTs = now;
          rafId = requestAnimationFrame(render);
          return;
        }
        if (lastDrawMs > 0 && now - lastDrawMs < 32) {
          rafId = requestAnimationFrame(render);
          return;
        }
        lastDrawMs = now;

        const dt = Math.min(0.06, Math.max(0.001, (now - lastTs) / 1000));
        lastTs = now;
        elapsed += dt;
        frameTimer += dt;
        if (frameTimer >= 0.34) {
          frameTimer = 0;
          frameIndex = (frameIndex + 1) % TAMER_FRAME_WRAP;
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        if (staticStageCanvas) {
          ctx.drawImage(staticStageCanvas, 0, 0, w, h);
        }

        // Rotating inner radar dash ring
        ctx.save();
        ctx.translate(cx, reticleCY);
        ctx.rotate(elapsed * 0.22);
        ctx.strokeStyle = 'rgba(94, 234, 255, 0.4)';
        ctx.lineWidth = 2.8;
        ctx.setLineDash([16, 10, 6, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, 84, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Pulsing outer holographic pedestal rings (zero shadowBlur)
        const pulse = 1 + Math.sin(elapsed * 3) * 0.022;
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 232, 255, 0.35)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(cx, footY + 8, 92 * pulse, 22 * pulse, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#70f4ff';
        ctx.lineWidth = 2.6;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(155, 248, 255, 0.85)';
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 7]);
        ctx.lineDashOffset = -elapsed * 24;
        ctx.beginPath();
        ctx.ellipse(cx, footY + 7, 70, 16.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        const eq = equippedRef.current;
        if (eq.cape) {
          ctx.fillStyle = capeGlowGrad;
          ctx.beginPath();
          ctx.arc(cx, footY - 88, 70, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Draw real selected Tamer spritesheet
        ctx.save();
        ctx.translate(cx, footY);
        ctx.scale(2.52, 2.52);
        drawTamerMovementFrame(
          ctx,
          tamerId,
          'idle',
          dirRef.current,
          frameIndex,
          elapsed,
          0,
          0
        );
        ctx.restore();

        // 4. Subtle visual cues on stage when gear is equipped (zero shadowBlur)
        if (eq.shoes) {
          ctx.strokeStyle = 'rgba(94, 234, 212, 0.9)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(cx, footY - 4, 38, 9, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (eq.digivice) {
          const orbX = cx + 48;
          const orbY = footY - 104 + Math.sin(elapsed * 3.8) * 3.5;
          ctx.fillStyle = 'rgba(56, 232, 255, 0.35)';
          ctx.beginPath();
          ctx.arc(orbX, orbY, 8.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#38e8ff';
          ctx.beginPath();
          ctx.arc(orbX, orbY, 4.6, 0, Math.PI * 2);
          ctx.fill();
        }
        if (eq.crest) {
          const crestY = footY - 230 + Math.cos(elapsed * 2.6) * 3;
          ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
          ctx.beginPath();
          ctx.arc(cx, crestY, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.moveTo(cx, crestY - 7);
          ctx.lineTo(cx + 6, crestY);
          ctx.lineTo(cx, crestY + 7);
          ctx.lineTo(cx - 6, crestY);
          ctx.closePath();
          ctx.fill();
        }

        rafId = requestAnimationFrame(render);
      };

      rafId = requestAnimationFrame(render);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (staticStageCanvas) {
        staticStageCanvas.width = 0;
        staticStageCanvas.height = 0;
        staticStageCanvas = null;
      }
    };
  }, [tamerId]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`Prévia animada de ${tamerName}`}
      className="mx-auto h-[132px] w-[101px] min-[400px]:h-[146px] min-[400px]:w-[112px] sm:h-[272px] sm:w-[210px] [@media(max-height:500px)]:h-[126px] [@media(max-height:500px)]:w-[97px]"
    />
  );
});

export function TamerCharacterModal({
  character,
  tamerName,
  tamerStats,
  tamerPhotoUrl = null,
  tamerCoverUrl = null,
  equippedItems,
  inventory,
  guildName,
  onEquipItem,
  onUnequipSlot,
  onUpdateTamerPhoto,
  onUpdateTamerCover,
  onClose,
}: TamerCharacterModalProps) {
  const [activeTab, setActiveTab] = useState<CharacterTabId>('perfil');
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotId>('head');
  const [dirIndex, setDirIndex] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const handlePickTamerPhoto = async (
    file: File | null | undefined,
    inputEl?: HTMLInputElement | null
  ) => {
    if (!file || !onUpdateTamerPhoto) {
      if (inputEl) inputEl.value = '';
      return;
    }
    setPhotoFeedback(null);
    setUploadingPhoto(true);
    try {
      const res = await processAvatarPhotoUpload(file);
      if (!res.ok || !res.dataUrl) {
        setPhotoFeedback({
          type: 'err',
          text: res.error ?? 'Não foi possível carregar esta foto.',
        });
        return;
      }
      onUpdateTamerPhoto(res.dataUrl);
      setPhotoFeedback({
        type: 'ok',
        text: 'Foto do Tamer atualizada na interface!',
      });
    } catch {
      setPhotoFeedback({
        type: 'err',
        text: 'Não foi possível processar esta foto.',
      });
    } finally {
      setUploadingPhoto(false);
      if (inputEl) {
        try {
          inputEl.value = '';
        } catch {
          // Ignore input reset error
        }
      }
    }
  };

  const handlePickTamerCover = async (
    file: File | null | undefined,
    inputEl?: HTMLInputElement | null
  ) => {
    if (!file || !onUpdateTamerCover) {
      if (inputEl) inputEl.value = '';
      return;
    }
    setPhotoFeedback(null);
    setUploadingCover(true);
    try {
      const res = await processCoverPhotoUpload(file);
      if (!res.ok || !res.dataUrl) {
        setPhotoFeedback({
          type: 'err',
          text: res.error ?? 'Não foi possível carregar esta capa.',
        });
        return;
      }
      onUpdateTamerCover(res.dataUrl);
      setPhotoFeedback({
        type: 'ok',
        text: 'Capa do Rank atualizada!',
      });
    } catch {
      setPhotoFeedback({
        type: 'err',
        text: 'Não foi possível processar esta capa.',
      });
    } finally {
      setUploadingCover(false);
      if (inputEl) {
        try {
          inputEl.value = '';
        } catch {
          // Ignore input reset error
        }
      }
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const attrs = useMemo(
    () => computeTamerAttributes(tamerStats, equippedItems),
    [tamerStats, equippedItems]
  );

  const equipmentBonusSummary = useMemo(() => {
    const totals = {
      hp: 0,
      ds: 0,
      attack: 0,
      defense: 0,
      speed: 0,
      critRate: 0,
      accuracy: 0,
      evasion: 0,
    };
    for (const item of Object.values(equippedItems)) {
      if (!item?.statBonuses) continue;
      totals.hp += item.statBonuses.hp ?? 0;
      totals.ds += item.statBonuses.ds ?? 0;
      totals.attack += item.statBonuses.attack ?? 0;
      totals.defense += item.statBonuses.defense ?? 0;
      totals.speed += item.statBonuses.speed ?? 0;
      totals.critRate += item.statBonuses.critRate ?? 0;
      totals.accuracy += item.statBonuses.accuracy ?? 0;
      totals.evasion += item.statBonuses.evasion ?? 0;
    }
    return totals;
  }, [equippedItems]);

  const expRemaining = Math.max(0, tamerStats.expToNext - tamerStats.exp);
  const expPct = Math.min(
    100,
    (tamerStats.exp / Math.max(1, tamerStats.expToNext)) * 100
  );

  const activeDirection = ROTATION_DIRS[dirIndex];
  const inspectedEquipped = equippedItems[selectedSlot];

  const compatibleForSelectedSlot = useMemo(
    () =>
      inventory.filter(
        (item) => item.category === 'equip' && item.equipSlot === selectedSlot
      ),
    [inventory, selectedSlot]
  );

  const allEquippableInBag = useMemo(
    () => inventory.filter((item) => item.category === 'equip' && Boolean(item.equipSlot)),
    [inventory]
  );

  const equippedCount = useMemo(
    () => Object.values(equippedItems).filter(Boolean).length,
    [equippedItems]
  );

  const handlePerfilSlotClick = (slot: EquipmentSlotId) => {
    setSelectedSlot(slot);
    setActiveTab('equipamentos');
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Janela de Personagem"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020816]/78 p-1 sm:p-4 [@media(max-height:500px)]:p-1"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window relative flex max-h-[95dvh] w-full max-w-[680px] flex-col"
      >
        {/* Top-Right Extruded Metallic Square X Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar janela de personagem"
          className="absolute right-1 top-1 z-30 flex h-7.5 w-7.5 items-center justify-center rounded-lg border-[2px] border-[#8ef2ff] bg-gradient-to-b from-[#185fc9] via-[#0c3c9c] to-[#051d5a] text-white shadow-[0_0_16px_rgba(56,232,255,0.65),inset_0_1px_0_rgba(255,255,255,0.65)] transition duration-150 hover:brightness-115 active:scale-95 sm:right-2 sm:top-1.5 sm:h-10 sm:w-10 [@media(max-height:500px)]:h-7 [@media(max-height:500px)]:w-7"
        >
          <X className="h-4 w-4 stroke-[3.2] drop-shadow-[0_0_6px_rgba(56,242,255,0.85)] sm:h-5 sm:w-5 [@media(max-height:500px)]:h-3.5 [@media(max-height:500px)]:w-3.5" />
        </button>

        {/* Outer Glowing Cyan Chamfered Cyber Frame */}
        <div className="clip-cyber-panel relative flex flex-1 flex-col bg-gradient-to-b from-[#7af2ff] via-[#26b6ff] to-[#56e4ff] p-[2px] shadow-[0_0_42px_rgba(0,174,255,0.65)] sm:p-[2.5px]">
          <div className="clip-cyber-panel dmo-cyber-matrix-bg relative flex flex-1 flex-col overflow-hidden">
            {/* 1. CABEÇALHO */}
            <div className="relative flex h-9 items-center border-b-2 border-[#3ad5ff] bg-gradient-to-r from-[#062a78] via-[#0d54d4] to-[#062a78] pl-2.5 pr-11 shadow-[0_4px_16px_rgba(0,145,255,0.45)] sm:h-[52px] sm:pl-4 sm:pr-14 [@media(max-height:500px)]:h-8">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="clip-cyber-input flex h-6 w-8 items-center justify-center border border-[#72f0ff] bg-gradient-to-b from-[#114ec2] to-[#04194d] shadow-[0_0_12px_rgba(56,232,255,0.55)] sm:h-8.5 sm:w-11 [@media(max-height:500px)]:h-5.5 [@media(max-height:500px)]:w-7">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 fill-[#7af2ff] drop-shadow-[0_0_6px_rgba(56,240,255,0.9)] sm:h-5 sm:w-5 [@media(max-height:500px)]:h-3.5 [@media(max-height:500px)]:w-3.5"
                  >
                    <circle cx="12" cy="7.5" r="4" />
                    <path d="M4.5 20.2c.5-4.1 3.6-6.3 7.5-6.3s7 2.2 7.5 6.3H4.5z" />
                  </svg>
                </div>
                <h2 className="text-[15px] font-black italic tracking-wide text-white drop-shadow-[0_2px_8px_rgba(56,232,255,0.75)] sm:text-[22px] [@media(max-height:500px)]:text-[14px]">
                  Personagem
                </h2>
              </div>

              <div
                aria-hidden="true"
                className="ml-4 hidden h-2.5 flex-1 skew-x-[-30deg] border-b border-l border-[#62e8ff]/70 bg-[#062266]/45 sm:block [@media(max-height:500px)]:hidden"
              />
            </div>

            {/* Body Container */}
            <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-2 py-1.5 sm:gap-3 sm:px-3.5 sm:py-3 [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1.5">
              {/* 2. ABAS SUPERIORES: PERFIL | EQUIPAMENTOS | HABILIDADES */}
              <div role="tablist" aria-label="Abas de Personagem" className="grid grid-cols-3 gap-1 sm:gap-2.5">
                {(
                  [
                    { id: 'perfil', label: 'Perfil', locked: false },
                    { id: 'equipamentos', label: 'Equipamentos', locked: false },
                    { id: 'habilidades', label: 'Habilidades', locked: true },
                  ] as const
                ).map((tab) => {
                  const isActive = activeTab === tab.id;
                  const isLocked = tab.locked;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-disabled={isLocked}
                      disabled={isLocked}
                      title={isLocked ? 'Em Desenvolvimento' : undefined}
                      onClick={() => {
                        if (!isLocked) setActiveTab(tab.id);
                      }}
                      className={`clip-cyber-tab flex min-h-[34px] items-center justify-center p-[1.5px] transition-all duration-150 focus-visible:outline-2 focus-visible:outline-cyan-300 sm:min-h-[42px] [@media(max-height:500px)]:min-h-[30px] ${
                        isLocked
                          ? 'cursor-not-allowed bg-gradient-to-b from-slate-500/80 via-slate-600/80 to-slate-800/90 opacity-80'
                          : isActive
                            ? 'bg-gradient-to-b from-[#fff7b2] via-[#fbbf24] to-[#d97706] shadow-[0_0_16px_rgba(250,204,21,0.55)]'
                            : 'bg-gradient-to-b from-[#66e6ff] via-[#1f9cff] to-[#0c47a8] hover:brightness-115'
                      }`}
                    >
                      <span
                        className={`clip-cyber-tab flex h-full w-full items-center justify-center gap-1 px-1.5 font-extrabold italic tracking-wide whitespace-nowrap sm:gap-1.5 sm:px-2 ${
                          isLocked
                            ? 'flex-col gap-0 bg-gradient-to-b from-[#0b1b3d] to-[#040c21] py-0.5 text-slate-300 sm:flex-row sm:gap-1.5'
                            : isActive
                              ? 'bg-gradient-to-b from-[#ffe259] via-[#f59e0b] to-[#d97706] text-[10.5px] text-[#241403] sm:text-[13.5px] [@media(max-height:500px)]:text-[10.5px]'
                              : 'bg-gradient-to-b from-[#0b3b99] to-[#04184b] text-[10.5px] text-white sm:text-[13.5px] [@media(max-height:500px)]:text-[10.5px]'
                        }`}
                      >
                        {tab.id === 'perfil' && (
                          <User
                            className={`h-3 w-3 shrink-0 sm:h-4 sm:w-4 ${
                              isActive ? 'fill-[#241403] text-[#241403]' : 'fill-white/90 text-white'
                            }`}
                          />
                        )}
                        {tab.id === 'equipamentos' && (
                          <svg
                            viewBox="0 0 24 24"
                            className={`h-3 w-3 shrink-0 sm:h-4 sm:w-4 ${
                              isActive ? 'fill-[#241403]' : 'fill-[#9be8ff]'
                            }`}
                          >
                            <path d="M8.5 3.5L12 5.4l3.5-1.9 5 4-2.5 3.4-2-1.1V20.5H8V9.8l-2 1.1-2.5-3.4 5-4z" />
                          </svg>
                        )}
                        {tab.id === 'habilidades' && (
                          <span className="flex items-center gap-1 text-[9.5px] leading-none text-slate-300 sm:text-[12.5px]">
                            <Lock className="h-2.5 w-2.5 shrink-0 text-amber-300 sm:h-3.5 sm:w-3.5" />
                            <span>{tab.label}</span>
                          </span>
                        )}
                        {tab.id !== 'habilidades' ? (
                          <span>{tab.label}</span>
                        ) : (
                          <span className="not-italic text-[7px] font-black uppercase leading-none tracking-wider text-amber-300/95 sm:rounded sm:border sm:border-amber-300/40 sm:bg-amber-500/15 sm:px-1.5 sm:py-[2px] sm:text-[8.5px]">
                            Em Desenvolvimento
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ======================== 3. ABA PERFIL ======================== */}
              {activeTab === 'perfil' && (
                <div role="tabpanel" aria-label="Perfil" className="animate-dmo-tab flex flex-col gap-1.5 sm:gap-3 [@media(max-height:500px)]:gap-1.5">
                  {/* Upper Cyber Box — Side-by-side even on mobile portrait for compact height */}
                  <div className="clip-cyber-input bg-gradient-to-b from-[#6beaff] via-[#26b6ff] to-[#1a78e8] p-[1.5px] shadow-[0_0_20px_rgba(0,162,255,0.35)]">
                    <div className="clip-cyber-input dmo-cyber-matrix-bg grid grid-cols-12 items-stretch gap-1.5 px-1.5 py-1.5 sm:gap-3 sm:px-3.5 sm:py-3 [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1.5">
                      {/* LADO ESQUERDO: 5 Slots + Tamer Pixel Art Real sobre Plataforma Holográfica */}
                      <div className="col-span-5 flex items-center justify-center gap-1 sm:col-span-6 sm:gap-2">
                        {/* 5 Slots verticais: Capacete, Roupa, Luvas, Calça, Botas */}
                        <div className="z-10 flex shrink-0 flex-col gap-1 sm:gap-1.5 [@media(max-height:500px)]:gap-0.5">
                          {ARMOR_SLOTS.map((slot) => {
                            const item = equippedItems[slot];
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => handlePerfilSlotClick(slot)}
                                title={
                                  item
                                    ? `${EQUIPMENT_SLOT_LABELS[slot]}: ${item.name} (${formatStatBonuses(item)}) — Clique para gerenciar`
                                    : `${EQUIPMENT_SLOT_LABELS[slot]} (Vazio) — Clique para abrir Equipamentos`
                                }
                                aria-label={EQUIPMENT_SLOT_LABELS[slot]}
                                className={`clip-cyber-slot relative flex h-7 w-7 items-center justify-center p-[1px] transition-transform duration-150 hover:scale-105 active:scale-95 sm:h-11 sm:w-11 sm:p-[1.5px] [@media(max-height:500px)]:h-6.5 [@media(max-height:500px)]:w-6.5 ${
                                  item
                                    ? 'bg-gradient-to-b from-[#fef08a] via-[#fbbf24] to-[#d97706] shadow-[0_0_12px_rgba(250,204,21,0.55)]'
                                    : 'bg-gradient-to-b from-[#8ef2ff] via-[#34c0ff] to-[#1354c4] shadow-[0_0_10px_rgba(0,162,255,0.45)]'
                                }`}
                              >
                                <span className="clip-cyber-slot flex h-full w-full items-center justify-center bg-gradient-to-b from-[#0b338a] to-[#03123a]">
                                  <SlotArtwork
                                    slot={slot}
                                    equipped={Boolean(item)}
                                    sizeClass="h-4.5 w-4.5 sm:h-7 sm:w-7 [@media(max-height:500px)]:h-4 [@media(max-height:500px)]:w-4"
                                  />
                                </span>
                                {item && (
                                  <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full border border-amber-100 bg-amber-400 text-[6px] font-black text-slate-950 shadow sm:h-3.5 sm:w-3.5 sm:text-[8px]">
                                    ★
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Central Holographic Tamer Stage */}
                        <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center">
                          <TamerPreviewStage
                            tamerId={character.id}
                            tamerName={tamerName}
                            direction={activeDirection}
                            equippedItems={equippedItems}
                          />

                          {/* Floor rotation controls */}
                          <div className="absolute bottom-0 flex items-center gap-14 sm:bottom-0.5 sm:gap-28 [@media(max-height:500px)]:gap-14">
                            <button
                              type="button"
                              onClick={() =>
                                setDirIndex(
                                  (d) => (d - 1 + ROTATION_DIRS.length) % ROTATION_DIRS.length
                                )
                              }
                              aria-label="Girar Tamer para esquerda"
                              className="flex h-5 w-5 items-center justify-center rounded-full border border-cyan-300/60 bg-[#04184a]/85 text-cyan-200 transition hover:bg-cyan-600/55 sm:h-6 sm:w-6"
                            >
                              <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDirIndex((d) => (d + 1) % ROTATION_DIRS.length)
                              }
                              aria-label="Girar Tamer para direita"
                              className="flex h-5 w-5 items-center justify-center rounded-full border border-cyan-300/60 bg-[#04184a]/85 text-cyan-200 transition hover:bg-cyan-600/55 sm:h-6 sm:w-6"
                            >
                              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* LADO DIREITO: Painel de Atributos + Classe & Guilda */}
                      <div className="col-span-7 flex flex-col sm:col-span-6">
                        <div className="clip-cyber-input flex flex-1 bg-gradient-to-b from-[#6beaff] via-[#26b6ff] to-[#1a78e8] p-[1.5px] shadow-[0_0_16px_rgba(0,162,255,0.35)]">
                          <div className="clip-cyber-input flex flex-1 flex-col justify-between bg-[#04143e]/95 px-2 py-1.5 shadow-[inset_0_0_22px_rgba(0,40,120,0.75)] sm:px-3.5 sm:py-2.5 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1">
                            {/* Header: Avatar/Crest + Nome + Lv. */}
                            <div className="flex items-center justify-between gap-1.5 border-b border-[#38d6ff]/70 pb-1 sm:gap-2 sm:pb-1.5 [@media(max-height:500px)]:pb-0.5">
                              <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                                <div className="relative h-7 w-7 shrink-0 rounded-full border border-cyan-300/80 p-[1px] shadow-[0_0_10px_rgba(56,214,255,0.55)] sm:h-9 sm:w-9">
                                  <TamerPortraitAvatar
                                    tamerId={character.id}
                                    tamerName={tamerName}
                                    customPhotoUrl={tamerPhotoUrl}
                                    sizeClass="h-full w-full"
                                  />
                                </div>
                                <span className="truncate text-[12px] font-black italic tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] sm:text-[16.5px] [@media(max-height:500px)]:text-[11.5px]">
                                  {tamerName}
                                </span>
                              </div>
                              <span className="shrink-0 text-[12px] font-black italic tabular-nums text-[#ffd43b] drop-shadow-[0_2px_4px_rgba(250,204,21,0.45)] sm:text-[17px] [@media(max-height:500px)]:text-[11.5px]">
                                Lv. {tamerStats.level}
                              </span>
                            </div>

                            {/* Custom Tamer Interface Photo & Rank Cover Upload Bars */}
                            {(onUpdateTamerPhoto || onUpdateTamerCover) && (
                              <div className="mt-1 space-y-1 rounded-lg border border-cyan-400/35 bg-[#061d54]/80 px-1.5 py-1 sm:mt-1.5 sm:px-2 sm:py-1.5">
                                {onUpdateTamerPhoto && (
                                  <div className="flex flex-wrap items-center justify-between gap-1">
                                    <input
                                      ref={photoInputRef}
                                      type="file"
                                      accept="image/*"
                                      tabIndex={-1}
                                      className="sr-only"
                                      onChange={(e) => {
                                        const inputEl = e.currentTarget;
                                        const f = inputEl.files?.[0];
                                        void handlePickTamerPhoto(f, inputEl);
                                      }}
                                    />
                                    <span className="text-[9px] font-bold text-cyan-100/90 sm:text-[10.5px]">
                                      Foto do HUD
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={uploadingPhoto}
                                        onClick={() => photoInputRef.current?.click()}
                                        className="flex items-center gap-1 rounded border border-cyan-300/75 bg-gradient-to-b from-[#0b5ed7] to-[#052a73] px-1.5 py-0.5 text-[9px] font-black text-white shadow hover:brightness-115 active:scale-95 disabled:opacity-60 sm:px-2 sm:py-1 sm:text-[10px]"
                                      >
                                        <Camera className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                        <span>
                                          {uploadingPhoto ? 'Enviando...' : 'Escolher Foto'}
                                        </span>
                                      </button>
                                      {tamerPhotoUrl && (
                                        <button
                                          type="button"
                                          disabled={uploadingPhoto}
                                          onClick={() => {
                                            onUpdateTamerPhoto(null);
                                            setPhotoFeedback({
                                              type: 'ok',
                                              text: 'Retrato padrão restaurado.',
                                            });
                                          }}
                                          title="Restaurar retrato padrão do Tamer"
                                          className="flex items-center gap-0.5 rounded border border-slate-400/50 bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-200 hover:bg-slate-700 sm:py-1 sm:text-[10px]"
                                        >
                                          <RotateCcw className="h-2.5 w-2.5" />
                                          <span>Padrão</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {onUpdateTamerCover && (
                                  <div className="flex flex-wrap items-center justify-between gap-1 border-t border-cyan-400/20 pt-1">
                                    <input
                                      ref={coverInputRef}
                                      type="file"
                                      accept="image/*"
                                      tabIndex={-1}
                                      className="sr-only"
                                      onChange={(e) => {
                                        const inputEl = e.currentTarget;
                                        const f = inputEl.files?.[0];
                                        void handlePickTamerCover(f, inputEl);
                                      }}
                                    />
                                    <span className="text-[9px] font-bold text-amber-200/95 sm:text-[10.5px]">
                                      Capa do Rank
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={uploadingCover}
                                        onClick={() => coverInputRef.current?.click()}
                                        className="flex items-center gap-1 rounded border border-amber-300/75 bg-gradient-to-b from-[#b45309] to-[#78350f] px-1.5 py-0.5 text-[9px] font-black text-white shadow hover:brightness-115 active:scale-95 disabled:opacity-60 sm:px-2 sm:py-1 sm:text-[10px]"
                                      >
                                        <ImagePlus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                        <span>
                                          {uploadingCover
                                            ? 'Enviando...'
                                            : tamerCoverUrl
                                              ? 'Trocar Capa'
                                              : 'Colocar Capa'}
                                        </span>
                                      </button>
                                      {tamerCoverUrl && (
                                        <button
                                          type="button"
                                          disabled={uploadingCover}
                                          onClick={() => {
                                            onUpdateTamerCover(null);
                                            setPhotoFeedback({
                                              type: 'ok',
                                              text: 'Capa removida do Rank.',
                                            });
                                          }}
                                          title="Remover capa do Rank"
                                          className="flex items-center gap-0.5 rounded border border-slate-400/50 bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-200 hover:bg-slate-700 sm:py-1 sm:text-[10px]"
                                        >
                                          <RotateCcw className="h-2.5 w-2.5" />
                                          <span>Remover</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {photoFeedback && (
                                  <p
                                    className={`w-full text-[9px] font-bold ${
                                      photoFeedback.type === 'ok'
                                        ? 'text-emerald-300'
                                        : 'text-rose-300'
                                    }`}
                                  >
                                    {photoFeedback.text}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* 8 Core Attributes */}
                            <div className="mt-1 flex flex-1 flex-col justify-between gap-0.5 text-[10.5px] sm:mt-2 sm:gap-1.5 sm:text-[13.5px] [@media(max-height:500px)]:mt-0.5 [@media(max-height:500px)]:gap-[1px] [@media(max-height:500px)]:text-[9.5px]">
                              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                                <span className="flex items-center gap-1 font-extrabold italic text-white sm:gap-2">
                                  <StatRowIcon kind="HP" />
                                  <span>HP</span>
                                </span>
                                <span className="font-extrabold italic tabular-nums">
                                  <span className="text-white">{Math.round(attrs.hp)}</span>
                                  <span className="text-[#38e8ff]">/{attrs.maxHp}</span>
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                                <span className="flex items-center gap-1 font-extrabold italic text-white sm:gap-2">
                                  <StatRowIcon kind="DS" />
                                  <span>DS</span>
                                </span>
                                <span className="font-extrabold italic tabular-nums">
                                  <span className="text-white">{Math.round(attrs.ds)}</span>
                                  <span className="text-[#38e8ff]">/{attrs.maxDs}</span>
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                                <span className="flex min-w-0 items-center gap-1 sm:gap-2">
                                  <StatRowIcon kind="AT" />
                                  <span className="font-black italic text-[#63e6ff]">AT</span>
                                  <span className="truncate font-semibold italic text-slate-100">Ataque</span>
                                </span>
                                <span className="shrink-0 font-extrabold italic tabular-nums text-white">
                                  {attrs.attack}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                                <span className="flex min-w-0 items-center gap-1 sm:gap-2">
                                  <StatRowIcon kind="DE" />
                                  <span className="font-black italic text-[#63e6ff]">DE</span>
                                  <span className="truncate font-semibold italic text-slate-100">Defesa</span>
                                </span>
                                <span className="shrink-0 font-extrabold italic tabular-nums text-white">
                                  {attrs.defense}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                                <span className="flex min-w-0 items-center gap-1 sm:gap-2">
                                  <StatRowIcon kind="SPD" />
                                  <span className="truncate font-semibold italic text-slate-100">Velocidade</span>
                                </span>
                                <span className="shrink-0 font-extrabold italic tabular-nums text-white">
                                  {attrs.speed}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                                <span className="flex min-w-0 items-center gap-1 sm:gap-2">
                                  <StatRowIcon kind="CT" />
                                  <span className="font-black italic text-[#ffe066]">CT</span>
                                  <span className="truncate font-semibold italic text-slate-100">Crítico</span>
                                </span>
                                <span className="shrink-0 font-extrabold italic tabular-nums text-white">
                                  {attrs.critRate.toFixed(1)}%
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                                <span className="flex min-w-0 items-center gap-1 sm:gap-2">
                                  <StatRowIcon kind="HT" />
                                  <span className="font-black italic text-[#fda4af]">HT</span>
                                  <span className="truncate font-semibold italic text-slate-100">Acerto</span>
                                </span>
                                <span className="shrink-0 font-extrabold italic tabular-nums text-white">
                                  {attrs.accuracy}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                                <span className="flex min-w-0 items-center gap-1 sm:gap-2">
                                  <StatRowIcon kind="EV" />
                                  <span className="font-black italic text-[#7dd3fc]">EV</span>
                                  <span className="truncate font-semibold italic text-slate-100">Evasão</span>
                                </span>
                                <span className="shrink-0 font-extrabold italic tabular-nums text-white">
                                  {attrs.evasion.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            {/* Classe e Guilda abaixo dos atributos */}
                            <div className="mt-1 grid grid-cols-2 gap-1.5 border-t border-[#38d6ff]/35 pt-1 text-[9.5px] sm:mt-2.5 sm:gap-2 sm:pt-2 sm:text-[11.5px] [@media(max-height:500px)]:mt-0.5 [@media(max-height:500px)]:pt-0.5">
                              <div className="min-w-0">
                                <span className="block text-[8.5px] font-bold text-cyan-300/90 sm:text-[10px]">
                                  Classe
                                </span>
                                <span className="block truncate font-extrabold text-white">
                                  Tamer · {character.archetypeTitle}
                                </span>
                              </div>
                              <div className="min-w-0 text-right">
                                <span className="block text-[8.5px] font-bold text-cyan-300/90 sm:text-[10px]">
                                  Guilda
                                </span>
                                <span className="block truncate font-extrabold text-white">
                                  {guildName ?? 'Sem Guilda'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. EXPERIÊNCIA (barra inferior com dados reais) */}
                  <div className="clip-cyber-input bg-gradient-to-b from-[#6beaff] via-[#26b6ff] to-[#1a78e8] p-[1.5px] shadow-[0_0_16px_rgba(0,162,255,0.32)]">
                    <div className="clip-cyber-input bg-[#041238]/95 px-2.5 py-1.5 shadow-[inset_0_0_20px_rgba(0,40,120,0.7)] sm:px-4 sm:py-2.5 [@media(max-height:500px)]:px-2.5 [@media(max-height:500px)]:py-1">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5 shrink-0 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)] sm:h-5 sm:w-5"
                          >
                            <path
                              d="M12 2.2l2.9 6 6.6.9-4.8 4.7 1.1 6.6-5.8-3.1-5.8 3.1 1.1-6.6-4.8-4.7 6.6-.9L12 2.2z"
                              fill="#fbbf24"
                              stroke="#fef08a"
                              strokeWidth="1.2"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="text-[11.5px] font-black italic tracking-wide text-white sm:text-[15px] [@media(max-height:500px)]:text-[11px]">
                            Experiência
                          </span>
                        </div>
                        <p className="text-[10px] font-bold italic tabular-nums text-white/95 sm:text-[13px] [@media(max-height:500px)]:text-[10px]">
                          Próx:{' '}
                          <span className="font-extrabold text-white">
                            {expRemaining.toLocaleString('pt-BR')}
                          </span>{' '}
                          <span className="font-black text-[#38e8ff]">XP</span>
                        </p>
                      </div>

                      <div className="relative mt-1 h-4 overflow-hidden rounded-full border-2 border-[#1b74d8] bg-[#02081b] shadow-[inset_0_2px_8px_rgba(0,0,0,0.95)] sm:mt-1.5 sm:h-5.5 [@media(max-height:500px)]:mt-0.5 [@media(max-height:500px)]:h-3.5">
                        <div
                          className="h-full rounded-full bg-gradient-to-b from-[#66eeff] via-[#1395ff] to-[#0552c7] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-[width] duration-300"
                          style={{ width: `${Math.max(0, Math.min(100, expPct))}%` }}
                        />
                        <span
                          className="absolute inset-0 flex items-center justify-center text-[10px] font-black italic tabular-nums text-white sm:text-[13px] [@media(max-height:500px)]:text-[9.5px]"
                          style={{
                            textShadow:
                              '-1px -1px 0 #02081b, 1px -1px 0 #02081b, -1px 1px 0 #02081b, 1px 1px 0 #02081b',
                          }}
                        >
                          {expPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== 5. ABA EQUIPAMENTOS ===================== */}
              {activeTab === 'equipamentos' && (
                <div role="tabpanel" aria-label="Equipamentos" className="animate-dmo-tab flex flex-col gap-2 sm:gap-3">
                  {/* Bônus Totais Ativos */}
                  <div className="clip-cyber-input bg-gradient-to-b from-[#6beaff] via-[#26b6ff] to-[#1a78e8] p-[1.5px]">
                    <div className="clip-cyber-input flex flex-wrap items-center justify-between gap-1.5 bg-[#041238]/95 px-2.5 py-1.5 text-[10.5px] sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-xs">
                      <span className="font-extrabold italic text-white">
                        Equipamentos Ativos ({equippedCount}/10)
                      </span>
                      <span className="font-semibold tabular-nums text-cyan-200">
                        {[
                          equipmentBonusSummary.hp > 0 ? `+${equipmentBonusSummary.hp} HP` : null,
                          equipmentBonusSummary.ds > 0 ? `+${equipmentBonusSummary.ds} DS` : null,
                          equipmentBonusSummary.attack > 0
                            ? `+${equipmentBonusSummary.attack} AT`
                            : null,
                          equipmentBonusSummary.defense > 0
                            ? `+${equipmentBonusSummary.defense} DE`
                            : null,
                          equipmentBonusSummary.speed > 0
                            ? `+${equipmentBonusSummary.speed} Vel.`
                            : null,
                          equipmentBonusSummary.critRate > 0
                            ? `+${equipmentBonusSummary.critRate.toFixed(1)}% CT`
                            : null,
                          equipmentBonusSummary.accuracy > 0
                            ? `+${equipmentBonusSummary.accuracy} HT`
                            : null,
                          equipmentBonusSummary.evasion > 0
                            ? `+${equipmentBonusSummary.evasion.toFixed(1)}% EV`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Nenhum bônus de equipamento ativo'}
                      </span>
                    </div>
                  </div>

                  {/* Slots + Inspetor */}
                  <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-12">
                    {/* Todos os 10 Slots (5 Vestimenta + 5 Acessórios) */}
                    <div className="rounded-xl border border-[#38c4ff]/75 bg-[#041238]/92 p-2 sm:p-3 md:col-span-7">
                      <p className="text-[10px] font-extrabold tracking-wide text-cyan-300 sm:text-[11px]">
                        Vestimenta
                      </p>
                      <div className="mt-1.5 grid grid-cols-5 gap-1 sm:mt-2 sm:gap-1.5">
                        {ARMOR_SLOTS.map((slot) => {
                          const item = equippedItems[slot];
                          const isSelected = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-lg border p-1 transition-all sm:min-h-[68px] sm:gap-1 sm:p-1.5 ${
                                isSelected
                                  ? 'border-amber-300 bg-[#123d9c] shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                                  : item
                                    ? 'border-[#5ef0ff] bg-[#0b2e7a] shadow-[0_0_10px_rgba(56,232,255,0.35)] hover:brightness-110'
                                    : 'border-[#2563eb]/60 bg-[#041030] hover:border-cyan-300/80'
                              }`}
                            >
                              <div className="relative">
                                <SlotArtwork slot={slot} equipped={Boolean(item)} sizeClass="h-5 w-5 sm:h-7 sm:w-7" />
                                {item && (
                                  <span className="absolute -right-1.5 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-[7px] font-black text-slate-950 sm:h-3.5 sm:w-3.5 sm:text-[8px]">
                                    ★
                                  </span>
                                )}
                              </div>
                              <span className="w-full truncate text-center text-[8.5px] font-bold text-slate-100 sm:text-[9.5px]">
                                {EQUIPMENT_SLOT_LABELS[slot].split(' / ')[0]}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <p className="mt-2 text-[10px] font-extrabold tracking-wide text-cyan-300 sm:mt-3.5 sm:text-[11px]">
                        Acessórios & DATS
                      </p>
                      <div className="mt-1.5 grid grid-cols-5 gap-1 sm:mt-2 sm:gap-1.5">
                        {ACCESSORY_SLOTS.map((slot) => {
                          const item = equippedItems[slot];
                          const isSelected = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-lg border p-1 transition-all sm:min-h-[68px] sm:gap-1 sm:p-1.5 ${
                                isSelected
                                  ? 'border-amber-300 bg-[#123d9c] shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                                  : item
                                    ? 'border-[#5ef0ff] bg-[#0b2e7a] shadow-[0_0_10px_rgba(56,232,255,0.35)] hover:brightness-110'
                                    : 'border-[#2563eb]/60 bg-[#041030] hover:border-cyan-300/80'
                              }`}
                            >
                              <div className="relative">
                                <SlotArtwork slot={slot} equipped={Boolean(item)} sizeClass="h-5 w-5 sm:h-7 sm:w-7" />
                                {item && (
                                  <span className="absolute -right-1.5 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-[7px] font-black text-slate-950 sm:h-3.5 sm:w-3.5 sm:text-[8px]">
                                    ★
                                  </span>
                                )}
                              </div>
                              <span className="w-full truncate text-center text-[8.5px] font-bold text-slate-100 sm:text-[9.5px]">
                                {EQUIPMENT_SLOT_LABELS[slot]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Inspetor do Slot + Inventário Compatível */}
                    <div className="flex flex-col justify-between gap-2 rounded-xl border border-[#38c4ff]/75 bg-[#041238]/92 p-2 text-xs sm:gap-2.5 sm:p-3 md:col-span-5">
                      <div>
                        <div className="flex items-center justify-between gap-2 border-b border-cyan-400/30 pb-1 sm:pb-1.5">
                          <span className="text-[11px] font-extrabold text-cyan-200 sm:text-xs">
                            {EQUIPMENT_SLOT_LABELS[selectedSlot]}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold sm:text-[10.5px] ${
                              inspectedEquipped ? 'text-amber-300' : 'text-slate-400'
                            }`}
                          >
                            {inspectedEquipped ? 'Equipado' : 'Vazio'}
                          </span>
                        </div>

                        {inspectedEquipped ? (
                          <div className="mt-1.5 rounded-lg border border-amber-300/50 bg-[#072059] p-2 sm:mt-2 sm:p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-extrabold text-amber-300">
                                {inspectedEquipped.name}
                              </p>
                              <span
                                className={`shrink-0 text-[10px] font-bold ${
                                  deriveItemRarity(inspectedEquipped).textClass
                                }`}
                              >
                                {deriveItemRarity(inspectedEquipped).label}
                              </span>
                            </div>
                            <p className="mt-1 text-[10.5px] font-bold tabular-nums text-cyan-200 sm:text-[11px]">
                              {formatStatBonuses(inspectedEquipped)}
                            </p>
                            <p className="mt-1 text-[10px] leading-relaxed text-slate-200 sm:text-[10.5px]">
                              {inspectedEquipped.description}
                            </p>
                            <button
                              type="button"
                              onClick={() => onUnequipSlot(selectedSlot)}
                              className="mt-2 min-h-[32px] w-full rounded-md border border-rose-300/75 bg-rose-700 px-3 py-1 text-[10.5px] font-extrabold text-white transition hover:bg-rose-600 sm:mt-2.5 sm:min-h-[36px] sm:py-1.5 sm:text-[11px]"
                            >
                              Desequipar
                            </button>
                          </div>
                        ) : (
                          <div className="mt-1.5 rounded-lg border border-cyan-400/20 bg-[#030d2b] p-2 sm:mt-2 sm:p-2.5">
                            <p className="text-[11px] font-bold text-slate-200 sm:text-xs">Espaço Vazio</p>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400 sm:text-[10.5px]">
                              Nenhum item equipado em {EQUIPMENT_SLOT_LABELS[selectedSlot]}.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-cyan-400/25 pt-1.5 sm:pt-2">
                        <p className="text-[10.5px] font-extrabold text-cyan-300 sm:text-[11px]">
                          {compatibleForSelectedSlot.length > 0
                            ? `Compatíveis na Mochila (${compatibleForSelectedSlot.length})`
                            : `Equipamentos na Mochila (${allEquippableInBag.length})`}
                        </p>

                        {compatibleForSelectedSlot.length > 0 ? (
                          <div className="mt-1.5 max-h-[100px] space-y-1.5 overflow-y-auto pr-0.5 sm:max-h-[140px]">
                            {compatibleForSelectedSlot.map((invItem) => {
                              const rarity = deriveItemRarity(invItem);
                              return (
                                <div
                                  key={invItem.id}
                                  className="rounded-lg border border-cyan-400/35 bg-[#072059] p-1.5 sm:p-2"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="truncate text-[11px] font-extrabold text-white sm:text-[11.5px]">
                                        {invItem.name}
                                      </p>
                                      <p className={`text-[9.5px] font-semibold sm:text-[10px] ${rarity.textClass}`}>
                                        {rarity.label} · {formatStatBonuses(invItem)}
                                      </p>
                                      <p className="mt-0.5 line-clamp-2 text-[9.5px] text-slate-300 sm:text-[10px]">
                                        {invItem.description}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => onEquipItem(invItem)}
                                      className="min-h-[30px] shrink-0 rounded border border-cyan-300/80 bg-cyan-600 px-2 py-1 text-[10px] font-extrabold text-white hover:bg-cyan-500 sm:min-h-[34px] sm:px-2.5 sm:text-[10.5px]"
                                    >
                                      Equipar
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : allEquippableInBag.length > 0 ? (
                          <div className="mt-1.5 max-h-[100px] space-y-1.5 overflow-y-auto pr-0.5 sm:max-h-[140px]">
                            {allEquippableInBag.map((invItem) => {
                              const rarity = deriveItemRarity(invItem);
                              return (
                                <div
                                  key={invItem.id}
                                  className="rounded-lg border border-cyan-400/25 bg-[#061844] p-1.5 sm:p-2"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="truncate text-[11px] font-extrabold text-white sm:text-[11.5px]">
                                        {invItem.name}
                                      </p>
                                      <p className={`text-[9.5px] font-semibold sm:text-[10px] ${rarity.textClass}`}>
                                        {invItem.equipSlot
                                          ? EQUIPMENT_SLOT_LABELS[invItem.equipSlot]
                                          : 'Equipamento'}{' '}
                                        · {formatStatBonuses(invItem)}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (invItem.equipSlot) setSelectedSlot(invItem.equipSlot);
                                        onEquipItem(invItem);
                                      }}
                                      className="min-h-[30px] shrink-0 rounded border border-cyan-300/80 bg-cyan-600 px-2 py-1 text-[10px] font-extrabold text-white hover:bg-cyan-500 sm:min-h-[34px] sm:px-2.5 sm:text-[10.5px]"
                                    >
                                      Equipar
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="mt-1 text-[10px] leading-relaxed text-slate-400 sm:mt-1.5 sm:text-[10.5px]">
                            Nenhum equipamento guardado na mochila no momento.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== 6. ABA HABILIDADES (BLOQUEADA) ===================== */}
              {activeTab === 'habilidades' && (
                <div
                  role="tabpanel"
                  aria-label="Habilidades — Em Desenvolvimento"
                  className="animate-dmo-tab flex min-h-[220px] flex-col items-center justify-center gap-2.5 rounded-xl border border-slate-600/75 bg-[#041238]/92 p-6 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-300/60 bg-amber-500/15 shadow-[0_0_16px_rgba(251,191,36,0.25)]">
                    <Lock className="h-6 w-6 text-amber-300" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-wider text-amber-200">
                    Em Desenvolvimento
                  </p>
                  <p className="max-w-xs text-xs text-slate-300">
                    A aba de Habilidades do Tamer está temporariamente bloqueada e será liberada em uma próxima atualização.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
