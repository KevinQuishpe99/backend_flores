import express from 'express';
import {
  getTiposArreglo,
  createTipoArreglo,
  updateTipoArreglo,
  deleteTipoArreglo,
} from '../controllers/tipoArregloController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getTiposArreglo);
router.post('/', authenticate, requireRole('ADMIN', 'GERENTE'), createTipoArreglo);
router.put('/:id', authenticate, requireRole('ADMIN', 'GERENTE'), updateTipoArreglo);
router.delete('/:id', authenticate, requireRole('ADMIN', 'GERENTE'), deleteTipoArreglo);

export default router;

