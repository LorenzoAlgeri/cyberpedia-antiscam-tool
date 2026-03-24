/**
 * Client-side image compression using Canvas API.
 *
 * Strategy:
 * - Resize to max 1920px (long edge)
 * - JPEG quality 0.7 → progressively lower if too large
 * - Target: each image ≤ MAX_SCREENSHOT_STRING_LENGTH as data URI
 */

import { MAX_SCREENSHOT_STRING_LENGTH } from '@/types/dossier';

/** Maximum pixel dimension (long edge) */
const MAX_DIMENSION = 1920;

/** Starting JPEG quality */
const INITIAL_QUALITY = 0.7;

/** Minimum JPEG quality before giving up */
const MIN_QUALITY = 0.3;

/** Quality decrement per retry */
const QUALITY_STEP = 0.1;

/**
 * Compress an image file to a JPEG data URI that fits within the storage budget.
 *
 * @returns data:image/jpeg;base64,... string
 * @throws Error if the image can't be compressed enough
 */
export async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const { width: origW, height: origH } = bitmap;

  // Scale down if either dimension exceeds the max
  let width = origW;
  let height = origH;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('OffscreenCanvas 2D non supportato');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Try progressively lower quality until it fits
  let quality = INITIAL_QUALITY;
  while (quality >= MIN_QUALITY) {
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    const dataUri = await blobToDataUri(blob);
    if (dataUri.length <= MAX_SCREENSHOT_STRING_LENGTH) {
      return dataUri;
    }
    quality -= QUALITY_STEP;
  }

  throw new Error('Immagine troppo grande anche dopo la compressione massima');
}

/** Convert a Blob to a data URI string */
function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Errore lettura file'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Estimate the localStorage space used by all antiscam-* keys.
 * Returns approximate bytes (each JS char ≈ 2 bytes in memory, but
 * localStorage uses UTF-16 so 1 char = 2 bytes toward the quota).
 */
export function estimateStorageUsage(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('antiscam-')) {
      const value = localStorage.getItem(key);
      if (value) total += (key.length + value.length) * 2; // UTF-16
    }
  }
  return total;
}

/** Rough check: will adding `bytes` exceed a 4.5MB safety margin? */
export function wouldExceedStorageQuota(additionalChars: number): boolean {
  const current = estimateStorageUsage();
  const projected = current + additionalChars * 2;
  const SAFETY_LIMIT = 4.5 * 1024 * 1024; // 4.5MB in bytes
  return projected > SAFETY_LIMIT;
}
