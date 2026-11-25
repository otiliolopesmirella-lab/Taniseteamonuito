import { useEffect, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Compass,
  Egg,
  Flame,
  Gift,
  ShoppingBag,
  Sparkles,
  TrainFront,
  X,
  Zap,
} from 'lucide-react';
import {
  AUTO_FARM_VIP_COST_DWCOIN,
  AUTO_FARM_VIP_DURATION_DAYS,
  AUTO_FARM_VIP_XP_BONUS_PCT,
} from '../../services/autoHuntService';
import { MUDFRIGIMON_NPC, RICHARD_SAMPSON_NPC } from '../../sprites/npcSprites';

export interface RichardSampsonTutorialModalProps {
  tamerName: string;
  digimonName: string;
  isPreviewFromGm?: boolean;
  suppliesClaimed: boolean;
  eggPackClaimed: boolean;
  onClaimSuppliesReward: () => boolean;
  onClaimEggReward: () => boolean;
  onComplete: () => void;
  onClose: () => void;
}

type TutorialStepId =
  | 'supplies'
  | 'hatch-demimeramon'
  | 'archive'
  | 'first-map'
  | 'auto-farm';

interface TutorialStepMeta {
  id: TutorialStepId;
  numberLabel: string;
  shortLabel: string;
  kicker: string;
  title: string;
  icon: typeof ShoppingBag;
}

const TUTORIAL_STEPS: readonly TutorialStepMeta[] = [
  {
    id: 'supplies',
    numberLabel: '01',
    shortLabel: 'Suprimentos',
    kicker: 'Boas-vindas · Loja do MudFrigimon',
    title: 'Onde comprar Comidas e Vitaminas',
    icon: ShoppingBag,
  },
  {
    id: 'hatch-demimeramon',
    numberLabel: '02',
    shortLabel: 'Incubadora',
    kicker: 'Laboratório DATS · Chocagem Garantida',
    title: 'Como chocar seu DemiMeramon 3/5',
    icon: Egg,
  },
  {
    id: 'archive',
    numberLabel: '03',
    shortLabel: 'Archive',
    kicker: 'Gestão de Parceiros · DATS Center',
    title: 'Como guardar e trocar seus Digimons',
    icon: Archive,
  },
  {
    id: 'first-map',
    numberLabel: '04',
    shortLabel: '1º Mapa',
    kicker: 'D-Terminal · Planície Digital',
    title: 'Hora de farmar no Primeiro Mapa!',
    icon: Compass,
  },
  {
    id: 'auto-farm',
    numberLabel: '05',
    shortLabel: 'Auto Farm',
    kicker: 'Sistema VIP · +50% EXP Extra',
    title: 'Auto Farm e Bônus de Experiência',
    icon: Zap,
  },
] as const;

const PREMIUM_BREAD_ICON = '/assets/items/consumables/premium_bread.png';
const HIGH_VITAMIN_B_ICON = '/assets/items/consumables/high_vitamin_b.png';
const DEMIMERAMON_EGG_ICON = '/assets/items/digieggs/egg_demimeramon.png';
const DATA_FIRE_ICON = '/assets/items/data/data_fire.png';
const PAWNCHESSMON_ICON =
  '/assets/aistudio/PawnChessmon__28Black_29_dm_84f60933.webp';

const DEMIMERAMON_LINE = [
  {
    stage: 'Rookie',
    name: 'DemiMeramon',
    req: 'Nv. 1',
    portrait: '/assets/digimon/demimeramon.png?v=mh1',
    unlockedBonus: false,
  },
  {
    stage: 'Champion',
    name: 'Meramon',
    req: 'Nv. 15',
    portrait: '/assets/digimon/meramon.png?v=mh1',
    unlockedBonus: false,
  },
  {
    stage: 'Ultimate',
    name: 'SkullMeramon',
    req: 'Nv. 30 · Aberta',
    portrait: '/assets/digimon/skullmeramon.png?v=mh1',
    unlockedBonus: true,
  },
  {
    stage: 'Mega',
    name: 'Boltmon',
    req: 'Nv. 50 · Aberta',
    portrait: '/assets/digimon/boltmon.png?v=mh1',
    unlockedBonus: true,
  },
] as const;

