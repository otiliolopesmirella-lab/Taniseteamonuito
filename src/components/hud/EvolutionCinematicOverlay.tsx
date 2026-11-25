import { useCallback, useEffect, useRef, useState } from 'react';
import { FastForward, Volume2, VolumeX } from 'lucide-react';
import type { DigimonFormProfile } from '../../types/digimon';
import type { ComputedDigimonAttributes } from '../../types/hud';
import {
  createEvolutionAudioController,
  EVOLUTION_TIMELINE,
  type EvolutionAudioController,
} from '../../utils/soundFx';
import { getDigimonSkillIconUrl } from '../../utils/skillIcons';

interface EvolutionCinematicOverlayProps {
  fromForm: DigimonFormProfile;
  toForm: DigimonFormProfile;
  level: number;
  maxHp: number;
  maxDs: number;
  derivedAttrs: ComputedDigimonAttributes;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onComplete: () => void;
}

type CinematicPhase = 'intro' | 'voice' | 'buildup' | 'transform' | 'reveal';

interface DigitalVoxel {
  xFrac: number;
  yFrac: number;
  speed: number;
  size: number;
  tint: string;
  alpha: number;
  driftPhase: number;
}

interface HelixSpark {
  angle: number;
  radiusMul: number;
  heightFrac: number;
  angularSpeed: number;
  riseSpeed: number;
  size: number;
  tint: string;
  isSquare: boolean;
}

interface BurstParticle {
  angle: number;
  speed: number;
  size: number;
  drag: number;
  tint: string;
  twinklePhase: number;
  isSquare: boolean;
}

interface FlankBolt {
  side: -1 | 1;
  yStartFrac: number;
  yEndFrac: number;
  life: number;
  maxLife: number;
  seed: number;
  thick: number;
}

interface DataColumn {
  xFrac: number;
  width: number;
  heightFrac: number;
  tint: string;
  phase: number;
}

// Exact Master Timeline Constants (seconds) — synced with real MP3 audio tracks
const T_VOICE_TRIGGER = EVOLUTION_TIMELINE.VOICE_AT_SEC; // 2.0s -> "EVOLUTION!" MP3 + flash
const T_THEME_TRIGGER = EVOLUTION_TIMELINE.THEME_AT_SEC; // 10.0s -> Evolution Theme MP3 + burst
const T_MORPH_START = EVOLUTION_TIMELINE.MORPH_START_SEC; // 10.55s -> Silhouette morph begins
const T_REVEAL = EVOLUTION_TIMELINE.REVEAL_AT_SEC; // 12.6s -> Final explosion & reveal

// Reference-inspired Anime Cybernetic Palette (universal for every Digimon)
const GOLD_CORE = '#fff7cc';
const GOLD_BRIGHT = '#ffd036';
const ORANGE_FLAME = '#ff6b00';
const CRIMSON_ARC = '#ff1f44';
const CYAN_RING = '#38e8ff';
const BLUE_RING = '#2563eb';
const VIOLET_RING = '#a855f7';

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - clamp01(t), 3);
}

function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Generates an exact alpha-masked offscreen silhouette canvas from any registered
 * Digimon sprite without modifying its anatomy, wings, armor, or proportions.
 */
function buildSilhouetteCanvas(
  img: HTMLImageElement,
  fillColor: string
): HTMLCanvasElement | null {
  if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
    return null;
  }
  const off = document.createElement('canvas');
  off.width = img.naturalWidth;
  off.height = img.naturalHeight;
  const octx = off.getContext('2d');
  if (!octx) return null;
  octx.drawImage(img, 0, 0);
  octx.globalCompositeOperation = 'source-in';
  octx.fillStyle = fillColor;
  octx.fillRect(0, 0, off.width, off.height);
  return off;
}

function fitSpriteToBox(
  naturalW: number,
  naturalH: number,
  maxW: number,
  maxH: number
): { w: number; h: number } {
  if (naturalW <= 0 || naturalH <= 0) return { w: maxW, h: maxH };
  const scale = Math.min(maxW / naturalW, maxH / naturalH);
  return { w: naturalW * scale, h: naturalH * scale };
}

function drawJaggedLightning(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  jitter: number,
  seed: number,
  alpha: number,
  width: number,
  outerColor: string,
  midColor: string
) {
  if (alpha <= 0.01) return;
  const segments = 9;
  const pts: Array<{ x: number; y: number }> = [{ x: x1, y: y1 }];
  for (let i = 1; i < segments; i++) {
    const f = i / segments;
    const bx = x1 + (x2 - x1) * f;
    const by = y1 + (y2 - y1) * f;
    const n1 = Math.sin(seed * 17.3 + i * 8.17) * jitter;
    const n2 = Math.cos(seed * 11.9 + i * 13.31) * jitter;
    pts.push({ x: bx + n1, y: by + n2 });
  }
  pts.push({ x: x2, y: y2 });

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Outer fiery glow stroke
  ctx.globalAlpha = alpha * 0.42;
  ctx.strokeStyle = outerColor;
  ctx.lineWidth = width * 4.4;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  // Mid vivid crimson/amber stroke
  ctx.globalAlpha = alpha * 0.85;
  ctx.strokeStyle = midColor;
  ctx.lineWidth = width * 2.0;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  // Hot white-gold filament
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#fff9e6';
  ctx.lineWidth = Math.max(1, width * 0.85);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  ctx.restore();
}

