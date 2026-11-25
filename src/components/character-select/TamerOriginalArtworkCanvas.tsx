import { useEffect, useRef } from 'react';
import type { TamerId } from '../../types/character';
import type { CharacterSelectCardProfile } from './characterSelectModel';

export const CHARACTER_SELECT_REFERENCE_ART =
  '/assets/aistudio/file_00000000a730820e878217fd20b5cd39_b088bd20.webp';

interface EyeSpec {
  /** X center in reference image coordinates (1199x1312) */
  x: number;
  /** Y center in reference image coordinates (1199x1312) */
  y: number;
  /** Horizontal radius in reference px */
  rx: number;
  /** Vertical radius in reference px */
  ry: number;
}

interface OriginalCharacterSliceSpec {
  /** Exact source crop inside the 1199x1312 reference artwork */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** Left & right eyes for natural periodic blinking */
  eyes: readonly [EyeSpec, EyeSpec];
  skinColor: string;
  lashColor: string;
  blinkIntervalSec: number;
  blinkPhaseOffsetSec: number;
}

/**
 * Pixel-verified crop bounds & eye centers from the user's original reference artwork
 * (`1199 x 1312`), preserving every character's exact face, hair, clothing, and expression.
 */
const ORIGINAL_CHARACTER_SLICES: Record<TamerId, OriginalCharacterSliceSpec> = {
  kai: {
    sx: 28,
    sy: 444,
    sw: 280,
    sh: 472,
    eyes: [
      { x: 168, y: 571, rx: 15, ry: 10.5 },
      { x: 213, y: 572, rx: 11.5, ry: 10 },
    ],
    skinColor: '#f8c6a6',
    lashColor: '#23130d',
    blinkIntervalSec: 4.1,
    blinkPhaseOffsetSec: 0.7,
  },
  ren: {
    sx: 328,
    sy: 444,
    sw: 278,
    sh: 472,
    eyes: [
      { x: 475, y: 574, rx: 14, ry: 9.5 },
      { x: 521, y: 575, rx: 12, ry: 9.5 },
    ],
    skinColor: '#f7c1a5',
    lashColor: '#1a1010',
    blinkIntervalSec: 4.7,
    blinkPhaseOffsetSec: 2.1,
  },
  hina: {
    sx: 618,
    sy: 444,
    sw: 276,
    sh: 472,
    eyes: [
      { x: 774, y: 570, rx: 15.5, ry: 11.5 },
      { x: 821, y: 571, rx: 12, ry: 11 },
    ],
    skinColor: '#f8ccb4',
    lashColor: '#2c1610',
    blinkIntervalSec: 3.6,
    blinkPhaseOffsetSec: 1.4,
  },
  yuna: {
    sx: 910,
    sy: 444,
    sw: 268,
    sh: 472,
    eyes: [
      { x: 1046, y: 572, rx: 15, ry: 10.5 },
      { x: 1090, y: 572, rx: 12, ry: 10.5 },
    ],
    skinColor: '#f8cdb9',
    lashColor: '#201028',
    blinkIntervalSec: 4.4,
    blinkPhaseOffsetSec: 3.0,
  },
};

let sharedRefImage: HTMLImageElement | null = null;
let sharedRefPromise: Promise<HTMLImageElement | null> | null = null;
const croppedSliceCache = new Map<TamerId, HTMLCanvasElement>();

function getCroppedSliceCanvas(
  tamerId: TamerId,
  img: HTMLImageElement,
  slice: OriginalCharacterSliceSpec
): HTMLCanvasElement | null {
  const cached = croppedSliceCache.get(tamerId);
  if (cached && cached.width > 0) return cached;
  try {
    const off = document.createElement('canvas');
    off.width = slice.sw;
    off.height = slice.sh;
    const octx = off.getContext('2d');
    if (octx) {
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = 'medium';
      octx.drawImage(
        img,
        slice.sx,
        slice.sy,
        slice.sw,
        slice.sh,
        0,
        0,
        slice.sw,
        slice.sh
      );
      croppedSliceCache.set(tamerId, off);
      return off;
    }
  } catch {
    // fallback to direct image draw
  }
  return null;
}

