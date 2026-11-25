import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Backpack,
  BookOpen,
  CheckCircle2,
  Compass,
  Egg,
  Map as MapIcon,
  ShieldCheck,
  Sparkles,
  Swords,
  Users,
  X,
} from 'lucide-react';
import { EVOLUTER_ICON_URL } from '../../data/itemsCatalog';
import { RICHARD_SAMPSON_NPC } from '../../sprites/npcSprites';

export interface RichardSampsonTutorialModalProps {
  tamerName: string;
  digimonName: string;
  digimonPortraitUrl?: string;
  isPreviewFromGm?: boolean;
  onComplete: () => void;
  onClose: () => void;
}

interface TutorialStepSpec {
  id: string;
  numberLabel: string;
  kicker: string;
  title: string;
  speech: (tamerName: string, digimonName: string) => string;
  highlights: ReadonlyArray<{
    label: string;
    detail: string;
    accent?: 'cyan' | 'amber' | 'fuchsia' | 'emerald';
  }>;
  tip: string;
  icon: typeof ShieldCheck;
  showEvoluterShowcase?: boolean;
  showDigimonShowcase?: boolean;
}

const TUTORIAL_STEPS: readonly TutorialStepSpec[] = [
  {
    id: 'welcome-dats',
    numberLabel: '01',
    kicker: 'Quartel-General · DATS Center',
    title: 'Bem-vindo à DATS, Tamer!',
    speech: (tamerName, digimonName) =>
      `Atenção, ${tamerName}! Eu sou Richard Sampson, Comandante da DATS. Você e ${digimonName} agora fazem parte da nossa equipe de elite. Aqui no DATS Center é sua base segura — antes de sair em missão, vou te ensinar tudo o que você precisa para começar forte.`,
    highlights: [
      {
        label: 'Movimentação',
        detail:
          'Ande usando WASD, Setas do teclado, clicando diretamente no chão ou pelo controle virtual no celular.',
        accent: 'cyan',
      },
      {
        label: 'Interação no DATS',
        detail:
          'Aproxime-se dos NPCs e estações (Incubadora, Archive, Portal) e pressione E ou clique diretamente neles.',
        accent: 'amber',
      },
      {
        label: 'Zona Segura',
        detail:
          'Nenhum Digimon selvagem ataca dentro do DATS. Sempre retorne pelo Portal quando precisar se preparar.',
        accent: 'emerald',
      },
    ],
    tip: 'Você pode falar comigo no DATS sempre que quiser revisar este treinamento.',
    icon: ShieldCheck,
    showDigimonShowcase: true,
  },
  {
    id: 'combat-skills',
    numberLabel: '02',
    kicker: 'Treinamento Tático · Combate',
    title: 'Batalhas, F1/F2 e Atributos',
    speech: (_tamerName, digimonName) =>
      `Nas áreas de caça, clique ou toque em um Digimon selvagem para travar o alvo. ${digimonName} vai avançar e atacar automaticamente, mas a vitória rápida depende de você ativar as habilidades especiais na hora certa!`,
    highlights: [
      {
        label: 'Habilidades F1 e F2',
        detail:
          'Pressione F1 ou F2 (ou toque nos ícones na barra inferior) para disparar golpes especiais. Eles consomem DS e têm tempo de recarga.',
        accent: 'cyan',
      },
      {
        label: 'Vantagem de Atributo',
        detail:
          'Vaccine vence Virus · Virus vence Data · Data vence Vaccine. Fique de olho no ícone de atributo do inimigo!',
        accent: 'amber',
      },
      {
        label: 'Atenção ao HP e DS',
        detail:
          'Acompanhe as barras de vida (HP) e energia (DS) no topo da tela para nunca ser derrotado no meio de uma luta.',
        accent: 'emerald',
      },
    ],
    tip: 'Cada abate gera EXP para você (Tamer) e para o seu Digimon, além de Bits e itens no inventário.',
    icon: Swords,
  },
  {
    id: 'maps-raid',
    numberLabel: '03',
    kicker: 'Exploração · Mundo Digital',
    title: 'Mapas de Caça e Boss Raid',
    speech: () =>
      `Use o Portal Digital aqui no DATS para viajar entre os mapas. Cada região exige um nível mínimo e oferece inimigos mais fortes, mais experiência e drops raros.`,
    highlights: [
      {
        label: 'Planície Digital · Nv. 1–10',
        detail:
          'Sua primeira área de caça! Ideal para subir os primeiros níveis, juntar Bits e coletar DATAs e DigiEggs iniciais.',
        accent: 'cyan',
      },
      {
        label: 'Floresta de Dados · Nv. 10–20',
        detail:
          'Liberada no Nv. 10+. Abriga o temível Boss Raid Kuwagamon (Nv. 20) na Grande Árvore, que renasce a cada 1 hora!',
        accent: 'amber',
      },
      {
        label: 'Montanha Digi · Nv. 20–30',
        detail:
          'Liberada no Nv. 20+. Território avançado de Digimons Champion para farm pesado de EXP e DATAs.',
        accent: 'emerald',
      },
    ],
    tip: 'No Boss Raid Kuwagamon, todos que ajudarem ganham EXP e Bits — mas os 5 maiores causadores de dano disputam o drop especial de Evoluter!',
    icon: MapIcon,
  },
  {
    id: 'evolution-evoluter',
    numberLabel: '04',
    kicker: 'Poder Digital · Digievolução',
    title: 'Evoluções e Evoluters',
    speech: () =>
      `À medida que seu Digimon sobe de nível, novas formas são alcançadas na barra inferior: Champion (Nv. 15), Ultimate (Nv. 30) e Mega (Nv. 50). Mas atenção à diferença entre iniciais e mercenários!`,
    highlights: [
      {
        label: 'Iniciais Savers · Grátis',
        detail:
          'Agumon (Savers), Gaomon e Lalamon evoluem gratuitamente apenas atingindo o nível necessário.',
        accent: 'emerald',
      },
      {
        label: 'Digimons Mercenários · Evoluter',
        detail:
          'Champion é grátis. Ultimate exige 3 Evoluters e Mega exige 6 ou 8 Evoluters (desbloqueio permanente para aquele Digimon!).',
        accent: 'fuchsia',
      },
      {
        label: 'Onde conseguir Evoluters',
        detail:
          'Dropam no Boss Raid Kuwagamon (10% exclusivo para o Top 5 de dano) e em qualquer Digimon selvagem (0,1%).',
        accent: 'amber',
      },
    ],
    tip: 'Depois de desbloquear uma forma com Evoluters, evoluir e reverter passa a ser 100% gratuito naquele Digimon.',
    icon: Sparkles,
    showEvoluterShowcase: true,
  },
  {
    id: 'incubator-eggs',
    numberLabel: '05',
    kicker: 'Laboratório DATS · Incubadora',
    title: 'Chocar Novos Digimons (DigiEggs)',
    speech: () =>
      `Quer montar um time lendário? Derrotando inimigos você pode dropar DigiEggs e DATAs elementais. Traga-os até a Incubadora no DATS Center para chocar novos parceiros!`,
    highlights: [
      {
        label: 'Injeção de DATA',
        detail:
          'Coloque o DigiEgg na Incubadora e injete DATA correspondente para subir a fase do ovo até 3/5, 4/5 ou 5/5.',
        accent: 'cyan',
      },
      {
        label: 'Qualidade 3/5 · 4/5 · 5/5',
        detail:
          'Você já pode chocar a partir de 3/5, mas ovos 4/5 e 5/5 nascem maiores e com muito mais bônus de atributos!',
        accent: 'amber',
      },
      {
        label: 'Apresentação & Apelido',
        detail:
          'Ao chocar, você verá a linha evolutiva completa do seu novo parceiro e poderá escolher um apelido personalizado.',
        accent: 'emerald',
      },
    ],
    tip: 'Cuidado: injetar DATA acima de 3/5 tem risco de quebra. Decida quando parar ou arriscar pelo lendário 5/5!',
    icon: Egg,
  },
  {
    id: 'party-archive',
    numberLabel: '06',
    kicker: 'Gestão de Esquadrão · Archive',
    title: 'Equipe de Reserva e Digimon Archive',
    speech: () =>
      `Um bom Tamer sabe alternar parceiros conforme o inimigo. Você pode levar até 3 Digimons com você e guardar os demais com segurança no Digimon Archive aqui no DATS.`,
    highlights: [
      {
        label: 'Troca Rápida na Equipe',
        detail:
          'Leve 1 Digimon ativo + 2 na reserva (painel lateral esquerdo). Clique em um reserva para trocar em campo instantaneamente.',
        accent: 'cyan',
      },
      {
        label: 'Digimon Archive no DATS',
        detail:
          'Visite a estação Archive no DATS para armazenar Digimons extras e reorganizar sua equipe principal.',
        accent: 'amber',
      },
    ],
    tip: 'Cada Digimon mantém seu próprio nível, qualidade de choque, apelido e evoluções desbloqueadas ao ser guardado.',
    icon: Users,
  },
  {
    id: 'shop-inventory-ready',
    numberLabel: '07',
    kicker: 'Suprimentos · Pronto para Missão',
    title: 'MudFrigimon, Inventário e Partida!',
    speech: (tamerName) =>
      `Por fim, visite o NPC MudFrigimon aqui no DATS sempre que precisar comprar comidas de HP e vitaminas de DS com seus Bits. Seu treinamento básico está completo, ${tamerName} — boa caçada no Mundo Digital!`,
    highlights: [
      {
        label: 'Loja do MudFrigimon',
        detail:
          'Compre pães e vitaminas por Bits para recuperar HP e DS rapidamente durante longas caçadas.',
        accent: 'emerald',
      },
      {
        label: 'Inventário e Menu [I]',
        detail:
          'Abra a mochila pelo botão MENU no canto inferior direito (ou tecla I) para usar consumíveis, checar DATAs e equipar itens.',
        accent: 'cyan',
      },
      {
        label: 'Primeira Missão Sugerida',
        detail:
          'Atravesse o Portal Digital para a Planície Digital, alcance o Nível 15 para sua primeira evolução e prepare-se para a Floresta de Dados!',
        accent: 'amber',
      },
    ],
    tip: 'Dica final: use o Minimapa ou o Mapa-Múndi [M] para localizar portais, áreas seguras e o Boss Raid.',
    icon: Backpack,
  },
];