export function EvolutionCinematicOverlay({
  fromForm,
  toForm,
  level,
  maxHp,
  maxDs,
  derivedAttrs,
  soundEnabled,
  onToggleSound,
  onComplete,
}: EvolutionCinematicOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<EvolutionAudioController | null>(null);
  const completedRef = useRef(false);
  const [phase, setPhase] = useState<CinematicPhase>('intro');
  const [voicePulseActive, setVoicePulseActive] = useState(false);

  const finishSequence = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    audioRef.current?.stop();
    onComplete();
  }, [onComplete]);

  // Start exact-timed universal audio engine (2.0s "EVOLUTION!" MP3 + 10.0s Theme MP3)
  useEffect(() => {
    const ctrl = createEvolutionAudioController(soundEnabled);
    audioRef.current = ctrl;
    ctrl.start();
    return () => {
      ctrl.stop();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    audioRef.current?.setMuted(!soundEnabled);
  }, [soundEnabled]);

  // Keyboard shortcuts: Escape skips anytime; Enter/Space continues after reveal
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        finishSequence();
      } else if (
        (e.key === 'Enter' || e.key === ' ') &&
        phase === 'reveal'
      ) {
        e.preventDefault();
        finishSequence();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [finishSequence, phase]);

  // Universal 60fps Anime Cinematic Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const isCompactViewport =
      typeof window !== 'undefined' && window.innerWidth < 640;
    const voxelCount = isCompactViewport ? 28 : 48;
    const helixCount = isCompactViewport ? 54 : 90;
    const burstCount = isCompactViewport ? 72 : 124;

    // Load original registered Digimon sprites & dynamically create silhouettes
    const fromImg = new Image();
    const toImg = new Image();
    let fromSilDark: HTMLCanvasElement | null = null;
    let fromSilGold: HTMLCanvasElement | null = null;
    let fromSilWhite: HTMLCanvasElement | null = null;
    let toSilDark: HTMLCanvasElement | null = null;
    let toSilGold: HTMLCanvasElement | null = null;
    let toSilWhite: HTMLCanvasElement | null = null;

    fromImg.onload = () => {
      fromSilDark = buildSilhouetteCanvas(fromImg, '#170604');
      fromSilGold = buildSilhouetteCanvas(fromImg, '#ffb01f');
      fromSilWhite = buildSilhouetteCanvas(fromImg, '#ffffff');
    };
    toImg.onload = () => {
      toSilDark = buildSilhouetteCanvas(toImg, '#170604');
      toSilGold = buildSilhouetteCanvas(toImg, '#ffb01f');
      toSilWhite = buildSilhouetteCanvas(toImg, '#ffffff');
    };
    fromImg.src = fromForm.portraitUrl;
    toImg.src = toForm.portraitUrl;

    // Pre-allocated digital matrix columns on far left & right flanks (reference backdrop)
    const dataColumns: DataColumn[] = Array.from({ length: 18 }, (_, i) => {
      const left = i < 9;
      const idx = i % 9;
      return {
        xFrac: left ? 0.02 + idx * 0.032 : 0.7 + idx * 0.032,
        width: 10 + (idx % 4) * 9,
        heightFrac: 0.25 + ((idx * 7) % 10) * 0.045,
        tint:
          idx % 3 === 0
            ? BLUE_RING
            : idx % 3 === 1
              ? VIOLET_RING
              : CRIMSON_ARC,
        phase: i * 1.37,
      };
    });

    // Floating digital voxel squares (cyan, blue, gold, crimson — matching reference image)
    const voxels: DigitalVoxel[] = Array.from({ length: voxelCount }, (_, i) => ({
      xFrac: Math.random(),
      yFrac: Math.random(),
      speed: 0.055 + Math.random() * 0.095,
      size: 5 + (i % 5) * 3.4,
      tint:
        i % 4 === 0
          ? CYAN_RING
          : i % 4 === 1
            ? GOLD_BRIGHT
            : i % 4 === 2
              ? '#fb7185'
              : '#3b82f6',
      alpha: 0.45 + Math.random() * 0.5,
      driftPhase: Math.random() * Math.PI * 2,
    }));

    // Ascending helix energy particles
    const helixSparks: HelixSpark[] = Array.from(
      { length: helixCount },
      (_, i) => ({
        angle: (i / helixCount) * Math.PI * 2 * 4,
        radiusMul: 0.48 + (i % 8) * 0.14,
        heightFrac: Math.random(),
        angularSpeed: 1.9 + (i % 6) * 0.42,
        riseSpeed: 0.24 + Math.random() * 0.36,
        size: 1.8 + Math.random() * 3.4,
        tint:
          i % 5 === 0
            ? CYAN_RING
            : i % 3 === 0
              ? GOLD_CORE
              : i % 2 === 0
                ? GOLD_BRIGHT
                : ORANGE_FLAME,
        isSquare: i % 4 === 0,
      })
    );

    // Explosive radial burst particles (triggered at 2.0s, 10.0s, and 12.6s)
    const burstParticles: BurstParticle[] = Array.from(
      { length: burstCount },
      (_, i) => ({
        angle: (i / burstCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.14,
        speed: 170 + Math.random() * 420,
        size: 2.2 + Math.random() * 4.6,
        drag: 1.25 + Math.random() * 0.95,
        tint:
          i % 5 === 0
            ? CYAN_RING
            : i % 4 === 0
              ? CRIMSON_ARC
              : i % 2 === 0
                ? GOLD_BRIGHT
                : GOLD_CORE,
        twinklePhase: Math.random() * Math.PI * 2,
        isSquare: i % 4 === 0,
      })
    );

    const flankBolts: FlankBolt[] = [];
    let nextBoltTimer = 0.22;
    let lastPhase: CinematicPhase = 'intro';
    let triggeredVoicePulse = false;
    let rafId = 0;
    const startPerf = performance.now();
    let lastTs = startPerf;

    function syncSize() {
      if (!canvas) return { w: 360, h: 640 };
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const tw = Math.max(1, Math.round(rect.width * dpr));
      const th = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw;
        canvas.height = th;
      }
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: rect.width, h: rect.height };
    }

    /**
     * Draws either the Floor Portal or Overhead Ceiling Cyber-Ring Array
     * with concentric blue, magenta-violet, and fiery golden segmented tracks.
     */
    function drawCyberPortalRings(
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      rx: number,
      squashY: number,
      alpha: number,
      time: number,
      spinMul: number,
      isCeiling: boolean
    ) {
      if (alpha <= 0.01) return;
      c.save();
      c.globalAlpha = alpha;
      c.translate(cx, cy);
      c.scale(1, squashY);

      // Ambient radial platform energy pool
      const pool = c.createRadialGradient(0, 0, rx * 0.08, 0, 0, rx * 1.45);
      pool.addColorStop(0, 'rgba(255, 247, 204, 0.85)');
      pool.addColorStop(0.28, 'rgba(255, 168, 28, 0.56)');
      pool.addColorStop(0.58, 'rgba(168, 85, 247, 0.28)');
      pool.addColorStop(0.82, 'rgba(37, 99, 235, 0.22)');
      pool.addColorStop(1, 'rgba(4, 2, 11, 0)');
      c.fillStyle = pool;
      c.beginPath();
      c.arc(0, 0, rx * 1.45, 0, Math.PI * 2);
      c.fill();

      // Outermost Electric Blue & Cyan Cyber Segmented Track
      c.save();
      c.rotate(time * (isCeiling ? -0.75 : 0.75) * spinMul);
      c.strokeStyle = BLUE_RING;
      c.lineWidth = 6.5;
      c.setLineDash([42, 16, 18, 12]);
      c.beginPath();
      c.arc(0, 0, rx * 1.12, 0, Math.PI * 2);
      c.stroke();

      c.strokeStyle = CYAN_RING;
      c.lineWidth = 2.6;
      c.setLineDash([28, 22, 10, 14]);
      c.beginPath();
      c.arc(0, 0, rx * 1.02, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      c.restore();

      // Violet / Magenta Mid-Band Tech Ring
      c.save();
      c.rotate(-time * 1.05 * spinMul);
      c.strokeStyle = VIOLET_RING;
      c.lineWidth = 4.2;
      c.setLineDash([24, 14, 6, 12]);
      c.beginPath();
      c.arc(0, 0, rx * 0.88, 0, Math.PI * 2);
      c.stroke();

      // Radial digital tick marks around the portal
      c.setLineDash([]);
      c.strokeStyle = 'rgba(255, 208, 54, 0.72)';
      c.lineWidth = 2;
      const ticks = 24;
      for (let i = 0; i < ticks; i++) {
        const a = (i / ticks) * Math.PI * 2;
        const rIn = rx * (i % 3 === 0 ? 0.68 : 0.74);
        const rOut = rx * 0.84;
        c.beginPath();
        c.moveTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
        c.lineTo(Math.cos(a) * rOut, Math.sin(a) * rOut);
        c.stroke();
      }
      c.restore();

      // Fiery Orange-Gold Inner Ring & Hexagonal Digital Crest
      c.save();
      c.rotate(time * 1.45 * spinMul);
      c.strokeStyle = ORANGE_FLAME;
      c.lineWidth = 4.5;
      c.beginPath();
      c.arc(0, 0, rx * 0.64, 0, Math.PI * 2);
      c.stroke();

      c.strokeStyle = GOLD_BRIGHT;
      c.lineWidth = 2.2;
      for (let p = 0; p < 2; p++) {
        c.beginPath();
        const rot = p * (Math.PI / 6);
        for (let v = 0; v <= 6; v++) {
          const a = rot + (v / 6) * Math.PI * 2;
          const px = Math.cos(a) * rx * 0.58;
          const py = Math.sin(a) * rx * 0.58;
          if (v === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.stroke();
      }
      c.restore();

      // Blazing Golden-White Core Pedestal Ring
      const pulse = 0.38 + Math.sin(time * 9) * 0.025;
      c.strokeStyle = GOLD_CORE;
      c.lineWidth = 3.2;
      c.beginPath();
      c.arc(0, 0, rx * pulse, 0, Math.PI * 2);
      c.stroke();

      c.restore();
    }

    /**
     * Draws wide 3D tilted golden-orange orbital energy spirals wrapping around
     * the levitating Digimon (split into back-pass and front-pass for genuine 3D depth).
     */
    function drawOrbitalEnergyRibbons(
      c: CanvasRenderingContext2D,
      cx: number,
      centerY: number,
      baseRx: number,
      alpha: number,
      time: number,
      spinSpeed: number,
      frontHalf: boolean
    ) {
      if (alpha <= 0.01) return;
      const ribbons = [
        { yOff: -baseRx * 0.34, rx: baseRx * 1.18, ry: baseRx * 0.28, tilt: -0.09, dir: 1, phase: 0 },
        { yOff: baseRx * 0.06, rx: baseRx * 1.05, ry: baseRx * 0.25, tilt: 0.08, dir: -1.15, phase: 2.1 },
        { yOff: baseRx * 0.42, rx: baseRx * 1.24, ry: baseRx * 0.26, tilt: -0.05, dir: 1.3, phase: 4.2 },
      ];

      c.save();
      c.lineCap = 'round';
      for (const rb of ribbons) {
        c.save();
        c.translate(cx, centerY + rb.yOff + Math.sin(time * 2.4 + rb.phase) * 6);
        c.rotate(rb.tilt);

        const startA = frontHalf ? 0 : Math.PI;
        const endA = frontHalf ? Math.PI : Math.PI * 2;
        const depthAlpha = frontHalf ? alpha : alpha * 0.58;

        // Outer molten orange glow ribbon
        c.globalAlpha = depthAlpha * 0.45;
        c.strokeStyle = ORANGE_FLAME;
        c.lineWidth = frontHalf ? 11 : 7;
        c.beginPath();
        c.ellipse(0, 0, rb.rx, rb.ry, 0, startA, endA);
        c.stroke();

        // Vivid golden energy band
        c.globalAlpha = depthAlpha * 0.92;
        c.strokeStyle = GOLD_BRIGHT;
        c.lineWidth = frontHalf ? 4.2 : 2.8;
        c.beginPath();
        c.ellipse(0, 0, rb.rx, rb.ry, 0, startA, endA);
        c.stroke();

        // Hot white-gold moving energy comets racing along the orbital ring
        const cometAngle = (time * spinSpeed * rb.dir + rb.phase) % (Math.PI * 2);
        const normAngle = cometAngle < 0 ? cometAngle + Math.PI * 2 : cometAngle;
        const isInFront = normAngle >= 0 && normAngle <= Math.PI;
        if (isInFront === frontHalf) {
          const arcSpan = 0.65;
          const a0 = Math.max(startA, normAngle - arcSpan);
          const a1 = Math.min(endA, normAngle + 0.14);
          if (a1 > a0) {
            c.globalAlpha = depthAlpha;
            c.strokeStyle = GOLD_CORE;
            c.lineWidth = frontHalf ? 5.5 : 3.4;
            c.beginPath();
            c.ellipse(0, 0, rb.rx, rb.ry, 0, a0, a1);
            c.stroke();
          }
          const hx = Math.cos(normAngle) * rb.rx;
          const hy = Math.sin(normAngle) * rb.ry;
          const headGlow = c.createRadialGradient(hx, hy, 1, hx, hy, 18);
          headGlow.addColorStop(0, `rgba(255, 255, 255, ${depthAlpha})`);
          headGlow.addColorStop(0.5, `rgba(255, 208, 54, ${depthAlpha * 0.7})`);
          headGlow.addColorStop(1, 'rgba(255, 107, 0, 0)');
          c.fillStyle = headGlow;
          c.beginPath();
          c.arc(hx, hy, 18, 0, Math.PI * 2);
          c.fill();
        }

        c.restore();
      }
      c.restore();
    }

    function drawHelixSparks(
      c: CanvasRenderingContext2D,
      cx: number,
      footY: number,
      radius: number,
      height: number,
      intensity: number,
      time: number,
      frontHalf: boolean
    ) {
      if (intensity <= 0.01) return;
      c.save();
      for (const sp of helixSparks) {
        const theta = sp.angle + time * sp.angularSpeed * (0.85 + intensity * 1.1);
        const sinT = Math.sin(theta);
        if (frontHalf ? sinT < 0 : sinT >= 0) continue;

        const cycle =
          (sp.heightFrac + time * sp.riseSpeed * (0.75 + intensity * 0.95)) % 1;
        const cone = 1.05 - cycle * 0.34;
        const rx = radius * sp.radiusMul * cone;
        const px = cx + Math.cos(theta) * rx;
        const py = footY - cycle * height + sinT * rx * 0.2;
        const alpha = Math.sin(cycle * Math.PI) * intensity * (frontHalf ? 0.95 : 0.45);
        if (alpha <= 0.02) continue;

        c.globalAlpha = alpha;
        c.fillStyle = sp.tint;
        if (sp.isSquare) {
          const s = sp.size * 1.5;
          c.fillRect(px - s / 2, py - s / 2, s, s);
        } else {
          c.beginPath();
          c.arc(px, py, sp.size, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();
    }

    function loop(now: number) {
      const dt = Math.max(0, Math.min(0.05, (now - lastTs) / 1000));
      lastTs = now;
      // Lock visual timeline strictly to real elapsed wall time so 2.0s & 10.0s match audio to the millisecond
      const t = Math.max(0, (now - startPerf) / 1000);

      const nextPhase: CinematicPhase =
        t < T_VOICE_TRIGGER
          ? 'intro'
          : t < 3.6
            ? 'voice'
            : t < T_THEME_TRIGGER
              ? 'buildup'
              : t < T_REVEAL
                ? 'transform'
                : 'reveal';
      if (nextPhase !== lastPhase) {
        lastPhase = nextPhase;
        setPhase(nextPhase);
      }

      if (!triggeredVoicePulse && t >= T_VOICE_TRIGGER) {
        triggeredVoicePulse = true;
        setVoicePulseActive(true);
      }

      const { w: viewW, h: viewH } = syncSize();
      const minDim = Math.min(viewW, viewH);
      const cx = viewW / 2;

      const introProg = clamp01(t / T_VOICE_TRIGGER);
      const buildupProg = clamp01(
        (t - T_VOICE_TRIGGER) / (T_THEME_TRIGGER - T_VOICE_TRIGGER)
      );
      const transformProg = clamp01(
        (t - T_THEME_TRIGGER) / (T_REVEAL - T_THEME_TRIGGER)
      );
      const morphProg = clamp01(
        (t - T_MORPH_START) / (T_REVEAL - T_MORPH_START)
      );
      const revealElapsed = Math.max(0, t - T_REVEAL);
      const revealProg = clamp01(revealElapsed / 0.85);
      const revealLiftEase = easeOutCubic(clamp01(revealElapsed / 0.55));

      const baseFloorY =
        viewH < 560 ? viewH * 0.72 : viewH < 720 ? viewH * 0.70 : viewH * 0.68;
      // During final reveal, smoothly elevate the floor portal so the evolved Digimon stands
      // completely above the bottom "DIGIEVOLUÇÃO COMPLETA!" presentation panel on every screen.
      const revealFloorY =
        viewH < 600 ? viewH * 0.54 : viewH < 780 ? viewH * 0.56 : viewH * 0.58;
      const floorY =
        t < T_REVEAL
          ? baseFloorY
          : baseFloorY + (revealFloorY - baseFloorY) * revealLiftEase;
      const ceilingY = Math.max(18, viewH * 0.055);

      // Camera shake synced to: 2.0s "EVOLUTION!" flash, late 2-10s crescendo, 10.0s theme drop, 12.6s final reveal
      let shakeMag = 0;
      if (!prefersReducedMotion) {
        if (t >= T_VOICE_TRIGGER && t < T_VOICE_TRIGGER + 0.65) {
          shakeMag = (1 - (t - T_VOICE_TRIGGER) / 0.65) * 9.5;
        } else if (t >= 4.0 && t < T_THEME_TRIGGER) {
          shakeMag = Math.pow((t - 4.0) / 6.0, 2.2) * 6.5;
        } else if (t >= T_THEME_TRIGGER && t < T_THEME_TRIGGER + 0.8) {
          shakeMag = (1 - (t - T_THEME_TRIGGER) / 0.8) * 13.5;
        } else if (t >= T_MORPH_START && t < T_REVEAL) {
          shakeMag = 3.2 + Math.sin(morphProg * Math.PI) * 4.5;
        } else if (t >= T_REVEAL && revealElapsed < 0.6) {
          shakeMag = (1 - revealElapsed / 0.6) * 10.5;
        }
      }
      const shakeX =
        shakeMag > 0.1
          ? (Math.sin(t * 82) + Math.cos(t * 59)) * shakeMag * 0.5
          : 0;
      const shakeY =
        shakeMag > 0.1
          ? (Math.cos(t * 71) - Math.sin(t * 47)) * shakeMag * 0.5
          : 0;

      ctx!.clearRect(0, 0, viewW, viewH);

      // 1. Deep Anime Cyber-Space Backdrop (smoothly darkens 0 -> 1.4s over live gameplay)
      const bgFade = easeOutCubic(clamp01(t / 1.4));
      const bgGrad = ctx!.createRadialGradient(
        cx,
        floorY - minDim * 0.22,
        minDim * 0.04,
        cx,
        floorY - minDim * 0.14,
        Math.max(viewW, viewH) * 0.82
      );
      bgGrad.addColorStop(0, `rgba(120, 28, 12, ${bgFade * 0.86})`);
      bgGrad.addColorStop(0.38, `rgba(38, 8, 42, ${bgFade * 0.94})`);
      bgGrad.addColorStop(0.72, `rgba(10, 6, 30, ${bgFade * 0.97})`);
      bgGrad.addColorStop(1, `rgba(3, 2, 10, ${Math.min(0.98, bgFade * 0.99)})`);
      ctx!.fillStyle = bgGrad;
      ctx!.fillRect(0, 0, viewW, viewH);

      // Crimson energy clouds pulsing on left & right edges (iconic reference atmosphere)
      const flankGlowAlpha =
        bgFade *
        (t < T_VOICE_TRIGGER
          ? 0.22 + introProg * 0.18
          : t < T_THEME_TRIGGER
            ? 0.4 + buildupProg * 0.35
            : 0.58 + Math.sin(t * 3.5) * 0.08);
      for (const side of [-1, 1] as const) {
        const gx = side < 0 ? viewW * 0.06 : viewW * 0.94;
        const gy = viewH * 0.48;
        const fg = ctx!.createRadialGradient(gx, gy, 10, gx, gy, viewW * 0.44);
        fg.addColorStop(0, `rgba(255, 31, 68, ${flankGlowAlpha * 0.55})`);
        fg.addColorStop(0.45, `rgba(190, 24, 93, ${flankGlowAlpha * 0.24})`);
        fg.addColorStop(1, 'rgba(4, 2, 11, 0)');
        ctx!.fillStyle = fg;
        ctx!.fillRect(0, 0, viewW, viewH);
      }

      // Faint Digital Matrix Towers on far left & right edges
      if (bgFade > 0.15) {
        ctx!.save();
        for (const col of dataColumns) {
          const x = col.xFrac * viewW;
          const h = col.heightFrac * viewH;
          const y = floorY - h + Math.sin(t * 1.4 + col.phase) * 8;
          const colGrad = ctx!.createLinearGradient(x, y, x, floorY);
          colGrad.addColorStop(0, 'rgba(0,0,0,0)');
          colGrad.addColorStop(0.45, col.tint);
          colGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx!.globalAlpha = bgFade * (0.12 + buildupProg * 0.12);
          ctx!.fillStyle = colGrad;
          ctx!.fillRect(x, y, col.width, h);
        }
        ctx!.restore();
      }

      ctx!.save();
      ctx!.translate(shakeX, shakeY);

      // Normalized stage proportions (looks dramatic on both phones & 1440p desktop)
      const portalRx = Math.max(120, Math.min(270, viewW * 0.33, viewH * 0.38));
      const spriteBoxSize = Math.max(150, Math.min(285, minDim * 0.4));
      const spinMul =
        t < T_VOICE_TRIGGER
          ? 0.7 + introProg * 0.5
          : t < T_THEME_TRIGGER
            ? 1.2 + buildupProg * 2.2
            : t < T_REVEAL
              ? 3.8
              : 1.55;

      // 2. Blazing Vertical Golden-White Core Pillar (shooting from Ceiling Portal to Floor Portal)
      const beamHalfW =
        t < T_VOICE_TRIGGER
          ? portalRx * (0.16 + easeInOutCubic(introProg) * 0.32)
          : t < T_THEME_TRIGGER
            ? portalRx * (0.48 + easeInOutCubic(buildupProg) * 0.38)
            : t < T_REVEAL
              ? portalRx * (0.86 + Math.sin(transformProg * Math.PI) * 0.65)
              : portalRx * (0.58 + Math.sin(t * 2.8) * 0.04);

      const beamAlpha =
        t < 0.5
          ? (t / 0.5) * 0.65
          : t < T_VOICE_TRIGGER
            ? 0.65 + introProg * 0.25
            : t < T_REVEAL
              ? 0.92
              : Math.max(0.55, 0.9 - revealProg * 0.32);

      const pillarGrad = ctx!.createLinearGradient(
        cx - beamHalfW,
        0,
        cx + beamHalfW,
        0
      );
      pillarGrad.addColorStop(0, 'rgba(255, 107, 0, 0)');
      pillarGrad.addColorStop(0.22, `rgba(255, 138, 0, ${beamAlpha * 0.38})`);
      pillarGrad.addColorStop(0.42, `rgba(255, 224, 90, ${beamAlpha * 0.76})`);
      pillarGrad.addColorStop(0.5, `rgba(255, 253, 232, ${beamAlpha * 0.98})`);
      pillarGrad.addColorStop(0.58, `rgba(255, 224, 90, ${beamAlpha * 0.76})`);
      pillarGrad.addColorStop(0.78, `rgba(255, 138, 0, ${beamAlpha * 0.38})`);
      pillarGrad.addColorStop(1, 'rgba(255, 107, 0, 0)');
      ctx!.fillStyle = pillarGrad;
      ctx!.fillRect(cx - beamHalfW, 0, beamHalfW * 2, floorY + portalRx * 0.28);

      // Volumetric Rotating God-Rays behind the centerpiece (intensify 6s -> Reveal)
      const rayCenterY = floorY - spriteBoxSize * 0.62;
      const rayAlpha =
        t < T_VOICE_TRIGGER
          ? 0.12 * introProg
          : t < T_THEME_TRIGGER
            ? 0.16 + Math.pow(buildupProg, 1.5) * 0.44
            : t < T_REVEAL
              ? 0.72
              : 0.42 + Math.sin(t * 2.4) * 0.07;

      if (rayAlpha > 0.02) {
        ctx!.save();
        ctx!.translate(cx, rayCenterY);
        ctx!.rotate(t * (t >= T_THEME_TRIGGER && t < T_REVEAL ? 0.55 : 0.22));
        const rayCount = 16;
        const maxRayLen = Math.max(viewW, viewH) * 0.78;
        for (let r = 0; r < rayCount; r++) {
          const a0 = (r / rayCount) * Math.PI * 2;
          const spread = (Math.PI / rayCount) * (r % 2 === 0 ? 0.52 : 0.24);
          const rg = ctx!.createRadialGradient(0, 0, 14, 0, 0, maxRayLen);
          rg.addColorStop(
            0,
            r % 2 === 0
              ? `rgba(255, 230, 110, ${rayAlpha * 0.62})`
              : `rgba(255, 107, 0, ${rayAlpha * 0.44})`
          );
          rg.addColorStop(0.55, `rgba(255, 68, 34, ${rayAlpha * 0.15})`);
          rg.addColorStop(1, 'rgba(4, 2, 11, 0)');
          ctx!.fillStyle = rg;
          ctx!.beginPath();
          ctx!.moveTo(0, 0);
          ctx!.arc(0, 0, maxRayLen, a0 - spread, a0 + spread);
          ctx!.closePath();
          ctx!.fill();
        }
        ctx!.restore();
      }

      // 3. Overhead Ceiling Cyber-Ring Portal + Luminous Floor Portal
      const portalScale =
        t < 0.85 ? easeOutCubic(t / 0.85) : 1 + Math.sin(t * 3.6) * 0.018;
      const portalAlpha = t < 0.45 ? t / 0.45 : 0.96;

      drawCyberPortalRings(
        ctx!,
        cx,
        ceilingY,
        portalRx * 0.92 * portalScale,
        0.38,
        portalAlpha * 0.9,
        t,
        spinMul,
        true
      );
      drawCyberPortalRings(
        ctx!,
        cx,
        floorY,
        portalRx * 1.15 * portalScale,
        0.25,
        portalAlpha,
        t,
        spinMul,
        false
      );

      // 4. Floating Digital Voxel Squares across the chamber
      ctx!.save();
      for (const v of voxels) {
        const yNorm = (v.yFrac - t * v.speed * (0.7 + buildupProg * 0.85)) % 1;
        const py = (yNorm < 0 ? yNorm + 1 : yNorm) * viewH;
        const px = v.xFrac * viewW + Math.sin(t * 1.8 + v.driftPhase) * 14;
        const fade = Math.sin(((py / viewH) * Math.PI)) * bgFade * v.alpha;
        if (fade <= 0.02) continue;

        ctx!.globalAlpha = fade * 0.35;
        ctx!.fillStyle = v.tint;
        ctx!.fillRect(px - v.size * 0.9, py - v.size * 0.9, v.size * 1.8, v.size * 1.8);

        ctx!.globalAlpha = fade;
        ctx!.fillStyle = v.tint;
        ctx!.fillRect(px - v.size / 2, py - v.size / 2, v.size, v.size);
      }
      ctx!.restore();

      // 5. Compute Digimon Levitation & Safe Reveal Framing (never hidden behind bottom card!)
      const floatLift =
        t < T_VOICE_TRIGGER
          ? easeOutCubic(introProg) * 10
          : t < T_THEME_TRIGGER
            ? 10 + easeInOutCubic(buildupProg) * 52 + Math.sin(t * 4.5) * 4
            : t < T_REVEAL
              ? 62 + Math.sin(t * 9) * 5
              : 40 + Math.sin(t * 2.6) * 6;
      const rawCenterY = floorY - spriteBoxSize * 0.52 - floatLift;
      // Guarantee the evolved Digimon stays centered in the clear upper-middle showcase zone
      const revealSafeCenterY = Math.max(
        spriteBoxSize * 0.56 + 48,
        Math.min(rawCenterY, viewH < 640 ? viewH * 0.34 : viewH * 0.36)
      );
      const spriteCenterY =
        t < T_REVEAL
          ? rawCenterY
          : rawCenterY + (revealSafeCenterY - rawCenterY) * revealLiftEase;

      // 6. Back half of 3D Orbital Golden Energy Ribbons & Rising Helix Sparks
      const ribbonAlpha =
        t < T_VOICE_TRIGGER
          ? clamp01((t - 0.8) / 1.2) * 0.45
          : t < T_THEME_TRIGGER
            ? 0.45 + easeOutCubic(buildupProg) * 0.55
            : t < T_REVEAL
              ? 1.0
              : 0.72;
      const ribbonSpin =
        t < T_VOICE_TRIGGER ? 1.8 : t < T_THEME_TRIGGER ? 2.4 + buildupProg * 3.6 : 4.2;

      drawOrbitalEnergyRibbons(
        ctx!,
        cx,
        spriteCenterY,
        portalRx * 0.86,
        ribbonAlpha,
        t,
        ribbonSpin,
        false
      );
      drawHelixSparks(
        ctx!,
        cx,
        floorY + 6,
        portalRx * 0.85,
        spriteBoxSize * 1.55,
        Math.max(0.35, ribbonAlpha),
        t,
        false
      );

      // 7. Blazing Backlight Halo immediately behind the Digimon centerpiece
      const haloR =
        spriteBoxSize *
        (t < T_VOICE_TRIGGER
          ? 0.58 + introProg * 0.25
          : t < T_THEME_TRIGGER
            ? 0.83 + buildupProg * 0.42
            : t < T_REVEAL
              ? 1.28 + Math.sin(transformProg * Math.PI) * 0.35
              : 0.94 + Math.sin(t * 3.0) * 0.06);
      const haloGrad = ctx!.createRadialGradient(
        cx,
        spriteCenterY,
        spriteBoxSize * 0.08,
        cx,
        spriteCenterY,
        haloR
      );
      haloGrad.addColorStop(0, 'rgba(255, 255, 240, 0.92)');
      haloGrad.addColorStop(0.34, 'rgba(255, 208, 54, 0.62)');
      haloGrad.addColorStop(0.68, 'rgba(255, 92, 0, 0.25)');
      haloGrad.addColorStop(1, 'rgba(255, 31, 68, 0)');
      ctx!.fillStyle = haloGrad;
      ctx!.beginPath();
      ctx!.arc(cx, spriteCenterY, haloR, 0, Math.PI * 2);
      ctx!.fill();

      // Helper to draw ANY authentic registered Digimon sprite + backlit silhouette + fiery golden rim
      const drawUniversalDigimon = (
        img: HTMLImageElement,
        silDark: HTMLCanvasElement | null,
        silGold: HTMLCanvasElement | null,
        silWhite: HTMLCanvasElement | null,
        opts: {
          scale: number;
          baseAlpha: number;
          darkSilhouetteAlpha: number;
          whiteSilhouetteAlpha: number;
          goldRimAlpha: number;
        }
      ) => {
        if (!img.complete || img.naturalWidth === 0) return;
        const fitted = fitSpriteToBox(
          img.naturalWidth,
          img.naturalHeight,
          spriteBoxSize * opts.scale,
          spriteBoxSize * opts.scale
        );
        const dx = cx - fitted.w / 2;
        const dy = spriteCenterY - fitted.h / 2;

        ctx!.save();
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'high';

        // Expanded fiery golden rim glow behind exact character contour
        if (silGold && opts.goldRimAlpha > 0.02) {
          ctx!.save();
          ctx!.globalAlpha = opts.goldRimAlpha;
          ctx!.filter = 'blur(9px)';
          const expand = 1.075;
          ctx!.drawImage(
            silGold,
            cx - (fitted.w * expand) / 2,
            spriteCenterY - (fitted.h * expand) / 2,
            fitted.w * expand,
            fitted.h * expand
          );
          ctx!.restore();
        }

        // Authentic original full-color Digimon sprite
        if (opts.baseAlpha > 0.01) {
          ctx!.globalAlpha = opts.baseAlpha;
          ctx!.drawImage(img, dx, dy, fitted.w, fitted.h);
        }

        // Dramatic backlit dark silhouette (exact reference-image heroic silhouette look)
        if (silDark && opts.darkSilhouetteAlpha > 0.01) {
          ctx!.globalAlpha = opts.darkSilhouetteAlpha;
          ctx!.drawImage(silDark, dx, dy, fitted.w, fitted.h);
        }

        // Blinding radiant white silhouette for energy flash & morph
        if (silWhite && opts.whiteSilhouetteAlpha > 0.01) {
          ctx!.globalAlpha = opts.whiteSilhouetteAlpha;
          ctx!.drawImage(silWhite, dx, dy, fitted.w, fitted.h);
        }

        ctx!.restore();
      };

      // Render Digimon according to exact cinematic phase
      if (t < T_VOICE_TRIGGER) {
        // 0.0s - 2.0s: Authentic original sprite charges inside rising golden beam
        drawUniversalDigimon(fromImg, fromSilDark, fromSilGold, fromSilWhite, {
          scale: 0.88 + introProg * 0.06,
          baseAlpha: 1,
          darkSilhouetteAlpha: introProg * 0.25,
          whiteSilhouetteAlpha: Math.pow(introProg, 3) * 0.32,
          goldRimAlpha: 0.35 + introProg * 0.55,
        });
      } else if (t < T_THEME_TRIGGER) {
        // 2.0s - 10.0s: Voice flash -> intensifies -> levitates -> prepares heroic backlit silhouette!
        const voiceFlashDecay = clamp01(1 - (t - T_VOICE_TRIGGER) / 0.85);
        const silhouettePrep = clamp01((t - 4.2) / 3.8);
        const preBurstWhite = clamp01((t - 8.7) / 1.3);
        const pulse = 1 + Math.sin(t * (6 + buildupProg * 12)) * (0.012 + buildupProg * 0.025);

        drawUniversalDigimon(fromImg, fromSilDark, fromSilGold, fromSilWhite, {
          scale: (0.94 + buildupProg * 0.1) * pulse,
          baseAlpha: Math.max(0.12, 1 - silhouettePrep * 0.88),
          darkSilhouetteAlpha: silhouettePrep * (1 - preBurstWhite * 0.85),
          whiteSilhouetteAlpha: Math.max(
            voiceFlashDecay * 0.78,
            Math.pow(preBurstWhite, 1.5) * 0.96
          ),
          goldRimAlpha: 0.78 + buildupProg * 0.22,
        });
      } else if (t < T_MORPH_START) {
        // 10.0s - 10.55s: Explosive Theme Drop — engulfed in pure blinding light silhouette!
        const dropProg = clamp01((t - T_THEME_TRIGGER) / (T_MORPH_START - T_THEME_TRIGGER));
        drawUniversalDigimon(fromImg, fromSilDark, fromSilGold, fromSilWhite, {
          scale: 1.04 + dropProg * 0.14,
          baseAlpha: 0,
          darkSilhouetteAlpha: 0,
          whiteSilhouetteAlpha: 1,
          goldRimAlpha: 1,
        });
      } else if (t < T_REVEAL) {
        // 10.55s - 12.6s: Smooth Universal Silhouette Morph (fromForm -> toForm)
        const morphEase = easeInOutCubic(morphProg);
        const fromOut = clamp01(1 - morphEase * 1.48);
        const toIn = clamp01((morphEase - 0.16) / 0.66);
        const backlitHold = clamp01((morphProg - 0.48) / 0.32);
        const colorBreakthrough = clamp01((morphProg - 0.76) / 0.24);

        if (fromOut > 0.01) {
          drawUniversalDigimon(fromImg, fromSilDark, fromSilGold, fromSilWhite, {
            scale: 1.15 + morphEase * 0.16,
            baseAlpha: 0,
            darkSilhouetteAlpha: 0,
            whiteSilhouetteAlpha: fromOut,
            goldRimAlpha: fromOut,
          });
        }
        if (toIn > 0.01) {
          drawUniversalDigimon(toImg, toSilDark, toSilGold, toSilWhite, {
            scale: 0.82 + easeOutCubic(toIn) * 0.3,
            baseAlpha: colorBreakthrough,
            darkSilhouetteAlpha:
              toIn * backlitHold * 0.85 * (1 - colorBreakthrough),
            whiteSilhouetteAlpha:
              toIn * (1 - backlitHold * 0.65) * (1 - colorBreakthrough * 0.9),
            goldRimAlpha: toIn * 0.98,
          });
        }
      } else {
        // 12.6s+: Triumphant Full-Color Reveal of Evolved Digimon!
        const popScale =
          revealElapsed < 0.42
            ? 1.12 + Math.sin((revealElapsed / 0.42) * Math.PI) * 0.09
            : 1.12 + Math.sin(t * 2.5) * 0.018;
        const residualWhite = Math.max(0, 1 - revealElapsed / 0.65) * 0.42;
        drawUniversalDigimon(toImg, toSilDark, toSilGold, toSilWhite, {
          scale: popScale,
          baseAlpha: 1,
          darkSilhouetteAlpha: 0,
          whiteSilhouetteAlpha: residualWhite,
          goldRimAlpha: 0.42 + Math.sin(t * 3.2) * 0.12,
        });
      }

      // 8. Front half of 3D Orbital Golden Energy Ribbons & Rising Helix Sparks (wraps in front of Digimon!)
      drawOrbitalEnergyRibbons(
        ctx!,
        cx,
        spriteCenterY,
        portalRx * 0.86,
        ribbonAlpha,
        t,
        ribbonSpin,
        true
      );
      drawHelixSparks(
        ctx!,
        cx,
        floorY + 6,
        portalRx * 0.85,
        spriteBoxSize * 1.55,
        Math.max(0.35, ribbonAlpha),
        t,
        true
      );

      // 9. Dramatic Crimson-Orange Flank Lightning Bolts (matching reference image edges)
      const boltIntensity =
        t < T_VOICE_TRIGGER
          ? 0.45 + introProg * 0.45
          : t < T_THEME_TRIGGER
            ? 0.85 + buildupProg * 0.75
            : t < T_REVEAL
              ? 1.5
              : 0.65;
      nextBoltTimer -= dt;
      const boltCadence = Math.max(0.06, 0.24 / boltIntensity);
      if (nextBoltTimer <= 0 && flankBolts.length < 10) {
        nextBoltTimer = boltCadence;
        const side: -1 | 1 = Math.random() > 0.5 ? 1 : -1;
        flankBolts.push({
          side,
          yStartFrac: 0.14 + Math.random() * 0.58,
          yEndFrac: 0.26 + Math.random() * 0.44,
          life: 0,
          maxLife: 0.16 + Math.random() * 0.18,
          seed: Math.random() * 100,
          thick: 1.5 + Math.random() * 1.4,
        });
      }

      for (let i = flankBolts.length - 1; i >= 0; i--) {
        const b = flankBolts[i];
        b.life += dt;
        if (b.life >= b.maxLife) {
          flankBolts.splice(i, 1);
          continue;
        }
        const fade = 1 - b.life / b.maxLife;
        const xStart = b.side < 0 ? 0 : viewW;
        const xEnd = cx + b.side * (portalRx * (0.35 + Math.sin(b.seed) * 0.2));
        drawJaggedLightning(
          ctx!,
          xStart,
          b.yStartFrac * viewH,
          xEnd,
          b.yEndFrac * viewH,
          22,
          b.seed + t * 2.5,
          fade * 0.92,
          b.thick,
          CRIMSON_ARC,
          '#ff6b35'
        );
      }

      // 10. Shockwave Rings (2.0s Voice Flash, periodic buildup waves, 10.0s Theme Explosion, 12.6s Final Reveal)
      const drawShockwaveRing = (
        elapsed: number,
        duration: number,
        maxR: number,
        thickness: number
      ) => {
        if (elapsed < 0 || elapsed > duration) return;
        const p = elapsed / duration;
        const r = easeOutCubic(p) * maxR;
        const a = Math.pow(1 - p, 1.55);
        ctx!.save();
        ctx!.globalAlpha = a * 0.58;
        ctx!.strokeStyle = ORANGE_FLAME;
        ctx!.lineWidth = thickness * 1.9;
        ctx!.beginPath();
        ctx!.arc(cx, spriteCenterY, r * 1.03, 0, Math.PI * 2);
        ctx!.stroke();

        ctx!.globalAlpha = a * 0.92;
        ctx!.strokeStyle = GOLD_BRIGHT;
        ctx!.lineWidth = thickness;
        ctx!.beginPath();
        ctx!.arc(cx, spriteCenterY, r, 0, Math.PI * 2);
        ctx!.stroke();

        ctx!.globalAlpha = a * 0.72;
        ctx!.strokeStyle = CYAN_RING;
        ctx!.lineWidth = Math.max(1.4, thickness * 0.4);
        ctx!.beginPath();
        ctx!.arc(cx, spriteCenterY, r * 0.95, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.restore();
      };

      const maxDiag = Math.max(viewW, viewH) * 0.76;
      // 2.0s "EVOLUTION!" synchronized shockwave
      drawShockwaveRing(t - T_VOICE_TRIGGER, 1.15, maxDiag, 12);
      // Periodic buildup shockwaves (2s - 10s)
      for (const waveT of [4.4, 6.2, 7.8, 9.1]) {
        drawShockwaveRing(t - waveT, 1.0, maxDiag * 0.85, 8);
      }
      // 10.0s Theme Music Drop twin shockwaves
      drawShockwaveRing(t - T_THEME_TRIGGER, 1.25, maxDiag * 1.08, 15);
      drawShockwaveRing(t - (T_THEME_TRIGGER + 0.16), 1.1, maxDiag * 0.88, 9);
      // 12.6s Final Form Reveal grand shockwave
      drawShockwaveRing(revealElapsed, 1.35, maxDiag * 1.12, 14);
      drawShockwaveRing(revealElapsed - 0.18, 1.1, maxDiag * 0.85, 8);

      // 11. Explosive Radial Burst Particles (at 2.0s, 10.0s, and 12.6s)
      const drawBurst = (elapsed: number, duration: number, powerMul: number) => {
        if (elapsed < 0 || elapsed > duration) return;
        const p = elapsed / duration;
        ctx!.save();
        for (const bp of burstParticles) {
          const travel =
            ((bp.speed * powerMul) * (1 - Math.exp(-bp.drag * elapsed))) / bp.drag;
          const px = cx + Math.cos(bp.angle) * travel;
          const py = spriteCenterY + Math.sin(bp.angle) * travel;
          const twinkle = 0.65 + Math.sin(elapsed * 18 + bp.twinklePhase) * 0.35;
          const a = (1 - p) * twinkle;
          if (a <= 0.02) continue;

          ctx!.globalAlpha = a;
          ctx!.fillStyle = bp.tint;
          const sz = bp.size * (1 - p * 0.42);
          if (bp.isSquare) {
            ctx!.fillRect(px - sz / 2, py - sz / 2, sz, sz);
          } else {
            ctx!.beginPath();
            ctx!.arc(px, py, sz, 0, Math.PI * 2);
            ctx!.fill();
          }
        }
        ctx!.restore();
      };

      drawBurst(t - T_VOICE_TRIGGER, 1.25, 0.78);
      drawBurst(t - T_THEME_TRIGGER, 1.55, 1.08);
      drawBurst(revealElapsed, 2.05, 1.18);

      ctx!.restore(); // End camera shake

      // 12. Fullscreen Cinematic Light Flashes (Exact 2.0s Voice Flash, 10.0s Theme Burst, 12.6s Grand Reveal)
      let flashAlpha = 0;
      const flashCap = prefersReducedMotion ? 0.46 : 0.92;

      if (t >= T_VOICE_TRIGGER - 0.05 && t <= T_VOICE_TRIGGER + 0.72) {
        const ft = (t - (T_VOICE_TRIGGER - 0.05)) / 0.77;
        flashAlpha =
          ft < 0.14
            ? (ft / 0.14) * flashCap * 0.86
            : Math.pow(1 - (ft - 0.14) / 0.86, 1.7) * flashCap * 0.86;
      } else if (t >= T_THEME_TRIGGER - 0.06 && t <= T_THEME_TRIGGER + 0.85) {
        const ft = (t - (T_THEME_TRIGGER - 0.06)) / 0.91;
        flashAlpha =
          ft < 0.16
            ? (ft / 0.16) * flashCap
            : Math.pow(1 - (ft - 0.16) / 0.84, 1.55) * flashCap;
      } else if (t >= T_REVEAL - 0.06 && revealElapsed < 0.85) {
        const ft = (t - (T_REVEAL - 0.06)) / 0.91;
        flashAlpha =
          ft < 0.15
            ? (ft / 0.15) * flashCap
            : Math.pow(1 - (ft - 0.15) / 0.85, 1.65) * flashCap;
      }

      if (flashAlpha > 0.01) {
        const fg = ctx!.createRadialGradient(
          cx,
          spriteCenterY,
          24,
          cx,
          spriteCenterY,
          Math.max(viewW, viewH) * 0.9
        );
        fg.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
        fg.addColorStop(0.5, `rgba(255, 224, 115, ${flashAlpha * 0.86})`);
        fg.addColorStop(1, `rgba(255, 107, 0, ${flashAlpha * 0.48})`);
        ctx!.fillStyle = fg;
        ctx!.fillRect(0, 0, viewW, viewH);
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [fromForm.portraitUrl, toForm.portraitUrl]);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={`Digievolução: ${fromForm.name} para ${toForm.name}`}
      className="fixed inset-0 z-[75] overflow-hidden bg-[#04020b] select-none"
    >
      {/* Fullscreen Universal Anime Cinematic Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* Fiery Hexagonal Honeycomb Bottom Corner Frames (reference visual signature) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 260 150"
        className="pointer-events-none absolute bottom-0 left-0 z-10 h-24 w-40 opacity-90 sm:h-36 sm:w-64"
      >
        <defs>
          <linearGradient id="evoHexL" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff3b00" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#ffb703" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffd166" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g fill="rgba(255,80,0,0.12)" stroke="url(#evoHexL)" strokeWidth="2.2">
          <polygon points="22,126 36,118 50,126 50,142 36,150 22,142" />
          <polygon points="52,126 66,118 80,126 80,142 66,150 52,142" />
          <polygon points="82,126 96,118 110,126 110,142 96,150 82,142" />
          <polygon points="7,100 21,92 35,100 35,116 21,124 7,116" />
          <polygon points="37,100 51,92 65,100 65,116 51,124 37,116" />
          <polygon points="67,100 81,92 95,100 95,116 81,124 67,116" />
          <polygon points="22,74 36,66 50,74 50,90 36,98 22,90" />
        </g>
        <polyline
          points="0,68 42,68 88,136 260,136"
          fill="none"
          stroke="#ffb703"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      <svg
        aria-hidden="true"
        viewBox="0 0 260 150"
        className="pointer-events-none absolute bottom-0 right-0 z-10 h-24 w-40 -scale-x-100 opacity-90 sm:h-36 sm:w-64"
      >
        <defs>
          <linearGradient id="evoHexR" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff3b00" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#ffb703" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffd166" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g fill="rgba(255,80,0,0.12)" stroke="url(#evoHexR)" strokeWidth="2.2">
          <polygon points="22,126 36,118 50,126 50,142 36,150 22,142" />
          <polygon points="52,126 66,118 80,126 80,142 66,150 52,142" />
          <polygon points="82,126 96,118 110,126 110,142 96,150 82,142" />
          <polygon points="7,100 21,92 35,100 35,116 21,124 7,116" />
          <polygon points="37,100 51,92 65,100 65,116 51,124 37,116" />
          <polygon points="67,100 81,92 95,100 95,116 81,124 67,116" />
          <polygon points="22,74 36,66 50,74 50,90 36,98 22,90" />
        </g>
        <polyline
          points="0,68 42,68 88,136 260,136"
          fill="none"
          stroke="#ffb703"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {/* Top Overlay Bar: Iconic Angular "EVOLUTION" Emblem (left) + Sound & Skip Controls (right) */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-3 pt-3 sm:px-6 sm:pt-5">
        {/* Top-Left Angular "EVOLUTION" Badge matching Reference Image */}
        <div
          className={`relative transition-all duration-300 ${
            voicePulseActive ? 'scale-105 brightness-125' : 'scale-100'
          }`}
        >
          <div
            style={{
              clipPath:
                'polygon(14px 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0% 50%)',
            }}
            className="bg-gradient-to-r from-[#ff3d00] via-[#ffd036] to-[#ff3d00] p-[2px] shadow-[0_0_24px_rgba(255,145,0,0.85)]"
          >
            <div
              style={{
                clipPath:
                  'polygon(13px 0%, calc(100% - 13px) 0%, 100% 50%, calc(100% - 13px) 100%, 13px 100%, 0% 50%)',
              }}
              className="bg-gradient-to-b from-[#3d0e06]/95 via-[#1c0506]/95 to-[#2b0905]/95 px-5 py-1.5 sm:px-7 sm:py-2"
            >
              <span className="font-display text-sm font-black italic tracking-[0.2em] text-transparent bg-gradient-to-b from-[#fffce0] via-[#ffd147] to-[#ff8c00] bg-clip-text drop-shadow-[0_0_12px_rgba(255,190,40,0.9)] sm:text-xl">
                EVOLUTION
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right Interactive Controls (Sound + Skip) */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Desativar som' : 'Ativar som'}
            className="flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-amber-400/50 bg-[#14060d]/85 px-3 text-xs font-bold text-amber-100 backdrop-blur-xs transition hover:border-amber-300 hover:bg-[#2a0c12] active:scale-95"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-amber-300" />
            ) : (
              <VolumeX className="h-4 w-4 text-slate-400" />
            )}
            <span className="hidden sm:inline">
              {soundEnabled ? 'Som' : 'Mudo'}
            </span>
          </button>

          <button
            type="button"
            onClick={finishSequence}
            className="flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-amber-300/60 bg-[#14060d]/85 px-3.5 text-xs font-extrabold tracking-wide text-white backdrop-blur-xs transition hover:border-amber-200 hover:bg-[#2a0c12] active:scale-95"
          >
            <FastForward className="h-3.5 w-3.5 text-amber-300" />
            <span>Pular</span>
          </button>
        </div>
      </div>

      {/* Bottom Cinematic Title During Evolution (0.0s -> 12.6s) — Reference Typography & Brackets */}
      {phase !== 'reveal' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex flex-col items-center px-3 text-center sm:bottom-5">
          <div className="relative flex flex-col items-center">
            <h2
              style={{
                WebkitTextStroke: '1.5px #4a0e00',
              }}
              className="font-display text-3xl font-black italic tracking-wider text-transparent bg-gradient-to-b from-[#fffce8] via-[#ffd43b] to-[#f97316] bg-clip-text drop-shadow-[0_4px_20px_rgba(255,107,0,0.95)] sm:text-5xl md:text-6xl"
            >
              DIGIEVOLUÇÃO
            </h2>

            {/* Sharp Angular Dark-Crimson Subtitle Bracket ("EM ANDAMENTO...") */}
            <div
              style={{
                clipPath:
                  'polygon(16px 0%, calc(100% - 16px) 0%, 100% 50%, calc(100% - 16px) 100%, 16px 100%, 0% 50%)',
              }}
              className="mt-1 bg-gradient-to-r from-[#dc2626] via-[#f59e0b] to-[#dc2626] p-[1.5px] shadow-[0_0_20px_rgba(220,38,38,0.75)]"
            >
              <div
                style={{
                  clipPath:
                    'polygon(15px 0%, calc(100% - 15px) 0%, 100% 50%, calc(100% - 15px) 100%, 15px 100%, 0% 50%)',
                }}
                className="bg-[#120308]/95 px-6 py-0.5 sm:px-9 sm:py-1"
              >
                <p className="font-display text-xs font-black italic tracking-[0.22em] text-white sm:text-base">
                  {phase === 'transform'
                    ? 'TRANSFORMANDO...'
                    : 'EM ANDAMENTO...'}
                </p>
              </div>
            </div>

            <p className="mt-1.5 text-[11px] font-bold tracking-wide text-amber-100/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] sm:text-xs">
              {fromForm.name}
              <span aria-hidden="true" className="mx-2 text-amber-400">
                →
              </span>
              <span className="text-white">{toForm.name}</span>
            </p>
          </div>
        </div>
      )}

      {/* Triumphant Presentation Overlay (12.6s+ — DIGIEVOLUÇÃO COMPLETA!) */}
      {phase === 'reveal' && (
        <div className="animate-dmo-window absolute inset-x-0 bottom-0 z-20 flex flex-col items-center bg-gradient-to-t from-[#04020b]/95 via-[#090314]/72 to-transparent px-3 pb-3 pt-4 text-center sm:px-6 sm:pb-5">
          <div
            style={{
              clipPath:
                'polygon(14px 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0% 50%)',
            }}
            className="bg-gradient-to-r from-[#ff3d00] via-[#ffd036] to-[#ff3d00] p-[1.5px] shadow-[0_0_24px_rgba(255,180,25,0.85)]"
          >
            <div
              style={{
                clipPath:
                  'polygon(13px 0%, calc(100% - 13px) 0%, 100% 50%, calc(100% - 13px) 100%, 13px 100%, 0% 50%)',
              }}
              className="bg-[#180507]/95 px-5 py-0.5 sm:px-7 sm:py-1"
            >
              <p className="font-display text-[10.5px] font-black italic tracking-[0.24em] text-amber-300 sm:text-xs">
                DIGIEVOLUÇÃO COMPLETA!
              </p>
            </div>
          </div>

          <h2
            style={{
              WebkitTextStroke: '1px #3b0b00',
            }}
            className="mt-0.5 font-display text-2xl font-black italic tracking-wider text-transparent bg-gradient-to-b from-[#ffffff] via-[#ffe27a] to-[#ff9800] bg-clip-text drop-shadow-[0_4px_24px_rgba(255,150,20,0.95)] sm:text-4xl md:text-5xl"
          >
            {toForm.name}
          </h2>

          <p className="mt-0.5 text-[11px] font-bold text-amber-100/90 sm:text-xs">
            Estágio {toForm.stage}
            <span aria-hidden="true" className="mx-2 text-amber-400/75">
              ·
            </span>
            Nível {level}
            <span aria-hidden="true" className="mx-2 text-amber-400/75">
              ·
            </span>
            Elemento {toForm.element}
          </p>

          {/* Compact Real Updated Attributes & Skills Strip */}
          <div className="mt-2 flex w-full max-w-[540px] flex-col gap-1.5 rounded-xl border border-amber-400/45 bg-[#0e0514]/88 px-3 py-2 shadow-[0_0_30px_rgba(255,120,0,0.35)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-3.5 sm:py-2.5">
            <div className="grid grid-cols-4 gap-2 text-center tabular-nums sm:flex sm:items-center sm:gap-4">
              <div>
                <p className="text-[10px] font-bold text-amber-300/85">HP</p>
                <p className="text-xs font-black text-white sm:text-sm">
                  {maxHp}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-300/85">DS</p>
                <p className="text-xs font-black text-white sm:text-sm">
                  {maxDs}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-300/85">Ataque</p>
                <p className="text-xs font-black text-amber-300 sm:text-sm">
                  {derivedAttrs.attack}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-300/85">Defesa</p>
                <p className="text-xs font-black text-emerald-300 sm:text-sm">
                  {derivedAttrs.defense}
                </p>
              </div>
            </div>

            <div className="h-[1px] w-full bg-amber-400/25 sm:h-7 sm:w-[1px]" />

            <div className="flex items-center justify-center gap-3 text-left">
              <div className="flex min-w-0 items-center gap-1.5">
                <img
                  src={getDigimonSkillIconUrl(toForm.id, 'f1')}
                  alt={toForm.special1Name}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 shrink-0 rounded-md border border-amber-300/80 object-cover shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-amber-300">F1</p>
                  <p className="truncate text-[11px] font-extrabold text-white">
                    {toForm.special1Name}
                  </p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <img
                  src={getDigimonSkillIconUrl(toForm.id, 'f2')}
                  alt={toForm.special2Name}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 shrink-0 rounded-md border border-cyan-300/80 object-cover shadow-[0_0_10px_rgba(56,232,255,0.5)]"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-cyan-300">F2</p>
                  <p className="truncate text-[11px] font-extrabold text-white">
                    {toForm.special2Name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={finishSequence}
            className="mt-2.5 min-h-[42px] w-full max-w-[240px] rounded-xl border border-amber-200 bg-gradient-to-r from-[#ff5e00] via-[#ffb703] to-[#ff5e00] px-6 py-2 text-xs font-black tracking-wider text-slate-950 shadow-[0_0_26px_rgba(255,160,20,0.8)] transition hover:brightness-110 active:scale-[0.98]"
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  );
}
