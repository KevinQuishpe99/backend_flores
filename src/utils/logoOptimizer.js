import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Optimiza un logo con dimensiones específicas
 * @param {string} filePath - Ruta del archivo de imagen
 * @returns {Promise<string>} - Ruta del archivo optimizado
 */
export const optimizeLogo = async (filePath) => {
  try {
    // Dimensiones máximas para el logo (500x500px es razonable para un logo)
    const MAX_WIDTH = 500;
    const MAX_HEIGHT = 500;
    const QUALITY = 85; // Calidad de compresión (0-100)

    // Leer metadatos de la imagen
    const metadata = await sharp(filePath).metadata();
    
    // Calcular nuevas dimensiones manteniendo aspect ratio
    let width = metadata.width;
    let height = metadata.height;
    let needsResize = false;

    // Si la imagen es más grande que el máximo, redimensionar
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      needsResize = true;
    }

    // Crear ruta para el archivo optimizado
    const ext = path.extname(filePath);
    const optimizedPath = filePath.replace(ext, `-optimized${ext}`);

    // Procesar la imagen
    let sharpInstance = sharp(filePath);

    // Si necesita redimensionar
    if (needsResize) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'inside', // Mantener aspect ratio, ajustar dentro de las dimensiones
        withoutEnlargement: true, // No agrandar si es más pequeño
      });
    }

    // Optimizar según el formato
    const format = metadata.format;
    
    if (format === 'jpeg' || format === 'jpg') {
      await sharpInstance
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toFile(optimizedPath);
    } else if (format === 'png') {
      await sharpInstance
        .png({ quality: QUALITY, compressionLevel: 9 })
        .toFile(optimizedPath);
    } else if (format === 'webp') {
      await sharpInstance
        .webp({ quality: QUALITY })
        .toFile(optimizedPath);
    } else {
      // Para otros formatos, convertir a JPEG
      await sharpInstance
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toFile(optimizedPath);
    }

    // Obtener tamaño de ambos archivos
    const originalStats = await fs.stat(filePath);
    const optimizedStats = await fs.stat(optimizedPath);
    
    const originalSizeKB = (originalStats.size / 1024).toFixed(2);
    const optimizedSizeKB = (optimizedStats.size / 1024).toFixed(2);
    const reduction = ((1 - optimizedStats.size / originalStats.size) * 100).toFixed(1);

    console.log(`✅ Logo optimizado:`);
    console.log(`   Dimensiones: ${metadata.width}x${metadata.height} → ${width}x${height}`);
    console.log(`   Tamaño: ${originalSizeKB} KB → ${optimizedSizeKB} KB (${reduction}% reducción)`);

    // Eliminar archivo original
    await fs.unlink(filePath);

    return optimizedPath;
  } catch (error) {
    console.error('Error al optimizar logo:', error);
    // Si hay error, retornar el archivo original
    return filePath;
  }
};

