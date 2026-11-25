import { memo, useEffect, useRef, useState } from 'react';
import { Map as MapIcon, Minus, Plus, Search } from 'lucide-react';
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
  DATS_COLLIDERS,
  DATS_INTERACTION_POINTS,
  DATS_MAP_ID,
  DATS_PLAZA_CENTER,
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
  onOpenFullMap: () => void;
}

export const MinimapHudPanel = memo(function MinimapHudPanel({
  snapshot,
  onOpenFullMap,
}: MinimapHudPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Pre-baked 240x150 offscreen thumbnails per map (eliminates downsampling 2400x1350 PNGs 4x/sec)
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

  // Lazily load and bake ONLY the currently visited combat map's thumbnail
  useEffect(() => {
    const mapId = snapshot.mapId;
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
    if (!url || thumbCacheRef.current[mapId] || loadingMapRef.current.has(mapId)) {
      return;
    }
    loadingMapRef.current.add(mapId);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    img.onload = () => {
      const thumb = document.createElement('canvas');
      thumb.width = 240;
      thumb.height = 150;
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

    // Cyber map backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(
      0,
      isVirtualWorld
        ? '#0a2d6e'
        : isDarkArea
          ? '#2e1065'
          : isDigitalDesert
            ? '#5b3412'
            : isDigiMountain
              ? '#0a3a6b'
              : isDataForest
                ? '#064e3b'
                : isHunting
                  ? '#06335e'
                  : '#062c7a'
    );
    bgGrad.addColorStop(
      1,
      isVirtualWorld
        ? '#04102b'
        : isDarkArea
          ? '#090518'
          : isDigitalDesert
            ? '#291506'
            : isDigiMountain
              ? '#051937'
              : isDataForest
                ? '#022c22'
                : isHunting
                  ? '#031730'
                  : '#03133d'
    );
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(56, 232, 255, 0.14)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < w; gx += 18) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
    for (let gy = 0; gy < h; gy += 18) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    const baseScale = Math.min(w / worldW, h / worldH);
    const scale = baseScale * zoom;

    ctx.save();
    if (zoom <= 1.05) {
      ctx.translate((w - worldW * scale) / 2, (h - worldH * scale) / 2);
    } else {
      ctx.translate(w / 2 - snapshot.tamerX * scale, h / 2 - snapshot.tamerY * scale);
    }

    const activeThumb = thumbCacheRef.current[snapshot.mapId];
    if (isVirtualWorld && activeThumb) {
      ctx.drawImage(activeThumb, 0, 0, worldW * scale, worldH * scale);
      ctx.fillStyle = 'rgba(4, 18, 48, 0.22)';
      ctx.fillRect(0, 0, worldW * scale, worldH * scale);
    } else if (isDarkArea && activeThumb) {
      ctx.drawImage(activeThumb, 0, 0, worldW * scale, worldH * scale);
      ctx.fillStyle = 'rgba(15, 6, 36, 0.24)';
      ctx.fillRect(0, 0, worldW * scale, worldH * scale);
    } else if (isDigimonIsland && activeThumb) {
      ctx.drawImage(activeThumb, 0, 0, worldW * scale, worldH * scale);
      ctx.fillStyle = 'rgba(4, 24, 52, 0.22)';
      ctx.fillRect(0, 0, worldW * scale, worldH * scale);
    } else if (isDataSea && activeThumb) {
      ctx.drawImage(activeThumb, 0, 0, worldW * scale, worldH * scale);
      ctx.fillStyle = 'rgba(4, 24, 52, 0.22)';
      ctx.fillRect(0, 0, worldW * scale, worldH * scale);
    } else if (isDigitalDesert && activeThumb) {
      ctx.drawImage(activeThumb, 0, 0, worldW * scale, worldH * scale);
      ctx.fillStyle = 'rgba(28, 18, 6, 0.24)';
      ctx.fillRect(0, 0, worldW * scale, worldH * scale);
    } else if (isDigiMountain && activeThumb) {
      ctx.drawImage(activeThumb, 0, 0, worldW * scale, worldH * scale);
      ctx.fillStyle = 'rgba(5, 22, 52, 0.24)';
      ctx.fillRect(0, 0, worldW * scale, worldH * scale);
    } else if (isDataForest && activeThumb) {
      ctx.drawImage(activeThumb, 0, 0, worldW * scale, worldH * scale);
      ctx.fillStyle = 'rgba(4, 26, 28, 0.24)';
      ctx.fillRect(0, 0, worldW * scale, worldH * scale);
    } else if (isHunting && activeThumb) {
      ctx.drawImage(activeThumb, 0, 0, worldW * scale, worldH * scale);
      // Subtle cool veil so map markers stay ultra-legible
      ctx.fillStyle = 'rgba(4, 22, 54, 0.22)';
      ctx.fillRect(0, 0, worldW * scale, worldH * scale);
    } else {
      ctx.fillStyle = isCombatMap ? 'rgba(13, 72, 66, 0.7)' : 'rgba(12, 62, 158, 0.65)';
      ctx.fillRect(0, 0, worldW * scale, worldH * scale);
    }

    ctx.strokeStyle = 'rgba(56, 232, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, worldW * scale, worldH * scale);

    if (!isCombatMap) {
      ctx.fillStyle = 'rgba(56, 232, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(
        DATS_PLAZA_CENTER.x * scale,
        DATS_PLAZA_CENTER.y * scale,
        185 * scale,
        118 * scale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      for (const c of DATS_COLLIDERS) {
        ctx.fillStyle =
          c.kind === 'building' || c.kind === 'wall'
            ? '#020f36'
            : c.kind === 'tree'
              ? '#15803d'
              : '#1e3a8a';
        ctx.fillRect(c.x * scale, c.y * scale, c.w * scale, c.h * scale);
      }

      for (const pt of DATS_INTERACTION_POINTS) {
        if (pt.id === 'dats-mudfrigimon-npc') continue;
        ctx.fillStyle = pt.kind === 'world-portal' ? '#ffd43b' : '#38e8ff';
        ctx.beginPath();
        ctx.arc(pt.x * scale, pt.y * scale, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Official Fixed DATS NPCs (Richard Sampson & MudFrigimon)
      for (const npc of DATS_FIXED_NPCS) {
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(npc.x * scale, npc.y * scale, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 0.9;
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
      ctx.strokeStyle = 'rgba(56, 232, 255, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.fillStyle = 'rgba(56, 232, 255, 0.16)';
      ctx.beginPath();
      ctx.arc(
        safeZone.x * scale,
        safeZone.y * scale,
        safeZone.radius * scale,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();

      // Return Portal to DATS Center
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath();
      ctx.arc(
        returnPortal.x * scale,
        returnPortal.y * scale,
        3.6,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Interactive Landmarks
      for (const pt of points) {
        ctx.fillStyle = pt.accentColor || '#38e8ff';
        ctx.beginPath();
        ctx.arc(pt.x * scale, pt.y * scale, 2.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Friendly Field NPCs
      for (const npc of npcs) {
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(npc.x * scale, npc.y * scale, 2.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Active Wild Digimons + Prominent Crimson-Gold Raid Boss Beacon
      for (const en of snapshot.minimapEnemies) {
        if (!en.alive) continue;
        if (en.isBoss) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.beginPath();
          ctx.arc(en.x * scale, en.y * scale, 7.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(en.x * scale, en.y * scale, 4.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1.4;
          ctx.stroke();
          continue;
        }
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(en.x * scale, en.y * scale, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Other Online Players on the same map (Emerald pin, Gold crown pin for GM)
    for (const remote of snapshot.minimapPlayers ?? []) {
      ctx.fillStyle = remote.isGm ? '#facc15' : '#34d399';
      ctx.beginPath();
      ctx.arc(remote.x * scale, remote.y * scale, remote.isGm ? 3.8 : 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    // Partner Dot
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(snapshot.partnerX * scale, snapshot.partnerY * scale, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Tamer Cyan Pin
    ctx.fillStyle = '#38e8ff';
    ctx.beginPath();
    ctx.arc(snapshot.tamerX * scale, snapshot.tamerY * scale, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
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
  ]);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto flex flex-col items-end select-none"
    >
      {minimized ? (
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="dmo-frame flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold text-white"
        >
          <MapIcon className="h-3.5 w-3.5 text-cyan-300" />
          <span>{regionLabel}</span>
        </button>
      ) : (
        <div className="dmo-frame w-[136px] overflow-hidden rounded-xl min-[390px]:w-[150px] sm:w-[162px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-300/45 bg-gradient-to-b from-[#1159d6] to-[#083287] px-2 py-0.5 sm:px-2.5 sm:py-1">
            <span className="truncate text-[10px] font-extrabold tracking-wide text-white drop-shadow sm:text-[11px]">
              {regionLabel}
            </span>
            <button
              type="button"
              onClick={() => setMinimized(true)}
              title="Minimizar minimapa"
              className="ml-1 rounded px-1 text-[10px] font-bold text-cyan-100 hover:bg-white/10"
            >
              _
            </button>
          </div>

          {/* Radar Viewport */}
          <div className="relative h-[110px] w-full sm:h-[138px]">
            <canvas
              ref={canvasRef}
              width={162}
              height={138}
              className="block h-full w-full"
            />

            {/* Top-Left Gold Search Button */}
            <button
              type="button"
              onClick={onOpenFullMap}
              title="Abrir Mapa Completo"
              className="dmo-gold-circle absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[#3b1b04] active:scale-95"
            >
              <Search className="h-3 w-3 stroke-[2.5]" />
            </button>

            {/* Top-Right Gold - / + Zoom Buttons */}
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1.0, Number((z - 0.35).toFixed(2))))}
                aria-label="Diminuir zoom do minimapa"
                className="dmo-gold-circle flex h-5 w-5 items-center justify-center rounded-full text-[#3b1b04] active:scale-95"
              >
                <Minus className="h-3 w-3 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.4, Number((z + 0.35).toFixed(2))))}
                aria-label="Aumentar zoom do minimapa"
                className="dmo-gold-circle flex h-5 w-5 items-center justify-center rounded-full text-[#3b1b04] active:scale-95"
              >
                <Plus className="h-3 w-3 stroke-[2.5]" />
              </button>
            </div>

            {/* Area / Sub-region Label */}
            <span className="pointer-events-none absolute left-1.5 top-7 max-w-[118px] truncate rounded bg-[#031438]/82 px-1.5 py-0.5 text-[8.5px] font-extrabold leading-tight text-cyan-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
              {snapshot.mapId === DATS_MAP_ID
                ? 'Praça DATS'
                : activeSubZone
                  ? activeSubZone.speciesLabel
                    ? `${activeSubZone.name} · ${activeSubZone.speciesLabel}`
                    : activeSubZone.name
                  : regionLabel}
            </span>

            {/* Bottom-Left Gold N Compass + Star Badge */}
            <div className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1">
              <span className="dmo-gold-circle flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-[#3b1b04]">
                N
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-200 bg-[#082b78] text-[9px] font-black text-amber-300 shadow">
                ✦
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
