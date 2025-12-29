import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { uploadToCloudinary } from '../utils/cloudinary.js';

const prisma = new PrismaClient();

// Obtener todas las configuraciones (con detalles, para admin)
export const getConfiguraciones = async (req, res) => {
  try {
    const configuraciones = await prisma.configuracion.findMany({
      orderBy: { clave: 'asc' }
    });

    // Convertir a objeto para facilitar el uso en frontend
    const configMap = {};
    configuraciones.forEach(config => {
      configMap[config.clave] = {
        valor: config.valor,
        tipo: config.tipo,
        descripcion: config.descripcion
      };
    });

    res.json(configMap);
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    res.status(500).json({ error: 'Error al obtener configuraciones' });
  }
};

// Obtener todas las configuraciones (solo valores, para frontend público)
export const getConfiguracionesPublic = async (req, res) => {
  try {
    // Verificar si la tabla existe
    const configuraciones = await prisma.configuracion.findMany({
      orderBy: { clave: 'asc' }
    });

    // Convertir a objeto simple para facilitar el uso en frontend
    // Si no hay configuraciones, retornar objeto vacío en lugar de error
    const configMap = {};
    if (configuraciones && configuraciones.length > 0) {
      configuraciones.forEach(config => {
        configMap[config.clave] = config.valor;
      });
    }

    res.json(configMap);
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Si es un error de tabla no encontrada o similar, retornar objeto vacío
    if (error.code === 'P2021' || error.code === 'P2001' || error.code === 'P2010' || 
        error.message?.includes('does not exist') || 
        error.message?.includes('relation') || 
        error.message?.includes('table') ||
        error.message?.includes('Unknown table')) {
      console.log('Tabla de configuraciones no existe aún, retornando objeto vacío');
      return res.json({});
    }
    
    // Para cualquier otro error, retornar objeto vacío en lugar de error 500
    console.log('Error al obtener configuraciones, retornando objeto vacío:', error.message);
    return res.json({});
  }
};

// Obtener una configuración específica
export const getConfiguracion = async (req, res) => {
  try {
    const { clave } = req.params;
    const configuracion = await prisma.configuracion.findUnique({
      where: { clave }
    });

    if (!configuracion) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }

    res.json(configuracion);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
};

// Crear o actualizar configuración
export const setConfiguracion = async (req, res) => {
  try {
    const { clave, valor, tipo = 'text', descripcion } = req.body;
    const userId = req.user.id;

    if (!clave || valor === undefined) {
      return res.status(400).json({ error: 'Clave y valor son requeridos' });
    }

    // Si es una imagen (tipo 'image'), subir a Cloudinary
    let valorFinal = valor;
    if (tipo === 'image' && req.file) {
      try {
        const cloudinaryUrl = await uploadToCloudinary(req.file.path);
        valorFinal = cloudinaryUrl;
        // Eliminar archivo temporal
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (error) {
        console.error('Error al subir imagen:', error);
        return res.status(500).json({ error: 'Error al subir imagen' });
      }
    }

    const configuracion = await prisma.configuracion.upsert({
      where: { clave },
      update: {
        valor: valorFinal,
        tipo,
        descripcion,
        updatedBy: userId,
        updatedAt: new Date()
      },
      create: {
        clave,
        valor: valorFinal,
        tipo,
        descripcion,
        updatedBy: userId
      }
    });

    res.json(configuracion);
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
};

// Actualizar múltiples configuraciones (para tema/colores)
export const updateTema = async (req, res) => {
  try {
    const { logo, colorPrimario, colorSecundario, colorAcento } = req.body;
    const userId = req.user.id;

    const updates = [];

    // Procesar logo si se envió
    if (req.files?.logo) {
      try {
        const logoFile = Array.isArray(req.files.logo) ? req.files.logo[0] : req.files.logo;
        const logoUrl = await uploadToCloudinary(logoFile.path);
        updates.push(
          prisma.configuracion.upsert({
            where: { clave: 'logo' },
            update: { valor: logoUrl, updatedBy: userId },
            create: { clave: 'logo', valor: logoUrl, tipo: 'image', descripcion: 'Logo de la aplicación', updatedBy: userId }
          })
        );
        if (fs.existsSync(logoFile.path)) {
          fs.unlinkSync(logoFile.path);
        }
      } catch (error) {
        console.error('Error al subir logo:', error);
        return res.status(500).json({ error: 'Error al subir logo' });
      }
    } else if (logo) {
      // Si se envía URL directamente
      updates.push(
        prisma.configuracion.upsert({
          where: { clave: 'logo' },
          update: { valor: logo, updatedBy: userId },
          create: { clave: 'logo', valor: logo, tipo: 'image', descripcion: 'Logo de la aplicación', updatedBy: userId }
        })
      );
    }

    // Actualizar colores
    if (colorPrimario) {
      updates.push(
        prisma.configuracion.upsert({
          where: { clave: 'color_primario' },
          update: { valor: colorPrimario, updatedBy: userId },
          create: { clave: 'color_primario', valor: colorPrimario, tipo: 'color', descripcion: 'Color primario del tema', updatedBy: userId }
        })
      );
    }

    if (colorSecundario) {
      updates.push(
        prisma.configuracion.upsert({
          where: { clave: 'color_secundario' },
          update: { valor: colorSecundario, updatedBy: userId },
          create: { clave: 'color_secundario', valor: colorSecundario, tipo: 'color', descripcion: 'Color secundario del tema', updatedBy: userId }
        })
      );
    }

    if (colorAcento) {
      updates.push(
        prisma.configuracion.upsert({
          where: { clave: 'color_acento' },
          update: { valor: colorAcento, updatedBy: userId },
          create: { clave: 'color_acento', valor: colorAcento, tipo: 'color', descripcion: 'Color de acento', updatedBy: userId }
        })
      );
    }

    await Promise.all(updates);

    // Obtener todas las configuraciones actualizadas
    const configuraciones = await prisma.configuracion.findMany({
      where: {
        clave: {
          in: ['logo', 'color_primario', 'color_secundario', 'color_acento']
        }
      }
    });

    const configMap = {};
    configuraciones.forEach(config => {
      configMap[config.clave] = config.valor;
    });

    res.json(configMap);
  } catch (error) {
    console.error('Error al actualizar tema:', error);
    res.status(500).json({ error: 'Error al actualizar tema' });
  }
};

// Eliminar configuración
export const deleteConfiguracion = async (req, res) => {
  try {
    const { clave } = req.params;

    await prisma.configuracion.delete({
      where: { clave }
    });

    res.json({ message: 'Configuración eliminada' });
  } catch (error) {
    console.error('Error al eliminar configuración:', error);
    res.status(500).json({ error: 'Error al eliminar configuración' });
  }
};

