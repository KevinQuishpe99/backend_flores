import prisma from '../config/database.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import fs from 'fs/promises';

export const getFlores = async (req, res) => {
  try {
    const { temporada, disponible } = req.query;

    const where = {};
    if (temporada) {
      where.temporada = temporada;
    }
    if (disponible !== undefined) {
      where.disponible = disponible === 'true';
    }

    const flores = await prisma.flor.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });

    // Retornar array vacío si no hay flores (esto es normal)
    res.json(flores || []);
  } catch (error) {
    console.error('Error al obtener flores:', error);
    console.error('Error completo:', JSON.stringify(error, null, 2));
    
    // Si es un error de Prisma, dar más detalles
    if (error.code) {
      console.error('Código de error Prisma:', error.code);
    }
    
    res.status(500).json({ 
      error: 'Error al obtener flores',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        code: error.code 
      })
    });
  }
};

export const getFlorById = async (req, res) => {
  try {
    const { id } = req.params;
    const flor = await prisma.flor.findUnique({
      where: { id },
    });

    if (!flor) {
      return res.status(404).json({ error: 'Flor no encontrada' });
    }

    res.json(flor);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener flor' });
  }
};

export const createFlor = async (req, res) => {
  try {
    const { nombre, descripcion, temporada, costoBase, disponible } = req.body;

    // Validar campos requeridos
    if (!nombre || !temporada || !costoBase) {
      return res.status(400).json({ 
        error: 'Nombre, temporada y costo base son requeridos' 
      });
    }

    let imagen = null;
    if (req.file) {
      try {
        // Verificar configuración de Cloudinary
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || '';
        const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || '';
        const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';
        const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim() || '';
        
        const cloudinaryConfigurado = 
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

        console.log('🔍 Verificando Cloudinary (crear):');
        console.log('  - Cloud Name:', cloudName ? `"${cloudName.substring(0, 10)}..."` : 'No configurado');
        console.log('  - API Key:', apiKey ? `"${apiKey.substring(0, 10)}..."` : 'No configurado');
        console.log('  - API Secret:', apiSecret ? `"${apiSecret.substring(0, 10)}..."` : 'No configurado');
        console.log('  - Cloud Name válido:', cloudName && cloudName !== 'placeholder_temporal' && cloudName !== '');
        console.log('  - API Key válido:', apiKey && apiKey !== 'placeholder_temporal' && apiKey !== '');
        console.log('  - API Secret válido:', apiSecret && apiSecret !== 'placeholder_temporal' && apiSecret !== '');
        console.log('  - Configurado correctamente:', cloudinaryConfigurado);

        if (cloudinaryConfigurado) {
          console.log('📤 Subiendo imagen a Cloudinary...');
          imagen = await uploadToCloudinary(req.file.path);
          await fs.unlink(req.file.path);
          console.log('✅ Imagen subida a Cloudinary:', imagen);
        } else {
          // Fallback: almacenamiento local solo para desarrollo
          if (process.env.NODE_ENV === 'development') {
            imagen = `/uploads/${req.file.filename}`;
            console.warn('⚠️ Cloudinary no configurado correctamente. Usando almacenamiento local (solo desarrollo).');
            console.warn('⚠️ Verifica que las credenciales en .env no sean "placeholder_temporal"');
          } else {
            // En producción, Cloudinary es requerido
            await fs.unlink(req.file.path);
            return res.status(400).json({ 
              error: 'Cloudinary no está configurado. Configura las credenciales de Cloudinary para producción.' 
            });
          }
        }
      } catch (uploadError) {
        console.error('❌ Error al subir imagen a Cloudinary:', uploadError);
        console.error('   Detalles:', uploadError.message);
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error al eliminar archivo temporal:', unlinkError);
        }
        return res.status(500).json({ 
          error: 'Error al subir imagen',
          message: uploadError.message 
        });
      }
    }

    const flor = await prisma.flor.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        temporada,
        costoBase: parseFloat(costoBase),
        disponible: disponible === 'true' || disponible === true,
        imagen,
      },
    });

    res.status(201).json(flor);
  } catch (error) {
    console.error('Error al crear flor:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al crear flor',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack 
      })
    });
  }
};

