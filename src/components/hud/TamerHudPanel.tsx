import { memo, useRef, useState } from 'react';
import { Camera, Crown, ShieldCheck, Swords } from 'lucide-react';
import type { TamerCharacter } from '../../types/character';
import type { TamerRuntimeStats } from '../../types/hud';
import { processAvatarPhotoUpload } from '../../utils/avatarPhoto';
import { TamerPortraitAvatar } from './TamerPortraitAvatar';

interface TamerHudPanelProps {
  character: TamerCharacter;
  tamerName: string;
  stats: TamerRuntimeStats;
  tamerPhotoUrl?: string | null;
  inSafeZone: boolean;
  isCombatMap: boolean;
  levelUpPulse: boolean;
  onOpenCharacter: () => void;
  onUpdateTamerPhoto?: (photoUrl: string | null) => void;
}

export const TamerHudPanel = memo(function TamerHudPanel({
  character,
  tamerName,
  stats,
  tamerPhotoUrl = null,
  inSafeZone,
  isCombatMap,
  levelUpPulse,
  onOpenCharacter,
  onUpdateTamerPhoto,
}: TamerHudPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [photoError, setPhotoError] = useState<string | null>(null);

  const hpPct = Math.max(0, Math.min(100, (stats.hp / Math.max(1, stats.maxHp)) * 100));
  const dsPct = Math.max(0, Math.min(100, (stats.ds / Math.max(1, stats.maxDs)) * 100));
  const expPct = Math.max(
    0,
    Math.min(100, (stats.exp / Math.max(1, stats.expToNext)) * 100)
  );

  const handleFileChange = async (
    file: File | null | undefined,
    inputEl?: HTMLInputElement | null
  ) => {
    if (!file || !onUpdateTamerPhoto) {
      if (inputEl) inputEl.value = '';
      return;
    }
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const res = await processAvatarPhotoUpload(file);
      if (res.ok && res.dataUrl) {
        onUpdateTamerPhoto(res.dataUrl);
      } else if (res.error) {
        setPhotoError(res.error);
        window.setTimeout(() => setPhotoError(null), 4000);
      }
    } catch {
      setPhotoError('Não foi possível carregar esta foto.');
      window.setTimeout(() => setPhotoError(null), 4000);
    } finally {
      setUploadingPhoto(false);
      if (inputEl) {
        try {
          inputEl.value = '';
        } catch {
          // Ignore input reset issues on older WebViews
        }
      }
    }
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto relative flex items-start gap-1.5 select-none"
    >
      {/* Visually hidden native photo picker (sr-only works more reliably than display:none on mobile WebViews) */}
      {onUpdateTamerPhoto && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          tabIndex={-1}
          className="sr-only"
          onChange={(e) => {
            const inputEl = e.currentTarget;
            const file = inputEl.files?.[0];
            void handleFileChange(file, inputEl);
          }}
        />
      )}

      <div
        className={`group relative flex items-center text-left ${
          levelUpPulse ? 'drop-shadow-[0_0_16px_rgba(255,212,59,0.9)]' : ''
        }`}
      >
        {/* Crown Crest at top-left */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-1 -top-1 z-30 flex h-5 w-5 items-center justify-center rounded-md border border-amber-200 bg-gradient-to-b from-[#fff176] via-[#fbbf24] to-[#b45309] shadow-[0_0_8px_rgba(251,191,36,0.75)]"
        >
          <Crown className="h-3 w-3 fill-[#fef08a] text-[#451a03]" />
        </span>

        {/* Overlapping Circular Ring Portrait + Quick Camera Upload Button */}
        <div className="dmo-ring relative z-20 flex h-14 w-14 shrink-0 items-center justify-center rounded-full p-0.5 sm:h-16 sm:w-16">
          <button
            type="button"
            onClick={onOpenCharacter}
            title={`Abrir detalhes de ${tamerName}`}
            className="h-full w-full overflow-hidden rounded-full focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            <TamerPortraitAvatar
              tamerId={character.id}
              tamerName={tamerName}
              customPhotoUrl={tamerPhotoUrl}
              sizeClass="h-full w-full"
            />
          </button>

          {/* Bottom-left Circular Level Badge */}
          <span
            title={`Nível do Tamer: ${stats.level}`}
            className="dmo-frame pointer-events-none absolute -bottom-1 -left-1 z-30 flex h-6 min-w-[24px] items-center justify-center rounded-full px-1 text-[10.5px] font-black tabular-nums text-white"
          >
            {stats.level}
          </span>

          {/* Bottom-right Quick Photo Picker Badge (Phone or PC) */}
          {onUpdateTamerPhoto && (
            <button
              type="button"
              disabled={uploadingPhoto}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              aria-label="Trocar foto do Tamer"
              title="Escolher foto do celular ou computador"
              className="absolute -bottom-1 -right-0.5 z-30 flex h-5 w-5 items-center justify-center rounded-full border border-cyan-200 bg-gradient-to-b from-[#0b5ed7] to-[#041d54] text-cyan-100 shadow-[0_0_8px_rgba(56,232,255,0.75)] transition-transform hover:scale-110 hover:brightness-125 active:scale-95 disabled:opacity-60 sm:h-5.5 sm:w-5.5"
            >
              <Camera className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${uploadingPhoto ? 'animate-pulse' : ''}`} />
            </button>
          )}
        </div>

        {photoError && (
          <div className="absolute left-0 top-full z-40 mt-1 max-w-[220px] rounded-md border border-rose-400/70 bg-[#1a0912]/95 px-2 py-1 text-[10px] font-bold text-rose-200 shadow-lg">
            {photoError}
          </div>
        )}

        {/* Right Extending Beveled Capsule + Bottom EXP Lip */}
        <button
          type="button"
          onClick={onOpenCharacter}
          title={`Abrir detalhes de ${tamerName}`}
          className="-ml-4 flex flex-col text-left transition-transform active:scale-[0.99]"
        >
          {/* Main HP/DS Capsule */}
          <div className="dmo-frame relative flex w-[142px] flex-col justify-center rounded-r-2xl py-1.5 pl-5 pr-2.5 sm:w-[172px] sm:pl-6">
            {/* HP Bar */}
            <div className="dmo-well relative h-4 w-full overflow-hidden rounded-full">
              <div
                className="dmo-hp-fill h-full transition-[width] duration-200"
                style={{ width: `${hpPct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-between px-2 text-[9.5px] font-black tracking-wide text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                <span>HP</span>
                <span className="tabular-nums text-[8.5px]">
                  {Math.round(stats.hp)}/{stats.maxHp}
                </span>
              </span>
            </div>

            {/* DS Bar */}
            <div className="dmo-well relative mt-1 h-4 w-full overflow-hidden rounded-full">
              <div
                className="dmo-ds-fill h-full transition-[width] duration-200"
                style={{ width: `${dsPct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-between px-2 text-[9.5px] font-black tracking-wide text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                <span>DS</span>
                <span className="tabular-nums text-[8.5px]">
                  {Math.round(stats.ds)}/{stats.maxDs}
                </span>
              </span>
            </div>
          </div>

          {/* Tucked EXP Lip with 0.000% */}
          <div className="dmo-frame -mt-0.5 ml-2 flex h-4 w-[128px] items-center justify-between rounded-b-lg px-2 sm:w-[154px]">
            <span className="truncate text-[8.5px] font-extrabold text-cyan-100">
              {tamerName}
            </span>
            <div className="mx-1.5 h-1.5 flex-1 overflow-hidden rounded-full bg-[#020922]">
              <div
                className="h-full bg-gradient-to-r from-amber-300 to-cyan-300 transition-[width] duration-300"
                style={{ width: `${expPct}%` }}
              />
            </div>
            <span className="shrink-0 text-[9px] font-black tabular-nums text-white drop-shadow">
              {expPct.toFixed(3)}%
            </span>
          </div>
        </button>
      </div>

      {/* Two Small Beveled Blue Buff Squares matching Reference */}
      <div className="hidden items-center gap-1 pt-0.5 sm:flex">
        <div
          title={inSafeZone ? 'Zona Segura: Recuperação Ativa' : 'Área de Combate'}
          className="dmo-frame flex h-7 w-7 items-center justify-center rounded-md"
        >
          {inSafeZone ? (
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-200" />
          ) : (
            <Swords className="h-3.5 w-3.5 text-amber-300" />
          )}
        </div>
        <div
          title={isCombatMap ? 'Modo Caça Ativo' : 'DATS Center'}
          className="dmo-frame flex h-7 w-7 items-center justify-center rounded-md text-[8px] font-black text-cyan-100"
        >
          {isCombatMap ? 'PVE' : 'HQ'}
        </div>
      </div>
    </div>
  );
});
