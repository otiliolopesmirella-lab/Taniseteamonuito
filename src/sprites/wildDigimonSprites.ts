/**
 * High-FPS Wild Digimon Sprite Renderer for Planície Digital (Lv. 1–10)
 * and Floresta de Dados (Lv. 10–20 + Raid Boss Kuwagamon).
 *
 * Performance architecture:
 * - Playable-form wild Digimons slice ONLY the side-facing row (Row 3 = native East)
 *   + attack pose from their clean RGBA partner sheets and bake compact 128px/160px
 *   offscreen frames + hardware-accelerated `source-atop` hit-flash frames.
 * - Zero `getImageData`, zero `toDataURL`, and the large 1536x1920 source image is
 *   immediately released for GC after baking (~120MB VRAM saved!).
 * - Map-scoped preloading (`preloadWildDigimonSpritesForMap`) ensures DATS Center loads
 *   0 wild sheets and each hunting map loads only its own 5–6 species.
 */

export type WildSpriteSpecies =
  | 'drimogemon'
  | 'gotsumon'
  | 'kiwimon'
  | 'hawkmon'
  | 'monodramon'
  | 'impmon'
  | 'renamon'
  | 'guilmon'
  | 'garurumon'
  | 'greymon'
  | 'kuwagamon'
  | 'meramon'
  | 'digmon'
  | 'kabuterimon'
  | 'chrysalimon'
  | 'veedramon'
  | 'iceleomon'
  | 'insekimon'
  | 'skullmeramon'
  | 'cyberdramon'
  | 'megalogrowlmon'
  | 'metalgreymon'
  | 'giromon'
  | 'garudamon'
  | 'skullsatamon'
  | 'okuwamon'
  | 'metalgarurumon'
  | 'gryphonmon'
  | 'dukemon'
  | 'griffomon'
  | 'sakuyamon'
  | 'metaletemon'
  | 'boltmon'
  | 'grankuwagamon'
  | 'beelzemon'
  | 'diaboromon'
  | 'hiandromon'
  | 'saberleomon'
  | 'herculeskabuterimon'
  | 'wargreymon';

interface PlayableWildSpec {
  readonly formId: Exclude<WildSpriteSpecies, 'kuwagamon'>;
  readonly cacheBust: string;
  readonly worldHeightPx: number;
  readonly shadowRx: number;
  readonly shadowRy: number;
  readonly bakeSizePx: number;
  readonly hoverAltitudePx?: number;
  readonly isChampion?: boolean;
}

const PLAYABLE_WILD_SPECS: Record<
  Exclude<WildSpriteSpecies, 'kuwagamon'>,
  PlayableWildSpec
