import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { BadRequestError } from '../utils/errors';

const MAGIC_BYTES: Record<string, [number[], number?]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
};

const EXTENSION_MAP: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg', '.jpe'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

function checkMagicBytes(filePath: string, mimeType: string): boolean {
  const expectedBytes = MAGIC_BYTES[mimeType];
  if (!expectedBytes) return false;
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(expectedBytes[0].length);
  fs.readSync(fd, buf, 0, expectedBytes[0].length, 0);
  fs.closeSync(fd);
  return expectedBytes[0].every((byte, i) => buf[i] === byte);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = Object.keys(MAGIC_BYTES);
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new BadRequestError('Invalid file type. Allowed: JPEG, PNG, GIF, WebP, PDF'));
  }
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = EXTENSION_MAP[file.mimetype];
  if (!allowedExts.includes(ext)) {
    return cb(new BadRequestError(`File extension "${ext}" does not match MIME type "${file.mimetype}"`));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

export function validateFileMagicBytes(filePath: string, mimeType: string): void {
  if (!checkMagicBytes(filePath, mimeType)) {
    fs.unlinkSync(filePath);
    throw new BadRequestError('File content does not match declared type');
  }
}
