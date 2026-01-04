# 🚀 Ejecutar Scripts en Render - Guía Rápida

## 📋 Pasos para Crear Tablas y Usuario Admin

### Paso 1: Abrir Shell en Render

1. Ve a **Render Dashboard**: https://dashboard.render.com
2. Selecciona tu servicio `flores-backend`
3. Click en **"Shell"** (menú lateral)
4. Click en **"Open Shell"**

### Paso 2: Crear Tablas (Script SQL)

**Opción A: Usar psql directamente**

```bash
# Conectar a la base de datos y ejecutar script
psql $DATABASE_URL -f scripts/crear_base_datos.sql
```

**Opción B: Copiar y pegar el SQL**

1. Abre el archivo `backend/scripts/crear_base_datos.sql`
2. Copia TODO el contenido
3. Pégalo en el Shell de Render
4. Presiona Enter

**Opción C: Usar Prisma (Recomendado)**

```bash
# Ejecutar migraciones (crea las tablas)
npx prisma migrate deploy
```

### Paso 3: Crear Usuario Admin

```bash
# Asegúrate de estar en el directorio correcto
cd /opt/render/project/src

# Ejecutar script para crear usuario admin
node scripts/crear_usuario_admin.js
```

**O usar Prisma seed:**

```bash
npx prisma db seed
```

### Paso 4: Verificar

```bash
# Verificar tablas creadas
psql $DATABASE_URL -c "\dt"

# Verificar usuario admin
psql $DATABASE_URL -c "SELECT id, email, nombre, rol FROM usuarios WHERE email = 'admin@flores.com';"
```

## ✅ Resultado Esperado

Después de ejecutar los scripts:

- ✅ Todas las tablas creadas
- ✅ Usuario admin creado: `admin@flores.com` / `admin123`
- ✅ Health check funciona: `https://backend-flores-mcsf.onrender.com/api/health`
- ✅ Login funciona desde el frontend

## 🎯 Comandos Rápidos (Copia y Pega)

```bash
# 1. Crear tablas
npx prisma migrate deploy

# 2. Crear usuario admin
npx prisma db seed

# 3. Verificar
psql $DATABASE_URL -c "\dt"
```

## 📝 Archivos Creados

- ✅ `backend/scripts/crear_base_datos.sql` - Script SQL completo
- ✅ `backend/scripts/crear_usuario_admin.js` - Script Node.js para crear admin
- ✅ `backend/scripts/README_SCRIPTS.md` - Documentación completa
- ✅ `backend/scripts/EJECUTAR_EN_RENDER.md` - Esta guía rápida

