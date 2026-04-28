/**
 * Compress an image File when it exceeds maxBytes. Skips non-image files
 * and files already under the limit. Returns the original file on any
 * compression error so the caller can let the validator surface the
 * oversize toast as it would without compression.
 *
 * The dynamic import keeps browser-image-compression out of the initial
 * bundle — it only loads on the upload path, where size matters more
 * than first-paint cost.
 */
export async function compressImageIfOversize(
  file: File,
  maxBytes: number,
  targetBytes?: number,
): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= maxBytes) return file;
  const imageCompression = (await import("browser-image-compression")).default;
  const target = (targetBytes ?? maxBytes * 0.8) / (1024 * 1024);
  const compressed = await imageCompression(file, {
    maxSizeMB: target,
    maxWidthOrHeight: 2400,
    useWebWorker: true,
    fileType: "image/jpeg",
  });
  const newName = file.name.replace(/\.(heic|heif|webp|avif|tiff|tif|png|gif|bmp)$/i, ".jpg");
  return new File([compressed], newName, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}
