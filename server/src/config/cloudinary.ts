import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

let cloudinaryReady = false;
if (cloudName && apiKey && apiSecret) {
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

export const isCloudinaryEnabled = (): boolean => cloudinaryReady;

export { cloudinary };
