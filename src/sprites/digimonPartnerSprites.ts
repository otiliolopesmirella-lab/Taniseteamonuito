import {
  getDigimonFormProfile,
  getEvolutionChainForStarter,
  type DigimonFormId,
  type PartnerAttackKind,
  type StarterDigimonId,
} from '../types/digimon';
import type { CardinalDirection, TamerMovementState } from './tamerRealSheets';

export const DIGIMON_SHEET_CELL = 128;
export const DIGIMON_FRAME_COUNT = 4;

type DigimonAssetKey =
  | 'basic_sheet'
  | 'atk1_pose'
  | 'atk1_fx'
  | 'atk2_pose'
  | 'atk2_fx';

const ASSET_KEYS: readonly DigimonAssetKey[] = [
  'basic_sheet',
  'atk1_pose',
  'atk1_fx',
  'atk2_pose',
  'atk2_fx',
] as const;

type CachedDigimonSource = HTMLImageElement | HTMLCanvasElement;

function getSourceSize(src: CachedDigimonSource): { width: number; height: number } {
  if ('naturalWidth' in src) {
    return { width: src.naturalWidth, height: src.naturalHeight };
  }
  return { width: src.width, height: src.height };
}

function isSourceReady(
  src: CachedDigimonSource | undefined
): src is CachedDigimonSource {
  if (!src) return false;
  if ('naturalWidth' in src) {
    return src.complete && src.naturalWidth > 0;
  }
  return src.width > 0 && src.height > 0;
}

function bakeCompactDigimonAsset(
  img: HTMLImageElement,
  key: DigimonAssetKey
): CachedDigimonSource {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (nw <= 0 || nh <= 0) return img;

  // basic_sheet uses 4 columns x 5 rows; keep crisp 1024px HD cells (256px/cell) and 512px poses/FX
  const maxWidth = key === 'basic_sheet' ? 1024 : 512;
  const maxHeight = key === 'basic_sheet' ? 1280 : 512;
  if (nw <= maxWidth && nh <= maxHeight) {
    return img;
  }

  const scale = Math.min(maxWidth / nw, maxHeight / nh);
  const targetW =
    key === 'basic_sheet'
      ? Math.max(DIGIMON_FRAME_COUNT, Math.round((nw * scale) / DIGIMON_FRAME_COUNT) * DIGIMON_FRAME_COUNT)
      : Math.max(1, Math.round(nw * scale));
  const targetH = Math.max(1, Math.round((nh / nw) * targetW));

  try {
    const offscreen = document.createElement('canvas');
    offscreen.width = targetW;
    offscreen.height = targetH;
    const octx = offscreen.getContext('2d');
    if (octx) {
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(img, 0, 0, targetW, targetH);
      // Release raw multi-megabyte decoded PNG bitmap immediately
      img.onload = null;
      img.onerror = null;
      img.src = '';
      return offscreen;
    }
  } catch {
    // Fallback to raw image if offscreen canvas creation fails
  }
  return img;
}

const MAX_CACHED_DIGIMON_FORMS = 14;
const cacheTouchOrder: DigimonFormId[] = [];

const digimonImageCache = new Map<
  DigimonFormId,
  Map<DigimonAssetKey, CachedDigimonSource>
>();
const preloadPromises = new Map<DigimonFormId, Promise<void>>();

function touchDigimonCacheForm(formId: DigimonFormId): void {
  const idx = cacheTouchOrder.indexOf(formId);
  if (idx !== -1) {
    cacheTouchOrder.splice(idx, 1);
  }
  cacheTouchOrder.push(formId);
  while (cacheTouchOrder.length > MAX_CACHED_DIGIMON_FORMS) {
    const oldest = cacheTouchOrder.shift();
    if (!oldest || oldest === formId) continue;
    const oldBucket = digimonImageCache.get(oldest);
    if (oldBucket) {
      oldBucket.forEach((asset) => {
        if (!('naturalWidth' in asset)) {
          asset.width = 0;
          asset.height = 0;
        }
      });
      oldBucket.clear();
      digimonImageCache.delete(oldest);
    }
    preloadPromises.delete(oldest);
  }
}

export function preloadDigimonPartnerAssets(
  formId: DigimonFormId
): Promise<void> {
  touchDigimonCacheForm(formId);
  const existing = preloadPromises.get(formId);
  const existingBucket = digimonImageCache.get(formId);
  if (existing && existingBucket?.has('basic_sheet')) return existing;

  const bucket =
    existingBucket ?? new Map<DigimonAssetKey, CachedDigimonSource>();
  digimonImageCache.set(formId, bucket);

  const p = Promise.all(
    ASSET_KEYS.map(
      (key) =>
        new Promise<void>((resolve) => {
          if (isSourceReady(bucket.get(key))) {
            resolve();
            return;
          }
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => {
            bucket.set(key, bakeCompactDigimonAsset(img, key));
            resolve();
          };
          img.onerror = () => resolve();
          const isTdkLine =
            formId === 'tentomon' ||
            formId === 'kabuterimon' ||
            formId === 'megakabuterimon' ||
            formId === 'herculeskabuterimon' ||
            formId === 'drimogemon' ||
            formId === 'digmon' ||
            formId === 'giromon' ||
            formId === 'hiandromon' ||
            formId === 'kiwimon' ||
            formId === 'deramon' ||
            formId === 'blossomon' ||
            formId === 'griffomon';
          const isGermLine =
            formId === 'gotsumon' ||
            formId === 'icemon' ||
            formId === 'insekimon' ||
            formId === 'metaletemon' ||
            formId === 'elecmon' ||
            formId === 'leomon' ||
            formId === 'iceleomon' ||
            formId === 'saberleomon' ||
            formId === 'renamon' ||
            formId === 'kyubimon' ||
            formId === 'taomon' ||
            formId === 'sakuyamon' ||
            formId === 'monodramon' ||
            formId === 'strikedramon' ||
            formId === 'cyberdramon' ||
            formId === 'justimon';
          const isMhLine =
            formId === 'demimeramon' ||
            formId === 'meramon' ||
            formId === 'skullmeramon' ||
            formId === 'boltmon' ||
            formId === 'hawkmon' ||
            formId === 'aquilamon' ||
            formId === 'silphymon' ||
            formId === 'gryphonmon';
          const isVkLine =
            formId === 'veemon' ||
            formId === 'veedramon' ||
            formId === 'aeroveedramon' ||
            formId === 'ulforceveedramon' ||
            formId === 'keramon' ||
            formId === 'chrysalimon' ||
            formId === 'infermon' ||
            formId === 'diaboromon';
          const isImpmonLine =
            formId === 'impmon' ||
            formId === 'icedevimon' ||
            formId === 'skullsatamon' ||
            formId === 'beelzemon';
          const isGabumonLine =
            formId === 'gabumon' ||
            formId === 'garurumon' ||
            formId === 'weregarurumon' ||
            formId === 'metalgarurumon';
          const isClassicLine =
            formId === 'agumon_classic' ||
            formId === 'greymon' ||
            formId === 'metalgreymon' ||
            formId === 'wargreymon';
          const isNewGuilmonLine =
            formId === 'guilmon' ||
            formId === 'growlmon' ||
            formId === 'megalogrowlmon' ||
            formId === 'dukemon';
          const isFxAsset = key === 'atk1_fx' || key === 'atk2_fx';
          const isNewLalamonLine =
            formId === 'lalamon' ||
            formId === 'sunflowmon' ||
            formId === 'lilamon' ||
            formId === 'rosemon';
          const isNewGaomonLine =
            formId === 'gaomon' ||
            formId === 'gaogamon' ||
            formId === 'machgaogamon' ||
            formId === 'miragegaogamon';
          const isHdUpgraded =
            formId === 'shinegreymon' ||
            formId === 'dukemon';
          const isBkLine =
            formId === 'biyomon' ||
            formId === 'birdramon' ||
            formId === 'garudamon' ||
            formId === 'phoenixmon' ||
            formId === 'kunemon' ||
            formId === 'flymon' ||
            formId === 'okuwamon' ||
            formId === 'grankuwagamon';
          const cacheBust = isBkLine && !isFxAsset
            ? '?v=bk1'
            : isBkLine
              ? '?v=bk_fx1'
            : isGermLine && !isFxAsset
              ? '?v=germ2'
              : isGermLine
                ? '?v=germ_fx2'
            : formId === 'hiandromon' && !isFxAsset
              ? '?v=tdk4'
              : formId === 'giromon' && !isFxAsset
                ? '?v=tdk4'
                : formId === 'drimogemon' && !isFxAsset
                  ? '?v=drimo3'
                  : isTdkLine && !isFxAsset
                    ? '?v=tdk4'
                  : isTdkLine
                    ? '?v=tdk_fx2'
            : (formId === 'hawkmon' || formId === 'aquilamon' || formId === 'gryphonmon') && !isFxAsset
              ? '?v=mh3'
              : isMhLine && !isFxAsset
                ? '?v=mh3'
                : isMhLine
                  ? '?v=mh_fx2'
            : formId === 'beelzemon' && key === 'basic_sheet'
              ? '?v=beelzemon2'
              : isVkLine && !isFxAsset
                ? '?v=vk3'
                : isVkLine
                  ? '?v=vk_fx1'
              : isImpmonLine && !isFxAsset
                ? '?v=impmon1'
                : isImpmonLine
                  ? '?v=impmon_fx2'
                : isGabumonLine && !isFxAsset
                  ? '?v=gabumon2'
                  : isGabumonLine
                    ? '?v=gabumon_fx1'
                  : isClassicLine && !isFxAsset
                    ? '?v=classic4'
                    : isClassicLine
                      ? '?v=classic2'
                    : formId === 'rizegreymon' && !isFxAsset
                      ? '?v=hd4'
                      : isHdUpgraded && !isFxAsset
                        ? '?v=hd4'
                        : isNewGaomonLine && !isFxAsset
                          ? '?v=gaomon4'
                          : isNewLalamonLine && !isFxAsset
                            ? '?v=lalamon2'
                            : formId === 'guilmon' && !isFxAsset
                              ? '?v=guilmon5'
                              : isNewGuilmonLine && !isFxAsset
                                ? '?v=guilmon2'
                                : isFxAsset
                                  ? '?v=fx3'
                                  : formId === 'agumon' || formId === 'geogreymon'
                                    ? '?v=savers3'
                                    : '?v=dmo6';
          img.src = `/assets/sprites/digimon/${formId}/${key}.png${cacheBust}`;
        })
    )
  ).then(() => {
    if (!bucket.has('basic_sheet')) {
      preloadPromises.delete(formId);
    }
  });

  preloadPromises.set(formId, p);
  return p;
}

export function preloadDigimonEvolutionLine(
  starterId: StarterDigimonId
): Promise<void> {
  const chain = getEvolutionChainForStarter(starterId);
  return Promise.all(chain.map((f) => preloadDigimonPartnerAssets(f.id))).then(
    () => undefined
  );
}

interface CellSpec {
  col: number;
  row: number;
  flipX?: boolean;
}

/**
 * Exact frame mapping extracted from the user's reference spritesheets:
 * Preserves original faces, eyes, horns, wings, armor, cannons & proportions.
 */
const DIRECTION_CELL_MAP: Record<
  DigimonFormId,
  Record<
    CardinalDirection,
    {
      idle: CellSpec;
      walk: readonly [CellSpec, CellSpec, CellSpec, CellSpec];
    }
  >
