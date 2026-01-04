import prisma from '../config/database.js';
import { uploadToCloudinary, uploadDataUrlToCloudinary } from '../utils/cloudinary.js';
import fs from 'fs/promises';

export const getArreglos = async (req, res) => {
  try {
    const { disponible } = req.query;

    const where = {};
    if (disponible !== undefined) {
      where.disponible = disponible === 'true';
    }

    const arreglos = await prisma.arreglo.findMany({
      where,
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            rol: true,
          },
        },
        tipo: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(arreglos);
  } catch (error) {
    console.error('Error al obtener arreglos:', error);
    console.error('Error completo:', JSON.stringify(error, null, 2));
    
    // Si es un error de Prisma, dar más detalles
    if (error.code) {
      console.error('Código de error Prisma:', error.code);
    }
    
    res.status(500).json({ 
      error: 'Error al obtener arreglos',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        code: error.code 
      })
    });
  }
};

export const getArregloById = async (req, res) => {
  try {
    const { id } = req.params;
    const arreglo = await prisma.arreglo.findUnique({
      where: { id },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            rol: true,
          },
        },
      },
    });

    if (!arreglo) {
      return res.status(404).json({ error: 'Arreglo no encontrado' });
    }

    res.json(arreglo);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener arreglo' });
  }
};

export const createArreglo = async (req, res) => {
  try {
    const { nombre, descripcion, costo, disponible, imagenEditada, creadorId, tipoId } = req.body;

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

    if (!cloudinaryConfigurado) {
      // Limpiar archivos si existen
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          if (file.path) fs.unlink(file.path).catch(() => {});
        });
      }
      return res.status(400).json({ 
        error: 'Cloudinary no está configurado. Configura las credenciales en .env para subir imágenes.' 
      });
    }

    let imagen = null;
    let imagenEditadaUrl = null;

    // Prioridad 1: Si hay imagenEditada como data URL, subirla a Cloudinary
    if (imagenEditada && imagenEditada.startsWith('data:')) {
      try {
        console.log('📤 Subiendo imagen editada (data URL) a Cloudinary...');
        imagenEditadaUrl = await uploadDataUrlToCloudinary(imagenEditada);
        imagen = imagenEditadaUrl; // Usar la imagen editada como imagen principal
        console.log('✅ Imagen editada subida a Cloudinary:', imagenEditadaUrl);
      } catch (error) {
        console.error('❌ Error al subir imagen editada a Cloudinary:', error);
        // Limpiar archivos si existen
        if (req.files) {
          Object.values(req.files).flat().forEach(file => {
            if (file.path) fs.unlink(file.path).catch(() => {});
          });
        }
        return res.status(500).json({ 
          error: 'Error al subir imagen editada a Cloudinary',
          message: error.message 
        });
      }
    }
    // Prioridad 2: Si hay archivo subido, subirlo a Cloudinary
    else if (req.files && req.files.imagen && req.files.imagen[0]) {
      try {
        console.log('📤 Subiendo imagen de arreglo (archivo) a Cloudinary...');
        imagen = await uploadToCloudinary(req.files.imagen[0].path);
        await fs.unlink(req.files.imagen[0].path); // Eliminar archivo local después de subir
        console.log('✅ Imagen de arreglo subida a Cloudinary:', imagen);
      } catch (error) {
        console.error('❌ Error al subir imagen a Cloudinary:', error);
        if (req.files.imagen[0].path) await fs.unlink(req.files.imagen[0].path);
        return res.status(500).json({ 
          error: 'Error al subir imagen a Cloudinary',
          message: error.message 
        });
      }
    } else {
      return res.status(400).json({ error: 'Imagen requerida' });
    }

    // Determinar creadorId: usar el usuario actual (admin, gerente o empleado pueden crear)
    let creadorIdFinal = req.user.id;
    if (req.user.rol === 'ADMIN' && creadorId) {
      // Si admin especifica un creador, verificar que existe
      const creador = await prisma.usuario.findUnique({
        where: { id: creadorId },
        select: { id: true, rol: true },
      });
      if (!creador) {
        return res.status(400).json({ error: 'Usuario no encontrado' });
      }
      // Admin puede asignar a cualquier rol que pueda crear arreglos
      if (['ADMIN', 'GERENTE', 'EMPLEADO'].includes(creador.rol)) {
        creadorIdFinal = creadorId;
      } else {
        return res.status(400).json({ error: 'El usuario especificado no puede crear arreglos' });
      }
    }

    // Procesar imágenes adicionales
    const imagenesAdicionalesUrls = [];
    if (req.files) {
      const archivosAdicionales = Object.keys(req.files)
        .filter(key => key.startsWith('imagenAdicional_'))
        .sort()
        .map(key => req.files[key][0])
        .filter(Boolean);

      for (const archivo of archivosAdicionales) {
        try {
          const url = await uploadToCloudinary(archivo.path);
          imagenesAdicionalesUrls.push(url);
          await fs.unlink(archivo.path);
        } catch (error) {
          console.error('Error al subir imagen adicional:', error);
          if (archivo.path) await fs.unlink(archivo.path);
        }
      }
    }

    // Crear arreglo con las URLs de Cloudinary (solo URLs, no archivos)
    const arreglo = await prisma.arreglo.create({
      data: {
        nombre,
        descripcion,
        imagen, // URL de Cloudinary
        imagenEditada: imagenEditadaUrl || null, // URL de Cloudinary si existe
        imagenesAdicionales: imagenesAdicionalesUrls, // Array de URLs de imágenes adicionales
        costo: parseFloat(costo),
        disponible: disponible === 'true' || disponible === true,
        creadorId: creadorIdFinal,
        tipoId: tipoId || null,
      },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            rol: true,
          },
        },
      },
    });

    console.log('✅ Arreglo creado con imagen en Cloudinary');
    res.status(201).json(arreglo);
  } catch (error) {
    console.error('❌ Error al crear arreglo:', error);
    // Asegurarse de eliminar archivos locales si existen
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (file.path) {
          fs.unlink(file.path).catch(err => console.error('Error al eliminar archivo temporal:', err));
        }
      });
    }
    res.status(500).json({ 
      error: 'Error al crear arreglo',
      message: error.message 
    });
  }
};

