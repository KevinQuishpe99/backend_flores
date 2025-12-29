# Backend - Sistema de Gestión de Flores

## Tecnologías
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT para autenticación
- Google OAuth
- Cloudinary para almacenamiento de imágenes

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
- `DATABASE_URL`: URL de conexión a PostgreSQL
- `JWT_SECRET`: Secreto para JWT
- `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`: Credenciales de Google OAuth
- `CLOUDINARY_*`: Credenciales de Cloudinary

3. Configurar base de datos:
```bash
npx prisma migrate dev
npx prisma generate
```

4. Ejecutar servidor:
```bash
npm run dev
```

## Endpoints principales

- `/api/auth` - Autenticación
- `/api/flores` - Gestión de flores (Admin)
- `/api/arreglos` - Gestión de arreglos (Florista)
- `/api/pedidos` - Gestión de pedidos
- `/api/admin` - Panel de administración

