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

**Opción C: Usar Script SQL Manual (Recomendado ahora)**

Ejecuta el script `RECREAR_TODO.sql` desde PgAdmin o Render Shell.

**NOTA: Las migraciones de Prisma han sido eliminadas. Usa el script SQL manual.**

**Ejecuta el script `RECREAR_TODO.sql` en PgAdmin o Render Shell:**

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
# 1. Crear tablas (ejecuta RECREAR_TODO.sql en PgAdmin primero)
# 2. Crear usuario admin
npx prisma db seed

# 3. Verificar
psql $DATABASE_URL -c "\dt"
```

## 📝 Archivos Disponibles

- ✅ `backend/scripts/RECREAR_TODO.sql` - Script SQL completo (BORRAR Y RECREAR TODO)
- ✅ `backend/scripts/crear_usuario_admin.js` - Script Node.js para crear admin
- ✅ `backend/scripts/USAR_SCRIPT_MANUAL.md` - Guía para usar script manualmente
- ✅ `backend/scripts/README.md` - Documentación de scripts

## ⚠️ IMPORTANTE

**Las migraciones de Prisma han sido eliminadas.** Debes crear la base de datos manualmente usando `RECREAR_TODO.sql` en PgAdmin.

