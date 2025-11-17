import fs from 'fs';
import path from 'path';
import multer from 'multer';

const rootUploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
const avatarDir = path.join(rootUploadsDir, 'avatars');
const coverDir = path.join(rootUploadsDir, 'covers');
const feedMediaDir = path.join(rootUploadsDir, 'feed', 'media');
const feedFilesDir = path.join(rootUploadsDir, 'feed', 'files');

for (const dir of [rootUploadsDir, avatarDir, coverDir, feedMediaDir, feedFilesDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const createStorage = (dir: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      cb(null, `${timestamp}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  });

const avatarStorage = createStorage(avatarDir);

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

const coverStorage = createStorage(coverDir);

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

const feedMediaStorage = createStorage(feedMediaDir);
const feedFileStorage = createStorage(feedFilesDir);

export const feedMediaUpload = multer({
  storage: feedMediaStorage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
      cb(new Error('Solo se permiten imagenes o videos'));
      return;
    }
    cb(null, true);
  }
});

export const feedFileUpload = multer({
  storage: feedFileStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(new Error('Usa multimedia para imagenes o videos'));
      return;
    }
    cb(null, true);
  }
});