> = {
  agumon: {
    // 4 cols x 5 rows sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  geogreymon: {
    // 4 cols x 5 rows sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E, Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  rizegreymon: {
    // 4 cols x 5 rows sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  shinegreymon: {
    // 4 cols x 5 rows sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E, Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  agumon_classic: {
    // 4 cols x 5 rows sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle (4 frames)
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  greymon: {
    // 4 cols x 5 rows sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle (4 frames)
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  metalgreymon: {
    // 4 cols x 5 rows sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle (4 frames)
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  wargreymon: {
    // 4 cols x 5 rows sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle (4 frames)
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  gaomon: {
    // 4 cols x 5 rows HD sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  gaogamon: {
    // 4 cols x 5 rows HD sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  machgaogamon: {
    // 4 cols x 5 rows HD sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  miragegaogamon: {
    // 4 cols x 5 rows HD sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  lalamon: {
    // 4 cols x 5 rows HD sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  sunflowmon: {
    // 4 cols x 5 rows HD sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  lilamon: {
    // 4 cols x 5 rows HD sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  rosemon: {
    // 4 cols x 5 rows HD sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  guilmon: {
    // 4 cols x 5 rows sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  growlmon: {
    // 4 cols x 5 rows sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  megalogrowlmon: {
    // 4 cols x 5 rows sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  dukemon: {
    // 4 cols x 5 rows sheet: Row 0 = Walk S, Row 1 = Walk W (native), Row 2 = Walk N (native), Row 3 = Walk E (native), Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  gabumon: {
    // 4 cols x 5 rows HD sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  garurumon: {
    // 4 cols x 5 rows HD sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  weregarurumon: {
    // 4 cols x 5 rows HD sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  metalgarurumon: {
    // 4 cols x 5 rows HD sheet: Row 0 = Walk S, Row 1 = Walk W, Row 2 = Walk N, Row 3 = Walk E (native), Row 4 = Idle S
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  impmon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  icedevimon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  skullsatamon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  beelzemon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  veemon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  veedramon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  aeroveedramon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  ulforceveedramon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  keramon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  chrysalimon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  infermon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  diaboromon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  demimeramon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  meramon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  skullmeramon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  boltmon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  hawkmon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  aquilamon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  silphymon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  gryphonmon: {
    S: {
      idle: { col: 0, row: 4 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 0, row: 3 },
      walk: [
        { col: 0, row: 3 },
        { col: 1, row: 3 },
        { col: 2, row: 3 },
        { col: 3, row: 3 },
      ],
    },
    N: {
      idle: { col: 0, row: 2 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  tentomon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  kabuterimon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  megakabuterimon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  herculeskabuterimon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  drimogemon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  digmon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  giromon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  hiandromon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  kiwimon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  deramon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  blossomon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  griffomon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  gotsumon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  icemon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  insekimon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  metaletemon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  elecmon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  leomon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  iceleomon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  saberleomon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  renamon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  kyubimon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  taomon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  sakuyamon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  monodramon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  strikedramon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  cyberdramon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  justimon: {
    S: { idle: { col: 0, row: 4 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    W: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
    N: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  },
  biyomon: {
    S: { idle: { col: 0, row: 0 }, walk: [{ col: 2, row: 0 }, { col: 0, row: 0 }, { col: 3, row: 0 }, { col: 0, row: 0 }] },
    N: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    W: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
  },
  birdramon: {
    S: { idle: { col: 0, row: 0 }, walk: [{ col: 0, row: 0 }, { col: 2, row: 0 }, { col: 1, row: 0 }, { col: 3, row: 0 }] },
    N: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    W: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
  },
  garudamon: {
    S: { idle: { col: 0, row: 0 }, walk: [{ col: 2, row: 0 }, { col: 0, row: 0 }, { col: 3, row: 0 }, { col: 1, row: 0 }] },
    N: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    W: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
  },
  phoenixmon: {
    S: { idle: { col: 0, row: 0 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    N: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    W: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
  },
  kunemon: {
    S: { idle: { col: 0, row: 0 }, walk: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }] },
    N: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    W: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
  },
  flymon: {
    S: { idle: { col: 0, row: 0 }, walk: [{ col: 0, row: 0 }, { col: 2, row: 0 }, { col: 1, row: 0 }, { col: 3, row: 0 }] },
    N: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    W: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
  },
  okuwamon: {
    S: { idle: { col: 0, row: 0 }, walk: [{ col: 2, row: 0 }, { col: 1, row: 0 }, { col: 3, row: 0 }, { col: 1, row: 0 }] },
    N: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    W: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
  },
  grankuwagamon: {
    S: { idle: { col: 0, row: 0 }, walk: [{ col: 2, row: 0 }, { col: 0, row: 0 }, { col: 3, row: 0 }, { col: 1, row: 0 }] },
    N: { idle: { col: 0, row: 1 }, walk: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }] },
    W: { idle: { col: 0, row: 2 }, walk: [{ col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
    E: { idle: { col: 0, row: 3 }, walk: [{ col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }] },
  },
};

function getPartnerScale(formId: DigimonFormId): number {
  return getDigimonFormProfile(formId).worldScale;
}

export type PartnerAerialMode = 'soaring' | 'wing_hover' | 'float' | 'ground';

export interface PartnerAerialProfile {
  mode: PartnerAerialMode;
  baseAltitude: number;
  nameplateLift: number;
  isAerial: boolean;
  showsWindWisps: boolean;
}

/**
 * Single source of truth for which Digimon forms soar/fly, wing-hover, float, or walk on the ground.
 * Used by both `drawDigimonPartnerFrame` and `TamerWorldCanvas` (shadows, air ribbons, nameplates).
 */
export function getPartnerAerialProfile(formId: DigimonFormId): PartnerAerialProfile {
  switch (formId) {
    // True soaring winged flyers (continuous rhythmic wingbeats & thermal glide in idle & movement)
    case 'gryphonmon':
    case 'phoenixmon':
      return { mode: 'soaring', baseAltitude: 28, nameplateLift: 28, isAerial: true, showsWindWisps: true };
    case 'aquilamon':
    case 'birdramon':
    case 'flymon':
      return { mode: 'soaring', baseAltitude: 24, nameplateLift: 24, isAerial: true, showsWindWisps: true };
    case 'kabuterimon':
    case 'herculeskabuterimon':
      return { mode: 'soaring', baseAltitude: 20, nameplateLift: 20, isAerial: true, showsWindWisps: true };

    // Winged aerial fighters (calm hover stance in idle so col 0 doesn't snap into midair jogging, smooth aerial glide when moving)
    case 'grankuwagamon':
      return { mode: 'wing_hover', baseAltitude: 24, nameplateLift: 24, isAerial: true, showsWindWisps: true };
    case 'garudamon':
    case 'okuwamon':
      return { mode: 'wing_hover', baseAltitude: 22, nameplateLift: 22, isAerial: true, showsWindWisps: true };

    // Pure levitating / hovering Digimons (silky continuous hover with zero ground dust)
    case 'giromon':
      return { mode: 'float', baseAltitude: 20, nameplateLift: 18, isAerial: true, showsWindWisps: false };
    case 'rosemon':
      return { mode: 'float', baseAltitude: 18, nameplateLift: 16, isAerial: true, showsWindWisps: false };
    case 'lilamon':
      return { mode: 'float', baseAltitude: 16, nameplateLift: 14, isAerial: true, showsWindWisps: false };
    case 'sunflowmon':
    case 'chrysalimon':
      return { mode: 'float', baseAltitude: 14, nameplateLift: 12, isAerial: true, showsWindWisps: false };
    case 'lalamon':
    case 'demimeramon':
      return { mode: 'float', baseAltitude: 12, nameplateLift: 10, isAerial: true, showsWindWisps: false };

    default:
      return { mode: 'ground', baseAltitude: 0, nameplateLift: 0, isAerial: false, showsWindWisps: false };
  }
}

/**
 * Computes the live vertical elevation (positive px above ground) for any Digimon form
 * so ground shadows scale and soften harmoniously in real time with wingbeats & gliding.
 */
export function getPartnerLiveHoverAltitude(
  formId: DigimonFormId,
  state: TamerMovementState,
  elapsedSec: number
): number {
  const aerial = getPartnerAerialProfile(formId);
  if (!aerial.isAerial) return 0;

  if (aerial.mode === 'soaring') {
    if (state === 'idle') {
      const wingWave = Math.sin(elapsedSec * 3.8);
      const thermalWave = Math.sin(elapsedSec * 1.45) * 2.4;
      return Math.max(8, aerial.baseAltitude + wingWave * 4.6 + thermalWave);
    }
    const soarWave = Math.sin(elapsedSec * 5.0);
    const thermalGlide = Math.sin(elapsedSec * 1.8) * 2.2;
    return Math.max(10, aerial.baseAltitude + 6 + soarWave * 4.2 + thermalGlide);
  }

  if (aerial.mode === 'wing_hover') {
    if (state === 'idle') {
      const hoverWave = Math.sin(elapsedSec * 2.9);
      const thermalWave = Math.sin(elapsedSec * 1.35) * 2.0;
      return Math.max(8, aerial.baseAltitude + hoverWave * 4.0 + thermalWave);
    }
    const glideWave = Math.sin(elapsedSec * 4.4);
    return Math.max(10, aerial.baseAltitude + 5 + glideWave * 3.8);
  }

  // 'float' mode (Giromon, Lalamon line, Chrysalimon, DemiMeramon)
  if (state === 'idle') {
    const floatWave = Math.sin(elapsedSec * 2.75);
    const driftWave = Math.sin(elapsedSec * 1.25) * 1.6;
    return Math.max(6, aerial.baseAltitude + floatWave * 3.6 + driftWave);
  }
  const glideWave = Math.sin(elapsedSec * 4.1);
  return Math.max(8, aerial.baseAltitude + 3.5 + glideWave * 3.0);
}

/**
 * Draws the companion partner Digimon using its untouched reference spritesheet
 * in Idle or 4-Direction Walk / Flight states.
 */
export function drawDigimonPartnerFrame(
  ctx: CanvasRenderingContext2D,
  formId: DigimonFormId,
  state: TamerMovementState,
  direction: CardinalDirection,
  frameIndex: number,
  elapsedSec: number,
  footX: number,
  footY: number
): boolean {
  const img = digimonImageCache.get(formId)?.get('basic_sheet');
  if (!img) {
    void preloadDigimonPartnerAssets(formId);
    return false;
  }
  if (!isSourceReady(img)) {
    return false;
  }
  touchDigimonCacheForm(formId);

  const dirEntry = DIRECTION_CELL_MAP[formId][direction];
  const aerial = getPartnerAerialProfile(formId);
  const safeWalkIdx =
    ((frameIndex % DIGIMON_FRAME_COUNT) + DIGIMON_FRAME_COUNT) %
    DIGIMON_FRAME_COUNT;

  // True soaring flyers beat their wings gracefully in idle; wing_hover & grounded hold calm stance in idle.
  const hoverWingIdx =
    Math.floor(elapsedSec * 4.6) % DIGIMON_FRAME_COUNT;
  const cell =
    state === 'idle'
      ? aerial.mode === 'soaring'
        ? (dirEntry.walk[hoverWingIdx] ?? dirEntry.idle)
        : dirEntry.idle
      : (dirEntry.walk[safeWalkIdx] ?? dirEntry.idle);

  const baseScale = getPartnerScale(formId);
  const isMegaForm =
    formId === 'shinegreymon' ||
    formId === 'wargreymon' ||
    formId === 'metalgarurumon' ||
    formId === 'miragegaogamon' ||
    formId === 'rosemon' ||
    formId === 'dukemon' ||
    formId === 'beelzemon' ||
    formId === 'ulforceveedramon' ||
    formId === 'diaboromon' ||
    formId === 'boltmon' ||
    formId === 'gryphonmon' ||
    formId === 'herculeskabuterimon' ||
    formId === 'hiandromon' ||
    formId === 'griffomon' ||
    formId === 'metaletemon' ||
    formId === 'saberleomon' ||
    formId === 'sakuyamon' ||
    formId === 'justimon' ||
    formId === 'phoenixmon' ||
    formId === 'grankuwagamon';
  const isRookieForm =
    formId === 'agumon' ||
    formId === 'agumon_classic' ||
    formId === 'gabumon' ||
    formId === 'gaomon' ||
    formId === 'lalamon' ||
    formId === 'guilmon' ||
    formId === 'impmon' ||
    formId === 'veemon' ||
    formId === 'keramon' ||
    formId === 'demimeramon' ||
    formId === 'hawkmon' ||
    formId === 'tentomon' ||
    formId === 'drimogemon' ||
    formId === 'kiwimon' ||
    formId === 'gotsumon' ||
    formId === 'elecmon' ||
    formId === 'renamon' ||
    formId === 'monodramon' ||
    formId === 'biyomon' ||
    formId === 'kunemon';

  // Lifelike cubic-eased inhale/exhale breathing cycle when standing still (planted at the soles of the feet)
  const breathSpeed = isRookieForm ? 2.55 : isMegaForm ? 1.95 : 2.25;
  const rawBreath = (Math.sin(elapsedSec * breathSpeed) + 1) * 0.5;
  const smoothBreath = rawBreath * rawBreath * (3 - 2 * rawBreath);
  const breathSigned = smoothBreath * 2 - 1; // -1 (relaxed exhale) .. +1 (full inhale)

  let scaleX = baseScale;
  let scaleY = baseScale;
  let offsetX = 0;
  let offsetY = 0;
  let tiltAngle = 0;

  if (aerial.mode === 'soaring') {
    const liveAlt = getPartnerLiveHoverAltitude(formId, state, elapsedSec);
    offsetY = -liveAlt;
    if (state === 'idle') {
      const wingBeat = Math.sin(elapsedSec * 3.8);
      scaleX = baseScale * (1 + wingBeat * 0.014);
      scaleY = baseScale * (1 - wingBeat * 0.011);
      // Graceful slow figure-8 thermal drift while hovering in place
      offsetX = Math.sin(elapsedSec * 1.6) * 2.4;
      tiltAngle = Math.sin(elapsedSec * 1.6) * 0.024;
    } else {
      const soarBeat = Math.sin(elapsedSec * 5.0);
      scaleX = baseScale * (1 + soarBeat * 0.016);
      scaleY = baseScale * (1 - soarBeat * 0.012);
      // Aerodynamic banking & forward swoop lean
      tiltAngle =
        direction === 'W'
          ? -0.088 - soarBeat * 0.022
          : direction === 'E'
            ? 0.088 + soarBeat * 0.022
            : Math.sin(elapsedSec * 3.6) * 0.024;
    }
  } else if (aerial.mode === 'wing_hover') {
    const liveAlt = getPartnerLiveHoverAltitude(formId, state, elapsedSec);
    offsetY = -liveAlt;
    if (state === 'idle') {
      const hoverWave = Math.sin(elapsedSec * 2.9);
      scaleX = baseScale * (1 - hoverWave * 0.01);
      scaleY = baseScale * (1 + hoverWave * 0.014);
      offsetX = Math.sin(elapsedSec * 1.4) * 1.8;
      tiltAngle = Math.sin(elapsedSec * 1.4) * 0.02;
    } else {
      const glideWave = Math.sin(elapsedSec * 4.4);
      scaleX = baseScale * (1 + glideWave * 0.013);
      scaleY = baseScale * (1 - glideWave * 0.01);
      tiltAngle =
        direction === 'W'
          ? -0.072 - glideWave * 0.018
          : direction === 'E'
            ? 0.072 + glideWave * 0.018
            : Math.sin(elapsedSec * 3.2) * 0.02;
    }
  } else if (aerial.mode === 'float') {
    const liveAlt = getPartnerLiveHoverAltitude(formId, state, elapsedSec);
    offsetY = -liveAlt;
    if (state === 'idle') {
      const floatWave = Math.sin(elapsedSec * 2.75);
      scaleX = baseScale * (1 - floatWave * 0.011);
      scaleY = baseScale * (1 + floatWave * 0.015);
      offsetX = Math.sin(elapsedSec * 1.45) * 1.6;
      tiltAngle = Math.sin(elapsedSec * 1.45) * 0.026;
    } else {
      const glideWave = Math.sin(elapsedSec * 4.1);
      scaleX = baseScale * (1 + glideWave * 0.011);
      scaleY = baseScale * (1 - glideWave * 0.011);
      tiltAngle =
        direction === 'W'
          ? -0.078
          : direction === 'E'
            ? 0.078
            : Math.sin(elapsedSec * 3.2) * 0.022;
    }
  } else {
    // Grounded Digimons: crisp, natural walk synced directly to the 4-frame stride cycle
    // (zero out-of-phase drunken wobble or penguin rocking on N/S!)
    if (state === 'idle') {
      scaleX = baseScale * (1 - breathSigned * 0.013);
      scaleY = baseScale * (1 + breathSigned * 0.026);
    } else {
      // Frame 0 & 2 = foot contact/passing, Frame 1 & 3 = full stride extension (gentle 1.8px lift)
      const isLiftStep = safeWalkIdx === 1 || safeWalkIdx === 3;
      const stepBouncePx = isRookieForm ? 2.0 : isMegaForm ? 1.2 : 1.6;
      offsetY = isLiftStep ? -stepBouncePx : 0;
      scaleX = baseScale * (isLiftStep ? 0.992 : 1.012);
      scaleY = baseScale * (isLiftStep ? 1.012 : 0.99);
      // Subtle forward momentum lean ONLY when running East/West; keep N/S upright & clean
      tiltAngle =
        direction === 'W'
          ? -0.018
          : direction === 'E'
            ? 0.018
            : 0;
    }
  }

  const { width: imgWidth } = getSourceSize(img);
  const srcCell = Math.max(
    DIGIMON_SHEET_CELL,
    Math.round(imgWidth / DIGIMON_FRAME_COUNT)
  );
  const sx = cell.col * srcCell;
  const sy = cell.row * srcCell;
  const dw = DIGIMON_SHEET_CELL * scaleX;
  const dh = DIGIMON_SHEET_CELL * scaleY;
  // Offset cell bottom padding so grounded soles rest inside the ground shadow
  const feetPad = aerial.isAerial ? 0 : 9.0 * scaleY;

  ctx.save();
  ctx.translate(footX + offsetX, footY + offsetY);
  if (tiltAngle !== 0) {
    ctx.rotate(tiltAngle);
  }
  if (cell.flipX) {
    ctx.scale(-1, 1);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    img,
    sx,
    sy,
    srcCell,
    srcCell,
    -dw / 2,
    -dh + feetPad,
    dw,
    dh
  );
  ctx.restore();

  return true;
}

/**
 * Draws the exact Combat Attack Pose sprite (Special 1 / Special 2 / Basic lunge)
 * with dynamic afterimage trails and elemental charge halo.
 */
export function drawDigimonAttackPoseFrame(
  ctx: CanvasRenderingContext2D,
  formId: DigimonFormId,
  attackKind: PartnerAttackKind,
  facingRight: boolean,
  progress: number,
  footX: number,
  footY: number
): boolean {
  const bucket = digimonImageCache.get(formId);
  const poseKey: DigimonAssetKey =
    attackKind === 'special2' ? 'atk2_pose' : 'atk1_pose';
  const poseImg = bucket?.get(poseKey);

  if (!isSourceReady(poseImg)) {
    return drawDigimonPartnerFrame(
      ctx,
      formId,
      'idle',
      facingRight ? 'E' : 'W',
      0,
      progress,
      footX,
      footY
    );
  }
  touchDigimonCacheForm(formId);

  const baseLungeDist =
    formId === 'miragegaogamon' ||
    formId === 'dukemon' ||
    formId === 'shinegreymon' ||
    formId === 'wargreymon' ||
    formId === 'metalgarurumon' ||
    formId === 'rosemon' ||
    formId === 'beelzemon' ||
    formId === 'ulforceveedramon' ||
    formId === 'diaboromon' ||
    formId === 'boltmon' ||
    formId === 'gryphonmon' ||
    formId === 'herculeskabuterimon' ||
    formId === 'hiandromon' ||
    formId === 'griffomon' ||
    formId === 'metaletemon' ||
    formId === 'saberleomon' ||
    formId === 'sakuyamon' ||
    formId === 'justimon' ||
    formId === 'phoenixmon' ||
    formId === 'grankuwagamon'
      ? 22
      : formId === 'machgaogamon' ||
          formId === 'lilamon' ||
          formId === 'megalogrowlmon' ||
          formId === 'rizegreymon' ||
          formId === 'metalgreymon' ||
          formId === 'weregarurumon' ||
          formId === 'skullsatamon' ||
          formId === 'aeroveedramon' ||
          formId === 'infermon' ||
          formId === 'skullmeramon' ||
          formId === 'silphymon' ||
          formId === 'megakabuterimon' ||
          formId === 'giromon' ||
          formId === 'blossomon' ||
          formId === 'insekimon' ||
          formId === 'iceleomon' ||
          formId === 'taomon' ||
          formId === 'cyberdramon' ||
          formId === 'garudamon' ||
          formId === 'okuwamon'
        ? 19
        : formId === 'gaogamon' ||
            formId === 'sunflowmon' ||
            formId === 'growlmon' ||
            formId === 'geogreymon' ||
            formId === 'greymon' ||
            formId === 'garurumon' ||
            formId === 'icedevimon' ||
            formId === 'veedramon' ||
            formId === 'chrysalimon' ||
            formId === 'meramon' ||
            formId === 'aquilamon' ||
            formId === 'kabuterimon' ||
            formId === 'digmon' ||
            formId === 'deramon' ||
            formId === 'icemon' ||
            formId === 'leomon' ||
            formId === 'kyubimon' ||
            formId === 'strikedramon' ||
            formId === 'birdramon' ||
            formId === 'flymon'
          ? 17
          : 15;
  const lungeDist = attackKind === 'basic' ? baseLungeDist * 1.45 : baseLungeDist * 1.12;
  const strikeCurve =
    attackKind === 'basic'
      ? Math.sin(Math.pow(Math.min(1, progress), 0.72) * Math.PI)
      : Math.sin(Math.min(1, progress) * Math.PI);
  const lungeOffset = strikeCurve * (facingRight ? lungeDist : -lungeDist);

  const formProfile = getDigimonFormProfile(formId);
  const targetH = formProfile.worldDimensions.attackPoseHeight;
  const poseSize = getSourceSize(poseImg);
  const ratio = poseSize.width / Math.max(1, poseSize.height);
  const strikeScale = 1 + strikeCurve * 0.075;
  const dh = targetH * strikeScale;
  const dw = dh * ratio;
  const atkPulse = Math.sin(Math.min(1, progress) * Math.PI);
  const hoverBaseLift = getPartnerAerialProfile(formId).baseAltitude;
  const liftY =
    hoverBaseLift +
    atkPulse *
    (formId === 'dukemon' ||
    formId === 'shinegreymon' ||
    formId === 'wargreymon' ||
    formId === 'metalgarurumon' ||
    formId === 'miragegaogamon' ||
    formId === 'rosemon' ||
    formId === 'beelzemon' ||
    formId === 'ulforceveedramon' ||
    formId === 'diaboromon' ||
    formId === 'boltmon' ||
    formId === 'gryphonmon' ||
    formId === 'herculeskabuterimon' ||
    formId === 'hiandromon' ||
    formId === 'griffomon' ||
    formId === 'metaletemon' ||
    formId === 'saberleomon' ||
    formId === 'sakuyamon' ||
    formId === 'justimon' ||
    formId === 'phoenixmon' ||
    formId === 'grankuwagamon'
      ? attackKind === 'basic'
        ? 9.0
        : 11.5
      : attackKind === 'basic'
        ? 6.5
        : 8.8);
  const leanAngle =
    strikeCurve *
    (attackKind === 'basic'
      ? 0.12
      : attackKind === 'special2'
        ? 0.09
        : 0.065);

  const glowColor =
    attackKind === 'special2' && (formId === 'beelzemon' || formId === 'diaboromon' || formId === 'grankuwagamon')
      ? 'rgba(239, 68, 68, 0.96)'
      : attackKind === 'special2' &&
          (formId === 'metalgarurumon' || formId === 'hiandromon' || formId === 'justimon')
        ? 'rgba(34, 211, 238, 0.96)'
        : attackKind === 'special2' &&
            (formId === 'boltmon' || formId === 'gryphonmon')
          ? 'rgba(52, 211, 153, 0.95)'
          : attackKind === 'special2' &&
              (formId === 'dukemon' ||
                formId === 'shinegreymon' ||
                formId === 'wargreymon' ||
                formId === 'miragegaogamon' ||
                formId === 'ulforceveedramon' ||
                formId === 'herculeskabuterimon' ||
                formId === 'griffomon' ||
                formId === 'metaletemon' ||
                formId === 'saberleomon' ||
                formId === 'sakuyamon' ||
                formId === 'phoenixmon')
            ? 'rgba(250, 204, 21, 0.94)'
            : formProfile.theme.glowRgba;

  // Dynamic glowing motion afterimage trail behind the attacking Digimon
  if (strikeCurve > 0.16) {
    const ghostOffset = lungeOffset * 0.35;
    ctx.save();
    ctx.globalAlpha = strikeCurve * 0.34;
    ctx.translate(footX + ghostOffset, footY - liftY * 0.55);
    if (!facingRight) ctx.scale(-1, 1);
    ctx.rotate(leanAngle * 0.55);
    ctx.drawImage(poseImg, -dw / 2, -dh + 3, dw, dh);
    ctx.restore();
  }

  // Radiant charge aura behind the attacker at peak strike
  if (atkPulse > 0.12) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = atkPulse * (attackKind === 'basic' ? 0.32 : 0.48);
    const auraR = Math.max(24, dw * 0.52);
    const auraGrad = ctx.createRadialGradient(
      footX + lungeOffset,
      footY - dh * 0.48 - liftY,
      2,
      footX + lungeOffset,
      footY - dh * 0.48 - liftY,
      auraR
    );
    auraGrad.addColorStop(0, '#ffffff');
    auraGrad.addColorStop(0.35, glowColor);
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(footX + lungeOffset, footY - dh * 0.48 - liftY, auraR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(footX + lungeOffset, footY - liftY);
  if (!facingRight) {
    ctx.scale(-1, 1);
  }
  ctx.rotate(leanAngle);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(poseImg, -dw / 2, -dh + 6, dw, dh);
  ctx.restore();

  return true;
}

type SkillVfxArchetype =
  | 'projectile'
  | 'beam'
  | 'slash'
  | 'hammer'
  | 'tornado'
  | 'eruption'
  | 'burst';

type SkillParticleMotif =
  | 'embers'
  | 'lightning'
  | 'sparks'
  | 'stars'
  | 'leaves'
  | 'petals'
  | 'hearts';

interface SkillVfxSpec {
  archetype: SkillVfxArchetype;
  primaryHex: string;
  secondaryHex: string;
  glowRgba: string;
  motif: SkillParticleMotif;
  baseSize: number;
  particleCount: number;
}

const SKILL_VFX_SPECS: Record<
  DigimonFormId,
  { special1: SkillVfxSpec; special2: SkillVfxSpec }
> = {
  agumon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#fb923c',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(251, 146, 60, 0.78)',
      motif: 'embers',
      baseSize: 94,
      particleCount: 10,
    },
    special2: {
      archetype: 'projectile',
      primaryHex: '#f97316',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(249, 115, 22, 0.84)',
      motif: 'embers',
      baseSize: 64,
      particleCount: 12,
    },
  },
  geogreymon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#ef4444',
      secondaryHex: '#fdba74',
      glowRgba: 'rgba(239, 68, 68, 0.85)',
      motif: 'embers',
      baseSize: 112,
      particleCount: 12,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#f97316',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(249, 115, 22, 0.9)',
      motif: 'embers',
      baseSize: 124,
      particleCount: 16,
    },
  },
  rizegreymon: {
    special1: {
      archetype: 'beam',
      primaryHex: '#f97316',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(251, 146, 60, 0.9)',
      motif: 'sparks',
      baseSize: 66,
      particleCount: 14,
    },
    special2: {
      archetype: 'hammer',
      primaryHex: '#ef4444',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(250, 204, 21, 0.92)',
      motif: 'lightning',
      baseSize: 126,
      particleCount: 14,
    },
  },
  shinegreymon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#facc15',
      secondaryHex: '#fef9c3',
      glowRgba: 'rgba(253, 224, 71, 0.95)',
      motif: 'stars',
      baseSize: 78,
      particleCount: 16,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#fbbf24',
      secondaryHex: '#ef4444',
      glowRgba: 'rgba(251, 191, 36, 0.95)',
      motif: 'embers',
      baseSize: 144,
      particleCount: 18,
    },
  },
  agumon_classic: {
    // DMO F1: Sharp Claws (slash), F2: Baby Flame (blazing fireball projectile)
    special1: {
      archetype: 'slash',
      primaryHex: '#f59e0b',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(245, 158, 11, 0.84)',
      motif: 'embers',
      baseSize: 96,
      particleCount: 12,
    },
    special2: {
      archetype: 'projectile',
      primaryHex: '#f97316',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(249, 115, 22, 0.88)',
      motif: 'embers',
      baseSize: 68,
      particleCount: 14,
    },
  },
  greymon: {
    // DMO F1: Great Horn Attack (blazing horn/claw strike), F2: Mega Flame (colossal comet fireball)
    special1: {
      archetype: 'slash',
      primaryHex: '#f97316',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(249, 115, 22, 0.9)',
      motif: 'embers',
      baseSize: 118,
      particleCount: 14,
    },
    special2: {
      archetype: 'projectile',
      primaryHex: '#ea580c',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(234, 88, 12, 0.94)',
      motif: 'embers',
      baseSize: 92,
      particleCount: 18,
    },
  },
  metalgreymon: {
    // DMO F1: Trident Arm (metallic fiery claw slash), F2: Giga Destroyer (fiery missile beam blast)
    special1: {
      archetype: 'slash',
      primaryHex: '#fb923c',
      secondaryHex: '#e2e8f0',
      glowRgba: 'rgba(251, 146, 60, 0.92)',
      motif: 'sparks',
      baseSize: 132,
      particleCount: 16,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#f97316',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(249, 115, 22, 0.95)',
      motif: 'embers',
      baseSize: 96,
      particleCount: 20,
    },
  },
  wargreymon: {
    // DMO F1: Great Tornado (golden-orange flame tornado), F2: Gaia Force (colossal solar sphere!)
    special1: {
      archetype: 'tornado',
      primaryHex: '#f97316',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(251, 146, 60, 0.96)',
      motif: 'embers',
      baseSize: 138,
      particleCount: 20,
    },
    special2: {
      archetype: 'projectile',
      primaryHex: '#facc15',
      secondaryHex: '#fef9c3',
      glowRgba: 'rgba(250, 204, 21, 0.98)',
      motif: 'embers',
      baseSize: 124,
      particleCount: 24,
    },
  },
  gaomon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#38bdf8',
      secondaryHex: '#ef4444',
      glowRgba: 'rgba(56, 189, 248, 0.85)',
      motif: 'sparks',
      baseSize: 64,
      particleCount: 10,
    },
    special2: {
      archetype: 'projectile',
      primaryHex: '#0ea5e9',
      secondaryHex: '#bae6fd',
      glowRgba: 'rgba(14, 165, 233, 0.88)',
      motif: 'sparks',
      baseSize: 76,
      particleCount: 14,
    },
  },
  gaogamon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#38bdf8',
      secondaryHex: '#e0f2fe',
      glowRgba: 'rgba(56, 189, 248, 0.9)',
      motif: 'sparks',
      baseSize: 112,
      particleCount: 12,
    },
    special2: {
      archetype: 'tornado',
      primaryHex: '#22d3ee',
      secondaryHex: '#e0f2fe',
      glowRgba: 'rgba(34, 211, 238, 0.92)',
      motif: 'sparks',
      baseSize: 118,
      particleCount: 16,
    },
  },
  machgaogamon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#facc15',
      secondaryHex: '#38bdf8',
      glowRgba: 'rgba(56, 189, 248, 0.92)',
      motif: 'sparks',
      baseSize: 82,
      particleCount: 14,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#22d3ee',
      secondaryHex: '#f0f9ff',
      glowRgba: 'rgba(34, 211, 238, 0.94)',
      motif: 'sparks',
      baseSize: 96,
      particleCount: 16,
    },
  },
  miragegaogamon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#60a5fa',
      secondaryHex: '#e0f2fe',
      glowRgba: 'rgba(96, 165, 250, 0.95)',
      motif: 'stars',
      baseSize: 132,
      particleCount: 16,
    },
    special2: {
      archetype: 'projectile',
      primaryHex: '#38bdf8',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(56, 189, 248, 0.96)',
      motif: 'stars',
      baseSize: 96,
      particleCount: 18,
    },
  },
  lalamon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#4ade80',
      secondaryHex: '#bef264',
      glowRgba: 'rgba(74, 222, 128, 0.85)',
      motif: 'leaves',
      baseSize: 70,
      particleCount: 12,
    },
    special2: {
      archetype: 'eruption',
      primaryHex: '#22c55e',
      secondaryHex: '#86efac',
      glowRgba: 'rgba(34, 197, 94, 0.88)',
      motif: 'leaves',
      baseSize: 102,
      particleCount: 14,
    },
  },
  sunflowmon: {
    special1: {
      archetype: 'beam',
      primaryHex: '#facc15',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(250, 204, 21, 0.9)',
      motif: 'stars',
      baseSize: 82,
      particleCount: 14,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#22c55e',
      secondaryHex: '#bef264',
      glowRgba: 'rgba(74, 222, 128, 0.9)',
      motif: 'leaves',
      baseSize: 112,
      particleCount: 14,
    },
  },
  lilamon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#e879f9',
      secondaryHex: '#fbcfe8',
      glowRgba: 'rgba(232, 121, 249, 0.92)',
      motif: 'petals',
      baseSize: 84,
      particleCount: 16,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#f472b6',
      secondaryHex: '#fdf2f8',
      glowRgba: 'rgba(244, 114, 182, 0.95)',
      motif: 'petals',
      baseSize: 132,
      particleCount: 18,
    },
  },
  rosemon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#f43f5e',
      secondaryHex: '#fecdd3',
      glowRgba: 'rgba(244, 63, 94, 0.94)',
      motif: 'lightning',
      baseSize: 128,
      particleCount: 16,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#ec4899',
      secondaryHex: '#fb7185',
      glowRgba: 'rgba(236, 72, 153, 0.96)',
      motif: 'hearts',
      baseSize: 138,
      particleCount: 18,
    },
  },
  guilmon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#ef4444',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(239, 68, 68, 0.9)',
      motif: 'embers',
      baseSize: 66,
      particleCount: 14,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#dc2626',
      secondaryHex: '#fdba74',
      glowRgba: 'rgba(220, 38, 38, 0.92)',
      motif: 'embers',
      baseSize: 110,
      particleCount: 14,
    },
  },
  growlmon: {
    special1: {
      archetype: 'beam',
      primaryHex: '#ef4444',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(239, 68, 68, 0.92)',
      motif: 'embers',
      baseSize: 72,
      particleCount: 16,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#ec4899',
      secondaryHex: '#fda4af',
      glowRgba: 'rgba(236, 72, 153, 0.94)',
      motif: 'sparks',
      baseSize: 126,
      particleCount: 16,
    },
  },
  megalogrowlmon: {
    special1: {
      archetype: 'beam',
      primaryHex: '#ef4444',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(244, 63, 94, 0.95)',
      motif: 'sparks',
      baseSize: 88,
      particleCount: 18,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#f43f5e',
      secondaryHex: '#e2e8f0',
      glowRgba: 'rgba(244, 63, 94, 0.96)',
      motif: 'lightning',
      baseSize: 138,
      particleCount: 18,
    },
  },
  dukemon: {
    special1: {
      archetype: 'beam',
      primaryHex: '#facc15',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(250, 204, 21, 0.96)',
      motif: 'stars',
      baseSize: 94,
      particleCount: 18,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#dc2626',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(253, 224, 71, 0.98)',
      motif: 'stars',
      baseSize: 120,
      particleCount: 22,
    },
  },
  gabumon: {
    // DMO F1: Little Horn (frost horn/claw slash), F2: Blue Blaster (icy blue fire projectile)
    special1: {
      archetype: 'slash',
      primaryHex: '#38bdf8',
      secondaryHex: '#e0f2fe',
      glowRgba: 'rgba(56, 189, 248, 0.86)',
      motif: 'sparks',
      baseSize: 96,
      particleCount: 12,
    },
    special2: {
      archetype: 'projectile',
      primaryHex: '#0ea5e9',
      secondaryHex: '#bae6fd',
      glowRgba: 'rgba(14, 165, 233, 0.9)',
      motif: 'embers',
      baseSize: 68,
      particleCount: 14,
    },
  },
  garurumon: {
    // DMO F1: Freeze Fang (glacial fang slash), F2: Fox Fire (intense blue flame projectile)
    special1: {
      archetype: 'slash',
      primaryHex: '#38bdf8',
      secondaryHex: '#f0f9ff',
      glowRgba: 'rgba(56, 189, 248, 0.92)',
      motif: 'stars',
      baseSize: 118,
      particleCount: 14,
    },
    special2: {
      archetype: 'projectile',
      primaryHex: '#0284c7',
      secondaryHex: '#7dd3fc',
      glowRgba: 'rgba(2, 132, 199, 0.94)',
      motif: 'embers',
      baseSize: 90,
      particleCount: 18,
    },
  },
  weregarurumon: {
    // DMO F1: Wolf Claw (icy martial claw slash), F2: Kaiser Nail (twin arctic-violet crescent slash)
    special1: {
      archetype: 'slash',
      primaryHex: '#60a5fa',
      secondaryHex: '#e0f2fe',
      glowRgba: 'rgba(96, 165, 250, 0.92)',
      motif: 'sparks',
      baseSize: 130,
      particleCount: 16,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#38bdf8',
      secondaryHex: '#c4b5fd',
      glowRgba: 'rgba(56, 189, 248, 0.95)',
      motif: 'lightning',
      baseSize: 140,
      particleCount: 18,
    },
  },
  metalgarurumon: {
    // DMO F1: Grace Cross Freezer (freezing missile projectile), F2: Cocytus Breath (absolute-zero ice beam)
    special1: {
      archetype: 'projectile',
      primaryHex: '#38bdf8',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(56, 189, 248, 0.96)',
      motif: 'stars',
      baseSize: 98,
      particleCount: 20,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#22d3ee',
      secondaryHex: '#f0f9ff',
      glowRgba: 'rgba(34, 211, 238, 0.98)',
      motif: 'stars',
      baseSize: 118,
      particleCount: 24,
    },
  },
  impmon: {
    // DMO F1: Night of Fire (dark violet/crimson fireball projectile), F2: Summon (elemental flame/frost burst)
    special1: {
      archetype: 'projectile',
      primaryHex: '#a855f7',
      secondaryHex: '#f87171',
      glowRgba: 'rgba(168, 85, 247, 0.92)',
      motif: 'embers',
      baseSize: 72,
      particleCount: 14,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#9333ea',
      secondaryHex: '#38bdf8',
      glowRgba: 'rgba(147, 51, 234, 0.94)',
      motif: 'sparks',
      baseSize: 94,
      particleCount: 18,
    },
  },
  icedevimon: {
    // DMO F1: Zero Freeze (glacial demonic claw slash), F2: Frozen Claw (freezing dark-ice burst)
    special1: {
      archetype: 'slash',
      primaryHex: '#818cf8',
      secondaryHex: '#38bdf8',
      glowRgba: 'rgba(129, 140, 248, 0.92)',
      motif: 'stars',
      baseSize: 114,
      particleCount: 16,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#6366f1',
      secondaryHex: '#e0f2fe',
      glowRgba: 'rgba(99, 102, 241, 0.95)',
      motif: 'sparks',
      baseSize: 118,
      particleCount: 18,
    },
  },
  skullsatamon: {
    // DMO F1: Nail Bone (cursed crimson-gold data-corrupting beam), F2: Skull Hammer (demonic bone-staff impact)
    special1: {
      archetype: 'beam',
      primaryHex: '#ef4444',
      secondaryHex: '#facc15',
      glowRgba: 'rgba(239, 68, 68, 0.95)',
      motif: 'lightning',
      baseSize: 108,
      particleCount: 18,
    },
    special2: {
      archetype: 'hammer',
      primaryHex: '#dc2626',
      secondaryHex: '#c084fc',
      glowRgba: 'rgba(220, 38, 38, 0.96)',
      motif: 'lightning',
      baseSize: 132,
      particleCount: 20,
    },
  },
  beelzemon: {
    // DMO F1: Darkness Claw (razor crimson-violet Demon Lord slash), F2: Double Impact (twin Berenjena crimson-violet blast)
    special1: {
      archetype: 'slash',
      primaryHex: '#a855f7',
      secondaryHex: '#ef4444',
      glowRgba: 'rgba(168, 85, 247, 0.96)',
      motif: 'sparks',
      baseSize: 146,
      particleCount: 22,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#ef4444',
      secondaryHex: '#d8b4fe',
      glowRgba: 'rgba(239, 68, 68, 0.98)',
      motif: 'lightning',
      baseSize: 126,
      particleCount: 24,
    },
  },
  veemon: {
    // DMO F1: Vee Headbutt (high-speed azure impact comet), F2: Vee Punch (electric azure-gold power fist slash)
    special1: {
      archetype: 'projectile',
      primaryHex: '#38bdf8',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(56, 189, 248, 0.9)',
      motif: 'sparks',
      baseSize: 68,
      particleCount: 12,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#2563eb',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(37, 99, 235, 0.92)',
      motif: 'sparks',
      baseSize: 106,
      particleCount: 14,
    },
  },
  veedramon: {
    // DMO F1: V-Breath Arrow (blazing cobalt-cyan V-arrow beam), F2: Hammer Punch (crushing azure shock slash)
    special1: {
      archetype: 'beam',
      primaryHex: '#38bdf8',
      secondaryHex: '#e0f2fe',
      glowRgba: 'rgba(56, 189, 248, 0.94)',
      motif: 'lightning',
      baseSize: 88,
      particleCount: 16,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#2563eb',
      secondaryHex: '#bae6fd',
      glowRgba: 'rgba(37, 99, 235, 0.94)',
      motif: 'sparks',
      baseSize: 122,
      particleCount: 16,
    },
  },
  aeroveedramon: {
    // DMO F1: V-Wing Blade (aerial azure crescent blade), F2: Dragon Impulse (roaring royal dragon beam)
    special1: {
      archetype: 'slash',
      primaryHex: '#0ea5e9',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(14, 165, 233, 0.95)',
      motif: 'stars',
      baseSize: 136,
      particleCount: 18,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#3b82f6',
      secondaryHex: '#e0f2fe',
      glowRgba: 'rgba(59, 130, 246, 0.96)',
      motif: 'lightning',
      baseSize: 108,
      particleCount: 20,
    },
  },
  ulforceveedramon: {
    // DMO F1: Ulforce Saber (radiant cyan-gold plasma saber), F2: Shining V Force (colossal Royal Knight V-beam)
    special1: {
      archetype: 'slash',
      primaryHex: '#38bdf8',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(56, 189, 248, 0.98)',
      motif: 'stars',
      baseSize: 148,
      particleCount: 22,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#facc15',
      secondaryHex: '#7dd3fc',
      glowRgba: 'rgba(250, 204, 21, 0.98)',
      motif: 'stars',
      baseSize: 128,
      particleCount: 24,
    },
  },
  keramon: {
    // DMO F1: Crazy Giggle (erratic cyber-violet virus orb), F2: Network Eater (corrupting violet-lime vortex burst)
    special1: {
      archetype: 'projectile',
      primaryHex: '#818cf8',
      secondaryHex: '#c084fc',
      glowRgba: 'rgba(129, 140, 248, 0.9)',
      motif: 'sparks',
      baseSize: 70,
      particleCount: 14,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#9333ea',
      secondaryHex: '#a3e635',
      glowRgba: 'rgba(147, 51, 234, 0.94)',
      motif: 'lightning',
      baseSize: 104,
      particleCount: 16,
    },
  },
  chrysalimon: {
    // DMO F1: Data Crusher (razor violet-gold tendril slash), F2: Unconnect Buster (radial cyber-violet detonation)
    special1: {
      archetype: 'slash',
      primaryHex: '#a855f7',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(168, 85, 247, 0.94)',
      motif: 'lightning',
      baseSize: 122,
      particleCount: 16,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#7c3aed',
      secondaryHex: '#facc15',
      glowRgba: 'rgba(124, 58, 237, 0.95)',
      motif: 'sparks',
      baseSize: 124,
      particleCount: 18,
    },
  },
  infermon: {
    // DMO F1: Spider Shooter (crimson cyber plasma blast), F2: Hell's Grenade (scorching crimson-violet detonation)
    special1: {
      archetype: 'projectile',
      primaryHex: '#ef4444',
      secondaryHex: '#f8fafc',
      glowRgba: 'rgba(239, 68, 68, 0.95)',
      motif: 'embers',
      baseSize: 88,
      particleCount: 18,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#dc2626',
      secondaryHex: '#c084fc',
      glowRgba: 'rgba(220, 38, 38, 0.96)',
      motif: 'lightning',
      baseSize: 138,
      particleCount: 20,
    },
  },
  diaboromon: {
    // DMO F1: Cable Crusher (abyssal indigo-crimson cross-claw slash), F2: Catastrophe Cannon (devastating chest laser)
    special1: {
      archetype: 'slash',
      primaryHex: '#a855f7',
      secondaryHex: '#f43f5e',
      glowRgba: 'rgba(168, 85, 247, 0.98)',
      motif: 'lightning',
      baseSize: 148,
      particleCount: 22,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#f43f5e',
      secondaryHex: '#d8b4fe',
      glowRgba: 'rgba(244, 63, 94, 0.98)',
      motif: 'lightning',
      baseSize: 130,
      particleCount: 24,
    },
  },
  demimeramon: {
    // DMO F1: Fireball (orange-yellow ember orb), F2: Flame Dash (fiery burst charge)
    special1: {
      archetype: 'projectile',
      primaryHex: '#f97316',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(249, 115, 22, 0.94)',
      motif: 'embers',
      baseSize: 72,
      particleCount: 14,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#fb923c',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(251, 146, 60, 0.95)',
      motif: 'embers',
      baseSize: 96,
      particleCount: 16,
    },
  },
  meramon: {
    // DMO F1: Burning Fist (scorching flame knuckle slash), F2: Fireball (volcanic magma orb)
    special1: {
      archetype: 'slash',
      primaryHex: '#f97316',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(249, 115, 22, 0.95)',
      motif: 'embers',
      baseSize: 112,
      particleCount: 16,
    },
    special2: {
      archetype: 'projectile',
      primaryHex: '#ef4444',
      secondaryHex: '#facc15',
      glowRgba: 'rgba(239, 68, 68, 0.96)',
      motif: 'embers',
      baseSize: 88,
      particleCount: 18,
    },
  },
  skullmeramon: {
    // DMO F1: Heavy Metal Fire (blue-white superheated jet beam), F2: Metal Fireball (molten steel-fire sphere)
    special1: {
      archetype: 'beam',
      primaryHex: '#38bdf8',
      secondaryHex: '#f97316',
      glowRgba: 'rgba(56, 189, 248, 0.96)',
      motif: 'embers',
      baseSize: 118,
      particleCount: 20,
    },
    special2: {
      archetype: 'projectile',
      primaryHex: '#f97316',
      secondaryHex: '#93c5fd',
      glowRgba: 'rgba(249, 115, 22, 0.96)',
      motif: 'sparks',
      baseSize: 96,
      particleCount: 20,
    },
  },
  boltmon: {
    // DMO F1: Tomahawk Steiner (emerald-steel battleaxe cleave), F2: Berserk (seismic emerald-amber shockwave smash)
    special1: {
      archetype: 'slash',
      primaryHex: '#22c55e',
      secondaryHex: '#e2e8f0',
      glowRgba: 'rgba(34, 197, 94, 0.97)',
      motif: 'sparks',
      baseSize: 146,
      particleCount: 22,
    },
    special2: {
      archetype: 'hammer',
      primaryHex: '#10b981',
      secondaryHex: '#f59e0b',
      glowRgba: 'rgba(16, 185, 129, 0.98)',
      motif: 'lightning',
      baseSize: 148,
      particleCount: 24,
    },
  },
  hawkmon: {
    // DMO F1: Feather Slash (crimson-emerald boomerang plume), F2: Beak Pecker (swift aerial thrust slash)
    special1: {
      archetype: 'projectile',
      primaryHex: '#f43f5e',
      secondaryHex: '#6ee7b7',
      glowRgba: 'rgba(244, 63, 94, 0.93)',
      motif: 'sparks',
      baseSize: 74,
      particleCount: 14,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#fb7185',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(251, 113, 133, 0.94)',
      motif: 'sparks',
      baseSize: 94,
      particleCount: 16,
    },
  },
  aquilamon: {
    // DMO F1: Blast Laser (amber-gold sonic wind beam), F2: Grand Horn (crimson-gold dive cleave)
    special1: {
      archetype: 'beam',
      primaryHex: '#f59e0b',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(245, 158, 11, 0.95)',
      motif: 'sparks',
      baseSize: 110,
      particleCount: 18,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#ef4444',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(239, 68, 68, 0.95)',
      motif: 'sparks',
      baseSize: 118,
      particleCount: 18,
    },
  },
  silphymon: {
    // DMO F1: Top Gun (emerald-rose aero energy sphere), F2: Static Force (sonic wind shockwave burst)
    special1: {
      archetype: 'projectile',
      primaryHex: '#10b981',
      secondaryHex: '#fda4af',
      glowRgba: 'rgba(16, 185, 129, 0.96)',
      motif: 'stars',
      baseSize: 92,
      particleCount: 20,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#34d399',
      secondaryHex: '#f43f5e',
      glowRgba: 'rgba(52, 211, 153, 0.96)',
      motif: 'stars',
      baseSize: 134,
      particleCount: 22,
    },
  },
  gryphonmon: {
    // DMO F1: Supersonic Voice (golden-emerald resonant tempest beam), F2: Legendary Blade (radiant wind-claw cross slash)
    special1: {
      archetype: 'beam',
      primaryHex: '#facc15',
      secondaryHex: '#34d399',
      glowRgba: 'rgba(250, 204, 21, 0.98)',
      motif: 'stars',
      baseSize: 134,
      particleCount: 24,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#10b981',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(16, 185, 129, 0.98)',
      motif: 'stars',
      baseSize: 150,
      particleCount: 24,
    },
  },
  tentomon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#facc15',
      secondaryHex: '#38bdf8',
      glowRgba: 'rgba(250, 204, 21, 0.93)',
      motif: 'lightning',
      baseSize: 72,
      particleCount: 14,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#ef4444',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(239, 68, 68, 0.94)',
      motif: 'sparks',
      baseSize: 96,
      particleCount: 16,
    },
  },
  kabuterimon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#38bdf8',
      secondaryHex: '#facc15',
      glowRgba: 'rgba(56, 189, 248, 0.95)',
      motif: 'lightning',
      baseSize: 88,
      particleCount: 18,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#60a5fa',
      secondaryHex: '#e0f2fe',
      glowRgba: 'rgba(96, 165, 250, 0.95)',
      motif: 'lightning',
      baseSize: 118,
      particleCount: 18,
    },
  },
  megakabuterimon: {
    special1: {
      archetype: 'beam',
      primaryHex: '#ef4444',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(239, 68, 68, 0.96)',
      motif: 'lightning',
      baseSize: 120,
      particleCount: 20,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#dc2626',
      secondaryHex: '#93c5fd',
      glowRgba: 'rgba(220, 38, 38, 0.96)',
      motif: 'sparks',
      baseSize: 132,
      particleCount: 20,
    },
  },
  herculeskabuterimon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#facc15',
      secondaryHex: '#38bdf8',
      glowRgba: 'rgba(250, 204, 21, 0.98)',
      motif: 'lightning',
      baseSize: 148,
      particleCount: 22,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#fde047',
      secondaryHex: '#7dd3fc',
      glowRgba: 'rgba(253, 224, 71, 0.98)',
      motif: 'lightning',
      baseSize: 140,
      particleCount: 26,
    },
  },
  drimogemon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#a855f7',
      secondaryHex: '#e2e8f0',
      glowRgba: 'rgba(168, 85, 247, 0.93)',
      motif: 'sparks',
      baseSize: 94,
      particleCount: 14,
    },
    special2: {
      archetype: 'projectile',
      primaryHex: '#f59e0b',
      secondaryHex: '#fef3c7',
      glowRgba: 'rgba(245, 158, 11, 0.94)',
      motif: 'sparks',
      baseSize: 78,
      particleCount: 16,
    },
  },
  digmon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#eab308',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(234, 179, 8, 0.95)',
      motif: 'sparks',
      baseSize: 88,
      particleCount: 18,
    },
    special2: {
      archetype: 'eruption',
      primaryHex: '#d97706',
      secondaryHex: '#a855f7',
      glowRgba: 'rgba(217, 119, 6, 0.96)',
      motif: 'sparks',
      baseSize: 122,
      particleCount: 20,
    },
  },
  giromon: {
    special1: {
      archetype: 'burst',
      primaryHex: '#ef4444',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(239, 68, 68, 0.96)',
      motif: 'embers',
      baseSize: 126,
      particleCount: 20,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#818cf8',
      secondaryHex: '#f87171',
      glowRgba: 'rgba(129, 140, 248, 0.96)',
      motif: 'sparks',
      baseSize: 134,
      particleCount: 20,
    },
  },
  hiandromon: {
    special1: {
      archetype: 'beam',
      primaryHex: '#38bdf8',
      secondaryHex: '#f87171',
      glowRgba: 'rgba(56, 189, 248, 0.98)',
      motif: 'lightning',
      baseSize: 134,
      particleCount: 24,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#60a5fa',
      secondaryHex: '#facc15',
      glowRgba: 'rgba(96, 165, 250, 0.98)',
      motif: 'stars',
      baseSize: 148,
      particleCount: 26,
    },
  },
  kiwimon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#4ade80',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(74, 222, 128, 0.92)',
      motif: 'leaves',
      baseSize: 92,
      particleCount: 14,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#22c55e',
      secondaryHex: '#f59e0b',
      glowRgba: 'rgba(34, 197, 94, 0.94)',
      motif: 'leaves',
      baseSize: 102,
      particleCount: 16,
    },
  },
  deramon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#facc15',
      secondaryHex: '#38bdf8',
      glowRgba: 'rgba(250, 204, 21, 0.95)',
      motif: 'stars',
      baseSize: 88,
      particleCount: 18,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#eab308',
      secondaryHex: '#60a5fa',
      glowRgba: 'rgba(234, 179, 8, 0.95)',
      motif: 'sparks',
      baseSize: 118,
      particleCount: 18,
    },
  },
  blossomon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#c084fc',
      secondaryHex: '#bef264',
      glowRgba: 'rgba(192, 132, 252, 0.96)',
      motif: 'petals',
      baseSize: 92,
      particleCount: 20,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#84cc16',
      secondaryHex: '#e879f9',
      glowRgba: 'rgba(132, 204, 22, 0.96)',
      motif: 'leaves',
      baseSize: 132,
      particleCount: 22,
    },
  },
  griffomon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#fbbf24',
      secondaryHex: '#818cf8',
      glowRgba: 'rgba(251, 191, 36, 0.98)',
      motif: 'stars',
      baseSize: 146,
      particleCount: 22,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#f59e0b',
      secondaryHex: '#c7d2fe',
      glowRgba: 'rgba(245, 158, 11, 0.98)',
      motif: 'stars',
      baseSize: 138,
      particleCount: 26,
    },
  },
  gotsumon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#f59e0b',
      secondaryHex: '#94a3b8',
      glowRgba: 'rgba(245, 158, 11, 0.92)',
      motif: 'sparks',
      baseSize: 96,
      particleCount: 16,
    },
    special2: {
      archetype: 'eruption',
      primaryHex: '#d97706',
      secondaryHex: '#fef3c7',
      glowRgba: 'rgba(217, 119, 6, 0.95)',
      motif: 'sparks',
      baseSize: 112,
      particleCount: 20,
    },
  },
  icemon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#67e8f9',
      secondaryHex: '#e0f2fe',
      glowRgba: 'rgba(103, 232, 249, 0.94)',
      motif: 'stars',
      baseSize: 108,
      particleCount: 18,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#38bdf8',
      secondaryHex: '#ffffff',
      glowRgba: 'rgba(56, 189, 248, 0.96)',
      motif: 'stars',
      baseSize: 124,
      particleCount: 22,
    },
  },
  insekimon: {
    special1: {
      archetype: 'beam',
      primaryHex: '#d9f99d',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(217, 249, 157, 0.95)',
      motif: 'stars',
      baseSize: 124,
      particleCount: 22,
    },
    special2: {
      archetype: 'eruption',
      primaryHex: '#f59e0b',
      secondaryHex: '#d9f99d',
      glowRgba: 'rgba(245, 158, 11, 0.96)',
      motif: 'sparks',
      baseSize: 136,
      particleCount: 26,
    },
  },
  metaletemon: {
    special1: {
      archetype: 'burst',
      primaryHex: '#a855f7',
      secondaryHex: '#e2e8f0',
      glowRgba: 'rgba(168, 85, 247, 0.96)',
      motif: 'stars',
      baseSize: 138,
      particleCount: 24,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#facc15',
      secondaryHex: '#e2e8f0',
      glowRgba: 'rgba(250, 204, 21, 0.98)',
      motif: 'sparks',
      baseSize: 148,
      particleCount: 28,
    },
  },
  elecmon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#fb923c',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(251, 146, 60, 0.94)',
      motif: 'sparks',
      baseSize: 96,
      particleCount: 16,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#facc15',
      secondaryHex: '#38bdf8',
      glowRgba: 'rgba(250, 204, 21, 0.96)',
      motif: 'sparks',
      baseSize: 112,
      particleCount: 20,
    },
  },
  leomon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#f59e0b',
      secondaryHex: '#ef4444',
      glowRgba: 'rgba(245, 158, 11, 0.96)',
      motif: 'sparks',
      baseSize: 116,
      particleCount: 20,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#facc15',
      secondaryHex: '#fef3c7',
      glowRgba: 'rgba(250, 204, 21, 0.96)',
      motif: 'stars',
      baseSize: 128,
      particleCount: 22,
    },
  },
  iceleomon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#38bdf8',
      secondaryHex: '#e0f2fe',
      glowRgba: 'rgba(56, 189, 248, 0.96)',
      motif: 'stars',
      baseSize: 128,
      particleCount: 22,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#67e8f9',
      secondaryHex: '#ffffff',
      glowRgba: 'rgba(103, 232, 249, 0.98)',
      motif: 'stars',
      baseSize: 136,
      particleCount: 26,
    },
  },
  saberleomon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#facc15',
      secondaryHex: '#f97316',
      glowRgba: 'rgba(250, 204, 21, 0.98)',
      motif: 'sparks',
      baseSize: 146,
      particleCount: 26,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#fbbf24',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(251, 191, 36, 0.98)',
      motif: 'stars',
      baseSize: 148,
      particleCount: 28,
    },
  },
  renamon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#facc15',
      secondaryHex: '#a855f7',
      glowRgba: 'rgba(250, 204, 21, 0.94)',
      motif: 'stars',
      baseSize: 98,
      particleCount: 18,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#38bdf8',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(56, 189, 248, 0.96)',
      motif: 'stars',
      baseSize: 114,
      particleCount: 22,
    },
  },
  kyubimon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#60a5fa',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(96, 165, 250, 0.96)',
      motif: 'sparks',
      baseSize: 118,
      particleCount: 22,
    },
    special2: {
      archetype: 'tornado',
      primaryHex: '#3b82f6',
      secondaryHex: '#f97316',
      glowRgba: 'rgba(59, 130, 246, 0.96)',
      motif: 'sparks',
      baseSize: 132,
      particleCount: 24,
    },
  },
  taomon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#fde047',
      secondaryHex: '#c084fc',
      glowRgba: 'rgba(253, 224, 71, 0.96)',
      motif: 'stars',
      baseSize: 126,
      particleCount: 22,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#c084fc',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(192, 132, 252, 0.98)',
      motif: 'stars',
      baseSize: 138,
      particleCount: 26,
    },
  },
  sakuyamon: {
    special1: {
      archetype: 'burst',
      primaryHex: '#facc15',
      secondaryHex: '#38bdf8',
      glowRgba: 'rgba(250, 204, 21, 0.98)',
      motif: 'stars',
      baseSize: 144,
      particleCount: 26,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#c084fc',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(192, 132, 252, 0.98)',
      motif: 'stars',
      baseSize: 152,
      particleCount: 30,
    },
  },
  monodramon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#a855f7',
      secondaryHex: '#fbbf24',
      glowRgba: 'rgba(168, 85, 247, 0.94)',
      motif: 'sparks',
      baseSize: 98,
      particleCount: 16,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#f97316',
      secondaryHex: '#c084fc',
      glowRgba: 'rgba(249, 115, 22, 0.95)',
      motif: 'sparks',
      baseSize: 112,
      particleCount: 20,
    },
  },
  strikedramon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#ef4444',
      secondaryHex: '#fbbf24',
      glowRgba: 'rgba(239, 68, 68, 0.96)',
      motif: 'sparks',
      baseSize: 118,
      particleCount: 20,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#f97316',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(249, 115, 22, 0.96)',
      motif: 'sparks',
      baseSize: 130,
      particleCount: 24,
    },
  },
  cyberdramon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#ef4444',
      secondaryHex: '#cbd5e1',
      glowRgba: 'rgba(239, 68, 68, 0.98)',
      motif: 'sparks',
      baseSize: 134,
      particleCount: 24,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#dc2626',
      secondaryHex: '#f8fafc',
      glowRgba: 'rgba(220, 38, 38, 0.98)',
      motif: 'stars',
      baseSize: 142,
      particleCount: 26,
    },
  },
  justimon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#ef4444',
      secondaryHex: '#38bdf8',
      glowRgba: 'rgba(239, 68, 68, 0.98)',
      motif: 'stars',
      baseSize: 146,
      particleCount: 26,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#38bdf8',
      secondaryHex: '#facc15',
      glowRgba: 'rgba(56, 189, 248, 0.98)',
      motif: 'stars',
      baseSize: 154,
      particleCount: 30,
    },
  },
  biyomon: {
    special1: {
      archetype: 'tornado',
      primaryHex: '#34d399',
      secondaryHex: '#a7f3d0',
      glowRgba: 'rgba(52, 211, 153, 0.94)',
      motif: 'sparks',
      baseSize: 96,
      particleCount: 16,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#f472b6',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(244, 114, 182, 0.94)',
      motif: 'stars',
      baseSize: 108,
      particleCount: 18,
    },
  },
  birdramon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#f97316',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(249, 115, 22, 0.96)',
      motif: 'embers',
      baseSize: 118,
      particleCount: 22,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#ef4444',
      secondaryHex: '#fdba74',
      glowRgba: 'rgba(239, 68, 68, 0.96)',
      motif: 'embers',
      baseSize: 130,
      particleCount: 24,
    },
  },
  garudamon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#ef4444',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(239, 68, 68, 0.98)',
      motif: 'embers',
      baseSize: 138,
      particleCount: 24,
    },
    special2: {
      archetype: 'tornado',
      primaryHex: '#f97316',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(249, 115, 22, 0.98)',
      motif: 'embers',
      baseSize: 146,
      particleCount: 26,
    },
  },
  phoenixmon: {
    special1: {
      archetype: 'eruption',
      primaryHex: '#ef4444',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(239, 68, 68, 0.98)',
      motif: 'embers',
      baseSize: 148,
      particleCount: 28,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#facc15',
      secondaryHex: '#ffffff',
      glowRgba: 'rgba(250, 204, 21, 0.98)',
      motif: 'stars',
      baseSize: 160,
      particleCount: 32,
    },
  },
  kunemon: {
    special1: {
      archetype: 'beam',
      primaryHex: '#facc15',
      secondaryHex: '#38bdf8',
      glowRgba: 'rgba(250, 204, 21, 0.94)',
      motif: 'lightning',
      baseSize: 96,
      particleCount: 16,
    },
    special2: {
      archetype: 'projectile',
      primaryHex: '#a855f7',
      secondaryHex: '#a3e635',
      glowRgba: 'rgba(168, 85, 247, 0.94)',
      motif: 'sparks',
      baseSize: 108,
      particleCount: 18,
    },
  },
  flymon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#eab308',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(234, 179, 8, 0.96)',
      motif: 'sparks',
      baseSize: 118,
      particleCount: 20,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#c026d3',
      secondaryHex: '#bef264',
      glowRgba: 'rgba(192, 38, 211, 0.96)',
      motif: 'sparks',
      baseSize: 130,
      particleCount: 24,
    },
  },
  okuwamon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#84cc16',
      secondaryHex: '#e2e8f0',
      glowRgba: 'rgba(132, 204, 22, 0.96)',
      motif: 'sparks',
      baseSize: 136,
      particleCount: 24,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#ef4444',
      secondaryHex: '#a855f7',
      glowRgba: 'rgba(239, 68, 68, 0.98)',
      motif: 'lightning',
      baseSize: 142,
      particleCount: 26,
    },
  },
  grankuwagamon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#a855f7',
      secondaryHex: '#f43f5e',
      glowRgba: 'rgba(168, 85, 247, 0.98)',
      motif: 'stars',
      baseSize: 150,
      particleCount: 28,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#dc2626',
      secondaryHex: '#fbbf24',
      glowRgba: 'rgba(220, 38, 38, 0.98)',
      motif: 'stars',
      baseSize: 162,
      particleCount: 32,
    },
  },
};

