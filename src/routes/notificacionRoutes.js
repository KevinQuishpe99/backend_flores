import express from 'express';
import {
  getNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  getNotificacionesNoLeidas,
} from '../controllers/notificacionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getNotificaciones);
router.get('/no-leidas', getNotificacionesNoLeidas);
router.put('/:id/leida', marcarLeida);
router.put('/todas/leidas', marcarTodasLeidas);

export default router;