> = {
  // === Planície Digital (Nv. 1–10 — Somente Rookies) ===
  drimogemon: {
    formId: 'drimogemon',
    cacheBust: '?v=drimo2',
    worldHeightPx: 74,
    shadowRx: 21,
    shadowRy: 7.5,
    bakeSizePx: 128,
  },
  gotsumon: {
    formId: 'gotsumon',
    cacheBust: '?v=germ2',
    worldHeightPx: 58,
    shadowRx: 15.5,
    shadowRy: 5.8,
    bakeSizePx: 160,
  },
  kiwimon: {
    formId: 'kiwimon',
    cacheBust: '?v=tdk4',
    worldHeightPx: 74,
    shadowRx: 19,
    shadowRy: 7,
    bakeSizePx: 160,
  },
  hawkmon: {
    formId: 'hawkmon',
    cacheBust: '?v=mh3',
    worldHeightPx: 66,
    shadowRx: 17,
    shadowRy: 6.5,
    bakeSizePx: 160,
  },
  monodramon: {
    formId: 'monodramon',
    cacheBust: '?v=germ2',
    worldHeightPx: 64,
    shadowRx: 17,
    shadowRy: 6.4,
    bakeSizePx: 160,
  },
  // === Floresta de Dados (Nv. 10–20) ===
  impmon: {
    formId: 'impmon',
    cacheBust: '?v=impmon1',
    worldHeightPx: 66,
    shadowRx: 16,
    shadowRy: 6.2,
    bakeSizePx: 160,
  },
  renamon: {
    formId: 'renamon',
    cacheBust: '?v=germ2',
    worldHeightPx: 70,
    shadowRx: 17,
    shadowRy: 6.4,
    bakeSizePx: 160,
  },
  guilmon: {
    formId: 'guilmon',
    cacheBust: '?v=guilmon5',
    worldHeightPx: 74,
    shadowRx: 20,
    shadowRy: 7.5,
    bakeSizePx: 160,
  },
  garurumon: {
    formId: 'garurumon',
    cacheBust: '?v=gabumon2',
    worldHeightPx: 100,
    shadowRx: 30,
    shadowRy: 10,
    bakeSizePx: 192,
    isChampion: true,
  },
  greymon: {
    formId: 'greymon',
    cacheBust: '?v=classic4',
    worldHeightPx: 118,
    shadowRx: 32,
    shadowRy: 10.5,
    bakeSizePx: 192,
    isChampion: true,
  },
  // === Montanha Digi 3D (Nv. 20–30 — Champions) ===
  meramon: {
    formId: 'meramon',
    cacheBust: '?v=mh3',
    worldHeightPx: 104,
    shadowRx: 26,
    shadowRy: 9,
    bakeSizePx: 192,
    isChampion: true,
  },
  digmon: {
    formId: 'digmon',
    cacheBust: '?v=tdk4',
    worldHeightPx: 102,
    shadowRx: 28,
    shadowRy: 9.5,
    bakeSizePx: 192,
    isChampion: true,
  },
  kabuterimon: {
    formId: 'kabuterimon',
    cacheBust: '?v=tdk4',
    worldHeightPx: 114,
    shadowRx: 28,
    shadowRy: 9.5,
    bakeSizePx: 192,
    hoverAltitudePx: 10,
    isChampion: true,
  },
  chrysalimon: {
    formId: 'chrysalimon',
    cacheBust: '?v=vk3',
    worldHeightPx: 108,
    shadowRx: 27,
    shadowRy: 9.2,
    bakeSizePx: 192,
    hoverAltitudePx: 8,
    isChampion: true,
  },
  veedramon: {
    formId: 'veedramon',
    cacheBust: '?v=vk3',
    worldHeightPx: 112,
    shadowRx: 29,
    shadowRy: 9.8,
    bakeSizePx: 192,
    isChampion: true,
  },
  // === Deserto Digital (Nv. 30–40 — Ultimates) ===
  iceleomon: {
    formId: 'iceleomon',
    cacheBust: '?v=germ2',
    worldHeightPx: 128,
    shadowRx: 32,
    shadowRy: 10.8,
    bakeSizePx: 192,
    isChampion: true,
  },
  insekimon: {
    formId: 'insekimon',
    cacheBust: '?v=germ2',
    worldHeightPx: 124,
    shadowRx: 32,
    shadowRy: 10.8,
    bakeSizePx: 192,
    isChampion: true,
  },
  skullmeramon: {
    formId: 'skullmeramon',
    cacheBust: '?v=mh3',
    worldHeightPx: 138,
    shadowRx: 34,
    shadowRy: 11,
    bakeSizePx: 192,
    isChampion: true,
  },
  cyberdramon: {
    formId: 'cyberdramon',
    cacheBust: '?v=germ2',
    worldHeightPx: 132,
    shadowRx: 33,
    shadowRy: 11,
    bakeSizePx: 192,
    isChampion: true,
  },
  megalogrowlmon: {
    formId: 'megalogrowlmon',
    cacheBust: '?v=guilmon2',
    worldHeightPx: 136,
    shadowRx: 35,
    shadowRy: 11.2,
    bakeSizePx: 192,
    isChampion: true,
  },
  // === Mar de Dados (Nv. 40–50 — Ultimates) ===
  metalgreymon: {
    formId: 'metalgreymon',
    cacheBust: '?v=classic4',
    worldHeightPx: 140,
    shadowRx: 36,
    shadowRy: 11.5,
    bakeSizePx: 192,
    isChampion: true,
  },
  giromon: {
    formId: 'giromon',
    cacheBust: '?v=tdk4',
    worldHeightPx: 118,
    shadowRx: 28,
    shadowRy: 9.6,
    bakeSizePx: 192,
    hoverAltitudePx: 14,
    isChampion: true,
  },
  garudamon: {
    formId: 'garudamon',
    cacheBust: '?v=bk1',
    worldHeightPx: 136,
    shadowRx: 32,
    shadowRy: 10.5,
    bakeSizePx: 192,
    hoverAltitudePx: 18,
    isChampion: true,
  },
  skullsatamon: {
    formId: 'skullsatamon',
    cacheBust: '?v=impmon1',
    worldHeightPx: 132,
    shadowRx: 31,
    shadowRy: 10.5,
    bakeSizePx: 192,
    isChampion: true,
  },
  okuwamon: {
    formId: 'okuwamon',
    cacheBust: '?v=bk1',
    worldHeightPx: 134,
    shadowRx: 32,
    shadowRy: 10.8,
    bakeSizePx: 192,
    hoverAltitudePx: 16,
    isChampion: true,
  },
  // === Ilha dos Digimons (Nv. 50–60 — Megas) ===
  metalgarurumon: {
    formId: 'metalgarurumon',
    cacheBust: '?v=gabumon2',
    worldHeightPx: 146,
    shadowRx: 37,
    shadowRy: 12,
    bakeSizePx: 192,
    isChampion: true,
  },
  sakuyamon: {
    formId: 'sakuyamon',
    cacheBust: '?v=germ2',
    worldHeightPx: 148,
    shadowRx: 34,
    shadowRy: 11.2,
    bakeSizePx: 192,
    isChampion: true,
  },
  gryphonmon: {
    formId: 'gryphonmon',
    cacheBust: '?v=mh3',
    worldHeightPx: 152,
    shadowRx: 36,
    shadowRy: 11.8,
    bakeSizePx: 192,
    hoverAltitudePx: 18,
    isChampion: true,
  },
  dukemon: {
    formId: 'dukemon',
    cacheBust: '?v=hd4',
    worldHeightPx: 150,
    shadowRx: 36,
    shadowRy: 11.8,
    bakeSizePx: 192,
    isChampion: true,
  },
  griffomon: {
    formId: 'griffomon',
    cacheBust: '?v=tdk4',
    worldHeightPx: 156,
    shadowRx: 38,
    shadowRy: 12.2,
    bakeSizePx: 192,
    hoverAltitudePx: 14,
    isChampion: true,
  },
  // === Área Sombria (Nv. 60–70 — Megas) ===
  metaletemon: {
    formId: 'metaletemon',
    cacheBust: '?v=germ2',
    worldHeightPx: 146,
    shadowRx: 36,
    shadowRy: 11.8,
    bakeSizePx: 192,
    isChampion: true,
  },
  boltmon: {
    formId: 'boltmon',
    cacheBust: '?v=mh3',
    worldHeightPx: 158,
    shadowRx: 38,
    shadowRy: 12.2,
    bakeSizePx: 192,
    isChampion: true,
  },
  grankuwagamon: {
    formId: 'grankuwagamon',
    cacheBust: '?v=bk1',
    worldHeightPx: 158,
    shadowRx: 38,
    shadowRy: 12.2,
    bakeSizePx: 192,
    hoverAltitudePx: 16,
    isChampion: true,
  },
  beelzemon: {
    formId: 'beelzemon',
    cacheBust: '?v=beelzemon2',
    worldHeightPx: 148,
    shadowRx: 34,
    shadowRy: 11.2,
    bakeSizePx: 192,
    isChampion: true,
  },
  diaboromon: {
    formId: 'diaboromon',
    cacheBust: '?v=vk3',
    worldHeightPx: 162,
    shadowRx: 38,
    shadowRy: 12.2,
    bakeSizePx: 192,
    isChampion: true,
  },

  // === Mundo Virtual (Nv. 70–80 — 5 Megas Clássicos) ===
  hiandromon: {
    formId: 'hiandromon',
    cacheBust: '?v=tdk4',
    worldHeightPx: 150,
    shadowRx: 35,
    shadowRy: 11.4,
    bakeSizePx: 192,
    isChampion: true,
  },
  saberleomon: {
    formId: 'saberleomon',
    cacheBust: '?v=germ2',
    worldHeightPx: 146,
    shadowRx: 40,
    shadowRy: 12.6,
    bakeSizePx: 192,
    isChampion: true,
  },
  herculeskabuterimon: {
    formId: 'herculeskabuterimon',
    cacheBust: '?v=tdk4',
    worldHeightPx: 158,
    shadowRx: 38,
    shadowRy: 12,
    bakeSizePx: 192,
    hoverAltitudePx: 14,
    isChampion: true,
  },
  wargreymon: {
    formId: 'wargreymon',
    cacheBust: '?v=classic4',
    worldHeightPx: 156,
    shadowRx: 36,
    shadowRy: 11.8,
    bakeSizePx: 192,
    isChampion: true,
  },
};

