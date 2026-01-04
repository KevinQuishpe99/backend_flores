import jwt from 'jsonwebtoken';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de Google requerido' });
    }

    // Obtener información del usuario desde Google OAuth2 API
    const userInfoResponse = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const { email, name, picture, id: googleId } = userInfoResponse.data;

    let usuario = await prisma.usuario.findUnique({
      where: { googleId },
    });

    if (!usuario) {
      // Verificar si el email ya existe
      const existingUser = await prisma.usuario.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Actualizar usuario existente con googleId (sin cambiar la imagen)
        usuario = await prisma.usuario.update({
          where: { email },
          data: { googleId }, // No usar imagen de Google
        });
      } else {
        // Crear nuevo usuario - requiere teléfono para clientes
        const { telefono } = req.body;
        
        // Si no hay teléfono, crear usuario pero marcar que necesita completar perfil
        if (!telefono || telefono.trim() === '') {
          // Crear usuario sin teléfono pero requerir que lo complete después
          // No usar imagen de Google, se usará imagen por defecto basada en el nombre
          usuario = await prisma.usuario.create({
            data: {
              email,
              nombre: name,
              googleId,
              imagen: null, // No usar imagen de Google
              rol: 'CLIENTE',
              telefono: null, // Temporalmente null, debe completarse
            },
          });
          
          // Retornar indicando que necesita teléfono
          const jwtToken = generateToken(usuario.id);
          return res.status(200).json({
            token: jwtToken,
            user: {
              id: usuario.id,
              email: usuario.email,
              nombre: usuario.nombre,
              apellido: usuario.apellido,
              imagen: usuario.imagen,
              rol: usuario.rol,
              telefono: usuario.telefono,
            },
            requiereTelefono: true,
            mensaje: 'Por favor, completa tu número de teléfono en tu perfil'
          });
        }
        
        usuario = await prisma.usuario.create({
          data: {
            email,
            nombre: name,
            googleId,
            imagen: null, // No usar imagen de Google
            rol: 'CLIENTE',
            telefono: telefono.trim(),
          },
        });
      }
    } else {
      // Usuario existente, no actualizar imagen de Google
      // El usuario puede actualizar su imagen desde el perfil
      
      // Si es cliente y no tiene teléfono, requerir que lo complete
      if (usuario.rol === 'CLIENTE' && (!usuario.telefono || usuario.telefono.trim() === '')) {
        const jwtToken = generateToken(usuario.id);
        return res.status(200).json({
          token: jwtToken,
          user: {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            imagen: usuario.imagen,
            rol: usuario.rol,
            telefono: usuario.telefono,
          },
          requiereTelefono: true,
          mensaje: 'Por favor, completa tu número de teléfono en tu perfil'
        });
      }
    }

    const jwtToken = generateToken(usuario.id);

    res.json({
      token: jwtToken,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        imagen: usuario.imagen,
        rol: usuario.rol,
        telefono: usuario.telefono,
      },
    });
  } catch (error) {
    // No mostrar errores si las tablas no existen (P2021)
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return res.status(503).json({ 
        error: 'Base de datos no configurada. Por favor, ejecuta RECREAR_TODO.sql primero.' 
      });
    }
    // Solo mostrar errores detallados en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('Error en googleLogin:', error);
    } else {
      console.error('Error en googleLogin');
    }
    res.status(500).json({ error: 'Error en autenticación con Google' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        imagen: true,
        rol: true,
        telefono: true,
        direccion: true,
      },
    });

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

