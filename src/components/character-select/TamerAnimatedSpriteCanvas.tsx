import { useEffect, useRef } from 'react';
import {
  TAMER_CELL_H,
  TAMER_CELL_W,
  TAMER_MOVEMENT_MANIFESTS,
  type CardinalDirection,
  type TamerMovementSheetKey,
  type TamerMovementState,
} from '../../sprites/tamerRealSheets';
import type { TamerId } from '../../types/character';
import {
  computeSpriteAnimationPose,
  type CharacterSelectCardProfile,
} from './characterSelectModel';

interface TamerAnimatedSpriteCanvasProps {
  profile: CharacterSelectCardProfile;
  isSelected: boolean;
  selectionTimestamp: number;
  previewState: 'auto' | 'walk' | 'idle';
  previewDirection: CardinalDirection;
  animationsEnabled: boolean;
}

interface CardSparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  isSquare: boolean;
}

// Shared cache so each individual extracted frame draws immediately without ever rendering a full sheet.
const sheetImageCache = new Map<string, HTMLImageElement>();

function loadSheetImage(url: string): Promise<HTMLImageElement | null> {
  const cached = sheetImageCache.get(url);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }
  return new Promise((resolve) => {
    const img = cached ?? new Image();
    sheetImageCache.set(url, img);
    const onLoad = () => {
      cleanup();
      resolve(img.naturalWidth > 0 ? img : null);
    };
    const onError = () => {
      cleanup();
      resolve(null);
    };
    const cleanup = () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
    };
    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
    if (!img.src) {
      img.src = url;
    } else if (img.complete) {
      cleanup();
      resolve(img.naturalWidth > 0 ? img : null);
    }
  });
}

function resolveSheetKey(
  state: TamerMovementState,
  direction: CardinalDirection
): TamerMovementSheetKey {
  if (state === 'idle') {
    if (direction === 'S') return 'idle';
    if (direction === 'E') return 'idle_side_right';
    if (direction === 'W') return 'idle_side_left';
    return 'idle_back';
  }
  if (direction === 'S') return 'walk_front';
  if (direction === 'E') return 'walk_side_right';
  if (direction === 'W') return 'walk_side_left';
  return 'walk_back';
}

// Tight source crop inside each 144x224 cell to remove unused transparent padding
// so the full-body Tamer fills the card heroically from head to boots on mobile & desktop!
const CROP_PAD_X = 12;
const CROP_W = TAMER_CELL_W - CROP_PAD_X * 2; // 120px
const CROP_TOP = 6;
const CROP_H = TAMER_CELL_H - CROP_TOP - 4; // 214px

