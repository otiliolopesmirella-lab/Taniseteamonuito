const AVATAR_PHOTO_DATA_URL_REGEX =
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export const MAX_AVATAR_PHOTO_DATA_URL_LENGTH = 44_000;
export const MAX_COVER_PHOTO_DATA_URL_LENGTH = 48_000;
const MAX_RAW_UPLOAD_BYTES = 25 * 1024 * 1024;
const IMAGE_EXTENSION_RE = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i;

export function isValidAvatarPhotoDataUrl(
  value: unknown
): value is string {
  return (
    typeof value === 'string' &&
    value.length > 32 &&
    value.length <= MAX_AVATAR_PHOTO_DATA_URL_LENGTH &&
    AVATAR_PHOTO_DATA_URL_REGEX.test(value)
  );
}

export function isValidCoverPhotoDataUrl(
  value: unknown
): value is string {
  return (
    typeof value === 'string' &&
    value.length > 32 &&
    value.length <= MAX_COVER_PHOTO_DATA_URL_LENGTH &&
    AVATAR_PHOTO_DATA_URL_REGEX.test(value)
  );
}

interface DrawablePhotoSource {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

function loadImageViaObjectUrl(file: File): Promise<DrawablePhotoSource> {
  return new Promise((resolve, reject) => {
    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      reject(new Error('Navegador sem suporte para leitura segura de imagem.'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = 'async';
    let settled = false;

    const cleanupNow = () => {
      try {
        img.onload = null;
        img.onerror = null;
        img.src = '';
      } catch {
        // Ignore cleanup errors
      }
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // Ignore revoke errors
      }
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanupNow();
      reject(new Error('Tempo esgotado ao carregar a foto selecionada.'));
    }, 15_000);

    img.onload = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (w < 8 || h < 8) {
        cleanupNow();
        reject(new Error('A imagem escolhida é pequena demais.'));
        return;
      }
      resolve({
        source: img,
        width: w,
        height: h,
        cleanup: cleanupNow,
      });
    };

    img.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      cleanupNow();
      reject(new Error('Formato de imagem não suportado pelo navegador.'));
    };

    img.src = objectUrl;
  });
}

async function decodePhotoSafely(file: File): Promise<DrawablePhotoSource> {
  if (typeof createImageBitmap === 'function') {
    // Tier 1: Hardware-downscale directly during decode so 12MP-50MP phone photos
    // never allocate huge RGBA textures in mobile WebView / browser memory.
    try {
      const resized = await createImageBitmap(file, {
        resizeWidth: 384,
        resizeQuality: 'medium',
      });
      if (resized.width >= 8 && resized.height >= 8) {
        return {
          source: resized,
          width: resized.width,
          height: resized.height,
          cleanup: () => {
            try {
              resized.close();
            } catch {
              // Ignore
            }
          },
        };
      }
      resized.close();
    } catch {
      // Some older Safari / WebView builds do not support resize options on createImageBitmap
    }

    // Tier 2: Standard createImageBitmap (still avoids base64 FileReader memory duplication)
    try {
      const fullBitmap = await createImageBitmap(file);
      if (fullBitmap.width >= 8 && fullBitmap.height >= 8) {
        return {
          source: fullBitmap,
          width: fullBitmap.width,
          height: fullBitmap.height,
          cleanup: () => {
            try {
              fullBitmap.close();
            } catch {
              // Ignore
            }
          },
        };
      }
      fullBitmap.close();
    } catch {
      // Fall back to ObjectURL + Image
    }
  }

  return loadImageViaObjectUrl(file);
}

/**
 * Memory-safe square cropper & compressor for mobile gallery/camera and desktop images.
 * Avoids `FileReader.readAsDataURL` so large smartphone camera photos never spike mobile RAM.
 */
export async function processSquarePhotoUpload(
  file: File,
  options?: {
    maxBytes?: number;
    fillBackground?: string;
    errorTooLargeCompression?: string;
  }
): Promise<{ ok: boolean; dataUrl?: string; error?: string }> {
  if (!file) {
    return {
      ok: false,
      error: 'Nenhum arquivo de imagem foi selecionado.',
    };
  }

  const mimeLooksImage = Boolean(file.type && file.type.startsWith('image/'));
  const nameLooksImage = Boolean(file.name && IMAGE_EXTENSION_RE.test(file.name));
  if (!mimeLooksImage && !nameLooksImage) {
    return {
      ok: false,
      error: 'Selecione um arquivo de imagem válido (JPG, PNG ou WebP).',
    };
  }

  if (file.size > MAX_RAW_UPLOAD_BYTES) {
    return {
      ok: false,
      error: 'A imagem é muito grande (máximo 25 MB). Escolha outra foto.',
    };
  }

  const maxBytes = options?.maxBytes ?? MAX_AVATAR_PHOTO_DATA_URL_LENGTH;
  const fillBackground = options?.fillBackground ?? '#071b4a';
  const compressionErr =
    options?.errorTooLargeCompression ??
    'Não foi possível comprimir a imagem abaixo do limite permitido.';

  // Let mobile OS finish tearing down the native gallery/camera picker overlay
  await new Promise((r) => window.setTimeout(r, 60));

  let decoded: DrawablePhotoSource | null = null;
  try {
    decoded = await decodePhotoSafely(file);
    const { source, width: srcW, height: srcH } = decoded;
    if (srcW < 8 || srcH < 8) {
      return { ok: false, error: 'A imagem escolhida é pequena demais.' };
    }

    const side = Math.min(srcW, srcH);
    const sx = Math.max(0, Math.floor((srcW - side) / 2));
    const sy = Math.max(0, Math.floor((srcH - side) / 2));

    const sizes = [128, 112, 96, 80];
    const formats: Array<{ mime: 'image/webp' | 'image/jpeg'; qualities: number[] }> = [
      { mime: 'image/webp', qualities: [0.84, 0.72, 0.58] },
      { mime: 'image/jpeg', qualities: [0.82, 0.7, 0.56, 0.44] },
    ];

    for (const targetSize of sizes) {
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = fillBackground;
        ctx.fillRect(0, 0, targetSize, targetSize);
        ctx.drawImage(source, sx, sy, side, side, 0, 0, targetSize, targetSize);

        for (const fmt of formats) {
          for (const quality of fmt.qualities) {
            const candidate = canvas.toDataURL(fmt.mime, quality);
            if (
              candidate.length > 32 &&
              candidate.length <= maxBytes &&
              AVATAR_PHOTO_DATA_URL_REGEX.test(candidate)
            ) {
              return { ok: true, dataUrl: candidate };
            }
          }
        }
      } finally {
        // Release GPU/RAM backing buffer immediately on mobile WebViews
        canvas.width = 0;
        canvas.height = 0;
      }
    }

    return { ok: false, error: compressionErr };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error && err.message
          ? err.message
          : 'Não foi possível processar a foto selecionada.',
    };
  } finally {
    decoded?.cleanup();
  }
}

