import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronRight,
  FastForward,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  EVOLUTER_ICON_URL,
  getHatchQualityProfile,
} from '../../data/itemsCatalog';
import { getFormEvoluterCost } from '../../services/hudGameService';
import {
  getDigimonFormProfile,
  getEvolutionChainForStarter,
  type DigimonFormId,
} from '../../types/digimon';
import {
  createHatchShowcaseMusicController,
  playDigitalTone,
  type HatchShowcaseMusicController,
} from '../../utils/soundFx';

export interface HatchShowcaseData {
  formId: DigimonFormId;
  speciesName: string;
  archiveSlotIndex?: number;
  grade: 3 | 4 | 5;
  sizePct: number;
  eggIconUrl?: string;
  eggAccentColor?: string;
}

interface DigimonHatchShowcaseModalProps {
  showcase: HatchShowcaseData;
  soundEnabled: boolean;
  onConfirmName: (nickname: string) => void;
}

type ShowcasePhase = 'egg' | 'reveal' | 'showcase';

function getStageBadgeColor(stage: string): string {
  switch (stage) {
    case 'Rookie':
      return 'border-cyan-300/70 bg-cyan-950/85 text-cyan-200';
    case 'Champion':
      return 'border-emerald-300/70 bg-emerald-950/85 text-emerald-200';
    case 'Ultimate':
      return 'border-purple-300/75 bg-purple-950/85 text-purple-200';
    case 'Mega':
      return 'border-amber-300/85 bg-amber-950/85 text-amber-200';
    default:
      return 'border-sky-300/70 bg-sky-950/85 text-sky-200';
  }
}

function getGradeBadgeStyle(grade: 3 | 4 | 5): string {
  if (grade === 5) {
    return 'border-amber-300 bg-gradient-to-r from-amber-500/35 to-yellow-400/25 text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.45)]';
  }
  if (grade === 4) {
    return 'border-purple-300 bg-gradient-to-r from-purple-500/35 to-fuchsia-500/25 text-purple-100 shadow-[0_0_14px_rgba(192,132,252,0.4)]';
  }
  return 'border-cyan-300 bg-gradient-to-r from-cyan-500/35 to-sky-500/25 text-cyan-100 shadow-[0_0_12px_rgba(56,232,255,0.35)]';
}

