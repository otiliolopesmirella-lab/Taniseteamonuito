import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronsRight,
  Info,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  ScrollText,
  Shield,
  Swords,
  Users,
  X,
} from 'lucide-react';
import {
  WORLD_MAP_REGIONS,
  getRegionAccessState,
  getRegionLiveMissions,
  type PlayableMapId,
  type WorldMapCategory,
  type WorldMapRegion,
} from '../../data/worldMapCatalog';
import type {
  DigimonRuntimeStats,
  LiveWorldHudSnapshot,
  TamerRuntimeStats,
} from '../../types/hud';
import { playDigitalTone } from '../../utils/soundFx';
import { getWildDigimonPortraitUrl } from '../../sprites/wildDigimonSprites';

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

const CATEGORY_TABS: readonly { id: WorldMapCategory; label: string }[] = [
  { id: 'mundo', label: 'Mundo' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'dungeon', label: 'Dungeon' },
] as const;

const MIN_ZOOM = 1.0;
const MAX_ZOOM = 2.4;
const ZOOM_STEP = 0.25;

/** Crisp 8-point white-cyan Compass Rose matching the reference map's top-right N compass */
function MapCompassRose() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-3 top-2.5 z-20 flex flex-col items-center drop-shadow-[0_0_10px_rgba(56,220,255,0.85)]"
    >
      <span className="text-[12px] font-black leading-none tracking-wider text-white drop-shadow-[0_1px_4px_rgba(0,18,60,0.95)]">
        N
      </span>
      <svg viewBox="0 0 64 64" className="mt-0.5 h-11 w-11 sm:h-12 sm:w-12">
        {/* Diagonal secondary points */}
        <polygon points="32,32 14,14 27,32" fill="#7dd3fc" opacity="0.82" />
        <polygon points="32,32 50,14 37,32" fill="#38bdf8" opacity="0.82" />
        <polygon points="32,32 14,50 27,32" fill="#38bdf8" opacity="0.82" />
        <polygon points="32,32 50,50 37,32" fill="#7dd3fc" opacity="0.82" />
        {/* Main cardinal 4-point star */}
        <polygon points="32,3 37,27 32,32 27,27" fill="#ffffff" />
        <polygon points="32,3 37,27 32,32" fill="#bae6fd" />
        <polygon points="32,61 37,37 32,32 27,37" fill="#e0f2fe" />
        <polygon points="3,32 27,27 32,32 27,37" fill="#e0f2fe" />
        <polygon points="61,32 37,27 32,32 37,37" fill="#ffffff" />
        <circle cx="32" cy="32" r="5" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2" />
      </svg>
    </div>
  );
}

/** Exact glowing electric-blue teardrop pin from the reference image */
function CurrentLocationPin({ selected }: { selected: boolean }) {
  return (
    <span
      className={`relative flex items-center justify-center transition-transform duration-150 group-hover:scale-110 ${
        selected ? 'scale-110' : 'scale-100'
      }`}
    >
      <svg
        viewBox="0 0 48 60"
        className="h-11 w-9 drop-shadow-[0_0_16px_rgba(56,232,255,0.95)] sm:h-12 sm:w-10"
      >
        <defs>
          <linearGradient id="ref-blue-pin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6cf4ff" />
            <stop offset="48%" stopColor="#0ea5ff" />
            <stop offset="100%" stopColor="#0057e7" />
          </linearGradient>
        </defs>
        <path
          d="M24 3C12.95 3 4 11.95 4 23c0 13.8 20 33 20 33s20-19.2 20-33C44 11.95 35.05 3 24 3z"
          fill="url(#ref-blue-pin)"
          stroke={selected ? '#ffe047' : '#ffffff'}
          strokeWidth={selected ? '3.4' : '2.8'}
        />
        <circle cx="24" cy="22" r="8.2" fill="#ffffff" />
      </svg>
    </span>
  );
}