export function loadCharacterSelectReferenceImage(): Promise<HTMLImageElement | null> {
  if (sharedRefImage && sharedRefImage.complete && sharedRefImage.naturalWidth > 0) {
    return Promise.resolve(sharedRefImage);
  }
  if (sharedRefPromise) return sharedRefPromise;

  sharedRefPromise = new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      sharedRefImage = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = CHARACTER_SELECT_REFERENCE_ART;
  });

  return sharedRefPromise;
}

interface CardSpark {
  x: number;
  y: number;
  vy: number;
  vx: number;
  size: number;
  alpha: number;
  phase: number;
  colorIdx: number;
}

interface TamerOriginalArtworkCanvasProps {
  profile: CharacterSelectCardProfile;
  isSelected: boolean;
  selectionTimestamp: number;
  animationsEnabled: boolean;
}

/**
 * Smooth periodic natural blink envelope (0 = eyes open, 1 = eyes closed).
 * Uses a fast close + slightly softer open curve and occasional double-blink.
 */
function computeBlinkAmount(
  elapsedSec: number,
  intervalSec: number,
  offsetSec: number
): number {
  const shifted = elapsedSec + offsetSec;
  const cycleIdx = Math.floor(shifted / intervalSec);
  const localT = shifted - cycleIdx * intervalSec;

  const evalPulse = (t: number, duration: number): number => {
    if (t < 0 || t > duration) return 0;
    const p = t / duration;
    // Fast close (0..0.38), crisp hold (0.38..0.52), smooth open (0.52..1.0)
    if (p < 0.38) return Math.sin((p / 0.38) * (Math.PI / 2));
    if (p < 0.52) return 1;
    return Math.cos(((p - 0.52) / 0.48) * (Math.PI / 2));
  };

  let blink = evalPulse(localT, 0.145);
  // Subtle natural double-blink every 3rd cycle
  if (cycleIdx % 3 === 2) {
    blink = Math.max(blink, evalPulse(localT - 0.22, 0.135));
  }
  return blink;
}

/**
 * Renders the exact original character portrait from the user's reference art
 * with 60 FPS GPU-smooth natural Idle, breathing, periodic eye blinks,
 * and reactive elemental neon particles.
 */
