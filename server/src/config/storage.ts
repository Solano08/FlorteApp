import multer from 'multer';

// Usamos memoryStorage para subir a Cloudinary en lugar de disco local
const memoryStorage = multer.memoryStorage();

export const avatarUpload = multer({
  storage: memoryStorage,
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

export const coverUpload = multer({
  storage: memoryStorage,
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

export const communityIconUpload = multer({
  storage: memoryStorage,
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

export const communityCoverUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 8 * 1024 * 1024 // 8MB
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Solo se permiten imágenes'));
      return;
    }
    cb(null, true);
  }
});

export const projectCoverUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 8 * 1024 * 1024 // 8MB
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Solo se permiten imágenes'));
      return;
    }
    cb(null, true);
  }
});