export const HUNTING_PLAINS_WILD_SPECIES: readonly WildSpriteSpecies[] = [
  'drimogemon',
  'gotsumon',
  'kiwimon',
  'hawkmon',
  'monodramon',
] as const;

export const DATA_FOREST_WILD_SPECIES: readonly WildSpriteSpecies[] = [
  'impmon',
  'renamon',
  'guilmon',
  'garurumon',
  'greymon',
  'kuwagamon',
] as const;

export const DIGI_MOUNTAIN_WILD_SPECIES: readonly WildSpriteSpecies[] = [
  'meramon',
  'digmon',
  'kabuterimon',
  'chrysalimon',
  'veedramon',
] as const;

export const DIGITAL_DESERT_WILD_SPECIES: readonly WildSpriteSpecies[] = [
  'iceleomon',
  'insekimon',
  'skullmeramon',
  'cyberdramon',
  'megalogrowlmon',
] as const;

export const DATA_SEA_WILD_SPECIES: readonly WildSpriteSpecies[] = [
  'metalgreymon',
  'giromon',
  'garudamon',
  'skullsatamon',
  'okuwamon',
] as const;

export const DIGIMON_ISLAND_WILD_SPECIES: readonly WildSpriteSpecies[] = [
  'metalgarurumon',
  'sakuyamon',
  'gryphonmon',
  'dukemon',
  'griffomon',
] as const;

