import { BookOpen, MessageSquare, ShieldCheck, X } from 'lucide-react';
import { RICHARD_SAMPSON_NPC, type FixedWorldNpc } from '../../sprites/npcSprites';

interface NpcDialogueModalProps {
  npc: FixedWorldNpc;
  tamerName: string;
  onStartTutorial?: () => void;
  onClose: () => void;
}

export function NpcDialogueModal({
  npc,
  tamerName,
  onStartTutorial,
  onClose,
}: NpcDialogueModalProps) {
  const isRichardSampson = npc.id === RICHARD_SAMPSON_NPC.id;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Diálogo com ${npc.name}`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#020816]/45 p-2 pb-16 sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window relative flex w-full max-w-[560px] flex-col"
      >
        {/* Top-Right Extruded Metallic Close X Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={`Fechar diálogo com ${npc.name}`}
          className="absolute -right-0.5 -top-0.5 z-30 flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#8ef2ff] bg-gradient-to-b from-[#ef4444] via-[#b91c1c] to-[#7f1d1d] text-white shadow-[0_0_16px_rgba(56,232,255,0.7),inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:brightness-115 active:scale-95 sm:-right-1 sm:-top-1 sm:h-10 sm:w-10"
        >
          <X className="h-4.5 w-4.5 stroke-[3.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] sm:h-5 sm:w-5" />
        </button>

        {/* Chamfered Outer Neon Rim + Inner Dialogue Panel */}
        <div className="clip-cyber-panel relative flex flex-col bg-gradient-to-b from-[#7af2ff] via-[#26b6ff] to-[#56e4ff] p-[2px] shadow-[0_0_38px_rgba(0,174,255,0.65)]">
          <div className="clip-cyber-panel relative flex flex-col overflow-hidden bg-[radial-gradient(circle_at_18%_45%,rgba(14,79,198,0.95)_0%,rgba(6,28,92,0.98)_54%,rgba(3,14,52,0.99)_100%)]">
            {/* Metallic Header Strip */}
            <div className="flex h-9 items-center justify-between border-b-2 border-[#3ad5ff] bg-gradient-to-r from-[#062a78] via-[#0c4ec9] to-[#062a78] px-3 pr-10 shadow-[0_3px_14px_rgba(0,145,255,0.45)] sm:h-11 sm:px-4 sm:pr-12">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[#72f0ff] bg-[#04194d] text-[#38f0ff] shadow-[0_0_8px_rgba(56,232,255,0.5)]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                <div className="leading-tight">
                  <h2 className="text-xs font-black tracking-wider text-[#ffd43b] drop-shadow sm:text-sm">
                    {npc.name}
                  </h2>
                </div>
              </div>
              <span className="text-[10px] font-bold tracking-wide text-cyan-200 sm:text-[11px]">
                {npc.title}
              </span>
            </div>

            {/* NPC Sprite + Dialogue Text Body */}
            <div className="flex items-end gap-3 p-3 sm:gap-4 sm:p-4">
              {/* Preserved Original Sprite Portrait */}
              <div className="relative flex h-28 w-22 shrink-0 items-end justify-center overflow-hidden rounded-xl border-[1.5px] border-[#38c4ff] bg-[radial-gradient(circle_at_50%_35%,rgba(14,165,233,0.32),rgba(2,12,44,0.95))] shadow-[inset_0_0_16px_rgba(0,40,120,0.75)] sm:h-36 sm:w-28">
                <img
                  src={npc.spriteUrl}
                  alt={npc.name}
                  referrerPolicy="no-referrer"
                  className="h-[95%] w-auto object-contain object-bottom drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]"
                />
              </div>

              {/* Speech Box & Action Buttons */}
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2.5">
                <div className="rounded-xl border border-[#38c4ff]/75 bg-[#041238]/92 p-2.5 shadow-[inset_0_0_14px_rgba(0,40,120,0.65)] sm:p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                    <MessageSquare className="h-3 w-3 shrink-0" />
                    <span>Comunicação DATS · Para {tamerName}</span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-white sm:text-[13.5px]">
                    “{npc.initialDialogue}”
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {isRichardSampson && onStartTutorial && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onStartTutorial();
                      }}
                      className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 px-3.5 py-1.5 text-xs font-black text-slate-950 whitespace-nowrap shadow-[0_0_14px_rgba(251,191,36,0.45)] transition hover:brightness-110 active:scale-95"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Tutorial de Iniciante</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex min-h-[38px] items-center justify-center rounded-lg border border-[#8ef2ff] bg-gradient-to-b from-[#1a85ff] via-[#0e54d4] to-[#062980] px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap shadow-[0_0_14px_rgba(38,182,255,0.5)] transition hover:brightness-115 active:scale-95"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
