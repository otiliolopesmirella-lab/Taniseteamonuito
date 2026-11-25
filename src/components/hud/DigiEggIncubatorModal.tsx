import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
  LogOut,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {
  DMO_HATCH_QUALITY_PROFILES,
  HATCH_BACKUP_ICON_URL,
  MIN_HATCHABLE_LEVEL,
} from '../../data/itemsCatalog';
import {
  getDigiEggDisplayInfo,
  getInventoryDigiEggs,
  getInventoryHatchBackupCount,
  getInventoryReinforceMaterials,
  INCUBATOR_TOTAL_TRAY_SLOTS,
  INCUBATOR_VISIBLE_EGG_SLOTS,
  validateDataInjection,
  validateDigiEggHatch,
  validateEggReinforce,
} from '../../services/incubatorService';
import {
  mountIncubatorChamberPreview,
  type IncubatorPreviewController,
} from '../../three/digimonIncubator3D';
import type { AccountHudPersistence, InventoryItem } from '../../types/hud';

interface DigiEggIncubatorModalProps {
  hudAccount: AccountHudPersistence;
  onExecuteDataInject: (
    eggItemId: string,
    useHatchBackup?: boolean
  ) => {
    ok: boolean;
    outcome: 'success' | 'fail' | 'broken' | 'error';
    message: string;
    newLevel?: number;
    brokeEgg?: boolean;
    usedHatchBackup?: boolean;
    preventedBreak?: boolean;
    updatedEggId?: string;
  };
  onExecuteHatch: (eggItemId: string) => {
    ok: boolean;
    message: string;
    hatchedSpecies?: string;
    hatchedGrade?: 3 | 4 | 5;
  };
  onExecuteReinforce: (
    eggItemId: string,
    materialItemId: string | null
  ) => {
    ok: boolean;
    message: string;
    newReinforceLevel?: number;
    updatedEggId?: string;
  };
  onPlayTone: (tone: 'click' | 'confirm' | 'error') => void;
  onClose: () => void;
}

function CrackedDigiEggIcon({
  className = 'h-5 w-5',
  variant = 'cyan',
}: {
  className?: string;
  variant?: 'cyan' | 'white' | 'gold';
}) {
  const fill =
    variant === 'gold'
      ? '#fef08a'
      : variant === 'white'
        ? '#f8fafc'
        : '#7dd3fc';
  const stroke =
    variant === 'gold'
      ? '#78350f'
      : variant === 'white'
        ? '#78350f'
        : '#082f6e';

  return (
    <svg viewBox="0 0 32 32" className={className}>
      <path
        d="M16 3C10.5 3 6.5 11.2 6.5 18.8 6.5 24.8 10.6 29 16 29s9.5-4.2 9.5-10.2C25.5 11.2 21.5 3 16 3z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.8"
      />
      <path
        d="M8.4 16.5l3.6-2.5 3.4 2.8 3.6-3.1 4.4 2.6"
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse
        cx="12.5"
        cy="9.5"
        rx="2"
        ry="3.4"
        transform="rotate(-18 12.5 9.5)"
        fill="#ffffff"
        opacity="0.7"
      />
    </svg>
  );
}

function DigiEggArtwork({
  accentColor,
  sizeClass = 'h-12 w-12 sm:h-14 sm:w-14',
}: {
  accentColor: string;
  sizeClass?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 56"
      className={`${sizeClass} drop-shadow-[0_4px_10px_rgba(56,232,255,0.45)]`}
    >
      <defs>
        <radialGradient id="eggShellGrad" cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
      </defs>
      <path
        d="M24 4C14 4 7 19 7 32.5 7 44 14.3 52 24 52s17-8 17-19.5C41 19 34 4 24 4z"
        fill="url(#eggShellGrad)"
        stroke={accentColor}
        strokeWidth="2.4"
      />
      <path
        d="M9.5 29l6.5-5.5 7.5 6 7-6.2 7.8 5.2-3.5 4.8-4.5-3.4-6.8 6-7.6-5.8-4.2 3.4z"
        fill={accentColor}
        opacity="0.9"
      />
      <ellipse
        cx="17.5"
        cy="15.5"
        rx="3.4"
        ry="6.2"
        transform="rotate(-20 17.5 15.5)"
        fill="#ffffff"
        opacity="0.82"
      />
    </svg>
  );
}

