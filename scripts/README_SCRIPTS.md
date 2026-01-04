# 📝 Scripts para Crear Base de Datos y Usuario Admin

## 📋 Scripts Disponibles

### 1. `crear_base_datos.sql`
Script SQL completo para crear todas las tablas, enums, índices y triggers.

### 2. `crear_usuario_admin.js`
Script Node.js para crear el usuario admin con contraseña hasheada correctamente (RECOMENDADO).

### 3. `crear_usuario_admin_sql.sql`
Script SQL para crear usuario admin directamente (NO RECOMENDADO - la contraseña no estará hasheada correctamente).

## 🚀 Cómo Usar en Render

### Opción 1: Usar Scripts SQL (Rápido)

1. **Abrir Shell en Render**:
   - Ve a tu servicio `flores-backend` en Render Dashboard
   - Click en **"Shell"** → **"Open Shell"**

2. **Ejecutar script SQL**:
   ```bash
   # Conectar a la base de datos usando psql
   psql $DATABASE_URL -f scripts/crear_base_datos.sql
   ```

   O copia y pega el contenido de `crear_base_datos.sql` directamente en el Shell.

3. **Crear usuario admin** (usar el script Node.js):
   ```bash
   node scripts/crear_usuario_admin.js
   ```

### Opción 2: Usar Prisma (Recomendado)

```bash
# 1. Ejecutar migraciones (crea las tablas)
npx prisma migrate deploy

# 2. Crear usuario admin
npx prisma db seed
```

## 📝 Contenido de los Scripts

### `crear_base_datos.sql`

Crea:
- ✅ Todos los ENUMs (Rol, EstadoPedido, EstadoStock, MetodoPagoStock)
- ✅ Todas las tablas (usuarios, tipos_arreglo, arreglos, pedidos, notificaciones, stock, configuracion)
- ✅ Todos los índices
- ✅ Todas las foreign keys
- ✅ Triggers para actualizar `updatedAt` automáticamente

### `crear_usuario_admin.js`

Crea:
- ✅ Usuario admin con email: `admin@flores.com`
- ✅ Contraseña hasheada con bcrypt: `admin123`
- ✅ Verifica si ya existe antes de crear

## 🔧 Ejecutar desde Render Shell

### Paso 1: Crear Tablas

```bash
# Opción A: Usar psql directamente
psql $DATABASE_URL < scripts/crear_base_datos.sql

# Opción B: Copiar y pegar el contenido del SQL en el Shell
# (Abre crear_base_datos.sql y copia todo el contenido)
```

### Paso 2: Crear Usuario Admin

```bash
# Asegúrate de estar en el directorio del proyecto
cd /opt/render/project/src

# Ejecutar script Node.js
node scripts/crear_usuario_admin.js
```

## ✅ Verificar que Funcionó

### Verificar Tablas

```bash
# Conectar a la base de datos
psql $DATABASE_URL

# Listar todas las tablas
\dt

# Salir
\q
```

### Verificar Usuario Admin

```bash
# Conectar a la base de datos
psql $DATABASE_URL

# Ver usuario admin
SELECT id, email, nombre, rol, activo FROM usuarios WHERE email = 'admin@flores.com';

# Salir
\q
```

## 🐛 Solución de Problemas

### Error: "relation already exists"

- Las tablas ya existen
- Puedes continuar con crear el usuario admin

### Error: "enum already exists"

- Los enums ya existen
- Puedes continuar con crear las tablas

### Error: "cannot connect to database"

- Verifica que `DATABASE_URL` esté configurada en Render
- Verifica que la base de datos esté creada

### Error: "module not found" al ejecutar script Node.js

- Asegúrate de estar en el directorio correcto: `/opt/render/project/src`
- Verifica que `node_modules` esté instalado: `npm install`

## 📋 Checklist

- [ ] Tablas creadas (verificar con `\dt` en psql)
- [ ] Enums creados (verificar con `SELECT typname FROM pg_type WHERE typtype = 'e'`)
- [ ] Usuario admin creado (verificar con `SELECT * FROM usuarios WHERE email = 'admin@flores.com'`)
- [ ] Health check funciona: `https://backend-flores-mcsf.onrender.com/api/health`
- [ ] Login funciona con `admin@flores.com` / `admin123`

## 🎯 Orden Recomendado

1. **Crear tablas**: Ejecutar `crear_base_datos.sql`
2. **Crear usuario admin**: Ejecutar `crear_usuario_admin.js`
3. **Verificar**: Probar login desde el frontend