export const updateFlor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Log para debugging
    console.log('🔄 Actualizando flor ID:', id);
    console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));
    console.log('📁 Archivo recibido:', req.file ? `Sí - ${req.file.filename}` : 'No');
    
    const { nombre, descripcion, temporada, costoBase, disponible } = req.body;

    // Verificar que la flor existe
    const florExistente = await prisma.flor.findUnique({
      where: { id },
    });

    if (!florExistente) {
      return res.status(404).json({ error: 'Flor no encontrada' });
    }

    const updateData = {};
    
    // Solo actualizar campos que se proporcionen y no estén vacíos
    // Comparar con valores existentes para evitar actualizaciones innecesarias
    if (nombre !== undefined && nombre !== '' && nombre !== florExistente.nombre) {
      updateData.nombre = nombre;
    }
    if (descripcion !== undefined) {
      const nuevaDescripcion = descripcion || null;
      if (nuevaDescripcion !== florExistente.descripcion) {
        updateData.descripcion = nuevaDescripcion;
      }
    }
    if (temporada !== undefined && temporada !== '' && temporada !== florExistente.temporada) {
      updateData.temporada = temporada;
    }
    if (costoBase !== undefined && costoBase !== '') {
      const nuevoCosto = parseFloat(costoBase);
      if (nuevoCosto !== florExistente.costoBase) {
        updateData.costoBase = nuevoCosto;
      }
    }
    if (disponible !== undefined && disponible !== '') {
      const nuevoDisponible = disponible === 'true' || disponible === true;
      if (nuevoDisponible !== florExistente.disponible) {
        updateData.disponible = nuevoDisponible;
      }
    }

    // Procesar imagen si se proporciona
    if (req.file) {
      try {
        // Verificar configuración de Cloudinary
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || '';
        const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || '';
        const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';
        const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim() || '';
        
        const cloudinaryConfigurado = 
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

        console.log('🔍 Verificando Cloudinary:');
        console.log('  - Cloud Name:', cloudName ? `"${cloudName.substring(0, 10)}..."` : 'No configurado');
        console.log('  - API Key:', apiKey ? `"${apiKey.substring(0, 10)}..."` : 'No configurado');
        console.log('  - API Secret:', apiSecret ? `"${apiSecret.substring(0, 10)}..."` : 'No configurado');
        console.log('  - Cloud Name válido:', cloudName && cloudName !== 'placeholder_temporal' && cloudName !== '');
        console.log('  - API Key válido:', apiKey && apiKey !== 'placeholder_temporal' && apiKey !== '');
        console.log('  - API Secret válido:', apiSecret && apiSecret !== 'placeholder_temporal' && apiSecret !== '');
        console.log('  - Configurado correctamente:', cloudinaryConfigurado);

        if (cloudinaryConfigurado) {
          console.log('📤 Subiendo imagen a Cloudinary...');
          const imagen = await uploadToCloudinary(req.file.path);
          updateData.imagen = imagen;
          await fs.unlink(req.file.path);
          console.log('✅ Imagen actualizada en Cloudinary:', imagen);
        } else {
          // Fallback: almacenamiento local solo para desarrollo
          if (process.env.NODE_ENV === 'development') {
            updateData.imagen = `/uploads/${req.file.filename}`;
            console.warn('⚠️ Cloudinary no configurado correctamente. Usando almacenamiento local (solo desarrollo).');
            console.warn('⚠️ Verifica que las credenciales en .env no sean "placeholder_temporal"');
          } else {
            // En producción, Cloudinary es requerido
            await fs.unlink(req.file.path);
            return res.status(400).json({ 
              error: 'Cloudinary no está configurado. Configura las credenciales de Cloudinary para producción.' 
            });
          }
        }
      } catch (uploadError) {
        console.error('❌ Error al subir imagen a Cloudinary:', uploadError);
        console.error('   Detalles:', uploadError.message);
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error al eliminar archivo temporal:', unlinkError);
        }
        return res.status(500).json({ 
          error: 'Error al subir imagen',
          message: uploadError.message 
        });
      }
    }

    // Verificar que hay datos para actualizar
    if (Object.keys(updateData).length === 0) {
      // Si no hay cambios pero se intentó actualizar, devolver la flor actual sin error
      console.log('ℹ️ No hay cambios para actualizar');
      return res.json(florExistente);
    }

    console.log('📝 Datos a actualizar:', updateData);

    const flor = await prisma.flor.update({
      where: { id },
      data: updateData,
    });

    console.log('✅ Flor actualizada exitosamente');

    res.json(flor);
  } catch (error) {
    console.error('Error al actualizar flor:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al actualizar flor',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack 
      })
    });
  }
};

export const deleteFlor = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.flor.delete({
      where: { id },
    });

    res.json({ message: 'Flor eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar flor' });
  }
};

