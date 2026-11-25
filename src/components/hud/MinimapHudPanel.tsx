import { memo, useEffect, useRef, useState } from 'react';
import { Map as MapIcon, Maximize2, Minus, Plus } from 'lucide-react';
import {
  DATA_FOREST_FRIENDLY_NPCS,
  DATA_FOREST_IMAGE_URL,
  DATA_FOREST_INTERACTION_POINTS,
  DATA_FOREST_MAP_ID,
  DATA_FOREST_RETURN_PORTAL,
  DATA_FOREST_SAFE_ZONE,
  DATA_FOREST_WORLD_H,
  DATA_FOREST_WORLD_W,
  getDataForestZoneAtPoint,
} from '../../maps/dataForestMap';
import {
  buildDatsCenterStaticLayer,
  DATS_INTERACTION_POINTS,
  DATS_MAP_ID,
  DATS_WORLD_H,
  DATS_WORLD_W,
} from '../../maps/datsCenterMap';
import {
  DIGI_MOUNTAIN_BANNER_URL,
  DIGI_MOUNTAIN_FRIENDLY_NPCS,
  DIGI_MOUNTAIN_INTERACTION_POINTS,
  DIGI_MOUNTAIN_MAP_ID,
  DIGI_MOUNTAIN_RETURN_PORTAL,
  DIGI_MOUNTAIN_SAFE_ZONE,
  DIGI_MOUNTAIN_WORLD_H,
  DIGI_MOUNTAIN_WORLD_W,
  getDigiMountainZoneAtPoint,
} from '../../maps/digiMountainMap';
import {
  DIGITAL_DESERT_BANNER_URL,
  DIGITAL_DESERT_FRIENDLY_NPCS,
  DIGITAL_DESERT_INTERACTION_POINTS,
  DIGITAL_DESERT_MAP_ID,
  DIGITAL_DESERT_RETURN_PORTAL,
  DIGITAL_DESERT_SAFE_ZONE,
  DIGITAL_DESERT_WORLD_H,
  DIGITAL_DESERT_WORLD_W,
  getDigitalDesertZoneAtPoint,
} from '../../maps/digitalDesertMap';
import {
  DATA_SEA_BANNER_URL,
  DATA_SEA_FRIENDLY_NPCS,
  DATA_SEA_INTERACTION_POINTS,
  DATA_SEA_MAP_ID,
  DATA_SEA_RETURN_PORTAL,
  DATA_SEA_SAFE_ZONE,
  DATA_SEA_WORLD_H,
  DATA_SEA_WORLD_W,
  getDataSeaZoneAtPoint,
} from '../../maps/dataSeaMap';
import {
  DIGIMON_ISLAND_BANNER_URL,
  DIGIMON_ISLAND_FRIENDLY_NPCS,
  DIGIMON_ISLAND_INTERACTION_POINTS,
  DIGIMON_ISLAND_MAP_ID,
  DIGIMON_ISLAND_RETURN_PORTAL,
  DIGIMON_ISLAND_SAFE_ZONE,
  DIGIMON_ISLAND_WORLD_H,
  DIGIMON_ISLAND_WORLD_W,
  getDigimonIslandZoneAtPoint,
} from '../../maps/digimonIslandMap';
import {
  DARK_AREA_BANNER_URL,
  DARK_AREA_FRIENDLY_NPCS,
  DARK_AREA_INTERACTION_POINTS,
  DARK_AREA_MAP_ID,
  DARK_AREA_RETURN_PORTAL,
  DARK_AREA_SAFE_ZONE,
  DARK_AREA_WORLD_H,
  DARK_AREA_WORLD_W,
  getDarkAreaZoneAtPoint,
} from '../../maps/darkAreaMap';
import {
  VIRTUAL_WORLD_BANNER_URL,
  VIRTUAL_WORLD_FRIENDLY_NPCS,
  VIRTUAL_WORLD_INTERACTION_POINTS,
  VIRTUAL_WORLD_MAP_ID,
  VIRTUAL_WORLD_RETURN_PORTAL,
  VIRTUAL_WORLD_SAFE_ZONE,
  VIRTUAL_WORLD_WORLD_H,
  VIRTUAL_WORLD_WORLD_W,
  getVirtualWorldZoneAtPoint,
} from '../../maps/virtualWorldMap';
import {
  FRIENDLY_FIELD_NPCS,
  getHuntingZoneAtPoint,
  HUNTING_INTERACTION_POINTS,
  HUNTING_MAP_BANNER_URL,
  HUNTING_MAP_ID,
  HUNTING_RETURN_PORTAL,
  HUNTING_SAFE_ZONE,
  HUNTING_WORLD_H,
  HUNTING_WORLD_W,
} from '../../maps/huntingFieldMap';
import { DATS_FIXED_NPCS } from '../../sprites/npcSprites';
import type { LiveWorldHudSnapshot } from '../../types/hud';

