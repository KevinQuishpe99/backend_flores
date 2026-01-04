import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import arregloRoutes from './routes/arregloRoutes.js';
import pedidoRoutes from './routes/pedidoRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import tipoArregloRoutes from './routes/tipoArregloRoutes.js';
import notificacionRoutes from './routes/notificacionRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import configuracionRoutes from './routes/configuracionRoutes.js';
import { verificarRecordatorios } from './utils/recordatorios.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configuración de CORS según el ambiente
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost';

const allowedOrigins = NODE_ENV === 'production' 
  ? [
      FRONTEND_URL,
      FRONTEND_URL.replace('http://', 'https://'),
      FRONTEND_URL.replace('https://', 'http://'), // Por si acaso
      `https://${process.env.DOMAIN || 'flowerspaulas.com'}`,
      `http://${process.env.DOMAIN || 'flowerspaulas.com'}`,
    ]
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8080', // Frontend en Docker
      FRONTEND_URL, // También permitir el FRONTEND_URL del .env
      /^http:\/\/localhost:\d+$/, // Permitir cualquier puerto de localhost en desarrollo
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Permitir IPs locales con cualquier puerto
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/, // Permitir IPs privadas con cualquier puerto
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+$/, // Permitir IPs privadas con cualquier puerto
    ];

// Seguridad con Helmet
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false, // Permitir Google OAuth popups
}));

// Compresión de respuestas
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: NODE_ENV === 'production' ? 100 : 1000, // límite de requests
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Rate limiting más estricto para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // solo 5 intentos de login por 15 minutos
  message: 'Demasiados intentos de inicio de sesión, intenta de nuevo más tarde.',
  skipSuccessfulRequests: true,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// CORS
if (NODE_ENV === 'development') {
  // En desarrollo, permitir todos los orígenes (más permisivo)
  app.use(cors({
    origin: true, // Permitir cualquier origen en desarrollo
    credentials: true,
  }));
} else {
  // En producción, usar la lista de orígenes permitidos
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return origin === allowed;
        }
        return allowed.test(origin);
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true,
  }));
}

// Body parsers
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Crear carpeta de uploads si no existe
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Servir archivos estáticos de uploads (solo en desarrollo)
if (NODE_ENV !== 'production') {
  app.use('/uploads', express.static(uploadsDir));
}

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/arreglos', arregloRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tipos-arreglo', tipoArregloRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/configuracion', configuracionRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // No exponer detalles del error en producción
  const message = NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : err.message;
    
  res.status(err.status || 500).json({
    error: message,
    ...(NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Ambiente: ${NODE_ENV}`);
  console.log(`📡 URL: http://0.0.0.0:${PORT}`);
  if (FRONTEND_URL) {
    console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
  }

  // Verificar recordatorios cada 5 minutos
  setInterval(() => {
    verificarRecordatorios();
  }, 5 * 60 * 1000);

  // Verificar recordatorios al iniciar
  verificarRecordatorios();
});
