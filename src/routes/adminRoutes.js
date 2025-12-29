import express from 'express';
import {
  createUsuario,
  getUsuarios,
  getUsuarioById,
  updateUsuario,
  deleteUsuario,
  getEstadisticas,
  getEmpleados,
  getGerentes,
  actualizarPreciosMasivo,
} from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

router.post('/usuarios', createUsuario);
router.get('/usuarios', getUsuarios);
router.get('/usuarios/:id', getUsuarioById);
router.put('/usuarios/:id', updateUsuario);
router.delete('/usuarios/:id', deleteUsuario);
router.get('/estadisticas', getEstadisticas);
router.get('/empleados', getEmpleados);
router.get('/gerentes', getGerentes);
router.post('/arreglos/actualizar-precios', actualizarPreciosMasivo);

export default router;