interface MinimapHudPanelProps {
  snapshot: LiveWorldHudSnapshot;
  minimapSize?: 'compacto' | 'padrao';
  onOpenFullMap: () => void;
}

export const MinimapHudPanel = memo(function MinimapHudPanel({
  snapshot,
  minimapSize = 'padrao',
  onOpenFullMap,
}: MinimapHudPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Pre-baked aspect-accurate offscreen thumbnails per map (exact 16:9 for combat maps, exact 1600:1480 for DATS)
  const thumbCacheRef = useRef<Partial<Record<string, HTMLCanvasElement>>>({});
  const loadingMapRef = useRef<Set<string>>(new Set());
  const [thumbVersion, setThumbVersion] = useState(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [minimized, setMinimized] = useState(false);

  const isHunting = snapshot.mapId === HUNTING_MAP_ID;
  const isDataForest = snapshot.mapId === DATA_FOREST_MAP_ID;
  const isDigiMountain = snapshot.mapId === DIGI_MOUNTAIN_MAP_ID;
  const isDigitalDesert = snapshot.mapId === DIGITAL_DESERT_MAP_ID;
  const isDataSea = snapshot.mapId === DATA_SEA_MAP_ID;
  const isDigimonIsland = snapshot.mapId === DIGIMON_ISLAND_MAP_ID;
  const isDarkArea = snapshot.mapId === DARK_AREA_MAP_ID;
  const isVirtualWorld = snapshot.mapId === VIRTUAL_WORLD_MAP_ID;
  const isCombatMap =
    isHunting ||
    isDataForest ||
    isDigiMountain ||
    isDigitalDesert ||
    isDataSea ||
    isDigimonIsland ||
    isDarkArea ||
    isVirtualWorld;

  const regionLabel = isVirtualWorld
    ? 'Mundo Virtual'
    : isDarkArea
      ? 'Área Sombria'
      : isDigimonIsland
        ? 'Ilha dos Digimons'
        : isDataSea
          ? 'Mar de Dados'
          : isDigitalDesert
            ? 'Deserto Digital'
            : isDigiMountain
              ? 'Montanha Digi'
              : isDataForest
                ? 'Floresta de Dados'
                : isHunting
                  ? 'Planície Digital'
                  : 'DATS Center';

  const activeSubZone = isVirtualWorld
    ? getVirtualWorldZoneAtPoint(snapshot.tamerX, snapshot.tamerY)
    : isDarkArea
      ? getDarkAreaZoneAtPoint(snapshot.tamerX, snapshot.tamerY)
      : isDigimonIsland
        ? getDigimonIslandZoneAtPoint(snapshot.tamerX, snapshot.tamerY)
        : isDataSea
          ? getDataSeaZoneAtPoint(snapshot.tamerX, snapshot.tamerY)
          : isDigitalDesert
            ? getDigitalDesertZoneAtPoint(snapshot.tamerX, snapshot.tamerY)
            : isDigiMountain
              ? getDigiMountainZoneAtPoint(snapshot.tamerX, snapshot.tamerY)
              : isDataForest
                ? getDataForestZoneAtPoint(snapshot.tamerX, snapshot.tamerY)
                : isHunting
                  ? getHuntingZoneAtPoint(snapshot.tamerX, snapshot.tamerY)
                  : null;

  const subZoneText =
    snapshot.mapId === DATS_MAP_ID
      ? 'Praça Central DATS'
      : activeSubZone
        ? activeSubZone.speciesLabel
          ? `${activeSubZone.name} · ${activeSubZone.speciesLabel}`
          : activeSubZone.name
        : regionLabel;

  // Exact canvas internal resolution matching the active map's photo proportions
  const canvasW = isCombatMap ? 320 : 240;
  const canvasH = isCombatMap ? 180 : 222;

  // Lazily bake exact-aspect thumbnail for the active map (including DATS Center artwork)
  useEffect(() => {
    const mapId = snapshot.mapId;
    if (thumbCacheRef.current[mapId] || loadingMapRef.current.has(mapId)) {
      return;
    }

    if (mapId === DATS_MAP_ID) {
      loadingMapRef.current.add(mapId);
      const source = buildDatsCenterStaticLayer();
      const thumb = document.createElement('canvas');
      thumb.width = 240;
      thumb.height = 222;
      const tCtx = thumb.getContext('2d');
      if (tCtx) {
        tCtx.imageSmoothingEnabled = true;
        tCtx.imageSmoothingQuality = 'high';
        tCtx.drawImage(source, 0, 0, thumb.width, thumb.height);
      }
      thumbCacheRef.current[mapId] = thumb;
      setThumbVersion((v) => v + 1);
      return;
    }

    const url =
      mapId === VIRTUAL_WORLD_MAP_ID
        ? VIRTUAL_WORLD_BANNER_URL
        : mapId === DARK_AREA_MAP_ID
          ? DARK_AREA_BANNER_URL
          : mapId === DIGIMON_ISLAND_MAP_ID
            ? DIGIMON_ISLAND_BANNER_URL
            : mapId === DATA_SEA_MAP_ID
              ? DATA_SEA_BANNER_URL
              : mapId === DIGITAL_DESERT_MAP_ID
                ? DIGITAL_DESERT_BANNER_URL
                : mapId === DIGI_MOUNTAIN_MAP_ID
                  ? DIGI_MOUNTAIN_BANNER_URL
                  : mapId === DATA_FOREST_MAP_ID
                    ? DATA_FOREST_IMAGE_URL
                    : mapId === HUNTING_MAP_ID
                      ? HUNTING_MAP_BANNER_URL
                      : null;

    if (!url) return;
    loadingMapRef.current.add(mapId);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    img.onload = () => {
      const thumb = document.createElement('canvas');
      thumb.width = 320;
      thumb.height = 180;
      const tCtx = thumb.getContext('2d');
      if (tCtx) {
        tCtx.imageSmoothingEnabled = true;
        tCtx.imageSmoothingQuality = 'high';
        tCtx.drawImage(img, 0, 0, thumb.width, thumb.height);
      }
      thumbCacheRef.current[mapId] = thumb;
      setThumbVersion((v) => v + 1);
    };
  }, [snapshot.mapId]);

  // Reset zoom cleanly when switching maps
  useEffect(() => {
    setZoom(1.0);
  }, [snapshot.mapId]);

  useEffect(() => {
    if (minimized) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const worldW = isVirtualWorld
      ? VIRTUAL_WORLD_WORLD_W
      : isDarkArea
        ? DARK_AREA_WORLD_W
        : isDigimonIsland
          ? DIGIMON_ISLAND_WORLD_W
          : isDataSea
            ? DATA_SEA_WORLD_W
            : isDigitalDesert
              ? DIGITAL_DESERT_WORLD_W
              : isDigiMountain
                ? DIGI_MOUNTAIN_WORLD_W
                : isDataForest
                  ? DATA_FOREST_WORLD_W
                  : isHunting
                    ? HUNTING_WORLD_W
                    : DATS_WORLD_W;
    const worldH = isVirtualWorld
      ? VIRTUAL_WORLD_WORLD_H
      : isDarkArea
        ? DARK_AREA_WORLD_H
        : isDigimonIsland
          ? DIGIMON_ISLAND_WORLD_H
          : isDataSea
            ? DATA_SEA_WORLD_H
            : isDigitalDesert
              ? DIGITAL_DESERT_WORLD_H
              : isDigiMountain
                ? DIGI_MOUNTAIN_WORLD_H
                : isDataForest
                  ? DATA_FOREST_WORLD_H
                  : isHunting
                    ? HUNTING_WORLD_H
                    : DATS_WORLD_H;

    ctx.clearRect(0, 0, w, h);

    const baseScaleX = w / worldW;
    const baseScaleY = h / worldH;
    const scaleX = baseScaleX * zoom;
    const scaleY = baseScaleY * zoom;
    const drawW = worldW * scaleX;
    const drawH = worldH * scaleY;

    let offsetX = 0;
    let offsetY = 0;
    if (zoom > 1.01) {
      const desiredX = w / 2 - snapshot.tamerX * scaleX;
      const desiredY = h / 2 - snapshot.tamerY * scaleY;
      offsetX = Math.min(0, Math.max(w - drawW, desiredX));
      offsetY = Math.min(0, Math.max(h - drawH, desiredY));
    }

    ctx.save();
    ctx.translate(offsetX, offsetY);

    const activeThumb = thumbCacheRef.current[snapshot.mapId];
    if (activeThumb) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(activeThumb, 0, 0, drawW, drawH);
      // Very light contrast scrim so markers read clearly without hiding the map art
      ctx.fillStyle = isCombatMap
        ? 'rgba(3, 12, 30, 0.14)'
        : 'rgba(3, 14, 38, 0.10)';
      ctx.fillRect(0, 0, drawW, drawH);
    } else {
      ctx.fillStyle = '#051a45';
      ctx.fillRect(0, 0, drawW, drawH);
    }

    if (!isCombatMap) {
      // DATS portals & interactive nodes
      for (const pt of DATS_INTERACTION_POINTS) {
        if (pt.id === 'dats-mudfrigimon-npc') continue;
        const px = pt.x * scaleX;
        const py = pt.y * scaleY;
        ctx.fillStyle = pt.kind === 'world-portal' ? '#ffd43b' : '#38e8ff';
        ctx.beginPath();
        ctx.arc(px, py, pt.kind === 'world-portal' ? 4.4 : 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Official Fixed DATS NPCs
      for (const npc of DATS_FIXED_NPCS) {
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(npc.x * scaleX, npc.y * scaleY, 4.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    } else {
      const safeZone = isVirtualWorld
        ? VIRTUAL_WORLD_SAFE_ZONE
        : isDarkArea
          ? DARK_AREA_SAFE_ZONE
          : isDigimonIsland
            ? DIGIMON_ISLAND_SAFE_ZONE
            : isDataSea
              ? DATA_SEA_SAFE_ZONE
              : isDigitalDesert
                ? DIGITAL_DESERT_SAFE_ZONE
                : isDigiMountain
                  ? DIGI_MOUNTAIN_SAFE_ZONE
                  : isDataForest
                    ? DATA_FOREST_SAFE_ZONE
                    : HUNTING_SAFE_ZONE;
      const returnPortal = isVirtualWorld
        ? VIRTUAL_WORLD_RETURN_PORTAL
        : isDarkArea
          ? DARK_AREA_RETURN_PORTAL
          : isDigimonIsland
            ? DIGIMON_ISLAND_RETURN_PORTAL
            : isDataSea
              ? DATA_SEA_RETURN_PORTAL
              : isDigitalDesert
                ? DIGITAL_DESERT_RETURN_PORTAL
                : isDigiMountain
                  ? DIGI_MOUNTAIN_RETURN_PORTAL
                  : isDataForest
                    ? DATA_FOREST_RETURN_PORTAL
                    : HUNTING_RETURN_PORTAL;
      const points = isVirtualWorld
        ? VIRTUAL_WORLD_INTERACTION_POINTS
        : isDarkArea
          ? DARK_AREA_INTERACTION_POINTS
          : isDigimonIsland
            ? DIGIMON_ISLAND_INTERACTION_POINTS
            : isDataSea
              ? DATA_SEA_INTERACTION_POINTS
              : isDigitalDesert
                ? DIGITAL_DESERT_INTERACTION_POINTS
                : isDigiMountain
                  ? DIGI_MOUNTAIN_INTERACTION_POINTS
                  : isDataForest
                    ? DATA_FOREST_INTERACTION_POINTS
                    : HUNTING_INTERACTION_POINTS;
      const npcs = isVirtualWorld
        ? VIRTUAL_WORLD_FRIENDLY_NPCS
        : isDarkArea
          ? DARK_AREA_FRIENDLY_NPCS
          : isDigimonIsland
            ? DIGIMON_ISLAND_FRIENDLY_NPCS
            : isDataSea
              ? DATA_SEA_FRIENDLY_NPCS
              : isDigitalDesert
                ? DIGITAL_DESERT_FRIENDLY_NPCS
                : isDigiMountain
                  ? DIGI_MOUNTAIN_FRIENDLY_NPCS
                  : isDataForest
                    ? DATA_FOREST_FRIENDLY_NPCS
                    : FRIENDLY_FIELD_NPCS;

      // Safe Sanctuary ring
      ctx.strokeStyle = 'rgba(56, 232, 255, 0.78)';
      ctx.lineWidth = 1.4;
      ctx.fillStyle = 'rgba(56, 232, 255, 0.14)';
      ctx.beginPath();
      ctx.arc(
        safeZone.x * scaleX,
        safeZone.y * scaleY,
        safeZone.radius * ((scaleX + scaleY) / 2),
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();

      // Return Portal to DATS Center
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath();
      ctx.arc(
        returnPortal.x * scaleX,
        returnPortal.y * scaleY,
        4.6,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Interactive Landmarks
      for (const pt of points) {
        ctx.fillStyle = pt.accentColor || '#38e8ff';
        ctx.beginPath();
        ctx.arc(pt.x * scaleX, pt.y * scaleY, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Friendly Field NPCs
      for (const npc of npcs) {
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(npc.x * scaleX, npc.y * scaleY, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Active Wild Digimons + Raid Boss Beacon
      for (const en of snapshot.minimapEnemies) {
        if (!en.alive) continue;
        if (en.isBoss) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.36)';
          ctx.beginPath();
          ctx.arc(en.x * scaleX, en.y * scaleY, 9.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(en.x * scaleX, en.y * scaleY, 5.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1.6;
          ctx.stroke();
          continue;
        }
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(en.x * scaleX, en.y * scaleY, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Other Online Players on the same map
    for (const remote of snapshot.minimapPlayers ?? []) {
      ctx.fillStyle = remote.isGm ? '#facc15' : '#34d399';
      ctx.beginPath();
      ctx.arc(
        remote.x * scaleX,
        remote.y * scaleY,
        remote.isGm ? 4.8 : 4.1,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // Partner Digimon gold dot
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(snapshot.partnerX * scaleX, snapshot.partnerY * scaleY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // Tamer Cyan Pin with crisp halo
    ctx.fillStyle = 'rgba(56, 232, 255, 0.32)';
    ctx.beginPath();
    ctx.arc(snapshot.tamerX * scaleX, snapshot.tamerY * scaleY, 8.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38e8ff';
    ctx.beginPath();
    ctx.arc(snapshot.tamerX * scaleX, snapshot.tamerY * scaleY, 5.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.restore();
  }, [
    snapshot,
    zoom,
    isHunting,
    isDataForest,
    isDigiMountain,
    isDigitalDesert,
    isDataSea,
    isDigimonIsland,
    isDarkArea,
    isVirtualWorld,
    isCombatMap,
    minimized,
    thumbVersion,
    canvasW,
    canvasH,
  ]);

  // Exact CSS width classes matching each map's natural proportions and user size preference
  const containerWidthClass = isCombatMap
    ? minimapSize === 'compacto'
      ? 'w-[148px] min-[390px]:w-[162px] sm:w-[184px]'
      : 'w-[174px] min-[390px]:w-[192px] sm:w-[224px]'
    : minimapSize === 'compacto'
      ? 'w-[122px] min-[390px]:w-[132px] sm:w-[148px]'
      : 'w-[144px] min-[390px]:w-[156px] sm:w-[174px]';

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto flex flex-col items-end select-none"
    >
      {minimized ? (
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="dmo-frame flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold text-white shadow-[0_6px_18px_rgba(2,10,32,0.75)] hover:brightness-110 active:scale-95"
        >
          <MapIcon className="h-3.5 w-3.5 text-cyan-300" />
          <span>{regionLabel}</span>
        </button>
      ) : (
        <div
          className={`dmo-frame overflow-hidden rounded-xl shadow-[0_8px_24px_rgba(2,10,32,0.82)] ${containerWidthClass}`}
        >
          {/* Clean Top Bar: Map Name + Minimize */}
          <div className="flex items-center justify-between gap-1 border-b border-cyan-300/40 bg-gradient-to-b from-[#1159d6] to-[#083287] px-2 py-1">
            <span className="truncate text-[10px] font-extrabold tracking-wide text-white drop-shadow sm:text-[11px]">
              {regionLabel}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              {zoom > 1.01 && (
                <span className="rounded bg-[#031438]/75 px-1 text-[8.5px] font-black tabular-nums text-cyan-200">
                  {zoom.toFixed(1)}x
                </span>
              )}
              <button
                type="button"
                onClick={() => setMinimized(true)}
                title="Minimizar minimapa"
                aria-label="Minimizar minimapa"
                className="flex h-4 w-5 items-center justify-center rounded bg-white/10 text-[10px] font-black text-cyan-100 hover:bg-white/20"
              >
                _
              </button>
            </div>
          </div>

          {/* Exact-Aspect Edge-to-Edge Map Photo Viewport (Click to open Full Map) */}
          <button
            type="button"
            onClick={onOpenFullMap}
            title="Clique para abrir o Mapa Completo"
            aria-label="Abrir Mapa Completo"
            className={`relative block w-full overflow-hidden bg-[#041232] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
              isCombatMap ? 'aspect-[16/9]' : 'aspect-[40/37]'
            }`}
          >
            <canvas
              ref={canvasRef}
              width={canvasW}
              height={canvasH}
              className="block h-full w-full"
            />
          </button>

          {/* Clean Footer Bar: Sub-region Label + Zoom & Full-Map Controls (zero clutter over map photo) */}
          <div className="flex items-center justify-between gap-1 border-t border-cyan-400/35 bg-[#04143a]/96 px-1.5 py-1">
            <span className="min-w-0 flex-1 truncate text-[9px] font-extrabold text-cyan-100/95">
              {subZoneText}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.max(1.0, Number((z - 0.35).toFixed(2))))
                }
                disabled={zoom <= 1.0}
                aria-label="Diminuir zoom do minimapa"
                title="Diminuir zoom"
                className="flex h-5 w-5 items-center justify-center rounded-md border border-cyan-300/50 bg-[#09296b] text-cyan-100 hover:bg-[#113d96] active:scale-95 disabled:opacity-45"
              >
                <Minus className="h-2.5 w-2.5 stroke-[2.6]" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.min(2.4, Number((z + 0.35).toFixed(2))))
                }
                disabled={zoom >= 2.4}
                aria-label="Aumentar zoom do minimapa"
                title="Aumentar zoom"
                className="flex h-5 w-5 items-center justify-center rounded-md border border-cyan-300/50 bg-[#09296b] text-cyan-100 hover:bg-[#113d96] active:scale-95 disabled:opacity-45"
              >
                <Plus className="h-2.5 w-2.5 stroke-[2.6]" />
              </button>
              <button
                type="button"
                onClick={onOpenFullMap}
                aria-label="Abrir Mapa Completo"
                title="Abrir Mapa Completo"
                className="flex h-5 w-5 items-center justify-center rounded-md border border-amber-300/75 bg-gradient-to-b from-amber-300 to-amber-500 text-[#2b1402] shadow-sm hover:brightness-110 active:scale-95"
              >
                <Maximize2 className="h-2.5 w-2.5 stroke-[2.6]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
