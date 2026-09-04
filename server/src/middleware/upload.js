/**
 * middleware/upload.js — image uploads for posts, avatars, and event covers.
 *
 * Development stores files on local disk under `server/uploads` and serves them
 * from `/uploads`. Production should swap this for object storage (S3/Cloudinary);
 * only this file needs to change.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

fs.mkdirSync(env.uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.uploadPath),
  filename: (req, file, cb) => {
    // Never trust the client filename — generate our own.
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `${unique}${EXTENSIONS[file.mimetype] || path.extname(file.originalname) || ''}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    cb(ApiError.badRequest('Only JPG, PNG, WebP, or GIF images are allowed'));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
});

/** Accepts an optional single image field and exposes its public URL. */
function singleImage(field = 'image') {
  const handler = upload.single(field);
  return (req, res, next) =>
    handler(req, res, (err) => {
      if (err) return next(err);
      if (req.file) req.uploadedImageUrl = `/uploads/${req.file.filename}`;
      return next();
    });
}

module.exports = { upload, singleImage, ALLOWED_MIME };
