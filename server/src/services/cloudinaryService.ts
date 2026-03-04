import fs from 'fs';
import path from 'path';
import streamifier from 'streamifier';
import { cloudinary, isCloudinaryEnabled } from '../config/cloudinary';
import { AppError } from '../utils/appError';

const FOLDER_PREFIX = 'florteapp';

const getFallbackUploadsDir = () =>
  path.resolve(__dirname, '..', '..', 'uploads');

/**
 * Sube una imagen desde un data URL (base64) a Cloudinary.
 * En desarrollo sin Cloudinary, guarda en disco local (solo para pruebas).
 */
const CLOUDINARY_TIMEOUT_MS = 45_000;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo de subida excedido')), ms)
    )
  ]);
};

export const uploadDataUrl = async (
  dataUrl: string,
  folder: string = 'feed'
): Promise<string> => {
  if (isCloudinaryEnabled()) {
    try {
      const uploadPromise = cloudinary.uploader.upload(dataUrl, {
        folder: `${FOLDER_PREFIX}/${folder}`,
        resource_type: 'auto'
      });
      const result = await withTimeout(uploadPromise, CLOUDINARY_TIMEOUT_MS);
      if (!result?.secure_url) throw new Error('Cloudinary no devolvió URL');
      return result.secure_url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new AppError(`Error al subir: ${msg}`, 502);
    }
  }
  // Fallback local (solo desarrollo): guardar en disco
  const match = dataUrl.match(/^data:(.*?);base64,(.+)$/);
  if (!match) throw new AppError('Formato de archivo invalido', 400);
  const mimeType = match[1] || 'application/octet-stream';
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const ext = mimeType.split('/')[1] || 'bin';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
  const dir = path.join(getFallbackUploadsDir(), folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
};

/**
 * Sube un buffer (archivo desde multer memory) a Cloudinary.
 * En desarrollo sin Cloudinary, guarda en disco local.
 */
export const uploadBuffer = async (
  buffer: Buffer,
  folder: string,
  options?: { mimetype?: string; filename?: string }
): Promise<string> => {
  if (isCloudinaryEnabled()) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${FOLDER_PREFIX}/${folder}`,
          resource_type: 'auto'
        },
        (err, result) => {
          if (err) reject(err);
          else if (result?.secure_url) resolve(result.secure_url);
          else reject(new Error('Cloudinary no devolvió URL'));
        }
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });
  }
  // Fallback local: guardar en disco
  const ext = options?.mimetype?.split('/')[1] || 'bin';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const dir = path.join(getFallbackUploadsDir(), folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
};