export function TamerOriginalArtworkCanvas({
  profile,
  isSelected,
  selectionTimestamp,
  animationsEnabled,
}: TamerOriginalArtworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    isSelected,
    selectionTimestamp,
    animationsEnabled,
  });

  useEffect(() => {
    stateRef.current = {
      isSelected,
      selectionTimestamp,
      animationsEnabled,
    };
  }, [isSelected, selectionTimestamp, animationsEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const slice = ORIGINAL_CHARACTER_SLICES[profile.id];
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let width = 160;
    let height = 260;
    let dpr = 1;
    let img: HTMLImageElement | null = sharedRefImage;
    let mounted = true;

    const sparks: CardSpark[] = Array.from({ length: 12 }, (_, idx) => ({
      x: Math.random(),
      y: Math.random(),
      vy: -(0.08 + Math.random() * 0.16),
      vx: (Math.random() - 0.5) * 0.04,
      size: 1.8 + Math.random() * 2.6,
      alpha: 0.35 + Math.random() * 0.55,
      phase: idx * 0.9,
      colorIdx: idx % 3,
    }));

    let cachedTopGlow: CanvasGradient | null = null;
    let cachedBottomGrad: CanvasGradient | null = null;

    const rebuildGradients = () => {
      const topGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.14,
        4,
        width * 0.5,
        height * 0.26,
        width * 0.85
      );
      topGlow.addColorStop(0, profile.palette.neonLight);
      topGlow.addColorStop(1, 'rgba(0,0,0,0)');
      cachedTopGlow = topGlow;

      const bottomGrad = ctx.createLinearGradient(0, height * 0.78, 0, height);
      bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
      bottomGrad.addColorStop(1, 'rgba(2, 8, 28, 0.72)');
      cachedBottomGrad = bottomGrad;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(100, Math.round(rect.width || 160));
      height = Math.max(150, Math.round(rect.height || 260));
      dpr = Math.min(window.devicePixelRatio || 1, 1.35);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      rebuildGradients();
    };

    resize();
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);

    let lastNow = performance.now();
    let lastDrawMs = 0;

    const drawFrame = (now: number) => {
      if (!mounted) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        if (stateRef.current.animationsEnabled && !reducedMotion) {
          rafId = window.requestAnimationFrame(drawFrame);
        }
        return;
      }
      if (lastDrawMs > 0 && now - lastDrawMs < 32) {
        if (stateRef.current.animationsEnabled && !reducedMotion) {
          rafId = window.requestAnimationFrame(drawFrame);
        }
        return;
      }
      lastDrawMs = now;

      const dt = Math.min(0.06, Math.max(0.001, (now - lastNow) / 1000));
      lastNow = now;

      const {
        isSelected: sel,
        selectionTimestamp: selTs,
        animationsEnabled: animOn,
      } = stateRef.current;
      const shouldAnimate = animOn && !reducedMotion;
      const elapsed = now / 1000;
      const t = elapsed + profile.phaseOffsetSec;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const croppedCanvas =
        img && img.complete && img.naturalWidth > 0
          ? getCroppedSliceCanvas(profile.id, img, slice)
          : null;

      if (croppedCanvas || (img && img.complete && img.naturalWidth > 0)) {
        // Compute aspect-fill scale with slight overscan so breathing/sway never shows edges
        const coverScale = Math.max(width / slice.sw, height / slice.sh) * 1.045;
        const drawW = slice.sw * coverScale;
        const drawH = slice.sh * coverScale;
        const baseX = (width - drawW) / 2;
        const baseY = (height - drawH) * 0.25;

        // Selection pop pulse (360ms crisp energetic kick)
        const selAge = sel && selTs > 0 ? Math.max(0, (now - selTs) / 1000) : 99;
        const popBoost =
          shouldAnimate && selAge < 0.42
            ? Math.sin((selAge / 0.42) * Math.PI) * 0.032
            : 0;

        // Organic Idle breathing & gentle head/body sway anchored near waist/lower torso
        const breathWave = shouldAnimate
          ? Math.sin(t * (sel ? 2.55 : 1.95))
          : 0;
        const swayWave = shouldAnimate
          ? Math.sin(t * (sel ? 1.45 : 1.1) + 0.6)
          : 0;

        const breathAmp = sel ? 0.0155 : 0.01;
        const scaleY = 1 + breathWave * breathAmp + popBoost;
        const scaleX = 1 - breathWave * (breathAmp * 0.36) + popBoost;
        const floatY = shouldAnimate
          ? -Math.max(0, breathWave) * (sel ? 2.2 : 1.2)
          : 0;
        const swayRot = shouldAnimate ? swayWave * (sel ? 0.0075 : 0.0045) : 0;

        const pivotX = width * 0.5;
        const pivotY = height * 0.88;

        ctx.save();
        ctx.translate(pivotX, pivotY + floatY);
        ctx.rotate(swayRot);
        ctx.scale(scaleX, scaleY);
        ctx.translate(-pivotX, -pivotY);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        if (croppedCanvas) {
          ctx.drawImage(croppedCanvas, baseX, baseY, drawW, drawH);
        } else if (img) {
          ctx.drawImage(
            img,
            slice.sx,
            slice.sy,
            slice.sw,
            slice.sh,
            baseX,
            baseY,
            drawW,
            drawH
          );
        }

        // Natural periodic eye blink aligned strictly over original eye positions
        const blinkAmt = shouldAnimate
          ? computeBlinkAmount(
              elapsed,
              slice.blinkIntervalSec,
              slice.blinkPhaseOffsetSec
            )
          : 0;

        if (blinkAmt > 0.04) {
          for (const eye of slice.eyes) {
            const ex = baseX + (eye.x - slice.sx) * coverScale;
            const ey = baseY + (eye.y - slice.sy) * coverScale;
            const erx = eye.rx * coverScale;
            const ery = eye.ry * coverScale;
            const lidBottomY = ey - ery + 2 * ery * blinkAmt;

            // Clip to the eye socket oval and slide skin-toned upper eyelid down
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(ex, ey, erx * 1.06, ery * 1.04, 0, 0, Math.PI * 2);
            ctx.clip();

            ctx.fillStyle = slice.skinColor;
            ctx.fillRect(
              ex - erx * 1.2,
              ey - ery * 1.2,
              erx * 2.4,
              Math.max(0, lidBottomY - (ey - ery * 1.2))
            );

            // Crisp anime lash curve moving down with the closing eyelid
            ctx.strokeStyle = slice.lashColor;
            ctx.lineWidth = Math.max(1.4, coverScale * 2.3);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(ex - erx * 0.92, lidBottomY - ery * 0.14);
            ctx.quadraticCurveTo(
              ex,
              lidBottomY + ery * 0.24 * blinkAmt,
              ex + erx * 0.92,
              lidBottomY - ery * 0.12
            );
            ctx.stroke();
            ctx.restore();
          }
        }

        ctx.restore();
      }

      // Dynamic selection spotlight aura & edge rim sheen
      const auraAlpha = sel
        ? 0.28 + (shouldAnimate ? 0.1 * Math.sin(t * 3.4) : 0)
        : 0.08;
      if (cachedTopGlow) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = auraAlpha;
        ctx.fillStyle = cachedTopGlow;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // Subtle bottom vignette blending cleanly into the nameplate
      if (cachedBottomGrad) {
        ctx.fillStyle = cachedBottomGrad;
        ctx.fillRect(0, height * 0.78, width, height * 0.22);
      }

      // Floating digital pixel motes (zero shadowBlur for smooth mobile rendering)
      const activeSparkCount = sel ? sparks.length : 6;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < activeSparkCount; i++) {
        const sp = sparks[i];
        if (shouldAnimate) {
          sp.y += sp.vy * (sel ? 1.35 : 0.75) * dt;
          sp.x += sp.vx * dt;
          if (sp.y < -0.05) {
            sp.y = 1.05;
            sp.x = Math.random();
          }
          if (sp.x < -0.05) sp.x = 1.05;
          if (sp.x > 1.05) sp.x = -0.05;
        }
        const px = sp.x * width;
        const py = sp.y * height;
        const twinkle = shouldAnimate
          ? 0.45 + 0.55 * Math.sin(elapsed * 3.2 + sp.phase)
          : 0.65;
        const color = profile.palette.particleColors[sp.colorIdx] ?? '#ffffff';
        const baseAlpha = sp.alpha * twinkle * (sel ? 0.92 : 0.48);
        const sz = sp.size * (sel ? 1.12 : 0.85);

        ctx.globalAlpha = baseAlpha * 0.35;
        ctx.fillStyle = profile.palette.neonBorder;
        ctx.fillRect(px - sz, py - sz, sz * 2, sz * 2);

        ctx.globalAlpha = baseAlpha;
        ctx.fillStyle = color;
        ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
      }
      ctx.restore();

      if (shouldAnimate) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    void loadCharacterSelectReferenceImage().then((loaded) => {
      if (!mounted) return;
      img = loaded;
      if (!rafId) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    });

    rafId = window.requestAnimationFrame(drawFrame);

    return () => {
      mounted = false;
      ro?.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [profile]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="block h-full w-full"
    />
  );
}
