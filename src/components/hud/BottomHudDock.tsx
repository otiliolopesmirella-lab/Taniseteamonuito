import { memo, useEffect, useState, type CSSProperties } from 'react';
import { Crown, Layers, LayoutGrid, Users, X } from 'lucide-react';
import {
  formatXpBoostRemainingLabel,
  getActiveXpBoostBonusPct,
} from '../../data/itemsCatalog';
import {
  ALLOWED_SERVER_EXP_RATES,
  type ServerExpRatePct,
} from '../../services/serverConfigService';
import {
  CHANNEL_HARD_CAPACITY,
  WORLD_CHANNEL_IDS,
  getChannelLoadStatus,
  type SharedWorldMapId,
  type WorldChannelId,
} from '../../services/worldPresenceService';
import type { HudWindowId } from '../../types/hud';

const CHANNEL_MAP_LABELS: Record<SharedWorldMapId, string> = {
  'dats-center': 'DATS Center',
  'd-terminal': 'D-Terminal',
  'hunting-plains': 'Planície Digital',
  'data-forest': 'Floresta de Dados',
  'digi-mountain': 'Montanha Digi',
  'digital-desert': 'Deserto Digital',
  'data-sea': 'Mar de Dados',
  'digimon-island': 'Ilha dos Digimons',
  'dark-area': 'Área Sombria',
  'virtual-world': 'Mundo Virtual',
};

interface BottomHudDockProps {
  activeWindow: HudWindowId;
  inventoryOpen: boolean;
  unreadNotifications: number;
  eggCollectedPulse?: boolean;
  autoHuntEnabled?: boolean;
  autoHuntTargetsCount?: number;
  serverExpRatePct?: ServerExpRatePct;
  guildExpBonusPct?: number;
  xpBoostUntilMs?: number | null;
  isGM?: boolean;
  currentMapId?: SharedWorldMapId;
  currentChannelId?: WorldChannelId;
  channelCounts?: Record<WorldChannelId, number>;
  partyChannelCounts?: Partial<Record<WorldChannelId, number>>;
  partyLeaderChannelId?: WorldChannelId | null;
  channelSwitching?: boolean;
  onSelectChannel?: (channelId: WorldChannelId) => void;
  onAdminChangeExpRate?: (rate: ServerExpRatePct) => void;
  onToggleInventory: () => void;
  onOpenWindow: (win: Exclude<HudWindowId, null>) => void;
}

interface MenuButtonConfig {
  id: string;
  label: string;
  iconSrc: string;
  glowRgba: string;
  active: boolean;
  badge?: number;
  statusTag?: string;
  featured?: boolean;
  squareBadgeIcon?: boolean;
  onClick: () => void;
}