export const DARK_AREA_WILD_SPECIES: readonly WildSpriteSpecies[] = [
  'metaletemon',
  'boltmon',
  'grankuwagamon',
  'beelzemon',
  'diaboromon',
] as const;

export const VIRTUAL_WORLD_WILD_SPECIES: readonly WildSpriteSpecies[] = [
  'hiandromon',
  'saberleomon',
  'herculeskabuterimon',
  'metalgarurumon',
  'wargreymon',
] as const;

const ALL_WILD_SPECIES: readonly WildSpriteSpecies[] = Array.from(
  new Set<WildSpriteSpecies>([
    ...HUNTING_PLAINS_WILD_SPECIES,
    ...DATA_FOREST_WILD_SPECIES,
    ...DIGI_MOUNTAIN_WILD_SPECIES,
    ...DIGITAL_DESERT_WILD_SPECIES,
    ...DATA_SEA_WILD_SPECIES,
    ...DIGIMON_ISLAND_WILD_SPECIES,
    ...DARK_AREA_WILD_SPECIES,
    ...VIRTUAL_WORLD_WILD_SPECIES,
  ])
);

interface BakedWildFrames {
  /** Native East-facing (facingRight = true) walk frames */
  walkFrames: HTMLCanvasElement[];
  /** White hit-flash walk frame matching walkFrames[0] */
  flashWalkFrame: HTMLCanvasElement;
  /** Native East-facing attack pose frame */
  attackFrame: HTMLCanvasElement;
  /** White hit-flash attack frame */
  flashAttackFrame: HTMLCanvasElement;
  worldHeightPx: number;
  shadowRx: number;
  shadowRy: number;
  hoverAltitudePx: number;
  isBoss: boolean;
}

const bakedCache = new Map<WildSpriteSpecies, BakedWildFrames>();
const loadingPromises = new Map<WildSpriteSpecies, Promise<void>>();
let kuwagamonPortraitDataUrl: string | null = null;

function createOffscreenCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/**
 * Hardware-accelerated white hit-flash frame (zero getImageData/CPU loop).
 */
function createWhiteFlashCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const flash = createOffscreenCanvas(source.width, source.height);
  const fctx = flash.getContext('2d');
  if (!fctx) return source;
  fctx.drawImage(source, 0, 0);
  fctx.globalCompositeOperation = 'source-atop';
  fctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  fctx.fillRect(0, 0, source.width, source.height);
  return flash;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img.naturalWidth > 0 ? img : null);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function bakePlayableWildSpecies(
  species: Exclude<WildSpriteSpecies, 'kuwagamon'>
): Promise<void> {
  const spec = PLAYABLE_WILD_SPECS[species];
  const basicUrl = `/assets/sprites/digimon/${spec.formId}/basic_sheet.png${spec.cacheBust}`;
  const atkUrl = `/assets/sprites/digimon/${spec.formId}/atk1_pose.png${spec.cacheBust}`;

  const [basicImg, atkImg] = await Promise.all([loadImage(basicUrl), loadImage(atkUrl)]);
  if (!basicImg) return;

  const cols = 4;
  const srcCell = Math.round(basicImg.naturalWidth / cols);
  // Row 3 in every verified 4x5 partner sheet is native Walk East (facingRight = true)
  const eastRow = 3;
  const size = spec.bakeSizePx;

  const walkFrames: HTMLCanvasElement[] = [];
  for (let col = 0; col < cols; col++) {
    const frameCanvas = createOffscreenCanvas(size, size);
    const fctx = frameCanvas.getContext('2d');
    if (fctx) {
      fctx.imageSmoothingEnabled = true;
      fctx.imageSmoothingQuality = 'high';
      fctx.drawImage(
        basicImg,
        col * srcCell,
        eastRow * srcCell,
        srcCell,
        srcCell,
        0,
        0,
        size,
        size
      );
    }
    walkFrames.push(frameCanvas);
  }

  let attackFrame: HTMLCanvasElement;
  if (atkImg) {
    const atkH = size;
    const atkW = Math.max(
      size,
      Math.round((atkImg.naturalWidth / Math.max(1, atkImg.naturalHeight)) * atkH)
    );
    attackFrame = createOffscreenCanvas(atkW, atkH);
    const actx = attackFrame.getContext('2d');
    if (actx) {
      actx.imageSmoothingEnabled = true;
      actx.imageSmoothingQuality = 'high';
      actx.drawImage(atkImg, 0, 0, atkW, atkH);
    }
  } else {
    attackFrame = walkFrames[1] ?? walkFrames[0];
  }

  bakedCache.set(species, {
    walkFrames,
    flashWalkFrame: createWhiteFlashCanvas(walkFrames[0]),
    attackFrame,
    flashAttackFrame: createWhiteFlashCanvas(attackFrame),
    worldHeightPx: spec.worldHeightPx,
    shadowRx: spec.shadowRx,
    shadowRy: spec.shadowRy,
    hoverAltitudePx: spec.hoverAltitudePx ?? 0,
    isBoss: false,
  });
}

/**
 * Strips light/white matte background ONLY from the compact downscaled Kuwagamon boss
 * frame (max 210px — ~15x fewer pixels than raw sheet) using fast border flood-fill.
 */
