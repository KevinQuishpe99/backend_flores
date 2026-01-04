# 📋 Usar Script SQL Manualmente

## ✅ Configuración Actual

Las migraciones de Prisma han sido **eliminadas**. Ahora debes crear la base de datos manualmente usando el script SQL.

## 🚀 Pasos para Crear la Base de Datos

### Paso 1: Conectar a PostgreSQL desde PgAdmin

1. Abre **PgAdmin**
2. Conecta a tu base de datos de Render:
   - **Host**: `dpg-d5cuhemr433s73a5bog0-a.oregon-postgres.render.com`
   - **Port**: `5432`
   - **Database**: `flores_db_osjg`
   - **Username**: `flores_user`
   - **Password**: `HF8ZPddSfZfzJXIkLVkrkJ53t7uLAf8K`

### Paso 2: Ejecutar el Script SQL

1. En PgAdmin, click derecho en tu base de datos → **Query Tool**
2. Abre el archivo `backend/scripts/RECREAR_TODO.sql`
3. **Copia TODO el contenido** (Ctrl+A, Ctrl+C)
4. Pégalo en el Query Tool
5. Click en **Execute** (F5)
6. Espera a que termine (30-60 segundos)

### Paso 3: Verificar que Funcionó

En el Query Tool, ejecuta:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Debes ver estas 7 tablas:**
- arreglos
- configuracion
- notificaciones
- pedidos
- stock
- tipos_arreglo
- usuarios

### Paso 4: Crear Usuario Admin

**Opción A: Desde Render Shell**

1. Ve a Render Dashboard → Tu servicio → **Shell**
2. Ejecuta:
   ```bash
   npx prisma db seed
   ```

**Opción B: Desde PgAdmin**

Ejecuta el script `backend/scripts/crear_usuario_admin.js` localmente:

```bash
cd backend
node scripts/crear_usuario_admin.js
```

**O ejecuta el SQL directamente** (pero necesitarás el hash bcrypt correcto):

```sql
-- Primero genera el hash con Node.js:
-- const bcrypt = require('bcryptjs');
-- bcrypt.hash('admin123', 10).then(hash => console.log(hash));

INSERT INTO "usuarios" (
    "id",
    "email",
    "password",
    "nombre",
    "apellido",
    "rol",
    "activo",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    'admin@flores.com',
    '$2b$10$TU_HASH_AQUI', -- Reemplaza con el hash generado
    'Administrador',
    'Sistema',
    'ADMIN',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("email") DO NOTHING;
```

### Paso 5: Reiniciar el Servicio en Render

1. Ve a Render Dashboard → Tu servicio
2. Click en **"Manual Deploy"**
3. Click en **"Clear build cache & deploy"**
4. Espera 2-3 minutos

### Paso 6: Verificar que Funciona

1. **Health Check:**
   ```
   https://backend-flores-mcsf.onrender.com/api/health
   ```
   Debe responder: `{"status":"ok"}`

2. **Frontend:**
   - Visita: https://flowerspaulas.vercel.app/
   - Abre la consola (F12)
   - **No debe haber** errores 500

3. **Login:**
   - Email: `admin@flores.com`
   - Contraseña: `admin123`

## 📋 Checklist

- [ ] Script `RECREAR_TODO.sql` ejecutado en PgAdmin
- [ ] 7 tablas verificadas
- [ ] Usuario admin creado
- [ ] Servicio reiniciado en Render
- [ ] Health check funciona
- [ ] Frontend no muestra errores 500
- [ ] Login funciona

## 🎯 Resumen

**Cambios realizados:**
- ✅ Migraciones de Prisma eliminadas
- ✅ `docker-entrypoint.sh` actualizado (solo genera Prisma client)
- ✅ `render.yaml` actualizado (solo ejecuta seed)
- ✅ `railway.json` actualizado (sin migraciones)

**Ahora:**
- Crea la base de datos manualmente con `RECREAR_TODO.sql` en PgAdmin
- El backend solo generará el cliente de Prisma (sin migraciones)
- El seed creará el usuario admin (si la BD ya tiene tablas)

## ⚠️ Nota

- Las migraciones ya no se ejecutarán automáticamente
- Debes crear la base de datos manualmente usando el script SQL
- El seed solo funcionará si las tablas ya existen