export function RichardSampsonTutorialModal({
  tamerName,
  digimonName,
  isPreviewFromGm = false,
  suppliesClaimed,
  eggPackClaimed,
  onClaimSuppliesReward,
  onClaimEggReward,
  onComplete,
  onClose,
}: RichardSampsonTutorialModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [previewSuppliesClaimed, setPreviewSuppliesClaimed] = useState(false);
  const [previewEggClaimed, setPreviewEggClaimed] = useState(false);
  const [justClaimedBanner, setJustClaimedBanner] = useState<string | null>(
    null
  );

  const totalSteps = TUTORIAL_STEPS.length;
  const currentStep = TUTORIAL_STEPS[stepIndex] ?? TUTORIAL_STEPS[0];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const StepIcon = currentStep.icon;

  const isSuppliesDone = isPreviewFromGm
    ? previewSuppliesClaimed
    : suppliesClaimed;
  const isEggDone = isPreviewFromGm ? previewEggClaimed : eggPackClaimed;

  useEffect(() => {
    setJustClaimedBanner(null);
  }, [stepIndex]);

  function handleClaimSupplies() {
    if (isSuppliesDone) return;
    if (isPreviewFromGm) {
      setPreviewSuppliesClaimed(true);
      setJustClaimedBanner(
        'Simulação GM: 200× Premium Bread + 200× High Vitamin B entregues.'
      );
      return;
    }
    const ok = onClaimSuppliesReward();
    if (ok) {
      setJustClaimedBanner(
        'Presente entregue! 200× Premium Bread e 200× High Vitamin B já estão na sua Mochila.'
      );
    }
  }

  function handleClaimEggPack() {
    if (isEggDone) return;
    if (isPreviewFromGm) {
      setPreviewEggClaimed(true);
      setJustClaimedBanner(
        'Simulação GM: 1× DigiEgg DemiMeramon (3/5 Garantido) + 21× DATA FIRE entregues.'
      );
      return;
    }
    const ok = onClaimEggReward();
    if (ok) {
      setJustClaimedBanner(
        'Presente entregue! Seu DigiEgg DemiMeramon (3/5 Garantido) e 21× DATA FIRE já estão na sua Mochila.'
      );
    }
  }

  function handleNextStep() {
    // Auto-deliver step gifts when advancing so no beginner leaves empty-handed
    if (currentStep.id === 'supplies' && !isSuppliesDone && !isPreviewFromGm) {
      onClaimSuppliesReward();
    } else if (
      currentStep.id === 'hatch-demimeramon' &&
      !isEggDone &&
      !isPreviewFromGm
    ) {
      onClaimEggReward();
    }
    setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
  }

  function handleFinishTutorial() {
    if (!isPreviewFromGm) {
      if (!suppliesClaimed) onClaimSuppliesReward();
      if (!eggPackClaimed) onClaimEggReward();
    }
    onComplete();
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight' && stepIndex < totalSteps - 1) {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === 'ArrowLeft' && stepIndex > 0) {
        e.preventDefault();
        setStepIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const progressRatio = (stepIndex + 1) / totalSteps;

  const primaryNextLabel =
    currentStep.id === 'supplies' && !isSuppliesDone
      ? 'Receber Kit e Avançar'
      : currentStep.id === 'hatch-demimeramon' && !isEggDone
        ? 'Receber Ovo + DATA e Avançar'
        : 'Próximo';

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Guia Inicial DATS com Comandante Richard Sampson"
      className="pointer-events-auto fixed inset-0 z-[68] flex items-center justify-center bg-[#020817]/82 p-2.5 backdrop-blur-sm select-none sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window relative flex max-h-[93dvh] w-full max-w-[820px] flex-col overflow-hidden rounded-2xl border border-cyan-300/40 bg-[#05122e] shadow-[0_24px_80px_rgba(2,8,28,0.88),0_0_36px_rgba(34,211,238,0.22)]"
      >
        {/* Subtle Luminous Top Accent Line */}
        <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300" />

        {/* Clean Top Header */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-cyan-400/20 bg-[#06183d]/95 px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-cyan-300/90">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-300" />
              <span>GUIA RÁPIDO DO INICIANTE · DATS CENTER</span>
              {isPreviewFromGm && (
                <span className="text-amber-300">· MODO VISUALIZAÇÃO GM</span>
              )}
            </div>
            <h2 className="mt-0.5 truncate text-base font-black tracking-tight text-white sm:text-lg">
              Boas-vindas com o Comandante Richard Sampson
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs font-bold text-sky-200/80 tabular-nums sm:inline">
              Passo {stepIndex + 1} de {totalSteps}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar guia"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-500/40 bg-slate-900/80 text-slate-200 transition hover:border-cyan-300/60 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Smooth Progress Bar + Mobile Step Bar */}
        <div className="shrink-0 bg-[#040e24] px-4 py-2.5 sm:px-6">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/90">
            <div
              className="h-full origin-left rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 transition-transform duration-300 ease-out"
              style={{ transform: `scaleX(${progressRatio})` }}
            />
          </div>

          <nav
            aria-label="Etapas do tutorial"
            className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5"
          >
            {TUTORIAL_STEPS.map((step, idx) => {
              const isCurrent = idx === stepIndex;
              const isDone = idx < stepIndex;
              const hasClaimedGift =
                (step.id === 'supplies' && isSuppliesDone) ||
                (step.id === 'hatch-demimeramon' && isEggDone);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setStepIndex(idx)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`flex min-h-[36px] shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-bold whitespace-nowrap transition duration-150 focus-visible:outline-2 focus-visible:outline-cyan-300 ${
                    isCurrent
                      ? 'border-cyan-300/80 bg-cyan-400/16 text-white shadow-[0_0_16px_rgba(34,211,238,0.18)]'
                      : isDone
                        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-300/60'
                        : 'border-slate-700/80 bg-slate-900/65 text-slate-300 hover:border-cyan-400/40 hover:text-white'
                  }`}
                >
                  <span className="tabular-nums font-black opacity-85">
                    {step.numberLabel}
                  </span>
                  <span>{step.shortLabel}</span>
                  {hasClaimedGift && (
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Scrollable Content Stage */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[205px_1fr]">
            {/* Left Column: Commander Richard Sampson Stage */}
            <aside className="flex flex-row items-center gap-3.5 rounded-2xl border border-cyan-400/20 bg-[radial-gradient(circle_at_50%_22%,rgba(14,165,233,0.22),rgba(4,14,36,0.96)_76%)] p-3.5 md:flex-col md:items-stretch md:justify-between md:p-4">
              <div className="relative flex h-24 w-20 shrink-0 items-end justify-center overflow-hidden rounded-xl border border-cyan-300/25 bg-[#030b21] md:h-60 md:w-full">
                <img
                  src={RICHARD_SAMPSON_NPC.spriteUrl}
                  alt={RICHARD_SAMPSON_NPC.name}
                  referrerPolicy="no-referrer"
                  className="h-[95%] w-auto object-contain object-bottom drop-shadow-[0_10px_18px_rgba(0,0,0,0.85)]"
                />
              </div>

              <div className="min-w-0 flex-1 md:flex-none md:text-center">
                <p className="truncate text-sm font-black tracking-wide text-amber-300">
                  {RICHARD_SAMPSON_NPC.name}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-cyan-200/85">
                  {RICHARD_SAMPSON_NPC.title}
                </p>
                <div className="mt-3 hidden space-y-1 border-t border-cyan-400/15 pt-3 text-xs text-slate-300 md:block">
                  <p className="truncate">
                    Tamer:{' '}
                    <span className="font-bold text-white">{tamerName}</span>
                  </p>
                  <p className="truncate">
                    Parceiro:{' '}
                    <span className="font-bold text-amber-200">
                      {digimonName}
                    </span>
                  </p>
                </div>
              </div>
            </aside>

            {/* Right Column: Focused Calm Lesson + Interactive Rewards */}
            <section className="flex min-w-0 flex-col gap-4">
              {/* Step Title & Speech */}
              <div className="rounded-2xl border border-cyan-300/20 bg-[#081a40]/85 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <StepIcon className="h-4 w-4 shrink-0 text-amber-300" />
                  <span>{currentStep.kicker}</span>
                </div>
                <h3 className="mt-1.5 text-lg font-black leading-snug text-white [text-wrap:balance] sm:text-xl">
                  {currentStep.title}
                </h3>

                {/* Step-specific Dialogue */}
                {currentStep.id === 'supplies' && (
                  <p className="mt-2.5 text-sm leading-relaxed text-sky-50/95">
                    “Bem-vindo à DATS, <strong className="text-white">{tamerName}</strong>! Fique tranquilo — nosso guia é rápido. Sempre que você e{' '}
                    <strong className="text-amber-200">{digimonName}</strong> precisarem de comidas de HP ou vitaminas de DS, basta falar com o{' '}
                    <strong className="text-cyan-200">MudFrigimon</strong> aqui no DATS Center. Para você começar bem equipado, pegue este kit com as{' '}
                    <strong className="text-emerald-300">melhores comidas e vitaminas da loja</strong>!”
                  </p>
                )}

                {currentStep.id === 'hatch-demimeramon' && (
                  <p className="mt-2.5 text-sm leading-relaxed text-sky-50/95">
                    “Para conseguir novos parceiros, leve um DigiEgg e a DATA dele até a{' '}
                    <strong className="text-cyan-200">Incubadora do DATS</strong> e injete DATA até atingir 3/5 (ou mais). Estou te dando{' '}
                    <strong className="text-amber-300">1 DigiEgg de DemiMeramon 3/5 garantido</strong> e exatamente{' '}
                    <strong className="text-orange-300">21× DATA FIRE</strong> (3 injeções de 7). O melhor: este DemiMeramon do tutorial{' '}
                    <strong className="text-emerald-300">já nasce com a Ultimate e a Mega desbloqueadas</strong> — sem precisar de Evoluters!”
                  </p>
                )}

                {currentStep.id === 'archive' && (
                  <p className="mt-2.5 text-sm leading-relaxed text-sky-50/95">
                    “Assim que você chocar seu DemiMeramon, ele vai direto para o{' '}
                    <strong className="text-cyan-200">Digimon Archive</strong>, a máquina bem ao lado da Incubadora no DATS. Lá você guarda quantos Digimons quiser com total segurança e escolhe quais levar com você na sua equipe.”
                  </p>
                )}

                {currentStep.id === 'first-map' && (
                  <p className="mt-2.5 text-sm leading-relaxed text-sky-50/95">
                    “Tudo pronto para a ação! Atravesse o portal ao sul do DATS para chegar ao{' '}
                    <strong className="text-cyan-200">D-Terminal</strong>, fale com o{' '}
                    <strong className="text-amber-300">Condutor PawnChessmon (Black)</strong> na frente do trem e embarque para a{' '}
                    <strong className="text-emerald-300">Planície Digital (Nv. 1–10)</strong> — seu primeiro mapa de farm!”
                  </p>
                )}

                {currentStep.id === 'auto-farm' && (
                  <p className="mt-2.5 text-sm leading-relaxed text-sky-50/95">
                    “Uma última dica importante, <strong className="text-white">{tamerName}</strong>: se quiser evoluir ainda mais rápido e com conforto, o jogo conta com o sistema de{' '}
                    <strong className="text-amber-300">Auto Farm</strong>. Ele caça, usa skills e recupera HP/DS sozinho — e enquanto estiver ativado, você ganha{' '}
                    <strong className="text-emerald-300">+{AUTO_FARM_VIP_XP_BONUS_PCT}% de EXP extra</strong> em todos os combates!”
                  </p>
                )}
              </div>

              {/* Claim Feedback Banner */}
              {justClaimedBanner && (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/45 bg-emerald-500/15 px-4 py-2.5 text-xs font-bold text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                  <span>{justClaimedBanner}</span>
                </div>
              )}

              {/* STEP 01 VISUAL: MudFrigimon + 200 Premium Bread + 200 High Vitamin B */}
              {currentStep.id === 'supplies' && (
                <div className="space-y-3">
                  {/* Reward Box */}
                  <div className="rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-[#082442] to-[#061830] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-extrabold tracking-wide text-emerald-300 uppercase">
                        <Gift className="h-4 w-4" />
                        <span>Presente de Boas-Vindas</span>
                      </div>
                      <span className="text-xs font-bold text-sky-200/80">
                        Itens Épicos · Máxima Recuperação
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* 200x Premium Bread */}
                      <div className="flex items-center gap-3 rounded-xl border border-amber-300/30 bg-[#051229]/90 p-3">
                        <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-xl border border-amber-300/45 bg-[#0c1d3d] p-1.5">
                          <img
                            src={PREMIUM_BREAD_ICON}
                            alt="Premium Bread"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-white tabular-nums">
                            200× Premium Bread
                          </p>
                          <p className="text-xs font-bold text-emerald-300">
                            +1.600 HP por uso
                          </p>
                          <p className="text-[11px] text-slate-300">
                            A melhor comida de HP da loja
                          </p>
                        </div>
                      </div>

                      {/* 200x High Vitamin B */}
                      <div className="flex items-center gap-3 rounded-xl border border-cyan-300/30 bg-[#051229]/90 p-3">
                        <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-xl border border-cyan-300/45 bg-[#0c1d3d] p-1.5">
                          <img
                            src={HIGH_VITAMIN_B_ICON}
                            alt="High Vitamin B"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-white tabular-nums">
                            200× High Vitamin B
                          </p>
                          <p className="text-xs font-bold text-cyan-300">
                            +800 DS por uso
                          </p>
                          <p className="text-[11px] text-slate-300">
                            A melhor vitamina de DS da loja
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-cyan-400/15 pt-3">
                      <div className="flex items-center gap-2.5 text-xs text-sky-100/90">
                        <img
                          src={MUDFRIGIMON_NPC.spriteUrl}
                          alt="NPC MudFrigimon"
                          className="h-9 w-9 shrink-0 rounded-lg border border-cyan-300/35 bg-[#04112b] object-contain p-0.5"
                        />
                        <span>
                          Precisou repor? Compre mais com Bits no{' '}
                          <strong className="text-white">MudFrigimon</strong> no DATS.
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isSuppliesDone}
                        onClick={handleClaimSupplies}
                        className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-black transition active:scale-95 ${
                          isSuppliesDone
                            ? 'cursor-default border border-emerald-400/45 bg-emerald-500/20 text-emerald-200'
                            : 'border border-emerald-200/70 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:brightness-110'
                        }`}
                      >
                        {isSuppliesDone ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Kit Recebido</span>
                          </>
                        ) : (
                          <>
                            <Gift className="h-4 w-4" />
                            <span>Receber 200 + 200 Agora</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 02 VISUAL: DemiMeramon 3/5 Egg + 21x DATA FIRE + Pre-Unlocked Evolution Line */}
              {currentStep.id === 'hatch-demimeramon' && (
                <div className="space-y-3">
                  {/* Reward Card */}
                  <div className="rounded-2xl border border-orange-400/35 bg-gradient-to-br from-[#231426] via-[#131736] to-[#07152e] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-extrabold tracking-wide text-amber-300 uppercase">
                        <Flame className="h-4 w-4 text-orange-400" />
                        <span>Presente de Chocagem · 100% Garantido até 3/5</span>
                      </div>
                      <span className="text-xs font-bold text-orange-200/90 tabular-nums">
                        3 injeções × 7 = 21 DATA FIRE
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* 1x DemiMeramon 3/5 Egg */}
                      <div className="flex items-center gap-3 rounded-xl border border-orange-400/35 bg-[#091228]/90 p-3">
                        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl border border-orange-300/50 bg-[#1a1326] p-1.5">
                          <img
                            src={DEMIMERAMON_EGG_ICON}
                            alt="DigiEgg DemiMeramon"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-white">
                            1× Ovo DemiMeramon
                          </p>
                          <p className="text-xs font-bold text-amber-300">
                            3/5 Garantido (0% quebra)
                          </p>
                          <p className="text-[11px] text-emerald-300 font-semibold">
                            Ultimate & Mega já abertas!
                          </p>
                        </div>
                      </div>

                      {/* 21x DATA FIRE */}
                      <div className="flex items-center gap-3 rounded-xl border border-amber-300/30 bg-[#091228]/90 p-3">
                        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl border border-amber-300/45 bg-[#1a1326] p-1.5">
                          <img
                            src={DATA_FIRE_ICON}
                            alt="DATA FIRE"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-white tabular-nums">
                            21× DATA FIRE
                          </p>
                          <p className="text-xs font-bold text-orange-300">
                            Quantidade exata para 3/5
                          </p>
                          <p className="text-[11px] text-slate-300">
                            0/5 → 1/5 → 2/5 → 3/5 e Chocar!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Evolution Line Strip highlighting Pre-Unlocked Ultimate & Mega */}
                    <div className="mt-3.5 rounded-xl border border-cyan-400/20 bg-[#051026]/90 p-3">
                      <p className="text-[11px] font-extrabold tracking-wide text-cyan-200 uppercase">
                        Linha Evolutiva Especial (sem gastar Evoluters)
                      </p>
                      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {DEMIMERAMON_LINE.map((form) => (
                          <div
                            key={form.name}
                            className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                              form.unlockedBonus
                                ? 'border-emerald-400/40 bg-emerald-500/10'
                                : 'border-slate-700/80 bg-slate-900/70'
                            }`}
                          >
                            <img
                              src={form.portrait}
                              alt={form.name}
                              className="h-9 w-9 shrink-0 rounded-md bg-[#040c1f] object-contain p-0.5"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-black text-white">
                                {form.name}
                              </p>
                              <p
                                className={`truncate text-[10px] font-bold ${
                                  form.unlockedBonus
                                    ? 'text-emerald-300'
                                    : 'text-slate-300'
                                }`}
                              >
                                {form.req}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-orange-300/15 pt-3">
                      <p className="text-xs text-slate-200">
                        Vá até a <strong className="text-white">Incubadora no DATS</strong>, insira a DATA FIRE 3 vezes e clique em <strong className="text-amber-300">Chocar</strong>.
                      </p>
                      <button
                        type="button"
                        disabled={isEggDone}
                        onClick={handleClaimEggPack}
                        className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-black transition active:scale-95 ${
                          isEggDone
                            ? 'cursor-default border border-emerald-400/45 bg-emerald-500/20 text-emerald-200'
                            : 'border border-amber-200/80 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 text-slate-950 shadow-[0_0_20px_rgba(251,146,60,0.4)] hover:brightness-110'
                        }`}
                      >
                        {isEggDone ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Ovo + DATA Recebidos</span>
                          </>
                        ) : (
                          <>
                            <Egg className="h-4 w-4" />
                            <span>Receber Ovo + 21 DATA</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 03 VISUAL: Digimon Archive & Reserve Team */}
              {currentStep.id === 'archive' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-cyan-400/25 bg-[#07183a]/90 p-4">
                    <p className="text-xs font-black tracking-wide text-cyan-300 uppercase">
                      1. Estação Digimon Archive
                    </p>
                    <p className="mt-1.5 text-sm font-bold text-white">
                      Guarde seus Digimons no DATS
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-200">
                      Todo Digimon chocado aparece no <strong className="text-white">Digimon Archive</strong> (ao lado da Incubadora). Clique na máquina para enviar para a sua equipe ou guardar quando quiser — nível, apelido e evoluções ficam sempre salvos.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-300/25 bg-[#07183a]/90 p-4">
                    <p className="text-xs font-black tracking-wide text-amber-300 uppercase">
                      2. Equipe de até 3 Parceiros
                    </p>
                    <p className="mt-1.5 text-sm font-bold text-white">
                      1 Ativo + 2 na Reserva
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-200">
                      No canto esquerdo da tela ficam seus slots de equipe. Depois de puxar seu <strong className="text-amber-200">DemiMeramon</strong> do Archive para a reserva, basta clicar nele para alternar de parceiro em campo na hora!
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 04 VISUAL: DATS -> D-Terminal (PawnChessmon) -> Planície Digital */}
              {currentStep.id === 'first-map' && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-cyan-400/25 bg-[#07183a]/90 p-4">
                    <div className="flex items-center gap-2 text-xs font-black tracking-wide text-cyan-300 uppercase">
                      <TrainFront className="h-4 w-4 text-amber-300" />
                      <span>Rota para o seu Primeiro Farm</span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-700/80 bg-[#051029] p-3">
                        <p className="text-[11px] font-black text-cyan-300 tabular-nums">
                          PASSO 1
                        </p>
                        <p className="mt-1 text-xs font-extrabold text-white">
                          Portal Sul do DATS
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                          Caminhe até o portal na parte de baixo do DATS Center para entrar no D-Terminal.
                        </p>
                      </div>

                      <div className="rounded-xl border border-amber-300/35 bg-[#051029] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-black text-amber-300 tabular-nums">
                            PASSO 2
                          </p>
                          <img
                            src={PAWNCHESSMON_ICON}
                            alt="PawnChessmon Black"
                            className="h-7 w-7 object-contain"
                          />
                        </div>
                        <p className="mt-0.5 text-xs font-extrabold text-white">
                          Fale com PawnChessmon
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                          No D-Terminal, converse com o Condutor na frente do trem e escolha a Planície Digital.
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-400/35 bg-[#051029] p-3">
                        <p className="text-[11px] font-black text-emerald-300 tabular-nums">
                          PASSO 3
                        </p>
                        <p className="mt-1 text-xs font-extrabold text-white">
                          Planície Digital (Nv. 1–10)
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                          Clique nos mobs para atacar, use F1/F2 e siga os portais para avançar aos próximos mapas!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 05 VISUAL: Auto Farm VIP (+50% EXP & 20 DL Din) */}
              {currentStep.id === 'auto-farm' && (
                <div className="rounded-2xl border border-amber-300/40 bg-gradient-to-br from-[#1f1b33] via-[#0c1b3e] to-[#061530] p-4 sm:p-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* +50% EXP Highlight */}
                    <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/12 p-4">
                      <p className="text-[11px] font-extrabold tracking-wide text-emerald-300 uppercase">
                        Vantagem Exclusiva Ativa
                      </p>
                      <p className="mt-1 text-3xl font-black tracking-tight text-emerald-200 tabular-nums">
                        +{AUTO_FARM_VIP_XP_BONUS_PCT}% EXP
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-emerald-50/90">
                        Enquanto o Auto Farm estiver ligado, você e seu Digimon recebem{' '}
                        <strong>{AUTO_FARM_VIP_XP_BONUS_PCT}% a mais de experiência</strong> em todo Digimon derrotado!
                      </p>
                    </div>

                    {/* Cost Highlight */}
                    <div className="rounded-xl border border-amber-300/40 bg-amber-400/10 p-4">
                      <p className="text-[11px] font-extrabold tracking-wide text-amber-300 uppercase">
                        Acesso de {AUTO_FARM_VIP_DURATION_DAYS} Dias
                      </p>
                      <p className="mt-1 text-3xl font-black tracking-tight text-amber-200 tabular-nums">
                        {AUTO_FARM_VIP_COST_DWCOIN} DL Din
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-amber-50/90">
                        Duração de <strong>{AUTO_FARM_VIP_DURATION_DAYS} dias (R$ {AUTO_FARM_VIP_COST_DWCOIN})</strong>. Após os {AUTO_FARM_VIP_DURATION_DAYS} dias, basta renovar pelo botão{' '}
                        <strong>Auto</strong> na barra inferior.
                      </p>
                    </div>
                  </div>

                  <p className="mt-3.5 text-xs leading-relaxed text-sky-100/90">
                    Com o Auto Farm ligado, seu Digimon busca alvos automaticamente, dispara F1/F2 e usa suas comidas de HP e vitaminas de DS sozinho quando precisar.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Clean Footer Controls */}
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-t border-cyan-400/20 bg-[#040f26] px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl border border-slate-600/60 bg-slate-900/75 px-4 text-xs font-bold text-slate-300 whitespace-nowrap transition hover:border-cyan-400/50 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300 active:scale-95"
          >
            {isPreviewFromGm ? 'Fechar Visualização' : 'Fechar Depois'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-cyan-400/35 bg-[#09204d] px-4 text-xs font-extrabold text-white whitespace-nowrap transition hover:bg-[#0e2d6b] focus-visible:outline-2 focus-visible:outline-cyan-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={handleFinishTutorial}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 px-5 text-xs font-black text-slate-950 whitespace-nowrap shadow-[0_0_22px_rgba(251,191,36,0.45)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-amber-200 active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {isPreviewFromGm
                    ? 'Concluir Revisão'
                    : 'Começar Minha Aventura!'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-cyan-200/80 bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-300 px-5 text-xs font-black text-slate-950 whitespace-nowrap shadow-[0_0_20px_rgba(56,189,248,0.4)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-cyan-200 active:scale-95"
              >
                <span>{primaryNextLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
