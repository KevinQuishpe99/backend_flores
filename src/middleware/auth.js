import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        imagen: true,
        rol: true,
        activo: true,
      },
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no válido o inactivo' });
    }

    req.user = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    next();
  };
};

