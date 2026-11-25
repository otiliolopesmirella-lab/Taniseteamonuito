import type { TamerId } from '../types/character';

export const TAMER_CELL_W = 144;
export const TAMER_CELL_H = 224;
export const TAMER_FOOT_PAD = 10;
export const TAMER_FRAME_COUNT = 4;
export const TAMER_FRAME_WRAP = 2520; // LCM(4, 6, 7, 8, 9) so variable-length sheets loop seamlessly

export type CardinalDirection = 'N' | 'S' | 'E' | 'W';
export type TamerMovementState = 'idle' | 'walk';

export type TamerMovementSheetKey =
  | 'idle'
  | 'idle_side_right'
  | 'idle_side_left'
  | 'idle_back'
  | 'walk_front'
  | 'walk_side_right'
  | 'walk_side_left'
  | 'walk_back';

export interface TamerMovementSheetEntry {
  key: TamerMovementSheetKey;
  url: string;
  frameCount: number;
  cellWidth: number;
  cellHeight: number;
}

const SHEET_KEYS: readonly TamerMovementSheetKey[] = [
  'idle',
  'idle_side_right',
  'idle_side_left',
  'idle_back',
  'walk_front',
  'walk_side_right',
  'walk_side_left',
  'walk_back',
] as const;

export const SPRITE_VERSION_QUERY = '?v=hd3';

function buildManifest(
  tamerId: TamerId
): Record<TamerMovementSheetKey, TamerMovementSheetEntry> {
  const manifest = {} as Record<TamerMovementSheetKey, TamerMovementSheetEntry>;
  for (const key of SHEET_KEYS) {
    manifest[key] = {
      key,
      url: `/assets/sprites/tamers/${tamerId}/${key}.png${SPRITE_VERSION_QUERY}`,
      frameCount: key.startsWith('idle_') ? 1 : TAMER_FRAME_COUNT,
      cellWidth: TAMER_CELL_W,
      cellHeight: TAMER_CELL_H,
    };
  }
  return manifest;
}

export const TAMER_MOVEMENT_MANIFESTS: Record<
  TamerId,
  Record<TamerMovementSheetKey, TamerMovementSheetEntry>
> = {
  kai: buildManifest('kai'),
  ren: buildManifest('ren'),
  hina: buildManifest('hina'),
  yuna: buildManifest('yuna'),
};

const imageCache = new Map<
  TamerId,
  Map<TamerMovementSheetKey, HTMLImageElement>
>();
const preloadCache = new Map<TamerId, Promise<void>>();

export function preloadTamerSheets(tamerId: TamerId): Promise<void> {
  const existing = preloadCache.get(tamerId);
  if (existing) return existing;

  const manifest = TAMER_MOVEMENT_MANIFESTS[tamerId];
  const tamerImages = new Map<TamerMovementSheetKey, HTMLImageElement>();
  imageCache.set(tamerId, tamerImages);

  const promise = Promise.all(
    Object.values(manifest).map(
      (entry) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            tamerImages.set(entry.key, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = entry.url;
        })
    )
  ).then(() => undefined);

  preloadCache.set(tamerId, promise);
  return promise;
}

function resolveSheetKey(
  state: TamerMovementState,
  direction: CardinalDirection
): TamerMovementSheetKey {
  if (state === 'idle') {
    if (direction === 'S') return 'idle';
    if (direction === 'E') return 'idle_side_right';
    if (direction === 'W') return 'idle_side_left';
    return 'idle_back';
  }
  if (direction === 'S') return 'walk_front';
  if (direction === 'E') return 'walk_side_right';
  if (direction === 'W') return 'walk_side_left';
  return 'walk_back';
}

function resolveWalkFallbackKey(
  direction: CardinalDirection
): TamerMovementSheetKey {
  if (direction === 'S') return 'walk_front';
  if (direction === 'E') return 'walk_side_right';
  if (direction === 'W') return 'walk_side_left';
  return 'walk_back';
}

/**
 * Draws the normalized transparent frame of the selected Tamer onto Canvas 2D,
 * using strictly movement-only animations (idle, walk_front, walk_side, walk_back).
 */
export function drawTamerMovementFrame(
  ctx: CanvasRenderingContext2D,
  tamerId: TamerId,
  state: TamerMovementState,
  direction: CardinalDirection,
  frameIndex: number,
  elapsedSec: number,
  footX: number,
  footY: number
): boolean {
  let sheetKey = resolveSheetKey(state, direction);
  let entry = TAMER_MOVEMENT_MANIFESTS[tamerId][sheetKey];
  let img = imageCache.get(tamerId)?.get(sheetKey);

  if ((!img || !img.complete || img.naturalWidth === 0) && state === 'idle') {
    sheetKey = resolveWalkFallbackKey(direction);
    entry = TAMER_MOVEMENT_MANIFESTS[tamerId][sheetKey];
    img = imageCache.get(tamerId)?.get(sheetKey);
  }

  if (!img || !img.complete || img.naturalWidth === 0) {
    return false;
  }

  const sheetCols = Math.max(1, Math.round(img.naturalWidth / entry.cellWidth));
  const baseScale = 0.47;
  let scaleX = baseScale;
  let scaleY = baseScale;
  let col = 0;

  if (state === 'idle') {
    col =
      sheetKey === 'idle' && sheetCols > 1
        ? ((frameIndex % sheetCols) + sheetCols) % sheetCols
        : 0;
    const breath = Math.sin(elapsedSec * 3.0);
    scaleY = baseScale * (1 + breath * 0.012);
    scaleX = baseScale * (1 - breath * 0.006);
  } else {
    col = ((frameIndex % sheetCols) + sheetCols) % sheetCols;
  }

  const sx = col * entry.cellWidth;
  const sy = 0;
  const dw = entry.cellWidth * scaleX;
  const dh = entry.cellHeight * scaleY;
  const feetOffset = TAMER_FOOT_PAD * scaleY;

  ctx.save();
  ctx.translate(footX, footY);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium';
  ctx.drawImage(
    img,
    sx,
    sy,
    entry.cellWidth,
    entry.cellHeight,
    -dw / 2,
    -dh + feetOffset,
    dw,
    dh
  );
  ctx.restore();

  return true;
}