export function TamerAnimatedSpriteCanvas({
  profile,
  isSelected,
  selectionTimestamp,
  previewState,
  previewDirection,
  animationsEnabled,
}: TamerAnimatedSpriteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({
    profile,
    isSelected,
    selectionTimestamp,
    previewState,
    previewDirection,
    animationsEnabled,
  });
  const sparksRef = useRef<CardSparkParticle[]>([]);
  const lastBurstTsRef = useRef<number>(0);

  propsRef.current = {
    profile,
    isSelected,
    selectionTimestamp,
    previewState,
    previewDirection,
    animationsEnabled,
  };

  useEffect(() => {
    const manifest = TAMER_MOVEMENT_MANIFESTS[profile.id];
    Object.values(manifest).forEach((entry) => {
      void loadSheetImage(entry.url);
    });
  }, [profile.id]);

  // Neon spark burst inside this card when tapped/selected
  useEffect(() => {
    if (!isSelected || selectionTimestamp <= 0) return;
    if (lastBurstTsRef.current === selectionTimestamp) return;
    lastBurstTsRef.current = selectionTimestamp;

    const colors = profile.palette.particleColors;
    const cx = 72;
    const cy = 132;
    for (let i = 0; i < 22; i++) {
      const angle = (Math.PI * 2 * i) / 22 + Math.random() * 0.25;
      const speed = 34 + Math.random() * 74;
      sparksRef.current.push({
        x: cx + (Math.random() - 0.5) * 24,
        y: cy + (Math.random() - 0.5) * 44,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 36,
        size: 2.2 + Math.random() * 3.4,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.45,
        color: colors[i % colors.length],
        isSquare: i % 2 === 0,
      });
    }
  }, [isSelected, selectionTimestamp, profile.palette.particleColors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Portrait aspect ratio (144x248) matches our tall character cards so sprites render HUGE and crisp
    const logicalW = 144;
    const logicalH = 248;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.4);
    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);

    const cx = logicalW / 2;
    const footY = logicalH - 15;
    const initProfile = propsRef.current.profile;
    const selInit = propsRef.current.isSelected;

    const cachedBeamGrad = ctx.createLinearGradient(cx, 8, cx, footY + 6);
    cachedBeamGrad.addColorStop(0, 'rgba(0,0,0,0)');
    cachedBeamGrad.addColorStop(
      0.5,
      selInit ? initProfile.palette.softGlowRgba : 'rgba(255,255,255,0.04)'
    );
    cachedBeamGrad.addColorStop(
      1,
      selInit ? initProfile.palette.glowRgba : initProfile.palette.softGlowRgba
    );

    const cachedHaloGrad = ctx.createRadialGradient(
      cx,
      114,
      6,
      cx,
      114,
      selInit ? 72 : 52
    );
    cachedHaloGrad.addColorStop(
      0,
      selInit ? initProfile.palette.glowRgba : initProfile.palette.softGlowRgba
    );
    cachedHaloGrad.addColorStop(0.65, initProfile.palette.softGlowRgba);
    cachedHaloGrad.addColorStop(1, 'rgba(0,0,0,0)');

    const rxInit = selInit ? 56 : 44;
    const cachedFloorGrad = ctx.createRadialGradient(
      cx,
      footY + 1,
      3,
      cx,
      footY + 1,
      rxInit
    );
    cachedFloorGrad.addColorStop(0, initProfile.palette.glowRgba);
    cachedFloorGrad.addColorStop(0.6, initProfile.palette.softGlowRgba);
    cachedFloorGrad.addColorStop(1, 'rgba(0,0,0,0)');

    const ambientSparks: CardSparkParticle[] = [];
    for (let i = 0; i < 12; i++) {
      const colors = propsRef.current.profile.palette.particleColors;
      ambientSparks.push({
        x: 12 + Math.random() * (logicalW - 24),
        y: Math.random() * logicalH,
        vx: (Math.random() - 0.5) * 9,
        vy: -(18 + Math.random() * 34),
        size: 1.6 + Math.random() * 2.6,
        life: Math.random() * 2,
        maxLife: 2.1 + Math.random() * 1.8,
        color: colors[i % colors.length],
        isSquare: i % 3 !== 0,
      });
    }

    let rafId = 0;
    const mountTime = performance.now();
    let prevTime = mountTime;
    let lastDrawMs = 0;
    let accumFrame = 0;
    let lastState: TamerMovementState = 'idle';

    const drawSingleCell = (
      img: HTMLImageElement,
      col: number,
      alpha: number,
      footX: number,
      drawFootY: number,
      scaleX: number,
      scaleY: number,
      skewX: number
    ) => {
      const sx = col * TAMER_CELL_W + CROP_PAD_X;
      const dw = CROP_W * scaleX;
      const dh = CROP_H * scaleY;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(footX, drawFootY);
      ctx.transform(1, 0, skewX, 1, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(
        img,
        sx,
        CROP_TOP,
        CROP_W,
        CROP_H,
        -dw / 2,
        -dh,
        dw,
        dh
      );
      ctx.restore();
    };

    const drawFrame = (now: number) => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        if (propsRef.current.animationsEnabled) {
          rafId = window.requestAnimationFrame(drawFrame);
        }
        return;
      }
      if (lastDrawMs > 0 && now - lastDrawMs < 32) {
        if (propsRef.current.animationsEnabled) {
          rafId = window.requestAnimationFrame(drawFrame);
        }
        return;
      }
      lastDrawMs = now;

      const dt = Math.min(0.06, Math.max(0.001, (now - prevTime) / 1000));
      prevTime = now;

      const {
        profile: p,
        isSelected: sel,
        selectionTimestamp: selTs,
        previewState: pState,
        previewDirection: pDir,
        animationsEnabled: animOn,
      } = propsRef.current;

      const elapsedSec = (now - mountTime) / 1000;
      const selectionAgeSec =
        sel && selTs > 0 ? Math.max(0, (now - selTs) / 1000) : 99;

      const pose = computeSpriteAnimationPose({
        elapsedSec,
        phaseOffsetSec: p.phaseOffsetSec,
        isSelected: sel,
        selectionAgeSec,
        previewState: pState,
        previewDirection: pDir,
        animationsEnabled: animOn,
      });

      if (pose.state !== lastState) {
        accumFrame = 0;
        lastState = pose.state;
      } else if (animOn && pose.fps > 0) {
        accumFrame += dt * pose.fps;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, logicalW, logicalH);

      // 1. Radiant Neon Energy Beam & Back Halo inside Card (cached gradients)
      ctx.save();
      ctx.fillStyle = cachedBeamGrad;
      ctx.globalAlpha = sel ? 0.64 * pose.auraIntensity : 0.26;
      ctx.beginPath();
      ctx.moveTo(cx - 38, 8);
      ctx.lineTo(cx + 38, 8);
      ctx.lineTo(cx + 64, footY + 6);
      ctx.lineTo(cx - 64, footY + 6);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = sel ? 0.68 * pose.auraIntensity : 0.3;
      ctx.fillStyle = cachedHaloGrad;
      ctx.beginPath();
      ctx.arc(cx, 114, sel ? 72 : 52, 0, Math.PI * 2);
      ctx.fill();

      // Floor Holographic Energy Disc
      const rx = sel ? 56 : 44;
      const ry = sel ? 12 : 8.5;
      ctx.globalAlpha = sel ? 0.9 : 0.48;
      ctx.fillStyle = cachedFloorGrad;
      ctx.beginPath();
      ctx.ellipse(cx, footY + 1, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = p.palette.neonLight;
      ctx.globalAlpha = sel ? 0.95 : 0.48;
      ctx.lineWidth = sel ? 2 : 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, footY + 1, rx * 0.88, ry * 0.8, 0, 0, Math.PI * 2);
      ctx.stroke();

      if (sel) {
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 0.82;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([11, 8]);
        ctx.lineDashOffset = -(elapsedSec * 32);
        ctx.beginPath();
        ctx.ellipse(cx, footY + 1, rx * 0.65, ry * 0.56, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ground contact shadow right under boots
      ctx.globalAlpha = 0.58;
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.ellipse(cx, footY, 28, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Real Individual Spritesheet Frame (Cropped & Scaled Heroically, zero shadowBlur)
      const manifest = TAMER_MOVEMENT_MANIFESTS[p.id as TamerId];
      const primaryKey = resolveSheetKey(pose.state, pose.direction);
      const fallbackKey = resolveSheetKey('idle', 'S');
      const primaryImg = sheetImageCache.get(manifest[primaryKey].url);
      const fallbackImg = sheetImageCache.get(manifest[fallbackKey].url);
      const activeImg =
        primaryImg && primaryImg.complete && primaryImg.naturalWidth > 0
          ? primaryImg
          : fallbackImg && fallbackImg.complete && fallbackImg.naturalWidth > 0
            ? fallbackImg
            : null;

      if (activeImg) {
        const sheetCols = Math.max(1, Math.round(activeImg.naturalWidth / TAMER_CELL_W));
        const baseScale = sel ? 1.07 : 1.01;
        const scaleX = baseScale * pose.breathScaleX;
        const scaleY = baseScale * pose.breathScaleY;
        const yPos = footY + pose.bobOffsetY;

        const currentCol =
          ((Math.floor(accumFrame) % sheetCols) + sheetCols) % sheetCols;
        const nextCol = (currentCol + 1) % sheetCols;
        const frac = accumFrame - Math.floor(accumFrame);

        if (animOn && sheetCols > 1 && pose.state === 'idle' && frac > 0.72) {
          const blend = (frac - 0.72) / 0.28;
          drawSingleCell(
            activeImg,
            currentCol,
            1 - blend * 0.5,
            cx,
            yPos,
            scaleX,
            scaleY,
            pose.hairSwaySkew
          );
          drawSingleCell(
            activeImg,
            nextCol,
            blend * 0.85,
            cx,
            yPos,
            scaleX,
            scaleY,
            pose.hairSwaySkew
          );
        } else {
          drawSingleCell(
            activeImg,
            currentCol,
            1,
            cx,
            yPos,
            scaleX,
            scaleY,
            pose.hairSwaySkew
          );
        }
      }

      // 3. Rising Neon Digital Particles inside Card (zero shadowBlur)
      const visibleAmbientCount = sel ? ambientSparks.length : 5;
      for (let i = 0; i < visibleAmbientCount; i++) {
        const sp = ambientSparks[i];
        if (animOn) {
          sp.life += dt;
          sp.x += sp.vx * dt;
          sp.y += sp.vy * (sel ? 1.25 : 0.65) * dt;
          if (sp.life >= sp.maxLife || sp.y < 8) {
            sp.x = 12 + Math.random() * (logicalW - 24);
            sp.y = logicalH - 10;
            sp.life = 0;
          }
        }
        const progress = sp.life / sp.maxLife;
        const fade = Math.sin(Math.min(1, progress) * Math.PI);
        ctx.globalAlpha = fade * (sel ? 0.92 : 0.38);
        ctx.fillStyle = sp.color;
        if (sp.isSquare) {
          ctx.fillRect(sp.x - sp.size / 2, sp.y - sp.size / 2, sp.size, sp.size);
        } else {
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Tap Burst Sparks (zero shadowBlur)
      const burstList = sparksRef.current;
      for (let i = burstList.length - 1; i >= 0; i--) {
        const b = burstList[i];
        b.life += dt;
        if (b.life >= b.maxLife) {
          burstList.splice(i, 1);
          continue;
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vx *= 0.95;
        b.vy *= 0.95;
        ctx.globalAlpha = 1 - b.life / b.maxLife;
        ctx.fillStyle = b.color;
        if (b.isSquare) {
          ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
        } else {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.size * 0.65, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (animOn || !activeImg) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    rafId = window.requestAnimationFrame(drawFrame);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [profile.id, animationsEnabled, isSelected, previewState, previewDirection]);

  return (
    <canvas
      ref={canvasRef}
      data-testid={`tamer-sprite-canvas-${profile.id}`}
      className="h-full w-full select-none object-contain"
      aria-hidden="true"
    />
  );
}
