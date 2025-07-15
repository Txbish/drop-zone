import express from 'express';
import {
  getRootFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
} from '../controller/folder.controller';
import isAuthenticated from '../middleware/isAuthenticated';
import { body, param } from "express-validator";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// GET / - Get root folders (no validation needed)
router.get('/', getRootFolders);

// GET /:id - Get folder by ID
router.get('/:id', [
  param('id')
    .isUUID()
    .withMessage('Folder ID must be a valid UUID')
], getFolderById);

// POST / - Create new folder
router.post('/', [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Folder name cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('Folder name must be between 1 and 255 characters')
    .matches(/^[^<>:"/\\|?*]+$/)
    .withMessage('Folder name contains invalid characters'),
  body('parentId')
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage('Parent ID must be a valid UUID')
], createFolder);

// PUT /:id - Update folder
router.put('/:id', [
  param('id')
    .isUUID()
    .withMessage('Folder ID must be a valid UUID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Folder name cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('Folder name must be between 1 and 255 characters')
    .matches(/^[^<>:"/\\|?*]+$/)
    .withMessage('Folder name contains invalid characters'),
  body('parentId')
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage('Parent ID must be a valid UUID'),
  body('folderId')
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage('Folder ID must be a valid UUID')
], updateFolder);

// DELETE /:id - Delete folder
router.delete('/:id', [
  param('id')
    .isUUID()
    .withMessage('Folder ID must be a valid UUID')
], deleteFolder);

export default router;
