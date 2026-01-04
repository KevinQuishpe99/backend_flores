# Variables de Entorno para Railway

Configura estas variables en el Dashboard de Railway → Variables
**NOTA**: DATABASE_URL se configura automáticamente cuando agregas PostgreSQL

```env
NODE_ENV=production
PORT=10000

# Database URL (Railway la configura automáticamente cuando agregas PostgreSQL)
# No necesitas configurarla manualmente

# JWT
JWT_SECRET=TU_JWT_SECRET_SEGURO_AQUI

# Google OAuth
GOOGLE_CLIENT_ID=TU_GOOGLE_CLIENT_ID_AQUI
GOOGLE_CLIENT_SECRET=TU_GOOGLE_CLIENT_SECRET_AQUI

# Cloudinary (para imágenes)
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
# O usar variables individuales:
# CLOUDINARY_CLOUD_NAME=TU_CLOUD_NAME
# CLOUDINARY_API_KEY=TU_API_KEY
# CLOUDINARY_API_SECRET=TU_API_SECRET

# Frontend URL (URL de Vercel)
FRONTEND_URL=https://TU_PROYECTO_VERCEL.vercel.app

# Dominio principal
DOMAIN=flowerspaulas.com
```

