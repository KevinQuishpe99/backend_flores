import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary - Soporta CLOUDINARY_URL o variables individuales
let cloudinaryConfigurado = false;

// Opción 1: Usar CLOUDINARY_URL (recomendado por Cloudinary)
if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL !== 'placeholder_temporal') {
  try {
    // CLOUDINARY_URL se lee automáticamente del entorno
    // Solo configuramos secure: true para usar HTTPS
    cloudinary.config({
      secure: true, // Usar HTTPS
    });
    cloudinaryConfigurado = true;
    console.log('✅ Cloudinary configurado usando CLOUDINARY_URL');
    // Extraer cloud name de la URL para mostrarlo
    const urlMatch = process.env.CLOUDINARY_URL.match(/@([^/]+)/);
    if (urlMatch) {
      console.log('   Cloud Name:', urlMatch[1]);
    }
  } catch (error) {
    console.error('❌ Error al configurar Cloudinary con CLOUDINARY_URL:', error);
  }
} 
// Opción 2: Usar variables individuales (fallback)
else {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || '';
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';

  cloudinaryConfigurado = 
    cloudName && 
    cloudName !== 'placeholder_temporal' &&
    cloudName !== '' &&
    apiKey &&
    apiKey !== 'placeholder_temporal' &&
    apiKey !== '' &&
    apiSecret &&
    apiSecret !== 'placeholder_temporal' &&
    apiSecret !== '';

  if (cloudinaryConfigurado) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true, // Usar HTTPS
    });
    console.log('✅ Cloudinary configurado usando variables individuales');
    console.log('   Cloud Name:', cloudName);
  }
}

if (!cloudinaryConfigurado) {
  console.warn('⚠️ Cloudinary no configurado. Las credenciales faltan o son placeholders.');
  console.warn('   Opción 1: Configura CLOUDINARY_URL en .env');
  console.warn('   Opción 2: Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en .env');
  console.warn('   Y que NO sean "placeholder_temporal"');
}

export const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'flores',
      resource_type: 'image',
      // Optimización automática y compresión
      fetch_format: 'auto',
      quality: 'auto:good', // Compresión automática con buena calidad
      // Redimensionar si es muy grande (máximo 1920px en el lado más largo)
      transformation: [
        {
          width: 1920,
          height: 1920,
          crop: 'limit', // No recortar, solo limitar tamaño manteniendo aspect ratio
          quality: 'auto:good',
          fetch_format: 'auto',
        }
      ],
      // Generar versiones optimizadas para diferentes tamaños (opcional, consume más espacio)
      // eager: [
      //   { width: 800, height: 800, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
      //   { width: 400, height: 400, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
      // ],
      ...options, // Permitir opciones adicionales (pueden sobrescribir las anteriores)
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error detallado de Cloudinary:', error);
    throw new Error(`Error al subir imagen: ${error.message}`);
  }
};

// Función para subir data URL (base64) a Cloudinary
export const uploadDataUrlToCloudinary = async (dataUrl, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: 'flores',
      resource_type: 'image',
      fetch_format: 'auto', // WebP si es compatible
      quality: 'auto:good', // Compresión automática con buena calidad
      // Redimensionar si es muy grande (máximo 1920px en el lado más largo)
      transformation: [
        {
          width: 1920,
          height: 1920,
          crop: 'limit', // No recortar, solo limitar tamaño
          quality: 'auto:good',
          fetch_format: 'auto',
        }
      ],
      // Generar versiones optimizadas (opcional)
      // eager: [
      //   { width: 800, height: 800, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
      //   { width: 400, height: 400, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
      // ],
      ...options,
    });
    console.log(`✅ Imagen (data URL) subida: ${(result.bytes / 1024 / 1024).toFixed(2)}MB`);
    return result.secure_url;
  } catch (error) {
    console.error('Error al subir data URL a Cloudinary:', error);
    throw new Error(`Error al subir imagen: ${error.message}`);
  }
};

// Función para obtener URL optimizada de una imagen existente
export const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    ...options,
  });
};

// Función para transformar imagen (redimensionar, recortar, etc.)
export const getTransformedUrl = (publicId, transformOptions = {}) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    crop: transformOptions.crop || 'auto',
    gravity: transformOptions.gravity || 'auto',
    width: transformOptions.width,
    height: transformOptions.height,
    ...transformOptions,
  });
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
  }
};

export default cloudinary;

