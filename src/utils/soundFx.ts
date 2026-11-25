let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playDigitalTone(
  type: 'click' | 'confirm' | 'error',
  enabled: boolean
): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'confirm') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(783.99, now + 0.07);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.start(now);
      osc.stop(now + 0.13);
    }
  } catch {
    // Audio playback blocked or unavailable
  }
}

export const SELECTION_THEME_MUSIC_URL =
  '/assets/aistudio/Digimon_Data_Squad_-_Vem_Comigo__Daniel_Quirino__MP3_160K__6db659da.mp3';

const SELECTION_THEME_TARGET_VOL = 0.42;

class SelectionThemeController {
  private audio: HTMLAudioElement | null = null;
  private active = false;
  private muted = false;
  private fadeTimer: number | null = null;
  private unlockHandler: (() => void) | null = null;

  private ensureAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.audio) {
      const el = new Audio(SELECTION_THEME_MUSIC_URL);
      el.loop = true;
      el.preload = 'auto';
      el.volume = this.muted ? 0 : SELECTION_THEME_TARGET_VOL;
      this.audio = el;
    }
    return this.audio;
  }

  private clearFade() {
    if (this.fadeTimer !== null) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  private clearUnlockListener() {
    if (this.unlockHandler && typeof window !== 'undefined') {
      window.removeEventListener('pointerdown', this.unlockHandler);
      window.removeEventListener('keydown', this.unlockHandler);
      this.unlockHandler = null;
    }
  }

  private attachUnlockListener() {
    if (this.unlockHandler || typeof window === 'undefined') return;
    this.unlockHandler = () => {
      if (!this.active || this.muted) {
        this.clearUnlockListener();
        return;
      }
      const el = this.ensureAudio();
      if (!el) return;
      el.volume = SELECTION_THEME_TARGET_VOL;
      el.play()
        .then(() => {
          this.clearUnlockListener();
        })
        .catch(() => {
          // Will retry on next user gesture
        });
    };
    window.addEventListener('pointerdown', this.unlockHandler, { passive: true });
    window.addEventListener('keydown', this.unlockHandler, { passive: true });
  }

  start(soundEnabled: boolean): void {
    this.clearFade();
    this.active = true;
    this.muted = !soundEnabled;
    const el = this.ensureAudio();
    if (!el) return;

    el.volume = this.muted ? 0 : SELECTION_THEME_TARGET_VOL;
    if (this.muted) {
      return;
    }

    // If already playing smoothly (e.g. moving from Tamer Select -> Digimon Select), keep going without restarting!
    if (!el.paused && el.currentTime > 0) {
      return;
    }

    el.play()
      .then(() => {
        this.clearUnlockListener();
      })
      .catch(() => {
        this.attachUnlockListener();
      });
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    const el = this.audio;
    if (!el) return;
    if (muted) {
      el.volume = 0;
      return;
    }
    if (this.active) {
      this.clearFade();
      el.volume = SELECTION_THEME_TARGET_VOL;
      if (el.paused) {
        el.play()
          .then(() => {
            this.clearUnlockListener();
          })
          .catch(() => {
            this.attachUnlockListener();
          });
      }
    }
  }

  stop(): void {
    this.active = false;
    this.clearUnlockListener();
    this.clearFade();
    const el = this.audio;
    if (!el) return;

    if (el.paused || el.volume <= 0.01) {
      try {
        el.pause();
        el.currentTime = 0;
      } catch {
        // Ignore reset error
      }
      return;
    }

    // Smooth ~240ms fade-out when spawning into DATS Center
    const startVol = el.volume;
    let step = 0;
    const totalSteps = 8;
    this.fadeTimer = window.setInterval(() => {
      step += 1;
      const nextVol = Math.max(0, startVol * (1 - step / totalSteps));
      el.volume = nextVol;
      if (step >= totalSteps || !this.audio) {
        this.clearFade();
        try {
          el.pause();
          el.currentTime = 0;
        } catch {
          // Ignore pause error
        }
      }
    }, 30);
  }
}

export const selectionThemePlayer = new SelectionThemeController();

export const EVOLUTION_AUDIO_TRACKS = {
  /** Voice pronouncing "EVOLUTION!" triggered at exact 2.0s mark */
  voiceEvolutionUrl:
    '/assets/aistudio/Digimon_Tamers_Evolution_Sound_MP3_160K__97d4621a.mp3',
  /** Epic Digivolution theme music triggered at exact 10.0s mark */
  themeMusicUrl:
    '/assets/aistudio/digibay_evolucion_-_tono_para_celular_-_digimon_aventure_1_MP3_160K__4c7d2388.mp3',
} as const;

export const EVOLUTION_TIMELINE = {
  VOICE_AT_SEC: 2.0,
  THEME_AT_SEC: 10.0,
  MORPH_START_SEC: 10.55,
  REVEAL_AT_SEC: 12.6,
} as const;

const decodedBufferCache = new Map<string, AudioBuffer>();
const pendingDecodePromises = new Map<string, Promise<AudioBuffer | null>>();

function loadAudioBuffer(
  ctx: AudioContext,
  url: string
): Promise<AudioBuffer | null> {
  const cached = decodedBufferCache.get(url);
  if (cached) return Promise.resolve(cached);

  const inFlight = pendingDecodePromises.get(url);
  if (inFlight) return inFlight;

  const task = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.arrayBuffer();
    })
    .then((arr) => ctx.decodeAudioData(arr))
    .then((decoded) => {
      decodedBufferCache.set(url, decoded);
      return decoded;
    })
    .catch(() => null)
    .finally(() => {
      pendingDecodePromises.delete(url);
    });

  pendingDecodePromises.set(url, task);
  return task;
}

/**
 * Call synchronously inside a user tap/click handler (e.g. clicking "Evoluir")
 * to unlock Web Audio on iOS Safari / Android Chrome and preload both MP3 tracks.
 */
export function preloadAndUnlockEvolutionAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  void loadAudioBuffer(ctx, EVOLUTION_AUDIO_TRACKS.voiceEvolutionUrl);
  void loadAudioBuffer(ctx, EVOLUTION_AUDIO_TRACKS.themeMusicUrl);
}

export interface EvolutionAudioController {
  start: () => void;
  setMuted: (muted: boolean) => void;
  stop: () => void;
}

