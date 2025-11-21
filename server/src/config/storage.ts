import fs from 'fs';
import path from 'path';
import multer from 'multer';

const rootUploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
const avatarDir = path.join(rootUploadsDir, 'avatars');
const coverDir = path.join(rootUploadsDir, 'covers');

for (const dir of [rootUploadsDir, avatarDir, coverDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

export const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Solo se permiten imágenes'));
      return;
    }
    cb(null, true);
  }
});

const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, coverDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

export const coverUpload = multer({
  storage: coverStorage,
  limits: {
    fileSize: 8 * 1024 * 1024 // 8MB
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Solo se permiten imagenes'));
      return;
    }
    cb(null, true);
  }
});
