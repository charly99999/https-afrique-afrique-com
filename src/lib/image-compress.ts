// Client-side image compression — réduit la taille avant upload
// Resize au max 1920px côté long, convertit en JPEG q=0.82.
// Conserve l'original si déjà petit ou si la compression échoue.

const MAX_DIMENSION = 1920;
const QUALITY = 0.82;
const SKIP_BELOW = 300 * 1024; // <300KB : on n'y touche pas

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif") return file; // garder l'animation
  if (file.size < SKIP_BELOW) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close(); return file; }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.(png|webp|heic|heif|jpe?g)$/i, ".jpg");
    return new File([blob], newName.endsWith(".jpg") ? newName : `${newName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

export async function compressMany(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage));
}
