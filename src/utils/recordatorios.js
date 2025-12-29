import { crearNotificacion } from '../controllers/notificacionController.js';
import prisma from '../config/database.js';

// Función para verificar y crear recordatorios de entrega
export const verificarRecordatorios = async () => {
  try {
    const ahora = new Date();
    const unaHoraDespues = new Date(ahora.getTime() + 60 * 60 * 1000); // 1 hora después
    const unDiaDespues = new Date(ahora.getTime() + 24 * 60 * 60 * 1000); // 1 día después

    // Pedidos que se entregan en 1 hora
    const pedidosUrgentes = await prisma.pedido.findMany({
      where: {
        estado: {
          in: ['ASIGNADO', 'EN_PROCESO'],
        },
        horaEntrega: {
          gte: ahora,
          lte: unaHoraDespues,
        },
      },
      include: {
        empleado: {
          select: { id: true },
        },
        cliente: {
          select: { id: true, nombre: true },
        },
      },
    });

    // Pedidos que se entregan mañana
    const pedidosManana = await prisma.pedido.findMany({
      where: {
        estado: {
          in: ['ASIGNADO', 'EN_PROCESO'],
        },
        horaEntrega: {
          gte: unDiaDespues,
          lte: new Date(unDiaDespues.getTime() + 60 * 60 * 1000), // Dentro de 1 hora del día siguiente
        },
      },
      include: {
        empleado: {
          select: { id: true },
        },
        cliente: {
          select: { id: true, nombre: true },
        },
      },
    });

    // Crear notificaciones para empleados
    for (const pedido of pedidosUrgentes) {
      if (pedido.empleado?.id) {
        await crearNotificacion(
          pedido.empleado.id,
          'RECORDATORIO_ENTREGA',
          '⚠️ Entrega Urgente',
          `El pedido de ${pedido.cliente.nombre} se entrega en menos de 1 hora: ${new Date(pedido.horaEntrega).toLocaleString('es-ES')}`,
          pedido.id
        );
      }
    }

    for (const pedido of pedidosManana) {
      if (pedido.empleado?.id) {
        await crearNotificacion(
          pedido.empleado.id,
          'RECORDATORIO_ENTREGA',
          'Recordatorio de Entrega',
          `El pedido de ${pedido.cliente.nombre} se entrega mañana: ${new Date(pedido.horaEntrega).toLocaleString('es-ES')}`,
          pedido.id
        );
      }
    }

    console.log(`✅ Recordatorios verificados: ${pedidosUrgentes.length} urgentes, ${pedidosManana.length} para mañana`);
  } catch (error) {
    console.error('Error al verificar recordatorios:', error);
  }
};

