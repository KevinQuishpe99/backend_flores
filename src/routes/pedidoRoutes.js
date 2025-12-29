import express from 'express';
import {
  getPedidos,
  getPedidoById,
  createPedido,
  updatePedido,
  getPedidosPendientes,
} from '../controllers/pedidoController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/pendientes', authenticate, requireRole('GERENTE', 'ADMIN'), getPedidosPendientes);
router.get('/', authenticate, getPedidos);
router.get('/:id', authenticate, getPedidoById);
router.post(
  '/',
  authenticate,
  requireRole('CLIENTE'),
  upload.fields([
    { name: 'imagenReferencia', maxCount: 1 },
    { name: 'comprobantePago', maxCount: 1 },
  ]),
  createPedido
);
router.put(
  '/:id', 
  authenticate, 
  upload.fields([
    { name: 'comprobanteExtras', maxCount: 1 },
  ]),
  updatePedido
);

export default router;

