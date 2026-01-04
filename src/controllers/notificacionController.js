import prisma from '../config/database.js';

export const getNotificaciones = async (req, res) => {
  try {
    const notificaciones = await prisma.notificacion.findMany({
      where: { usuarioId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50, // Últimas 50 notificaciones
    });
    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    console.error('Error completo:', JSON.stringify(error, null, 2));
    
    // Si es un error de Prisma, dar más detalles
    if (error.code) {
      console.error('Código de error Prisma:', error.code);
    }
    
    res.status(500).json({ 
      error: 'Error al obtener notificaciones',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        code: error.code 
      })
    });
  }
};

export const marcarLeida = async (req, res) => {
  try {
    const { id } = req.params;

    const notificacion = await prisma.notificacion.update({
      where: { id },
      data: { leida: true },
    });

    res.json(notificacion);
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ error: 'Error al marcar notificación' });
  }
};

export const marcarTodasLeidas = async (req, res) => {
  try {
    await prisma.notificacion.updateMany({
      where: { usuarioId: req.user.id, leida: false },
      data: { leida: true },
    });

    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones:', error);
    res.status(500).json({ error: 'Error al marcar notificaciones' });
  }
};

export const getNotificacionesNoLeidas = async (req, res) => {
  try {
    const count = await prisma.notificacion.count({
      where: { usuarioId: req.user.id, leida: false },
    });
    res.json({ count });
  } catch (error) {
    console.error('Error al contar notificaciones:', error);
    res.status(500).json({ error: 'Error al contar notificaciones' });
  }
};

// Función helper para crear notificaciones (exportada para uso en otros controladores)
export const crearNotificacion = async (usuarioId, tipo, titulo, mensaje, pedidoId = null) => {
  try {
    const notificacion = await prisma.notificacion.create({
      data: {
        usuarioId,
        tipo,
        titulo,
        mensaje,
        pedidoId,
      },
    });
    return notificacion;
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return null;
  }
};