export const updateArreglo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, costo, disponible, imagenEditada } = req.body;

    // Verificar permisos: admin puede editar todo, otros solo sus propios arreglos
    const arregloExistente = await prisma.arreglo.findUnique({
      where: { id },
    });

    if (!arregloExistente) {
      return res.status(404).json({ error: 'Arreglo no encontrado' });
    }

    // Admin puede editar cualquier arreglo, otros solo los que crearon
    if (req.user.rol !== 'ADMIN' && arregloExistente.creadorId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para editar este arreglo' });
    }

    const updateData = {
      nombre,
      descripcion,
      costo: costo ? parseFloat(costo) : undefined,
      disponible: disponible !== undefined ? (disponible === 'true' || disponible === true) : undefined,
      tipoId: tipoId !== undefined ? (tipoId || null) : undefined,
    };

    // Si hay imagenEditada como data URL, subirla a Cloudinary
    if (imagenEditada && imagenEditada.startsWith('data:')) {
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

      if (cloudinaryConfigurado) {
        try {
          console.log('📤 Subiendo imagen editada (data URL) a Cloudinary...');
          const imagenEditadaUrl = await uploadDataUrlToCloudinary(imagenEditada);
          updateData.imagenEditada = imagenEditadaUrl;
          console.log('✅ Imagen editada subida a Cloudinary:', imagenEditadaUrl);
        } catch (error) {
          console.error('❌ Error al subir imagen editada a Cloudinary:', error);
          // Si falla, no actualizar imagenEditada
        }
      } else {
        console.warn('⚠️ Cloudinary no configurado. No se puede subir imagen editada.');
      }
    } else if (imagenEditada && (imagenEditada.startsWith('http://') || imagenEditada.startsWith('https://'))) {
      // Si ya es una URL de Cloudinary, guardarla directamente
      updateData.imagenEditada = imagenEditada;
    }

    // Procesar imágenes adicionales si hay nuevas
    if (req.files) {
      const archivosAdicionales = Object.keys(req.files)
        .filter(key => key.startsWith('imagenAdicional_'))
        .sort()
        .map(key => req.files[key][0])
        .filter(Boolean);

      if (archivosAdicionales.length > 0) {
        const imagenesAdicionalesUrls = [];
        for (const archivo of archivosAdicionales) {
          try {
            const url = await uploadToCloudinary(archivo.path);
            imagenesAdicionalesUrls.push(url);
            await fs.unlink(archivo.path);
          } catch (error) {
            console.error('Error al subir imagen adicional:', error);
            if (archivo.path) await fs.unlink(archivo.path);
          }
        }
        if (imagenesAdicionalesUrls.length > 0) {
          // Combinar con las existentes si hay
          const existentes = arregloExistente.imagenesAdicionales || [];
          updateData.imagenesAdicionales = [...existentes, ...imagenesAdicionalesUrls];
        }
      }
    }

    if (req.files && req.files.imagen && req.files.imagen[0]) {
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

      if (!cloudinaryConfigurado) {
        if (req.files.imagen[0].path) await fs.unlink(req.files.imagen[0].path);
        return res.status(400).json({ 
          error: 'Cloudinary no está configurado. Configura las credenciales para subir imágenes.' 
        });
      }

      console.log('📤 Subiendo imagen de arreglo a Cloudinary...');
      const imagen = await uploadToCloudinary(req.files.imagen[0].path);
      updateData.imagen = imagen;
      await fs.unlink(req.files.imagen[0].path);
      console.log('✅ Imagen de arreglo actualizada en Cloudinary:', imagen);
    }

    const arreglo = await prisma.arreglo.update({
      where: { id },
      data: updateData,
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            rol: true,
          },
        },
      },
    });

    res.json(arreglo);
  } catch (error) {
    console.error('Error al actualizar arreglo:', error);
    res.status(500).json({ error: 'Error al actualizar arreglo' });
  }
};

export const deleteArreglo = async (req, res) => {
  try {
    const { id } = req.params;

    const arreglo = await prisma.arreglo.findUnique({
      where: { id },
    });

    if (!arreglo) {
      return res.status(404).json({ error: 'Arreglo no encontrado' });
    }

    // Admin puede eliminar cualquier arreglo, otros solo los que crearon
    if (req.user.rol !== 'ADMIN' && arreglo.creadorId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este arreglo' });
    }

    await prisma.arreglo.delete({
      where: { id },
    });

    res.json({ message: 'Arreglo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar arreglo' });
  }
};