function stripLightBackgroundCompact(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Quick check: if corner pixel is already transparent, skip CPU scan entirely
  if (data[3] < 24) return canvas;

  const isNearWhite = (idx: number): boolean => {
    const a = data[idx + 3];
    if (a < 24) return true;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    return minC >= 205 && maxC - minC <= 32;
  };

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const enqueue = (x: number, y: number) => {
    const p = y * w + x;
    if (visited[p]) return;
    if (!isNearWhite(p * 4)) return;
    visited[p] = 1;
    queue[tail++] = p;
  };

  for (let x = 0; x < w; x++) {
    enqueue(x, 0);
    enqueue(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    enqueue(0, y);
    enqueue(w - 1, y);
  }

  while (head < tail) {
    const p = queue[head++];
    data[p * 4 + 3] = 0;
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0) enqueue(x - 1, y);
    if (x + 1 < w) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y + 1 < h) enqueue(x, y + 1);
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

async function bakeKuwagamonBoss(): Promise<void> {
  const img = await loadImage('/assets/sprites/mobs/kuwagamon.png?v=hd2');
  if (!img) return;

  const cellW = Math.floor(img.naturalWidth / 5);
  const cellH = img.naturalHeight;
  const targetH = 210;
  const targetW = Math.max(120, Math.round((cellW / Math.max(1, cellH)) * targetH));

  const sliceFrame = (col: number): HTMLCanvasElement => {
    const c = createOffscreenCanvas(targetW, targetH);
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(img, col * cellW, 0, cellW, cellH, 0, 0, targetW, targetH);
    }
    return stripLightBackgroundCompact(c);
  };

  const idle0 = sliceFrame(0);
  const idle1 = sliceFrame(1);
  const idle2 = sliceFrame(2);
  const atkFrame = sliceFrame(3);

  // Cache lightweight 96px portrait dataURL for Target HUD once
  try {
    const pCanvas = createOffscreenCanvas(96, 96);
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      const scale = Math.min(92 / targetW, 92 / targetH);
      const dw = targetW * scale;
      const dh = targetH * scale;
      pCtx.drawImage(idle0, (96 - dw) / 2, (96 - dh) / 2, dw, dh);
      kuwagamonPortraitDataUrl = pCanvas.toDataURL('image/png');
    }
  } catch {
    kuwagamonPortraitDataUrl = '/assets/sprites/mobs/kuwagamon.png?v=hd2';
  }

  bakedCache.set('kuwagamon', {
    walkFrames: [idle0, idle1, idle2, idle1],
    flashWalkFrame: createWhiteFlashCanvas(idle0),
    attackFrame: atkFrame,
    flashAttackFrame: createWhiteFlashCanvas(atkFrame),
    worldHeightPx: 218,
    shadowRx: 58,
    shadowRy: 16,
    hoverAltitudePx: 14,
    isBoss: true,
  });
}

function ensureSpeciesLoaded(species: WildSpriteSpecies): Promise<void> {
  if (bakedCache.has(species)) return Promise.resolve();
  const existing = loadingPromises.get(species);
  if (existing) return existing;

  const p = (
    species === 'kuwagamon'
      ? bakeKuwagamonBoss()
      : bakePlayableWildSpecies(species)
  ).finally(() => {
    if (!bakedCache.has(species)) {
      loadingPromises.delete(species);
    }
  });
  loadingPromises.set(species, p);
  return p;
}

/**
 * Map-scoped preloader: loads ONLY the wild Digimon species that actually inhabit the map.
 */
export function preloadWildDigimonSpritesForMap(
  mapId:
    | 'hunting-plains'
    | 'data-forest'
    | 'digi-mountain'
    | 'digital-desert'
    | 'data-sea'
    | 'digimon-island'
    | 'dark-area'
    | 'virtual-world'
): Promise<void> {
  const list =
    mapId === 'virtual-world'
      ? VIRTUAL_WORLD_WILD_SPECIES
      : mapId === 'dark-area'
        ? DARK_AREA_WILD_SPECIES
        : mapId === 'digimon-island'
          ? DIGIMON_ISLAND_WILD_SPECIES
          : mapId === 'data-sea'
            ? DATA_SEA_WILD_SPECIES
            : mapId === 'digital-desert'
              ? DIGITAL_DESERT_WILD_SPECIES
              : mapId === 'digi-mountain'
                ? DIGI_MOUNTAIN_WILD_SPECIES
                : mapId === 'data-forest'
                  ? DATA_FOREST_WILD_SPECIES
                  : HUNTING_PLAINS_WILD_SPECIES;
  return Promise.all(list.map((sp) => ensureSpeciesLoaded(sp))).then(
    () => undefined
  );
}

/**
 * Exposes the pre-baked compact offscreen canvas frame for real 3D billboard rendering
 * in Montanha Digi without duplicating textures or images.
 */
export function getWildDigimonBakedFrame(
  species: WildSpriteSpecies,
  opts: {
    isAttacking: boolean;
    isHitFlash: boolean;
    elapsed: number;
    phaseOffset: number;
  }
): {
  canvas: HTMLCanvasElement;
  worldHeightPx: number;
  hoverAltitudePx: number;
} | null {
  const baked = bakedCache.get(species);
  if (!baked) {
    void ensureSpeciesLoaded(species);
    return null;
  }
  let frameCanvas: HTMLCanvasElement;
  if (opts.isAttacking) {
    frameCanvas = opts.isHitFlash ? baked.flashAttackFrame : baked.attackFrame;
  } else if (opts.isHitFlash) {
    frameCanvas = baked.flashWalkFrame;
  } else {
    const walkIdx =
      Math.floor(Math.abs(opts.elapsed * 5.8 + opts.phaseOffset)) %
      baked.walkFrames.length;
    frameCanvas = baked.walkFrames[walkIdx] ?? baked.walkFrames[0];
  }
  return {
    canvas: frameCanvas,
    worldHeightPx: baked.worldHeightPx,
    hoverAltitudePx: baked.hoverAltitudePx,
  };
}

