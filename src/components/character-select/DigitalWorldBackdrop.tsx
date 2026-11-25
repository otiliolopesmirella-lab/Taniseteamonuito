import { useEffect, useRef } from 'react';
import type { CharacterSelectCardProfile } from './characterSelectModel';

interface DigitalWorldBackdropProps {
  selectedProfile: CharacterSelectCardProfile | null;
  animationsEnabled: boolean;
}

interface FloatingBluePixel {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
  colorIndex: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

/**
 * Interactive Digital World backdrop matching the DIGILEGENDS IDLE visual identity:
 * electric blue, metallic gold, black & silver, rotating tech rings, subtle parallax
 * floating islands, floating electric-blue digital pixels, and glowing stone-tech platform.
 */
export function DigitalWorldBackdrop({
  selectedProfile,
  animationsEnabled,
}: DigitalWorldBackdropProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const accentRef = useRef<readonly [string, string, string]>([
    '#00e5ff',
    '#3b82f6',
    '#ffd84a',
  ]);

  useEffect(() => {
    if (selectedProfile) {
      accentRef.current = [
        '#00e5ff',
        selectedProfile.palette.neonLight,
        '#ffd84a',
      ];
    } else {
      accentRef.current = ['#00e5ff', '#60a5fa', '#ffd84a'];
    }
  }, [selectedProfile]);

  // Lightweight pointer-driven parallax (zero continuous 60Hz CSS variable mutation over SVGs)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.style.setProperty('--plx-x', '0px');
    root.style.setProperty('--plx-y', '0px');
  }, [animationsEnabled]);

  // Throttled Floating Electric-Blue Digital Pixels & Cyber Light Shafts Canvas (~24 FPS, zero shadowBlur)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const shouldAnimate = animationsEnabled && !reducedMotion;

    let rafId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const pixels: FloatingBluePixel[] = [];
    const shafts = [0.14, 0.36, 0.5, 0.64, 0.86];
    let shaftGrads: CanvasGradient[] = [];

    const initPixels = (w: number, h: number) => {
      pixels.length = 0;
      const count = w < 640 ? 28 : 42;
      for (let i = 0; i < count; i++) {
        pixels.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: 2.5 + Math.random() * 5.5,
          vx: (Math.random() - 0.5) * 12,
          vy: -(14 + Math.random() * 26),
          alpha: 0.25 + Math.random() * 0.6,
          colorIndex: i % 5 === 0 ? 2 : i % 3 === 0 ? 1 : 0,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 1.5 + Math.random() * 2.5,
        });
      }
    };

    const rebuildShaftGrads = (w: number, h: number) => {
      shaftGrads = shafts.map((frac, i) => {
        const bx = w * frac;
        const grad = ctx.createLinearGradient(bx, 0, bx, h * 0.86);
        grad.addColorStop(0, 'rgba(0, 229, 255, 0)');
        grad.addColorStop(
          0.32,
          i === 2 ? 'rgba(125, 244, 255, 0.09)' : 'rgba(0, 195, 255, 0.055)'
        );
        grad.addColorStop(1, 'rgba(0, 140, 255, 0)');
        return grad;
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(320, Math.round(rect.width || window.innerWidth));
      height = Math.max(480, Math.round(rect.height || window.innerHeight));
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      initPixels(width, height);
      rebuildShaftGrads(width, height);
    };

    resize();
    window.addEventListener('resize', resize);

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
      const elapsed = now / 1000;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const palette = accentRef.current;

      // Subtle diagonal electric-blue digital light rays (cached gradients)
      for (let i = 0; i < shafts.length; i++) {
        const bx = width * shafts[i];
        const beamW =
          i === 2 ? Math.max(70, width * 0.12) : Math.max(26, width * 0.045);
        ctx.fillStyle = shaftGrads[i];
        ctx.fillRect(bx - beamW / 2, 0, beamW, height * 0.86);
      }

      // Crisp floating electric-blue digital pixels (no shadowBlur)
      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        if (shouldAnimate) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.y < -18) {
            p.y = height + 14;
            p.x = Math.random() * width;
          }
          if (p.x < -18) p.x = width + 14;
          if (p.x > width + 18) p.x = -14;
        }

        const twinkle = shouldAnimate
          ? 0.45 + 0.55 * Math.sin(elapsed * p.twinkleSpeed + p.twinklePhase)
          : 0.7;
        const color = palette[p.colorIndex] ?? '#00e5ff';

        const rx = Math.round(p.x - p.size / 2);
        const ry = Math.round(p.y - p.size / 2);
        ctx.globalAlpha = p.alpha * twinkle * 0.28;
        ctx.fillStyle = color;
        ctx.fillRect(rx - 1.5, ry - 1.5, p.size + 3, p.size + 3);

        ctx.globalAlpha = p.alpha * twinkle;
        ctx.fillRect(rx, ry, p.size, p.size);
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
  }, [animationsEnabled]);

  const activeGlow =
    selectedProfile?.palette.softGlowRgba ?? 'rgba(0, 184, 255, 0.38)';
  const activeBorder = selectedProfile?.palette.neonBorder ?? '#00d8ff';

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#02081c]"
    >
      {/* 1. Electric-Blue & Deep Obsidian Digital Sky */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_6%,#009dff_0%,#083db8_30%,#041a5c_58%,#020b29_84%,#010614_100%)]" />

      {/* Subtle Cyber Circuit Grid with Depth Parallax */}
      <div
        className="absolute -inset-6 opacity-22 transition-transform duration-75"
        style={{
          transform:
            'translate3d(calc(var(--plx-x, 0px) * -0.45), calc(var(--plx-y, 0px) * -0.45), 0)',
          backgroundImage:
            'linear-gradient(to right, rgba(56, 232, 255, 0.34) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 232, 255, 0.24) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />

      {/* 2. Large Rotating Background Holographic Tech Rings (Electric Blue & Metallic Silver) */}
      <div
        className="absolute inset-x-0 top-[-90px] flex justify-center opacity-40"
        style={{
          transform:
            'translate3d(calc(var(--plx-x, 0px) * -0.35), calc(var(--plx-y, 0px) * -0.35), 0)',
        }}
      >
        <svg
          viewBox="0 0 640 640"
          className={`h-[520px] w-[520px] sm:h-[680px] sm:w-[680px] ${
            animationsEnabled ? 'animate-tamer-ring-slow' : ''
          }`}
        >
          <circle
            cx="320"
            cy="320"
            r="280"
            fill="none"
            stroke="#38e8ff"
            strokeWidth="1.5"
            strokeDasharray="34 18 10 18"
            strokeOpacity="0.65"
          />
          <circle
            cx="320"
            cy="320"
            r="242"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.2"
            strokeDasharray="8 16"
            strokeOpacity="0.55"
          />
          <circle
            cx="320"
            cy="320"
            r="198"
            fill="none"
            stroke="#ffd84a"
            strokeWidth="1.2"
            strokeDasharray="60 90"
            strokeOpacity="0.4"
          />
        </svg>
      </div>

      {/* 3. Mid-Ground Cyber City Skyline + Floating Parallax Islands + Glowing Circular Stone Platform */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute -inset-4 h-[calc(100%+32px)] w-[calc(100%+32px)]"
        style={{
          transform:
            'translate3d(calc(var(--plx-x, 0px) * -0.85), calc(var(--plx-y, 0px) * -0.7), 0)',
        }}
      >
        <defs>
          <linearGradient id="dlCityBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#03123d" stopOpacity="0.96" />
          </linearGradient>
          <linearGradient id="dlRockCrystal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="52%" stopColor="#4c1d95" />
            <stop offset="100%" stopColor="#1e1048" />
          </linearGradient>
          <linearGradient id="dlGrassRim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="50%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>
          <linearGradient id="dlStageRing" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.42" />
            <stop offset="48%" stopColor="#072264" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#02091e" stopOpacity="0.98" />
          </linearGradient>
        </defs>

        {/* Futuristic Digital City Skyline Silhouette */}
        <g opacity="0.62">
          <path
            d="M0,490 L0,335 L58,335 L58,288 L108,288 L108,358 L170,358 L170,270 L226,270 L226,336 L295,336 L295,305 L360,305 L360,382 L500,382 L500,490 Z"
            fill="url(#dlCityBlue)"
          />
          <path
            d="M940,490 L940,382 L1068,382 L1068,312 L1132,312 L1132,350 L1212,350 L1212,272 L1272,272 L1272,332 L1342,332 L1342,292 L1404,292 L1404,344 L1440,344 L1440,490 Z"
            fill="url(#dlCityBlue)"
          />
        </g>

        {/* Left Floating Cyber Island with Futuristic Towers & Purple Crystal Underside */}
        <g className={animationsEnabled ? 'animate-tamer-float' : ''}>
          <rect
            x="62"
            y="142"
            width="22"
            height="68"
            fill="#1e40af"
            stroke="#7ef4ff"
            strokeWidth="1.2"
          />
          <rect
            x="90"
            y="102"
            width="30"
            height="108"
            fill="#0b318f"
            stroke="#38e8ff"
            strokeWidth="1.6"
          />
          <rect
            x="126"
            y="124"
            width="26"
            height="86"
            fill="#1d4ed8"
            stroke="#7ef4ff"
            strokeWidth="1.2"
          />
          <rect
            x="158"
            y="150"
            width="20"
            height="60"
            fill="#0f3c9c"
            stroke="#93c5fd"
            strokeWidth="1"
          />
          <rect x="98" y="114" width="6" height="72" fill="#99f6ff" opacity="0.82" />
          <rect x="110" y="124" width="4" height="58" fill="#ffd84a" opacity="0.72" />
          <rect x="134" y="136" width="6" height="54" fill="#a5f3fc" opacity="0.78" />
          <path
            d="M40,206 Q120,186 200,206 Q188,224 120,226 Q52,224 40,206 Z"
            fill="url(#dlGrassRim)"
          />
          <polygon
            points="48,212 192,212 168,274 146,262 126,326 102,272 82,300 64,248"
            fill="url(#dlRockCrystal)"
            stroke="#c4b5fd"
            strokeOpacity="0.7"
            strokeWidth="1.5"
          />
        </g>

        {/* Right Floating Cyber Island */}
        <g
          className={animationsEnabled ? 'animate-tamer-float' : ''}
          style={{ animationDelay: '1.9s' }}
        >
          <rect
            x="1260"
            y="150"
            width="22"
            height="62"
            fill="#1e3a8a"
            stroke="#7ef4ff"
            strokeWidth="1.2"
          />
          <rect
            x="1288"
            y="108"
            width="32"
            height="104"
            fill="#0b318f"
            stroke="#38e8ff"
            strokeWidth="1.6"
          />
          <rect
            x="1326"
            y="128"
            width="26"
            height="84"
            fill="#1d4ed8"
            stroke="#93c5fd"
            strokeWidth="1.2"
          />
          <rect
            x="1358"
            y="154"
            width="20"
            height="58"
            fill="#0f3c9c"
            stroke="#7ef4ff"
            strokeWidth="1"
          />
          <rect x="1298" y="120" width="6" height="70" fill="#99f6ff" opacity="0.85" />
          <rect x="1334" y="140" width="5" height="58" fill="#ffd84a" opacity="0.75" />
          <path
            d="M1238,210 Q1318,190 1398,210 Q1386,228 1318,230 Q1250,228 1238,210 Z"
            fill="url(#dlGrassRim)"
          />
          <polygon
            points="1246,216 1390,216 1368,268 1344,304 1318,274 1300,328 1276,262"
            fill="url(#dlRockCrystal)"
            stroke="#c4b5fd"
            strokeOpacity="0.7"
            strokeWidth="1.5"
          />
        </g>

        {/* Bottom Circular Glowing Cyber-Stone Arena Pedestal matching Reference Image */}
        <g>
          <ellipse
            cx="720"
            cy="832"
            rx="680"
            ry="136"
            fill="url(#dlStageRing)"
            stroke="#38e8ff"
            strokeOpacity="0.72"
            strokeWidth="2.5"
          />
          <ellipse
            cx="720"
            cy="832"
            rx="540"
            ry="98"
            fill="none"
            stroke="#7ef4ff"
            strokeOpacity="0.58"
            strokeWidth="2"
            strokeDasharray="36 14"
          />
          <ellipse
            cx="720"
            cy="832"
            rx="380"
            ry="64"
            fill="none"
            stroke="#e2e8f0"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />
          {/* Radial Stone Conduit Lines */}
          <g stroke="#38e8ff" strokeOpacity="0.35" strokeWidth="1.8">
            <line x1="720" y1="704" x2="720" y2="900" />
            <line x1="510" y1="715" x2="310" y2="900" />
            <line x1="930" y1="715" x2="1130" y2="900" />
            <line x1="340" y1="742" x2="90" y2="900" />
            <line x1="1100" y1="742" x2="1350" y2="900" />
          </g>
        </g>
      </svg>

      {/* 4. Reactive Selected-Tamer Atmospheric Glow */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: `radial-gradient(ellipse at 50% 48%, ${activeGlow} 0%, rgba(8, 28, 86, 0.22) 48%, transparent 76%)`,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-36 opacity-55 transition-colors duration-500"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, ${activeBorder}66 0%, transparent 72%)`,
        }}
      />

      {/* 5. Live 60 FPS Floating Electric-Blue Digital Pixels */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
