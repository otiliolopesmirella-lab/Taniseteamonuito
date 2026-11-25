import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Compass,
  Flame,
  Gift,
  Lock,
  Map as MapIcon,
  MapPin,
  Navigation,
  Shield,
  Sparkles,
  Swords,
  TrainFront,
  Wrench,
  X,
} from 'lucide-react';
import {
  WORLD_MAP_REGIONS,
  type PlayableMapId,
  type WorldMapRegion,
} from '../../data/worldMapCatalog';
import { getWildDigimonPortraitUrl } from '../../sprites/wildDigimonSprites';
import type {
  DigimonRuntimeStats,
  LiveWorldHudSnapshot,
  TamerRuntimeStats,
} from '../../types/hud';
import { playDigitalTone } from '../../utils/soundFx';

interface WorldMapModalProps {
  snapshot: LiveWorldHudSnapshot;
  tamerStats: TamerRuntimeStats;
  digimonStats: DigimonRuntimeStats;
  defeatedTotal: number;
  soundEnabled: boolean;
  isGM?: boolean;
  onTravelToMap: (mapId: PlayableMapId) => void;
  onClose: () => void;
}

type ModalTab = 'mapas' | 'mapa-mundi' | 'eventos' | 'dungeon';

interface MapRouteSummary {
  originLabel: string;
  nextLabel: string;
}

const MAP_ROUTE_SUMMARIES: Record<PlayableMapId, MapRouteSummary> = {
  'dats-center': {
    originLabel: 'Base principal (Cidade Segura)',
    nextLabel: 'Portal Sul → Estação D-Terminal',
  },
  'd-terminal': {
    originLabel: 'Portal Norte → DATS Center',
    nextLabel: 'Fale com PawnChessmon (Black) → Planície Digital',
  },
  'hunting-plains': {
    originLabel: 'Portal Oeste → D-Terminal',
    nextLabel: 'Portal Leste → Floresta de Dados (Nv. 10+)',
  },
  'data-forest': {
    originLabel: 'Portal Oeste → Planície Digital',
    nextLabel: 'Portal Leste → Montanha Digital (Nv. 25+)',
  },
  'digi-mountain': {
    originLabel: 'Portal Oeste → Floresta de Dados',
    nextLabel: 'Portal Leste → Deserto Digital (Nv. 40+)',
  },
  'digital-desert': {
    originLabel: 'Portal Oeste → Montanha Digital',
    nextLabel: 'Portal Leste → Mar de Dados (Nv. 55+)',
  },
  'data-sea': {
    originLabel: 'Portal Oeste → Deserto Digital',
    nextLabel: 'Portal Leste → Ilha dos Digimon (Nv. 70+)',
  },
  'digimon-island': {
    originLabel: 'Portal Oeste → Mar de Dados',
    nextLabel: 'Portal Leste → Área Sombria (Nv. 85+)',
  },
  'dark-area': {
    originLabel: 'Portal Oeste → Ilha dos Digimon',
    nextLabel: 'Portal Leste → Mundo Virtual (Nv. 95+)',
  },
  'virtual-world': {
    originLabel: 'Portal Oeste → Área Sombria',
    nextLabel: 'Mapa final de caça (Nv. 95–120)',
  },
};

const PLAYABLE_WORLD_REGIONS: readonly WorldMapRegion[] = WORLD_MAP_REGIONS.filter(
  (r) => r.implemented && r.playableMapId !== null
);

function findRegionByPlayableId(mapId: PlayableMapId): WorldMapRegion {
  return (
    PLAYABLE_WORLD_REGIONS.find((r) => r.playableMapId === mapId) ??
    PLAYABLE_WORLD_REGIONS[0]
  );
}

function getRegionAccessState(
  region: WorldMapRegion,
  currentMapId: PlayableMapId,
  digimonLevel: number,
  isGM: boolean
): 'current' | 'available' | 'level-locked' {
  if (region.playableMapId === currentMapId) return 'current';
  if (isGM) return 'available';
  if (region.minLevel > 1 && digimonLevel < region.minLevel) {
    return 'level-locked';
  }
  return 'available';
}