export function DigiEggIncubatorModal({
  hudAccount,
  onExecuteDataInject,
  onExecuteHatch,
  onExecuteReinforce,
  onPlayTone,
  onClose,
}: DigiEggIncubatorModalProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCtrlRef = useRef<IncubatorPreviewController | null>(null);
  const actionTimerRef = useRef<number | null>(null);

  const [webglFallback, setWebglFallback] = useState(false);
  const [selectedEggId, setSelectedEggId] = useState<string | null>(null);
  const [trayPage, setTrayPage] = useState(0);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [showReinforceArea, setShowReinforceArea] = useState(false);
  const [processingKind, setProcessingKind] = useState<
    'inject' | 'hatch' | 'reinforce' | null
  >(null);
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [chamberOutcomeFlash, setChamberOutcomeFlash] = useState<
    'success' | 'fail' | 'broken' | 'protected' | null
  >(null);
  const [hatchBackupEnabled, setHatchBackupEnabled] = useState(true);
  const outcomeFlashTimerRef = useRef<number | null>(null);

  const realDigiEggs = useMemo(
    () => getInventoryDigiEggs(hudAccount.inventory),
    [hudAccount.inventory]
  );

  const ownedHatchBackups = useMemo(
    () => getInventoryHatchBackupCount(hudAccount.inventory),
    [hudAccount.inventory]
  );

  const reinforceMaterials = useMemo(
    () => getInventoryReinforceMaterials(hudAccount.inventory),
    [hudAccount.inventory]
  );

  // Keep selectedEggId valid against real inventory
  const selectedEggItem: InventoryItem | null = useMemo(() => {
    if (!selectedEggId) return null;
    return realDigiEggs.find((egg) => egg.id === selectedEggId) ?? null;
  }, [realDigiEggs, selectedEggId]);

  const selectedEggInfo = useMemo(() => {
    if (!selectedEggItem) return null;
    return getDigiEggDisplayInfo(selectedEggItem, hudAccount.inventory);
  }, [hudAccount.inventory, selectedEggItem]);

  const nextStepHasBreakRisk = Boolean(
    selectedEggInfo?.nextInjection &&
      selectedEggInfo.nextInjection.breakChanceOnFail > 0
  );
  const isHatchBackupActive = Boolean(
    nextStepHasBreakRisk && ownedHatchBackups > 0 && hatchBackupEnabled
  );

  const selectedMaterial: InventoryItem | null = useMemo(() => {
    if (reinforceMaterials.length === 0) return null;
    if (selectedMaterialId) {
      const found = reinforceMaterials.find((m) => m.id === selectedMaterialId);
      if (found) return found;
    }
    return reinforceMaterials[0];
  }, [reinforceMaterials, selectedMaterialId]);

  // Mount live 3D Three.js Incubator in the central chamber
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctrl = mountIncubatorChamberPreview(canvas, () => {
      setWebglFallback(true);
    });
    previewCtrlRef.current = ctrl;
    return () => {
      ctrl.dispose();
      previewCtrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (actionTimerRef.current !== null) {
        window.clearTimeout(actionTimerRef.current);
      }
      if (outcomeFlashTimerRef.current !== null) {
        window.clearTimeout(outcomeFlashTimerRef.current);
      }
    };
  }, []);

  function triggerChamberOutcomeFlash(
    kind: 'success' | 'fail' | 'broken' | 'protected'
  ) {
    setChamberOutcomeFlash(kind);
    if (outcomeFlashTimerRef.current !== null) {
      window.clearTimeout(outcomeFlashTimerRef.current);
    }
    outcomeFlashTimerRef.current = window.setTimeout(
      () => {
        setChamberOutcomeFlash(null);
        outcomeFlashTimerRef.current = null;
      },
      kind === 'broken' ? 1450 : 1200
    );
  }

  function setChamberVisualMode(mode: 'idle' | 'hatching' | 'reinforcing' | 'success') {
    previewCtrlRef.current?.setMode(mode);
  }

  function handleSelectEgg(egg: InventoryItem) {
    if (processingKind) return;
    onPlayTone('click');
    setSelectedEggId(egg.id);
    setFeedback(null);
  }

  function handleClickInjectData() {
    if (processingKind) return;

    const validation = validateDataInjection(hudAccount, selectedEggItem?.id ?? null);
    if (!validation.ok || !selectedEggItem || !validation.info?.nextInjection) {
      onPlayTone('error');
      setShowReinforceArea(false);
      setFeedback({
        tone: 'error',
        text:
          validation.error ??
          'Não foi possível inserir DATA no DigiEgg selecionado.',
      });
      return;
    }

    const nextStep = validation.info.nextInjection;
    const useBackupSnapshot = Boolean(
      nextStep.breakChanceOnFail > 0 && ownedHatchBackups > 0 && hatchBackupEnabled
    );
    setShowReinforceArea(false);
    setProcessingKind('inject');
    setChamberVisualMode('reinforcing');
    setFeedback({
      tone: 'info',
      text: `Inserindo ${validation.info.requiredData?.name ?? 'DATA'} (${Math.round(
        nextStep.successChance * 100
      )}% chance${useBackupSnapshot ? ' · Hatch Backup ATIVO' : ''}) para tentar ${nextStep.toLevel}/5...`,
    });
    onPlayTone('click');

    const eggIdSnapshot = selectedEggItem.id;
    actionTimerRef.current = window.setTimeout(() => {
      const result = onExecuteDataInject(eggIdSnapshot, useBackupSnapshot);
      setProcessingKind(null);
      if (result.updatedEggId) {
        setSelectedEggId(result.updatedEggId);
      } else if (result.brokeEgg) {
        setSelectedEggId(null);
      }
      if (result.ok && result.outcome === 'success') {
        setChamberVisualMode('success');
        triggerChamberOutcomeFlash('success');
        setFeedback({ tone: 'success', text: result.message });
        window.setTimeout(() => setChamberVisualMode('idle'), 1200);
      } else if (result.ok && result.outcome === 'broken') {
        setChamberVisualMode('idle');
        triggerChamberOutcomeFlash('broken');
        setFeedback({ tone: 'error', text: result.message });
      } else if (result.ok && result.outcome === 'fail') {
        setChamberVisualMode('idle');
        if (result.usedHatchBackup) {
          triggerChamberOutcomeFlash('protected');
          setFeedback({ tone: 'info', text: result.message });
        } else {
          triggerChamberOutcomeFlash('fail');
          setFeedback({ tone: 'error', text: result.message });
        }
      } else {
        setChamberVisualMode('idle');
        setFeedback({ tone: 'error', text: result.message });
      }
    }, 680);
  }

  function handleClickChocar() {
    if (processingKind) return;

    const validation = validateDigiEggHatch(hudAccount, selectedEggItem?.id ?? null);
    if (!validation.ok || !selectedEggItem) {
      onPlayTone('error');
      setShowReinforceArea(false);
      setFeedback({
        tone: 'error',
        text:
          validation.error ??
          'Selecione um DigiEgg válido disponível no inventário para chocar.',
      });
      return;
    }

    setShowReinforceArea(false);
    setProcessingKind('hatch');
    setChamberVisualMode('hatching');
    setFeedback({
      tone: 'info',
      text: `Canalizando energia digital na Incubadora para chocar ${selectedEggItem.name}...`,
    });
    onPlayTone('confirm');

    const eggIdSnapshot = selectedEggItem.id;
    actionTimerRef.current = window.setTimeout(() => {
      const result = onExecuteHatch(eggIdSnapshot);
      setProcessingKind(null);
      if (result.ok) {
        setChamberVisualMode('success');
        triggerChamberOutcomeFlash('success');
        setFeedback({ tone: 'success', text: result.message });
        window.setTimeout(() => setChamberVisualMode('idle'), 1200);
      } else {
        setChamberVisualMode('idle');
        setFeedback({ tone: 'error', text: result.message });
      }
    }, 520);
  }

  function handleToggleReinforce() {
    if (processingKind) return;
    onPlayTone('click');
    setFeedback(null);
    setShowReinforceArea((prev) => !prev);
  }

  function handleApplyReinforce() {
    if (processingKind) return;

    const check = validateEggReinforce(
      hudAccount,
      selectedEggItem?.id ?? null,
      selectedMaterial?.id ?? null
    );
    if (!check.ok || !selectedEggItem) {
      onPlayTone('error');
      setFeedback({
        tone: 'error',
        text: check.error ?? 'Não foi possível iniciar o reforço.',
      });
      return;
    }

    setProcessingKind('reinforce');
    setChamberVisualMode('reinforcing');
    setFeedback({
      tone: 'info',
      text: `Aplicando reforço em ${selectedEggItem.name}...`,
    });
    onPlayTone('confirm');

    const eggIdSnapshot = selectedEggItem.id;
    const matIdSnapshot = selectedMaterial?.id ?? null;
    actionTimerRef.current = window.setTimeout(() => {
      const result = onExecuteReinforce(eggIdSnapshot, matIdSnapshot);
      setProcessingKind(null);
      if (result.updatedEggId) {
        setSelectedEggId(result.updatedEggId);
      }
      if (result.ok) {
        setChamberVisualMode('success');
        onPlayTone('confirm');
        setFeedback({ tone: 'success', text: result.message });
        window.setTimeout(() => setChamberVisualMode('idle'), 1400);
      } else {
        setChamberVisualMode('idle');
        onPlayTone('error');
        setFeedback({ tone: 'error', text: result.message });
      }
    }, 950);
  }

  function handleSafeClose() {
    if (processingKind) return;
    onPlayTone('click');
    onClose();
  }

  const totalTrayPages = Math.max(
    1,
    Math.ceil(realDigiEggs.length / INCUBATOR_VISIBLE_EGG_SLOTS)
  );
  const safeTrayPage = Math.min(trayPage, totalTrayPages - 1);

  const canHatchSelectedEgg = Boolean(
    selectedEggInfo && selectedEggInfo.canHatch
  );
  const canInjectSelectedEgg = Boolean(
    selectedEggInfo && selectedEggInfo.canInjectData
  );

  const traySlots = useMemo(() => {
    const startIdx = safeTrayPage * INCUBATOR_VISIBLE_EGG_SLOTS;
    return Array.from({ length: INCUBATOR_TOTAL_TRAY_SLOTS }, (_, index) => {
      if (index >= INCUBATOR_VISIBLE_EGG_SLOTS) {
        return { kind: 'locked' as const, index };
      }
      const realEgg = realDigiEggs[startIdx + index] ?? null;
      if (realEgg) {
        return { kind: 'egg' as const, index, item: realEgg };
      }
      return { kind: 'empty' as const, index };
    });
  }, [realDigiEggs, safeTrayPage]);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={handleSafeClose}
      role="dialog"
      aria-modal="true"
      aria-label="Chocador de DigiEgg"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020816]/82 p-1.5 sm:p-4 [@media(max-height:500px)]:p-1"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window relative flex max-h-[95dvh] w-full max-w-[660px] flex-col gap-1.5 overflow-y-auto pr-0.5 sm:gap-2.5 [@media(max-height:500px)]:gap-1"
      >
        {/* ================= MAIN WINDOW: CHOCADOR DE DIGIEGG ================= */}
        <div className="relative flex flex-col">
          {/* Top-Right Extruded Metallic Square X Button */}
          <button
            type="button"
            disabled={Boolean(processingKind)}
            onClick={handleSafeClose}
            aria-label="Fechar Chocador de DigiEgg"
            className="absolute right-1.5 top-1 z-30 flex h-7.5 w-7.5 items-center justify-center rounded-lg border-2 border-[#8ef2ff] bg-gradient-to-b from-[#185fc9] via-[#0c3c9c] to-[#051d5a] text-white shadow-[0_0_16px_rgba(56,232,255,0.65),inset_0_1px_0_rgba(255,255,255,0.65)] transition duration-150 hover:brightness-115 active:scale-95 disabled:opacity-50 sm:right-2 sm:top-1.5 sm:h-9.5 sm:w-9.5 [@media(max-height:500px)]:h-7 [@media(max-height:500px)]:w-7"
          >
            <X className="h-4 w-4 stroke-[3.2] drop-shadow-[0_0_6px_rgba(56,242,255,0.85)] sm:h-5 sm:w-5" />
          </button>

          {/* Outer Glowing Cyan Chamfered Cyber Frame */}
          <div className="clip-cyber-panel relative bg-gradient-to-b from-[#7af2ff] via-[#26b6ff] to-[#56e4ff] p-[2px] shadow-[0_0_42px_rgba(0,174,255,0.62)] sm:p-[2.5px]">
            <div className="clip-cyber-panel dmo-cyber-matrix-bg relative flex flex-col overflow-hidden">
              {/* CABEÇALHO */}
              <div className="relative flex h-9.5 items-center border-b-2 border-[#3ad5ff] bg-gradient-to-r from-[#062a78] via-[#0d54d4] to-[#062a78] pl-2.5 pr-11 shadow-[0_4px_16px_rgba(0,145,255,0.45)] sm:h-[50px] sm:pl-4 sm:pr-14 [@media(max-height:500px)]:h-8.5">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="clip-cyber-input flex h-6.5 w-8 items-center justify-center border border-[#72f0ff] bg-gradient-to-b from-[#114ec2] to-[#04194d] shadow-[0_0_12px_rgba(56,232,255,0.55)] sm:h-8.5 sm:w-10.5">
                    <CrackedDigiEggIcon
                      variant="cyan"
                      className="h-4.5 w-4.5 drop-shadow-[0_0_6px_rgba(56,240,255,0.9)] sm:h-5.5 sm:w-5.5"
                    />
                  </div>
                  <h2 className="text-[15px] font-black italic tracking-wide text-white drop-shadow-[0_2px_8px_rgba(56,232,255,0.75)] sm:text-[21px] [@media(max-height:500px)]:text-[14px]">
                    Chocador de DigiEgg
                  </h2>
                </div>
                <div
                  aria-hidden="true"
                  className="ml-4 hidden h-2.5 flex-1 skew-x-[-30deg] border-b border-l border-[#62e8ff]/70 bg-[#062266]/45 sm:block"
                />
              </div>

              {/* MAIN CHAMBER + DETAILS + ACTION BUTTONS */}
              <div className="flex flex-col gap-2 p-2 sm:gap-2.5 sm:p-3 [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:p-2">
                <div className="grid grid-cols-12 gap-1.5 sm:gap-2.5">
                  {/* Left Slim Sidebar Slots (Egg Mode / Reinforce Mode) */}
                  <div className="col-span-2 flex flex-col justify-between gap-1.5 sm:col-span-1 sm:gap-2">
                    <button
                      type="button"
                      disabled={Boolean(processingKind)}
                      onClick={() => {
                        onPlayTone('click');
                        setShowReinforceArea(false);
                      }}
                      title="Modo Chocador de DigiEgg"
                      className={`clip-cyber-input flex flex-1 min-h-[76px] flex-col items-center justify-center border p-1 transition sm:min-h-[120px] [@media(max-height:500px)]:min-h-[60px] ${
                        !showReinforceArea
                          ? 'border-[#7af2ff] bg-gradient-to-b from-[#0b3b9c] to-[#051a4e] shadow-[inset_0_0_16px_rgba(56,232,255,0.35)]'
                          : 'border-[#2580d8]/65 bg-[#04143a]/90 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <CrackedDigiEggIcon
                        variant="cyan"
                        className="h-7 w-7 drop-shadow-[0_0_10px_rgba(56,232,255,0.85)] sm:h-8 sm:w-8"
                      />
                    </button>

                    <button
                      type="button"
                      disabled={Boolean(processingKind)}
                      onClick={handleToggleReinforce}
                      title="Área de Reforço"
                      className={`flex h-11 w-full items-center justify-center rounded-lg border transition sm:h-12 [@media(max-height:500px)]:h-9 ${
                        showReinforceArea
                          ? 'border-amber-300 bg-gradient-to-b from-[#17469c] to-[#081d4d] shadow-[0_0_12px_rgba(250,204,21,0.45)]'
                          : 'border-[#2c82da]/70 bg-gradient-to-b from-[#071f54] to-[#030d27] hover:border-cyan-300'
                      }`}
                    >
                      <Settings
                        className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${
                          showReinforceArea ? 'text-amber-300' : 'text-cyan-300/80'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Right 10/11 Columns: 3D Holographic Chamber + Details + Buttons */}
                  <div className="col-span-10 flex flex-col gap-2 sm:col-span-11">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                      {/* Center-Left: Live 3D Three.js Incubator Holographic Chamber */}
                      <div className="relative overflow-hidden rounded-xl border-2 border-[#3fd7ff]/85 bg-gradient-to-b from-[#062369] via-[#041645] to-[#020a24] shadow-[inset_0_0_28px_rgba(0,180,255,0.35)] sm:col-span-7">
                        {/* Vertical cyan holographic light beams matching reference */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,232,255,0.28)_0%,rgba(6,35,105,0.1)_65%,transparent_100%)]"
                        />
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 left-[14%] w-[18%] bg-gradient-to-b from-cyan-300/25 via-cyan-400/10 to-transparent blur-sm"
                        />
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 right-[14%] w-[18%] bg-gradient-to-b from-cyan-300/25 via-cyan-400/10 to-transparent blur-sm"
                        />

                        <div className="relative h-[156px] w-full sm:h-[208px] [@media(max-height:500px)]:h-[132px]">
                          {!webglFallback ? (
                            <canvas
                              ref={previewCanvasRef}
                              aria-label="Modelo 3D da Incubadora de Digimon"
                              className="h-full w-full"
                            />
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-1.5 p-3 text-center">
                              <Sparkles className="h-8 w-8 animate-pulse text-cyan-300" />
                              <span className="text-[11px] font-bold text-cyan-100">
                                Incubadora Digital DATS
                              </span>
                            </div>
                          )}

                          {/* Energy surge ring overlay during Injecting / Hatching / Reinforce */}
                          {processingKind && (
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end bg-cyan-400/10 pb-2">
                              <span className="animate-pulse rounded-full border border-amber-300/90 bg-[#051844]/90 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-200 shadow-[0_0_16px_rgba(250,204,21,0.55)]">
                                {processingKind === 'hatch'
                                  ? 'Chocando DigiEgg...'
                                  : processingKind === 'inject'
                                    ? 'Inserindo DATA...'
                                    : 'Reforçando DigiEgg...'}
                              </span>
                            </div>
                          )}

                          {/* Immediate chamber flash for Success / Shell Crack / Protected / Egg Broken Alarm */}
                          {!processingKind && chamberOutcomeFlash && (
                            <div
                              className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-2.5 transition-opacity ${
                                chamberOutcomeFlash === 'broken'
                                  ? 'animate-pulse bg-rose-600/35 shadow-[inset_0_0_40px_rgba(244,63,94,0.85)]'
                                  : chamberOutcomeFlash === 'protected'
                                    ? 'bg-cyan-500/25 shadow-[inset_0_0_36px_rgba(56,232,255,0.75)]'
                                    : chamberOutcomeFlash === 'fail'
                                      ? 'bg-amber-500/20 shadow-[inset_0_0_32px_rgba(245,158,11,0.55)]'
                                      : 'bg-emerald-400/20 shadow-[inset_0_0_36px_rgba(52,211,153,0.65)]'
                              }`}
                            >
                              <span
                                className={`rounded-full border px-3 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-lg ${
                                  chamberOutcomeFlash === 'broken'
                                    ? 'border-rose-200 bg-rose-950/95 text-rose-100 shadow-[0_0_18px_rgba(244,63,94,0.9)]'
                                    : chamberOutcomeFlash === 'protected'
                                      ? 'border-cyan-200 bg-sky-950/95 text-cyan-100 shadow-[0_0_18px_rgba(56,232,255,0.85)]'
                                      : chamberOutcomeFlash === 'fail'
                                        ? 'border-amber-200 bg-amber-950/95 text-amber-100 shadow-[0_0_14px_rgba(245,158,11,0.65)]'
                                        : 'border-emerald-200 bg-emerald-950/95 text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.8)]'
                                }`}
                              >
                                {chamberOutcomeFlash === 'broken'
                                  ? '⚠ ALARME · DIGIEGG ESTOUROU!'
                                  : chamberOutcomeFlash === 'protected'
                                    ? '🛡 PROTEGIDO POR HATCH BACKUP!'
                                    : chamberOutcomeFlash === 'fail'
                                      ? 'CASCA TRINCADA · RESISTIU!'
                                      : '★ ESTÁGIO ELEVADO! ★'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: DigiEgg Info / Reinforce Panel */}
                      <div className="flex min-h-[146px] flex-col justify-between rounded-xl border-2 border-[#3fd7ff]/80 bg-gradient-to-b from-[#061e57]/95 to-[#030e2c]/98 p-2.5 shadow-[inset_0_0_20px_rgba(0,145,255,0.22)] sm:col-span-5 sm:min-h-[208px] sm:p-3 [@media(max-height:500px)]:min-h-[132px]">
                        {/* Panel Top Tag */}
                        <div className="flex items-center justify-between gap-1.5 border-b border-cyan-400/30 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <CrackedDigiEggIcon variant="cyan" className="h-4.5 w-4.5 shrink-0" />
                            <span className="text-xs font-extrabold tracking-wide text-white sm:text-sm">
                              {showReinforceArea ? 'Reforço de DigiEgg' : 'DigiEgg'}
                            </span>
                          </div>
                          {selectedEggItem && (
                            <span className="rounded border border-cyan-300/40 bg-[#092a70] px-1.5 py-0.5 text-[9px] font-black tabular-nums text-cyan-200">
                              Qtd: {selectedEggItem.quantity}
                            </span>
                          )}
                        </div>

                        {/* Panel Content: Hatch View vs Reinforce View */}
                        {showReinforceArea ? (
                          <div className="my-auto flex flex-col gap-2 py-1.5 text-[11px]">
                            <div className="rounded-lg border border-cyan-400/25 bg-[#041234] px-2.5 py-1.5">
                              <p className="text-[9.5px] font-bold uppercase tracking-wider text-cyan-300">
                                Nível Atual de Reforço
                              </p>
                              <p className="mt-0.5 font-black text-white">
                                {selectedEggInfo
                                  ? `${selectedEggInfo.item.name} — Nv. ${selectedEggInfo.hatchLevel}/${selectedEggInfo.maxHatchLevel}`
                                  : 'Nenhum DigiEgg selecionado'}
                              </p>
                            </div>

                            <div className="rounded-lg border border-cyan-400/25 bg-[#041234] px-2.5 py-1.5">
                              <p className="text-[9.5px] font-bold uppercase tracking-wider text-cyan-300">
                                Materiais de Reforço no Inventário
                              </p>
                              {reinforceMaterials.length === 0 ? (
                                <p className="mt-1 text-[10.5px] leading-snug text-slate-300">
                                  Nenhum item de reforço encontrado no inventário. Quando itens de reforço forem adicionados ao jogo, aparecerão aqui.
                                </p>
                              ) : (
                                <div className="mt-1.5 flex flex-col gap-1 max-h-[68px] overflow-y-auto">
                                  {reinforceMaterials.map((mat) => {
                                    const activeMat = selectedMaterial?.id === mat.id;
                                    return (
                                      <button
                                        key={mat.id}
                                        type="button"
                                        onClick={() => {
                                          onPlayTone('click');
                                          setSelectedMaterialId(mat.id);
                                        }}
                                        className={`flex items-center justify-between rounded border px-2 py-1 text-left text-[10px] transition ${
                                          activeMat
                                            ? 'border-amber-300 bg-[#0b3588] text-amber-100'
                                            : 'border-cyan-400/30 bg-[#051845] text-cyan-100 hover:border-cyan-300'
                                        }`}
                                      >
                                        <span className="truncate font-bold">{mat.name}</span>
                                        <span className="shrink-0 font-black tabular-nums text-cyan-200">
                                          x{mat.quantity}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              disabled={
                                Boolean(processingKind) ||
                                !selectedEggInfo ||
                                reinforceMaterials.length === 0
                              }
                              onClick={handleApplyReinforce}
                              className="w-full rounded-lg border border-cyan-300/75 bg-gradient-to-b from-[#1764e0] to-[#083082] py-1.5 text-[11px] font-black uppercase tracking-wide text-white shadow transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              {processingKind === 'reinforce'
                                ? 'Reforçando...'
                                : 'Aplicar Reforço'}
                            </button>
                          </div>
                        ) : !selectedEggInfo ? (
                          <div className="my-auto flex flex-col items-center justify-center gap-1.5 py-4 text-center">
                            <p className="text-xs font-extrabold leading-relaxed text-sky-100 sm:text-[13px]">
                              Selecione um DigiEgg para chocar.
                            </p>
                            <p className="text-[10px] font-semibold text-cyan-200/75">
                              {realDigiEggs.length === 0
                                ? 'Nenhum DigiEgg disponível no inventário.'
                                : `${realDigiEggs.length} DigiEgg(s) disponível(is) na bandeja abaixo.`}
                            </p>
                          </div>
                        ) : (
                          <div className="my-auto flex flex-col gap-1.5 py-1 text-[11px]">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-300/60 bg-[#051742] p-1 shadow-[0_0_14px_rgba(56,232,255,0.28)]">
                                {selectedEggInfo.iconUrl ? (
                                  <img
                                    src={selectedEggInfo.iconUrl}
                                    alt={selectedEggInfo.item.name}
                                    className="h-10 w-10 object-contain drop-shadow-[0_2px_8px_rgba(56,232,255,0.5)]"
                                  />
                                ) : (
                                  <DigiEggArtwork
                                    accentColor={selectedEggInfo.accentColor}
                                    sizeClass="h-9 w-9"
                                  />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-black text-white sm:text-[13px]">
                                  {selectedEggInfo.item.name}
                                </p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <span
                                    className={`rounded border px-1.5 py-[1px] text-[9px] font-black tabular-nums ${
                                      selectedEggInfo.hatchLevel >= 5
                                        ? 'border-amber-300/80 bg-amber-950/75 text-amber-200'
                                        : selectedEggInfo.hatchLevel === 4
                                          ? 'border-purple-300/80 bg-purple-950/75 text-purple-200'
                                          : selectedEggInfo.hatchLevel === 3
                                            ? 'border-cyan-300/80 bg-cyan-950/75 text-cyan-200'
                                            : 'border-slate-500/70 bg-slate-900/80 text-slate-300'
                                    }`}
                                  >
                                    {selectedEggInfo.hatchLevel}/
                                    {selectedEggInfo.maxHatchLevel}
                                    {selectedEggInfo.currentQualityProfile
                                      ? ` · ${selectedEggInfo.currentQualityProfile.qualityName}`
                                      : ' · Preparo'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 5-Stage DMO Gauge (1/5 & 2/5 non-hatchable; 3/5, 4/5, 5/5 hatchable tiers) */}
                            <div className="rounded-lg border border-cyan-400/25 bg-[#041234] px-2 py-1.5">
                              <div className="flex items-center justify-between gap-1 text-[9px] font-bold">
                                <span className="uppercase text-cyan-300">
                                  Escala de Chocagem (≥ 3/5)
                                </span>
                                <span
                                  className={
                                    selectedEggInfo.canHatch
                                      ? 'text-emerald-300'
                                      : 'text-amber-200/85'
                                  }
                                >
                                  {selectedEggInfo.currentQualityProfile
                                    ? `${
                                        selectedEggInfo.currentQualityProfile.powerBonusPct > 0
                                          ? `+${selectedEggInfo.currentQualityProfile.powerBonusPct}% Poder · `
                                          : 'Normal · '
                                      }${selectedEggInfo.currentQualityProfile.sizeRangeLabel}`
                                    : '1/5 e 2/5 não chocam'}
                                </span>
                              </div>
                              <div className="mt-1 grid grid-cols-5 gap-1">
                                {[1, 2, 3, 4, 5].map((lv) => {
                                  const filled = selectedEggInfo.hatchLevel >= lv;
                                  const isHatchTier = lv >= MIN_HATCHABLE_LEVEL;
                                  const tierLabel =
                                    lv === 3
                                      ? '3/5'
                                      : lv === 4
                                        ? '4/5'
                                        : lv === 5
                                          ? '5/5'
                                          : `${lv}/5`;
                                  const tierProfile =
                                    lv >= 3
                                      ? DMO_HATCH_QUALITY_PROFILES[lv as 3 | 4 | 5]
                                      : null;
                                  const tierTitle =
                                    !tierProfile
                                      ? `${lv}/5: Apenas preparo (não chocável)`
                                      : `${lv}/5 (${tierProfile.qualityName}): ${
                                          tierProfile.powerBonusPct > 0
                                            ? `+${String(tierProfile.powerBonusPct).replace('.', ',')}% todos os atributos`
                                            : '+0% estágio (normal)'
                                        } · Qualidade ${tierProfile.sizeRangeLabel}`;
                                  return (
                                    <div
                                      key={lv}
                                      title={tierTitle}
                                      className={`flex flex-col items-center justify-center rounded border py-0.5 text-[8.5px] font-black tabular-nums transition ${
                                        filled
                                          ? lv === 5
                                            ? 'border-amber-300 bg-amber-500/35 text-amber-100 shadow-[0_0_8px_rgba(251,191,36,0.45)]'
                                            : lv === 4
                                              ? 'border-purple-300 bg-purple-500/35 text-purple-100 shadow-[0_0_8px_rgba(192,132,252,0.4)]'
                                              : lv === 3
                                                ? 'border-emerald-300 bg-emerald-500/30 text-emerald-100 shadow-[0_0_8px_rgba(52,211,153,0.35)]'
                                                : 'border-cyan-400/70 bg-cyan-500/25 text-cyan-100'
                                          : isHatchTier
                                            ? 'border-cyan-500/35 bg-[#061a4a]/80 text-cyan-200/60'
                                            : 'border-slate-600/50 bg-[#030d26]/90 text-slate-500'
                                      }`}
                                    >
                                      {tierLabel}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {selectedEggInfo.nextInjection ? (
                              <div className="rounded-lg border border-cyan-400/25 bg-[#041234] px-2 py-1.5">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="text-[9px] font-bold uppercase text-cyan-300">
                                    Inserção → {selectedEggInfo.nextInjection.toLevel}/5
                                  </p>
                                  <span className="text-[9px] font-black tabular-nums text-amber-200">
                                    Acerto:{' '}
                                    {Math.round(
                                      selectedEggInfo.nextInjection.successChance * 100
                                    )}
                                    %
                                    {selectedEggInfo.nextInjection.breakChanceOnFail > 0 ? (
                                      isHatchBackupActive ? (
                                        <span className="text-emerald-300">
                                          {' '}
                                          · Quebra: 0%
                                        </span>
                                      ) : (
                                        ` · Quebra: ${Math.round(
                                          selectedEggInfo.nextInjection.breakChanceOnFail *
                                            100
                                        )}%`
                                      )
                                    ) : (
                                      ' · Seguro'
                                    )}
                                  </span>
                                </div>
                                <div className="mt-1 space-y-1">
                                  {selectedEggInfo.requiredMaterials.map((req) => (
                                    <div
                                      key={req.itemKey}
                                      className="flex items-center justify-between gap-1.5 rounded border border-cyan-400/20 bg-[#061a4a] px-1.5 py-0.5 text-[10px]"
                                    >
                                      <div className="flex min-w-0 items-center gap-1.5">
                                        {req.iconUrl && (
                                          <img
                                            src={req.iconUrl}
                                            alt={req.name}
                                            className="h-4.5 w-4.5 shrink-0 object-contain"
                                          />
                                        )}
                                        <span className="truncate font-bold text-slate-100">
                                          {req.name}
                                        </span>
                                      </div>
                                      <span
                                        className={`shrink-0 font-black tabular-nums ${
                                          req.owned >= req.quantity
                                            ? 'text-emerald-300'
                                            : 'text-rose-300'
                                        }`}
                                      >
                                        {req.owned}/{req.quantity}
                                      </span>
                                    </div>
                                  ))}

                                  {/* Hatch Backup Protection Row */}
                                  <div
                                    className={`flex items-center justify-between gap-1.5 rounded border px-1.5 py-1 text-[9.5px] transition ${
                                      isHatchBackupActive
                                        ? 'border-cyan-300/80 bg-cyan-500/15 shadow-[0_0_10px_rgba(56,232,255,0.22)]'
                                        : 'border-cyan-400/20 bg-[#05153c]'
                                    }`}
                                  >
                                    <div className="flex min-w-0 items-center gap-1.5">
                                      <img
                                        src={HATCH_BACKUP_ICON_URL}
                                        alt="Hatch Backup"
                                        className="h-5 w-5 shrink-0 rounded border border-cyan-300/60 object-cover"
                                      />
                                      <div className="min-w-0">
                                        <p className="truncate font-black leading-tight text-white">
                                          Hatch Backup{' '}
                                          <span className="tabular-nums text-cyan-200">
                                            (x{ownedHatchBackups})
                                          </span>
                                        </p>
                                        <p className="truncate text-[8.5px] font-semibold text-cyan-200/80">
                                          {!nextStepHasBreakRisk
                                            ? 'Estágio seguro (não consome)'
                                            : ownedHatchBackups === 0
                                              ? 'Na Loja DWcoin por 5 DWcoin'
                                              : isHatchBackupActive
                                                ? 'Ovo protegido · consome 1 se falhar'
                                                : 'Proteção desativada'}
                                        </p>
                                      </div>
                                    </div>

                                    {ownedHatchBackups > 0 && nextStepHasBreakRisk ? (
                                      <button
                                        type="button"
                                        disabled={Boolean(processingKind)}
                                        onClick={() => {
                                          onPlayTone('click');
                                          setHatchBackupEnabled((prev) => !prev);
                                        }}
                                        aria-pressed={hatchBackupEnabled}
                                        className={`flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-black transition active:scale-95 ${
                                          hatchBackupEnabled
                                            ? 'border-emerald-300 bg-emerald-500/25 text-emerald-200'
                                            : 'border-slate-500 bg-slate-800/80 text-slate-300 hover:border-cyan-300'
                                        }`}
                                      >
                                        {hatchBackupEnabled ? (
                                          <>
                                            <ShieldCheck className="h-3 w-3 shrink-0" />
                                            <span>ATIVO</span>
                                          </>
                                        ) : (
                                          <>
                                            <Shield className="h-3 w-3 shrink-0" />
                                            <span>USAR</span>
                                          </>
                                        )}
                                      </button>
                                    ) : (
                                      <span className="shrink-0 rounded border border-cyan-400/25 bg-[#030d26] px-1.5 py-0.5 text-[8.5px] font-extrabold text-cyan-200/75">
                                        {!nextStepHasBreakRisk ? 'SEGURO' : '0x'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-lg border border-amber-300/60 bg-amber-950/45 px-2.5 py-1.5 text-center">
                                <p className="text-[10px] font-black uppercase text-amber-200">
                                  5/5 · Muito Forte (Máximo!)
                                </p>
                                <p className="text-[9px] text-amber-100/85">
                                  Pronto para chocar com +{String(DMO_HATCH_QUALITY_PROFILES[5].powerBonusPct).replace('.', ',')}% de poder e qualidade {DMO_HATCH_QUALITY_PROFILES[5].sizeRangeLabel}!
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Feedback Status Strip */}
                    {feedback && (
                      <div
                        role="status"
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold ${
                          feedback.tone === 'success'
                            ? 'border-emerald-300/75 bg-emerald-950/80 text-emerald-100'
                            : feedback.tone === 'error'
                              ? 'border-rose-400/75 bg-rose-950/85 text-rose-100'
                              : 'border-cyan-300/75 bg-[#08245e]/90 text-cyan-100'
                        }`}
                      >
                        {feedback.tone === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                        ) : feedback.tone === 'error' ? (
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-300" />
                        ) : (
                          <Sparkles className="h-4 w-4 shrink-0 animate-spin text-cyan-300" />
                        )}
                        <span className="leading-snug">{feedback.text}</span>
                      </div>
                    )}

                    {/* ACTION BUTTONS: INSERIR DATA | CHOCAR DIGIEGG (3/5+) | REFORÇO | SAIR */}
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
                        <button
                          type="button"
                          disabled={
                            Boolean(processingKind) || !canInjectSelectedEgg
                          }
                          onClick={handleClickInjectData}
                          title={
                            !selectedEggInfo
                              ? 'Selecione um DigiEgg do inventário'
                              : !selectedEggInfo.nextInjection
                                ? 'DigiEgg já está no nível máximo 5/5'
                                : !selectedEggInfo.hasAllMaterials
                                  ? 'DATA insuficiente para inserir neste estágio'
                                  : `Inserir DATA (${Math.round(
                                      selectedEggInfo.nextInjection.successChance * 100
                                    )}% chance)`
                          }
                          className="clip-cyber-tab flex min-h-[36px] w-full items-center justify-center bg-gradient-to-b from-[#99f6ff] via-[#0ea5e9] to-[#0369a1] p-[1.5px] shadow-[0_0_16px_rgba(14,165,233,0.4)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-[40px]"
                        >
                          <span className="clip-cyber-tab flex h-full w-full items-center justify-center gap-1.5 bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#0c4a6e] px-3 py-1 text-xs font-black tracking-wide text-white drop-shadow sm:text-[13px]">
                            {selectedEggInfo?.requiredData?.iconUrl && (
                              <img
                                src={selectedEggInfo.requiredData.iconUrl}
                                alt=""
                                className="h-4.5 w-4.5 object-contain"
                              />
                            )}
                            <span>
                              {processingKind === 'inject'
                                ? 'Inserindo DATA...'
                                : selectedEggInfo?.nextInjection
                                  ? `Inserir DATA (${selectedEggInfo.nextInjection.toLevel}/5 · ${Math.round(
                                      selectedEggInfo.nextInjection.successChance * 100
                                    )}%)`
                                  : 'DATA Máxima (5/5)'}
                            </span>
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(processingKind) || !canHatchSelectedEgg}
                          onClick={handleClickChocar}
                          title={
                            !selectedEggInfo
                              ? 'Selecione um DigiEgg do inventário'
                              : !selectedEggInfo.canHatch
                                ? `Bloqueado em ${selectedEggInfo.hatchLevel}/5: atinja pelo menos 3/5 (Normal)`
                                : `Chocar ${selectedEggInfo.item.name} em ${selectedEggInfo.currentQualityProfile?.label}`
                          }
                          className="clip-cyber-tab flex min-h-[36px] w-full items-center justify-center bg-gradient-to-b from-[#fff59d] via-[#fbbf24] to-[#b45309] p-[1.5px] shadow-[0_0_20px_rgba(245,158,11,0.45)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-[40px]"
                        >
                          <span className="clip-cyber-tab flex h-full w-full items-center justify-center gap-1.5 bg-gradient-to-b from-[#f59e0b] via-[#d97706] to-[#92400e] px-3 py-1 text-xs font-black tracking-wide text-white drop-shadow sm:text-[13px]">
                            <CrackedDigiEggIcon variant="white" className="h-4.5 w-4.5" />
                            <span>
                              {processingKind === 'hatch'
                                ? 'Chocando...'
                                : selectedEggInfo?.currentQualityProfile
                                  ? `Chocar (${selectedEggInfo.currentQualityProfile.label} · ${selectedEggInfo.currentQualityProfile.qualityName})`
                                  : 'Chocar DigiEgg (mín. 3/5)'}
                            </span>
                          </span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          disabled={Boolean(processingKind)}
                          onClick={handleToggleReinforce}
                          className={`clip-cyber-tab flex min-h-[34px] items-center justify-center p-[1.5px] transition hover:brightness-115 active:scale-[0.98] disabled:opacity-60 sm:min-h-[38px] ${
                            showReinforceArea
                              ? 'bg-gradient-to-b from-[#fef08a] via-[#f59e0b] to-[#b45309]'
                              : 'bg-gradient-to-b from-[#7af2ff] via-[#1e88e5] to-[#0a368a]'
                          }`}
                        >
                          <span className="clip-cyber-tab flex h-full w-full items-center justify-center gap-1.5 bg-gradient-to-b from-[#0f4bb8] to-[#062161] px-3 py-1 text-xs font-extrabold tracking-wide text-white sm:text-sm">
                            <Settings className="h-4 w-4 text-cyan-200" />
                            <span>Reforço</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(processingKind)}
                          onClick={handleSafeClose}
                          className="clip-cyber-tab flex min-h-[34px] items-center justify-center bg-gradient-to-b from-[#fda4af] via-[#e11d48] to-[#881337] p-[1.5px] shadow-[0_0_14px_rgba(225,29,72,0.38)] transition hover:brightness-115 active:scale-[0.98] disabled:opacity-60 sm:min-h-[38px]"
                        >
                          <span className="clip-cyber-tab flex h-full w-full items-center justify-center gap-1.5 bg-gradient-to-b from-[#be123c] to-[#6e0922] px-3 py-1 text-xs font-extrabold tracking-wide text-white sm:text-sm">
                            <LogOut className="h-4 w-4 text-rose-100" />
                            <span>Sair</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM WINDOW: MEUS DIGIEGGS ================= */}
        <div className="clip-cyber-panel bg-gradient-to-b from-[#7af2ff] via-[#26b6ff] to-[#56e4ff] p-[2px] shadow-[0_0_32px_rgba(0,174,255,0.48)]">
          <div className="clip-cyber-panel dmo-cyber-matrix-bg flex flex-col overflow-hidden">
            {/* Tray Header */}
            <div className="flex h-8.5 items-center justify-between border-b border-[#3ad5ff]/80 bg-gradient-to-r from-[#062a78] via-[#0c49bf] to-[#062a78] px-3 sm:h-9.5 sm:px-4">
              <div className="flex items-center gap-2">
                <CrackedDigiEggIcon variant="cyan" className="h-4.5 w-4.5" />
                <span className="text-xs font-black italic tracking-wide text-white sm:text-sm">
                  Meus DigiEggs
                </span>
              </div>
              <div className="flex items-center gap-2">
                {totalTrayPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setTrayPage((p) => (p - 1 + totalTrayPages) % totalTrayPages)
                      }
                      aria-label="Página anterior de DigiEggs"
                      className="flex h-5 w-5 items-center justify-center rounded border border-cyan-300/60 bg-[#051e57] text-cyan-100 hover:bg-cyan-700"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[9.5px] font-black tabular-nums text-cyan-200">
                      {safeTrayPage + 1}/{totalTrayPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setTrayPage((p) => (p + 1) % totalTrayPages)
                      }
                      aria-label="Próxima página de DigiEggs"
                      className="flex h-5 w-5 items-center justify-center rounded border border-cyan-300/60 bg-[#051e57] text-cyan-100 hover:bg-cyan-700"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <span className="text-[10px] font-bold tabular-nums text-cyan-200">
                  Inventário: {realDigiEggs.length} tipo(s)
                </span>
              </div>
            </div>

            {/* 5 Pedestal Slots (Real DigiEggs from Inventory + Empty/Locked Slots — zero fake eggs) */}
            <div className="grid grid-cols-5 gap-1.5 p-2 sm:gap-2.5 sm:p-3 [@media(max-height:500px)]:p-1.5">
              {traySlots.map((slot) => {
                if (slot.kind === 'locked') {
                  return (
                    <div
                      key={`locked-${slot.index}`}
                      className="flex min-h-[74px] flex-col items-center justify-center gap-1 rounded-xl border border-slate-600/55 bg-[#030d24]/85 p-1.5 text-center opacity-75 sm:min-h-[96px]"
                    >
                      <Lock className="h-5 w-5 text-slate-400 sm:h-6 sm:w-6" />
                      <span className="text-[8.5px] font-bold leading-tight text-slate-400 sm:text-[10px]">
                        Espaço Bloqueado
                      </span>
                    </div>
                  );
                }

                if (slot.kind === 'empty') {
                  return (
                    <div
                      key={`empty-${slot.index}`}
                      className="relative flex min-h-[74px] flex-col items-center justify-end rounded-xl border border-[#2c82da]/45 bg-gradient-to-b from-[#04143a]/90 to-[#020a21]/95 p-1.5 sm:min-h-[96px]"
                    >
                      <span className="mb-auto mt-2 text-[8.5px] font-bold text-cyan-200/45 sm:text-[9.5px]">
                        Vazio
                      </span>
                      <div className="h-2.5 w-11 rounded-full border border-cyan-400/35 bg-cyan-500/15 shadow-[0_0_10px_rgba(56,232,255,0.2)] sm:w-14" />
                    </div>
                  );
                }

                const egg = slot.item;
                const info = getDigiEggDisplayInfo(egg, hudAccount.inventory);
                const isSelected = selectedEggItem?.id === egg.id;

                return (
                  <button
                    key={egg.id}
                    type="button"
                    disabled={Boolean(processingKind)}
                    onClick={() => handleSelectEgg(egg)}
                    title={`${egg.name} (${info.hatchLevel}/5) · x${egg.quantity}`}
                    className={`relative flex min-h-[74px] flex-col items-center justify-between rounded-xl border p-1.5 transition sm:min-h-[96px] ${
                      isSelected
                        ? 'border-amber-300 bg-gradient-to-b from-[#0e3f9e] to-[#051a4e] shadow-[0_0_18px_rgba(250,204,21,0.5)]'
                        : 'border-[#38bdf8]/65 bg-gradient-to-b from-[#072668] to-[#031033] hover:border-cyan-200'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-1">
                      <span
                        className={`rounded px-1 text-[8px] font-black tabular-nums ${
                          info.hatchLevel >= 5
                            ? 'bg-amber-950/90 text-amber-200'
                            : info.hatchLevel === 4
                              ? 'bg-purple-950/90 text-purple-200'
                              : info.hatchLevel === 3
                                ? 'bg-emerald-950/90 text-emerald-200'
                                : 'bg-[#02091c]/85 text-slate-300'
                        }`}
                      >
                        {info.hatchLevel}/5
                      </span>
                      <span className="rounded bg-[#02091c]/85 px-1 text-[8px] font-black tabular-nums text-cyan-200">
                        x{egg.quantity}
                      </span>
                    </div>
                    {info.iconUrl ? (
                      <img
                        src={info.iconUrl}
                        alt={egg.name}
                        className="h-10 w-10 object-contain drop-shadow-[0_2px_8px_rgba(56,232,255,0.45)] sm:h-12 sm:w-12"
                      />
                    ) : (
                      <DigiEggArtwork
                        accentColor={info.accentColor}
                        sizeClass="h-9 w-9 sm:h-11 sm:w-11"
                      />
                    )}
                    <div className="h-1.5 w-11 rounded-full border border-cyan-300/75 bg-cyan-400/35 shadow-[0_0_10px_rgba(56,232,255,0.55)] sm:w-14" />
                    <span className="w-full truncate text-center text-[8.5px] font-extrabold text-white sm:text-[9.5px]">
                      {egg.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
