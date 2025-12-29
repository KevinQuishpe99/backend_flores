import prisma from '../config/database.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import fs from 'fs/promises';
import { crearNotificacion } from './notificacionController.js';

export const getPedidos = async (req, res) => {
  try {
    const { estado, clienteId } = req.query;
    const where = {};

    // Si es cliente, solo ver sus pedidos
    if (req.user.rol === 'CLIENTE') {
      where.clienteId = req.user.id;
    } else if (clienteId && (req.user.rol === 'ADMIN' || req.user.rol === 'GERENTE')) {
      where.clienteId = clienteId;
    }

    // Si es empleado, ver solo sus pedidos asignados
    if (req.user.rol === 'EMPLEADO') {
      where.empleadoId = req.user.id;
    }

    // Gerente y Admin pueden ver todos los pedidos
    // (no se agrega filtro adicional)

    if (estado) {
      where.estado = estado;
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            direccion: true,
          },
        },
        arreglo: {
          select: {
            id: true,
            nombre: true,
            imagen: true,
            costo: true,
          },
        },
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

export const getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            direccion: true,
          },
        },
        arreglo: true,
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
          },
        },
      },
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Verificar permisos
    if (req.user.rol === 'CLIENTE' && pedido.clienteId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para ver este pedido' });
    }

    // Asegurar que historialEstado sea un array
    if (!pedido.historialEstado || !Array.isArray(pedido.historialEstado)) {
      pedido.historialEstado = [];
    }

    // Obtener información del usuario que verificó (si existe)
    if (pedido.verificadaPor) {
      const verificador = await prisma.usuario.findUnique({
        where: { id: pedido.verificadaPor },
        select: { nombre: true, apellido: true },
      });
      if (verificador) {
        pedido.verificadaPorNombre = `${verificador.nombre} ${verificador.apellido || ''}`.trim();
      }
    }

    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
};

export const createPedido = async (req, res) => {
  try {
    const { arregloId, horaEntrega, valorAcordado, notas, extras } = req.body;

    // Validar que se proporcione un arreglo (ahora es requerido)
    if (!arregloId) {
      return res.status(400).json({ error: 'Se requiere un arreglo para crear el pedido' });
    }

    // Obtener el arreglo para guardar su precio histórico
    const arreglo = await prisma.arreglo.findUnique({
      where: { id: arregloId },
      select: { costo: true },
    });

    if (!arreglo) {
      return res.status(404).json({ error: 'Arreglo no encontrado' });
    }

    let imagenReferencia = null;
    let comprobantePago = null;

    // Verificar configuración de Cloudinary
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || '';
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || '';
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';
    const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim() || '';
    
    const cloudinaryConfigured = 
      (cloudinaryUrl && cloudinaryUrl !== 'placeholder_temporal') ||
      (cloudName && 
       cloudName !== 'placeholder_temporal' &&
       cloudName !== '' &&
       apiKey &&
       apiKey !== 'placeholder_temporal' &&
       apiKey !== '' &&
       apiSecret &&
       apiSecret !== 'placeholder_temporal' &&
       apiSecret !== '');

    // Procesar imagen de referencia si existe
    if (req.files?.imagenReferencia) {
      if (cloudinaryConfigured) {
        imagenReferencia = await uploadToCloudinary(req.files.imagenReferencia[0].path);
        await fs.unlink(req.files.imagenReferencia[0].path);
      } else {
        await fs.unlink(req.files.imagenReferencia[0].path);
        return res.status(500).json({ 
          error: 'Cloudinary no está configurado. No se pueden subir imágenes.' 
        });
      }
    }

    // Procesar comprobante de pago si existe
    if (req.files?.comprobantePago) {
      if (cloudinaryConfigured) {
        comprobantePago = await uploadToCloudinary(req.files.comprobantePago[0].path);
        await fs.unlink(req.files.comprobantePago[0].path);
      } else {
        await fs.unlink(req.files.comprobantePago[0].path);
        return res.status(500).json({ 
          error: 'Cloudinary no está configurado. No se pueden subir imágenes.' 
        });
      }
    }

    const pedido = await prisma.pedido.create({
      data: {
        clienteId: req.user.id,
        arregloId: arregloId,
        imagenReferencia,
        horaEntrega: new Date(horaEntrega),
        valorAcordado: parseFloat(valorAcordado),
        precioArreglo: arreglo.costo, // Guardar precio histórico del arreglo
        extras: extras ? parseFloat(extras) : 0,
        comprobantePago,
        notas,
        estado: 'PENDIENTE',
        historialEstado: [{
          estado: 'PENDIENTE',
          fecha: new Date().toISOString(),
          usuario: req.user.nombre,
        }],
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
          },
        },
        arreglo: true,
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
          },
        },
      },
    });

    // Crear notificación para gerentes y admin
    try {
      const gerentes = await prisma.usuario.findMany({
        where: { rol: 'GERENTE', activo: true },
        select: { id: true },
      });

      const admins = await prisma.usuario.findMany({
        where: { rol: 'ADMIN', activo: true },
        select: { id: true },
      });

      // Notificar a gerentes
      for (const gerente of gerentes) {
        await crearNotificacion(
          gerente.id,
          'NUEVO_PEDIDO',
          'Nuevo Pedido Recibido',
          `El cliente ${req.user.nombre} ha realizado un nuevo pedido. Revisa la transferencia.`,
          pedido.id
        );
      }

      // Notificar a admins
      for (const admin of admins) {
        await crearNotificacion(
          admin.id,
          'NUEVO_PEDIDO',
          'Nuevo Pedido Recibido',
          `El cliente ${req.user.nombre} ha realizado un nuevo pedido. Revisa la transferencia.`,
          pedido.id
        );
      }
    } catch (notifError) {
      console.error('Error al crear notificaciones:', notifError);
      // No fallar el pedido si fallan las notificaciones
    }

    res.status(201).json(pedido);
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ error: 'Error al crear pedido' });
  }
};

