import { DATA_FOREST_MAP_ID, DATA_FOREST_RETURN_PORTAL } from './dataForestMap';
import { DATA_SEA_MAP_ID, DATA_SEA_RETURN_PORTAL } from './dataSeaMap';
import { DARK_AREA_MAP_ID, DARK_AREA_RETURN_PORTAL } from './darkAreaMap';
import { DATS_MAP_ID } from './datsCenterMap';
import { DIGI_MOUNTAIN_MAP_ID, DIGI_MOUNTAIN_RETURN_PORTAL } from './digiMountainMap';
import { DIGITAL_DESERT_MAP_ID, DIGITAL_DESERT_RETURN_PORTAL } from './digitalDesertMap';
import { DIGIMON_ISLAND_MAP_ID, DIGIMON_ISLAND_RETURN_PORTAL } from './digimonIslandMap';
import { D_TERMINAL_MAP_ID, D_TERMINAL_RETURN_PORTAL } from './dTerminalMap';
import { HUNTING_MAP_ID, HUNTING_RETURN_PORTAL } from './huntingFieldMap';
import type { DimensionalPortalTheme } from './portalRenderer';
import { VIRTUAL_WORLD_MAP_ID, VIRTUAL_WORLD_RETURN_PORTAL } from './virtualWorldMap';

export type WorldPortalTargetMapId =
  | typeof DATS_MAP_ID
  | typeof D_TERMINAL_MAP_ID
  | typeof HUNTING_MAP_ID
  | typeof DATA_FOREST_MAP_ID
  | typeof DIGI_MOUNTAIN_MAP_ID
  | typeof DIGITAL_DESERT_MAP_ID
  | typeof DATA_SEA_MAP_ID
  | typeof DIGIMON_ISLAND_MAP_ID
  | typeof DARK_AREA_MAP_ID
  | typeof VIRTUAL_WORLD_MAP_ID;

export interface MapPortalLink {
  id: string;
  role: 'back' | 'next' | 'hub';
  x: number;
  y: number;
  radius: number;
  targetMapId: WorldPortalTargetMapId;
  minLevel: number;
  title: string;
  subtitle: string;
  theme: DimensionalPortalTheme;
  scale?: number;
}

/**
 * Complete interconnected portal graph across D-Terminal and all 8 progressive hunting maps.
 * - DATS Center southern portal goes directly to D-Terminal.
 * - D-Terminal has a return portal to DATS Center + PawnChessmon (Black) Trailmon conductor.
 * - Every combat map connects cleanly to the previous map (or D-Terminal on Map 1) AND the next map in sequence!
 */
export const MAP_PORTAL_LINKS: Record<
  Exclude<WorldPortalTargetMapId, typeof DATS_MAP_ID>,
  readonly MapPortalLink[]