function MmorpgMenuTile({
  item,
  onSelect,
}: {
  item: MenuButtonConfig;
  onSelect: () => void;
}) {
  const glowVars = {
    '--btn-glow': item.glowRgba,
  } as CSSProperties;

  return (
    <button
      type="button"
      onClick={() => {
        item.onClick();
        onSelect();
      }}
      title={item.label}
      aria-label={item.label}
      aria-pressed={item.active}
      data-selected={item.active ? 'true' : 'false'}
      style={glowVars}
      className={`mmorpg-icon-btn group relative flex aspect-[6/6.6] w-full items-center justify-center rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
        item.active
          ? 'border-amber-300/90 bg-[#0c3178]/85 shadow-[0_0_16px_rgba(251,191,36,0.35)]'
          : item.featured
            ? 'border-cyan-300/55 bg-[#08255e]/75 hover:border-cyan-200 hover:bg-[#0c327a]/85'
            : 'border-cyan-400/25 bg-[#051840]/75 hover:border-cyan-300/70 hover:bg-[#092763]/85'
      }`}
    >
      {/* Radial Neon Back-Glow */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-1.5 rounded-full blur-md transition-opacity duration-200 ${
          item.active
            ? 'opacity-80'
            : item.featured
              ? 'opacity-35 group-hover:opacity-75'
              : 'opacity-0 group-hover:opacity-65'
        }`}
        style={{ background: item.glowRgba }}
      />

      {/* Custom Octagonal Metallic Icon or Square Emblem PNG */}
      <img
        src={item.iconSrc}
        alt={item.label}
        draggable={false}
        referrerPolicy="no-referrer"
        className={`relative z-10 transition-transform duration-150 group-hover:scale-105 group-active:scale-95 ${
          item.squareBadgeIcon
            ? 'h-[86%] w-[86%] rounded-lg object-cover drop-shadow-[0_3px_6px_rgba(0,0,0,0.75)]'
            : 'h-[92%] w-[92%] object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.75)]'
        }`}
      />

      {/* Active Auto-Hunt ON tag */}
      {item.statusTag ? (
        <span className="absolute right-0.5 top-0.5 z-20 rounded-full border border-emerald-200/90 bg-gradient-to-b from-emerald-500 to-emerald-700 px-1 py-0.5 text-[7.5px] font-black leading-none tracking-wider text-white shadow-[0_0_8px_rgba(16,185,129,0.9)]">
          {item.statusTag}
        </span>
      ) : null}

      {/* Live Unread Counter Badge (Notificações) */}
      {item.badge !== undefined && item.badge > 0 ? (
        <span
          aria-label={`${item.badge} não lidas`}
          className="absolute right-0.5 top-0.5 z-20 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-rose-200/95 bg-gradient-to-b from-rose-500 to-red-700 px-1 text-[8.5px] font-black leading-none text-white shadow-[0_0_8px_rgba(244,63,94,0.95)]"
        >
          {item.badge > 9 ? '9+' : item.badge}
        </span>
      ) : null}

      {/* Active Selected Neon Indicator Bar */}
      {item.active ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-0.5 left-1/2 z-20 h-[2.5px] w-6 -translate-x-1/2 rounded-full bg-amber-300 shadow-[0_0_10px_#fde047]"
        />
      ) : null}
    </button>
  );
}

function ServerExpCrystalIcon({
  ratePct,
  compact = false,
}: {
  ratePct: ServerExpRatePct;
  compact?: boolean;
}) {
  const palette =
    ratePct === 250
      ? { outer: '#fbbf24', inner: '#fef08a', core: '#f97316', glow: '#fde047' }
      : ratePct === 200
        ? { outer: '#e879f9', inner: '#f5d0fe', core: '#9333ea', glow: '#f0abfc' }
        : ratePct === 150
          ? { outer: '#34d399', inner: '#a7f3d0', core: '#059669', glow: '#6ee7b7' }
          : { outer: '#38bdf8', inner: '#bae6fd', core: '#0284c7', glow: '#7dd3fc' };

  return (
    <svg
      viewBox="0 0 36 36"
      className={
        compact
          ? 'h-[18px] w-[18px] shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)] sm:h-5 sm:w-5'
          : 'h-6 w-6 shrink-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)] sm:h-7 sm:w-7'
      }
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`exp-crystal-${ratePct}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.inner} />
          <stop offset="48%" stopColor={palette.outer} />
          <stop offset="100%" stopColor={palette.core} />
        </linearGradient>
      </defs>
      {/* Metallic Hexagonal Shield Rim */}
      <polygon
        points="18,2 32,10 32,26 18,34 4,26 4,10"
        fill="#05163a"
        stroke={palette.outer}
        strokeWidth="2.1"
      />
      {/* Luminous Inner Gem */}
      <polygon
        points="18,5.5 28.5,11.8 28.5,24.2 18,30.5 7.5,24.2 7.5,11.8"
        fill={`url(#exp-crystal-${ratePct})`}
        fillOpacity="0.24"
        stroke={palette.glow}
        strokeWidth="0.9"
      />
      {/* Upward Twin Energy Chevrons (Boost Arrow) */}
      <path
        d="M11.5 18.8 L18 11.8 L24.5 18.8"
        fill="none"
        stroke={palette.inner}
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.8 24.4 L18 18.8 L23.2 24.4"
        fill="none"
        stroke={palette.outer}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crown Spark */}
      <circle cx="18" cy="7.6" r="1.7" fill={palette.inner} />
    </svg>
  );
}

