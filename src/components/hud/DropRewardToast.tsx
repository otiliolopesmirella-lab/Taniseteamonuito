import { memo } from 'react';
import { EVOLUTER_ITEM_KEY, ITEM_RARITY_META } from '../../data/itemsCatalog';
import type { ItemRarity } from '../../types/hud';
import { Egg, HeartPulse, Package, Sparkles, Zap } from 'lucide-react';

export interface DropToastItem {
  id: string;
  itemKey: string;
  name: string;
  quantity: number;
  iconUrl?: string;
  rarity: ItemRarity;
  sourceName?: string;
}

export interface DigiEggDropAlertItem {
  id: string;
  itemKey: string;
  name: string;
  iconUrl: string;
  rarity: ItemRarity;
  accentColor: string;
  sourceName: string;
  isBoss?: boolean;
  inventoryWasFull?: boolean;
}

interface DropRewardToastStackProps {
  toasts: readonly DropToastItem[];
}

export const DropRewardToastStack = memo(function DropRewardToastStack({
  toasts,
}: DropRewardToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute right-2 top-[128px] z-30 flex w-[210px] flex-col gap-1.5 sm:right-4 sm:top-[168px] sm:w-[242px]"
    >
      {toasts.map((toast) => {
        const isDigiEgg = toast.itemKey.startsWith('digiegg_');
        const isEvoluter = toast.itemKey === EVOLUTER_ITEM_KEY;
        const rarity = ITEM_RARITY_META[toast.rarity ?? 'comum'];
        return (
          <div
            key={toast.id}
            style={{
              borderColor: isEvoluter
                ? '#e879f9'
                : isDigiEgg
                  ? '#facc15'
                  : rarity.borderHex,
              boxShadow: isEvoluter
                ? '0 0 24px rgba(232,121,249,0.55), 0 0 12px rgba(56,232,255,0.4)'
                : isDigiEgg
                  ? '0 0 22px rgba(250,204,21,0.5)'
                  : `0 0 20px ${rarity.glowRgba}`,
            }}
            className="animate-dmo-window flex items-center gap-2 rounded-xl border-2 bg-[#041438]/96 px-2.5 py-1.5"
          >
            <div
              className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-[#020a24] ${
                isEvoluter
                  ? 'border-fuchsia-300/80 p-0.5 shadow-[0_0_12px_rgba(232,121,249,0.5)]'
                  : 'border-cyan-300/45 p-0.5'
              }`}
            >
              {toast.iconUrl ? (
                <img
                  src={toast.iconUrl}
                  alt={toast.name}
                  className={
                    isEvoluter
                      ? 'h-9 w-9 rounded-[5px] object-cover'
                      : 'h-9 w-9 object-contain drop-shadow-[0_0_8px_rgba(56,232,255,0.55)]'
                  }
                />
              ) : toast.itemKey.includes('hp') ? (
                <HeartPulse className="h-5 w-5 text-emerald-300" />
              ) : toast.itemKey.includes('ds') ? (
                <Zap className="h-5 w-5 text-cyan-300" />
              ) : (
                <Package className="h-5 w-5 text-sky-300" />
              )}
              <Sparkles
                className={`absolute -right-1 -top-1 h-3 w-3 animate-pulse ${
                  isEvoluter ? 'text-fuchsia-300' : 'text-amber-300'
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`truncate text-[8.5px] font-black uppercase tracking-wider ${
                    isEvoluter ? 'text-fuchsia-300' : 'text-amber-300'
                  }`}
                >
                  {isEvoluter
                    ? 'Evoluter Obtido'
                    : isDigiEgg
                      ? 'DigiEgg Obtido'
                      : `Item Obtido · ${rarity.label}`}
                </span>
                <span className="shrink-0 rounded bg-emerald-500/25 px-1.5 py-0.2 text-[9.5px] font-black tabular-nums text-emerald-200">
                  +{toast.quantity}
                </span>
              </div>
              <p className="truncate text-[11px] font-extrabold text-white">
                {toast.name}
              </p>
              {toast.sourceName && (
                <p className="truncate text-[8.5px] font-semibold text-cyan-200/80">
                  Drop de {toast.sourceName}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

interface DigiEggDropAlertBannerProps {
  alert: DigiEggDropAlertItem | null;
}

export const DigiEggDropAlertBanner = memo(function DigiEggDropAlertBanner({
  alert,
}: DigiEggDropAlertBannerProps) {
  if (!alert) return null;

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-x-0 top-[76px] z-40 flex justify-center px-3 sm:top-[110px]"
    >
      <div
        key={alert.id}
        style={{
          borderColor: alert.accentColor || '#facc15',
          boxShadow: '0 0 34px rgba(56,232,255,0.42), 0 0 18px rgba(250,204,21,0.45)',
        }}
        className="animate-dmo-window relative flex w-full max-w-[390px] items-center gap-3 overflow-hidden rounded-2xl border-2 bg-gradient-to-r from-[#04143a]/98 via-[#0a2768]/98 to-[#04143a]/98 px-3.5 py-2.5"
      >
        {/* Radiant Edge Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full opacity-35 blur-2xl"
          style={{ backgroundColor: alert.accentColor }}
        />

        {/* Glowing DigiEgg Emblem */}
        <div
          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 bg-[#020a24]/95 p-1"
          style={{
            borderColor: alert.accentColor,
            boxShadow: '0 0 18px rgba(250,204,21,0.45)',
          }}
        >
          {alert.iconUrl ? (
            <img
              src={alert.iconUrl}
              alt={alert.name}
              className="h-12 w-12 object-contain drop-shadow-[0_0_12px_rgba(250,204,21,0.75)]"
            />
          ) : (
            <Egg className="h-8 w-8 text-amber-300" />
          )}
          <Sparkles className="absolute -right-1.5 -top-1.5 h-4 w-4 animate-pulse text-amber-300" />
        </div>

        {/* Announcement Text */}
        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 drop-shadow">
              {alert.isBoss ? '★ DROP DE BOSS RAID ★' : '★ DIGIEGG DROPADO! ★'}
            </span>
          </div>

          <p
            className="mt-0.5 truncate text-sm font-black tracking-wide text-white drop-shadow"
            style={{ color: alert.accentColor }}
          >
            {alert.name}
          </p>

          <p className="mt-0.5 truncate text-[10.5px] font-bold text-cyan-100/90">
            Drop de <span className="text-white">{alert.sourceName}</span> ·{' '}
            {alert.inventoryWasFull
              ? 'Mochila cheia (simulação)'
              : 'Enviado para o Inventário'}
          </p>
        </div>
      </div>
    </div>
  );
});
