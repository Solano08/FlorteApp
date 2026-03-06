import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

// "Root" suele ser una referencia errónea de Railway; el cloud_name debe ser el de Cloudinary (ej: dxxxxxx)
const isValidCloudName = (name: string) =>
  name.length >= 2 && !/^Root$/i.test(name) && /^[a-zA-Z0-9_-]+$/.test(name);

let cloudinaryReady = false;
if (cloudName && apiKey && apiSecret) {
  if (!isValidCloudName(cloudName)) {
    logger.warn(`CLOUDINARY_CLOUD_NAME inválido: "${cloudName}". Debe ser tu Cloud name real de cloudinary.com (ej: dxxxxxx). No uses "Root" ni referencias.`);
  } else {
    try {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });
      cloudinaryReady = true;
    } catch {
      cloudinaryReady = false;
    }
  }
}

export const isCloudinaryEnabled = (): boolean => cloudinaryReady;

export { cloudinary };