> = {
  [D_TERMINAL_MAP_ID]: [
    {
      id: 'd-terminal-to-dats',
      role: 'hub',
      x: D_TERMINAL_RETURN_PORTAL.x,
      y: D_TERMINAL_RETURN_PORTAL.y,
      radius: D_TERMINAL_RETURN_PORTAL.radius,
      targetMapId: DATS_MAP_ID,
      minLevel: 1,
      title: 'DATS Center',
      subtitle: 'Voltar ao DATS',
      theme: 'digital',
      scale: 1.0,
    },
  ],
  [HUNTING_MAP_ID]: [
    {
      id: 'hunting-back-dterminal',
      role: 'hub',
      x: HUNTING_RETURN_PORTAL.x,
      y: HUNTING_RETURN_PORTAL.y,
      radius: HUNTING_RETURN_PORTAL.radius,
      targetMapId: D_TERMINAL_MAP_ID,
      minLevel: 1,
      title: 'D-Terminal',
      subtitle: 'Estação Trailmon',
      theme: 'digital',
      scale: 0.96,
    },
    {
      id: 'hunting-next-forest',
      role: 'next',
      x: 900,
      y: 980,
      radius: 82,
      targetMapId: DATA_FOREST_MAP_ID,
      minLevel: 10,
      title: 'Floresta de Dados',
      subtitle: 'Próximo Mapa · Nv. 10+',
      theme: 'solar',
      scale: 0.94,
    },
  ],
  [DATA_FOREST_MAP_ID]: [
    {
      id: 'forest-back-hunting',
      role: 'back',
      x: DATA_FOREST_RETURN_PORTAL.x,
      y: DATA_FOREST_RETURN_PORTAL.y,
      radius: DATA_FOREST_RETURN_PORTAL.radius,
      targetMapId: HUNTING_MAP_ID,
      minLevel: 1,
      title: 'Planície Digital',
      subtitle: 'Mapa Anterior · Nv. 1–10',
      theme: 'digital',
      scale: 0.94,
    },
    {
      id: 'forest-next-mountain',
      role: 'next',
      x: 1680,
      y: 1200,
      radius: 82,
      targetMapId: DIGI_MOUNTAIN_MAP_ID,
      minLevel: 20,
      title: 'Montanha Digi',
      subtitle: 'Próximo Mapa · Nv. 20+',
      theme: 'solar',
      scale: 0.94,
    },
  ],
  [DIGI_MOUNTAIN_MAP_ID]: [
    {
      id: 'mountain-back-forest',
      role: 'back',
      x: DIGI_MOUNTAIN_RETURN_PORTAL.x,
      y: DIGI_MOUNTAIN_RETURN_PORTAL.y,
      radius: DIGI_MOUNTAIN_RETURN_PORTAL.radius,
      targetMapId: DATA_FOREST_MAP_ID,
      minLevel: 10,
      title: 'Floresta de Dados',
      subtitle: 'Mapa Anterior · Nv. 10–20',
      theme: 'digital',
      scale: 0.94,
    },
    {
      id: 'mountain-next-desert',
      role: 'next',
      x: 480,
      y: 460,
      radius: 82,
      targetMapId: DIGITAL_DESERT_MAP_ID,
      minLevel: 30,
      title: 'Deserto Digital',
      subtitle: 'Próximo Mapa · Nv. 30+',
      theme: 'solar',
      scale: 0.94,
    },
  ],
  [DIGITAL_DESERT_MAP_ID]: [
    {
      id: 'desert-back-mountain',
      role: 'back',
      x: DIGITAL_DESERT_RETURN_PORTAL.x,
      y: DIGITAL_DESERT_RETURN_PORTAL.y,
      radius: DIGITAL_DESERT_RETURN_PORTAL.radius,
      targetMapId: DIGI_MOUNTAIN_MAP_ID,
      minLevel: 20,
      title: 'Montanha Digi',
      subtitle: 'Mapa Anterior · Nv. 20–30',
      theme: 'solar',
      scale: 0.94,
    },
    {
      id: 'desert-next-sea',
      role: 'next',
      x: 2120,
      y: 440,
      radius: 82,
      targetMapId: DATA_SEA_MAP_ID,
      minLevel: 40,
      title: 'Mar de Dados',
      subtitle: 'Próximo Mapa · Nv. 40+',
      theme: 'digital',
      scale: 0.94,
    },
  ],
  [DATA_SEA_MAP_ID]: [
    {
      id: 'sea-back-desert',
      role: 'back',
      x: DATA_SEA_RETURN_PORTAL.x,
      y: DATA_SEA_RETURN_PORTAL.y,
      radius: DATA_SEA_RETURN_PORTAL.radius,
      targetMapId: DIGITAL_DESERT_MAP_ID,
      minLevel: 30,
      title: 'Deserto Digital',
      subtitle: 'Mapa Anterior · Nv. 30–40',
      theme: 'solar',
      scale: 0.94,
    },
    {
      id: 'sea-next-island',
      role: 'next',
      x: 2080,
      y: 1000,
      radius: 82,
      targetMapId: DIGIMON_ISLAND_MAP_ID,
      minLevel: 50,
      title: 'Ilha dos Digimons',
      subtitle: 'Próximo Mapa · Nv. 50+',
      theme: 'digital',
      scale: 0.94,
    },
  ],
  [DIGIMON_ISLAND_MAP_ID]: [
    {
      id: 'island-back-sea',
      role: 'back',
      x: DIGIMON_ISLAND_RETURN_PORTAL.x,
      y: DIGIMON_ISLAND_RETURN_PORTAL.y,
      radius: DIGIMON_ISLAND_RETURN_PORTAL.radius,
      targetMapId: DATA_SEA_MAP_ID,
      minLevel: 40,
      title: 'Mar de Dados',
      subtitle: 'Mapa Anterior · Nv. 40–50',
      theme: 'digital',
      scale: 0.94,
    },
    {
      id: 'island-next-dark',
      role: 'next',
      x: 2160,
      y: 1160,
      radius: 82,
      targetMapId: DARK_AREA_MAP_ID,
      minLevel: 60,
      title: 'Área Sombria',
      subtitle: 'Próximo Mapa · Nv. 60+',
      theme: 'amethyst',
      scale: 0.94,
    },
  ],
  [DARK_AREA_MAP_ID]: [
    {
      id: 'dark-back-island',
      role: 'back',
      x: DARK_AREA_RETURN_PORTAL.x,
      y: DARK_AREA_RETURN_PORTAL.y,
      radius: DARK_AREA_RETURN_PORTAL.radius,
      targetMapId: DIGIMON_ISLAND_MAP_ID,
      minLevel: 50,
      title: 'Ilha dos Digimons',
      subtitle: 'Mapa Anterior · Nv. 50–60',
      theme: 'amethyst',
      scale: 0.94,
    },
    {
      id: 'dark-next-virtual',
      role: 'next',
      x: 2160,
      y: 1160,
      radius: 82,
      targetMapId: VIRTUAL_WORLD_MAP_ID,
      minLevel: 70,
      title: 'Mundo Virtual',
      subtitle: 'Próximo Mapa · Nv. 70+',
      theme: 'digital',
      scale: 0.94,
    },
  ],
  [VIRTUAL_WORLD_MAP_ID]: [
    {
      id: 'virtual-back-dark',
      role: 'back',
      x: VIRTUAL_WORLD_RETURN_PORTAL.x,
      y: VIRTUAL_WORLD_RETURN_PORTAL.y,
      radius: VIRTUAL_WORLD_RETURN_PORTAL.radius,
      targetMapId: DARK_AREA_MAP_ID,
      minLevel: 60,
      title: 'Área Sombria',
      subtitle: 'Mapa Anterior · Nv. 60–70',
      theme: 'amethyst',
      scale: 0.94,
    },
    {
      id: 'virtual-hub-dterminal',
      role: 'hub',
      x: 1040,
      y: 900,
      radius: 82,
      targetMapId: D_TERMINAL_MAP_ID,
      minLevel: 1,
      title: 'D-Terminal',
      subtitle: 'Estação Trailmon',
      theme: 'digital',
      scale: 0.94,
    },
  ],
};