export function DigimonHatchShowcaseModal({
  showcase,
  soundEnabled,
  onConfirmName,
}: DigimonHatchShowcaseModalProps) {
  const form = useMemo(
    () => getDigimonFormProfile(showcase.formId),
    [showcase.formId]
  );
  const evolutionChain = useMemo(
    () => getEvolutionChainForStarter(form.starterId),
    [form.starterId]
  );
  const quality = useMemo(
    () => getHatchQualityProfile(showcase.grade),
    [showcase.grade]
  );

  const [phase, setPhase] = useState<ShowcasePhase>('egg');
  const [burstFlash, setBurstFlash] = useState(false);
  const [musicOn, setMusicOn] = useState(soundEnabled);
  const [nicknameInput, setNicknameInput] = useState('');
  const [revealedEvoCount, setRevealedEvoCount] = useState(0);
  const [highlightedFormId, setHighlightedFormId] = useState<DigimonFormId>(
    showcase.formId
  );
  const musicCtrlRef = useRef<HatchShowcaseMusicController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const highlightedForm = useMemo(
    () =>
      evolutionChain.find((entry) => entry.id === highlightedFormId) ?? form,
    [evolutionChain, form, highlightedFormId]
  );

  // Start celebratory DMO-style hatch presentation music on mount
  useEffect(() => {
    const ctrl = createHatchShowcaseMusicController(soundEnabled);
    musicCtrlRef.current = ctrl;
    ctrl.start();
    return () => {
      ctrl.stop();
      musicCtrlRef.current = null;
    };
  }, [soundEnabled]);

  // Choreographed 3-phase cinematic timeline
  useEffect(() => {
    const flashTimer = window.setTimeout(() => {
      setBurstFlash(true);
    }, 1360);

    const revealTimer = window.setTimeout(() => {
      setPhase('reveal');
    }, 1480);

    const clearFlashTimer = window.setTimeout(() => {
      setBurstFlash(false);
    }, 1960);

    const showcaseTimer = window.setTimeout(() => {
      setPhase('showcase');
    }, 3250);

    return () => {
      window.clearTimeout(flashTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(clearFlashTimer);
      window.clearTimeout(showcaseTimer);
    };
  }, []);

  // Cascade-in each evolution card once Phase 3 starts
  useEffect(() => {
    if (phase !== 'showcase') return;
    setRevealedEvoCount(1);
    const timers: number[] = [];
    for (let i = 1; i < evolutionChain.length; i++) {
      timers.push(
        window.setTimeout(() => {
          setRevealedEvoCount(i + 1);
        }, i * 240)
      );
    }
    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [phase, evolutionChain.length]);

  function handleToggleMusic() {
    const next = !musicOn;
    setMusicOn(next);
    musicCtrlRef.current?.setMuted(!next);
  }

  function handleSkipIntro() {
    playDigitalTone('click', musicOn);
    setBurstFlash(false);
    setPhase('showcase');
  }

  function handleFinishWithCustomName() {
    const trimmed = nicknameInput.trim().slice(0, 16);
    playDigitalTone('confirm', musicOn);
    musicCtrlRef.current?.stop();
    onConfirmName(trimmed);
  }

  function handleKeepDefaultName() {
    playDigitalTone('confirm', musicOn);
    musicCtrlRef.current?.stop();
    onConfirmName('');
  }

  const accentHex = showcase.eggAccentColor || form.theme.accentHex || '#38bdf8';
  const trimmedNickname = nicknameInput.trim().slice(0, 16);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={`Apresentação de nascimento de ${form.name}`}
      className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-[#02081c]/95 p-2.5 backdrop-blur-md sm:p-5 select-none"
    >
      {/* Ambient Radial Digital Cyber Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 38%, ${accentHex}38 0%, rgba(14, 165, 233, 0.18) 36%, rgba(2, 8, 28, 0.98) 76%)`,
        }}
      />

      {/* Rotating DMO-Style Celestial Starburst Rays Behind Stage */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 opacity-25"
      >
        <div
          className="h-full w-full animate-spin"
          style={{
            animationDuration: phase === 'egg' ? '14s' : '28s',
            background: `repeating-conic-gradient(from 0deg, ${accentHex}44 0deg 8deg, transparent 8deg 22.5deg)`,
            maskImage:
              'radial-gradient(circle at center, rgba(0,0,0,0.9) 8%, transparent 62%)',
          }}
        />
      </div>

      {/* Subtle Cyber Horizon Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(56, 232, 255, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 232, 255, 0.2) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
          maskImage:
            'radial-gradient(circle at center, rgba(0,0,0,0.85) 20%, transparent 80%)',
        }}
      />

      {/* Full-Screen White-Gold Hatch Burst Flash */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-30 bg-gradient-to-b from-amber-100 via-white to-cyan-100 transition-opacity duration-500 ${
          burstFlash ? 'opacity-95' : 'opacity-0'
        }`}
      />

      {/* Top-Right Music & Skip Controls */}
      <div className="fixed right-3 top-3 z-40 flex items-center gap-2 sm:right-5 sm:top-5">
        {phase !== 'showcase' && (
          <button
            type="button"
            onClick={handleSkipIntro}
            className="flex min-h-[38px] items-center gap-1.5 rounded-xl border border-cyan-300/65 bg-[#051a48]/90 px-3 py-1.5 text-[11px] font-black text-cyan-100 shadow-lg transition hover:bg-sky-800/90 active:scale-95"
          >
            <FastForward className="h-3.5 w-3.5 text-amber-300" />
            <span>Pular Intro</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleToggleMusic}
          aria-label={musicOn ? 'Silenciar música' : 'Ativar música'}
          title={musicOn ? 'Silenciar música' : 'Ativar música'}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/65 bg-[#051a48]/90 text-cyan-100 shadow-lg transition hover:bg-sky-800/90 active:scale-95"
        >
          {musicOn ? (
            <Volume2 className="h-4.5 w-4.5 text-amber-300" />
          ) : (
            <VolumeX className="h-4.5 w-4.5 text-slate-400" />
          )}
        </button>
      </div>

      {/* ================= PHASE 1: DIGIEGG CRACKING & HATCHING ================= */}
      {phase === 'egg' && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-cyan-200 drop-shadow sm:text-sm">
            ★ Incubação Concluída · Chocando DigiEgg ★
          </p>

          <div className="relative flex h-64 w-64 items-center justify-center sm:h-76 sm:w-76">
            {/* Rotating Outer Holographic Rings */}
            <div
              className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-cyan-300/70"
              style={{ animationDuration: '5.5s' }}
            />
            <div
              className="absolute inset-4 animate-spin rounded-full border-2 border-amber-300/80"
              style={{
                animationDuration: '2.8s',
                animationDirection: 'reverse',
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
              }}
            />
            <div
              className="absolute inset-9 animate-ping rounded-full border border-cyan-200/45"
              style={{ animationDuration: '1.15s' }}
            />

            {/* Intense Radiant Core */}
            <div
              className="absolute inset-8 animate-pulse rounded-full blur-2xl"
              style={{ backgroundColor: `${accentHex}99` }}
            />

            {/* Vertical Pillar of Light */}
            <div
              className="pointer-events-none absolute -top-32 bottom-0 w-28 opacity-65 blur-xl"
              style={{
                background: `linear-gradient(to top, ${accentHex}, #fde047, transparent)`,
              }}
            />

            {/* Shaking DigiEgg Artwork */}
            {showcase.eggIconUrl ? (
              <img
                src={showcase.eggIconUrl}
                alt={`DigiEgg de ${form.name}`}
                referrerPolicy="no-referrer"
                className="relative z-10 h-36 w-36 animate-bounce object-contain drop-shadow-[0_0_30px_rgba(250,204,21,0.95)] sm:h-44 sm:w-44"
              />
            ) : (
              <div
                className="relative z-10 h-32 w-28 animate-bounce rounded-[50%_50%_46%_46%/58%_58%_42%_42%] border-2 border-amber-200 shadow-[0_0_32px_rgba(250,204,21,0.9)]"
                style={{
                  background: `radial-gradient(circle at 35% 30%, #ffffff, ${accentHex})`,
                }}
              />
            )}

            {/* Holographic Pedestal Base */}
            <div className="absolute bottom-3 h-5 w-44 rounded-full border border-cyan-200/85 bg-cyan-400/25 shadow-[0_0_26px_rgba(56,232,255,0.8)]" />
          </div>

          <p className="mt-4 animate-pulse text-sm font-extrabold tracking-wide text-amber-200 sm:text-base">
            O DigiEgg de {form.name} está nascendo...
          </p>
        </div>
      )}

      {/* ================= PHASE 2: RADIANT DIGIMON REVEAL ================= */}
      {phase === 'reveal' && (
        <div className="animate-dmo-window relative z-20 flex flex-col items-center justify-center text-center">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 animate-pulse text-amber-300" />
            <span className="text-xs font-black uppercase tracking-[0.26em] text-amber-300 drop-shadow sm:text-sm">
              Novo Parceiro Nascido!
            </span>
            <Sparkles className="h-5 w-5 animate-pulse text-amber-300" />
          </div>

          <div className="relative flex h-68 w-68 items-center justify-center sm:h-84 sm:w-84">
            <div
              className="pointer-events-none absolute -top-28 bottom-4 w-36 opacity-50 blur-2xl"
              style={{
                background: `linear-gradient(to top, ${form.theme.accentHex}, #ffffff, transparent)`,
              }}
            />
            <div
              className="absolute inset-2 animate-pulse rounded-full blur-3xl"
              style={{ backgroundColor: `${form.theme.accentHex}78` }}
            />
            <div
              className="absolute inset-0 animate-spin rounded-full border-2 border-amber-300/70"
              style={{
                animationDuration: '7s',
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
              }}
            />
            <div
              className="absolute inset-5 animate-spin rounded-full border border-dashed border-cyan-300/65"
              style={{
                animationDuration: '11s',
                animationDirection: 'reverse',
              }}
            />
            <img
              src={form.portraitUrl}
              alt={form.name}
              referrerPolicy="no-referrer"
              className="relative z-10 h-48 w-48 object-contain drop-shadow-[0_12px_30px_rgba(56,232,255,0.88)] sm:h-60 sm:w-60"
            />
            <div className="absolute bottom-4 h-6 w-52 rounded-full border border-cyan-200/85 bg-cyan-400/30 shadow-[0_0_30px_rgba(56,232,255,0.85)]" />
          </div>

          <h2
            className="mt-1 text-3xl font-black italic tracking-wide drop-shadow-[0_2px_20px_rgba(56,232,255,0.8)] sm:text-4xl"
            style={{ color: form.theme.accentHex }}
          >
            {form.name}
          </h2>

          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
            <span
              className={`rounded-lg border px-3 py-1 text-xs font-black tabular-nums ${getGradeBadgeStyle(showcase.grade)}`}
            >
              {showcase.grade}/5 · {quality.qualityName} · {showcase.sizePct}%
            </span>
            <span className="rounded-lg border border-cyan-300/60 bg-[#051a48]/90 px-2.5 py-1 text-xs font-extrabold text-cyan-100">
              {form.stage} · {form.element}
            </span>
          </div>
        </div>
      )}

      {/* ================= PHASE 3: FULL DMO EVOLUTION SHOWCASE + OPTIONAL RENAME ================= */}
      {phase === 'showcase' && (
        <div className="animate-dmo-window clip-cyber-panel relative z-20 flex max-h-[calc(100dvh-20px)] w-full max-w-[940px] flex-col bg-gradient-to-b from-[#7af2ff] via-[#38bdf8] to-[#facc15] p-[2px] shadow-[0_0_64px_rgba(56,232,255,0.5)]">
          <div className="clip-cyber-panel dmo-cyber-matrix-bg flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            {/* Top Celebration Header */}
            <div className="relative flex flex-col items-center border-b border-cyan-300/45 bg-gradient-to-r from-[#041848] via-[#0d3b9c] to-[#041848] px-4 py-3 text-center sm:px-6 sm:py-4">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 sm:text-xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Apresentação Oficial · Digimon Chocado!</span>
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              </div>

              {/* Hatched Digimon Spotlight Row */}
              <div className="mt-2.5 flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
                <div
                  className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 bg-[radial-gradient(circle_at_center,rgba(56,232,255,0.3),rgba(2,10,32,0.95))] p-2 shadow-[0_0_28px_rgba(250,204,21,0.45)] sm:h-28 sm:w-28"
                  style={{ borderColor: highlightedForm.theme.accentHex }}
                >
                  <img
                    src={highlightedForm.portraitUrl}
                    alt={highlightedForm.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain drop-shadow-[0_4px_14px_rgba(56,232,255,0.65)] transition-transform duration-300"
                  />
                </div>

                <div className="flex flex-col items-center sm:items-start">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h2
                      className="text-2xl font-black italic tracking-wide drop-shadow sm:text-3xl"
                      style={{ color: highlightedForm.theme.accentHex }}
                    >
                      {highlightedForm.id === form.id && trimmedNickname
                        ? trimmedNickname
                        : highlightedForm.name}
                    </h2>
                    {highlightedForm.id === form.id && trimmedNickname && (
                      <span className="rounded border border-cyan-300/50 bg-[#051a48]/85 px-2 py-0.5 text-[10.5px] font-bold text-cyan-200">
                        {form.name}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs font-bold text-cyan-100/90 sm:text-sm">
                    {highlightedForm.stage} · Elemento {highlightedForm.element} ·{' '}
                    {highlightedForm.id === form.id
                      ? 'Forma Inicial (Nv. 1)'
                      : `Desbloqueia no Nv. ${highlightedForm.unlockLevel}`}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                    <span
                      className={`rounded-md border px-2.5 py-0.5 text-[11px] font-black tabular-nums ${getGradeBadgeStyle(showcase.grade)}`}
                    >
                      {showcase.grade}/5 · {quality.qualityName} ·{' '}
                      {showcase.sizePct}%
                    </span>
                    {typeof showcase.archiveSlotIndex === 'number' && (
                      <span className="rounded-md border border-fuchsia-300/60 bg-fuchsia-950/75 px-2.5 py-0.5 text-[11px] font-extrabold text-fuchsia-100">
                        Guardado no Archive · Slot #
                        {String(showcase.archiveSlotIndex + 1).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Evolution Line Showcase */}
            <div className="px-3.5 py-3.5 sm:px-6 sm:py-4">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-cyan-200 sm:text-[13px]">
                  Linha Evolutiva de {form.name}
                </h3>
                <span className="text-[10.5px] font-bold text-amber-200/90">
                  {evolutionChain.length} Evoluções · Clique para inspecionar
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                {evolutionChain.map((evoForm, idx) => {
                  const isVisible = idx < revealedEvoCount;
                  const isBaseForm = evoForm.id === form.id;
                  const isSelected = evoForm.id === highlightedForm.id;
                  return (
                    <button
                      key={evoForm.id}
                      type="button"
                      onClick={() => {
                        playDigitalTone('click', musicOn);
                        setHighlightedFormId(evoForm.id);
                      }}
                      style={{
                        borderColor: isSelected
                          ? '#facc15'
                          : isBaseForm
                            ? '#38e8ff'
                            : `${evoForm.theme.accentHex}88`,
                        boxShadow: isSelected
                          ? '0 0 26px rgba(250,204,21,0.45)'
                          : `0 0 18px ${evoForm.theme.glowRgba}`,
                      }}
                      className={`group relative flex flex-col items-center rounded-xl border bg-gradient-to-b from-[#072462]/95 via-[#04143a]/95 to-[#020a22]/98 p-2.5 text-center transition-all duration-500 hover:brightness-110 active:scale-[0.98] ${
                        isVisible
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-3 opacity-0'
                      }`}
                    >
                      {/* Stage + Unlock Level Header */}
                      <div className="flex w-full items-center justify-between gap-1">
                        <span
                          className={`rounded border px-1.5 py-[1px] text-[8.5px] font-black uppercase ${getStageBadgeColor(evoForm.stage)}`}
                        >
                          {evoForm.stage}
                        </span>
                        <span className="text-[9px] font-black tabular-nums text-cyan-200/85">
                          Nv.{evoForm.unlockLevel}
                        </span>
                      </div>

                      {/* Holographic Portrait */}
                      <div className="relative my-2 flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
                        <div
                          className="absolute inset-2 rounded-full blur-xl opacity-45 transition-opacity group-hover:opacity-70"
                          style={{ backgroundColor: evoForm.theme.accentHex }}
                        />
                        <img
                          src={evoForm.portraitUrl}
                          alt={evoForm.name}
                          referrerPolicy="no-referrer"
                          className="relative z-10 h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.75)] transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      {/* Pedestal Line */}
                      <div
                        className="mb-1.5 h-1 w-14 rounded-full opacity-80"
                        style={{ backgroundColor: evoForm.theme.accentHex }}
                      />

                      <p
                        className="w-full truncate text-xs font-black tracking-wide sm:text-[13px]"
                        style={{ color: evoForm.theme.accentHex }}
                      >
                        {evoForm.name}
                      </p>
                      <p className="mt-0.5 w-full truncate text-[9.5px] font-semibold text-sky-100/80">
                        {evoForm.special1Name}
                      </p>

                      {isBaseForm ? (
                        <span className="mt-1.5 rounded bg-amber-400/20 px-1.5 py-[1px] text-[8.5px] font-black uppercase text-amber-200">
                          Recém-Chocado
                        </span>
                      ) : (() => {
                        const evoCost = getFormEvoluterCost(
                          form.starterId,
                          evoForm.id
                        );
                        return evoCost > 0 ? (
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-fuchsia-300/65 bg-fuchsia-950/75 px-1.5 py-[2px] text-[8.5px] font-black text-fuchsia-100 shadow-[0_0_10px_rgba(232,121,249,0.35)]">
                            <img
                              src={EVOLUTER_ICON_URL}
                              alt="Evoluter"
                              referrerPolicy="no-referrer"
                              className="h-3.5 w-3.5 rounded-[3px] object-cover"
                            />
                            <span>×{evoCost} Evoluters</span>
                          </span>
                        ) : (
                          <span className="mt-1.5 rounded bg-emerald-500/20 px-1.5 py-[1px] text-[8.5px] font-black text-emerald-200">
                            Grátis · Nv.{evoForm.unlockLevel}
                          </span>
                        );
                      })()}

                      {/* Evolution Arrow Connector on Desktop */}
                      {idx < evolutionChain.length - 1 && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-3.5 top-1/2 z-20 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-300/75 bg-[#051a48] text-amber-300 shadow-[0_0_12px_rgba(56,232,255,0.55)] sm:flex"
                        >
                          <ChevronRight className="h-4 w-4 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Optional Nickname Assignment Footer */}
              <div className="mt-4 rounded-xl border border-cyan-300/45 bg-[#031133]/92 p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="hatch-digimon-nickname"
                      className="block text-xs font-black text-white"
                    >
                      Renomear seu novo {form.name}?{' '}
                      <span className="font-bold text-cyan-300">(Opcional)</span>
                    </label>
                    <p className="mt-0.5 text-[10.5px] text-sky-100/80">
                      Escolha um apelido de até 16 caracteres ou continue normalmente com o nome oficial &ldquo;{form.name}&rdquo;.
                    </p>
                    <input
                      ref={inputRef}
                      id="hatch-digimon-nickname"
                      type="text"
                      maxLength={16}
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          handleFinishWithCustomName();
                        }
                      }}
                      placeholder={`Ex: ${form.name} (deixe vazio para manter normal)`}
                      className="mt-2 w-full rounded-lg border border-cyan-300/70 bg-[#020a22] px-3 py-2 text-xs font-bold text-white placeholder-slate-400 outline-none focus:border-amber-300 focus:shadow-[0_0_12px_rgba(250,204,21,0.35)] sm:text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
                    <button
                      type="button"
                      onClick={handleKeepDefaultName}
                      className="min-h-[42px] rounded-xl border border-cyan-300/65 bg-[#072462] px-3.5 py-2 text-xs font-extrabold text-cyan-100 transition hover:bg-sky-800 active:scale-[0.98]"
                    >
                      Manter &ldquo;{form.name}&rdquo;
                    </button>

                    <button
                      type="button"
                      onClick={handleFinishWithCustomName}
                      className="clip-cyber-tab flex min-h-[42px] items-center justify-center bg-gradient-to-b from-[#fef08a] via-[#f59e0b] to-[#b45309] p-[1.5px] shadow-[0_0_18px_rgba(245,158,11,0.45)] transition hover:brightness-110 active:scale-[0.98]"
                    >
                      <span className="clip-cyber-tab flex h-full w-full items-center justify-center gap-1.5 bg-gradient-to-b from-[#f59e0b] via-[#d97706] to-[#92400e] px-4 py-2 text-xs font-black tracking-wide text-white whitespace-nowrap">
                        <Check className="h-4 w-4 stroke-[2.8]" />
                        <span>
                          {trimmedNickname
                            ? `Confirmar "${trimmedNickname}"`
                            : 'Confirmar e Concluir'}
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
