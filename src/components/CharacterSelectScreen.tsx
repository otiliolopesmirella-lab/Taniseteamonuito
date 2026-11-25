import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronsRight,
  Eye,
  EyeOff,
  Footprints,
  Loader2,
  Pause,
  Pencil,
  RotateCw,
} from 'lucide-react';
import {
  getSavedCharacterForAccount,
  saveCharacterForAccount,
  validateTamerName,
} from '../services/authService';
import {
  preloadTamerSheets,
  type CardinalDirection,
} from '../sprites/tamerRealSheets';
import type { SavedCharacterSelection, TamerId } from '../types/character';
import { playDigitalTone } from '../utils/soundFx';
import { CharacterSelectHeader } from './character-select/CharacterSelectHeader';
import {
  CHARACTER_SELECT_ROSTER,
  getCharacterProfileById,
  validateCharacterSelectionSubmission,
} from './character-select/characterSelectModel';
import { ConfirmBurstOverlay } from './character-select/ConfirmBurstOverlay';
import { DigitalWorldBackdrop } from './character-select/DigitalWorldBackdrop';
import { TamerAnimatedSpriteCanvas } from './character-select/TamerAnimatedSpriteCanvas';
import { loadCharacterSelectReferenceImage } from './character-select/TamerOriginalArtworkCanvas';
import { TamerSelectionCard } from './character-select/TamerSelectionCard';

interface CharacterSelectScreenProps {
  accountUsername: string;
  soundEnabled: boolean;
  animationsEnabled?: boolean;
  onToggleSound?: () => void;
  onBackToLogin: () => void;
  onEnterWorld?: (selection: SavedCharacterSelection) => void;
}

const DIRECTION_CYCLE: readonly CardinalDirection[] = ['S', 'E', 'N', 'W'];
const DIRECTION_NAMES: Record<CardinalDirection, string> = {
  S: 'Frente',
  E: 'Direita',
  N: 'Costas',
  W: 'Esquerda',
};