/**
 * Universal Cinematic Digivolution Audio Engine:
 * - 0.0s - 2.0s: Cybernetic charge hum & rising digital pulses
 * - Exact 2.0s:  Real "EVOLUTION!" voice MP3 + synchronized impact pulse
 * - 2.0s - 10.0s: Escalating energy spirals, lightning crackles & dramatic build-up
 * - Exact 10.0s: Real Digivolution Theme MP3 with epic impact, continuing through Reveal
 */
export function createEvolutionAudioController(
  initialEnabled: boolean
): EvolutionAudioController {
  let masterGain: GainNode | null = null;
  let stopped = false;
  let started = false;
  let muted = !initialEnabled;
  const scheduledNodes: AudioScheduledSourceNode[] = [];
  const fallbackElements: HTMLAudioElement[] = [];
  const fallbackTimers: number[] = [];

  function trackNode<T extends AudioScheduledSourceNode>(node: T): T {
    scheduledNodes.push(node);
    return node;
  }

  function scheduleTone(
    ctx: AudioContext,
    dest: AudioNode,
    baseTime: number,
    opts: {
      type: OscillatorType;
      startOffset: number;
      duration: number;
      freqStart: number;
      freqEnd?: number;
      peakGain: number;
      attack?: number;
    }
  ) {
    const t0 = baseTime + opts.startOffset;
    const t1 = t0 + opts.duration;
    const osc = trackNode(ctx.createOscillator());
    const gain = ctx.createGain();
    osc.type = opts.type;
    osc.frequency.setValueAtTime(opts.freqStart, t0);
    if (opts.freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, opts.freqEnd),
        t1
      );
    }

    const attack = Math.min(opts.attack ?? 0.03, opts.duration * 0.45);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(opts.peakGain, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t0);
    osc.stop(t1 + 0.02);
  }

  function scheduleNoiseBurst(
    ctx: AudioContext,
    dest: AudioNode,
    baseTime: number,
    opts: {
      startOffset: number;
      duration: number;
      filterFreqStart: number;
      filterFreqEnd: number;
      q: number;
      peakGain: number;
    }
  ) {
    const sampleRate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * opts.duration));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const t0 = baseTime + opts.startOffset;
    const t1 = t0 + opts.duration;

    const src = trackNode(ctx.createBufferSource());
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(opts.q, t0);
    filter.frequency.setValueAtTime(opts.filterFreqStart, t0);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(40, opts.filterFreqEnd),
      t1
    );

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(opts.peakGain, t0 + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(t0);
    src.stop(t1 + 0.02);
  }

  function scheduleMp3Track(
    ctx: AudioContext,
    dest: AudioNode,
    baseTime: number,
    url: string,
    targetOffsetSec: number,
    volume: number
  ) {
    const scheduleBuffer = (buf: AudioBuffer) => {
      if (stopped) return;
      const src = trackNode(ctx.createBufferSource());
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      src.connect(gain);
      gain.connect(dest);

      const scheduledAt = baseTime + targetOffsetSec;
      const now = ctx.currentTime;
      if (scheduledAt >= now) {
        src.start(scheduledAt);
      } else {
        const missed = now - scheduledAt;
        if (missed < buf.duration - 0.1) {
          src.start(now, missed);
        }
      }
    };

    const cached = decodedBufferCache.get(url);
    if (cached) {
      scheduleBuffer(cached);
      return;
    }

    void loadAudioBuffer(ctx, url).then((buf) => {
      if (stopped) return;
      if (buf) {
        scheduleBuffer(buf);
      } else {
        // Resilient HTML5 Audio fallback if Web Audio decode fails
        const remainingMs = Math.max(
          0,
          (baseTime + targetOffsetSec - ctx.currentTime) * 1000
        );
        const timerId = window.setTimeout(() => {
          if (stopped) return;
          const el = new Audio(url);
          el.volume = muted ? 0 : Math.min(1, volume);
          el.preload = 'auto';
          fallbackElements.push(el);
          el.play().catch(() => {});
        }, remainingMs);
        fallbackTimers.push(timerId);
      }
    });
  }

  return {
    start() {
      if (started || stopped) return;
      started = true;
      const ctx = getAudioContext();

      if (!ctx) {
        // Pure HTML5 Audio fallback when Web Audio API is unavailable
        const scheduleEl = (url: string, delayMs: number, vol: number) => {
          const id = window.setTimeout(() => {
            if (stopped) return;
            const el = new Audio(url);
            el.volume = muted ? 0 : vol;
            fallbackElements.push(el);
            el.play().catch(() => {});
          }, delayMs);
          fallbackTimers.push(id);
        };
        scheduleEl(
          EVOLUTION_AUDIO_TRACKS.voiceEvolutionUrl,
          EVOLUTION_TIMELINE.VOICE_AT_SEC * 1000,
          0.95
        );
        scheduleEl(
          EVOLUTION_AUDIO_TRACKS.themeMusicUrl,
          EVOLUTION_TIMELINE.THEME_AT_SEC * 1000,
          0.88
        );
        return;
      }

      try {
        masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(muted ? 0 : 0.85, ctx.currentTime);
        masterGain.connect(ctx.destination);

        const baseTime = ctx.currentTime;

        // 1) 0.0s - 2.0s: Portal Ignition + Rising Cyber Energy Charge
        scheduleTone(ctx, masterGain, baseTime, {
          type: 'sawtooth',
          startOffset: 0.0,
          duration: 2.05,
          freqStart: 55.0, // A1
          freqEnd: 220.0, // A3
          peakGain: 0.048,
          attack: 0.45,
        });
        scheduleTone(ctx, masterGain, baseTime, {
          type: 'sine',
          startOffset: 0.0,
          duration: 2.05,
          freqStart: 110.0, // A2
          freqEnd: 440.0, // A4
          peakGain: 0.055,
          attack: 0.35,
        });
        const introArp = [
          261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5, 1318.51,
        ];
        introArp.forEach((freq, i) => {
          scheduleTone(ctx, masterGain!, baseTime, {
            type: 'triangle',
            startOffset: 0.12 + i * 0.21,
            duration: 0.22,
            freqStart: freq,
            freqEnd: freq * 1.03,
            peakGain: 0.025 + i * 0.0025,
            attack: 0.015,
          });
        });

        // 2) EXACT 2.0s: "EVOLUTION!" Voice MP3 + Synchronized Energy Flash Impact
        scheduleMp3Track(
          ctx,
          masterGain,
          baseTime,
          EVOLUTION_AUDIO_TRACKS.voiceEvolutionUrl,
          EVOLUTION_TIMELINE.VOICE_AT_SEC,
          1.0
        );
        scheduleTone(ctx, masterGain, baseTime, {
          type: 'sine',
          startOffset: EVOLUTION_TIMELINE.VOICE_AT_SEC,
          duration: 0.65,
          freqStart: 160,
          freqEnd: 42,
          peakGain: 0.14,
          attack: 0.01,
        });
        scheduleNoiseBurst(ctx, masterGain, baseTime, {
          startOffset: EVOLUTION_TIMELINE.VOICE_AT_SEC,
          duration: 0.42,
          filterFreqStart: 3200,
          filterFreqEnd: 420,
          q: 1.4,
          peakGain: 0.065,
        });

        // 3) 2.0s - 10.0s: Escalating Energy Spirals, Shockwaves & Silhouette Tension
        // Keep 2.0s - 4.1s lighter so "EVOLUTION!" voice cuts through with maximum clarity
        scheduleTone(ctx, masterGain, baseTime, {
          type: 'sine',
          startOffset: 4.1,
          duration: 5.9,
          freqStart: 73.42, // D2
          freqEnd: 293.66, // D4
          peakGain: 0.068,
          attack: 1.2,
        });
        scheduleTone(ctx, masterGain, baseTime, {
          type: 'sawtooth',
          startOffset: 4.6,
          duration: 5.4,
          freqStart: 146.83, // D3
          freqEnd: 587.33, // D5
          peakGain: 0.042,
          attack: 1.4,
        });

        // Periodic shockwave surges & crimson electric crackles during 4.2s - 9.8s
        for (const tWave of [4.4, 6.2, 7.8, 9.0, 9.55]) {
          scheduleNoiseBurst(ctx, masterGain, baseTime, {
            startOffset: tWave,
            duration: 0.48,
            filterFreqStart: 1200 + (tWave - 4) * 380,
            filterFreqEnd: 4800,
            q: 2.6,
            peakGain: 0.032 + (tWave - 4) * 0.0065,
          });
          scheduleTone(ctx, masterGain, baseTime, {
            type: 'sine',
            startOffset: tWave,
            duration: 0.42,
            freqStart: 125 + (tWave - 4) * 14,
            freqEnd: 48,
            peakGain: 0.07 + (tWave - 4) * 0.01,
            attack: 0.012,
          });
        }

        // Accelerating digital resonance pulses from 6.5s to 9.9s leading into 10.0s drop
        const tensionSteps = 14;
        for (let i = 0; i < tensionSteps; i++) {
          const frac = i / tensionSteps;
          const offset = 6.5 + Math.pow(frac, 0.85) * 3.35;
          const freq = 330 * Math.pow(2, frac * 1.65);
          scheduleTone(ctx, masterGain, baseTime, {
            type: 'triangle',
            startOffset: offset,
            duration: 0.16,
            freqStart: freq,
            freqEnd: freq * 1.04,
            peakGain: 0.022 + frac * 0.024,
            attack: 0.01,
          });
        }

        // 4) EXACT 10.0s: Epic Digivolution Theme MP3 + Explosive Transformation Drop
        scheduleMp3Track(
          ctx,
          masterGain,
          baseTime,
          EVOLUTION_AUDIO_TRACKS.themeMusicUrl,
          EVOLUTION_TIMELINE.THEME_AT_SEC,
          0.95
        );
        scheduleTone(ctx, masterGain, baseTime, {
          type: 'sine',
          startOffset: EVOLUTION_TIMELINE.THEME_AT_SEC,
          duration: 0.85,
          freqStart: 195,
          freqEnd: 36,
          peakGain: 0.16,
          attack: 0.008,
        });
        scheduleNoiseBurst(ctx, masterGain, baseTime, {
          startOffset: EVOLUTION_TIMELINE.THEME_AT_SEC,
          duration: 0.72,
          filterFreqStart: 4200,
          filterFreqEnd: 280,
          q: 1.0,
          peakGain: 0.085,
        });

        // 5) 12.6s: Final Form Reveal Light Explosion Accent (underneath the epic theme!)
        scheduleTone(ctx, masterGain, baseTime, {
          type: 'sine',
          startOffset: EVOLUTION_TIMELINE.REVEAL_AT_SEC,
          duration: 0.7,
          freqStart: 155,
          freqEnd: 40,
          peakGain: 0.12,
          attack: 0.01,
        });
        scheduleNoiseBurst(ctx, masterGain, baseTime, {
          startOffset: EVOLUTION_TIMELINE.REVEAL_AT_SEC,
          duration: 0.5,
          filterFreqStart: 5000,
          filterFreqEnd: 650,
          q: 1.2,
          peakGain: 0.06,
        });
      } catch {
        // Ignore audio scheduling errors cleanly
      }
    },

    setMuted(nextMuted: boolean) {
      muted = nextMuted;
      for (const el of fallbackElements) {
        el.volume = muted ? 0 : 0.9;
      }
      if (!masterGain || stopped) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        masterGain.gain.cancelScheduledValues(ctx.currentTime);
        masterGain.gain.setTargetAtTime(muted ? 0 : 0.85, ctx.currentTime, 0.03);
      } catch {
        // Ignore gain update errors
      }
    },

    stop() {
      if (stopped) return;
      stopped = true;
      for (const id of fallbackTimers) {
        window.clearTimeout(id);
      }
      fallbackTimers.length = 0;

      for (const el of fallbackElements) {
        try {
          el.pause();
          el.currentTime = 0;
        } catch {
          // Ignore stop errors
        }
      }
      fallbackElements.length = 0;

      const ctx = getAudioContext();
      if (masterGain && ctx) {
        try {
          masterGain.gain.cancelScheduledValues(ctx.currentTime);
          masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
        } catch {
          // Ignore fade-out errors
        }
      }
      for (const node of scheduledNodes) {
        try {
          node.stop();
          node.disconnect();
        } catch {
          // Already stopped
        }
      }
      scheduledNodes.length = 0;
    },
  };
}

