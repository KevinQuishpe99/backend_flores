import prisma from '../config/database.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import fs from 'fs/promises';

// Crear stock (solo Gerente y Admin)
export const createStock = async (req, res) => {
  try {
    const { arregloId, cantidad, precioVenta, notas } = req.body;

    if (!arregloId || !precioVenta) {
      return res.status(400).json({ error: 'Arreglo y precio de venta son requeridos' });
    }

    // Verificar que el arreglo existe
    const arreglo = await prisma.arreglo.findUnique({
      where: { id: arregloId },
    });

    if (!arreglo) {
      return res.status(404).json({ error: 'Arreglo no encontrado' });
    }

    const cantidadNum = parseInt(cantidad) || 1;

    // Procesar imagen si existe
    let imagenUrl = null;
    if (req.file) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || '';
      const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || '';
      const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';
      const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim() || '';
      
      const cloudinaryConfigured = 
        (cloudinaryUrl && cloudinaryUrl !== 'placeholder_temporal') ||
        (cloudName && cloudName !== 'placeholder_temporal' && apiKey && apiKey !== 'placeholder_temporal' && apiSecret && apiSecret !== 'placeholder_temporal');
      
      if (cloudinaryConfigured) {
        imagenUrl = await uploadToCloudinary(req.file.path);
        await fs.unlink(req.file.path);
      } else {
        if (req.file) await fs.unlink(req.file.path);
        return res.status(500).json({ error: 'Cloudinary no está configurado' });
      }
    }

    // Crear múltiples registros de stock si la cantidad es mayor a 1
    const stockItems = [];
    for (let i = 0; i < cantidadNum; i++) {
      const stockItem = await prisma.stock.create({
        data: {
          arregloId,
          precioVenta: parseFloat(precioVenta),
          estado: 'DISPONIBLE',
          creadoPorId: req.user.id,
          notas: notas || null,
          imagen: imagenUrl || null,
        },
        include: {
          arreglo: true,
          creadoPor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
      });
      stockItems.push(stockItem);
    }

    res.status(201).json({
      message: `Se crearon ${cantidadNum} ${cantidadNum === 1 ? 'artículo' : 'artículos'} en stock`,
      stock: stockItems,
    });
  } catch (error) {
    console.error('Error al crear stock:', error);
    res.status(500).json({ error: 'Error al crear stock' });
  }
};