function seededUnit(seed: number, idx: number, salt: number): number {
  const n = Math.sin(seed * 12.9898 + idx * 78.233 + salt * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

function drawFourPointStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.closePath();
  ctx.fill();
}

function drawMiniHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.38);
  ctx.bezierCurveTo(
    -size * 0.9,
    -size * 0.25,
    -size * 0.45,
    -size * 0.9,
    0,
    -size * 0.3
  );
  ctx.bezierCurveTo(
    size * 0.45,
    -size * 0.9,
    size * 0.9,
    -size * 0.25,
    0,
    size * 0.38
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSkillParticles(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spec: SkillVfxSpec,
  localP: number,
  spreadRadius: number,
  seed: number
): void {
  if (localP <= 0 || localP >= 1) return;
  const fade =
    localP < 0.18
      ? localP / 0.18
      : localP > 0.72
        ? Math.max(0, (1 - localP) / 0.28)
        : 1;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < spec.particleCount; i++) {
    const angle =
      (i / spec.particleCount) * Math.PI * 2 +
      (seededUnit(seed, i, 1) - 0.5) * 0.45;
    const speedMult = 0.58 + seededUnit(seed, i, 2) * 0.65;
    const dist = spreadRadius * (0.22 + localP * 0.95) * speedMult;
    const px = cx + Math.cos(angle) * dist;
    const liftY =
      spec.motif === 'embers' || spec.motif === 'petals' || spec.motif === 'hearts'
        ? -localP * 16 * seededUnit(seed, i, 3)
        : 0;
    const py = cy + Math.sin(angle) * dist * 0.82 + liftY;
    const pSize = (2.8 + seededUnit(seed, i, 4) * 3.8) * (1 - localP * 0.35);

    ctx.globalAlpha = fade * (0.6 + seededUnit(seed, i, 5) * 0.4);
    ctx.fillStyle = i % 2 === 0 ? spec.secondaryHex : spec.primaryHex;
    ctx.strokeStyle = spec.secondaryHex;

    if (spec.motif === 'stars') {
      drawFourPointStar(ctx, px, py, pSize * 1.45);
    } else if (spec.motif === 'hearts') {
      drawMiniHeart(ctx, px, py, pSize * 1.55);
    } else if (spec.motif === 'petals' || spec.motif === 'leaves') {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle + localP * 2.4);
      ctx.beginPath();
      ctx.ellipse(0, 0, pSize * 1.35, pSize * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (spec.motif === 'lightning') {
      ctx.lineWidth = 1.8;
      const lx = px + Math.cos(angle) * 8;
      const ly = py + Math.sin(angle) * 8;
      const midX = (px + lx) / 2 + (seededUnit(seed, i, 6) - 0.5) * 8;
      const midY = (py + ly) / 2 + (seededUnit(seed, i, 7) - 0.5) * 8;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(midX, midY);
      ctx.lineTo(lx, ly);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(px, py, pSize * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawRadialGlowHalo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  spec: SkillVfxSpec,
  alpha: number
): void {
  if (radius <= 1 || alpha <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.28, spec.secondaryHex);
  grad.addColorStop(0.62, spec.glowRgba);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawShockwaveRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  lineWidth: number,
  alpha: number
): void {
  if (rx <= 1 || ry <= 1 || alpha <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws the faithful individual Skill VFX sprite matching each skill icon,
 * enhanced with dynamic trajectory, additive blooms, shockwaves, and themed particles.
 */
export function drawDigimonSpecialVfx(
  ctx: CanvasRenderingContext2D,
  formId: DigimonFormId,
  attackKind: PartnerAttackKind,
  attackerX: number,
  attackerY: number,
  targetX: number,
  targetY: number,
  progress: number,
  seed = 1
): void {
  const bucket = digimonImageCache.get(formId);
  const profile = getDigimonFormProfile(formId);
  const p = Math.max(0, Math.min(1, progress));
  const facingRight = targetX >= attackerX;
  const alpha =
    p < 0.12 ? p / 0.12 : p > 0.78 ? Math.max(0, (1 - p) / 0.22) : 1;

  if (attackKind === 'basic') {
    const bp = Math.min(1, p * 1.35);
    const ix = targetX + (facingRight ? -4 : 4);
    const iy = targetY - 26;
    const hitScale =
      formId === 'shinegreymon' ||
      formId === 'wargreymon' ||
      formId === 'metalgarurumon' ||
      formId === 'miragegaogamon' ||
      formId === 'rosemon' ||
      formId === 'dukemon' ||
      formId === 'beelzemon' ||
      formId === 'ulforceveedramon' ||
      formId === 'diaboromon' ||
      formId === 'boltmon' ||
      formId === 'gryphonmon' ||
      formId === 'herculeskabuterimon' ||
      formId === 'hiandromon' ||
      formId === 'griffomon' ||
      formId === 'metaletemon' ||
      formId === 'saberleomon' ||
      formId === 'sakuyamon' ||
      formId === 'justimon' ||
      formId === 'phoenixmon' ||
      formId === 'grankuwagamon'
        ? 1.4
        : formId === 'rizegreymon' ||
            formId === 'metalgreymon' ||
            formId === 'weregarurumon' ||
            formId === 'machgaogamon' ||
            formId === 'lilamon' ||
            formId === 'megalogrowlmon' ||
            formId === 'skullsatamon' ||
            formId === 'aeroveedramon' ||
            formId === 'infermon' ||
            formId === 'skullmeramon' ||
            formId === 'silphymon' ||
            formId === 'megakabuterimon' ||
            formId === 'giromon' ||
            formId === 'blossomon' ||
            formId === 'insekimon' ||
            formId === 'iceleomon' ||
            formId === 'taomon' ||
            formId === 'cyberdramon' ||
            formId === 'garudamon' ||
            formId === 'okuwamon'
          ? 1.24
          : formId === 'geogreymon' ||
              formId === 'greymon' ||
              formId === 'garurumon' ||
              formId === 'gaogamon' ||
              formId === 'sunflowmon' ||
              formId === 'growlmon' ||
              formId === 'icedevimon' ||
              formId === 'veedramon' ||
              formId === 'chrysalimon' ||
              formId === 'meramon' ||
              formId === 'aquilamon' ||
              formId === 'kabuterimon' ||
              formId === 'digmon' ||
              formId === 'deramon' ||
              formId === 'icemon' ||
              formId === 'leomon' ||
              formId === 'kyubimon' ||
              formId === 'strikedramon' ||
              formId === 'birdramon' ||
              formId === 'flymon'
            ? 1.12
            : 1.0;

    ctx.save();
    ctx.translate(ix, iy);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.98));

    // Bright additive impact flash behind the hit
    const haloR = (26 + bp * 20) * hitScale;
    const halo = ctx.createRadialGradient(0, 0, 1, 0, 0, haloR);
    halo.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
    halo.addColorStop(0.32, profile.theme.accentHex);
    halo.addColorStop(0.65, profile.theme.glowRgba);
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fill();

    // Expanding double shockwave rings
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.6 * hitScale;
    ctx.beginPath();
    ctx.arc(0, 0, (12 + bp * 24) * hitScale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = profile.theme.accentHex;
    ctx.lineWidth = 2.2 * hitScale;
    ctx.beginPath();
    ctx.arc(0, 0, (6 + bp * 32) * hitScale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const dirSign = facingRight ? 1 : -1;
    ctx.lineCap = 'round';
    if (
      formId === 'guilmon' ||
      formId === 'growlmon' ||
      formId === 'megalogrowlmon' ||
      formId === 'agumon' ||
      formId === 'geogreymon' ||
      formId === 'rizegreymon' ||
      formId === 'shinegreymon' ||
      formId === 'agumon_classic' ||
      formId === 'greymon' ||
      formId === 'metalgreymon' ||
      formId === 'demimeramon' ||
      formId === 'meramon' ||
      formId === 'skullmeramon'
    ) {
      // Triple scorching dragon-claw slash across the target mob
      for (let ci = -1; ci <= 1; ci++) {
        const offset = ci * 6.5 * hitScale;
        ctx.strokeStyle = profile.theme.accentHex;
        ctx.lineWidth = 4.5 * hitScale;
        ctx.beginPath();
        ctx.moveTo(
          (-16 * dirSign + offset * 0.35) * hitScale,
          (-14 + offset) * hitScale
        );
        ctx.lineTo(
          (18 * dirSign + offset * 0.35) * hitScale,
          (13 + offset) * hitScale
        );
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2 * hitScale;
        ctx.beginPath();
        ctx.moveTo(
          (-14 * dirSign + offset * 0.35) * hitScale,
          (-12 + offset) * hitScale
        );
        ctx.lineTo(
          (16 * dirSign + offset * 0.35) * hitScale,
          (11 + offset) * hitScale
        );
        ctx.stroke();
      }
    } else if (formId === 'wargreymon') {
      // Dramon Killer twin golden cross-claw slashes across the target mob
      for (const sgn of [-1, 1]) {
        for (let ci = -1; ci <= 1; ci++) {
          const offset = ci * 4.5 * hitScale;
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 4.2 * hitScale;
          ctx.beginPath();
          ctx.moveTo(
            (-18 * dirSign + offset * 0.3) * hitScale,
            (-15 * sgn + offset) * hitScale
          );
          ctx.lineTo(
            (20 * dirSign + offset * 0.3) * hitScale,
            (15 * sgn + offset) * hitScale
          );
          ctx.stroke();

          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.0 * hitScale;
          ctx.beginPath();
          ctx.moveTo(
            (-15 * dirSign + offset * 0.3) * hitScale,
            (-12 * sgn + offset) * hitScale
          );
          ctx.lineTo(
            (17 * dirSign + offset * 0.3) * hitScale,
            (12 * sgn + offset) * hitScale
          );
          ctx.stroke();
        }
      }
    } else if (formId === 'dukemon') {
      // Royal Saber golden lance thrust & cross-star flash on target mob
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 5.6 * hitScale;
      ctx.beginPath();
      ctx.moveTo(-24 * dirSign * hitScale, 0);
      ctx.lineTo(26 * dirSign * hitScale, 0);
      ctx.stroke();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.6 * hitScale;
      ctx.beginPath();
      ctx.moveTo(-14 * dirSign * hitScale, -14 * hitScale);
      ctx.lineTo(16 * dirSign * hitScale, 14 * hitScale);
      ctx.moveTo(-14 * dirSign * hitScale, 14 * hitScale);
      ctx.lineTo(16 * dirSign * hitScale, -14 * hitScale);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5 * hitScale;
      ctx.beginPath();
      ctx.moveTo(-20 * dirSign * hitScale, 0);
      ctx.lineTo(22 * dirSign * hitScale, 0);
      ctx.stroke();
    } else if (
      formId === 'gabumon' ||
      formId === 'garurumon' ||
      formId === 'weregarurumon' ||
      formId === 'metalgarurumon'
    ) {
      // Glacial wolf-claw triple frost slash + crystalline cyan sheen
      for (let ci = -1; ci <= 1; ci++) {
        const offset = ci * 6.0 * hitScale;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 4.5 * hitScale;
        ctx.beginPath();
        ctx.moveTo(
          (-17 * dirSign + offset * 0.32) * hitScale,
          (-14 + offset) * hitScale
        );
        ctx.lineTo(
          (19 * dirSign + offset * 0.32) * hitScale,
          (13 + offset) * hitScale
        );
        ctx.stroke();

        ctx.strokeStyle = '#f0f9ff';
        ctx.lineWidth = 2.1 * hitScale;
        ctx.beginPath();
        ctx.moveTo(
          (-14 * dirSign + offset * 0.32) * hitScale,
          (-12 + offset) * hitScale
        );
        ctx.lineTo(
          (16 * dirSign + offset * 0.32) * hitScale,
          (11 + offset) * hitScale
        );
        ctx.stroke();
      }
    } else if (
      formId === 'impmon' ||
      formId === 'icedevimon' ||
      formId === 'skullsatamon' ||
      formId === 'beelzemon' ||
      formId === 'keramon' ||
      formId === 'chrysalimon' ||
      formId === 'infermon' ||
      formId === 'diaboromon'
    ) {
      // Demon Lord / Virus Anomaly crimson-violet cross-claw tear across the target mob
      const primaryStroke =
        formId === 'icedevimon'
          ? '#818cf8'
          : formId === 'infermon'
            ? '#ef4444'
            : '#a855f7';
      const innerStroke =
        formId === 'icedevimon'
          ? '#e0f2fe'
          : formId === 'chrysalimon'
            ? '#fde047'
            : '#f87171';
      for (const sgn of [-1, 1]) {
        for (let ci = -1; ci <= 1; ci++) {
          const offset = ci * 5.0 * hitScale;
          ctx.strokeStyle = primaryStroke;
          ctx.lineWidth = 4.4 * hitScale;
          ctx.beginPath();
          ctx.moveTo(
            (-18 * dirSign + offset * 0.3) * hitScale,
            (-14 * sgn + offset) * hitScale
          );
          ctx.lineTo(
            (20 * dirSign + offset * 0.3) * hitScale,
            (14 * sgn + offset) * hitScale
          );
          ctx.stroke();

          ctx.strokeStyle = innerStroke;
          ctx.lineWidth = 2.0 * hitScale;
          ctx.beginPath();
          ctx.moveTo(
            (-15 * dirSign + offset * 0.3) * hitScale,
            (-11 * sgn + offset) * hitScale
          );
          ctx.lineTo(
            (17 * dirSign + offset * 0.3) * hitScale,
            (11 * sgn + offset) * hitScale
          );
          ctx.stroke();
        }
      }
    } else if (
      formId === 'gaomon' ||
      formId === 'gaogamon' ||
      formId === 'machgaogamon' ||
      formId === 'miragegaogamon' ||
      formId === 'veemon' ||
      formId === 'veedramon' ||
      formId === 'aeroveedramon' ||
      formId === 'ulforceveedramon' ||
      formId === 'boltmon' ||
      formId === 'hawkmon' ||
      formId === 'aquilamon' ||
      formId === 'silphymon' ||
      formId === 'gryphonmon' ||
      formId === 'tentomon' ||
      formId === 'kabuterimon' ||
      formId === 'megakabuterimon' ||
      formId === 'herculeskabuterimon' ||
      formId === 'drimogemon' ||
      formId === 'digmon' ||
      formId === 'giromon' ||
      formId === 'hiandromon' ||
      formId === 'deramon' ||
      formId === 'griffomon' ||
      formId === 'gotsumon' ||
      formId === 'icemon' ||
      formId === 'insekimon' ||
      formId === 'metaletemon' ||
      formId === 'elecmon' ||
      formId === 'leomon' ||
      formId === 'iceleomon' ||
      formId === 'saberleomon' ||
      formId === 'renamon' ||
      formId === 'kyubimon' ||
      formId === 'taomon' ||
      formId === 'sakuyamon' ||
      formId === 'monodramon' ||
      formId === 'strikedramon' ||
      formId === 'cyberdramon' ||
      formId === 'justimon' ||
      formId === 'biyomon' ||
      formId === 'birdramon' ||
      formId === 'garudamon' ||
      formId === 'phoenixmon' ||
      formId === 'kunemon' ||
      formId === 'flymon' ||
      formId === 'okuwamon' ||
      formId === 'grankuwagamon'
    ) {
      // Sonic / Royal V-Force / Thunder / Cyber / Aerial X-cross crescent slash
      ctx.strokeStyle =
        formId === 'ulforceveedramon' ||
        formId === 'gryphonmon' ||
        formId === 'herculeskabuterimon' ||
        formId === 'digmon' ||
        formId === 'deramon' ||
        formId === 'griffomon' ||
        formId === 'gotsumon' ||
        formId === 'insekimon' ||
        formId === 'elecmon' ||
        formId === 'leomon' ||
        formId === 'saberleomon' ||
        formId === 'renamon' ||
        formId === 'sakuyamon' ||
        formId === 'phoenixmon' ||
        formId === 'kunemon' ||
        formId === 'flymon'
          ? '#facc15'
          : formId === 'boltmon' || formId === 'silphymon' || formId === 'okuwamon'
            ? '#34d399'
            : formId === 'hawkmon' ||
                formId === 'aquilamon' ||
                formId === 'tentomon' ||
                formId === 'megakabuterimon' ||
                formId === 'strikedramon' ||
                formId === 'cyberdramon' ||
                formId === 'justimon' ||
                formId === 'biyomon' ||
                formId === 'birdramon' ||
                formId === 'garudamon'
              ? '#fb7185'
              : formId === 'drimogemon' ||
                  formId === 'giromon' ||
                  formId === 'metaletemon' ||
                  formId === 'taomon' ||
                  formId === 'monodramon' ||
                  formId === 'grankuwagamon'
                ? '#a855f7'
                : '#38bdf8';
      ctx.lineWidth = 4.8 * hitScale;
      ctx.beginPath();
      ctx.moveTo(-18 * dirSign * hitScale, -12 * hitScale);
      ctx.lineTo(19 * dirSign * hitScale, 13 * hitScale);
      ctx.moveTo(-16 * dirSign * hitScale, 12 * hitScale);
      ctx.lineTo(17 * dirSign * hitScale, -12 * hitScale);
      ctx.stroke();

      ctx.strokeStyle = formId === 'ulforceveedramon' ? '#e0f2fe' : '#ffffff';
      ctx.lineWidth = 2.2 * hitScale;
      ctx.beginPath();
      ctx.moveTo(-15 * dirSign * hitScale, -10 * hitScale);
      ctx.lineTo(16 * dirSign * hitScale, 11 * hitScale);
      ctx.moveTo(-13 * dirSign * hitScale, 10 * hitScale);
      ctx.lineTo(14 * dirSign * hitScale, -10 * hitScale);
      ctx.stroke();
    } else {
      // Flora / Rosemon whip arc + vibrant nature slash
      ctx.strokeStyle = profile.theme.accentHex;
      ctx.lineWidth = 4.6 * hitScale;
      ctx.beginPath();
      ctx.moveTo(-18 * dirSign * hitScale, -11 * hitScale);
      ctx.quadraticCurveTo(4 * dirSign * hitScale, 6 * hitScale, 20 * dirSign * hitScale, -7 * hitScale);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2 * hitScale;
      ctx.beginPath();
      ctx.moveTo(-15 * dirSign * hitScale, -9 * hitScale);
      ctx.quadraticCurveTo(4 * dirSign * hitScale, 5 * hitScale, 17 * dirSign * hitScale, -6 * hitScale);
      ctx.stroke();
    }

    // Radial flying hit sparks bursting outward on every mob impact
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let si = 0; si < 8; si++) {
      const ang = (si / 8) * Math.PI * 2 + seededUnit(seed, si, 1) * 0.4;
      const dist = (10 + bp * 26 * (0.75 + seededUnit(seed, si, 2) * 0.6)) * hitScale;
      const sxp = Math.cos(ang) * dist;
      const syp = Math.sin(ang) * dist * 0.85;
      ctx.fillStyle = si % 2 === 0 ? '#ffffff' : profile.theme.accentHex;
      drawFourPointStar(ctx, sxp, syp, (3.6 - bp * 1.4) * hitScale);
    }
    ctx.restore();

    ctx.restore();
    return;
  }

  const fxKey: DigimonAssetKey =
    attackKind === 'special2' ? 'atk2_fx' : 'atk1_fx';
  const fxImg = bucket?.get(fxKey);
  if (!isSourceReady(fxImg)) return;
  touchDigimonCacheForm(formId);

  const spec =
    SKILL_VFX_SPECS[formId][
      attackKind === 'special2' ? 'special2' : 'special1'
    ];
  const fxSize = getSourceSize(fxImg);
  const fxRatio = fxSize.width / Math.max(1, fxSize.height);
  const castOriginY =
    attackerY - Math.round(profile.worldDimensions.heightPx * 0.45);
  const impactX = targetX;
  const impactY = targetY - 26;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Cast origin flash aura during wind-up
  if (p < 0.36) {
    const castP = p / 0.36;
    const castFade = Math.sin(castP * Math.PI);
    drawRadialGlowHalo(
      ctx,
      attackerX + (facingRight ? 12 : -12),
      castOriginY,
      26 + castP * 18,
      spec,
      castFade * 0.55
    );
    drawShockwaveRing(
      ctx,
      attackerX + (facingRight ? 12 : -12),
      castOriginY,
      10 + castP * 24,
      10 + castP * 24,
      spec.secondaryHex,
      2.2,
      castFade * 0.72
    );
  }

  if (spec.archetype === 'projectile') {
    const flightP = Math.min(1, p / 0.62);
    const easedFlight = 1 - Math.pow(1 - flightP, 2.1);
    const startX = attackerX + (facingRight ? 18 : -18);
    const startY = castOriginY;
    const curX = startX + (impactX - startX) * easedFlight;
    const curY = startY + (impactY - startY) * easedFlight;
    const dx = impactX - startX;
    const dy = impactY - startY;

    const drawH = spec.baseSize;
    const drawW = drawH * fxRatio;
    const scalePop =
      flightP < 1
        ? 0.82 + Math.sin(flightP * Math.PI) * 0.28
        : 1.0 + (p - 0.62) * 0.32;
    const projAlpha = p > 0.72 ? Math.max(0, (1 - p) / 0.28) : Math.min(1, p / 0.1);

    // Subtle glowing motion afterimage while traveling
    if (flightP > 0.08 && flightP < 0.98) {
      const ghostT = Math.max(0, easedFlight - 0.16);
      const gx = startX + dx * ghostT;
      const gy = startY + dy * ghostT;
      drawRadialGlowHalo(ctx, gx, gy, drawH * 0.52, spec, projAlpha * 0.35);
      ctx.save();
      ctx.globalAlpha = projAlpha * 0.32;
      ctx.translate(gx, gy);
      if (dx < 0) {
        ctx.scale(-1, 1);
        ctx.rotate(Math.atan2(dy, -dx));
      } else {
        ctx.rotate(Math.atan2(dy, dx));
      }
      ctx.scale(scalePop * 0.9, scalePop * 0.9);
      ctx.drawImage(fxImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    }

    // Traveling bloom + crisp projectile sprite (never upside down)
    drawRadialGlowHalo(ctx, curX, curY, drawH * 0.68, spec, projAlpha * 0.45);
    ctx.save();
    ctx.globalAlpha = projAlpha;
    ctx.translate(curX, curY);
    if (dx < 0) {
      ctx.scale(-1, 1);
      ctx.rotate(Math.atan2(dy, -dx));
    } else {
      ctx.rotate(Math.atan2(dy, dx));
    }
    ctx.scale(scalePop, scalePop);
    ctx.drawImage(fxImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Impact detonation flash + shockwave + particles
    if (p >= 0.44) {
      const impP = Math.min(1, (p - 0.44) / 0.56);
      const impFade = impP < 0.25 ? impP / 0.25 : Math.max(0, (1 - impP) / 0.75);
      drawRadialGlowHalo(ctx, impactX, impactY, 44 + impP * 28, spec, impFade * 0.72);
      drawShockwaveRing(
        ctx,
        impactX,
        impactY,
        16 + impP * 48,
        10 + impP * 28,
        spec.secondaryHex,
        2.8,
        impFade * 0.85
      );
      drawSkillParticles(ctx, impactX, impactY, spec, impP, 54, seed);
    }
  } else if (spec.archetype === 'beam') {
    const startX = attackerX + (facingRight ? 20 : -20);
    const startY = castOriginY;
    const dx = impactX - startX;
    const dy = impactY - startY;
    const dist = Math.max(48, Math.hypot(dx, dy));
    const extendP = Math.min(1, p / 0.24);
    const pulse = 1 + Math.sin(p * Math.PI * 5) * 0.06;

    const beamDrawH = spec.baseSize * pulse;
    const naturalW = beamDrawH * fxRatio;
    const curLen = dist * extendP;
    const spriteW = Math.min(naturalW * 1.45, Math.max(naturalW * 0.9, curLen * 0.78));
    const spriteH = beamDrawH * 0.88;
    const tipX = startX + dx * extendP;
    const tipY = startY + dy * extendP;

    drawRadialGlowHalo(ctx, startX, startY, 38, spec, alpha * 0.55);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(startX, startY);
    if (dx < 0) {
      ctx.scale(-1, 1);
      ctx.rotate(Math.atan2(dy, -dx));
    } else {
      ctx.rotate(Math.atan2(dy, dx));
    }

    // Crisp multi-layer plasma lance bridging cleanly from cast origin to impact point
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.strokeStyle = spec.glowRgba;
    ctx.lineWidth = Math.max(16, beamDrawH * 0.28);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(curLen, 0);
    ctx.stroke();

    ctx.strokeStyle = spec.primaryHex;
    ctx.lineWidth = Math.max(9, beamDrawH * 0.14);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(curLen, 0);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(4, beamDrawH * 0.06);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(curLen, 0);
    ctx.stroke();
    ctx.restore();

    // Draw custom cel-shaded FX centered near the impact zone without ugly stretching
    const centerOnBeam = Math.max(curLen * 0.55, curLen - spriteW * 0.25);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.42;
    ctx.drawImage(
      fxImg,
      centerOnBeam - (spriteW * 1.12) / 2,
      -(spriteH * 1.12) / 2,
      spriteW * 1.12,
      spriteH * 1.12
    );
    ctx.restore();
    ctx.drawImage(fxImg, centerOnBeam - spriteW / 2, -spriteH / 2, spriteW, spriteH);
    ctx.restore();

    if (extendP > 0.25) {
      drawRadialGlowHalo(ctx, tipX, tipY, 30, spec, alpha * 0.45);
    }

    if (p >= 0.2) {
      const impP = Math.min(1, (p - 0.2) / 0.8);
      drawRadialGlowHalo(ctx, impactX, impactY, 46 + impP * 22, spec, alpha * 0.65);
      drawShockwaveRing(
        ctx,
        impactX,
        impactY,
        14 + impP * 44,
        14 + impP * 44,
        spec.secondaryHex,
        2.5,
        alpha * 0.78
      );
      drawSkillParticles(ctx, impactX, impactY, spec, impP, 52, seed);
    }
  } else if (spec.archetype === 'hammer') {
    const dropP = Math.min(1, p / 0.34);
    const slamEase = Math.pow(dropP, 2.2);
    const dropOffsetY = (1 - slamEase) * -86;
    const rebound =
      p >= 0.34 && p < 0.52
        ? -Math.sin(((p - 0.34) / 0.18) * Math.PI) * 10
        : 0;

    const drawH = spec.baseSize;
    const drawW = drawH * fxRatio;
    const tilt =
      p < 0.34 ? -0.35 + dropP * 0.42 : 0.07;

    drawRadialGlowHalo(
      ctx,
      impactX,
      impactY + dropOffsetY,
      drawH * 0.56,
      spec,
      alpha * 0.48
    );

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(impactX, impactY + dropOffsetY + rebound);
    if (!facingRight) ctx.scale(-1, 1);
    ctx.rotate(tilt);
    ctx.drawImage(fxImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    if (p >= 0.3) {
      const impP = Math.min(1, (p - 0.3) / 0.7);
      const impFade = impP < 0.2 ? impP / 0.2 : Math.max(0, (1 - impP) / 0.8);
      drawRadialGlowHalo(ctx, impactX, targetY - 6, 56 + impP * 34, spec, impFade * 0.75);
      drawShockwaveRing(
        ctx,
        impactX,
        targetY - 4,
        18 + impP * 74,
        7 + impP * 24,
        spec.secondaryHex,
        3.2,
        impFade * 0.92
      );
      drawShockwaveRing(
        ctx,
        impactX,
        targetY - 4,
        10 + impP * 48,
        4 + impP * 16,
        spec.primaryHex,
        2.0,
        impFade * 0.75
      );
      drawSkillParticles(ctx, impactX, impactY + 4, spec, impP, 68, seed);
    }
  } else if (spec.archetype === 'tornado') {
    const spinP = Math.sin(p * Math.PI * 4);
    const pop = 0.76 + Math.sin(p * Math.PI) * 0.34;
    const drawH = spec.baseSize * pop;
    const drawW = drawH * fxRatio;
    const swayX = spinP * 5;

    drawRadialGlowHalo(ctx, impactX + swayX, impactY - 6, drawH * 0.58, spec, alpha * 0.46);

    // Ground wind vortex rings
    for (let rIdx = 0; rIdx < 2; rIdx++) {
      const rp = (p * 1.8 + rIdx * 0.5) % 1;
      drawShockwaveRing(
        ctx,
        impactX,
        targetY - 4,
        14 + rp * 44,
        5 + rp * 14,
        rIdx === 0 ? spec.secondaryHex : spec.primaryHex,
        2.2,
        alpha * (1 - rp) * 0.85
      );
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(impactX + swayX, impactY - 6);
    if (!facingRight) ctx.scale(-1, 1);
    ctx.scale(1 + Math.sin(p * Math.PI * 6) * 0.06, 1);
    ctx.drawImage(fxImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    drawSkillParticles(ctx, impactX, impactY - 8, spec, p, 56, seed);
  } else if (spec.archetype === 'eruption') {
    const eruptEase = 1 - Math.pow(1 - Math.min(1, p * 2.3), 2.2);
    const targetW = spec.baseSize;
    const targetH = targetW / Math.max(0.5, fxRatio);

    drawShockwaveRing(
      ctx,
      targetX,
      targetY + 2,
      14 + p * 54,
      5 + p * 18,
      spec.secondaryHex,
      2.6,
      alpha * 0.82
    );
    drawRadialGlowHalo(ctx, targetX, targetY - 18, 48 * eruptEase, spec, alpha * 0.45);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(targetX, targetY + 6);
    if (!facingRight) ctx.scale(-1, 1);
    ctx.drawImage(
      fxImg,
      -targetW / 2,
      -targetH * eruptEase,
      targetW,
      targetH * eruptEase
    );
    ctx.restore();

    drawSkillParticles(ctx, targetX, targetY - 26, spec, p, 52, seed);
  } else if (spec.archetype === 'slash') {
    const slashP = Math.min(1, p / 0.45);
    const sweepRot = -0.34 + (1 - Math.pow(1 - slashP, 2)) * 0.44;
    const pop = 0.78 + Math.sin(p * Math.PI) * 0.34;
    const drawH = spec.baseSize * pop;
    const drawW = drawH * fxRatio;

    drawRadialGlowHalo(ctx, impactX, impactY, drawH * 0.56, spec, alpha * 0.52);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(impactX, impactY);
    if (!facingRight) ctx.scale(-1, 1);
    ctx.rotate(sweepRot);

    // Subtle additive rim behind crisp slash artwork
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.36;
    ctx.drawImage(
      fxImg,
      -(drawW * 1.1) / 2,
      -(drawH * 1.1) / 2,
      drawW * 1.1,
      drawH * 1.1
    );
    ctx.restore();

    ctx.drawImage(fxImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    if (p >= 0.14) {
      const impP = Math.min(1, (p - 0.14) / 0.86);
      drawShockwaveRing(
        ctx,
        impactX,
        impactY,
        12 + impP * 54,
        12 + impP * 54,
        spec.secondaryHex,
        2.4,
        alpha * 0.78
      );
      drawSkillParticles(ctx, impactX, impactY, spec, impP, 60, seed);
    }
  } else {
    // 'burst' — radial nova / floral bloom / heart surge / magma explosion
    const popEase = 1 - Math.pow(1 - Math.min(1, p * 2.1), 2.3);
    const pulse = popEase * (0.94 + Math.sin(p * Math.PI * 3) * 0.08);
    const drawH = spec.baseSize * pulse;
    const drawW = drawH * fxRatio;

    drawRadialGlowHalo(ctx, impactX, impactY, drawH * 0.68, spec, alpha * 0.58);
    drawShockwaveRing(
      ctx,
      impactX,
      impactY,
      14 + p * 68,
      14 + p * 68,
      spec.secondaryHex,
      2.8,
      alpha * 0.86
    );
    drawShockwaveRing(
      ctx,
      impactX,
      impactY,
      8 + p * 44,
      8 + p * 44,
      spec.primaryHex,
      2.0,
      alpha * 0.72
    );

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(impactX, impactY);
    if (!facingRight) ctx.scale(-1, 1);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.42;
    ctx.drawImage(
      fxImg,
      -(drawW * 1.12) / 2,
      -(drawH * 1.12) / 2,
      drawW * 1.12,
      drawH * 1.12
    );
    ctx.restore();

    ctx.drawImage(fxImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    drawSkillParticles(ctx, impactX, impactY, spec, p, 68, seed);
  }

  ctx.restore();
}