/** Golden inverted-triangle MMORPG landmark pin matching the reference map */
function GoldenMapPin({ selected }: { selected: boolean }) {
  return (
    <span
      className={`relative flex items-center justify-center transition-transform duration-150 group-hover:scale-115 ${
        selected ? 'scale-120' : 'scale-100'
      }`}
    >
      <svg
        viewBox="0 0 36 38"
        className="h-8 w-8 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)] sm:h-9 sm:w-9"
      >
        <defs>
          <linearGradient id="ref-gold-pin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff49a" />
            <stop offset="45%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#c26402" />
          </linearGradient>
        </defs>
        <polygon
          points="4,6 32,6 18,34"
          fill="url(#ref-gold-pin)"
          stroke={selected ? '#ffffff' : '#fef08a'}
          strokeWidth={selected ? '3' : '2.2'}
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function WorldMapModal({
  snapshot,
  tamerStats,
  digimonStats,
  defeatedTotal,
  soundEnabled,
  isGM = false,
  onTravelToMap,
  onClose,
}: WorldMapModalProps) {
  const playerLevel = Math.max(tamerStats.level, digimonStats.level);

  const [activeCategory, setActiveCategory] = useState<WorldMapCategory>('mundo');
  const [selectedRegionId, setSelectedRegionId] = useState<string>(snapshot.mapId);
  const [mobilePanel, setMobilePanel] = useState<'map' | 'details'>('map');
  const [activeRewardId, setActiveRewardId] = useState<string | null>(null);

  // Interactive Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    active: boolean;
    pointerId: number;
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
  }>({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    origPanX: 0,
    origPanY: 0,
  });

  const visibleRegions = useMemo(
    () => WORLD_MAP_REGIONS.filter((r) => r.categories.includes(activeCategory)),
    [activeCategory]
  );

  const selectedRegion: WorldMapRegion = useMemo(() => {
    return (
      visibleRegions.find((r) => r.id === selectedRegionId) ??
      visibleRegions[0] ??
      WORLD_MAP_REGIONS[0]
    );
  }, [visibleRegions, selectedRegionId]);

  const currentRegion: WorldMapRegion = useMemo(() => {
    return (
      WORLD_MAP_REGIONS.find((r) => r.playableMapId === snapshot.mapId) ??
      WORLD_MAP_REGIONS[0]
    );
  }, [snapshot.mapId]);

  const selectedAccess = getRegionAccessState(
    selectedRegion,
    snapshot.mapId,
    playerLevel,
    isGM
  );

  const liveMissions = useMemo(
    () =>
      getRegionLiveMissions(
        selectedRegion,
        snapshot.discoveredZoneIds.length,
        defeatedTotal
      ),
    [selectedRegion, snapshot.discoveredZoneIds.length, defeatedTotal]
  );

  useEffect(() => {
    setActiveRewardId(selectedRegion.rewards[0]?.id ?? null);
  }, [selectedRegion.id, selectedRegion.rewards]);

  function clampPan(nextX: number, nextY: number, targetZoom: number) {
    const vp = mapViewportRef.current;
    const maxX = vp ? Math.max(0, ((targetZoom - 1) * vp.clientWidth) / 2) : 140;
    const maxY = vp ? Math.max(0, ((targetZoom - 1) * vp.clientHeight) / 2) : 100;
    return {
      x: Math.max(-maxX, Math.min(maxX, nextX)),
      y: Math.max(-maxY, Math.min(maxY, nextY)),
    };
  }

  function applyZoom(delta: number) {
    setZoom((prev) => {
      const next = Number(
        Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)).toFixed(2)
      );
      setPan((curPan) => clampPan(curPan.x, curPan.y, next));
      return next;
    });
  }

  function resetCamera() {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        applyZoom(ZOOM_STEP);
      } else if (e.key === '-') {
        applyZoom(-ZOOM_STEP);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleSelectCategory(cat: WorldMapCategory) {
    setActiveCategory(cat);
    const matching = WORLD_MAP_REGIONS.filter((r) => r.categories.includes(cat));
    if (matching.length > 0 && !matching.some((r) => r.id === selectedRegionId)) {
      const preferred =
        matching.find((r) => r.playableMapId === snapshot.mapId) ?? matching[0];
      setSelectedRegionId(preferred.id);
    }
    playDigitalTone('click', soundEnabled);
  }

  function handleSelectRegion(region: WorldMapRegion) {
    setSelectedRegionId(region.id);
    playDigitalTone('click', soundEnabled);
  }

  function handleTravelClick() {
    if (selectedAccess !== 'available' || !selectedRegion.playableMapId) return;
    onTravelToMap(selectedRegion.playableMapId);
    onClose();
  }

  const activeReward =
    selectedRegion.rewards.find((rw) => rw.id === activeRewardId) ??
    selectedRegion.rewards[0] ??
    null;

  const isSelectedLocked =
    selectedAccess === 'level-locked' || selectedAccess === 'upcoming';

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Mapa do Mundo Digital"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#01091d]/76 p-1.5 backdrop-blur-[2px] sm:p-3 lg:p-4"
    >
      {/* Main MMORPG Metallic Blue Window */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window relative flex max-h-[96dvh] w-full max-w-[1220px] flex-col"
      >
        {/* Top-Left Floating Glowing Circular Globe Emblem (overlapping header like reference) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 left-3 z-40 hidden h-13 w-13 items-center justify-center rounded-full border-2 border-[#94f6ff] bg-[#042478] shadow-[0_0_22px_rgba(56,226,255,0.95)] sm:flex sm:left-5 sm:h-15 sm:w-15"
        >
          <img
            src="/assets/map/globe_badge.png"
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
        </div>

        {/* Top-Right Metallic Red X Close Button (matching reference corner socket) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar janela do mapa"
          className="absolute right-2 top-1.5 z-40 flex h-8 w-8 items-center justify-center rounded-md border-2 border-[#8cf2ff] bg-gradient-to-b from-[#f0453a] via-[#be1818] to-[#7a0e12] text-white shadow-[0_0_16px_rgba(56,224,255,0.75),inset_0_1px_1px_rgba(255,215,215,0.7)] transition hover:brightness-115 active:scale-95 sm:right-3 sm:top-2 sm:h-9 sm:w-9"
        >
          <X className="h-5 w-5 stroke-[3.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]" />
        </button>

        {/* Outer Glowing Neon-Cyan Chamfered Shell */}
        <div className="clip-cyber-panel flex max-h-[95dvh] flex-col bg-gradient-to-b from-[#7cf4ff] via-[#1ea8ff] to-[#4ce2ff] p-[2.5px] shadow-[0_0_48px_rgba(0,174,255,0.65),0_12px_40px_rgba(0,0,0,0.8)]">
          <div className="clip-cyber-panel flex max-h-[calc(95dvh-5px)] flex-col overflow-hidden bg-gradient-to-b from-[#0b44b8] via-[#062269] to-[#041442]">
            {/* ==============================================================
                METALLIC STEPPED HEADER BAR
               ============================================================== */}
            <header className="relative flex h-11 shrink-0 items-center justify-between border-b-2 border-[#46d8ff] bg-gradient-to-r from-[#0a3fa8] via-[#0e55d4] to-[#072a7d] px-3 pr-12 shadow-[inset_0_1px_0_rgba(195,244,255,0.65),0_4px_18px_rgba(0,136,255,0.5)] sm:h-13 sm:pl-22 sm:pr-16">
              <div className="flex items-center gap-2">
                {/* Compact Globe for small mobile */}
                <img
                  src="/assets/map/globe_badge.png"
                  alt=""
                  className="h-7 w-7 rounded-full border border-[#8ef2ff] shadow-[0_0_10px_rgba(56,226,255,0.8)] sm:hidden"
                />
                <h2
                  className="text-lg font-black italic tracking-wide text-white drop-shadow-[0_2px_6px_rgba(0,12,48,0.95)] sm:text-2xl"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Mapa
                </h2>
              </div>

              {/* Clean Live Location Metadata */}
              <div className="hidden items-center gap-2 text-[11.5px] font-bold text-cyan-100/95 md:flex">
                <span className="text-cyan-300">Local Atual:</span>
                <span className="text-white">{currentRegion.name}</span>
                <span aria-hidden="true" className="text-cyan-400/60">
                  ·
                </span>
                <span className="tabular-nums text-sky-200/90">
                  X {Math.round(snapshot.tamerX)}, Y {Math.round(snapshot.tamerY)}
                </span>
                <span aria-hidden="true" className="text-cyan-400/60">
                  ·
                </span>
                <span className="tabular-nums text-[#ffd43b]">
                  Nível {playerLevel}
                </span>
              </div>
            </header>

            {/* ==============================================================
                CATEGORY TABS ROW: Mundo | Eventos | Dungeon (Centered)
               ============================================================== */}
            <div className="flex shrink-0 items-end justify-center bg-[#06205e]/90 px-2.5 pt-2 sm:px-4">
              <div
                className="flex items-end justify-center gap-1.5 sm:gap-2"
                role="tablist"
                aria-label="Categorias de mapas"
              >
                {CATEGORY_TABS.map((tab) => {
                  const isActive = activeCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => handleSelectCategory(tab.id)}
                      className={`min-w-[88px] whitespace-nowrap rounded-t-lg border-x-[1.5px] border-t-[1.5px] px-4 py-1.5 text-center text-xs font-black tracking-wide transition sm:min-w-[116px] sm:px-6 sm:py-1.5 sm:text-[13.5px] ${
                        isActive
                          ? 'world-map-tab-active text-[#1c1303]'
                          : 'border-[#38bfff]/60 bg-gradient-to-b from-[#0b3994] to-[#051a52] text-white/90 hover:border-[#78e6ff] hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ==============================================================
                INNER 3-COLUMN PANEL CONTAINER (Matches Reference Proportions)
               ============================================================== */}
            <div className="mx-2 mb-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-[1.5px] border-[#42d6ff] bg-[#041440]/95 p-2 shadow-[inset_0_0_26px_rgba(0,42,135,0.75)] sm:mx-3.5 sm:mb-2.5 sm:p-2.5">
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden sm:gap-2.5 lg:grid-cols-12">
                {/* ----------------------------------------------------------
                    LEFT COLUMN (col-span-3): Lista Lateral de Regiões
                   ---------------------------------------------------------- */}
                <aside
                  aria-label="Lista de regiões"
                  className="flex min-h-0 flex-col lg:col-span-3"
                >
                  <div className="world-map-scroll flex gap-1.5 overflow-x-auto pb-1 lg:flex-1 lg:flex-col lg:gap-1.5 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1.5">
                    {visibleRegions.map((region) => {
                      const access = getRegionAccessState(
                        region,
                        snapshot.mapId,
                        playerLevel,
                        isGM
                      );
                      const isSelected = region.id === selectedRegion.id;
                      const isLocked =
                        access === 'level-locked' || access === 'upcoming';

                      return (
                        <button
                          key={region.id}
                          type="button"
                          onClick={() => handleSelectRegion(region)}
                          className={`group flex min-w-[215px] shrink-0 items-center gap-2.5 rounded-lg p-1.5 text-left transition lg:min-w-0 lg:w-full ${
                            isSelected
                              ? 'world-map-selected-card'
                              : 'border border-[#2f86e6]/55 bg-gradient-to-b from-[#09276e]/92 to-[#05184a]/96 hover:border-[#62dbff] hover:from-[#0e368f] hover:to-[#072266]'
                          }`}
                        >
                          {/* Crisp Real Reference Thumbnail */}
                          <div className="relative h-[50px] w-[86px] shrink-0 overflow-hidden rounded-[5px] border border-[#6adfff]/75 bg-[#020a24] shadow-[0_2px_6px_rgba(0,0,0,0.65)] sm:h-[54px] sm:w-[92px]">
                            <img
                              src={region.thumbUrl}
                              alt={region.name}
                              className={`h-full w-full object-cover transition duration-200 group-hover:scale-105 ${
                                isLocked ? 'brightness-[0.58] saturate-[0.65]' : ''
                              }`}
                            />
                            {isLocked && (
                              <span className="absolute inset-0 flex items-center justify-center bg-[#020a22]/45">
                                <Lock className="h-4 w-4 text-[#fde047] drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]" />
                              </span>
                            )}
                          </div>

                          {/* Title, Golden Level & Honest Status */}
                          <div className="min-w-0 flex-1 leading-tight">
                            <p className="truncate text-[12.5px] font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] sm:text-[13.5px]">
                              {region.name}
                            </p>
                            {region.recommendedLevel ? (
                              <p className="mt-0.5 text-[11.5px] font-black tabular-nums text-[#ffd43b] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] sm:text-[12.5px]">
                                {region.recommendedLevel}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-[11px] font-extrabold text-emerald-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] sm:text-[12px]">
                                {region.zoneType}
                              </p>
                            )}
                            <p className="mt-0.5 truncate text-[9.5px] font-bold">
                              {access === 'current' && (
                                <span className="text-[#5eeeff]">Local Atual</span>
                              )}
                              {access === 'available' && (
                                <span className="text-emerald-300">
                                  Disponível · Viajar
                                </span>
                              )}
                              {access === 'level-locked' && (
                                <span className="text-amber-300/90">
                                  Bloqueada · Lv. {region.minLevel}+
                                </span>
                              )}
                              {access === 'upcoming' && (
                                <span className="text-slate-300/80">
                                  Em desenvolvimento
                                </span>
                              )}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                {/* ----------------------------------------------------------
                    CENTER COLUMN (col-span-6): Mapa Central Interativo
                   ---------------------------------------------------------- */}
                <section
                  aria-label="Mapa interativo do Mundo Digital"
                  className={`${
                    mobilePanel === 'map' ? 'flex' : 'hidden lg:flex'
                  } relative min-h-[290px] flex-1 flex-col overflow-hidden rounded-xl border-[1.5px] border-[#42d6ff] bg-[#042878] shadow-[inset_0_0_24px_rgba(0,48,145,0.7),0_0_16px_rgba(0,174,255,0.35)] sm:min-h-[380px] lg:col-span-6`}
                >
                  <div
                    ref={mapViewportRef}
                    onWheel={(e) => {
                      e.preventDefault();
                      applyZoom(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
                    }}
                    onPointerDown={(e) => {
                      if ((e.target as HTMLElement).closest('button')) return;
                      dragRef.current = {
                        active: true,
                        pointerId: e.pointerId,
                        startX: e.clientX,
                        startY: e.clientY,
                        origPanX: pan.x,
                        origPanY: pan.y,
                      };
                      setIsDragging(true);
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      if (!dragRef.current.active) return;
                      const dx = e.clientX - dragRef.current.startX;
                      const dy = e.clientY - dragRef.current.startY;
                      setPan(
                        clampPan(
                          dragRef.current.origPanX + dx,
                          dragRef.current.origPanY + dy,
                          zoom
                        )
                      );
                    }}
                    onPointerUp={(e) => {
                      if (dragRef.current.active) {
                        dragRef.current.active = false;
                        setIsDragging(false);
                        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        }
                      }
                    }}
                    onPointerCancel={() => {
                      dragRef.current.active = false;
                      setIsDragging(false);
                    }}
                    className={`relative h-full w-full flex-1 overflow-hidden touch-none ${
                      isDragging ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                  >
                    {/* Zoomable & Pannable High-Art Archipelago Layer */}
                    <div
                      style={{
                        transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                        transformOrigin: 'center center',
                      }}
                      className="relative h-full w-full transition-transform duration-150 ease-out will-change-transform"
                    >
                      <img
                        src="/assets/map/world_map_base.png"
                        alt="Mapa do Mundo Digital"
                        draggable={false}
                        className="h-full w-full select-none object-cover"
                      />

                      {/* Luminous Route Line connecting current map to selected map */}
                      {selectedRegion.id !== currentRegion.id && (
                        <svg
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
                          aria-hidden="true"
                        >
                          <line
                            x1={currentRegion.mapCoords.x}
                            y1={currentRegion.mapCoords.y}
                            x2={selectedRegion.mapCoords.x}
                            y2={selectedRegion.mapCoords.y}
                            stroke="#5eeeff"
                            strokeWidth="0.65"
                            strokeDasharray="1.8 1.4"
                            strokeLinecap="round"
                            opacity="0.95"
                          />
                        </svg>
                      )}

                      {/* Interactive Clickable Markers on Every Region */}
                      {visibleRegions.map((region) => {
                        const access = getRegionAccessState(
                          region,
                          snapshot.mapId,
                          playerLevel,
                          isGM
                        );
                        const isSelected = region.id === selectedRegion.id;
                        const isCurrent = access === 'current';
                        const isLocked =
                          access === 'level-locked' || access === 'upcoming';

                        return (
                          <button
                            key={region.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRegion(region);
                            }}
                            aria-label={`Selecionar ${region.name} (${region.recommendedLevel || region.zoneType})`}
                            style={{
                              left: `${region.mapCoords.x}%`,
                              top: `${region.mapCoords.y}%`,
                              transform: `translate(-50%, -65%) scale(${(1 / Math.sqrt(zoom)).toFixed(3)})`,
                            }}
                            className="group absolute z-20 flex flex-col items-center focus-visible:outline-none"
                          >
                            {/* Selection Golden Halo Ring */}
                            {isSelected && (
                              <span
                                aria-hidden="true"
                                className="pointer-events-none absolute top-1/2 h-11 w-11 -translate-y-1/2 rounded-full border-2 border-[#ffe047] bg-[#ffe047]/15 shadow-[0_0_18px_rgba(255,224,71,0.9)]"
                              />
                            )}

                            {isCurrent ? (
                              <CurrentLocationPin selected={isSelected} />
                            ) : isLocked ? (
                              <span
                                className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 bg-gradient-to-b from-[#1e293b]/95 to-[#091229]/95 text-[#ffd43b] shadow-[0_2px_10px_rgba(0,0,0,0.88)] transition group-hover:scale-115 sm:h-8 sm:w-8 ${
                                  isSelected
                                    ? 'border-[#ffe047] ring-2 ring-[#ffe047]/65'
                                    : 'border-[#60a5fa]/80'
                                }`}
                              >
                                <Lock className="h-3.5 w-3.5" />
                              </span>
                            ) : (
                              <GoldenMapPin selected={isSelected} />
                            )}

                            {/* Clean Nameplate Label */}
                            <span
                              className={`mt-0.5 whitespace-nowrap rounded border px-1.5 py-[2px] text-[10px] font-extrabold leading-none shadow-[0_2px_8px_rgba(0,0,0,0.95)] transition ${
                                isSelected
                                  ? 'border-[#ffe047] bg-[#04143e]/95 text-[#fff08a]'
                                  : isCurrent
                                    ? 'border-[#5eeeff] bg-[#041a52]/92 text-white'
                                    : isLocked
                                      ? 'border-slate-400/60 bg-[#050d24]/85 text-slate-200 opacity-90 group-hover:opacity-100'
                                      : 'border-[#ffd43b]/85 bg-[#041a52]/92 text-white'
                              }`}
                            >
                              {region.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Mobile-only Region Details shortcut (top-left of map canvas) */}
                    <button
                      type="button"
                      onClick={() => setMobilePanel('details')}
                      className="absolute left-2.5 top-2.5 z-30 flex items-center gap-1 rounded-md border border-[#ffe047]/80 bg-[#041645]/92 px-2.5 py-1 text-[11px] font-extrabold text-amber-100 shadow-[0_0_12px_rgba(0,0,0,0.65)] transition hover:brightness-110 active:scale-95 lg:hidden"
                    >
                      <Info className="h-3.5 w-3.5 text-[#ffe047]" />
                      <span>Detalhes</span>
                    </button>

                    {/* Top-Right Reference Compass Rose (N) */}
                    <MapCompassRose />

                    {/* Bottom-Left Reference Metallic Zoom Box (+ / -) */}
                    <div className="absolute bottom-3 left-3 z-30 flex flex-col overflow-hidden rounded-lg border-2 border-[#5ce6ff] bg-gradient-to-b from-[#0b44b2]/95 via-[#072a7d]/95 to-[#041954]/95 shadow-[0_0_18px_rgba(0,174,255,0.65),inset_0_1px_0_rgba(200,246,255,0.65)]">
                      <button
                        type="button"
                        onClick={() => applyZoom(ZOOM_STEP)}
                        disabled={zoom >= MAX_ZOOM}
                        aria-label="Aproximar mapa"
                        className="flex h-10 w-10 items-center justify-center border-b border-[#4fd8ff]/55 text-white transition hover:bg-sky-500/40 active:scale-95 disabled:opacity-40"
                      >
                        <Plus className="h-5 w-5 stroke-[3.2] drop-shadow" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyZoom(-ZOOM_STEP)}
                        disabled={zoom <= MIN_ZOOM}
                        aria-label="Afastar mapa"
                        className="flex h-10 w-10 items-center justify-center text-white transition hover:bg-sky-500/40 active:scale-95 disabled:opacity-40"
                      >
                        <Minus className="h-5 w-5 stroke-[3.2] drop-shadow" />
                      </button>
                      {(zoom > MIN_ZOOM || pan.x !== 0 || pan.y !== 0) && (
                        <button
                          type="button"
                          onClick={resetCamera}
                          aria-label="Centralizar mapa"
                          title="Centralizar mapa"
                          className="flex h-8 w-10 items-center justify-center border-t border-[#4fd8ff]/55 text-cyan-200 transition hover:bg-sky-500/40 active:scale-95"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Subtle Zoom Percentage Indicator */}
                    <div className="pointer-events-none absolute bottom-3 right-3 z-20 rounded-md border border-[#42d6ff]/55 bg-[#03123a]/86 px-2 py-1 text-[10px] font-bold tabular-nums text-cyan-100">
                      {Math.round(zoom * 100)}%
                    </div>
                  </div>
                </section>

                {/* ----------------------------------------------------------
                    RIGHT COLUMN (col-span-3): Informações da Região Selecionada
                   ---------------------------------------------------------- */}
                <aside
                  aria-label="Informações da região selecionada"
                  className={`${
                    mobilePanel === 'details' ? 'flex' : 'hidden lg:flex'
                  } min-h-0 flex-col overflow-hidden rounded-xl border-[1.5px] border-[#42d6ff] bg-gradient-to-b from-[#07266f]/96 via-[#04184e]/98 to-[#031036]/98 shadow-[inset_0_0_22px_rgba(0,48,145,0.7)] lg:col-span-3`}
                >
                  {/* Region Title Header */}
                  <div className="relative flex shrink-0 items-center justify-center border-b border-[#3bc8ff]/45 bg-gradient-to-r from-[#072a7c] via-[#0e4bc4] to-[#072a7c] px-3 py-2 text-center shadow-[inset_0_1px_0_rgba(195,244,255,0.45)]">
                    <button
                      type="button"
                      onClick={() => setMobilePanel('map')}
                      aria-label="Voltar para visualização do mapa"
                      className="absolute left-2 flex items-center gap-1 rounded border border-cyan-300/60 bg-[#041645]/90 px-2 py-0.5 text-[10.5px] font-extrabold text-cyan-100 transition active:scale-95 lg:hidden"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Voltar</span>
                    </button>
                    <h3 className="truncate px-14 text-[14px] font-black tracking-wide text-white drop-shadow sm:text-[15px] lg:px-0">
                      {selectedRegion.name}
                    </h3>
                  </div>

                  {/* Scrollable Details Content */}
                  <div className="world-map-scroll flex-1 space-y-2.5 overflow-y-auto p-2.5 text-xs">
                    {/* Crisp Wide Panoramic Region Banner */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border-[1.5px] border-[#5ee3ff]/80 bg-[#020a24] shadow-[0_0_14px_rgba(0,162,255,0.35)]">
                      <img
                        src={selectedRegion.bannerUrl}
                        alt={selectedRegion.name}
                        className={`h-full w-full object-cover ${
                          isSelectedLocked ? 'brightness-[0.55] saturate-[0.65]' : ''
                        }`}
                      />
                      {isSelectedLocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#02081c]/55 px-2 text-center">
                          <Lock className="h-6 w-6 text-[#ffe047] drop-shadow" />
                          <span className="mt-1 text-[11px] font-extrabold text-amber-100">
                            {selectedAccess === 'level-locked'
                              ? `Bloqueada · Requer Lv. ${selectedRegion.minLevel}`
                              : 'Em desenvolvimento'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tipo de Área / Nível Recomendado */}
                    <div>
                      <p className="text-[12px] font-extrabold text-white">
                        {selectedRegion.recommendedLevel
                          ? 'Nível Recomendado'
                          : 'Tipo de Área'}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        {selectedRegion.recommendedLevel ? (
                          <span className="text-[14px] font-black tabular-nums text-[#ffd43b]">
                            {selectedRegion.recommendedLevel}
                          </span>
                        ) : (
                          <span className="text-[13px] font-black text-emerald-300">
                            Cidade Segura · Sem Combate
                          </span>
                        )}
                        <span aria-hidden="true" className="text-cyan-300/50">
                          ·
                        </span>
                        <span
                          className={`text-[11px] font-bold ${
                            selectedAccess === 'current'
                              ? 'text-[#5eeeff]'
                              : selectedAccess === 'available'
                                ? 'text-emerald-300'
                                : 'text-amber-300'
                          }`}
                        >
                          {selectedAccess === 'current'
                            ? 'Local Atual'
                            : selectedAccess === 'available'
                              ? selectedRegion.playableMapId === 'hunting-plains'
                                ? 'Início de Up'
                                : selectedRegion.zoneType
                              : selectedAccess === 'level-locked'
                                ? `Requer Lv. ${selectedRegion.minLevel}`
                                : 'Próxima atualização'}
                        </span>
                      </div>
                    </div>

                    {/* Descrição */}
                    <div>
                      <p className="text-[12px] font-extrabold text-white">
                        Descrição
                      </p>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-sky-100/92">
                        {selectedRegion.description}
                      </p>
                    </div>

                    {/* Principais NPCs (Reference style with white twin-users icon) */}
                    <div className="border-t border-cyan-400/20 pt-2">
                      <div className="flex items-start gap-2">
                        <Users className="mt-0.5 h-5 w-5 shrink-0 text-white drop-shadow" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11.5px] font-extrabold text-white">
                            Principais NPCs
                          </p>
                          {selectedRegion.npcs.length > 0 ? (
                            <p className="mt-0.5 text-[11px] leading-snug text-sky-100/90">
                              {selectedRegion.npcs.map((n) => n.name).join(', ')}.
                            </p>
                          ) : (
                            <p className="mt-0.5 text-[11px] text-slate-300/75">
                              {selectedRegion.implemented
                                ? 'Nenhum NPC em campo.'
                                : 'Sem NPCs cadastrados ainda.'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inimigos na Região */}
                    <div className="border-t border-cyan-400/20 pt-2">
                      <p className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-white">
                        <Swords className="h-3.5 w-3.5 shrink-0 text-rose-300" />
                        <span>Inimigos</span>
                      </p>
                      {selectedRegion.enemies.length > 0 ? (
                        <div className="mt-1.5 space-y-1.5 text-[11px]">
                          {selectedRegion.enemies.map((enemy) => {
                            const portrait = enemy.species
                              ? getWildDigimonPortraitUrl(enemy.species)
                              : null;
                            const isBossRow = enemy.species === 'kuwagamon';
                            return (
                              <div
                                key={enemy.name}
                                className={`flex items-center gap-2 rounded-md border px-2 py-1 ${
                                  isBossRow
                                    ? 'border-rose-400/70 bg-gradient-to-r from-[#2c0916]/90 to-[#160722]/90 text-rose-100 shadow-[0_0_12px_rgba(244,63,94,0.28)]'
                                    : 'border-cyan-400/20 bg-[#04143c]/80 text-sky-100/95'
                                }`}
                              >
                                {portrait && (
                                  <img
                                    src={portrait}
                                    alt={enemy.name}
                                    className={`shrink-0 object-contain ${
                                      isBossRow ? 'h-8 w-8' : 'h-7 w-7 [image-rendering:pixelated]'
                                    }`}
                                  />
                                )}
                                <div className="min-w-0 flex-1 leading-tight">
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span
                                      className={`truncate font-bold ${
                                        isBossRow ? 'text-amber-200' : 'text-white'
                                      }`}
                                    >
                                      {enemy.name}
                                      {enemy.packSize && !isBossRow ? (
                                        <span className="ml-1 text-[10px] font-semibold text-cyan-300">
                                          ({enemy.packSize}x)
                                        </span>
                                      ) : null}
                                    </span>
                                    <span
                                      className={`shrink-0 font-black tabular-nums ${
                                        isBossRow ? 'text-rose-300' : 'text-[#ffd43b]'
                                      }`}
                                    >
                                      {enemy.levelLabel}
                                    </span>
                                  </div>
                                  {enemy.habitat && (
                                    <p
                                      className={`truncate text-[9.5px] font-medium ${
                                        isBossRow ? 'text-rose-200/85' : 'text-sky-200/80'
                                      }`}
                                    >
                                      {enemy.habitat}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : selectedRegion.zoneType === 'Zona Segura' ? (
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-emerald-300">
                          <Shield className="h-3.5 w-3.5 shrink-0" />
                          <span>Zona Segura — sem inimigos selvagens.</span>
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[11px] text-slate-300/75">
                          Disponível ao liberar esta região.
                        </p>
                      )}
                    </div>

                    {/* Missões Disponíveis */}
                    <div className="border-t border-cyan-400/20 pt-2">
                      <p className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-white">
                        <ScrollText className="h-3.5 w-3.5 shrink-0 text-[#ffd43b]" />
                        <span>Missões</span>
                      </p>
                      <div className="mt-1 space-y-1">
                        {liveMissions.map((m) => (
                          <div
                            key={m.id}
                            className="rounded-md border border-cyan-400/30 bg-[#041236]/85 px-2 py-1.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[11px] font-extrabold text-white">
                                {m.title}
                              </span>
                              {m.progressText && (
                                <span
                                  className={`flex shrink-0 items-center gap-0.5 text-[10px] font-black tabular-nums ${
                                    m.completed ? 'text-emerald-300' : 'text-[#ffd43b]'
                                  }`}
                                >
                                  {m.completed && (
                                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                                  )}
                                  {m.progressText}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[10.5px] leading-snug text-sky-200/80">
                              {m.summary}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recompensas (Exact 4 Reference Metallic Icon Tiles) */}
                    <div className="border-t border-cyan-400/20 pt-2">
                      <p className="text-[12px] font-extrabold text-white">
                        Recompensas
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        {selectedRegion.rewards.map((rw) => {
                          const isFocused = activeReward?.id === rw.id;
                          return (
                            <button
                              key={rw.id}
                              type="button"
                              onClick={() => setActiveRewardId(rw.id)}
                              title={`${rw.label}: ${rw.detail}`}
                              className={`h-11 w-11 shrink-0 overflow-hidden rounded-lg transition hover:scale-105 ${
                                isFocused
                                  ? 'ring-2 ring-[#ffe047] shadow-[0_0_12px_rgba(255,224,71,0.65)]'
                                  : 'opacity-90 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={rw.iconUrl}
                                alt={rw.label}
                                className="h-full w-full object-cover"
                              />
                            </button>
                          );
                        })}
                      </div>
                      {activeReward && (
                        <p className="mt-1.5 text-[10.5px] leading-snug text-sky-100/90">
                          <span className="font-extrabold text-[#ffd43b]">
                            {activeReward.label}:
                          </span>{' '}
                          {activeReward.detail}
                        </p>
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            {/* ==============================================================
                FOOTER BAR: >> Ir para o Mapa (Left)  |  X Fechar (Right)
               ============================================================== */}
            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 pb-2.5 pt-0.5 sm:px-5 sm:pb-3">
              <button
                type="button"
                disabled={selectedAccess !== 'available'}
                onClick={handleTravelClick}
                className={`flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-5 py-1.5 text-xs font-black tracking-wide transition active:scale-[0.98] sm:min-w-[218px] sm:text-[14px] ${
                  selectedAccess === 'available'
                    ? 'world-map-btn-bevel text-white'
                    : 'cursor-not-allowed border-[1.5px] border-cyan-400/35 bg-[#061b52]/90 text-sky-200/75'
                }`}
              >
                {selectedAccess === 'available' ? (
                  <>
                    <ChevronsRight className="h-5 w-5 stroke-[3] text-[#ffe047] drop-shadow-[0_0_8px_rgba(255,215,48,0.85)]" />
                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                      Ir para o Mapa
                    </span>
                  </>
                ) : selectedAccess === 'current' ? (
                  <>
                    <ChevronsRight className="h-5 w-5 stroke-[2.5] text-cyan-300/80" />
                    <span>Você já está aqui</span>
                  </>
                ) : selectedAccess === 'level-locked' ? (
                  <>
                    <Lock className="h-4 w-4 text-[#ffd43b]" />
                    <span>Bloqueada · Requer Lv. {selectedRegion.minLevel}</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-slate-300" />
                    <span>Em desenvolvimento</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="world-map-btn-bevel flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-5 py-1.5 text-xs font-black tracking-wide text-white transition active:scale-[0.98] sm:min-w-[148px] sm:text-[14px]"
              >
                <X className="h-4.5 w-4.5 stroke-[3.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]" />
                <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                  Fechar
                </span>
              </button>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