// Obtener todo el stock (Gerente, Empleado, Admin)
export const getStock = async (req, res) => {
  try {
    const { estado, arregloId } = req.query;

    const where = {};
    if (estado) {
      where.estado = estado;
    }
    if (arregloId) {
      where.arregloId = arregloId;
    }

    const stock = await prisma.stock.findMany({
      where,
      include: {
        arreglo: {
          include: {
            tipo: true,
          },
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        vendidoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(stock);
  } catch (error) {
    console.error('Error al obtener stock:', error);
    res.status(500).json({ error: 'Error al obtener stock' });
  }
};

// Obtener estadísticas de stock
export const getStockStats = async (req, res) => {
  try {
    const total = await prisma.stock.count();
    const disponible = await prisma.stock.count({ where: { estado: 'DISPONIBLE' } });
    const vendido = await prisma.stock.count({ where: { estado: 'VENDIDO' } });
    const reservado = await prisma.stock.count({ where: { estado: 'RESERVADO' } });

    // Valor total del stock disponible
    const stockDisponible = await prisma.stock.findMany({
      where: { estado: 'DISPONIBLE' },
      select: { precioVenta: true },
    });
    const valorTotalDisponible = stockDisponible.reduce((sum, item) => sum + item.precioVenta, 0);

    // Ventas del mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const ventasMes = await prisma.stock.findMany({
      where: {
        estado: 'VENDIDO',
        fechaVenta: {
          gte: inicioMes,
        },
      },
      select: { precioVenta: true },
    });
    const totalVentasMes = ventasMes.reduce((sum, item) => sum + item.precioVenta, 0);

    res.json({
      total,
      disponible,
      vendido,
      reservado,
      valorTotalDisponible,
      totalVentasMes,
      cantidadVentasMes: ventasMes.length,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de stock:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Vender stock (Empleado, Gerente, Admin)
export const venderStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { metodoPago, comprobantePago, notas } = req.body;

    if (!metodoPago) {
      return res.status(400).json({ error: 'Método de pago es requerido' });
    }

    const stock = await prisma.stock.findUnique({
      where: { id },
      include: { arreglo: true },
    });

    if (!stock) {
      return res.status(404).json({ error: 'Artículo de stock no encontrado' });
    }

    if (stock.estado !== 'DISPONIBLE') {
      return res.status(400).json({ error: 'Este artículo no está disponible para venta' });
    }

    let comprobanteUrl = null;

    // Si es transferencia, procesar comprobante
    if (metodoPago === 'TRANSFERENCIA' && req.file) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || '';
      const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || '';
      const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';
      const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim() || '';
      
      const cloudinaryConfigured = 
        (cloudinaryUrl && cloudinaryUrl !== 'placeholder_temporal') ||
        (cloudName && cloudName !== 'placeholder_temporal' && apiKey && apiKey !== 'placeholder_temporal' && apiSecret && apiSecret !== 'placeholder_temporal');
      
      if (cloudinaryConfigured) {
        comprobanteUrl = await uploadToCloudinary(req.file.path);
        await fs.unlink(req.file.path);
      } else {
        await fs.unlink(req.file.path);
        return res.status(500).json({ error: 'Cloudinary no está configurado' });
      }
    } else if (metodoPago === 'TRANSFERENCIA' && !req.file) {
      return res.status(400).json({ error: 'Comprobante de transferencia es requerido' });
    }

    const stockVendido = await prisma.stock.update({
      where: { id },
      data: {
        estado: 'VENDIDO',
        vendidoPorId: req.user.id,
        metodoPago,
        comprobantePago: comprobanteUrl || null,
        notas: notas || null,
        fechaVenta: new Date(),
      },
      include: {
        arreglo: true,
        vendidoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    res.json(stockVendido);
  } catch (error) {
    console.error('Error al vender stock:', error);
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo temporal:', unlinkError);
      }
    }
    res.status(500).json({ error: 'Error al vender stock' });
  }
};

// Actualizar stock (solo Gerente y Admin)
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { precioVenta, estado, notas } = req.body;

    const stock = await prisma.stock.findUnique({
      where: { id },
    });

    if (!stock) {
      return res.status(404).json({ error: 'Artículo de stock no encontrado' });
    }

    // Solo se puede actualizar si no está vendido
    if (stock.estado === 'VENDIDO' && req.user.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'No se puede modificar un artículo ya vendido' });
    }

    const updateData = {};
    if (precioVenta !== undefined) updateData.precioVenta = parseFloat(precioVenta);
    if (estado && ['DISPONIBLE', 'RESERVADO'].includes(estado)) updateData.estado = estado;
    if (notas !== undefined) updateData.notas = notas;

    const stockActualizado = await prisma.stock.update({
      where: { id },
      data: updateData,
      include: {
        arreglo: true,
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    res.json(stockActualizado);
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    res.status(500).json({ error: 'Error al actualizar stock' });
  }
};

// Eliminar stock (solo Admin)
export const deleteStock = async (req, res) => {
  try {
    const { id } = req.params;

    const stock = await prisma.stock.findUnique({
      where: { id },
    });

    if (!stock) {
      return res.status(404).json({ error: 'Artículo de stock no encontrado' });
    }

    // Solo se puede eliminar si no está vendido
    if (stock.estado === 'VENDIDO') {
      return res.status(400).json({ error: 'No se puede eliminar un artículo ya vendido' });
    }

    await prisma.stock.delete({
      where: { id },
    });

    res.json({ message: 'Artículo de stock eliminado' });
  } catch (error) {
    console.error('Error al eliminar stock:', error);
    res.status(500).json({ error: 'Error al eliminar stock' });
  }
};