export const register = async (req, res) => {
  try {
    const { email, password, nombre, apellido, telefono } = req.body;

    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
    }

    // Teléfono obligatorio para clientes
    if (!telefono || telefono.trim() === '') {
      return res.status(400).json({ error: 'El teléfono es obligatorio para registrarse' });
    }

    // Validar que el teléfono tenga prefijo internacional
    const telefonoLimpio = telefono.trim();
    if (!telefonoLimpio.startsWith('+')) {
      return res.status(400).json({ 
        error: 'El teléfono debe incluir código de país (ej: +57 300 123 4567)' 
      });
    }

    // Validar formato básico: + seguido de 1-3 dígitos (código país) y 7-12 dígitos (número)
    const telefonoSinEspacios = telefonoLimpio.replace(/\s/g, '');
    if (!/^\+\d{1,3}\d{7,12}$/.test(telefonoSinEspacios)) {
      return res.status(400).json({ 
        error: 'Formato de teléfono inválido. Debe ser: +[código país] [número] (ej: +57 3001234567)' 
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        apellido,
        telefono: telefono.trim(),
        rol: 'CLIENTE',
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        imagen: true,
        rol: true,
        telefono: true,
      },
    });

    const jwtToken = generateToken(usuario.id);

    res.status(201).json({
      token: jwtToken,
      user: usuario,
    });
  } catch (error) {
    // No mostrar errores si las tablas no existen (P2021)
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return res.status(503).json({ 
        error: 'Base de datos no configurada. Por favor, ejecuta RECREAR_TODO.sql primero.' 
      });
    }
    // Solo mostrar errores detallados en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('Error en register:', error);
    } else {
      console.error('Error en register');
    }
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si tiene contraseña (no es solo Google)
    if (!usuario.password) {
      return res.status(401).json({ error: 'Este usuario solo puede iniciar sesión con Google' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, usuario.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      return res.status(401).json({ error: 'Usuario inactivo' });
    }

    const jwtToken = generateToken(usuario.id);

    res.json({
      token: jwtToken,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        imagen: usuario.imagen,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    // No mostrar errores si las tablas no existen (P2021)
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return res.status(503).json({ 
        error: 'Base de datos no configurada. Por favor, ejecuta RECREAR_TODO.sql primero.' 
      });
    }
    // Solo mostrar errores detallados en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('Error en login:', error);
    } else {
      console.error('Error en login');
    }
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { nombre, apellido, telefono, direccion } = req.body;
    let imagenUrl = null;

    // Verificar que el usuario actual existe y obtener su rol
    const usuarioActual = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { rol: true, imagen: true },
    });

    // Si es cliente, el teléfono es obligatorio
    if (usuarioActual?.rol === 'CLIENTE' && (!telefono || telefono.trim() === '')) {
      return res.status(400).json({ error: 'El teléfono es obligatorio para clientes' });
    }

    // Si se proporciona teléfono, validar que tenga prefijo
    if (telefono && telefono.trim() !== '') {
      const telefonoLimpio = telefono.trim();
      if (!telefonoLimpio.startsWith('+')) {
        return res.status(400).json({ 
          error: 'El teléfono debe incluir código de país (ej: +57 300 123 4567)' 
        });
      }

      // Validar formato básico
      const telefonoSinEspacios = telefonoLimpio.replace(/\s/g, '');
      if (!/^\+\d{1,3}\d{7,12}$/.test(telefonoSinEspacios)) {
        return res.status(400).json({ 
          error: 'Formato de teléfono inválido. Debe ser: +[código país] [número]' 
        });
      }
    }

    // Manejar imagen si se subió una nueva
    if (req.file) {
      const { uploadToCloudinary } = await import('../utils/cloudinary.js');
      const fs = await import('fs');
      
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

        if (cloudinaryConfigurado) {
          // Subir a Cloudinary
          imagenUrl = await uploadToCloudinary(req.file.path);
          // Eliminar archivo temporal
          await fs.promises.unlink(req.file.path);
        } else {
          // En desarrollo, usar ruta local
          if (process.env.NODE_ENV === 'development') {
            imagenUrl = `/uploads/${req.file.filename}`;
          } else {
            await fs.promises.unlink(req.file.path);
            return res.status(400).json({ 
              error: 'Cloudinary no está configurado para subir imágenes' 
            });
          }
        }
      } catch (uploadError) {
        console.error('Error al subir imagen:', uploadError);
        if (req.file?.path) {
          const fs = await import('fs');
          await fs.promises.unlink(req.file.path).catch(() => {});
        }
        return res.status(500).json({ error: 'Error al subir imagen de perfil' });
      }
    }

    // Preparar datos de actualización
    const updateData = {
      nombre,
      apellido,
      telefono: telefono ? telefono.trim() : null,
      direccion,
    };

    // Solo actualizar imagen si se subió una nueva
    if (imagenUrl) {
      updateData.imagen = imagenUrl;
    }

    const usuario = await prisma.usuario.update({
      where: { id: req.user.id },
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
      },
    });

    res.json(usuario);
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};
