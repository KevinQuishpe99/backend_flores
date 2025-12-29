import express from 'express';
import { register, login, googleLogin, getProfile, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, upload.single('imagen'), updateProfile);

export default router;

