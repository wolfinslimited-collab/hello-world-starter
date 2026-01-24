export async function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.75
) {
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        res(image);
      };
      image.onerror = (e) => {
        URL.revokeObjectURL(url);
        rej(e);
      };
      image.src = url;
    });

    const scale = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(
        (b) => resolve(b),
        file.type === "image/png" ? "image/png" : "image/jpeg",
        quality
      )
    );

    if (!blob) return file;
    return new File([blob], file.name, { type: blob.type });
  } catch (err) {
    // fallback: return original file
    return file;
  }
}