function isSafeHubRegion(region: WorldMapRegion): boolean {
  return region.zoneType === 'Zona Segura';
}

function getShortMobPreview(region: WorldMapRegion): string {
  if (region.playableMapId === 'dats-center') {
    return 'NPCs: Sampson, MudFrigimon, Incubadora e Archive';
  }
  if (region.playableMapId === 'd-terminal') {
    return 'Estação central · Condutor PawnChessmon (Black)';
  }
  if (region.enemies.length === 0) return region.subtitle;
  const names = region.enemies.slice(0, 3).map((e) => e.name);
  const extra = region.enemies.length - names.length;
  return extra > 0 ? `${names.join(', ')} +${extra}` : names.join(', ');
}

export function WorldMapModal({
  snapshot,
  digimonStats,
  soundEnabled,
  isGM = false,
  onTravelToMap,
  onClose,
}: WorldMapModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('mapas');
  const [selectedRegionId, setSelectedRegionId] = useState<PlayableMapId>(
    snapshot.mapId
  );
  // Mobile-only drilldown: false = clean scannable list, true = full-screen readable map guide
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const selectedRegion = useMemo(
    () => findRegionByPlayableId(selectedRegionId),
    [selectedRegionId]
  );
  const currentRegion = useMemo(
    () => findRegionByPlayableId(snapshot.mapId),
    [snapshot.mapId]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (mobileDetailOpen) {
          setMobileDetailOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileDetailOpen, onClose]);

  const handleOpenRegionDetail = (mapId: PlayableMapId) => {
    playDigitalTone('click', soundEnabled);
    setSelectedRegionId(mapId);
    setActiveTab('mapas');
    setMobileDetailOpen(true);
  };

  const selectedRoute = selectedRegion.playableMapId
    ? MAP_ROUTE_SUMMARIES[selectedRegion.playableMapId]
    : null;

  const renderDetailContent = (region: WorldMapRegion) => {
    const access = getRegionAccessState(
      region,
      snapshot.mapId,
      digimonStats.level,
      isGM
    );
    const isSafe = isSafeHubRegion(region);
    const route = region.playableMapId
      ? MAP_ROUTE_SUMMARIES[region.playableMapId]
      : null;

    return (
      <div className="space-y-4 pb-4">
        {/* Clean Map Hero Banner */}
        <div className="relative h-36 overflow-hidden rounded-2xl border border-cyan-300/35 sm:h-40">
          <img
            src={region.bannerUrl}
            alt={region.name}
            className="h-full w-full object-cover brightness-85"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030d27] via-[#030d27]/50 to-transparent" />
          <div className="absolute inset-x-3.5 bottom-3 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold tracking-wide text-cyan-300 uppercase">
                {isSafe
                  ? 'Zona Segura'
                  : `Mapa de Caça · ${region.recommendedLevel.replace('Lv. ', 'Nv. ')}`}
              </p>
              <h3 className="truncate text-lg font-black leading-tight text-white sm:text-xl">
                {region.name}
              </h3>
            </div>

            <span
              className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-black ${
                access === 'current'
                  ? 'border-cyan-300 bg-cyan-500/25 text-cyan-100'
                  : access === 'level-locked'
                    ? 'border-amber-300/70 bg-amber-950/85 text-amber-200'
                    : 'border-emerald-300/60 bg-emerald-950/80 text-emerald-200'
              }`}
            >
              {access === 'current'
                ? 'Você está aqui'
                : access === 'level-locked'
                  ? `Requer Nv. ${region.minLevel}+`
                  : 'Liberado'}
            </span>
          </div>
        </div>

        {/* Short Clear Description */}
        <p className="text-[13.5px] leading-relaxed text-sky-50/95">
          {region.description}
        </p>

        {/* Como Chegar (Routes & Portals) */}
        {route && (
          <section className="rounded-2xl border border-cyan-400/25 bg-[#051436] p-3.5">
            <h4 className="flex items-center gap-2 text-xs font-black tracking-wide text-cyan-300 uppercase">
              {region.playableMapId === 'd-terminal' ? (
                <TrainFront className="h-4 w-4 text-amber-300" />
              ) : (
                <Compass className="h-4 w-4 text-amber-300" />
              )}
              <span>Como chegar e portais</span>
            </h4>
            <div className="mt-2.5 space-y-2 text-[13px]">
              <div className="flex items-start gap-2.5 rounded-xl bg-[#030d24] px-3 py-2">
                <ArrowLeft className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <span className="font-semibold text-sky-100">
                  {route.originLabel}
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-[#030d24] px-3 py-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <span className="font-bold text-amber-200">
                  {route.nextLabel}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Wild Digimons & Exact Levels */}
        {region.enemies.length > 0 ? (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="flex items-center gap-2 text-xs font-black tracking-wide text-cyan-300 uppercase">
                <Swords className="h-4 w-4 text-amber-300" />
                <span>Digimons do Mapa ({region.enemies.length})</span>
              </h4>
              <span className="text-xs font-bold text-amber-200 tabular-nums">
                {region.recommendedLevel.replace('Lv. ', 'Nv. ')}
              </span>
            </div>

            <div className="space-y-2">
              {region.enemies.map((enemy) => {
                const portrait = enemy.species
                  ? getWildDigimonPortraitUrl(enemy.species)
                  : null;
                const isBoss =
                  enemy.species === 'kuwagamon' ||
                  enemy.levelLabel.toLowerCase().includes('boss');

                return (
                  <div
                    key={enemy.name}
                    className={`flex items-center gap-3 rounded-xl border p-2.5 ${
                      isBoss
                        ? 'border-rose-400/75 bg-[#2a0a1a]'
                        : 'border-cyan-400/20 bg-[#051436]'
                    }`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-[#030d24] p-1">
                      {portrait ? (
                        <img
                          src={portrait}
                          alt={enemy.name}
                          className="h-full w-full object-contain [image-rendering:pixelated]"
                        />
                      ) : (
                        <Swords className="h-5 w-5 text-cyan-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-black text-white">
                          {enemy.name}
                        </p>
                        <span
                          className={`shrink-0 text-xs font-black tabular-nums ${
                            isBoss ? 'text-rose-300' : 'text-amber-300'
                          }`}
                        >
                          {enemy.levelLabel.replace('Lv.', 'Nv.')}
                        </span>
                      </div>
                      {enemy.habitat && (
                        <p className="mt-0.5 text-xs text-sky-200/80">
                          {enemy.habitat}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-emerald-400/30 bg-emerald-950/25 p-3.5 text-[13px] text-emerald-100">
            <p className="flex items-center gap-2 font-black text-emerald-200">
              <Shield className="h-4.5 w-4.5 shrink-0" />
              <span>Zona Segura — Sem Combates</span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-100/90">
              {region.playableMapId === 'dats-center'
                ? 'Aqui ficam Richard Sampson, Loja do MudFrigimon, Incubadora e Digimon Archive. Seu HP e DS regeneram naturalmente.'
                : 'Estação ferroviária central do Mundo Digital. Converse com o Condutor PawnChessmon (Black) na frente do trem para embarcar rumo à Planície Digital.'}
            </p>
          </section>
        )}

        {/* Drops & Rewards */}
        {region.rewards.length > 0 && (
          <section className="rounded-2xl border border-cyan-400/25 bg-[#051436] p-3.5">
            <h4 className="flex items-center gap-2 text-xs font-black tracking-wide text-amber-300 uppercase">
              <Gift className="h-4 w-4" />
              <span>Drops e Destaques</span>
            </h4>
            <div className="mt-2.5 divide-y divide-cyan-400/15">
              {region.rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="py-2 first:pt-0 last:pb-0"
                >
                  <p className="text-xs font-black text-white">{reward.label}</p>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-sky-200/85">
                    {reward.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* GM-Only Quick Teleport */}
        {isGM &&
          region.playableMapId &&
          region.playableMapId !== snapshot.mapId && (
            <button
              type="button"
              onClick={() => {
                if (!region.playableMapId) return;
                playDigitalTone('confirm', soundEnabled);
                onTravelToMap(region.playableMapId);
                onClose();
              }}
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-amber-300/75 bg-amber-500/20 px-4 text-xs font-black text-amber-200 transition hover:bg-amber-500/30 active:scale-95"
            >
              <Navigation className="h-4 w-4" />
              <span>Teleporte Rápido GM → {region.name}</span>
            </button>
          )}
      </div>
    );
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Guia de Mapas do Mundo Digital"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020816]/82 p-1.5 backdrop-blur-[2px] sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window flex h-[92dvh] w-full max-w-[960px] flex-col overflow-hidden rounded-2xl border-2 border-cyan-300/75 bg-gradient-to-b from-[#082c78] via-[#051845] to-[#030c24] shadow-[0_16px_54px_rgba(0,0,0,0.85),0_0_36px_rgba(0,174,255,0.42)] sm:h-[88dvh]"
      >
        {/* COMPACT STICKY HEADER (<= 14% mobile height) */}
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-cyan-400/30 bg-[#06215c] px-3 py-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            {activeTab === 'mapas' && mobileDetailOpen ? (
              <button
                type="button"
                onClick={() => {
                  playDigitalTone('click', soundEnabled);
                  setMobileDetailOpen(false);
                }}
                aria-label="Voltar para lista de mapas"
                className="flex h-10 items-center gap-1.5 rounded-xl border border-cyan-300/60 bg-[#093282] px-3 text-xs font-black text-white active:scale-95 lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </button>
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/50 bg-[#093282] text-amber-300">
                <MapIcon className="h-4.5 w-4.5" />
              </span>
            )}

            <div className="min-w-0">
              <h2 className="truncate font-[family-name:var(--font-display)] text-sm font-black tracking-wide text-white sm:text-base">
                {activeTab === 'mapas' && mobileDetailOpen
                  ? selectedRegion.name
                  : 'Guia de Mapas'}
              </h2>
              <p className="truncate text-[11px] font-bold text-cyan-200/85 tabular-nums">
                Seu Digimon: Nv. {digimonStats.level} · {currentRegion.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playDigitalTone('click', soundEnabled);
              onClose();
            }}
            aria-label="Fechar Guia de Mapas"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-300/60 bg-gradient-to-b from-rose-500 to-rose-700 text-white transition hover:brightness-110 active:scale-95"
          >
            <X className="h-5 w-5 stroke-[3]" />
          </button>
        </header>

        {/* SINGLE SLIM TAB BAR */}
        <nav
          aria-label="Seções do Guia de Mapas"
          className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-cyan-400/20 bg-[#041230] px-3 py-2 sm:px-5"
        >
          {(
            [
              { id: 'mapas', label: 'Mapas', icon: Compass },
              { id: 'mapa-mundi', label: 'Mapa Mundi', icon: MapPin },
              { id: 'eventos', label: 'Eventos', icon: CalendarDays },
              { id: 'dungeon', label: 'Dungeon', icon: Flame },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playDigitalTone('click', soundEnabled);
                  setActiveTab(tab.id);
                  if (tab.id !== 'mapas') setMobileDetailOpen(false);
                }}
                className={`flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-black whitespace-nowrap transition active:scale-95 ${
                  active
                    ? 'border-cyan-300 bg-cyan-500/22 text-white shadow-[0_0_12px_rgba(34,211,238,0.22)]'
                    : 'border-cyan-400/20 bg-[#071b45] text-sky-200/80 hover:border-cyan-300/45 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* MAIN CONTENT AREA */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {/* TAB 1: MAPAS — Mobile Master-Detail + Desktop 2-Pane */}
          {activeTab === 'mapas' && (
            <div className="flex h-full min-h-0">
              {/* LEFT / MOBILE LIST */}
              <div
                className={`min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:w-[350px] lg:flex-none lg:border-r lg:border-cyan-400/20 ${
                  mobileDetailOpen ? 'hidden lg:block' : 'block'
                }`}
              >
                <p className="mb-2.5 text-xs font-semibold text-cyan-200/85">
                  Toque em um mapa para ver Digimons, níveis, drops e portais.
                </p>

                <div className="space-y-2">
                  {PLAYABLE_WORLD_REGIONS.map((region) => {
                    const playableId = region.playableMapId;
                    if (!playableId) return null;
                    const access = getRegionAccessState(
                      region,
                      snapshot.mapId,
                      digimonStats.level,
                      isGM
                    );
                    const isSelected = region.playableMapId === selectedRegion.playableMapId;
                    const isLocked = access === 'level-locked';
                    const isSafe = isSafeHubRegion(region);

                    return (
                      <button
                        key={region.id}
                        type="button"
                        onClick={() => handleOpenRegionDetail(playableId)}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition active:scale-[0.99] ${
                          isSelected
                            ? 'border-cyan-300 bg-[#0b2e73]/90 shadow-[0_0_16px_rgba(56,189,248,0.22)]'
                            : 'border-cyan-400/20 bg-[#051436]/90 hover:border-cyan-300/50 hover:bg-[#082052]'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-cyan-300/30 bg-[#030d24]">
                          <img
                            src={region.thumbUrl || region.bannerUrl}
                            alt={region.name}
                            className={`h-full w-full object-cover ${
                              isLocked ? 'grayscale-[55%] opacity-75' : ''
                            }`}
                          />
                          {isLocked && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-amber-300">
                              <Lock className="h-4.5 w-4.5" />
                            </span>
                          )}
                        </div>

                        {/* Clean Scannable Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-black text-white">
                              {region.name}
                            </p>
                            <span
                              className={`shrink-0 text-xs font-black tabular-nums ${
                                isSafe
                                  ? 'text-emerald-300'
                                  : isLocked
                                    ? 'text-amber-300'
                                    : 'text-[#ffe047]'
                              }`}
                            >
                              {isSafe
                                ? 'Segura'
                                : region.recommendedLevel.replace('Lv. ', 'Nv. ')}
                            </span>
                          </div>

                          <p className="mt-0.5 truncate text-xs text-sky-200/80">
                            {getShortMobPreview(region)}
                          </p>

                          <div className="mt-1 flex items-center gap-2 text-[11px] font-extrabold">
                            {access === 'current' ? (
                              <span className="text-cyan-300">
                                Você está aqui
                              </span>
                            ) : isLocked ? (
                              <span className="text-amber-300">
                                Requer Nv. {region.minLevel}+
                              </span>
                            ) : (
                              <span className="text-emerald-300/90">
                                Liberado
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 shrink-0 text-cyan-300/80" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT / MOBILE DETAIL VIEW */}
              <div
                className={`min-h-0 flex-1 overflow-y-auto p-3.5 sm:p-5 ${
                  mobileDetailOpen ? 'block' : 'hidden lg:block'
                }`}
              >
                {renderDetailContent(selectedRegion)}
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE MAPA MUNDI */}
          {activeTab === 'mapa-mundi' && (
            <div className="flex h-full min-h-0 flex-col gap-3 p-3 sm:p-4">
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-cyan-300/40 bg-[#041436]">
                <img
                  src="/assets/map/world_map_base.png"
                  alt="Mapa Mundi do Mundo Digital"
                  draggable={false}
                  className="h-full w-full object-cover opacity-90"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030d24]/80 via-transparent to-[#030d24]/35" />

                {PLAYABLE_WORLD_REGIONS.map((region) => {
                  const playableId = region.playableMapId;
                  if (!playableId) return null;
                  const access = getRegionAccessState(
                    region,
                    snapshot.mapId,
                    digimonStats.level,
                    isGM
                  );
                  const isSelected = playableId === selectedRegion.playableMapId;
                  const isCurrent = access === 'current';

                  return (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() => {
                        playDigitalTone('click', soundEnabled);
                        setSelectedRegionId(playableId);
                      }}
                      style={{
                        left: `${region.mapCoords.x}%`,
                        top: `${region.mapCoords.y}%`,
                      }}
                      className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-lg transition sm:h-9 sm:w-9 ${
                            isCurrent
                              ? 'scale-110 border-white bg-cyan-500 text-slate-950'
                              : isSelected
                                ? 'scale-110 border-amber-200 bg-amber-400 text-slate-950'
                                : access === 'level-locked'
                                  ? 'border-slate-500 bg-slate-900/90 text-slate-300'
                                  : 'border-cyan-300 bg-[#07235c]/95 text-cyan-100'
                          }`}
                        >
                          {access === 'level-locked' ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                        </span>
                        <span
                          className={`mt-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-black shadow ${
                            isSelected
                              ? 'border-amber-300 bg-[#061d52] text-amber-200'
                              : 'border-cyan-400/35 bg-[#030e29]/92 text-white'
                          }`}
                        >
                          {region.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Clean Mobile Bottom Summary Bar for Selected Node */}
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300/40 bg-[#051436] p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black text-white">
                      {selectedRegion.name}
                    </p>
                    <span className="text-xs font-black text-amber-300 tabular-nums">
                      {isSafeHubRegion(selectedRegion)
                        ? 'Zona Segura'
                        : selectedRegion.recommendedLevel.replace('Lv. ', 'Nv. ')}
                    </span>
                  </div>
                  {selectedRoute && (
                    <p className="mt-0.5 truncate text-xs text-sky-200/85">
                      {selectedRoute.nextLabel}
                    </p>
                  )}
                </div>

                {selectedRegion.playableMapId && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRegion.playableMapId) {
                        handleOpenRegionDetail(selectedRegion.playableMapId);
                      }
                    }}
                    className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-cyan-200 bg-gradient-to-r from-cyan-400 to-sky-400 px-4 text-xs font-black text-slate-950 transition hover:brightness-110 active:scale-95"
                  >
                    <span>Ver Digimons e Drops</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3 & 4: EVENTOS & DUNGEON (Em Desenvolvimento) */}
          {(activeTab === 'eventos' || activeTab === 'dungeon') && (
            <div className="flex h-full items-center justify-center p-4">
              <div className="w-full max-w-[440px] space-y-3 rounded-2xl border border-amber-300/35 bg-[#051436] p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/50 bg-amber-500/15 text-amber-300">
                  {activeTab === 'eventos' ? (
                    <Sparkles className="h-7 w-7" />
                  ) : (
                    <Flame className="h-7 w-7" />
                  )}
                </div>
                <h3 className="text-lg font-black text-white">
                  {activeTab === 'eventos'
                    ? 'Eventos · Em Desenvolvimento'
                    : 'Dungeons · Em Desenvolvimento'}
                </h3>
                <p className="text-sm leading-relaxed text-sky-100/85">
                  {activeTab === 'eventos'
                    ? 'Eventos especiais de invasão, bônus sazonais e recompensas exclusivas estão em desenvolvimento e chegam em breve.'
                    : 'Instâncias cooperativas com chefes épicos e recompensas raras estão em desenvolvimento e chegam em atualizações futuras.'}
                </p>
                <div className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-[#072056] px-3.5 py-2 text-xs font-extrabold text-cyan-200">
                  <Wrench className="h-4 w-4" />
                  <span>Em breve no Digital World</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