/**
 * Custom synthesized in-world Digivolution SFX (Web Audio API — zero latency,
 * perfectly timed to the 1.85s in-world Digimon transformation animation):
 * - Evolving UP (1.85s): ascending crystalline digital arpeggio + harmonic energy sweep
 *   -> prism burst + sub punch + heroic Major-9th brass/synth shimmer chord at ~1.0s!
 * - Reverting (0.85s): sleek descending crystalline digital chime + soft air sweep.
 */
export function playInWorldDigivolutionSound(
  enabled: boolean,
  isUpgrade: boolean
): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime + 0.01;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.42, now);
    master.connect(ctx.destination);

    if (!isUpgrade) {
      // Sleek descending digital de-digivolution chime (~0.82s)
      const notes = [1046.5, 783.99, 659.25, 523.25];
      notes.forEach((freq, idx) => {
        const t0 = now + idx * 0.11;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t0);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.985, t0 + 0.28);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.14, t0 + 0.018);
        g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.34);
        osc.connect(g);
        g.connect(master);
        osc.start(t0);
        osc.stop(t0 + 0.36);
      });

      const sweep = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweep.type = 'sine';
      sweep.frequency.setValueAtTime(680, now);
      sweep.frequency.exponentialRampToValueAtTime(210, now + 0.68);
      sweepGain.gain.setValueAtTime(0.08, now);
      sweepGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.72);
      sweep.connect(sweepGain);
      sweepGain.connect(master);
      sweep.start(now);
      sweep.stop(now + 0.75);
      return;
    }

    // =========================================================================
    // EVOLVING UP: 1.85s Heroic Digital Metamorphosis Fanfare
    // =========================================================================

    // 1. Rising digital energy surge (0.00s -> 1.02s) with resonant bandpass sweep
    const surgeOscA = ctx.createOscillator();
    const surgeOscB = ctx.createOscillator();
    const surgeFilter = ctx.createBiquadFilter();
    const surgeGain = ctx.createGain();

    surgeOscA.type = 'sawtooth';
    surgeOscB.type = 'triangle';
    surgeOscA.frequency.setValueAtTime(130.81, now); // C3
    surgeOscA.frequency.exponentialRampToValueAtTime(523.25, now + 1.0); // C5
    surgeOscB.frequency.setValueAtTime(196.0, now); // G3
    surgeOscB.frequency.exponentialRampToValueAtTime(783.99, now + 1.0); // G5

    surgeFilter.type = 'bandpass';
    surgeFilter.Q.setValueAtTime(3.2, now);
    surgeFilter.frequency.setValueAtTime(240, now);
    surgeFilter.frequency.exponentialRampToValueAtTime(2800, now + 1.0);

    surgeGain.gain.setValueAtTime(0.001, now);
    surgeGain.gain.linearRampToValueAtTime(0.16, now + 0.86);
    surgeGain.gain.exponentialRampToValueAtTime(0.001, now + 1.08);

    surgeOscA.connect(surgeFilter);
    surgeOscB.connect(surgeFilter);
    surgeFilter.connect(surgeGain);
    surgeGain.connect(master);
    surgeOscA.start(now);
    surgeOscB.start(now);
    surgeOscA.stop(now + 1.12);
    surgeOscB.stop(now + 1.12);

    // 2. Ascending Crystalline Data Helix Arpeggio (0.04s -> 0.94s)
    const arpFreqs = [
      523.25, // C5
      659.25, // E5
      783.99, // G5
      987.77, // B5
      1046.5, // C6
      1318.51, // E6
      1567.98, // G6
      2093.0, // C7
    ];
    arpFreqs.forEach((freq, i) => {
      const t0 = now + 0.03 + i * 0.11;
      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      overtone.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t0);
      overtone.frequency.setValueAtTime(freq * 2, t0);

      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.11 + i * 0.008, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.34);

      const ovGain = ctx.createGain();
      ovGain.gain.setValueAtTime(0.28, t0);

      osc.connect(g);
      overtone.connect(ovGain);
      ovGain.connect(g);
      g.connect(master);
      osc.start(t0);
      overtone.start(t0);
      osc.stop(t0 + 0.36);
      overtone.stop(t0 + 0.36);
    });

    // 3. EXACT MORPH CLIMAX AT 1.00s (~54% of 1.85s): Sub-Bass Impact + Filtered Prism Burst
    const climax = now + 1.0;

    // Warm sub-impact punch
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(145, climax);
    sub.frequency.exponentialRampToValueAtTime(48, climax + 0.36);
    subGain.gain.setValueAtTime(0.001, climax);
    subGain.gain.linearRampToValueAtTime(0.32, climax + 0.014);
    subGain.gain.exponentialRampToValueAtTime(0.0008, climax + 0.42);
    sub.connect(subGain);
    subGain.connect(master);
    sub.start(climax);
    sub.stop(climax + 0.45);

    // Filtered crystalline shimmer noise burst
    const noiseLen = Math.floor(ctx.sampleRate * 0.45);
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseLen, 1.8);
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(2200, climax);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.14, climax);
    noiseGain.gain.exponentialRampToValueAtTime(0.0008, climax + 0.42);
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noiseSrc.start(climax);

    // 4. Heroic Major-9th Brass/Synth Fanfare Reveal Chord (1.00s -> 2.15s)
    const chordNotes = [
      { freq: 261.63, detune: -5, vol: 0.13 }, // C4
      { freq: 392.0, detune: 4, vol: 0.11 },   // G4
      { freq: 523.25, detune: -4, vol: 0.12 }, // C5
      { freq: 587.33, detune: 6, vol: 0.085 }, // D5 (heroic 9th)
      { freq: 659.25, detune: -3, vol: 0.1 },  // E5
      { freq: 1046.5, detune: 5, vol: 0.085 }, // C6 sparkle
    ];

    const chordFilter = ctx.createBiquadFilter();
    chordFilter.type = 'lowpass';
    chordFilter.frequency.setValueAtTime(3600, climax);
    chordFilter.frequency.exponentialRampToValueAtTime(920, climax + 1.12);
    chordFilter.connect(master);

    for (const n of chordNotes) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.freq, climax);
      osc.detune.setValueAtTime(n.detune, climax);

      g.gain.setValueAtTime(0.0001, climax);
      g.gain.linearRampToValueAtTime(n.vol, climax + 0.045);
      g.gain.setValueAtTime(n.vol * 0.85, climax + 0.32);
      g.gain.exponentialRampToValueAtTime(0.0008, climax + 1.15);

      osc.connect(g);
      g.connect(chordFilter);
      osc.start(climax);
      osc.stop(climax + 1.18);
    }

    // 5. Sparkling High-Octave Bell Shimmer Tail (1.12s -> 1.85s)
    const sparkles = [1567.98, 2093.0, 2637.02]; // G6, C7, E7
    sparkles.forEach((freq, idx) => {
      const t0 = climax + 0.12 + idx * 0.11;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.065, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.55);
      osc.connect(g);
      g.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.58);
    });
  } catch {
    // Web Audio blocked or unavailable
  }
}