export function getPortalsForMap(
  mapId: WorldPortalTargetMapId
): readonly MapPortalLink[] {
  if (mapId === DATS_MAP_ID) return [];
  return MAP_PORTAL_LINKS[mapId] ?? [];
}

/**
 * Human-readable route connection metadata for the World Map Guide encyclopedia.
 */
export function getMapRouteSummary(mapId: WorldPortalTargetMapId): {
  previousLabel: string;
  nextLabel: string;
} {
  switch (mapId) {
    case DATS_MAP_ID:
      return {
        previousLabel: 'Base Principal',
        nextLabel: 'Portal Sul → D-Terminal',
      };
    case D_TERMINAL_MAP_ID:
      return {
        previousLabel: 'Portal Sul → DATS Center',
        nextLabel: 'Condutor PawnChessmon → Todos os Mapas',
      };
    case HUNTING_MAP_ID:
      return {
        previousLabel: 'Área Segura Central → D-Terminal',
        nextLabel: 'Portal Sul (Ponte) → Floresta de Dados (Nv. 10+)',
      };
    case DATA_FOREST_MAP_ID:
      return {
        previousLabel: 'Área Segura Sudeste → Planície Digital',
        nextLabel: 'Margem Sul → Montanha Digi (Nv. 20+)',
      };
    case DIGI_MOUNTAIN_MAP_ID:
      return {
        previousLabel: 'Área Segura Oeste → Floresta de Dados',
        nextLabel: 'Platô Noroeste → Deserto Digital (Nv. 30+)',
      };
    case DIGITAL_DESERT_MAP_ID:
      return {
        previousLabel: 'Área Segura Sul → Montanha Digi',
        nextLabel: 'Duna Nordeste → Mar de Dados (Nv. 40+)',
      };
    case DATA_SEA_MAP_ID:
      return {
        previousLabel: 'Área Segura Sudeste → Deserto Digital',
        nextLabel: 'Cais Leste → Ilha dos Digimons (Nv. 50+)',
      };
    case DIGIMON_ISLAND_MAP_ID:
      return {
        previousLabel: 'Cais Sul → Mar de Dados',
        nextLabel: 'Costa Sudeste → Área Sombria (Nv. 60+)',
      };
    case DARK_AREA_MAP_ID:
      return {
        previousLabel: 'Altar Sul → Ilha dos Digimons',
        nextLabel: 'Borda Sudeste → Mundo Virtual (Nv. 70+)',
      };
    case VIRTUAL_WORLD_MAP_ID:
      return {
        previousLabel: 'Plataforma Sul → Área Sombria',
        nextLabel: 'Plataforma Oeste → D-Terminal',
      };
  }
}