export function CharacterSelectScreen({
  accountUsername,
  soundEnabled,
  animationsEnabled = true,
  onToggleSound,
  onBackToLogin,
  onEnterWorld,
}: CharacterSelectScreenProps) {
  const [selectedId, setSelectedId] = useState<TamerId | null>(null);
  const [selectionTimestamp, setSelectionTimestamp] = useState<number>(0);
  const [tamerName, setTamerName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [characterError, setCharacterError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmBurstActive, setConfirmBurstActive] = useState(false);
  const [showSpritePreview, setShowSpritePreview] = useState(false);
  const [previewState, setPreviewState] = useState<'auto' | 'walk' | 'idle'>('walk');
  const [previewDirection, setPreviewDirection] = useState<CardinalDirection>('S');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const confirmTimerRef = useRef<number | null>(null);

  // Restore saved character if this account already picked one
  useEffect(() => {
    const existing = getSavedCharacterForAccount(accountUsername);
    if (existing) {
      setSelectedId(existing.characterId);
      setTamerName(existing.tamerName);
      setSelectionTimestamp(performance.now());
    }
  }, [accountUsername]);

  // Preload reference portrait art on mount; load heavy movement sheets only for the active selected Tamer
  useEffect(() => {
    void loadCharacterSelectReferenceImage();
  }, []);

  useEffect(() => {
    if (selectedId) {
      void preloadTamerSheets(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current !== null) {
        window.clearTimeout(confirmTimerRef.current);
      }
    };
  }, []);

  const selectedProfile = useMemo(
    () => getCharacterProfileById(selectedId),
    [selectedId]
  );

  const isFormReady = useMemo(
    () => validateCharacterSelectionSubmission(selectedId, tamerName).valid,
    [selectedId, tamerName]
  );

  function handleSelectCharacter(id: TamerId) {
    playDigitalTone('click', soundEnabled);
    setSelectedId(id);
    setSelectionTimestamp(performance.now());
    setPreviewDirection('S');
    setCharacterError(null);
    setFeedback(null);
  }

  function handleNameChange(value: string) {
    setTamerName(value);
    setFeedback(null);
    if (nameTouched) {
      setNameError(validateTamerName(value));
    }
  }

  function handleNameBlur() {
    setNameTouched(true);
    setNameError(validateTamerName(tamerName));
  }

  function handleTogglePose() {
    playDigitalTone('click', soundEnabled);
    setPreviewState((prev) => (prev === 'walk' ? 'idle' : 'walk'));
  }

  function handleRotateDirection() {
    playDigitalTone('click', soundEnabled);
    setPreviewDirection((prev) => {
      const idx = DIRECTION_CYCLE.indexOf(prev);
      return DIRECTION_CYCLE[(idx + 1) % DIRECTION_CYCLE.length];
    });
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || confirmBurstActive) return;

    const validation = validateCharacterSelectionSubmission(selectedId, tamerName);
    setNameTouched(true);

    if (!validation.valid) {
      playDigitalTone('error', soundEnabled);
      if (validation.field === 'character') {
        setCharacterError(validation.errorMessage);
      } else {
        setCharacterError(null);
        setNameError(validation.errorMessage);
        nameInputRef.current?.focus();
      }
      setFeedback({
        type: 'error',
        text: validation.errorMessage ?? 'Preencha todos os campos para continuar.',
      });
      return;
    }

    const chosenId = selectedId as TamerId;
    setCharacterError(null);
    setNameError(null);
    setIsSaving(true);
    setFeedback(null);
    playDigitalTone('click', soundEnabled);

    try {
      const result = await saveCharacterForAccount({
        accountUsername,
        characterId: chosenId,
        tamerName,
      });

      if (result.success && result.saved) {
        const savedRecord = result.saved;
        playDigitalTone('confirm', soundEnabled);
        setFeedback({ type: 'success', text: result.message });
        setConfirmBurstActive(true);

        const burstDurationMs = animationsEnabled ? 680 : 120;
        confirmTimerRef.current = window.setTimeout(() => {
          setConfirmBurstActive(false);
          onEnterWorld?.(savedRecord);
        }, burstDurationMs);
      } else {
        playDigitalTone('error', soundEnabled);
        setFeedback({ type: 'error', text: result.message });
        setIsSaving(false);
      }
    } catch {
      playDigitalTone('error', soundEnabled);
      setFeedback({
        type: 'error',
        text: 'Erro ao salvar personagem na conta. Tente novamente.',
      });
      setIsSaving(false);
    }
  }

  const activeErrorMessage =
    feedback?.type === 'error'
      ? feedback.text
      : characterError ?? nameError ?? null;

  return (
    <section
      aria-label="Seleção de Personagem"
      data-testid="character-select-screen"
      data-selected-tamer={selectedId ?? 'none'}
      className="relative flex min-h-dvh w-full flex-col overflow-x-hidden text-white"
    >
      {/* Layered Digital World Scenery, Parallax Islands, Rotating Tech Rings & Floating Blue Pixels */}
      <DigitalWorldBackdrop
        selectedProfile={selectedProfile}
        animationsEnabled={animationsEnabled}
      />

      {/* Symmetrical Cyber Banners, Exact Preserved DIGILEGENDS IDLE Logo & Sub-Ribbon */}
      <CharacterSelectHeader
        soundEnabled={soundEnabled}
        animationsEnabled={animationsEnabled}
        onToggleSound={
          onToggleSound
            ? () => {
                playDigitalTone('click', !soundEnabled);
                onToggleSound();
              }
            : undefined
        }
      />

      {/* Main Interactive Selection Form */}
      <form
        onSubmit={handleConfirm}
        noValidate
        className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-3 px-2.5 pb-5 pt-2.5 sm:gap-4 sm:px-5 sm:pb-6 sm:pt-3"
      >
        {/* 4 Futuristic Neon Character Panels (2x2 crisp mobile grid -> 4-column desktop row) */}
        <div className="flex flex-col gap-2.5">
          <div
            role="radiogroup"
            aria-label="Escolha um dos quatro personagens"
            className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 md:gap-4"
          >
            {CHARACTER_SELECT_ROSTER.map((profile, idx) => (
              <TamerSelectionCard
                key={profile.id}
                profile={profile}
                index={idx}
                isSelected={selectedId === profile.id}
                hasAnySelection={selectedId !== null}
                selectionTimestamp={selectionTimestamp}
                animationsEnabled={animationsEnabled}
                onSelect={() => handleSelectCharacter(profile.id)}
              />
            ))}
          </div>

          {/* Compact Selected Tamer Status & Optional Live In-Game Sprite Preview Drawer */}
          <div
            className="flex flex-col gap-2 rounded-xl border bg-[#031033]/88 px-3 py-2 backdrop-blur-md transition-all duration-300"
            style={{
              borderColor: selectedProfile
                ? `${selectedProfile.palette.neonBorder}99`
                : 'rgba(56, 214, 255, 0.42)',
              boxShadow: selectedProfile
                ? `0 0 18px ${selectedProfile.palette.softGlowRgba}`
                : '0 4px 14px rgba(0, 8, 28, 0.5)',
            }}
          >
            {selectedProfile ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2 text-xs sm:text-sm">
                    <span
                      className="font-[family-name:var(--font-display)] tracking-wide"
                      style={{ color: selectedProfile.palette.neonLight }}
                    >
                      {selectedProfile.displayName}
                    </span>
                    <span className="text-sky-300/50" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-bold text-white/95">
                      {selectedProfile.genderSymbol} {selectedProfile.gender}
                    </span>
                    <span className="hidden text-sky-300/50 sm:inline" aria-hidden="true">
                      ·
                    </span>
                    <span className="hidden truncate text-xs font-medium italic text-sky-100/90 sm:inline">
                      {selectedProfile.description}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playDigitalTone('click', soundEnabled);
                      setShowSpritePreview((v) => !v);
                    }}
                    className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-cyan-300/45 bg-[#072058]/92 px-2.5 text-[11px] font-bold text-cyan-100 transition-colors hover:border-cyan-200 hover:bg-[#0d3380] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    {showSpritePreview ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5 text-amber-300" />
                        <span>Ocultar Prévia</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5 text-cyan-300" />
                        <span>Visualizar no Jogo</span>
                      </>
                    )}
                  </button>
                </div>

                {showSpritePreview && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-cyan-400/30 bg-[#020a24]/85 px-3 py-2">
                    <div className="h-[116px] w-[96px] shrink-0 overflow-hidden rounded-lg border border-white/15 bg-[#04143c]/80">
                      <TamerAnimatedSpriteCanvas
                        profile={selectedProfile}
                        isSelected
                        selectionTimestamp={selectionTimestamp}
                        previewState={previewState}
                        previewDirection={previewDirection}
                        animationsEnabled={animationsEnabled}
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-2">
                      <p className="text-xs font-semibold text-sky-100/90">
                        Visualização de{' '}
                        <span
                          className="font-extrabold"
                          style={{ color: selectedProfile.palette.neonLight }}
                        >
                          {selectedProfile.displayName}
                        </span>{' '}
                        em ação no Mundo Digital.
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleTogglePose}
                          className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-cyan-300/45 bg-[#082259]/90 px-2.5 text-[11px] font-bold text-cyan-100 transition-colors hover:border-cyan-200 hover:bg-[#0d3380]"
                        >
                          {previewState === 'walk' ? (
                            <>
                              <Pause className="h-3.5 w-3.5 text-cyan-300" />
                              <span>Parar</span>
                            </>
                          ) : (
                            <>
                              <Footprints className="h-3.5 w-3.5 text-cyan-300" />
                              <span>Caminhar</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleRotateDirection}
                          aria-label={`Girar personagem (atual: ${DIRECTION_NAMES[previewDirection]})`}
                          className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-cyan-300/45 bg-[#082259]/90 px-2.5 text-[11px] font-bold text-cyan-100 transition-colors hover:border-cyan-200 hover:bg-[#0d3380]"
                        >
                          <RotateCw className="h-3.5 w-3.5 text-amber-300" />
                          <span>{DIRECTION_NAMES[previewDirection]}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="w-full py-0.5 text-center text-xs font-bold tracking-wide text-cyan-100/95 sm:text-sm">
                Toque em um dos 4 personagens acima para escolher seu Tamer
              </p>
            )}
          </div>
        </div>

        {/* Lower Zone: Chamfered "Nome do Tamer:" Field + Metallic Gold CONFIRMAR & Neon Blue VOLTAR */}
        <div className="flex flex-col gap-3">
          {/* Futuristic Chamfered "Nome do Tamer:" Input Frame matching Reference Image */}
          <div
            className="clip-tamer-input-frame mx-auto w-full max-w-2xl p-[2px] transition-all duration-300"
            style={{
              background: activeErrorMessage
                ? 'linear-gradient(90deg, #fb7185 0%, #f43f5e 50%, #fb7185 100%)'
                : selectedProfile
                  ? `linear-gradient(90deg, #00d8ff 0%, #e2e8f0 25%, ${selectedProfile.palette.neonLight} 50%, #e2e8f0 75%, #00d8ff 100%)`
                  : 'linear-gradient(90deg, #00c8ff 0%, #e2e8f0 50%, #00c8ff 100%)',
              boxShadow: activeErrorMessage
                ? '0 0 18px rgba(244, 63, 94, 0.55)'
                : '0 0 22px rgba(0, 185, 255, 0.48)',
            }}
          >
            <div className="clip-tamer-input-frame bg-gradient-to-b from-[#06205d]/96 via-[#03123a]/97 to-[#020a24]/98 px-3.5 py-2.5 sm:px-5 sm:py-3">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label
                  htmlFor="tamer-name-input"
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold italic tracking-wide text-white drop-shadow-[0_1px_5px_rgba(0,212,255,0.55)] sm:text-sm"
                >
                  <Pencil
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-cyan-200 sm:h-4 sm:w-4"
                  />
                  <span>Nome do Tamer:</span>
                </label>

                <span className="text-[11px] font-bold tabular-nums text-sky-200/80">
                  {tamerName.trim().length}/16
                </span>
              </div>

              <input
                ref={nameInputRef}
                id="tamer-name-input"
                name="tamerName"
                type="text"
                maxLength={16}
                autoComplete="nickname"
                value={tamerName}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Digite o nome do seu personagem..."
                aria-invalid={Boolean(nameError)}
                aria-describedby="tamer-name-helper"
                className="min-h-[44px] w-full rounded-xl border-2 border-cyan-400/70 bg-[#020922]/96 px-3.5 text-[16px] font-bold text-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.88)] placeholder:font-medium placeholder:italic placeholder:text-sky-200/55 focus:border-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300/55 sm:min-h-[46px] sm:text-base"
              />

              {/* Inline Validation Feedback / Helper */}
              <div id="tamer-name-helper" className="mt-1.5">
                {activeErrorMessage ? (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="flex items-center gap-1.5 rounded-lg border border-rose-400/55 bg-[#360a18]/92 px-2.5 py-1.5 text-xs font-bold text-rose-100"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-300" />
                    <span>{activeErrorMessage}</span>
                  </div>
                ) : feedback?.type === 'success' ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-400/55 bg-[#062b20]/92 px-2.5 py-1.5 text-xs font-bold text-emerald-100"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                    <span>{feedback.text}</span>
                  </div>
                ) : (
                  <p className="text-[11px] font-medium text-sky-200/80">
                    Use de 3 a 16 caracteres (letras, números ou espaço) para entrar no Mundo Digital.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Primary Action Row: VOLTAR (Neon Electric Blue) & CONFIRMAR PERSONAGEM (Metallic Gold) */}
          <div className="mx-auto flex w-full max-w-2xl items-stretch gap-2.5 sm:gap-4">
            {/* VOLTAR — Neon Blue & Silver Chamfered Button */}
            <div
              className="clip-cyber-btn shrink-0 p-[2px] drop-shadow-[0_0_16px_rgba(0,185,255,0.6)]"
              style={{
                background:
                  'linear-gradient(180deg, #e2e8f0 0%, #38e8ff 42%, #0077ff 100%)',
              }}
            >
              <button
                type="button"
                disabled={isSaving || confirmBurstActive}
                onClick={() => {
                  playDigitalTone('click', soundEnabled);
                  onBackToLogin();
                }}
                className="clip-cyber-btn flex min-h-[52px] items-center justify-center gap-1.5 whitespace-nowrap bg-gradient-to-b from-[#0d3e99] via-[#06225e] to-[#031033] px-4 font-[family-name:var(--font-display)] text-sm italic tracking-wide text-white transition-all duration-150 hover:brightness-120 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:opacity-60 sm:min-h-[58px] sm:px-7 sm:text-base"
              >
                <ArrowLeft className="h-4 w-4 shrink-0 stroke-[2.8] text-cyan-200 sm:h-5 sm:w-5" />
                <span>Voltar</span>
              </button>
            </div>

            {/* CONFIRMAR PERSONAGEM — Large Metallic Gold Chamfered Button */}
            <div
              className={`clip-cyber-btn flex-1 p-[2.5px] transition-all duration-250 ${
                isFormReady
                  ? animationsEnabled
                    ? 'animate-digiselect-gold-pulse'
                    : 'drop-shadow-[0_0_22px_rgba(255,204,0,0.82)]'
                  : 'drop-shadow-[0_0_10px_rgba(245,158,11,0.38)]'
              }`}
              style={{
                background: isFormReady
                  ? 'linear-gradient(180deg, #ffffff 0%, #fff08a 26%, #facc15 58%, #b45309 100%)'
                  : 'linear-gradient(180deg, #fde68a 0%, #d97706 55%, #78350f 100%)',
              }}
            >
              <button
                type="submit"
                disabled={isSaving || confirmBurstActive}
                data-ready={isFormReady ? 'true' : 'false'}
                className={`clip-cyber-btn relative flex min-h-[52px] w-full items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap px-4 font-[family-name:var(--font-display)] text-sm italic tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:min-h-[58px] sm:gap-2 sm:px-6 sm:text-lg ${
                  isFormReady
                    ? 'bg-gradient-to-b from-[#fff38a] via-[#facc15] to-[#d97706] text-[#140a00] shadow-[inset_0_2px_4px_rgba(255,255,255,0.75)] hover:brightness-110 active:scale-[0.98]'
                    : 'bg-gradient-to-b from-[#caa044] via-[#a36f19] to-[#6b420a] text-[#1a0d00]/85 hover:brightness-105 active:scale-[0.99]'
                } disabled:cursor-wait`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/55 to-transparent transition-opacity duration-200 ${
                    isFormReady && animationsEnabled && !isSaving
                      ? 'animate-tamer-glow-sweep opacity-100'
                      : 'opacity-0'
                  }`}
                />
                {isSaving || confirmBurstActive ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                    <span>Confirmando...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Personagem</span>
                    <ChevronsRight className="h-5 w-5 shrink-0 stroke-[3] sm:h-6 sm:w-6" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Special Digital Link Confirmation Energy Burst Overlay */}
      <ConfirmBurstOverlay
        active={confirmBurstActive}
        profile={selectedProfile}
        tamerName={tamerName}
        animationsEnabled={animationsEnabled}
      />
    </section>
  );
}