/**
 * Compatibility preloader for all wild species.
 */
export function preloadWildDigimonSprites(): Promise<void> {
  return Promise.all(ALL_WILD_SPECIES.map((sp) => ensureSpeciesLoaded(sp))).then(
    () => undefined
  );
}

/**
 * Returns crisp portrait URL for the Target HUD panel without expensive runtime encoding.
 */
export function getWildDigimonPortraitUrl(species: string): string | null {
  if (species === 'kuwagamon') {
    if (!bakedCache.has('kuwagamon')) {
      void ensureSpeciesLoaded('kuwagamon');
    }
    return kuwagamonPortraitDataUrl ?? '/assets/sprites/mobs/kuwagamon.png?v=hd2';
  }
  if (species in PLAYABLE_WILD_SPECS) {
    const spec = PLAYABLE_WILD_SPECS[species as Exclude<WildSpriteSpecies, 'kuwagamon'>];
    return `/assets/digimon/${species}.png${spec.cacheBust}`;
  }
  return null;
}

export interface WildDrawOptions {
  elapsed: number;
  phaseOffset: number;
  facingRight: boolean;
  isAttacking: boolean;
  attackProgress: number;
  isHitFlash: boolean;
  perspectiveScale: number;
  isTargeted: boolean;
}

export interface WildDrawResult {
  drawn: boolean;
  topOffsetPx: number;
}

let cachedBossAuraCanvas: HTMLCanvasElement | null = null;

function getCachedBossAuraCanvas(): HTMLCanvasElement {
  if (cachedBossAuraCanvas) return cachedBossAuraCanvas;
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 100;
  const bctx = c.getContext('2d');
  if (bctx) {
    const grad = bctx.createRadialGradient(80, 50, 8, 80, 50, 76);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0.38)');
    grad.addColorStop(0.6, 'rgba(249, 115, 22, 0.16)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    bctx.fillStyle = grad;
    bctx.beginPath();
    bctx.ellipse(80, 50, 76, 46, 0, 0, Math.PI * 2);
    bctx.fill();
  }
  cachedBossAuraCanvas = c;
  return c;
}

/**
 * Draws a wild Digimon centered at (0, 0) foot anchor (caller already translated to enemy.x, enemy.y).
 * Zero `ctx.shadowBlur` calls — uses lightweight pre-baked radial halos and compact frames for 60fps combat.
 */
