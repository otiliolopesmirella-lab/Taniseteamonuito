import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Smartphone,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { saveStarterDigimonForAccount } from '../services/authService';
import {
  getDigimonAttributeMeta,
  getDigimonElementMeta,
  getDigimonFormClassification,
} from '../types/classification';
import {
  getEvolutionChainForStarter,
  getStarterDigimonById,
  type SavedStarterDigimon,
  type StarterDigimonId,
} from '../types/digimon';
import { playDigitalTone } from '../utils/soundFx';

interface DigimonSelectScreenProps {
  accountUsername: string;
  tamerName: string;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  onToggleSound?: () => void;
  onBackToCharacterSelect: () => void;
  onConfirmStarter: (savedStarter: SavedStarterDigimon) => void;
}

const REFERENCE_LOGO_ART_SRC =
  '/assets/aistudio/file_00000000b500820e93725c016d65fcaa_395bee3d.webp';

type FeaturedStarterId = 'gaomon' | 'lalamon' | 'agumon';

interface FeaturedStarterSpec {
  id: FeaturedStarterId;
  displayName: string;
  sheetUrl: string;
  attackPoseUrl: string;
  portraitUrl: string;
  accentHex: string;
  glowHex: string;
  borderGradient: string;
  cardBg: string;
  nameplateBg: string;
  ringRgba: string;
  beamRgba: string;
  elementKind: 'wind' | 'nature' | 'fire';
  /** Base scale tuning so all 3 original sprites have balanced heroic proportions inside their panels */
  spriteScale: number;
  /** Vertical anchor tweak relative to pedestal */
  footOffsetRatio: number;
}

const FEATURED_STARTERS: readonly FeaturedStarterSpec[] = [
  {
    id: 'gaomon',
    displayName: 'GAOMON',
    sheetUrl: '/assets/sprites/digimon/gaomon/basic_sheet.png?v=gaomon3',
    attackPoseUrl: '/assets/sprites/digimon/gaomon/atk1_pose.png?v=gaomon3',
    portraitUrl: '/assets/digimon/gaomon.png?v=gaomon2',
    accentHex: '#2ee6ff',
    glowHex: '#009dff',
    borderGradient:
      'bg-gradient-to-b from-[#7cf4ff] via-[#0ea5ff] to-[#0059d6]',
    cardBg:
      'bg-[radial-gradient(ellipse_at_50%_46%,rgba(0,174,255,0.42)_0%,rgba(6,44,128,0.88)_62%,rgba(2,14,46,0.98)_100%)]',
    nameplateBg:
      'bg-gradient-to-b from-[#0b43a8] via-[#06246a] to-[#03133d]',
    ringRgba: 'rgba(46, 230, 255, 0.92)',
    beamRgba: 'rgba(0, 174, 255, 0.45)',
    elementKind: 'wind',
    spriteScale: 1.02,
    footOffsetRatio: 0.78,
  },
  {
    id: 'lalamon',
    displayName: 'LALAMON',
    sheetUrl: '/assets/sprites/digimon/lalamon/basic_sheet.png?v=lalamon2',
    attackPoseUrl: '/assets/sprites/digimon/lalamon/atk1_pose.png?v=lalamon2',
    portraitUrl: '/assets/digimon/lalamon.png?v=lalamon2',
    accentHex: '#4ade80',
    glowHex: '#16d959',
    borderGradient:
      'bg-gradient-to-b from-[#a7ffb8] via-[#22e564] to-[#067a30]',
    cardBg:
      'bg-[radial-gradient(ellipse_at_50%_46%,rgba(34,230,100,0.4)_0%,rgba(6,94,42,0.88)_62%,rgba(2,34,18,0.98)_100%)]',
    nameplateBg:
      'bg-gradient-to-b from-[#0c6e32] via-[#06421d] to-[#032410]',
    ringRgba: 'rgba(74, 255, 128, 0.92)',
    beamRgba: 'rgba(34, 229, 100, 0.44)',
    elementKind: 'nature',
    spriteScale: 0.95,
    footOffsetRatio: 0.76,
  },
  {
    id: 'agumon',
    displayName: 'AGUMON',
    sheetUrl: '/assets/sprites/digimon/agumon/basic_sheet.png?v=savers2',
    attackPoseUrl: '/assets/sprites/digimon/agumon/atk1_pose.png?v=savers2',
    portraitUrl: '/assets/digimon/agumon.png?v=savers2',
    accentHex: '#ffb326',
    glowHex: '#ff6a00',
    borderGradient:
      'bg-gradient-to-b from-[#ffe47a] via-[#ff8c00] to-[#b83700]',
    cardBg:
      'bg-[radial-gradient(ellipse_at_50%_46%,rgba(255,140,0,0.44)_0%,rgba(128,44,4,0.88)_62%,rgba(46,14,2,0.98)_100%)]',
    nameplateBg:
      'bg-gradient-to-b from-[#9c3c08] via-[#5e1f03] to-[#300d01]',
    ringRgba: 'rgba(255, 179, 38, 0.95)',
    beamRgba: 'rgba(255, 115, 0, 0.46)',
    elementKind: 'fire',
    spriteScale: 1.02,
    footOffsetRatio: 0.79,
  },
] as const;

interface BgParticle {
  x: number;
  y: number;
  size: number;
  vy: number;
  vx: number;
  alpha: number;
  phase: number;
  square: boolean;
  tint: string;
}

/**
 * Lightweight background particle canvas for the futuristic digital backdrop.
 */
