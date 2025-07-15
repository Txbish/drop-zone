import express from 'express';
import { body, param } from 'express-validator';
import {
  createFolderShare,
  getUserShares,
  deactivateShare,
  extendShare,
  getSharedFolder,
  validateCreateShare,
  validateShareToken,
  validateExtendShare
} from '../controller/share.controller';
import isAuthenticated from '../middleware/isAuthenticated';

const router = express.Router();

// Create a folder share (authenticated)
router.post(
  '/create',
  isAuthenticated,
  validateCreateShare,
  createFolderShare
);

// Get user's shares (authenticated)
router.get(
  '/my-shares',
  isAuthenticated,
  getUserShares
);

// Deactivate a share (authenticated)
router.patch(
  '/deactivate/:shareToken',
  isAuthenticated,
  validateShareToken,
  deactivateShare
);

// Extend a share (authenticated)
router.patch(
  '/extend/:shareToken',
  isAuthenticated,
  validateShareToken,
  validateExtendShare,
  extendShare
);

// Public route to access shared folder (no authentication required)
router.get(
  '/:shareToken',
  validateShareToken,
  getSharedFolder
);

export default router;