export const updatePedido = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await prisma.pedido.findUnique({
      where: { id },
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const updateData = {};
    const { empleadoId, extras, comprobanteExtras, estado, transferenciaVerificada, notas, notasCliente, prioridad } = req.body;
    
    // Actualizar historial de estados si cambia el estado
    if (estado && estado !== pedido.estado) {
      const historialActual = Array.isArray(pedido.historialEstado) ? pedido.historialEstado : [];
      updateData.historialEstado = [
        ...historialActual,
        {
          estado: estado,
          fecha: new Date().toISOString(),
          usuario: req.user.nombre,
        }
      ];
    }

    // Admin puede cambiar cualquier cosa, incluyendo asignar empleados
    if (req.user.rol === 'ADMIN') {
      if (estado) updateData.estado = estado;
      if (empleadoId) {
        // Verificar que el empleado existe
        const empleado = await prisma.usuario.findUnique({
          where: { id: empleadoId },
          select: { id: true, rol: true },
        });
        if (!empleado) {
          return res.status(400).json({ error: 'Empleado no encontrado' });
        }
        if (empleado.rol !== 'EMPLEADO' && empleado.rol !== 'GERENTE' && empleado.rol !== 'ADMIN') {
          return res.status(400).json({ error: 'El usuario especificado no puede ser asignado' });
        }
        updateData.empleadoId = empleadoId;
        if (pedido.estado === 'TRANSFERENCIA_VERIFICADA' || pedido.estado === 'PENDIENTE') {
          updateData.estado = 'ASIGNADO';
        }
        
        // Notificar al empleado asignado
        try {
          await crearNotificacion(
            empleadoId,
            'PEDIDO_ASIGNADO',
            'Nuevo Pedido Asignado',
            `Te han asignado un nuevo pedido. Entrega: ${new Date(pedido.horaEntrega).toLocaleString('es-ES')}`,
            pedido.id
          );
        } catch (notifError) {
          console.error('Error al crear notificación de asignación:', notifError);
        }
      }
      if (extras !== undefined) updateData.extras = parseFloat(extras);
      if (notas !== undefined) updateData.notas = notas;
      if (prioridad !== undefined) updateData.prioridad = parseInt(prioridad);
      if (transferenciaVerificada !== undefined) {
        updateData.transferenciaVerificada = transferenciaVerificada === 'true' || transferenciaVerificada === true;
        updateData.verificadaPor = req.user.id;
        if (updateData.transferenciaVerificada && !updateData.estado) {
          updateData.estado = 'TRANSFERENCIA_VERIFICADA';
        }
      }
    }
    // Gerente puede verificar transferencias, asignar empleados y cambiar estado
    else if (req.user.rol === 'GERENTE') {
      if (estado) updateData.estado = estado;
      if (empleadoId) {
        // Verificar que el empleado existe
        const empleado = await prisma.usuario.findUnique({
          where: { id: empleadoId },
          select: { id: true, rol: true },
        });
        if (!empleado || empleado.rol !== 'EMPLEADO') {
          return res.status(400).json({ error: 'El usuario especificado no es un empleado' });
        }
        updateData.empleadoId = empleadoId;
        if (pedido.estado === 'TRANSFERENCIA_VERIFICADA') {
          updateData.estado = 'ASIGNADO';
        }
        
        // Notificar al empleado asignado
        try {
          await crearNotificacion(
            empleadoId,
            'PEDIDO_ASIGNADO',
            'Nuevo Pedido Asignado',
            `Te han asignado un nuevo pedido. Entrega: ${new Date(pedido.horaEntrega).toLocaleString('es-ES')}`,
            pedido.id
          );
        } catch (notifError) {
          console.error('Error al crear notificación de asignación:', notifError);
        }
      }
      // Gerente puede verificar transferencias
      if (transferenciaVerificada !== undefined) {
        updateData.transferenciaVerificada = transferenciaVerificada === 'true' || transferenciaVerificada === true;
        updateData.verificadaPor = req.user.id;
        if (updateData.transferenciaVerificada && !updateData.estado) {
          updateData.estado = 'TRANSFERENCIA_VERIFICADA';
        }
      }
      if (notas !== undefined) updateData.notas = notas;
      if (prioridad !== undefined) updateData.prioridad = parseInt(prioridad);
    }
    // Empleado puede cambiar estado de sus pedidos asignados
    else if (req.user.rol === 'EMPLEADO') {
      if (pedido.empleadoId !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permisos para editar este pedido' });
      }
      if (estado && ['EN_PROCESO', 'COMPLETADO'].includes(estado)) {
        updateData.estado = estado;
      }
      if (notas !== undefined) updateData.notas = notas;
      if (prioridad !== undefined) updateData.prioridad = parseInt(prioridad);
    }
    // Cliente puede agregar extras y comprobantes
    else if (req.user.rol === 'CLIENTE') {
      if (pedido.clienteId !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permisos para editar este pedido' });
      }
      if (extras !== undefined) updateData.extras = parseFloat(extras);
      if (notas !== undefined) updateData.notasCliente = notas;
      
      // Procesar comprobante de extras si existe
      if (req.files?.comprobanteExtras) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || '';
        const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || '';
        const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';
        const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim() || '';
        
        const cloudinaryConfigured = 
          (cloudinaryUrl && cloudinaryUrl !== 'placeholder_temporal') ||
          (cloudName && cloudName !== 'placeholder_temporal' && apiKey && apiKey !== 'placeholder_temporal' && apiSecret && apiSecret !== 'placeholder_temporal');
        
        if (cloudinaryConfigured) {
          const comprobanteUrl = await uploadToCloudinary(req.files.comprobanteExtras[0].path);
          await fs.unlink(req.files.comprobanteExtras[0].path);
          // Agregar a la lista de comprobantes de extras
          const comprobantesActuales = pedido.comprobantesExtras || [];
          updateData.comprobantesExtras = [...comprobantesActuales, comprobanteUrl];
        } else {
          await fs.unlink(req.files.comprobanteExtras[0].path);
          return res.status(500).json({ error: 'Cloudinary no está configurado' });
        }
      }
    }

    const pedidoActualizado = await prisma.pedido.update({
      where: { id },
      data: updateData,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        arreglo: true,
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
          },
        },
      },
    });

    res.json(pedidoActualizado);
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ error: 'Error al actualizar pedido' });
  }
};

export const getPedidosPendientes = async (req, res) => {
  try {
    // Solo gerente y admin pueden ver pedidos pendientes
    if (req.user.rol !== 'GERENTE' && req.user.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos para ver pedidos pendientes' });
    }

    const pedidos = await prisma.pedido.findMany({
      where: {
        estado: {
          in: ['PENDIENTE', 'TRANSFERENCIA_VERIFICADA'],
        },
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
          },
        },
        arreglo: true,
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos pendientes:', error);
    res.status(500).json({ error: 'Error al obtener pedidos pendientes' });
  }
};

