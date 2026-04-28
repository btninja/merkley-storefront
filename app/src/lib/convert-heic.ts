/**
 * Convert HEIC/HEIF files to JPEG client-side before upload.
 *
 * iPhone customers default to HEIC; Chrome/Firefox don't render HEIC
 * natively, so the CRM preview lightbox can't show the image. Convert
 * before send so the server archive is uniform JPEG.
 *
 * Pass-through for non-HEIC files — never re-encode JPEG/PNG/etc.
 */
export async function convertHeicToJpegIfNeeded(file: File): Promise<File> {
  const isHeic =
    /\.heic$|\.heif$/i.test(file.name) ||
    file.type === "image/heic" ||
    file.type === "image/heif";

  if (!isHeic) return file;

  // Lazy-load heic2any so non-HEIC uploads don't pay the bundle cost.
  const heic2any = (await import("heic2any")).default;
  const blob = (await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  })) as Blob;

  const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([blob], newName, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}
