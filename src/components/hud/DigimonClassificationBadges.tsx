import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, ShieldAlert, Swords, X } from 'lucide-react';
import {
  getClassificationMetaByCategory,
  getDigimonAttributeMeta,
  getDigimonElementMeta,
  type ClassificationCategory,
  type ClassificationMeta,
  type DigimonClassification,
} from '../../types/classification';

const CATEGORY_LABELS: Record<ClassificationCategory, string> = {
  attribute: 'Atributo',
  element: 'Elemento',
};

function formatMetaTitle(meta: ClassificationMeta): string {
  if (meta.category === 'attribute') {
    return `${meta.code} · ${meta.namePt} (${meta.nameEn})`;
  }
  return meta.nameEn.toLowerCase() === meta.namePt.toLowerCase()
    ? meta.namePt
    : `${meta.namePt} (${meta.nameEn})`;
}

function formatCompactBadgeValue(meta: ClassificationMeta): string {
  if (meta.category === 'attribute') {
    return `${meta.code} · ${meta.namePt}`;
  }
  if (meta.id === 'wood') {
    return 'Madeira';
  }
  return meta.namePt;
}

function formatCompactMobileValue(meta: ClassificationMeta): string {
  if (meta.category === 'attribute') {
    return meta.code;
  }
  if (meta.id === 'wood') {
    return 'Madeira';
  }
  return meta.namePt;
}

function formatMatchupLabel(meta: ClassificationMeta): string {
  if (meta.category === 'attribute') {
    return `${meta.code} · ${meta.namePt}`;
  }
  return meta.namePt;
}

interface ClassificationDetailOverlayProps {
  meta: ClassificationMeta;
  onClose: () => void;
}

