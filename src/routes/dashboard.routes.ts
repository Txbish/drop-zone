import express from 'express';
import {
  renderDashboard,
  getDashboardData,
  getFolderTree,
  searchFiles,
  getItemDetails
} from '../controller/dashboard.controller';
import isAuthenticated from '../middleware/isAuthenticated';
import { query, param } from 'express-validator';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// GET /dashboard - Render dashboard page
router.get('/', renderDashboard);

// GET /dashboard/data - Get dashboard data (folders and files)
router.get('/data', [
  query('folderId')
    .optional()
    .isUUID()
    .withMessage('Folder ID must be a valid UUID'),
  query('type')
    .optional()
    .isIn(['root', 'public', 'recent'])
    .withMessage('Type must be one of: root, public, recent')
], getDashboardData);

// GET /dashboard/tree - Get folder tree structure
router.get('/tree', getFolderTree);

// GET /dashboard/search - Search files and folders
router.get('/search', [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Search query must be between 1 and 255 characters')
], searchFiles);

// GET /dashboard/details/:type/:id - Get item details
router.get('/details/:type/:id', [
  param('type')
    .isIn(['file', 'folder'])
    .withMessage('Type must be either file or folder'),
  param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID')
], getItemDetails);

export default router;
