import express from 'express';
import multer from 'multer';
import {
  uploadFile,
  getFile,
  updateFile,
  deleteFile,
  getFileInfo
} from '../controller/file.controller';
import isAuthenticated from '../middleware/isAuthenticated';
import { body, param } from 'express-validator';
import storage from "../config/cloudinaryConfig"

const router = express.Router();

// Configure multer with Cloudinary storage
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  }
});

router.use(isAuthenticated);

// POST /upload - Upload a file
router.post('/upload', 
  upload.single('file'),
  [
    body('folderId')
      .optional({ checkFalsy: true }) // This will treat empty strings as undefined
      .isUUID()
      .withMessage('Folder ID must be a valid UUID'),
    body('isPublic')
      .optional()
      .customSanitizer((value) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
      })
      .isBoolean()
      .withMessage('isPublic must be a boolean value')
  ],
  uploadFile
);

// GET /:id - Download a file
router.get('/:id', [
  param('id')
    .isUUID()
    .withMessage('File ID must be a valid UUID')
], getFile);

// GET /:id/info - Get file information without downloading
router.get('/:id/info', [
  param('id')
    .isUUID()
    .withMessage('File ID must be a valid UUID')
], getFileInfo);

router.put('/:id', [
  param('id')
    .isUUID()
    .withMessage('File ID must be a valid UUID'),
  body('originalName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Original name must be between 1 and 255 characters'),
  body('folderId')
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage('Folder ID must be a valid UUID'),
  body('isPublic')
    .optional()
    .customSanitizer((value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    })
    .isBoolean()
    .withMessage('isPublic must be a boolean value')
], updateFile);

// DELETE /:id - Delete a file
router.delete('/:id', [
  param('id')
    .isUUID()
    .withMessage('File ID must be a valid UUID')
], deleteFile);

export default router;