/**
 * Celebratory shimmering crystal arpeggio + golden bell chord played the instant
 * a rare DigiEgg drops above a defeated Digimon.
 */
export function playDigiEggDropSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime + 0.01;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.36, now);
    master.connect(ctx.destination);

    // 1. Radiant ascending pentatonic sparkle arpeggio (D5 -> F#5 -> A5 -> D6 -> F#6 -> A6)
    const notes = [587.33, 739.99, 880.0, 1174.66, 1479.98, 1760.0];
    notes.forEach((freq, idx) => {
      const t0 = now + idx * 0.068;
      const osc = ctx.createOscillator();
      const bell = ctx.createOscillator();
      const g = ctx.createGain();
      const bellGain = ctx.createGain();

      osc.type = 'sine';
      bell.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t0);
      bell.frequency.setValueAtTime(freq * 2, t0);

      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.14 + idx * 0.012, t0 + 0.014);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.56);

      bellGain.gain.setValueAtTime(0.24, t0);

      osc.connect(g);
      bell.connect(bellGain);
      bellGain.connect(g);
      g.connect(master);

      osc.start(t0);
      bell.start(t0);
      osc.stop(t0 + 0.58);
      bell.stop(t0 + 0.58);
    });

    // 2. Warm radiant halo chord swell underneath
    const chord = [293.66, 440.0, 587.33, 880.0]; // D major open fifths
    for (const freq of chord) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.12);
      g.gain.setValueAtTime(0.0001, now + 0.12);
      g.gain.linearRampToValueAtTime(0.065, now + 0.28);
      g.gain.exponentialRampToValueAtTime(0.0008, now + 1.12);
      osc.connect(g);
      g.connect(master);
      osc.start(now + 0.12);
      osc.stop(now + 1.15);
    }
  } catch {
    // Web Audio blocked or unavailable
  }
}

