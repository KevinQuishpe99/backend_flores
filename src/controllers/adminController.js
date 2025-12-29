import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';

export const createUsuario = async (req, res) => {
  try {
    const { email, password, nombre, apellido, rol, telefono, direccion } = req.body;

    if (!email || !nombre) {
      return res.status(400).json({ error: 'Email y nombre son requeridos' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña si se proporciona
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const usuario = await prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        apellido,
        rol: rol || 'CLIENTE',
        telefono,
        direccion,
        activo: true,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        imagen: true,
        rol: true,
        telefono: true,
        direccion: true,
        activo: true,
        createdAt: true,
      },
    });

    res.status(201).json(usuario);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

export const getUsuarios = async (req, res) => {
  try {
    const { rol, activo } = req.query;
    const where = {};

    if (rol) {
      where.rol = rol;
    }
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        imagen: true,
        rol: true,
        telefono: true,
        direccion: true,
        activo: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

export const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        imagen: true,
        rol: true,
        telefono: true,
        direccion: true,
        activo: true,
        createdAt: true,
        pedidos: {
          select: {
            id: true,
            estado: true,
            valorAcordado: true,
            createdAt: true,
          },
        },
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, rol, telefono, direccion, activo } = req.body;

    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (apellido !== undefined) updateData.apellido = apellido;
    if (rol !== undefined) updateData.rol = rol;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (direccion !== undefined) updateData.direccion = direccion;
    if (activo !== undefined) updateData.activo = activo === 'true' || activo === true;

    const usuario = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        imagen: true,
        rol: true,
        telefono: true,
        direccion: true,
        activo: true,
        createdAt: true,
      },
    });

    res.json(usuario);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar el propio usuario admin
    if (id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    await prisma.usuario.delete({
      where: { id },
    });

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

export const getEstadisticas = async (req, res) => {
  try {
    const totalUsuarios = await prisma.usuario.count();
    const totalPedidos = await prisma.pedido.count();
    const pedidosPendientes = await prisma.pedido.count({
      where: { estado: 'PENDIENTE' },
    });
    const pedidosCompletados = await prisma.pedido.count({
      where: { estado: 'COMPLETADO' },
    });

    const ingresosTotales = await prisma.pedido.aggregate({
      where: { estado: 'COMPLETADO' },
      _sum: { valorAcordado: true },
    });

    res.json({
      totalUsuarios,
      totalPedidos,
      pedidosPendientes,
      pedidosCompletados,
      ingresosTotales: ingresosTotales._sum.valorAcordado || 0,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

export const getEmpleados = async (req, res) => {
  try {
    const empleados = await prisma.usuario.findMany({
      where: { rol: 'EMPLEADO', activo: true },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        activo: true,
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(empleados);
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
};

export const getGerentes = async (req, res) => {
  try {
    const gerentes = await prisma.usuario.findMany({
      where: { rol: 'GERENTE', activo: true },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        activo: true,
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(gerentes);
  } catch (error) {
    console.error('Error al obtener gerentes:', error);
    res.status(500).json({ error: 'Error al obtener gerentes' });
  }
};

export const actualizarPreciosMasivo = async (req, res) => {
  try {
    const { porcentaje, soloDisponibles } = req.body;

    if (!porcentaje || porcentaje <= 0) {
      return res.status(400).json({ error: 'El porcentaje debe ser mayor a 0' });
    }

    // Construir el where clause
    const where = {};
    if (soloDisponibles === true || soloDisponibles === 'true') {
      where.disponible = true;
    }

    // Obtener todos los arreglos que cumplen las condiciones
    const arreglos = await prisma.arreglo.findMany({
      where,
      select: { id: true, costo: true, nombre: true },
    });

    if (arreglos.length === 0) {
      return res.status(400).json({ error: 'No hay arreglos para actualizar' });
    }

    // Calcular el factor de aumento (ej: 10% = 1.10, 15% = 1.15)
    const factor = 1 + (porcentaje / 100);

    // Actualizar todos los arreglos
    const updates = arreglos.map(arreglo => {
      const nuevoPrecio = Math.round(arreglo.costo * factor * 100) / 100; // Redondear a 2 decimales
      return prisma.arreglo.update({
        where: { id: arreglo.id },
        data: { costo: nuevoPrecio },
      });
    });

    await Promise.all(updates);

    console.log(`✅ Precios actualizados: ${arreglos.length} arreglos con ${porcentaje}% de aumento`);

    res.json({
      message: `Precios actualizados exitosamente`,
      arreglosActualizados: arreglos.length,
      porcentajeAplicado: porcentaje,
      detalles: arreglos.map(a => ({
        id: a.id,
        nombre: a.nombre,
        precioAnterior: a.costo,
        precioNuevo: Math.round(a.costo * factor * 100) / 100,
      })),
    });
  } catch (error) {
    console.error('Error al actualizar precios masivamente:', error);
    res.status(500).json({ error: 'Error al actualizar precios masivamente' });
  }
};