const ACCENT_STYLES = {
  cyan: {
    border: 'border-cyan-400/35',
    title: 'text-cyan-200',
  },
  amber: {
    border: 'border-amber-300/40',
    title: 'text-amber-200',
  },
  fuchsia: {
    border: 'border-fuchsia-300/45',
    title: 'text-fuchsia-200',
  },
  emerald: {
    border: 'border-emerald-300/40',
    title: 'text-emerald-200',
  },
} as const;

export function RichardSampsonTutorialModal({
  tamerName,
  digimonName,
  digimonPortraitUrl,
  isPreviewFromGm = false,
  onComplete,
  onClose,
}: RichardSampsonTutorialModalProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const totalSteps = TUTORIAL_STEPS.length;
  const currentStep = TUTORIAL_STEPS[stepIndex] ?? TUTORIAL_STEPS[0];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const StepIcon = currentStep.icon;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setStepIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, totalSteps]);

  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial de Iniciante com Comandante Richard Sampson"
      className="pointer-events-auto fixed inset-0 z-[68] flex items-center justify-center bg-[#020715]/82 p-2.5 backdrop-blur-sm select-none sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window relative flex max-h-[93dvh] w-full max-w-[740px] flex-col"
      >
        {/* Top-Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar tutorial"
          className="absolute -right-1 -top-1 z-30 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#8ef2ff] bg-gradient-to-b from-[#ef4444] via-[#b91c1c] to-[#7f1d1d] text-white shadow-[0_0_16px_rgba(56,232,255,0.65)] transition duration-150 hover:brightness-115 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 active:scale-95"
        >
          <X className="h-5 w-5 stroke-[3]" />
        </button>

        {/* Outer Cyber Frame */}
        <div className="clip-cyber-panel flex max-h-[93dvh] flex-col bg-gradient-to-b from-[#7af2ff] via-[#1ea7ff] to-[#56e4ff] p-[2px] shadow-[0_0_46px_rgba(0,165,255,0.52)]">
          <div className="clip-cyber-panel flex max-h-[calc(93dvh-4px)] flex-col overflow-hidden bg-[radial-gradient(circle_at_15%_18%,rgba(14,72,184,0.96)_0%,rgba(6,24,82,0.98)_50%,rgba(3,12,42,0.99)_100%)]">
            {/* Header Bar */}
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-cyan-300/40 bg-gradient-to-r from-[#06256b] via-[#0c48be] to-[#06256b] px-4 py-3 pr-12">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-300/75 bg-[#04184a] text-cyan-200">
                  <BookOpen className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-black tracking-wide text-white sm:text-base">
                    Treinamento Inicial DATS
                  </h2>
                  <p className="truncate text-[11px] font-semibold text-cyan-200/90">
                    Comandante Richard Sampson
                    <span aria-hidden="true"> · </span>
                    Etapa{' '}
                    <span className="tabular-nums font-extrabold text-amber-300">
                      {currentStep.numberLabel}/{String(totalSteps).padStart(2, '0')}
                    </span>
                    {isPreviewFromGm && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span className="text-amber-200">Visualização do Painel GM</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="hidden shrink-0 items-center gap-2 text-xs font-bold text-cyan-100/90 sm:flex">
                <span className="tabular-nums">{progressPct}%</span>
              </div>
            </header>

            {/* Step Progress Track + Quick Chapter Selector */}
            <div className="shrink-0 border-b border-cyan-400/20 bg-[#041136]/95 px-4 py-2.5">
              <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-900/90">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 transition-transform duration-200 origin-left"
                  style={{ transform: `scaleX(${progressPct / 100})` }}
                />
              </div>
              <nav
                aria-label="Capítulos do tutorial"
                className="flex items-center gap-1.5 overflow-x-auto pb-0.5"
              >
                {TUTORIAL_STEPS.map((step, idx) => {
                  const isCurrent = idx === stepIndex;
                  const isPassed = idx < stepIndex;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setStepIndex(idx)}
                      aria-current={isCurrent ? 'step' : undefined}
                      className={`flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold whitespace-nowrap transition duration-150 focus-visible:outline-2 focus-visible:outline-cyan-300 ${
                        isCurrent
                          ? 'border-amber-300/90 bg-amber-400/18 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                          : isPassed
                            ? 'border-cyan-400/35 bg-[#08245e]/80 text-cyan-100 hover:border-cyan-300/70'
                            : 'border-cyan-400/18 bg-[#04143c]/70 text-sky-200/75 hover:border-cyan-300/45 hover:text-white'
                      }`}
                    >
                      <span className="tabular-nums font-black">{step.numberLabel}</span>
                      <span className="hidden md:inline">
                        {step.id === 'welcome-dats'
                          ? 'DATS'
                          : step.id === 'combat-skills'
                            ? 'Combate'
                            : step.id === 'maps-raid'
                              ? 'Mapas & Raid'
                              : step.id === 'evolution-evoluter'
                                ? 'Evoluções'
                                : step.id === 'incubator-eggs'
                                  ? 'Incubadora'
                                  : step.id === 'party-archive'
                                    ? 'Equipe'
                                    : 'Loja & Fim'}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Scrollable Body: Richard Sampson Stage + Structured Lesson Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-[190px_1fr]">
                {/* Left Column: Richard Sampson Official Portrait */}
                <aside className="flex flex-row items-center gap-3 rounded-xl border border-cyan-400/35 bg-[radial-gradient(circle_at_50%_28%,rgba(14,165,233,0.28),rgba(3,12,38,0.96)_78%)] p-3 sm:flex-col sm:justify-between sm:p-3.5">
                  <div className="relative flex h-24 w-20 shrink-0 items-end justify-center overflow-hidden rounded-lg border border-cyan-300/40 bg-[#030d2b] sm:h-52 sm:w-full">
                    <img
                      src={RICHARD_SAMPSON_NPC.spriteUrl}
                      alt={RICHARD_SAMPSON_NPC.name}
                      referrerPolicy="no-referrer"
                      className="h-[94%] w-auto object-contain object-bottom drop-shadow-[0_6px_14px_rgba(0,0,0,0.8)]"
                    />
                  </div>

                  <div className="min-w-0 flex-1 sm:w-full sm:flex-none sm:text-center">
                    <p className="truncate text-xs font-black tracking-wide text-[#ffd43b]">
                      {RICHARD_SAMPSON_NPC.name}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-cyan-200/85">
                      {RICHARD_SAMPSON_NPC.title}
                    </p>
                    <div className="mt-2.5 hidden border-t border-cyan-400/20 pt-2.5 text-[11px] font-semibold text-sky-200/80 sm:block">
                      <p>Tamer: <span className="font-extrabold text-white">{tamerName}</span></p>
                      <p className="mt-0.5">
                        Parceiro: <span className="font-extrabold text-amber-200">{digimonName}</span>
                      </p>
                    </div>
                  </div>
                </aside>

                {/* Right Column: Dialogue + Practical Highlights */}
                <section className="flex min-w-0 flex-col gap-3.5">
                  {/* Chapter Title & Speech */}
                  <div className="rounded-xl border border-cyan-300/40 bg-[#041236]/92 p-3.5 sm:p-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-cyan-300">
                      <StepIcon className="h-4 w-4 shrink-0 text-amber-300" />
                      <span>{currentStep.kicker}</span>
                    </div>
                    <h3 className="mt-1 text-lg font-black leading-snug text-white [text-wrap:balance] sm:text-xl">
                      {currentStep.numberLabel}. {currentStep.title}
                    </h3>
                    <p className="mt-2 text-[13.5px] font-medium leading-relaxed text-sky-50/95 sm:text-sm">
                      “{currentStep.speech(tamerName, digimonName)}”
                    </p>

                    {/* Optional Real Visual Callout (Partner or Evoluter Icon) */}
                    {currentStep.showDigimonShowcase && digimonPortraitUrl && (
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-cyan-400/25 bg-[#061b4f]/80 px-3 py-2">
                        <img
                          src={digimonPortraitUrl}
                          alt={digimonName}
                          referrerPolicy="no-referrer"
                          className="h-11 w-11 shrink-0 rounded-lg border border-amber-300/50 bg-[#041134] object-contain p-1"
                        />
                        <div className="min-w-0 text-xs">
                          <p className="font-extrabold text-amber-200">
                            Seu Parceiro Atual: {digimonName}
                          </p>
                          <p className="text-[11px] text-sky-100/85">
                            Ele luta ao seu lado, ganha EXP e pode evoluir conforme você avança.
                          </p>
                        </div>
                      </div>
                    )}

                    {currentStep.showEvoluterShowcase && (
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-fuchsia-300/45 bg-[#111245]/85 px-3 py-2">
                        <img
                          src={EVOLUTER_ICON_URL}
                          alt="Ícone oficial do Evoluter"
                          referrerPolicy="no-referrer"
                          className="h-11 w-11 shrink-0 rounded-lg border border-fuchsia-300/80 object-cover shadow-[0_0_14px_rgba(232,121,249,0.55)]"
                        />
                        <div className="min-w-0 text-xs">
                          <p className="font-extrabold text-fuchsia-200">
                            Item Especial: Evoluter
                          </p>
                          <p className="text-[11px] text-sky-100/90">
                            Necessário para desbloquear Ultimate (×3) e Mega (×6 ou ×8) em Digimons Mercenários.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Key Takeaways Grid */}
                  <div className="space-y-2">
                    {currentStep.highlights.map((item) => {
                      const style = ACCENT_STYLES[item.accent ?? 'cyan'];
                      return (
                        <div
                          key={item.label}
                          className={`rounded-xl border ${style.border} bg-[#041338]/85 px-3.5 py-2.5`}
                        >
                          <p className={`text-xs font-extrabold ${style.title}`}>
                            {item.label}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-sky-100/90">
                            {item.detail}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Practical Tip Footer */}
                  <div className="flex items-start gap-2 rounded-xl border border-amber-300/30 bg-[#0d1f4c]/85 px-3.5 py-2.5 text-xs text-amber-100/95">
                    <Compass className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    <p className="leading-relaxed">
                      <span className="font-extrabold text-amber-300">Dica da DATS: </span>
                      {currentStep.tip}
                    </p>
                  </div>
                </section>
              </div>
            </div>

            {/* Footer Controls */}
            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-cyan-400/30 bg-[#041136] px-4 py-3">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[42px] rounded-xl border border-cyan-400/35 bg-[#071f54] px-3.5 py-2 text-xs font-bold text-cyan-200 whitespace-nowrap transition duration-150 hover:bg-sky-900 focus-visible:outline-2 focus-visible:outline-cyan-300 active:scale-95"
              >
                {isPreviewFromGm ? 'Fechar Visualização' : 'Pular Tutorial'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                  className="flex min-h-[42px] items-center gap-1.5 rounded-xl border border-cyan-300/45 bg-[#082462] px-3.5 py-2 text-xs font-extrabold text-white whitespace-nowrap transition duration-150 hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-cyan-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </button>

                {isLast ? (
                  <button
                    type="button"
                    onClick={onComplete}
                    className="flex min-h-[42px] items-center gap-1.5 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 px-4 py-2 text-xs font-black text-slate-950 whitespace-nowrap shadow-[0_0_18px_rgba(251,191,36,0.45)] transition duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-amber-200 active:scale-95"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {isPreviewFromGm ? 'Concluir Revisão' : 'Começar Aventura!'}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setStepIndex((i) => Math.min(totalSteps - 1, i + 1))
                    }
                    className="flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#8ef2ff] bg-gradient-to-b from-[#1a85ff] via-[#0e54d4] to-[#062980] px-4 py-2 text-xs font-extrabold text-white whitespace-nowrap shadow-[0_0_16px_rgba(38,182,255,0.48)] transition duration-150 hover:brightness-115 focus-visible:outline-2 focus-visible:outline-cyan-300 active:scale-95"
                  >
                    <span>Próximo</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