/**
 * Crisp high-sparkle chime played the moment the flying DigiEgg lands inside
 * the player's Inventory / Menu dock.
 */
export function playDigiEggCollectPing(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime + 0.005;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.28, now);
    master.connect(ctx.destination);

    const pings = [1174.66, 1760.0]; // D6 -> A6
    pings.forEach((freq, i) => {
      const t0 = now + i * 0.055;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.015, t0 + 0.22);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.16, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.26);
      osc.connect(g);
      g.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.28);
    });
  } catch {
    // Web Audio blocked or unavailable
  }
}

/**
 * Musiquinha alegre de ~1 segundo tocada na Incubadora sempre que a insercao
 * de DATA acerta e o DigiEgg sobe de estagio (0/5 -> 1/5, 1/5 -> 2/5, ... 4/5 -> 5/5).
 */
export function playIncubatorSuccessSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime + 0.01;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.42, now);
    master.connect(ctx.destination);

    // Melodia saltitante e alegre (~1.05s total): C5 -> E5 -> G5 -> A5 -> C6!
    const melody = [
      { freq: 523.25, t: 0.0, dur: 0.14, vol: 0.17 },   // C5
      { freq: 659.25, t: 0.11, dur: 0.14, vol: 0.18 },  // E5
      { freq: 783.99, t: 0.22, dur: 0.15, vol: 0.19 },  // G5
      { freq: 880.0, t: 0.34, dur: 0.14, vol: 0.18 },   // A5
      { freq: 1046.5, t: 0.46, dur: 0.54, vol: 0.22 },  // C6 final brilhante
    ];

    for (const note of melody) {
      const t0 = now + note.t;
      const osc = ctx.createOscillator();
      const chime = ctx.createOscillator();
      const g = ctx.createGain();
      const chimeGain = ctx.createGain();

      osc.type = 'triangle';
      chime.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, t0);
      chime.frequency.setValueAtTime(note.freq * 2, t0);

      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(note.vol, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + note.dur);

      chimeGain.gain.setValueAtTime(0.28, t0);

      osc.connect(g);
      chime.connect(chimeGain);
      chimeGain.connect(g);
      g.connect(master);

      osc.start(t0);
      chime.start(t0);
      osc.stop(t0 + note.dur + 0.03);
      chime.stop(t0 + note.dur + 0.03);
    }

    // Acorde festivo quente acompanhando a nota final (0.46s -> 1.02s)
    const chord = [523.25, 659.25, 783.99];
    for (const freq of chord) {
      const t0 = now + 0.46;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.085, t0 + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.56);
      osc.connect(g);
      g.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.58);
    }
  } catch {
    // Web Audio blocked or unavailable
  }
}

/**
 * Som realista de casca de ovo rachando/trincando quando a insercao falha,
 * mas o DigiEgg sobrevive no mesmo estagio sem estourar.
 */
