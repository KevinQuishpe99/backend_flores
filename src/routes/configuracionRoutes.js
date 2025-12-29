import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  getConfiguraciones,
  getConfiguracionesPublic,
  getConfiguracion,
  setConfiguracion,
  updateTema,
  deleteConfiguracion
} from '../controllers/configuracionController.js';

const router = express.Router();

// Rutas públicas para obtener configuraciones (para el frontend)
router.get('/all', getConfiguracionesPublic);
router.get('/:clave', getConfiguracion);

// Rutas protegidas (solo admin)
router.post('/', authenticate, requireRole('ADMIN'), upload.single('archivo'), setConfiguracion);
router.put('/tema', authenticate, requireRole('ADMIN'), upload.fields([{ name: 'logo', maxCount: 1 }]), updateTema);
router.delete('/:clave', authenticate, requireRole('ADMIN'), deleteConfiguracion);

export default router;

