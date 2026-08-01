const COMPRESSIBLE_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

function canUseCanvasCompression() {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof File !== "undefined" &&
    typeof URL !== "undefined"
  );
}

function isCompressibleImage(file) {
  const type = file?.type || "";
  return type.startsWith("image/") || COMPRESSIBLE_IMAGE_EXTENSIONS.test(file?.name || "");
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image"));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

function compressedName(name = "document") {
  const base = name.replace(/\.[^.]+$/, "") || "document";
  return `${base}.jpg`;
}

export function formatFileSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export async function prepareUploadFile(file, options = {}) {
  if (!file || !isCompressibleImage(file) || !canUseCanvasCompression()) {
    return { file, compressed: false, originalSize: file?.size || 0 };
  }

  const {
    maxWidth = 2400,
    maxHeight = 2400,
    quality = 0.82,
  } = options;

  try {
    const image = await loadImage(file);
    const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (!blob || blob.size >= file.size) {
      return { file, compressed: false, originalSize: file.size };
    }

    return {
      file: new File([blob], compressedName(file.name), {
        type: "image/jpeg",
        lastModified: file.lastModified,
      }),
      compressed: true,
      originalSize: file.size,
    };
  } catch {
    return { file, compressed: false, originalSize: file.size };
  }
}