export function playIncubatorFailCrackSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime + 0.01;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.45, now);
    master.connect(ctx.destination);

    // 3 estalos secos de casca rachando ("crk-tck-crack!")
    const crackBursts = [
      { offset: 0.0, dur: 0.045, freq: 2600, q: 2.2, vol: 0.34 },
      { offset: 0.055, dur: 0.055, freq: 3400, q: 2.8, vol: 0.42 },
      { offset: 0.125, dur: 0.075, freq: 2050, q: 1.8, vol: 0.36 },
    ];

    for (const b of crackBursts) {
      const sampleLen = Math.max(1, Math.floor(ctx.sampleRate * b.dur));
      const buf = ctx.createBuffer(1, sampleLen, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < sampleLen; i++) {
        const env = Math.pow(1 - i / sampleLen, 2.6);
        ch[i] = (Math.random() * 2 - 1) * env;
      }

      const src = ctx.createBufferSource();
      src.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(b.freq, now + b.offset);
      filter.Q.setValueAtTime(b.q, now + b.offset);

      const g = ctx.createGain();
      g.gain.setValueAtTime(b.vol, now + b.offset);
      g.gain.exponentialRampToValueAtTime(0.001, now + b.offset + b.dur);

      src.connect(filter);
      filter.connect(g);
      g.connect(master);
      src.start(now + b.offset);
    }

    // Pancada oca de casca de ovo + queda breve de tensao
    const knock = ctx.createOscillator();
    const knockGain = ctx.createGain();
    knock.type = 'triangle';
    knock.frequency.setValueAtTime(520, now);
    knock.frequency.exponentialRampToValueAtTime(195, now + 0.16);
    knockGain.gain.setValueAtTime(0.18, now);
    knockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    knock.connect(knockGain);
    knockGain.connect(master);
    knock.start(now);
    knock.stop(now + 0.2);

    const dropTone = ctx.createOscillator();
    const dropGain = ctx.createGain();
    dropTone.type = 'sine';
    dropTone.frequency.setValueAtTime(340, now + 0.16);
    dropTone.frequency.exponentialRampToValueAtTime(220, now + 0.42);
    dropGain.gain.setValueAtTime(0.001, now + 0.16);
    dropGain.gain.linearRampToValueAtTime(0.09, now + 0.18);
    dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
    dropTone.connect(dropGain);
    dropGain.connect(master);
    dropTone.start(now + 0.16);
    dropTone.stop(now + 0.46);
  } catch {
    // Web Audio blocked or unavailable
  }
}

/**
 * Som dramatico de quebra total do DigiEgg:
 * 1) Ovo estourando / despedacando com impacto oco e estilhacos (0.00s - 0.34s)
 * 2) Alarme de erro da Incubadora "BE! BE! BE!" (3 pulsos graves de sirene/buzzer)
 */
export function playIncubatorBrokenAlarmSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime + 0.01;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.46, now);
    master.connect(ctx.destination);

    // 1. ESTOURO DO OVO: impacto sub-grave + explosao de casca + estilhacos
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(210, now);
    popOsc.frequency.exponentialRampToValueAtTime(44, now + 0.24);
    popGain.gain.setValueAtTime(0.36, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    popOsc.connect(popGain);
    popGain.connect(master);
    popOsc.start(now);
    popOsc.stop(now + 0.3);

    const burstLen = Math.floor(ctx.sampleRate * 0.34);
    const burstBuf = ctx.createBuffer(1, burstLen, ctx.sampleRate);
    const burstCh = burstBuf.getChannelData(0);
    for (let i = 0; i < burstLen; i++) {
      const env = Math.pow(1 - i / burstLen, 1.9);
      burstCh[i] = (Math.random() * 2 - 1) * env;
    }
    const burstSrc = ctx.createBufferSource();
    burstSrc.buffer = burstBuf;
    const burstFilter = ctx.createBiquadFilter();
    burstFilter.type = 'highpass';
    burstFilter.frequency.setValueAtTime(1250, now);
    const burstGain = ctx.createGain();
    burstGain.gain.setValueAtTime(0.45, now);
    burstGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    burstSrc.connect(burstFilter);
    burstFilter.connect(burstGain);
    burstGain.connect(master);
    burstSrc.start(now);

    // Pequenos estilhacos de casca caindo
    for (const shard of [
      { t: 0.11, freq: 3100 },
      { t: 0.18, freq: 2500 },
      { t: 0.25, freq: 3800 },
    ]) {
      const sLen = Math.floor(ctx.sampleRate * 0.04);
      const sBuf = ctx.createBuffer(1, sLen, ctx.sampleRate);
      const sCh = sBuf.getChannelData(0);
      for (let i = 0; i < sLen; i++) {
        sCh[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sLen, 2.5);
      }
      const sSrc = ctx.createBufferSource();
      sSrc.buffer = sBuf;
      const sFilt = ctx.createBiquadFilter();
      sFilt.type = 'bandpass';
      sFilt.frequency.setValueAtTime(shard.freq, now + shard.t);
      sFilt.Q.setValueAtTime(3.0, now + shard.t);
      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(0.24, now + shard.t);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + shard.t + 0.04);
      sSrc.connect(sFilt);
      sFilt.connect(sGain);
      sGain.connect(master);
      sSrc.start(now + shard.t);
    }

    // 2. ALARME DE ERRO DA INCUBADORA: "BE! ... BE! ... BE!" (3 pulsos de buzzer)
    const buzzerTimes = [0.28, 0.59, 0.9];
    for (const offset of buzzerTimes) {
      const t0 = now + offset;
      const dur = 0.21;

      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const lp = ctx.createBiquadFilter();
      const g = ctx.createGain();

      oscA.type = 'sawtooth';
      oscB.type = 'square';
      // Frequencias dissonantes de buzzer/alarme industrial "BE!"
      oscA.frequency.setValueAtTime(295, t0);
      oscA.frequency.linearRampToValueAtTime(272, t0 + dur);
      oscB.frequency.setValueAtTime(314, t0);
      oscB.frequency.linearRampToValueAtTime(288, t0 + dur);

      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1650, t0);

      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.18, t0 + 0.015);
      g.gain.setValueAtTime(0.16, t0 + dur - 0.03);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);

      oscA.connect(lp);
      oscB.connect(lp);
      lp.connect(g);
      g.connect(master);

      oscA.start(t0);
      oscB.start(t0);
      oscA.stop(t0 + dur + 0.02);
      oscB.stop(t0 + dur + 0.02);
    }
  } catch {
    // Web Audio blocked or unavailable
  }
}

/**
 * Distinct futuristic Digivice Data-Transfer SFX when swapping between Active Partner
 * and Reserve Party / Archive Digimons (~1.15s):
 * - 0.00s - 0.42s: Smooth digital recall whoosh + descending crystal data bleeps
 * - 0.42s - 1.15s: Holographic portal chime + emerald-cyan harmonic materialize chord!
 */