function DigitalAmbientParticlesCanvas({ animate }: { animate: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const shouldAnimate = animate && !reducedMotion;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(320, Math.round(rect.width));
      height = Math.max(480, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const tints = ['#38e8ff', '#60a5fa', '#7dd3fc', '#fde047', '#00d4ff'];
    const particles: BgParticle[] = Array.from({ length: 24 }, (_, i) => ({
      x: ((i * 73) % 100) / 100,
      y: ((i * 37) % 100) / 100,
      size: 2.2 + (i % 4) * 1.4,
      vy: 0.018 + (i % 5) * 0.008,
      vx: ((i % 3) - 1) * 0.004,
      alpha: 0.25 + (i % 5) * 0.12,
      phase: i * 0.7,
      square: i % 3 !== 0,
      tint: tints[i % tints.length],
    }));

    let lastTime = performance.now();
    let lastDrawMs = 0;

    const render = (now: number) => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        if (shouldAnimate) {
          rafId = window.requestAnimationFrame(render);
        }
        return;
      }
      if (lastDrawMs > 0 && now - lastDrawMs < 40) {
        if (shouldAnimate) {
          rafId = window.requestAnimationFrame(render);
        }
        return;
      }
      lastDrawMs = now;

      const dt = Math.min(0.06, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      const t = now / 1000;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        if (shouldAnimate) {
          p.y -= p.vy * dt;
          p.x += (p.vx + Math.sin(t * 1.1 + p.phase) * 0.004) * dt;
          if (p.y < -0.04) {
            p.y = 1.04;
            p.x = (p.x + 0.31) % 1;
          }
          if (p.x < -0.04) p.x = 1.04;
          if (p.x > 1.04) p.x = -0.04;
        }

        const px = p.x * width;
        const py = p.y * height;
        const pulse = 0.65 + 0.35 * Math.sin(t * 2.4 + p.phase);

        ctx.globalAlpha = p.alpha * pulse;
        ctx.fillStyle = p.tint;
        if (p.square) {
          ctx.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(px, py, p.size * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (shouldAnimate) {
        rafId = window.requestAnimationFrame(render);
      }
    };

    rafId = window.requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', resize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
    />
  );
}

interface CardParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vRot: number;
  life: number;
  maxLife: number;
}

interface LiveDigimonPanelCanvasProps {
  spec: FeaturedStarterSpec;
  isSelected: boolean;
  selectionPulseAt: number;
  confirmPulseAt: number;
  animate: boolean;
}

type BakedPanelSource = HTMLImageElement | HTMLCanvasElement;

function isBakedSourceReady(src: BakedPanelSource | null): src is BakedPanelSource {
  if (!src) return false;
  if ('naturalWidth' in src) {
    return src.complete && src.naturalWidth > 0;
  }
  return src.width > 0 && src.height > 0;
}

function getBakedSourceSize(src: BakedPanelSource): { width: number; height: number } {
  if ('naturalWidth' in src) {
    return { width: src.naturalWidth, height: src.naturalHeight };
  }
  return { width: src.width, height: src.height };
}

function bakePanelAsset(
  img: HTMLImageElement,
  maxW: number,
  maxH: number,
  snapCols = 1
): BakedPanelSource {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (nw <= 0 || nh <= 0 || (nw <= maxW && nh <= maxH)) {
    return img;
  }
  const scale = Math.min(maxW / nw, maxH / nh);
  const targetW =
    snapCols > 1
      ? Math.max(snapCols, Math.round((nw * scale) / snapCols) * snapCols)
      : Math.max(1, Math.round(nw * scale));
  const targetH = Math.max(1, Math.round((nh / nw) * targetW));
  try {
    const c = document.createElement('canvas');
    c.width = targetW;
    c.height = targetH;
    const octx = c.getContext('2d');
    if (octx) {
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = 'medium';
      octx.drawImage(img, 0, 0, targetW, targetH);
      img.onload = null;
      img.onerror = null;
      img.src = '';
      return c;
    }
  } catch {
    // Fallback to raw image
  }
  return img;
}

/**
 * Renders the ORIGINAL Digimon spritesheet (zero redrawing) with continuous live
 * Idle + Breathing + Head/Body sway + real Arm/Leg sprite frames, individual
 * elemental VFX (wind / leaves / fire), glowing pedestal energy circle, and
 * selection / confirmation burst animations.
 */
function LiveDigimonPanelCanvas({
  spec,
  isSelected,
  selectionPulseAt,
  confirmPulseAt,
  animate,
}: LiveDigimonPanelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sheetImgRef = useRef<BakedPanelSource | null>(null);
  const atkImgRef = useRef<BakedPanelSource | null>(null);
  const portraitImgRef = useRef<BakedPanelSource | null>(null);
  const [loadedTick, setLoadedTick] = useState(0);

  // Store dynamic props in refs so the loop stays continuous without resetting on click
  const stateRef = useRef({
    isSelected,
    selectionPulseAt,
    confirmPulseAt,
    animate,
  });
  stateRef.current = {
    isSelected,
    selectionPulseAt,
    confirmPulseAt,
    animate,
  };

  // Preload original project sprite sheets & bake down oversized PNGs to save GPU RAM
  useEffect(() => {
    let active = true;

    const loadImg = (
      src: string,
      target: { current: BakedPanelSource | null },
      maxW: number,
      maxH: number,
      snapCols: number
    ) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (!active) return;
        target.current = bakePanelAsset(img, maxW, maxH, snapCols);
        setLoadedTick((v) => v + 1);
      };
      img.src = src;
    };

    loadImg(spec.sheetUrl, sheetImgRef, 512, 640, 4);
    loadImg(spec.attackPoseUrl, atkImgRef, 256, 256, 1);
    loadImg(spec.portraitUrl, portraitImgRef, 256, 256, 1);

    return () => {
      active = false;
    };
  }, [spec.sheetUrl, spec.attackPoseUrl, spec.portraitUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const logicalW = 190;
    const logicalH = 276;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);

    const cx = logicalW / 2;
    const footY = Math.round(logicalH * spec.footOffsetRatio);

    // Pre-allocate static gradients once instead of recreating every frame
    const beamGrad = ctx.createLinearGradient(cx, 12, cx, footY + 14);
    beamGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    beamGrad.addColorStop(0.45, spec.beamRgba);
    beamGrad.addColorStop(1, spec.ringRgba);

    const discGrad = ctx.createRadialGradient(cx, footY + 4, 4, cx, footY + 4, 78);
    discGrad.addColorStop(0, '#ffffff');
    discGrad.addColorStop(0.28, spec.ringRgba);
    discGrad.addColorStop(0.68, spec.beamRgba);
    discGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    const leafGrad = ctx.createLinearGradient(-8, 0, 8, 0);
    leafGrad.addColorStop(0, '#bbf7d0');
    leafGrad.addColorStop(0.5, '#22e564');
    leafGrad.addColorStop(1, '#15803d');

    const flameGrad = ctx.createLinearGradient(0, 6, 0, -56);
    flameGrad.addColorStop(0, 'rgba(255, 85, 0, 0.55)');
    flameGrad.addColorStop(0.55, 'rgba(255, 175, 20, 0.38)');
    flameGrad.addColorStop(1, 'rgba(255, 245, 160, 0)');

    // Pre-seeded elemental particles per Digimon panel
    const particleCount = spec.elementKind === 'nature' ? 12 : 14;
    const particles: CardParticle[] = Array.from({ length: particleCount }, (_, i) => ({
      x: 24 + ((i * 37) % (logicalW - 48)),
      y: 34 + ((i * 53) % (logicalH - 54)),
      vx: ((i % 5) - 2) * 10,
      vy: -(24 + (i % 6) * 11),
      size: 3 + (i % 5) * 1.4,
      rot: (i * 0.9) % (Math.PI * 2),
      vRot: (i % 2 === 0 ? 1 : -1) * (1.2 + (i % 3) * 0.7),
      life: (i / particleCount) * 2.2,
      maxLife: 1.5 + (i % 4) * 0.45,
    }));

    let rafId = 0;
    let lastNow = performance.now();
    let lastDrawMs = 0;
    let smoothSelected = stateRef.current.isSelected ? 1 : 0;

    const drawWindArcs = (
      t: number,
      intensity: number,
      arcCx: number,
      cy: number
    ) => {
      ctx.save();
      for (let i = 0; i < 3; i += 1) {
        const angle = t * (2.2 + i * 0.55) + i * 2.1;
        const rx = 56 + i * 11 + intensity * 8;
        const ry = 18 + i * 5;
        const yOff = cy + (i - 1) * 32 + Math.sin(t * 2.6 + i) * 6;
        ctx.strokeStyle = i === 1 ? '#b8f7ff' : '#2ee6ff';
        ctx.globalAlpha = (0.24 + intensity * 0.36) * (0.7 + 0.3 * Math.sin(t * 4 + i));
        ctx.lineWidth = 2.2 + intensity * 1.1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.ellipse(
          arcCx,
          yOff,
          rx,
          ry,
          -0.18 + Math.sin(t + i) * 0.08,
          angle,
          angle + 1.45
        );
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawLeaf = (
      x: number,
      y: number,
      size: number,
      rot: number,
      alpha: number
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = leafGrad;
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.2);
      ctx.quadraticCurveTo(size * 0.95, 0, 0, size * 1.2);
      ctx.quadraticCurveTo(-size * 0.95, 0, 0, -size * 1.2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(220,255,230,0.75)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.9);
      ctx.lineTo(0, size * 0.9);
      ctx.stroke();
      ctx.restore();
    };

    const drawFlameTongues = (
      t: number,
      intensity: number,
      flameCx: number,
      flameFootY: number
    ) => {
      ctx.save();
      ctx.fillStyle = flameGrad;
      for (let i = 0; i < 5; i += 1) {
        const phase = t * 5.2 + i * 1.15;
        const spread = (i - 2) * 26;
        const sway = Math.sin(phase) * 9;
        const flameH = (40 + (i % 3) * 16) * (0.78 + intensity * 0.45);
        const flameW = 14 + (i % 2) * 5;
        const bx = flameCx + spread;

        ctx.save();
        ctx.translate(bx, flameFootY);
        ctx.beginPath();
        ctx.moveTo(-flameW, 6);
        ctx.quadraticCurveTo(-flameW * 0.4 + sway * 0.5, 6 - flameH * 0.55, sway, 6 - flameH);
        ctx.quadraticCurveTo(flameW * 0.4 + sway * 0.5, 6 - flameH * 0.55, flameW, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    };

    const drawFrame = (now: number) => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        if (stateRef.current.animate && !reducedMotion) {
          rafId = window.requestAnimationFrame(drawFrame);
        }
        return;
      }
      if (lastDrawMs > 0 && now - lastDrawMs < 32) {
        if (stateRef.current.animate && !reducedMotion) {
          rafId = window.requestAnimationFrame(drawFrame);
        }
        return;
      }
      lastDrawMs = now;

      const dt = Math.min(0.06, Math.max(0.001, (now - lastNow) / 1000));
      lastNow = now;
      const {
        isSelected: sel,
        selectionPulseAt: selAt,
        confirmPulseAt: confAt,
        animate: animEnabled,
      } = stateRef.current;
      const shouldAnimate = animEnabled && !reducedMotion;

      const targetSel = sel ? 1 : 0;
      smoothSelected += (targetSel - smoothSelected) * Math.min(1, dt * 9.5);

      const t = shouldAnimate ? now / 1000 : 0;
      const selElapsed = selAt > 0 ? Math.max(0, (now - selAt) / 1000) : 99;
      const confElapsed = confAt > 0 ? Math.max(0, (now - confAt) / 1000) : 99;

      const selectWave =
        selElapsed < 0.65 ? Math.sin((selElapsed / 0.65) * Math.PI) : 0;
      const confirmWave =
        confElapsed < 1.05 ? Math.sin(Math.min(1, confElapsed / 0.55) * Math.PI) : 0;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, logicalW, logicalH);

      // 1. Vertical elemental spotlight & energy pillar (cached gradient)
      const beamAlpha = 0.22 + smoothSelected * 0.52 + confirmWave * 0.45;
      ctx.save();
      const beamW = 54 + smoothSelected * 24 + confirmWave * 22;
      ctx.globalAlpha = Math.min(0.95, beamAlpha);
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(cx - beamW * 0.62, 10);
      ctx.lineTo(cx + beamW * 0.62, 10);
      ctx.lineTo(cx + beamW * 1.08, footY + 14);
      ctx.lineTo(cx - beamW * 1.08, footY + 14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 2. Back elemental aura (flames / wind behind character)
      if (spec.elementKind === 'fire') {
        drawFlameTongues(t, smoothSelected + confirmWave * 0.8, cx, footY);
      } else if (spec.elementKind === 'wind') {
        drawWindArcs(t, smoothSelected + confirmWave * 0.7, cx, footY - 68);
      }

      // 3. Glowing Energy Circle below Digimon
      ctx.save();
      const ringRx = 58 + smoothSelected * 14 + selectWave * 10;
      const ringRy = 15 + smoothSelected * 4 + selectWave * 3;
      ctx.globalAlpha = 0.42 + smoothSelected * 0.56 + confirmWave * 0.35;
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.ellipse(cx, footY + 4, ringRx * 1.15, ringRy * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = spec.accentHex;
      ctx.globalAlpha = 0.45 + smoothSelected * 0.55;
      ctx.lineWidth = 1.8 + smoothSelected * 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, footY + 4, ringRx, ringRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      if (smoothSelected > 0.08) {
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = smoothSelected * 0.88;
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 9]);
        ctx.lineDashOffset = -t * 36;
        ctx.beginPath();
        ctx.ellipse(cx, footY + 4, ringRx * 0.76, ringRy * 0.74, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = spec.accentHex;
        ctx.lineDashOffset = t * 28;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.ellipse(cx, footY + 4, ringRx * 0.52, ringRy * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (selElapsed < 0.65) {
        const p = selElapsed / 0.65;
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = (1 - p) * 0.9;
        ctx.lineWidth = 3 * (1 - p * 0.6);
        ctx.beginPath();
        ctx.ellipse(
          cx,
          footY + 4,
          ringRx * (0.7 + p * 0.85),
          ringRy * (0.7 + p * 0.85),
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      if (confElapsed < 1.05) {
        const p = confElapsed / 1.05;
        ctx.strokeStyle = '#ffe566';
        ctx.globalAlpha = (1 - p) * 0.95;
        ctx.lineWidth = 4 * (1 - p * 0.5);
        ctx.beginPath();
        ctx.ellipse(
          cx,
          footY + 4,
          ringRx * (0.65 + p * 1.4),
          ringRy * (0.65 + p * 1.4),
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.ellipse(cx, footY + 3, 42 + smoothSelected * 5, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. ORIGINAL DIGIMON SPRITE — LIVE IDLE + BREATHING + LIMB ANIMATION (zero shadowBlur!)
      const sheetImg = sheetImgRef.current;
      const atkImg = atkImgRef.current;
      const portraitImg = portraitImgRef.current;

      const phaseOffset =
        spec.id === 'gaomon' ? 0 : spec.id === 'lalamon' ? 1.8 : 3.4;
      const breath = Math.sin(t * 3.1 + phaseOffset);
      const sway = Math.sin(t * 1.85 + phaseOffset);
      const floatBob =
        spec.id === 'lalamon'
          ? Math.sin(t * 2.8 + phaseOffset) * 5.5 - 5
          : Math.abs(Math.sin(t * (sel ? 4.8 : 2.1) + phaseOffset)) * -(sel ? 3.5 : 1.2);
      const hopY = -selectWave * 16 - confirmWave * 24;

      const scaleBoost = 1 + smoothSelected * 0.13 + selectWave * 0.06 + confirmWave * 0.12;
      const breathScaleY = 1 + breath * 0.026;
      const breathScaleX = 1 - breath * 0.018;
      const tiltRad = sway * (sel ? 0.036 : 0.022);

      const useAttackPose = confElapsed < 0.85 && isBakedSourceReady(atkImg);

      ctx.save();
      ctx.translate(cx, footY + floatBob + hopY);
      ctx.rotate(tiltRad);
      ctx.scale(scaleBoost * breathScaleX, scaleBoost * breathScaleY);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';

      const targetDrawH = Math.round(146 * spec.spriteScale);

      if (useAttackPose && atkImg) {
        const sz = getBakedSourceSize(atkImg);
        const aspect = sz.width / Math.max(1, sz.height);
        const drawH = targetDrawH * 1.06;
        const drawW = drawH * aspect;
        ctx.drawImage(atkImg, -drawW / 2, -drawH + 6, drawW, drawH);
      } else if (isBakedSourceReady(sheetImg)) {
        const cols = 4;
        const rows = 5;
        const sz = getBakedSourceSize(sheetImg);
        const cellW = sz.width / cols;
        const cellH = sz.height / rows;

        const row = sel ? 0 : 4;
        const fps = sel ? 4.6 : 2.3;
        const frameIdx = shouldAnimate ? Math.floor(t * fps + phaseOffset) % cols : 0;

        const aspect = cellW / Math.max(1, cellH);
        const drawH = targetDrawH;
        const drawW = drawH * aspect;

        ctx.drawImage(
          sheetImg,
          frameIdx * cellW,
          row * cellH,
          cellW,
          cellH,
          -drawW / 2,
          -drawH + 6,
          drawW,
          drawH
        );
      } else if (isBakedSourceReady(portraitImg)) {
        const sz = getBakedSourceSize(portraitImg);
        const aspect = sz.width / Math.max(1, sz.height);
        const drawH = targetDrawH * 0.92;
        const drawW = drawH * aspect;
        ctx.drawImage(portraitImg, -drawW / 2, -drawH + 6, drawW, drawH);
      }

      ctx.restore();

      // 5. Foreground Individual Elemental Particles (zero shadowBlur!)
      const speedMult = 0.72 + smoothSelected * 0.65 + confirmWave * 1.1;
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        if (shouldAnimate) {
          p.life += dt * speedMult;
          if (spec.elementKind === 'wind') {
            p.x += (p.vx * 1.4 + Math.cos(t * 4 + i) * 32) * dt * speedMult;
            p.y += p.vy * 1.15 * dt * speedMult;
          } else if (spec.elementKind === 'nature') {
            p.x += Math.sin(t * 2.2 + p.rot) * 22 * dt * speedMult;
            p.y += p.vy * 0.78 * dt * speedMult;
            p.rot += p.vRot * dt * speedMult;
          } else {
            p.x += (p.vx + Math.sin(t * 6 + i) * 16) * dt * speedMult;
            p.y += p.vy * 1.35 * dt * speedMult;
          }

          if (p.life >= p.maxLife || p.y < 14 || p.x < 6 || p.x > logicalW - 6) {
            p.life = 0;
            p.x = cx + Math.sin(now * 0.01 + i * 7.3) * 64;
            p.y = footY + 6 - Math.abs(Math.cos(i * 3.1)) * 28;
          }
        }

        const norm = Math.max(0, Math.min(1, p.life / p.maxLife));
        const alpha =
          Math.sin(norm * Math.PI) *
          (0.42 + smoothSelected * 0.52 + confirmWave * 0.3);

        if (spec.elementKind === 'nature') {
          if (i % 3 === 0) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#d9f99d';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.48, 0, Math.PI * 2);
            ctx.fill();
          } else {
            drawLeaf(p.x, p.y, p.size * 1.25, p.rot, alpha);
          }
        } else if (spec.elementKind === 'wind') {
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = i % 2 === 0 ? '#a5f3fc' : '#38bdf8';
          ctx.lineWidth = i % 3 === 0 ? 2 : 1.3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 0.25 + 6, p.y - p.size * 2.4);
          ctx.stroke();
        } else {
          ctx.globalAlpha = alpha;
          ctx.fillStyle =
            i % 3 === 0 ? '#fef08a' : i % 2 === 0 ? '#fb923c' : '#f97316';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - norm * 0.45) * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (shouldAnimate) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    rafId = window.requestAnimationFrame(drawFrame);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [spec, loadedTick]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="h-full w-full select-none object-contain"
    />
  );
}

export function DigimonSelectScreen({
  accountUsername,
  tamerName,
  soundEnabled,
  animationsEnabled,
  onToggleSound,
  onBackToCharacterSelect,
  onConfirmStarter,
}: DigimonSelectScreenProps) {
  const [selectedId, setSelectedId] = useState<FeaturedStarterId>('agumon');
  const [selectionPulseMap, setSelectionPulseMap] = useState<
    Record<FeaturedStarterId, number>
  >({
    gaomon: 0,
    lalamon: 0,
    agumon: 0,
  });
  const [confirmPulseAt, setConfirmPulseAt] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  const confirmTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) {
        window.clearTimeout(confirmTimerRef.current);
      }
    };
  }, []);

  const selectedSpec = useMemo(
    () =>
      FEATURED_STARTERS.find((item) => item.id === selectedId) ??
      FEATURED_STARTERS[2],
    [selectedId]
  );

  const selectedProfile = useMemo(
    () => getStarterDigimonById(selectedId as StarterDigimonId),
    [selectedId]
  );

  const evolutionChain = useMemo(
    () => getEvolutionChainForStarter(selectedId as StarterDigimonId),
    [selectedId]
  );

  const classification = useMemo(
    () => getDigimonFormClassification(selectedId),
    [selectedId]
  );
  const attrMeta = useMemo(
    () => getDigimonAttributeMeta(classification.attribute),
    [classification.attribute]
  );
  const elemMeta = useMemo(
    () => getDigimonElementMeta(classification.element),
    [classification.element]
  );

  function handleSelectDigimon(id: FeaturedStarterId) {
    if (isConfirming) return;
    playDigitalTone('click', soundEnabled);
    setConfirmError(null);
    setSelectedId(id);
    setSelectionPulseMap((prev) => ({
      ...prev,
      [id]: performance.now(),
    }));
  }

  async function handleConfirmSelection() {
    if (isConfirming) return;
    setConfirmError(null);
    setIsConfirming(true);
    setConfirmPulseAt(performance.now());
    playDigitalTone('confirm', soundEnabled);

    try {
      const result = await saveStarterDigimonForAccount({
        accountUsername,
        digimonId: selectedId,
      });

      const celebrationDelayMs = animationsEnabled ? 950 : 250;
      confirmTimerRef.current = window.setTimeout(() => {
        onConfirmStarter(result.saved);
      }, celebrationDelayMs);
    } catch (err) {
      setIsConfirming(false);
      const raw = err instanceof Error ? err.message : '';
      setConfirmError(
        raw.toLowerCase().includes('permission')
          ? 'Não foi possível salvar seu Digimon na nuvem agora. Recarregue a página ou faça login novamente.'
          : 'Erro ao confirmar seu Digimon inicial. Tente novamente.'
      );
    }
  }

  return (
    <section
      aria-label="Seleção de Digimon — DigiLegends Idle"
      className="relative flex min-h-dvh w-full flex-col items-center justify-between overflow-x-hidden bg-[#020a24] text-white"
    >
      {/* 1. FUTURISTIC DIGITAL TECH BACKDROP */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        {/* Deep cobalt digital gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(0,140,255,0.48)_0%,rgba(4,24,84,0.92)_48%,#02081c_100%)]" />

        {/* Subtle digital tech grid & diagonal light beams */}
        <div className="absolute inset-0 opacity-22 [background-image:linear-gradient(to_right,rgba(0,224,255,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,224,255,0.22)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute -left-16 top-[12%] h-72 w-40 rotate-[24deg] bg-gradient-to-b from-cyan-400/25 via-blue-500/10 to-transparent blur-xl" />
        <div className="absolute -right-16 top-[12%] h-72 w-40 -rotate-[24deg] bg-gradient-to-b from-cyan-400/25 via-blue-500/10 to-transparent blur-xl" />

        {/* Dynamic ambient glow matching the currently selected Digimon */}
        <div
          className={`absolute inset-x-0 top-[30%] mx-auto h-80 w-[90%] max-w-[540px] rounded-full opacity-35 blur-3xl transition-colors duration-300 ${
            selectedId === 'gaomon'
              ? 'bg-cyan-400'
              : selectedId === 'lalamon'
                ? 'bg-emerald-400'
                : 'bg-orange-500'
          }`}
        />

        {/* Lower glowing cyber portal floor ring */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-[radial-gradient(ellipse_at_50%_100%,rgba(0,212,255,0.45)_0%,rgba(0,115,255,0.18)_45%,transparent_76%)]" />
        <div className="absolute inset-x-0 bottom-2 mx-auto h-24 w-[112%] max-w-[640px] rounded-[100%] border-2 border-cyan-300/35 shadow-[0_0_28px_rgba(0,212,255,0.35),inset_0_0_24px_rgba(0,180,255,0.25)]" />
      </div>

      {/* Live floating scenario particles */}
      <DigitalAmbientParticlesCanvas animate={animationsEnabled} />

      {/* Main Mobile-Optimized Vertical Stage (no horizontal scroll on any phone) */}
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[520px] flex-col justify-between px-2.5 pb-4 pt-2 sm:px-4 sm:pb-5 sm:pt-3">
        {/* TOP UTILITY BAR + ORIGINAL DIGILEGENDS IDLE LOGO */}
        <header className="relative flex flex-col items-center">
          {/* Compact Top Controls: Back & Sound (44px touch targets) */}
          <div className="flex w-full items-center justify-between gap-2">
            <button
              type="button"
              disabled={isConfirming}
              onClick={() => {
                playDigitalTone('click', soundEnabled);
                onBackToCharacterSelect();
              }}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-cyan-400/40 bg-[#051844]/85 px-2.5 text-xs font-extrabold text-cyan-100 shadow-[0_0_12px_rgba(0,180,255,0.28)] backdrop-blur-sm transition-colors hover:border-cyan-300 hover:bg-[#0a286b] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              <span>Voltar</span>
            </button>

            <span className="max-w-[160px] truncate text-xs font-bold text-sky-200/90">
              Tamer: <strong className="text-white">{tamerName}</strong>
            </span>

            <button
              type="button"
              onClick={() => {
                playDigitalTone('click', !soundEnabled);
                onToggleSound?.();
              }}
              aria-label={soundEnabled ? 'Silenciar áudio' : 'Ativar áudio'}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-cyan-400/40 bg-[#051844]/85 px-2.5 text-cyan-100 shadow-[0_0_12px_rgba(0,180,255,0.28)] backdrop-blur-sm transition-colors hover:border-cyan-300 hover:bg-[#0a286b] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-400" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* ORIGINAL DIGILEGENDS IDLE LOGO PRESERVED FROM ATTACHED IMAGE */}
          <div className="relative -mt-2 w-full max-w-[330px] select-none sm:max-w-[375px]">
            {!logoFailed ? (
              <div className="relative aspect-[1024/325] w-full overflow-hidden [mask-image:radial-gradient(ellipse_92%_88%_at_50%_46%,black_72%,transparent_100%)]">
                <img
                  src={REFERENCE_LOGO_ART_SRC}
                  alt="DigiLegends Idle"
                  referrerPolicy="no-referrer"
                  loading="eager"
                  decoding="async"
                  onError={() => setLogoFailed(true)}
                  className="pointer-events-none h-[472%] w-full object-cover object-top drop-shadow-[0_0_18px_rgba(0,212,255,0.7)]"
                />
              </div>
            ) : (
              <div className="py-3 text-center font-[family-name:var(--font-display)] text-3xl italic tracking-wider text-amber-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]">
                DIGILEGENDS IDLE
              </div>
            )}
          </div>

          {/* CHAMFERED TITLE BANNER: ESCOLHA SEU DIGIMON */}
          <div className="relative -mt-1 w-full">
            <div className="clip-tamer-ribbon bg-gradient-to-r from-[#00a8ff] via-[#6cf3ff] to-[#00a8ff] p-[1.5px] shadow-[0_0_24px_rgba(0,196,255,0.55)]">
              <div className="clip-tamer-ribbon relative flex flex-col items-center bg-gradient-to-b from-[#082c78] via-[#04184a] to-[#031033] px-4 py-1.5 text-center sm:py-2">
                <span className="-skew-x-6 font-[family-name:var(--font-display)] text-[13px] tracking-[0.14em] text-sky-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] sm:text-[15px]">
                  ESCOLHA SEU
                </span>
                <h1 className="-mt-1 -skew-x-6 bg-gradient-to-b from-[#fff9c4] via-[#ffd426] to-[#f57c00] bg-clip-text font-[family-name:var(--font-display)] text-[32px] leading-none tracking-wider text-transparent drop-shadow-[0_3px_10px_rgba(255,153,0,0.45)] sm:text-[38px]">
                  DIGIMON
                </h1>
              </div>
            </div>

            {/* Subtitle ribbon */}
            <div className="mt-1.5 flex items-center justify-center gap-2 text-center">
              <span
                aria-hidden="true"
                className="flex gap-0.5 text-cyan-400/90"
              >
                <span className="h-2.5 w-1 -skew-x-[24deg] bg-cyan-400" />
                <span className="h-2.5 w-1 -skew-x-[24deg] bg-cyan-400/75" />
                <span className="h-2.5 w-1 -skew-x-[24deg] bg-cyan-400/50" />
              </span>
              <p className="text-[12.5px] font-extrabold italic tracking-wide text-white sm:text-sm">
                Selecione seu{' '}
                <span className="text-[#ffe047]">parceiro de jornada!</span>
              </p>
              <span
                aria-hidden="true"
                className="flex gap-0.5 text-cyan-400/90"
              >
                <span className="h-2.5 w-1 skew-x-[24deg] bg-cyan-400/50" />
                <span className="h-2.5 w-1 skew-x-[24deg] bg-cyan-400/75" />
                <span className="h-2.5 w-1 skew-x-[24deg] bg-cyan-400" />
              </span>
            </div>
          </div>
        </header>

        {/* 2. THREE INDIVIDUAL ANIMATED DIGIMON PANELS (GAOMON · LALAMON · AGUMON) */}
        <div
          role="radiogroup"
          aria-label="Escolha seu Digimon inicial"
          className="my-2.5 grid w-full grid-cols-3 gap-2 sm:my-3 sm:gap-3"
        >
          {FEATURED_STARTERS.map((spec) => {
            const isSelected = selectedId === spec.id;
            const isConfirmingThis = isConfirming && isSelected;

            return (
              <button
                key={spec.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`Selecionar ${spec.displayName}`}
                disabled={isConfirming}
                onClick={() => handleSelectDigimon(spec.id)}
                className={`group relative flex flex-col outline-none transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-white ${
                  isSelected
                    ? 'z-20 scale-[1.04] opacity-100 brightness-110'
                    : 'z-10 scale-[0.95] opacity-60 brightness-75 saturate-75 hover:opacity-85 hover:brightness-95'
                }`}
              >
                {/* Outer Glowing Neon Chamfered Border */}
                <div
                  className={`clip-tamer-card relative w-full p-[2.5px] transition-shadow duration-200 ${spec.borderGradient} ${
                    isSelected
                      ? spec.id === 'gaomon'
                        ? 'shadow-[0_0_26px_rgba(46,230,255,0.82),0_0_8px_rgba(255,255,255,0.65)]'
                        : spec.id === 'lalamon'
                          ? 'shadow-[0_0_26px_rgba(52,245,112,0.82),0_0_8px_rgba(255,255,255,0.65)]'
                          : 'shadow-[0_0_26px_rgba(255,153,0,0.85),0_0_8px_rgba(255,255,255,0.65)]'
                      : 'shadow-[0_6px_18px_rgba(0,0,0,0.65)]'
                  }`}
                >
                  {/* Inner Elemental Chamber */}
                  <div
                    className={`clip-tamer-card relative flex aspect-[190/298] w-full flex-col items-center justify-between overflow-hidden ${spec.cardBg}`}
                  >
                    {/* Animated Sheen on selected panel */}
                    {isSelected && animationsEnabled && (
                      <span
                        aria-hidden="true"
                        className="animate-digiselect-sheen pointer-events-none absolute inset-y-0 left-0 z-20 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                      />
                    )}

                    {/* Confirm burst ring overlay on the confirmed card */}
                    {isConfirmingThis && (
                      <span
                        aria-hidden="true"
                        className="animate-digiselect-confirm-burst pointer-events-none absolute inset-0 z-30 m-auto h-28 w-28 rounded-full border-4 border-amber-200 shadow-[0_0_32px_#fde047]"
                      />
                    )}

                    {/* Top Subtle Tech Accent Bar */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-4 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent"
                    />

                    {/* Live Animated Sprite & Elemental VFX Canvas */}
                    <div className="relative h-full w-full flex-1">
                      <LiveDigimonPanelCanvas
                        spec={spec}
                        isSelected={isSelected}
                        selectionPulseAt={selectionPulseMap[spec.id]}
                        confirmPulseAt={isSelected ? confirmPulseAt : 0}
                        animate={animationsEnabled}
                      />
                    </div>

                    {/* Chamfered Bottom Nameplate Ribbon */}
                    <div className="relative z-10 w-full px-1 pb-1.5">
                      <div
                        className={`clip-tamer-ribbon p-[1.5px] ${spec.borderGradient}`}
                      >
                        <div
                          className={`clip-tamer-ribbon flex min-h-[30px] items-center justify-center px-1 py-1 sm:min-h-[34px] ${spec.nameplateBg}`}
                        >
                          <span className="-skew-x-6 truncate font-[family-name:var(--font-display)] text-[11.5px] tracking-wider text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] xs:text-[13px] sm:text-[15px]">
                            {spec.displayName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Clean Unboxed Selected Partner Readout (Attribute · Element · Evolution Line) */}
        <div className="mb-2 flex flex-col items-center gap-0.5 px-2 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11.5px] font-bold text-sky-100 sm:text-xs">
            <span className="font-[family-name:var(--font-display)] tracking-wide text-amber-300">
              {selectedProfile.name}
            </span>
            <span aria-hidden="true" className="text-sky-400/60">
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <img
                src={attrMeta.iconPath}
                alt={attrMeta.namePt}
                className="h-3.5 w-3.5 object-contain"
              />
              {attrMeta.namePt}
            </span>
            <span aria-hidden="true" className="text-sky-400/60">
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <img
                src={elemMeta.iconPath}
                alt={elemMeta.namePt}
                className="h-3.5 w-3.5 object-contain"
              />
              {elemMeta.namePt}
            </span>
          </div>
          <p className="max-w-full truncate text-[10.5px] font-semibold text-sky-200/80 sm:text-[11px]">
            {evolutionChain.map((form) => form.name).join(' → ')}
          </p>
        </div>

        {/* 3. BIG GOLDEN PULSING CONFIRMAR BUTTON + MOBILE TOUCH GUIDE */}
        <footer className="flex flex-col items-center gap-2.5">
          {confirmError && (
            <div
              role="alert"
              className="w-full max-w-[390px] rounded-xl border border-rose-400/70 bg-rose-950/90 px-3 py-2 text-center text-xs font-bold text-rose-100 shadow-lg"
            >
              {confirmError}
            </div>
          )}

          <div className="flex w-full items-center justify-center gap-2 sm:gap-3">
            <ChevronsRight
              aria-hidden="true"
              className={`h-7 w-7 shrink-0 text-cyan-300 drop-shadow-[0_0_10px_#00e5ff] sm:h-8 sm:w-8 ${
                animationsEnabled ? 'animate-digiselect-chevron-l' : ''
              }`}
            />

            <div
              className={`clip-cyber-btn flex-1 max-w-[330px] bg-gradient-to-b from-[#fff7c2] via-[#ffb703] to-[#b54700] p-[2.5px] transition-transform duration-150 active:scale-[0.96] ${
                animationsEnabled && !isConfirming
                  ? 'animate-digiselect-gold-pulse'
                  : ''
              }`}
            >
              <button
                type="button"
                disabled={isConfirming}
                onClick={handleConfirmSelection}
                className="clip-cyber-btn relative flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2 overflow-hidden bg-gradient-to-b from-[#ffe966] via-[#ffb414] to-[#e66a00] px-6 py-2.5 text-[#081226] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait sm:min-h-[62px]"
              >
                {/* Top glossy specular highlight */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-7 top-1 h-[36%] rounded-full bg-gradient-to-b from-white/65 to-transparent"
                />
                {/* Moving golden light sheen */}
                {animationsEnabled && (
                  <span
                    aria-hidden="true"
                    className="animate-digiselect-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/55 to-transparent"
                  />
                )}

                {isConfirming ? (
                  <>
                    <Loader2
                      className="relative h-5 w-5 animate-spin text-[#081226]"
                      aria-hidden="true"
                    />
                    <span className="relative -skew-x-6 font-[family-name:var(--font-display)] text-lg tracking-wider sm:text-xl">
                      CONFIRMANDO...
                    </span>
                  </>
                ) : (
                  <span className="relative -skew-x-6 font-[family-name:var(--font-display)] text-[24px] tracking-wider text-[#081226] drop-shadow-[0_1px_0_rgba(255,255,255,0.65)] sm:text-[28px]">
                    CONFIRMAR
                  </span>
                )}
              </button>
            </div>

            <ChevronsLeft
              aria-hidden="true"
              className={`h-7 w-7 shrink-0 text-cyan-300 drop-shadow-[0_0_10px_#00e5ff] sm:h-8 sm:w-8 ${
                animationsEnabled ? 'animate-digiselect-chevron-r' : ''
              }`}
            />
          </div>

          {/* Bottom Touch Prompt Chamfered Banner */}
          <div className="clip-tamer-ribbon w-full max-w-[340px] bg-gradient-to-r from-[#0088ff] via-[#3cecff] to-[#0088ff] p-[1.5px] shadow-[0_0_18px_rgba(0,185,255,0.45)]">
            <div className="clip-tamer-ribbon flex items-center justify-center gap-2.5 bg-gradient-to-b from-[#072462] via-[#04143b] to-[#020b24] px-4 py-2 text-center">
              <Smartphone
                className="h-5 w-5 shrink-0 text-cyan-300 drop-shadow-[0_0_8px_#00e5ff]"
                aria-hidden="true"
              />
              <p className="text-[12px] font-extrabold leading-tight text-white sm:text-[13px]">
                {isConfirming ? (
                  <>
                    Iniciando aventura com{' '}
                    <span className="text-[#ffe047]">
                      {selectedSpec.displayName}!
                    </span>
                  </>
                ) : (
                  <>
                    Toque no Digimon{' '}
                    <span className="text-[#ffe047]">para selecioná-lo!</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* SPECIAL CONFIRMATION CELEBRATION OVERLAY */}
      {isConfirming && (
        <div
          role="status"
          aria-live="assertive"
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-[#02081c]/45 backdrop-blur-[2px]"
        >
          <div className="animate-dmo-window clip-tamer-card mx-4 bg-gradient-to-b from-[#fff3a1] via-[#ffb703] to-[#cc5800] p-[2px] shadow-[0_0_48px_rgba(255,196,0,0.85)]">
            <div className="clip-tamer-card flex flex-col items-center gap-1.5 bg-gradient-to-b from-[#071f54] via-[#041236] to-[#020920] px-7 py-4 text-center">
              <Sparkles
                className="h-6 w-6 text-amber-300 drop-shadow-[0_0_10px_#fde047]"
                aria-hidden="true"
              />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-cyan-300">
                Parceiro Confirmado
              </span>
              <span className="-skew-x-6 bg-gradient-to-b from-[#fff9c4] via-[#ffd426] to-[#f57c00] bg-clip-text font-[family-name:var(--font-display)] text-2xl tracking-wider text-transparent">
                {selectedSpec.displayName}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
