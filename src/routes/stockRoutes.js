import express from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  createStock,
  getStock,
  getStockStats,
  venderStock,
  updateStock,
  deleteStock,
} from '../controllers/stockController.js';

const router = express.Router();

// Configurar multer para subir archivos
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Rutas protegidas
router.use(authenticate);

// Obtener stock (Gerente, Empleado, Admin)
router.get('/', requireRole(['GERENTE', 'EMPLEADO', 'ADMIN']), getStock);

// Obtener estadísticas (Gerente, Admin)
router.get('/stats', requireRole(['GERENTE', 'ADMIN']), getStockStats);

// Crear stock (Gerente, Admin)
router.post('/', requireRole(['GERENTE', 'ADMIN']), upload.single('imagen'), createStock);

// Vender stock (Empleado, Gerente, Admin)
router.post(
  '/:id/vender',
  requireRole(['EMPLEADO', 'GERENTE', 'ADMIN']),
  upload.single('comprobantePago'),
  venderStock
);

// Actualizar stock (Gerente, Admin)
router.put('/:id', requireRole(['GERENTE', 'ADMIN']), updateStock);

// Eliminar stock (solo Admin)
router.delete('/:id', requireRole(['ADMIN']), deleteStock);

export default router;