export function drawWildDigimonSprite(
  ctx: CanvasRenderingContext2D,
  species: WildSpriteSpecies,
  opts: WildDrawOptions
): WildDrawResult {
  const baked = bakedCache.get(species);
  if (!baked) {
    void ensureSpeciesLoaded(species);
    return { drawn: false, topOffsetPx: 54 * opts.perspectiveScale };
  }

  const pScale = opts.perspectiveScale;
  const phase = opts.elapsed * 3.1 + opts.phaseOffset;
  const isFlyingWild = baked.hoverAltitudePx > 0;

  // Multi-harmonic graceful soaring for flying wild Digimons; calm grounded stride for walkers
  const wingBeatWave = Math.sin(phase * 1.15);
  const thermalWave = Math.sin(phase * 0.52) * 2.4;
  const hoverOffset = isFlyingWild
    ? (baked.hoverAltitudePx + 4 + wingBeatWave * 5.2 + thermalWave) * pScale
    : Math.abs(Math.sin(phase * 1.15)) * 0.85 * pScale;

  // Dynamic altitude-coupled shadow: softens & shrinks smoothly as flying Digimons soar higher
  const altitudeRatio = isFlyingWild
    ? Math.max(0, Math.min(1, hoverOffset / Math.max(1, 36 * pScale)))
    : 0;
  const shadowScale = isFlyingWild ? 0.92 - altitudeRatio * 0.22 : 1;
  const shadowRx = baked.shadowRx * pScale * shadowScale;
  const shadowRy = baked.shadowRy * pScale * shadowScale;

  if (opts.isTargeted) {
    ctx.save();
    ctx.strokeStyle = baked.isBoss ? '#facc15' : '#f43f5e';
    ctx.lineWidth = baked.isBoss ? 3 : 2.2;
    ctx.beginPath();
    ctx.ellipse(
      0,
      2,
      baked.shadowRx * pScale * 1.38,
      baked.shadowRy * pScale * 1.48,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
  }

  if (baked.isBoss) {
    // Lightweight crimson Raid Boss ground aura (pre-baked radial sprite, zero per-frame gradient)
    const auraPulse = 0.88 + Math.sin(opts.elapsed * 3.8) * 0.12;
    const auraCanvas = getCachedBossAuraCanvas();
    const auraRx = baked.shadowRx * pScale * 1.75 * auraPulse;
    const auraRy = baked.shadowRy * pScale * 2.1 * auraPulse;
    ctx.drawImage(
      auraCanvas,
      -auraRx,
      2 - auraRy,
      auraRx * 2,
      auraRy * 2
    );
  }

  ctx.fillStyle = isFlyingWild
    ? `rgba(0, 0, 0, ${(0.31 - altitudeRatio * 0.1).toFixed(2)})`
    : 'rgba(0, 0, 0, 0.36)';
  ctx.beginPath();
  ctx.ellipse(0, 2, shadowRx, shadowRy, 0, 0, Math.PI * 2);
  ctx.fill();

  // Select compact pre-baked frame at a smooth, legible cadence
  let frameCanvas: HTMLCanvasElement;
  if (opts.isAttacking) {
    frameCanvas = opts.isHitFlash ? baked.flashAttackFrame : baked.attackFrame;
  } else if (opts.isHitFlash) {
    frameCanvas = baked.flashWalkFrame;
  } else {
    const fps = isFlyingWild ? 4.8 : 4.6;
    const walkIdx =
      Math.floor(Math.abs(opts.elapsed * fps + opts.phaseOffset)) %
      baked.walkFrames.length;
    frameCanvas = baked.walkFrames[walkIdx] ?? baked.walkFrames[0];
  }

  const targetH = baked.worldHeightPx * pScale;
  const aspect = frameCanvas.width / Math.max(1, frameCanvas.height);
  const wingStretchX = isFlyingWild && !opts.isAttacking ? 1 + wingBeatWave * 0.015 : 1;
  const wingStretchY = isFlyingWild && !opts.isAttacking ? 1 - wingBeatWave * 0.012 : 1;
  const drawH = targetH * wingStretchY;
  const drawW = targetH * aspect * wingStretchX;

  // Subtle organic movement, aerodynamic flight banking, & attack lunge
  const lungeCurve = opts.isAttacking
    ? Math.sin(Math.min(1, opts.attackProgress) * Math.PI)
    : 0;
  const lungeX = lungeCurve * (opts.facingRight ? 13 : -13) * pScale;
  const lungeLift = lungeCurve * 6.5 * pScale;
  const flightSwayX =
    isFlyingWild && !opts.isAttacking
      ? Math.sin(phase * 0.65) * 2.2 * pScale
      : 0;
  const flightBankRad =
    isFlyingWild && !opts.isAttacking
      ? (opts.facingRight ? 0.055 : -0.055) + wingBeatWave * 0.02
      : 0;
  const feetPad = isFlyingWild ? 0 : baked.isBoss ? 4 * pScale : 7 * pScale;

  // All playable sheets (Row 3) & attack poses natively face East (facingRight = true).
  // Kuwagamon's sheet also faces right on frames 0..3; flip horizontally when facing left.
  const flipX = !opts.facingRight;

  ctx.save();
  ctx.translate(lungeX + flightSwayX, -(hoverOffset + lungeLift));
  if (flightBankRad !== 0) {
    ctx.rotate(flightBankRad);
  }
  if (flipX) {
    ctx.scale(-1, 1);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'low';
  ctx.drawImage(frameCanvas, -drawW / 2, -drawH + feetPad, drawW, drawH);
  ctx.restore();

  return {
    drawn: true,
    topOffsetPx: drawH + hoverOffset - feetPad,
  };
}
