"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedFileUpload = exports.feedMediaUpload = exports.coverUpload = exports.avatarUpload = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const rootUploadsDir = path_1.default.resolve(__dirname, '..', '..', 'uploads');
const avatarDir = path_1.default.join(rootUploadsDir, 'avatars');
const coverDir = path_1.default.join(rootUploadsDir, 'covers');
const feedMediaDir = path_1.default.join(rootUploadsDir, 'feed', 'media');
const feedFilesDir = path_1.default.join(rootUploadsDir, 'feed', 'files');
for (const dir of [rootUploadsDir, avatarDir, coverDir, feedMediaDir, feedFilesDir]) {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
}
const createStorage = (dir) => multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${timestamp}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
});
const avatarStorage = createStorage(avatarDir);
exports.avatarUpload = (0, multer_1.default)({
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
exports.coverUpload = (0, multer_1.default)({
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
exports.feedMediaUpload = (0, multer_1.default)({
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
exports.feedFileUpload = (0, multer_1.default)({
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