function ClassificationDetailOverlay({
  meta,
  onClose,
}: ClassificationDetailOverlayProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onClose]);

  const strongEntries = meta.strongAgainst.map((entry) => ({
    target: getClassificationMetaByCategory(meta.category, entry.targetId),
    reasonPt: entry.reasonPt,
  }));
  const weakEntries = meta.weakAgainst.map((entry) => ({
    target: getClassificationMetaByCategory(meta.category, entry.targetId),
    reasonPt: entry.reasonPt,
  }));

  const content = (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Especificação: ${formatMetaTitle(meta)}`}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#020818]/72 p-3 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window relative max-h-[88dvh] w-full max-w-[396px] overflow-y-auto rounded-2xl border-[1.5px] bg-gradient-to-b from-[#082160]/98 via-[#04143b]/98 to-[#020b24]/98 p-4 text-white"
        style={{
          borderColor: meta.accentHex,
          boxShadow: `0 0 34px ${meta.glowRgba}, inset 0 0 24px rgba(8, 38, 110, 0.72)`,
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar especificação"
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-300/45 bg-[#08225e]/90 text-cyan-100 transition hover:bg-rose-600/80 hover:text-white active:scale-95"
        >
          <X className="h-4 w-4 stroke-[2.6]" />
        </button>

        {/* Header: Strictly the selected Attribute or Element */}
        <div className="flex items-center gap-3 pr-8">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#030d29]/90 p-1.5"
            style={{
              boxShadow: `inset 0 0 18px ${meta.glowRgba}`,
            }}
          >
            <img
              src={meta.iconPath}
              alt={formatMetaTitle(meta)}
              draggable={false}
              className="h-full w-full select-none object-contain"
              style={{ filter: `drop-shadow(0 0 8px ${meta.glowRgba})` }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="inline-block rounded px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-widest"
                style={{
                  backgroundColor: 'rgba(2, 12, 38, 0.9)',
                  color: meta.accentHex,
                  border: `1px solid ${meta.accentHex}66`,
                }}
              >
                {CATEGORY_LABELS[meta.category]}
              </span>
              <span className="truncate text-[9.5px] font-bold text-cyan-200/85">
                {meta.roleLabelPt}
              </span>
            </div>
            <h3 className="mt-1 truncate text-sm font-black tracking-wide text-white sm:text-base">
              {formatMetaTitle(meta)}
            </h3>
          </div>
        </div>

        {/* Specification & Combat Rule */}
        <div className="mt-3 space-y-1.5 rounded-xl border border-cyan-400/25 bg-[#030d2b]/90 px-3 py-2.5">
          <p className="text-[11.5px] leading-relaxed text-white/95">
            {meta.descriptionPt}
          </p>
          <div className="flex items-start gap-1.5 border-t border-cyan-400/18 pt-1.5 text-[10.5px] leading-snug text-cyan-100/90">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />
            <p>{meta.combatRulePt}</p>
          </div>
        </div>

        {/* Static Matchup Readout: Forte contra | Fraco contra (never switches away on tap) */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {/* FORTE CONTRA */}
          <div className="flex flex-col rounded-xl border border-emerald-400/40 bg-emerald-950/32 p-2.5">
            <div className="flex items-center justify-between gap-1 border-b border-emerald-400/25 pb-1">
              <span className="flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider text-emerald-300">
                <Swords className="h-3 w-3 shrink-0" />
                <span>Forte contra</span>
              </span>
              <span className="text-[9px] font-black tabular-nums text-emerald-200/80">
                {strongEntries.length}
              </span>
            </div>

            {strongEntries.length > 0 ? (
              <div className="mt-2 flex flex-col gap-1.5">
                {strongEntries.map(({ target, reasonPt }) => (
                  <div
                    key={target.id}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-[#03132e]/88 px-1.5 py-1"
                  >
                    <img
                      src={target.iconPath}
                      alt={formatMatchupLabel(target)}
                      draggable={false}
                      className="h-6 w-6 shrink-0 select-none object-contain"
                      style={{ filter: `drop-shadow(0 0 5px ${target.glowRgba})` }}
                    />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p
                        className="truncate text-[10.5px] font-extrabold"
                        style={{ color: target.accentHex }}
                      >
                        {formatMatchupLabel(target)}
                      </p>
                      <p className="truncate text-[8.5px] font-medium text-emerald-100/78">
                        {reasonPt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[10px] font-semibold text-emerald-100/75">
                Sem vantagem direta
              </p>
            )}
          </div>

          {/* FRACO CONTRA */}
          <div className="flex flex-col rounded-xl border border-rose-400/40 bg-rose-950/32 p-2.5">
            <div className="flex items-center justify-between gap-1 border-b border-rose-400/25 pb-1">
              <span className="flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider text-rose-300">
                <ShieldAlert className="h-3 w-3 shrink-0" />
                <span>Fraco contra</span>
              </span>
              <span className="text-[9px] font-black tabular-nums text-rose-200/80">
                {weakEntries.length}
              </span>
            </div>

            {weakEntries.length > 0 ? (
              <div className="mt-2 flex flex-col gap-1.5">
                {weakEntries.map(({ target, reasonPt }) => (
                  <div
                    key={target.id}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-400/25 bg-[#03132e]/88 px-1.5 py-1"
                  >
                    <img
                      src={target.iconPath}
                      alt={formatMatchupLabel(target)}
                      draggable={false}
                      className="h-6 w-6 shrink-0 select-none object-contain"
                      style={{ filter: `drop-shadow(0 0 5px ${target.glowRgba})` }}
                    />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p
                        className="truncate text-[10.5px] font-extrabold"
                        style={{ color: target.accentHex }}
                      >
                        {formatMatchupLabel(target)}
                      </p>
                      <p className="truncate text-[8.5px] font-medium text-rose-100/78">
                        {reasonPt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[10px] font-semibold text-rose-100/75">
                Nenhuma fraqueza
              </p>
            )}
          </div>
        </div>

        {meta.specialtyPt && (
          <p className="mt-2.5 rounded-lg border border-cyan-400/22 bg-[#04143b]/80 px-2.5 py-1.5 text-center text-[10px] font-semibold text-cyan-200/92">
            {meta.specialtyPt}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-cyan-300/45 bg-gradient-to-b from-[#0c3c94] to-[#06205a] py-1.5 text-[11px] font-black uppercase tracking-wider text-white shadow-[0_0_12px_rgba(56,232,255,0.28)] transition hover:brightness-115 active:scale-[0.98]"
        >
          Fechar
        </button>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}

interface InteractiveIconButtonProps {
  meta: ClassificationMeta;
  sizeClass: string;
  onInspect: (meta: ClassificationMeta) => void;
}

function InteractiveIconButton({
  meta,
  sizeClass,
  onInspect,
}: InteractiveIconButtonProps) {
  const title = `${CATEGORY_LABELS[meta.category]}: ${formatMetaTitle(meta)} — Toque para ver especificação`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onInspect(meta);
      }}
      title={title}
      aria-label={title}
      className="group relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md p-[1px] transition-transform duration-150 hover:scale-115 active:scale-95 focus-visible:outline-1 focus-visible:outline-cyan-300"
    >
      <img
        src={meta.iconPath}
        alt={formatMetaTitle(meta)}
        draggable={false}
        className={`${sizeClass} block select-none object-contain`}
        style={{
          filter: `drop-shadow(0 0 4px ${meta.glowRgba})`,
        }}
      />
    </button>
  );
}

interface DigimonClassificationBadgesProps {
  classification: DigimonClassification;
  /**
   * - 'sheet': Clean, symmetrical two-card display (Atributo | Elemento) below the Digimon preview
   *   with zero clipped labels on any screen size. Tap either card to inspect its specification.
   * - 'target': Ultra-compact Enemy Battle Target bar row (Atributo | Elemento).
   */
  variant: 'sheet' | 'target';
  className?: string;
}

export function DigimonClassificationBadges({
  classification,
  variant,
  className = '',
}: DigimonClassificationBadgesProps) {
  const [inspectedMeta, setInspectedMeta] = useState<ClassificationMeta | null>(
    null
  );

  const attrMeta = getDigimonAttributeMeta(classification.attribute);
  const elemMeta = getDigimonElementMeta(classification.element);

  if (variant === 'sheet') {
    return (
      <>
        <div
          aria-label="Classificação do Digimon — toque em Atributo ou Elemento para ver detalhes"
          className={`grid grid-cols-2 gap-1.5 sm:gap-2 ${className}`}
        >
          {/* 1. ATRIBUTO CARD */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setInspectedMeta(attrMeta);
            }}
            title={`Atributo: ${formatMetaTitle(attrMeta)} — Clique para ver especificações`}
            className="group relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-cyan-400/45 bg-gradient-to-b from-[#082464]/95 via-[#051746]/95 to-[#030e2e]/95 px-1 py-1.5 text-center shadow-[inset_0_1px_0_rgba(142,242,255,0.22),0_0_10px_rgba(0,150,255,0.2)] transition hover:border-cyan-300 hover:brightness-110 active:scale-[0.98] sm:rounded-xl sm:px-2 sm:py-2 [@media(max-height:500px)]:py-1"
          >
            <span className="text-[7.5px] font-extrabold uppercase tracking-[0.12em] text-cyan-200/85 sm:text-[9px]">
              Atributo
            </span>
            <img
              src={attrMeta.iconPath}
              alt={formatMetaTitle(attrMeta)}
              draggable={false}
              className="my-0.5 h-6 w-6 shrink-0 select-none object-contain transition-transform duration-150 group-hover:scale-110 sm:my-1 sm:h-7 sm:w-7 [@media(max-height:500px)]:h-5 [@media(max-height:500px)]:w-5"
              style={{ filter: `drop-shadow(0 0 6px ${attrMeta.glowRgba})` }}
            />
            <span
              className="w-full text-[9.5px] font-black leading-none tracking-wide sm:hidden"
              style={{ color: attrMeta.accentHex }}
            >
              {formatCompactMobileValue(attrMeta)}
            </span>
            <span
              className="hidden w-full truncate text-[11px] font-black leading-none tracking-wide sm:block"
              style={{ color: attrMeta.accentHex }}
            >
              {formatCompactBadgeValue(attrMeta)}
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-2 bottom-0 h-[2px] rounded-full opacity-80"
              style={{ backgroundColor: attrMeta.accentHex }}
            />
          </button>

          {/* 2. ELEMENTO CARD */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setInspectedMeta(elemMeta);
            }}
            title={`Elemento: ${formatMetaTitle(elemMeta)} — Clique para ver especificações`}
            className="group relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-cyan-400/45 bg-gradient-to-b from-[#082464]/95 via-[#051746]/95 to-[#030e2e]/95 px-1 py-1.5 text-center shadow-[inset_0_1px_0_rgba(142,242,255,0.22),0_0_10px_rgba(0,150,255,0.2)] transition hover:border-cyan-300 hover:brightness-110 active:scale-[0.98] sm:rounded-xl sm:px-2 sm:py-2 [@media(max-height:500px)]:py-1"
          >
            <span className="text-[7.5px] font-extrabold uppercase tracking-[0.12em] text-cyan-200/85 sm:text-[9px]">
              Elemento
            </span>
            <img
              src={elemMeta.iconPath}
              alt={formatMetaTitle(elemMeta)}
              draggable={false}
              className="my-0.5 h-6 w-6 shrink-0 select-none object-contain transition-transform duration-150 group-hover:scale-110 sm:my-1 sm:h-7 sm:w-7 [@media(max-height:500px)]:h-5 [@media(max-height:500px)]:w-5"
              style={{ filter: `drop-shadow(0 0 6px ${elemMeta.glowRgba})` }}
            />
            <span
              className="w-full text-[9.5px] font-black leading-none tracking-wide sm:hidden"
              style={{ color: elemMeta.accentHex }}
            >
              {formatCompactMobileValue(elemMeta)}
            </span>
            <span
              className="hidden w-full truncate text-[11px] font-black leading-none tracking-wide sm:block"
              style={{ color: elemMeta.accentHex }}
            >
              {formatCompactBadgeValue(elemMeta)}
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-2 bottom-0 h-[2px] rounded-full opacity-80"
              style={{ backgroundColor: elemMeta.accentHex }}
            />
          </button>
        </div>

        {inspectedMeta && (
          <ClassificationDetailOverlay
            meta={inspectedMeta}
            onClose={() => setInspectedMeta(null)}
          />
        )}
      </>
    );
  }

  // variant === 'target' (Battle Target HUD bar)
  return (
    <>
      <div
        aria-label="Classificação do Inimigo em Batalha"
        className={`flex items-center gap-1 ${className}`}
      >
        <InteractiveIconButton
          meta={attrMeta}
          sizeClass="h-4.5 w-4.5 sm:h-5 sm:w-5"
          onInspect={setInspectedMeta}
        />
        <span aria-hidden="true" className="h-3 w-[1px] bg-rose-300/35" />
        <InteractiveIconButton
          meta={elemMeta}
          sizeClass="h-4.5 w-4.5 sm:h-5 sm:w-5"
          onInspect={setInspectedMeta}
        />
      </div>

      {inspectedMeta && (
        <ClassificationDetailOverlay
          meta={inspectedMeta}
          onClose={() => setInspectedMeta(null)}
        />
      )}
    </>
  );
}
