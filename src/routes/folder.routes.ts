import express from 'express';
import {
  getRootFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
} from '../controller/folder.controller';
import isAuthenticated from '../middleware/isAuthenticated';
const router = express.Router();
router.use(isAuthenticated);
router.get('/', getRootFolders);
router.get('/:id', getFolderById);
router.post('/', createFolder);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);

export default router;