export function playPartnerSwapSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime + 0.01;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.36, now);
    master.connect(ctx.destination);

    // 1. Recall Digitization Sweep (0.00s -> 0.42s)
    const recallOsc = ctx.createOscillator();
    const recallGain = ctx.createGain();
    recallOsc.type = 'sine';
    recallOsc.frequency.setValueAtTime(920, now);
    recallOsc.frequency.exponentialRampToValueAtTime(310, now + 0.36);
    recallGain.gain.setValueAtTime(0.001, now);
    recallGain.gain.linearRampToValueAtTime(0.14, now + 0.04);
    recallGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.4);
    recallOsc.connect(recallGain);
    recallGain.connect(master);
    recallOsc.start(now);
    recallOsc.stop(now + 0.42);

    // Quick recall pixel bleeps
    [1174.66, 880.0, 659.25].forEach((freq, idx) => {
      const t0 = now + idx * 0.085;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.11, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.14);
      osc.connect(g);
      g.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.16);
    });

    // 2. Materialize Portal Transfer Chime & Rising Shimmer (0.42s -> 1.18s)
    const swapAt = now + 0.42;
    const matNotes = [587.33, 880.0, 1174.66, 1567.98]; // D5 -> A5 -> D6 -> G6
    matNotes.forEach((freq, idx) => {
      const t0 = swapAt + idx * 0.075;
      const osc = ctx.createOscillator();
      const bell = ctx.createOscillator();
      const g = ctx.createGain();
      const bellGain = ctx.createGain();

      osc.type = 'sine';
      bell.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t0);
      bell.frequency.setValueAtTime(freq * 1.5, t0);

      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.15, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.48);

      bellGain.gain.setValueAtTime(0.22, t0);

      osc.connect(g);
      bell.connect(bellGain);
      bellGain.connect(g);
      g.connect(master);

      osc.start(t0);
      bell.start(t0);
      osc.stop(t0 + 0.5);
      bell.stop(t0 + 0.5);
    });

    // Warm airy cyan teleport pad chord
    for (const freq of [293.66, 440.0, 587.33, 739.99]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, swapAt);
      g.gain.setValueAtTime(0.0001, swapAt);
      g.gain.linearRampToValueAtTime(0.075, swapAt + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0008, swapAt + 0.78);
      osc.connect(g);
      g.connect(master);
      osc.start(swapAt);
      osc.stop(swapAt + 0.8);
    }
  } catch {
    // Web Audio blocked or unavailable
  }
}

export interface HatchShowcaseMusicController {
  start: () => void;
  setMuted: (muted: boolean) => void;
  stop: () => void;
}

/**
 * Celebratory DMO-inspired Digimon Hatch Presentation Music Engine:
 * - 0.0s - 1.45s: Anticipatory shimmering digital egg heartbeat + rising crystal chimes
 * - Exact 1.45s:  Triumphant Birth Fanfare Burst + bright sparkling reveal chord!
 * - 2.1s onward:  Uplifting, heroic looping digital adventure melody (flute/bell lead,
 *                 warm synth pad harmony & gentle rhythmic bass pulse) until the player
 *                 finishes naming/confirming their newly hatched Digimon!
 */
