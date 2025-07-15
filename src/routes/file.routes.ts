import express from 'express';
import multer from 'multer';
import {
  uploadFile,
  getFile,
  updateFile,
  deleteFile,
} from '../controller/file.controller';
import isAuthenticated from '../middleware/isAuthenticated';
const router = express.Router();
const upload = multer({ dest: 'uploads/' });
router.use(isAuthenticated)
router.post('/upload', upload.single('file'), uploadFile);
router.get('/:id', getFile);
router.put('/:id', updateFile);
router.delete('/:id', deleteFile);
export default router;
