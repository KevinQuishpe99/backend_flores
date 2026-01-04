# Scripts de Base de Datos

## 📋 Scripts Disponibles

### `RECREAR_TODO.sql` ⭐ (RECOMENDADO)
**Script completo que borra TODO y recrea desde cero**

- ✅ Elimina todas las tablas, enums y funciones
- ✅ Crea todos los enums
- ✅ Crea todas las tablas con todas las columnas
- ✅ Crea todos los índices
- ✅ Crea triggers para `updatedAt`
- ✅ Crea usuario admin (con hash temporal)

**Uso:**
```bash
# En Render Shell:
psql $DATABASE_URL -f RECREAR_TODO.sql

# O copia y pega el contenido completo en Render Shell
```

**⚠️ ADVERTENCIA:** Este script **BORRA TODOS LOS DATOS** existentes.

### `crear_usuario_admin.js`
**Script Node.js para crear usuario admin con hash bcrypt correcto**

**Uso:**
```bash
# Después de ejecutar RECREAR_TODO.sql:
node scripts/crear_usuario_admin.js

# O usa Prisma seed:
npx prisma db seed
```

## 🚀 Flujo Recomendado

1. **Ejecutar RECREAR_TODO.sql** en Render Shell
2. **Ejecutar crear_usuario_admin.js** o `npx prisma db seed` para crear admin con hash correcto
3. **Listo** ✅

## 📝 Notas

- El hash de contraseña en `RECREAR_TODO.sql` es temporal
- Usa `crear_usuario_admin.js` o Prisma seed para obtener el hash correcto de bcrypt
- El usuario admin por defecto es:
  - Email: `admin@flores.com`
  - Contraseña: `admin123`
  - ⚠️ **Cambia la contraseña después del primer login**