export function createHatchShowcaseMusicController(
  initialEnabled: boolean
): HatchShowcaseMusicController {
  let masterGain: GainNode | null = null;
  let stopped = false;
  let started = false;
  let muted = !initialEnabled;
  let loopTimer: number | null = null;
  const activeNodes = new Set<AudioScheduledSourceNode>();

  function registerNode<T extends AudioScheduledSourceNode>(node: T): T {
    activeNodes.add(node);
    node.onended = () => {
      activeNodes.delete(node);
    };
    return node;
  }

  function playSynthNote(
    ctx: AudioContext,
    dest: AudioNode,
    t0: number,
    freq: number,
    dur: number,
    vol: number,
    type: OscillatorType = 'triangle',
    detune = 0
  ) {
    const osc = registerNode(ctx.createOscillator());
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (detune !== 0) osc.detune.setValueAtTime(detune, t0);

    const attack = Math.min(0.022, dur * 0.28);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);

    osc.connect(g);
    g.connect(dest);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function playSoftKick(ctx: AudioContext, dest: AudioNode, t0: number, vol = 0.14) {
    const osc = registerNode(ctx.createOscillator());
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, t0);
    osc.frequency.exponentialRampToValueAtTime(48, t0 + 0.14);
    g.gain.setValueAtTime(0.001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.18);
    osc.connect(g);
    g.connect(dest);
    osc.start(t0);
    osc.stop(t0 + 0.2);
  }

  function scheduleMelodicLoop(ctx: AudioContext, dest: AudioNode, startAt: number) {
    if (stopped) return;

    // 4-bar bright heroic adventure progression in C Major (~6.4s per loop at 150 BPM / 0.2s eighth-notes)
    const step = 0.2;

    // Warm Pad Chords + Sparkling Arpeggio + Upbeat Bass: Cmaj7 -> G6 -> Am7 -> Fmaj7
    const chords = [
      { bar: 0, notes: [261.63, 329.63, 392.0, 493.88], arp: [523.25, 659.25, 783.99, 987.77], bass: 130.81 },
      { bar: 1, notes: [196.0, 293.66, 392.0, 440.0], arp: [392.0, 587.33, 783.99, 880.0], bass: 98.0 },
      { bar: 2, notes: [220.0, 329.63, 392.0, 523.25], arp: [440.0, 659.25, 783.99, 1046.5], bass: 110.0 },
      { bar: 3, notes: [174.61, 261.63, 329.63, 440.0], arp: [349.23, 523.25, 659.25, 880.0], bass: 87.31 },
    ];

    for (const ch of chords) {
      const barStart = startAt + ch.bar * 8 * step;
      for (const n of ch.notes) {
        playSynthNote(ctx, dest, barStart, n, 1.55, 0.04, 'sine');
      }
      // Subtle celebratory kick & upbeat bass groove
      playSoftKick(ctx, dest, barStart, 0.11);
      playSoftKick(ctx, dest, barStart + 4 * step, 0.09);
      playSynthNote(ctx, dest, barStart, ch.bass, 0.36, 0.09, 'triangle');
      playSynthNote(ctx, dest, barStart + 3 * step, ch.bass, 0.28, 0.068, 'triangle');
      playSynthNote(ctx, dest, barStart + 5 * step, ch.bass * 1.5, 0.28, 0.058, 'triangle');
      playSynthNote(ctx, dest, barStart + 7 * step, ch.bass * 1.25, 0.18, 0.045, 'triangle');

      // Shimmering DMO-style crystal arpeggio bed
      for (let a = 0; a < 8; a++) {
        const arpFreq = ch.arp[a % ch.arp.length];
        playSynthNote(ctx, dest, barStart + a * step, arpFreq, 0.19, 0.026, 'sine');
      }
    }

    // Uplifting Bell/Synth Lead Melody (joyful Digimon Masters birth presentation vibe)
    const leadPhrase: Array<[number, number, number]> = [
      // Bar 1 (Cmaj7): C5-E5-G5-B5-C6!
      [0, 523.25, 0.22],
      [1, 659.25, 0.22],
      [2, 783.99, 0.36],
      [4, 987.77, 0.22],
      [5, 1046.5, 0.54],
      // Bar 2 (G6): B5-A5-G5-D5-G5
      [8, 987.77, 0.22],
      [9, 880.0, 0.22],
      [10, 783.99, 0.36],
      [12, 587.33, 0.22],
      [13, 783.99, 0.54],
      // Bar 3 (Am7): E5-A5-C6-B5-A5-G5
      [16, 659.25, 0.22],
      [17, 880.0, 0.22],
      [18, 1046.5, 0.36],
      [20, 987.77, 0.22],
      [21, 880.0, 0.22],
      [22, 783.99, 0.36],
      // Bar 4 (Fmaj7 -> turnaround): A5-G5-F5-E5-G5-C6!
      [24, 880.0, 0.32],
      [26, 783.99, 0.22],
      [27, 698.46, 0.22],
      [28, 659.25, 0.3],
      [30, 783.99, 0.22],
      [31, 987.77, 0.22],
    ];

    for (const [stepIdx, freq, dur] of leadPhrase) {
      const t0 = startAt + stepIdx * step;
      playSynthNote(ctx, dest, t0, freq, dur, 0.115, 'triangle', 4);
      playSynthNote(ctx, dest, t0, freq, dur, 0.065, 'sine', -4);
      playSynthNote(ctx, dest, t0, freq * 2, dur * 0.72, 0.03, 'sine');
    }

    const loopDurationSec = 32 * step; // 6.4s
    const nextStart = startAt + loopDurationSec;
    const waitMs = Math.max(120, (nextStart - ctx.currentTime - 0.12) * 1000);
    loopTimer = window.setTimeout(() => {
      if (!stopped && masterGain) {
        scheduleMelodicLoop(ctx, masterGain, nextStart);
      }
    }, waitMs);
  }

  return {
    start() {
      if (started || stopped) return;
      started = true;
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        void ctx.resume().catch(() => {});
      }

      try {
        masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(muted ? 0 : 0.48, ctx.currentTime);
        masterGain.connect(ctx.destination);

        const now = ctx.currentTime + 0.02;

        // 1. Anticipation Egg Heartbeat + Shimmering Crystal Build-up (0.00s -> 1.40s)
        [0.0, 0.42, 0.82, 1.12, 1.32].forEach((offset, idx) => {
          playSoftKick(ctx, masterGain!, now + offset, 0.12 + idx * 0.022);
        });

        const riseNotes = [
          523.25, 587.33, 659.25, 783.99, 880.0, 987.77, 1046.5, 1318.51,
        ];
        riseNotes.forEach((freq, i) => {
          const t0 = now + i * 0.16;
          playSynthNote(ctx, masterGain!, t0, freq, 0.28, 0.085 + i * 0.008, 'sine');
          playSynthNote(ctx, masterGain!, t0, freq * 1.5, 0.2, 0.038, 'triangle');
        });

        // 2. Exact 1.45s: Radiant Hatch Burst Fanfare Chord!
        const burstAt = now + 1.45;
        playSoftKick(ctx, masterGain, burstAt, 0.2);
        const fanfareChord = [
          { f: 261.63, v: 0.115 },
          { f: 392.0, v: 0.105 },
          { f: 523.25, v: 0.125 },
          { f: 659.25, v: 0.115 },
          { f: 783.99, v: 0.105 },
          { f: 1046.5, v: 0.1 },
          { f: 1567.98, v: 0.07 },
        ];
        for (const n of fanfareChord) {
          playSynthNote(ctx, masterGain, burstAt, n.f, 1.45, n.v, 'triangle', 4);
          playSynthNote(ctx, masterGain, burstAt, n.f, 1.35, n.v * 0.55, 'sine', -4);
        }

        // Sparkling high-bell celebration cascade (1.50s -> 2.10s)
        [1046.5, 1318.51, 1567.98, 2093.0, 2637.02].forEach((freq, idx) => {
          playSynthNote(
            ctx,
            masterGain!,
            burstAt + 0.05 + idx * 0.1,
            freq,
            0.55,
            0.078,
            'sine'
          );
        });

        // 3. Begin looping triumphant presentation theme at 2.15s
        scheduleMelodicLoop(ctx, masterGain, now + 2.15);
      } catch {
        // Ignore audio scheduling failures cleanly
      }
    },

    setMuted(nextMuted: boolean) {
      muted = nextMuted;
      if (!masterGain || stopped) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      if (!muted && ctx.state === 'suspended') {
        void ctx.resume().catch(() => {});
      }
      try {
        masterGain.gain.cancelScheduledValues(ctx.currentTime);
        masterGain.gain.setTargetAtTime(muted ? 0 : 0.48, ctx.currentTime, 0.03);
      } catch {
        // Ignore gain errors
      }
    },

    stop() {
      if (stopped) return;
      stopped = true;
      if (loopTimer !== null) {
        window.clearTimeout(loopTimer);
        loopTimer = null;
      }
      const ctx = getAudioContext();
      if (masterGain && ctx) {
        try {
          masterGain.gain.cancelScheduledValues(ctx.currentTime);
          masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
        } catch {
          // Ignore fade errors
        }
      }
      for (const node of activeNodes) {
        try {
          node.stop();
          node.disconnect();
        } catch {
          // Already stopped
        }
      }
      activeNodes.clear();
    },
  };
}




