/**
 * Comprime una imagen para reducir su tamaño antes de subirla.
 * Útil para historias, posts, etc. Evita 502 por payload grande o límites de Cloudinary.
 */
const MAX_DIMENSION = 1080;
const JPEG_QUALITY = 0.82;

export const compressImageForUpload = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      let w = width;
      let h = height;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          w = MAX_DIMENSION;
          h = Math.round((height * MAX_DIMENSION) / width);
        } else {
          h = MAX_DIMENSION;
          w = Math.round((width * MAX_DIMENSION) / height);
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo crear contexto de canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar la imagen'));
    };
    img.src = url;
  });
};
