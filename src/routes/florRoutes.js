import express from 'express';
import multer from 'multer';
import {
  getFlores,
  getFlorById,
  createFlor,
  updateFlor,
  deleteFlor,
} from '../controllers/florController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 5MB' });
    }
    return res.status(400).json({ error: `Error al subir archivo: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

router.get('/', getFlores);
router.get('/:id', getFlorById);
router.post('/', authenticate, requireRole('ADMIN'), upload.single('imagen'), handleMulterError, createFlor);
router.put('/:id', authenticate, requireRole('ADMIN'), upload.single('imagen'), handleMulterError, updateFlor);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteFlor);

export default router;

