import express from 'express';
import {
  getArreglos,
  getArregloById,
  createArreglo,
  updateArreglo,
  deleteArreglo,
} from '../controllers/arregloController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/', getArreglos);
router.get('/:id', getArregloById);
router.post('/', authenticate, requireRole('ADMIN', 'GERENTE', 'EMPLEADO'), upload.fields([
  { name: 'imagen', maxCount: 1 },
  { name: 'imagenAdicional_0', maxCount: 1 },
  { name: 'imagenAdicional_1', maxCount: 1 },
  { name: 'imagenAdicional_2', maxCount: 1 },
  { name: 'imagenAdicional_3', maxCount: 1 },
  { name: 'imagenAdicional_4', maxCount: 1 },
]), createArreglo);
router.put('/:id', authenticate, requireRole('ADMIN', 'GERENTE', 'EMPLEADO'), upload.fields([
  { name: 'imagen', maxCount: 1 },
  { name: 'imagenAdicional_0', maxCount: 1 },
  { name: 'imagenAdicional_1', maxCount: 1 },
  { name: 'imagenAdicional_2', maxCount: 1 },
  { name: 'imagenAdicional_3', maxCount: 1 },
  { name: 'imagenAdicional_4', maxCount: 1 },
]), updateArreglo);
router.delete('/:id', authenticate, requireRole('ADMIN', 'GERENTE', 'EMPLEADO'), deleteArreglo);

export default router;

