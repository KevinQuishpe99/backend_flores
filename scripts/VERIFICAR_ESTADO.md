# 🔍 Verificar Estado de la Base de Datos

## 📋 Script de Verificación

Ejecuta este script para ver el estado actual de tu base de datos:

### En Render Shell:

```bash
node scripts/verificar_base_datos.js
```

### Localmente:

```bash
cd backend
node scripts/verificar_base_datos.js
```

## 📊 Qué Verifica

El script verifica:
- ✅ Conexión a la base de datos
- ✅ Tablas existentes (debe haber 7)
- ✅ Enums existentes (debe haber 4)
- ✅ Columnas de la tabla `pedidos` (especialmente `empleadoId`)
- ✅ Usuarios existentes (especialmente admin)

## 🎯 Resultado Esperado

Si todo está bien:
```
✅ Conexión a la base de datos exitosa

📋 Tablas existentes:
   ✅ arreglos
   ✅ configuracion
   ✅ notificaciones
   ✅ pedidos
   ✅ stock
   ✅ tipos_arreglo
   ✅ usuarios

📋 Enums existentes:
   ✅ EstadoPedido
   ✅ EstadoStock
   ✅ MetodoPagoStock
   ✅ Rol

📋 Columnas de la tabla pedidos:
   ✅ empleadoId (text) NULL
   ...

👥 Usuarios en la base de datos: 1
   ✅ Usuario admin: admin@flores.com (Administrador)

📊 RESUMEN:
   Tablas: 7/7 esperadas
   Enums: 4/4 esperados

✅ Base de datos configurada correctamente
```

## ⚠️ Si Faltan Tablas

Si ves:
```
⚠️  No hay tablas en la base de datos
```

**Solución:**
1. Ejecuta `RECREAR_TODO.sql` en PgAdmin
2. Vuelve a ejecutar el script de verificación

## 🔧 Cambios Realizados

- ✅ `verificar_base_datos.js` - Script para verificar estado
- ✅ `seed.js` - Ahora verifica si las tablas existen antes de ejecutar
- ✅ `recordatorios.js` - Ahora verifica si la tabla existe antes de ejecutar

Esto evita errores cuando las tablas no existen.

