// Client-side image compression — réduit fortement la taille avant upload.
// Objectif : des fichiers légers (~<900 Ko) pour que l'envoi passe même en 3G.
// Conserve l'original si déjà petit ou si la compression échoue.

const MAX_DIMENSION = 1600;
const QUALITY = 0.72;
const SKIP_BELOW = 120 * 1024; // <120KB : on n'y touche pas
const TARGET_BYTES = 900 * 1024; // au-delà, on recompresse plus fort

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

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

    let quality = QUALITY;
    let blob = await toBlob(canvas, quality);
    // Recompression progressive tant que le fichier reste lourd
    while (blob && blob.size > TARGET_BYTES && quality > 0.4) {
      quality -= 0.12;
      blob = await toBlob(canvas, quality);
    }
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

// Séquentiel : évite de saturer la mémoire des téléphones d'entrée de gamme.
export async function compressMany(files: File[]): Promise<File[]> {
  const out: File[] = [];
  for (const f of files) out.push(await compressImage(f));
  return out;
}
