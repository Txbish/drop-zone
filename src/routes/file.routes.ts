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
import storage from "../config/multerStorageConfig"

const router = express.Router();

// Configure multer with file size limits and file type restrictions
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Allow most common file types, block potentially dangerous ones
    const allowedMimes = [
      'image/',
      'text/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed',
      'audio/',
      'video/'
    ];
    
    const isAllowed = allowedMimes.some(mime => file.mimetype.startsWith(mime));
    
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

router.use(isAuthenticated);

// POST /upload - Upload a file
router.post('/upload', 
  upload.single('file'),
  [
    body('folderId')
      .optional()
      .isUUID()
      .withMessage('Folder ID must be a valid UUID'),
    body('isPublic')
      .optional()
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
    .optional()
    .isUUID()
    .withMessage('Folder ID must be a valid UUID'),
  body('isPublic')
    .optional()
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