/**
 * Loads an image chosen from the player's phone gallery or computer,
 * center-crops it to a crisp 128x128 square, and compresses it to a lightweight
 * WebP/JPEG data URL (< 44KB) safe for instant HUD rendering and Firestore cloud saves.
 */
export async function processAvatarPhotoUpload(
  file: File
): Promise<{ ok: boolean; dataUrl?: string; error?: string }> {
  return processSquarePhotoUpload(file, {
    maxBytes: MAX_AVATAR_PHOTO_DATA_URL_LENGTH,
    fillBackground: '#071b4a',
    errorTooLargeCompression:
      'Não foi possível comprimir a imagem abaixo do limite permitido.',
  });
}

/**
 * Memory-safe wide banner (3:1) cropper & compressor for Rank Cover Photos ("Capa do Rank").
 */
export async function processCoverPhotoUpload(
  file: File
): Promise<{ ok: boolean; dataUrl?: string; error?: string }> {
  if (!file) {
    return { ok: false, error: 'Nenhum arquivo de imagem foi selecionado.' };
  }

  const mimeLooksImage = Boolean(file.type && file.type.startsWith('image/'));
  const nameLooksImage = Boolean(file.name && IMAGE_EXTENSION_RE.test(file.name));
  if (!mimeLooksImage && !nameLooksImage) {
    return {
      ok: false,
      error: 'Selecione um arquivo de imagem válido (JPG, PNG ou WebP).',
    };
  }

  if (file.size > MAX_RAW_UPLOAD_BYTES) {
    return {
      ok: false,
      error: 'A imagem é muito grande (máximo 25 MB). Escolha outra foto.',
    };
  }

  await new Promise((r) => window.setTimeout(r, 60));

  let decoded: DrawablePhotoSource | null = null;
  try {
    decoded = await decodePhotoSafely(file);
    const { source, width: srcW, height: srcH } = decoded;
    if (srcW < 8 || srcH < 8) {
      return { ok: false, error: 'A imagem escolhida é pequena demais.' };
    }

    // Center-crop to ~3:1 banner ratio so Rank cards frame cleanly
    const targetRatio = 3.0;
    let cropW = srcW;
    let cropH = Math.round(srcW / targetRatio);
    if (cropH > srcH) {
      cropH = srcH;
      cropW = Math.round(srcH * targetRatio);
    }
    cropW = Math.max(8, Math.min(srcW, cropW));
    cropH = Math.max(8, Math.min(srcH, cropH));
    const sx = Math.max(0, Math.floor((srcW - cropW) / 2));
    const sy = Math.max(0, Math.floor((srcH - cropH) / 2));

    const targets: Array<{ w: number; h: number }> = [
      { w: 320, h: 108 },
      { w: 288, h: 96 },
      { w: 240, h: 80 },
    ];
    const formats: Array<{ mime: 'image/webp' | 'image/jpeg'; qualities: number[] }> = [
      { mime: 'image/webp', qualities: [0.84, 0.72, 0.58] },
      { mime: 'image/jpeg', qualities: [0.82, 0.7, 0.56, 0.44] },
    ];

    for (const dim of targets) {
      const canvas = document.createElement('canvas');
      canvas.width = dim.w;
      canvas.height = dim.h;
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#041232';
        ctx.fillRect(0, 0, dim.w, dim.h);
        ctx.drawImage(source, sx, sy, cropW, cropH, 0, 0, dim.w, dim.h);

        for (const fmt of formats) {
          for (const quality of fmt.qualities) {
            const candidate = canvas.toDataURL(fmt.mime, quality);
            if (
              candidate.length > 32 &&
              candidate.length <= MAX_COVER_PHOTO_DATA_URL_LENGTH &&
              AVATAR_PHOTO_DATA_URL_REGEX.test(candidate)
            ) {
              return { ok: true, dataUrl: candidate };
            }
          }
        }
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
    }

    return {
      ok: false,
      error: 'Não foi possível comprimir a capa abaixo do limite permitido.',
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error && err.message
          ? err.message
          : 'Não foi possível processar a capa selecionada.',
    };
  } finally {
    decoded?.cleanup();
  }
}