export const BottomHudDock = memo(function BottomHudDock({
  activeWindow,
  inventoryOpen,
  unreadNotifications,
  eggCollectedPulse = false,
  autoHuntEnabled = false,
  autoHuntTargetsCount = 0,
  serverExpRatePct = 100,
  guildExpBonusPct = 0,
  xpBoostUntilMs = null,
  isGM = false,
  currentMapId = 'dats-center',
  currentChannelId = 1,
  channelCounts,
  partyChannelCounts,
  partyLeaderChannelId = null,
  channelSwitching = false,
  onSelectChannel,
  onAdminChangeExpRate,
  onToggleInventory,
  onOpenWindow,
}: BottomHudDockProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expPopoverOpen, setExpPopoverOpen] = useState(false);
  const [channelPopoverOpen, setChannelPopoverOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const xpBoostActivePct = getActiveXpBoostBonusPct(xpBoostUntilMs, nowMs);
  const xpBoostRemainingLabel = formatXpBoostRemainingLabel(xpBoostUntilMs, nowMs);
  const totalBattleExpPct =
    serverExpRatePct + guildExpBonusPct + xpBoostActivePct;

  const activeChannelCount = channelCounts?.[currentChannelId] ?? 1;
  const activeChannelStatus = getChannelLoadStatus(activeChannelCount);
  const activeChannelStatusStyle =
    activeChannelStatus === 'full'
      ? {
          dot: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.95)]',
          label: 'Cheio',
          text: 'text-rose-200',
          border: 'border-rose-300/85',
        }
      : activeChannelStatus === 'busy'
        ? {
            dot: 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.9)]',
            label: 'Lotando',
            text: 'text-orange-200',
            border: 'border-orange-300/85',
          }
        : activeChannelStatus === 'normal'
          ? {
              dot: 'bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.85)]',
              label: 'Normal',
              text: 'text-amber-200',
              border: 'border-amber-300/80',
            }
          : {
              dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
              label: 'Livre',
              text: 'text-emerald-200',
              border: 'border-cyan-300/80',
            };

  useEffect(() => {
    if (!xpBoostUntilMs || xpBoostUntilMs <= Date.now()) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [xpBoostUntilMs]);

  // Close menu, channel or EXP popover cleanly with Escape
  useEffect(() => {
    if (!menuOpen && !expPopoverOpen && !channelPopoverOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setExpPopoverOpen(false);
        setChannelPopoverOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen, expPopoverOpen, channelPopoverOpen]);

  // Row 1 (7 core adventure, combat & shop items)
  const topRowMenus: MenuButtonConfig[] = [
    {
      id: 'character',
      label: 'Personagem',
      iconSrc: '/assets/menu/character.png?v=2',
      glowRgba: 'rgba(56, 232, 255, 0.85)',
      active: activeWindow === 'character',
      onClick: () => onOpenWindow('character'),
    },
    {
      id: 'digimon',
      label: 'Digimon',
      iconSrc: '/assets/menu/digimon.png?v=2',
      glowRgba: 'rgba(251, 191, 36, 0.85)',
      active: activeWindow === 'digimon',
      onClick: () => onOpenWindow('digimon'),
    },
    {
      id: 'inventory',
      label: 'Inventário',
      iconSrc: '/assets/menu/inventory.png?v=2',
      glowRgba: 'rgba(56, 189, 248, 0.85)',
      active: inventoryOpen,
      onClick: onToggleInventory,
    },
    {
      id: 'map',
      label: 'Mapa',
      iconSrc: '/assets/menu/map.png?v=2',
      glowRgba: 'rgba(34, 211, 238, 0.85)',
      active: activeWindow === 'map',
      onClick: () => onOpenWindow('map'),
    },
    {
      id: 'missions',
      label: 'Missões',
      iconSrc: '/assets/menu/missions.png?v=2',
      glowRgba: 'rgba(245, 158, 11, 0.85)',
      active: activeWindow === 'missions',
      onClick: () => onOpenWindow('missions'),
    },
    {
      id: 'auto',
      label: 'Auto-Ataque',
      iconSrc: '/assets/aistudio/file_00000000f148820e85b0f0989e0b8608_ae46689e.png',
      glowRgba: autoHuntEnabled
        ? 'rgba(52, 211, 153, 0.92)'
        : 'rgba(56, 232, 255, 0.88)',
      active: activeWindow === 'auto' || autoHuntEnabled,
      statusTag: autoHuntEnabled ? 'ON' : undefined,
      squareBadgeIcon: true,
      onClick: () => onOpenWindow('auto'),
    },
    {
      id: 'shop',
      label: 'Shop (Loja Digital)',
      iconSrc: '/assets/menu/shop.png?v=2',
      glowRgba: 'rgba(56, 232, 255, 0.92)',
      active: activeWindow === 'shop',
      featured: true,
      onClick: () => onOpenWindow('shop'),
    },
  ];

  // Row 2 (7 social, ranks, notification, settings & system items)
  const bottomRowMenus: MenuButtonConfig[] = [
    {
      id: 'guild',
      label: 'Guild',
      iconSrc: '/assets/menu/guild.png?v=2',
      glowRgba: 'rgba(250, 204, 21, 0.82)',
      active: activeWindow === 'guild',
      onClick: () => onOpenWindow('guild'),
    },
    {
      id: 'ranks',
      label: 'Ranks',
      iconSrc: '/assets/aistudio/file_000000003018820e80f1f96c3e36d9ef_597f2c97.png',
      glowRgba: 'rgba(251, 191, 36, 0.9)',
      active: activeWindow === 'ranks',
      squareBadgeIcon: true,
      onClick: () => onOpenWindow('ranks'),
    },
    {
      id: 'friends',
      label: 'Lista de Amigos',
      iconSrc: '/assets/menu/friends.png?v=2',
      glowRgba: 'rgba(52, 211, 153, 0.85)',
      active: activeWindow === 'friends',
      onClick: () => onOpenWindow('friends'),
    },
    {
      id: 'messenger',
      label: 'Mensagens',
      iconSrc: '/assets/menu/messenger.png?v=2',
      glowRgba: 'rgba(56, 232, 255, 0.85)',
      active: activeWindow === 'messenger',
      onClick: () => onOpenWindow('messenger'),
    },
    {
      id: 'notifications',
      label: 'Notificações',
      iconSrc: '/assets/menu/notifications.png?v=2',
      glowRgba: 'rgba(251, 191, 36, 0.88)',
      active: activeWindow === 'notifications',
      badge: unreadNotifications,
      onClick: () => onOpenWindow('notifications'),
    },
    {
      id: 'settings',
      label: 'Configurações',
      iconSrc: '/assets/menu/settings.png?v=2',
      glowRgba: 'rgba(125, 211, 252, 0.85)',
      active: activeWindow === 'settings',
      onClick: () => onOpenWindow('settings'),
    },
    {
      id: 'exit',
      label: 'Sair do Jogo',
      iconSrc: '/assets/menu/exit.png?v=2',
      glowRgba: 'rgba(251, 113, 133, 0.9)',
      active: activeWindow === 'exit-confirm',
      onClick: () => onOpenWindow('exit-confirm'),
    },
  ];

  const hasActiveChild = activeWindow !== null || inventoryOpen;

  return (
    <>
      {/* Click-outside backdrop when 2-row Menu Panel is open */}
      {menuOpen && (
        <div
          aria-hidden="true"
          onPointerDown={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
          }}
          className="pointer-events-auto fixed inset-0 z-25 bg-[#020817]/48"
        />
      )}

      {/* Floating 2-Row Professional Menu Panel (7 x 2 clean symmetrical grid) */}
      {menuOpen && (
        <div
          role="dialog"
          aria-label="Menu do Jogo"
          onPointerDown={(e) => e.stopPropagation()}
          className="animate-dmo-window mmorpg-dock-rail pointer-events-auto fixed bottom-[68px] left-1/2 z-40 w-[min(96vw,554px)] -translate-x-1/2 rounded-2xl p-2 select-none sm:bottom-[76px] sm:p-3.5"
        >
          {/* Compact Metallic Header */}
          <div className="mb-2 flex items-center justify-between border-b border-cyan-400/25 pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-cyan-300/60 bg-gradient-to-b from-[#1150c7] to-[#062261] shadow-[0_0_10px_rgba(56,214,255,0.45)]">
                <LayoutGrid className="h-3.5 w-3.5 text-cyan-100" />
              </span>
              <div className="flex items-baseline gap-2">
                <h2 className="font-[family-name:var(--font-display)] text-xs tracking-wider text-white sm:text-sm">
                  MENU
                </h2>
                <span className="text-[10px] font-semibold text-cyan-200/75">
                  Aventura · Ranks · Sistema
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Fechar Menu"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/35 bg-[#072154] text-cyan-200 transition hover:border-cyan-200 hover:bg-[#0c3278] active:scale-95"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Row 1: Gameplay, Auto & Adventure (7 icons) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {topRowMenus.map((item) => (
              <MmorpgMenuTile
                key={item.id}
                item={item}
                onSelect={() => setMenuOpen(false)}
              />
            ))}
          </div>

          {/* Subtle Cyan Hairline Divider between the 2 rows */}
          <div
            aria-hidden="true"
            className="my-2 h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent sm:my-2.5"
          />

          {/* Row 2: Social, Ranks & System (7 icons) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {bottomRowMenus.map((item) => (
              <MmorpgMenuTile
                key={item.id}
                item={item}
                onSelect={() => setMenuOpen(false)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom-Right Stack: Active Auto pill + Server EXP Booster Badge right ABOVE the MENU button */}
      <nav
        aria-label="Menu principal do jogo"
        onPointerDown={(e) => e.stopPropagation()}
        className="pointer-events-none flex w-full flex-col items-end justify-end gap-1.5 px-1.5 pb-2 sm:gap-2 sm:px-3 sm:pb-3 select-none"
      >
        {autoHuntEnabled && (
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setExpPopoverOpen(false);
              setChannelPopoverOpen(false);
              onOpenWindow('auto');
            }}
            aria-label="Configurar Auto-Ataque"
            className="pointer-events-auto flex min-h-[30px] items-center gap-1.5 rounded-xl border border-emerald-300/85 bg-gradient-to-b from-emerald-700/95 to-emerald-950/95 px-2.5 py-1 text-[10px] font-black tracking-wide text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.45)] transition hover:brightness-110 active:scale-95"
          >
            <img
              src="/assets/aistudio/file_00000000f148820e85b0f0989e0b8608_ae46689e.png"
              alt=""
              className="h-4 w-4 rounded object-cover"
            />
            <span>AUTO ON ({autoHuntTargetsCount}) · +50% EXP</span>
          </button>
        )}

        {/* DMO-Style 5-Channel Selector Widget (directly ABOVE Server EXP badge) */}
        {onSelectChannel && (
          <div className="pointer-events-auto relative flex flex-col items-end">
            {channelPopoverOpen && (
              <div
                role="dialog"
                aria-label="Seletor de Canais do Mapa"
                className="animate-dmo-window mb-1.5 w-[248px] rounded-2xl border border-cyan-300/75 bg-gradient-to-b from-[#0b3994]/96 via-[#061e56]/96 to-[#030e2c]/98 p-2.5 text-left shadow-[0_10px_30px_rgba(0,12,48,0.9),0_0_20px_rgba(56,214,255,0.35)]"
              >
                <div className="flex items-center justify-between border-b border-cyan-400/25 pb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-cyan-300/60 bg-[#07276b] text-cyan-200">
                      <Layers className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-black tracking-wide text-white">
                        CANAIS (CH 1–5)
                      </p>
                      <p className="truncate text-[9.5px] font-bold text-cyan-200/85">
                        {CHANNEL_MAP_LABELS[currentMapId]}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChannelPopoverOpen(false)}
                    aria-label="Fechar painel de canais"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-cyan-400/35 bg-[#051a48] text-cyan-200 hover:bg-sky-800"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {partyLeaderChannelId &&
                  partyLeaderChannelId !== currentChannelId && (
                    <button
                      type="button"
                      disabled={channelSwitching}
                      onClick={() => {
                        onSelectChannel(partyLeaderChannelId);
                        setChannelPopoverOpen(false);
                      }}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-300/85 bg-gradient-to-r from-amber-500/30 to-cyan-500/25 px-2.5 py-1.5 text-[10.5px] font-black text-amber-100 transition hover:brightness-115 active:scale-95 disabled:opacity-50"
                    >
                      <Users className="h-3.5 w-3.5 text-amber-300" />
                      <span>Ir com a Party (CH {partyLeaderChannelId})</span>
                    </button>
                  )}

                <div className="mt-2 space-y-1">
                  {WORLD_CHANNEL_IDS.map((ch) => {
                    const count = channelCounts?.[ch] ?? 0;
                    const partyInCh = partyChannelCounts?.[ch] ?? 0;
                    const status = getChannelLoadStatus(count);
                    const isCurrent = ch === currentChannelId;
                    const isBlockedFull =
                      status === 'full' && !isCurrent && !isGM && partyInCh === 0;
                    const dotClass =
                      status === 'full'
                        ? 'bg-rose-400'
                        : status === 'busy'
                          ? 'bg-orange-400'
                          : status === 'normal'
                            ? 'bg-amber-300'
                            : 'bg-emerald-400';
                    const statusLabel =
                      status === 'full'
                        ? 'Cheio'
                        : status === 'busy'
                          ? 'Lotando'
                          : status === 'normal'
                            ? 'Normal'
                            : 'Livre';
                    const statusTextClass =
                      status === 'full'
                        ? 'text-rose-300'
                        : status === 'busy'
                          ? 'text-orange-300'
                          : status === 'normal'
                            ? 'text-amber-200'
                            : 'text-emerald-300';

                    return (
                      <button
                        key={ch}
                        type="button"
                        disabled={isCurrent || isBlockedFull || channelSwitching}
                        onClick={() => {
                          onSelectChannel(ch);
                          setChannelPopoverOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 text-left transition active:scale-[0.98] ${
                          isCurrent
                            ? 'border-amber-300/90 bg-gradient-to-r from-[#1248ad]/95 to-[#082665]/95 shadow-[0_0_12px_rgba(251,191,36,0.28)]'
                            : isBlockedFull
                              ? 'cursor-not-allowed border-rose-500/35 bg-[#1b0816]/80 opacity-65'
                              : 'border-cyan-400/30 bg-[#041438]/90 hover:border-cyan-200/80 hover:bg-[#082461]/95'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`}
                          />
                          <span className="font-[family-name:var(--font-display)] text-[11px] font-black tracking-wide text-white">
                            CH {ch}
                          </span>
                          {isCurrent && (
                            <span className="rounded bg-amber-400/25 px-1 py-[1px] text-[8.5px] font-black uppercase text-amber-200">
                              Atual
                            </span>
                          )}
                          {partyInCh > 0 && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-cyan-400/25 px-1 py-[1px] text-[8.5px] font-black text-cyan-100">
                              <Users className="h-2.5 w-2.5" />
                              Party
                            </span>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5 text-[9.5px] font-extrabold tabular-nums">
                          <span className={statusTextClass}>{statusLabel}</span>
                          <span className="text-sky-200/80">
                            {count}/{CHANNEL_HARD_CAPACITY}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="mt-2 text-[9px] font-semibold leading-snug text-sky-200/75">
                  Troque de canal se o mapa estiver lotado. Todos os mapas possuem 5 canais.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setExpPopoverOpen(false);
                setChannelPopoverOpen((v) => !v);
              }}
              aria-expanded={channelPopoverOpen}
              aria-label={`Canal atual: CH ${currentChannelId} (${activeChannelCount} jogadores)`}
              title={`Canal atual: CH ${currentChannelId} — Clique para trocar de canal`}
              className={`group relative flex min-h-[32px] w-[80px] items-center justify-center gap-1 rounded-xl border-2 px-1.5 py-1 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:min-h-[36px] sm:w-[98px] sm:gap-1.5 sm:rounded-2xl sm:px-2 ${
                channelPopoverOpen
                  ? 'border-amber-300 bg-gradient-to-b from-[#134ec2]/95 via-[#082a75]/95 to-[#031238]/95 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.45)]'
                  : `${activeChannelStatusStyle.border} bg-gradient-to-b from-[#0b388f]/95 via-[#061d52]/95 to-[#030e2c]/95 text-cyan-100 shadow-[0_4px_14px_rgba(0,12,48,0.8),0_0_10px_rgba(56,214,255,0.28)] hover:border-cyan-200`
              }`}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md border border-cyan-300/45 bg-[#04143a]/85 text-cyan-200 sm:h-5 sm:w-5">
                <Layers className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </span>
              <div className="flex min-w-0 flex-col items-start leading-none">
                <span className="flex items-center gap-1 font-[family-name:var(--font-display)] text-[9.5px] font-black tracking-wide text-white drop-shadow sm:text-[11px]">
                  <span>CH {currentChannelId}</span>
                  <span
                    className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${activeChannelStatusStyle.dot}`}
                  />
                </span>
                <span
                  className={`mt-0.5 max-w-full truncate text-[7.5px] font-extrabold uppercase tracking-wider tabular-nums sm:text-[8px] ${activeChannelStatusStyle.text}`}
                >
                  {channelSwitching
                    ? 'Indo...'
                    : `${activeChannelCount}/${CHANNEL_HARD_CAPACITY}`}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Server EXP Booster Widget (100% / 150% / 200% / 250%) + GM Quick Popover */}
        <div className="pointer-events-auto relative flex flex-col items-end">
          {expPopoverOpen && (
            <div
              role="dialog"
              aria-label="Taxa de EXP do Servidor"
              className="animate-dmo-window mb-1.5 w-[238px] rounded-2xl border border-cyan-300/75 bg-gradient-to-b from-[#0b3994]/96 via-[#061e56]/96 to-[#030e2c]/98 p-3 text-left shadow-[0_10px_30px_rgba(0,12,48,0.88),0_0_20px_rgba(56,214,255,0.35)]"
            >
              <div className="flex items-center justify-between border-b border-cyan-400/25 pb-2">
                <div className="flex items-center gap-1.5">
                  <ServerExpCrystalIcon ratePct={serverExpRatePct} />
                  <div>
                    <p className="text-[11px] font-black tracking-wide text-white">
                      EXP DO SERVIDOR
                    </p>
                    <p className="text-[9.5px] font-bold text-cyan-200/85">
                      {serverExpRatePct === 100
                        ? 'Taxa Padrão (1.0x)'
                        : `Evento Ativo (${(serverExpRatePct / 100).toFixed(1)}x)`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpPopoverOpen(false)}
                  aria-label="Fechar painel de EXP"
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-cyan-400/35 bg-[#051a48] text-cyan-200 hover:bg-sky-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-2 space-y-1 text-[10.5px] font-bold text-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-200/85">Servidor:</span>
                  <span className="font-black tabular-nums text-amber-200">
                    {serverExpRatePct}% EXP
                  </span>
                </div>
                {guildExpBonusPct > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-300/90">Bônus da Guilda:</span>
                    <span className="font-black tabular-nums text-emerald-300">
                      +{guildExpBonusPct}% EXP
                    </span>
                  </div>
                )}
                {xpBoostActivePct > 0 && xpBoostRemainingLabel && (
                  <div className="flex items-center justify-between">
                    <span className="text-amber-300">
                      ⚡ Boost XP ({xpBoostRemainingLabel}):
                    </span>
                    <span className="font-black tabular-nums text-amber-300">
                      +{xpBoostActivePct}% EXP
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-cyan-400/20 pt-1">
                  <span className="text-white">Total em Batalha:</span>
                  <span className="font-black tabular-nums text-cyan-200">
                    {totalBattleExpPct}% EXP
                  </span>
                </div>
              </div>

              {isGM && onAdminChangeExpRate && (
                <div className="mt-2.5 border-t border-amber-300/30 pt-2">
                  <p className="mb-1.5 flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider text-amber-300">
                    <Crown className="h-3 w-3" />
                    <span>Controle GM · Alterar Servidor</span>
                  </p>
                  <div className="grid grid-cols-4 gap-1">
                    {ALLOWED_SERVER_EXP_RATES.map((rate) => {
                      const active = serverExpRatePct === rate;
                      return (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => {
                            onAdminChangeExpRate(rate);
                          }}
                          className={`min-h-[34px] rounded-lg border text-[10px] font-black tabular-nums transition active:scale-95 ${
                            active
                              ? 'border-amber-300 bg-amber-400/30 text-amber-100 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                              : 'border-cyan-400/35 bg-[#041438] text-cyan-100 hover:border-cyan-200'
                          }`}
                        >
                          {rate}%
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setChannelPopoverOpen(false);
              setExpPopoverOpen((v) => !v);
            }}
            aria-expanded={expPopoverOpen}
            aria-label={`Taxa de EXP total em batalha: ${totalBattleExpPct}%`}
            title={
              xpBoostRemainingLabel
                ? `EXP em Batalha: ${totalBattleExpPct}% (Boost +100% ativo: ${xpBoostRemainingLabel})`
                : isGM
                  ? `EXP do Servidor: ${serverExpRatePct}% (Clique para alterar como GM)`
                  : `EXP do Servidor: ${serverExpRatePct}%`
            }
            className={`group relative flex min-h-[34px] w-[80px] items-center justify-center gap-1 rounded-xl border-2 px-1.5 py-1 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:min-h-[40px] sm:w-[98px] sm:gap-1.5 sm:rounded-2xl sm:px-2 ${
              xpBoostActivePct > 0 || serverExpRatePct === 250
                ? 'border-amber-300 bg-gradient-to-b from-[#92400e]/95 via-[#451a03]/95 to-[#1c0a00]/95 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                : serverExpRatePct === 200
                  ? 'border-fuchsia-300/90 bg-gradient-to-b from-[#6b21a8]/95 via-[#3b0764]/95 to-[#1e0436]/95 text-fuchsia-100 shadow-[0_0_18px_rgba(217,70,239,0.5)]'
                  : serverExpRatePct === 150
                    ? 'border-emerald-300/90 bg-gradient-to-b from-[#065f46]/95 via-[#064e3b]/95 to-[#022c22]/95 text-emerald-100 shadow-[0_0_16px_rgba(52,211,153,0.45)]'
                    : 'border-cyan-300/80 bg-gradient-to-b from-[#0c3f9e]/95 via-[#06205a]/95 to-[#031033]/95 text-cyan-100 shadow-[0_4px_16px_rgba(0,12,48,0.8),0_0_12px_rgba(56,214,255,0.3)] hover:border-cyan-200'
            }`}
          >
            <ServerExpCrystalIcon ratePct={serverExpRatePct} compact />
            <div className="flex min-w-0 flex-col items-start leading-none">
              <span className="truncate font-[family-name:var(--font-display)] text-[9.5px] font-black tabular-nums tracking-tight text-white drop-shadow sm:text-[11px]">
                {totalBattleExpPct}%
              </span>
              <span className="mt-0.5 max-w-full truncate text-[7.5px] font-extrabold uppercase tracking-wider text-cyan-200/90 sm:text-[8px]">
                {xpBoostRemainingLabel
                  ? `⚡${xpBoostRemainingLabel}`
                  : guildExpBonusPct > 0
                    ? `+${guildExpBonusPct}%G`
                    : 'EXP'}
              </span>
            </div>
          </button>
        </div>

        {/* Compact Professional "MENU" Base Button */}
        <button
          type="button"
          onClick={() => {
            setExpPopoverOpen(false);
            setChannelPopoverOpen(false);
            setMenuOpen((prev) => !prev);
          }}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Fechar Menu do Jogo' : 'Abrir Menu do Jogo'}
          className={`pointer-events-auto relative flex min-h-[40px] w-[80px] items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-1.5 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:min-h-[48px] sm:w-[98px] sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-2 ${
            eggCollectedPulse
              ? 'scale-110 border-amber-300 bg-gradient-to-b from-[#d97706] via-[#0e48b8] to-[#051b54] text-amber-100 shadow-[0_0_28px_rgba(253,224,71,0.92),0_0_14px_rgba(56,232,255,0.75)]'
              : menuOpen
                ? 'border-amber-300 bg-gradient-to-b from-[#1762e6] via-[#0c3ca0] to-[#051b54] text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.55)]'
                : hasActiveChild
                  ? 'border-cyan-200 bg-gradient-to-b from-[#1255cf] via-[#082e82] to-[#041545] text-white shadow-[0_0_20px_rgba(56,214,255,0.55)]'
                  : 'border-cyan-300/80 bg-gradient-to-b from-[#0e48b8]/95 via-[#07266d]/95 to-[#03123b]/95 text-white shadow-[0_6px_22px_rgba(0,12,48,0.8),0_0_16px_rgba(0,180,255,0.35)] hover:border-cyan-200 hover:brightness-110'
          }`}
        >
          {/* Metallic top inner sheen */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-2 top-0.5 h-[1px] rounded-full bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent"
          />

          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors sm:h-6 sm:w-6 sm:rounded-lg ${
              menuOpen
                ? 'border-amber-200/80 bg-amber-400/20 text-amber-200'
                : 'border-cyan-300/50 bg-[#04143a]/70 text-cyan-200'
            }`}
          >
            {menuOpen ? (
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </span>

          <span className="font-[family-name:var(--font-display)] text-[10px] tracking-wider text-white drop-shadow sm:text-[12.5px]">
            MENU
          </span>

          {/* Unread Notifications Badge directly on MENU base button */}
          {unreadNotifications > 0 && !menuOpen ? (
            <span
              aria-label={`${unreadNotifications} notificações não lidas`}
              className="absolute -right-1 -top-1 z-20 flex h-4.5 min-w-[18px] items-center justify-center rounded-full border border-rose-200 bg-gradient-to-b from-rose-500 to-red-700 px-1 text-[9px] font-black leading-none text-white shadow-[0_0_10px_rgba(244,63,94,0.95)] sm:h-5 sm:min-w-[20px] sm:text-[9.5px]"
            >
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          ) : null}
        </button>
      </nav>
    </>
  );
});
