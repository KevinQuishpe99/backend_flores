# 🔍 Diagnóstico: Tablas No Encontradas

## ⚠️ Problema

Prisma dice que las tablas no existen, pero las ves en PgAdmin:
```
ERROR: la relación "public.usuarios" no existe
ERROR: la relación "public.arreglos" no existe
```

## 🔧 Solución: Ejecutar Diagnóstico

### Paso 1: Ejecutar Script de Diagnóstico

En Render Shell:

```bash
npm run diagnose:db
```

O directamente:

```bash
node scripts/diagnostico_bd.js
```

### Paso 2: Revisar el Resultado

El script mostrará:
- ✅ DATABASE_URL configurada
- ✅ Esquema actual
- ✅ Esquemas disponibles
- ✅ Tablas en todos los esquemas
- ✅ Tablas requeridas en "public"
- ✅ Resultado de consulta directa

## 🎯 Posibles Causas

### 1. **DATABASE_URL sin `?schema=public`**

**Solución:**
1. Ve a Render Dashboard
2. Selecciona `flores-backend`
3. Ve a "Environment"
4. Edita `DATABASE_URL`
5. Agrega `?schema=public` al final si no lo tiene

**Formato correcto:**
```
postgresql://user:password@host:port/database?schema=public
```

### 2. **Tablas en otro esquema**

Si el diagnóstico muestra que las tablas están en otro esquema (no `public`):

**Opción A: Mover tablas a public**
```sql
ALTER TABLE otro_esquema.usuarios SET SCHEMA public;
-- Repetir para todas las tablas
```

**Opción B: Cambiar DATABASE_URL**
```
postgresql://user:password@host:port/database?schema=nombre_del_esquema
```

### 3. **Base de datos incorrecta**

Si estás conectado a una base de datos diferente:

1. Verifica en Render que `DATABASE_URL` apunte a la BD correcta
2. Verifica en PgAdmin que estés viendo la misma BD

## 📋 Verificación Rápida

### En Render Shell:

```bash
# Ver DATABASE_URL (sin contraseña)
echo $DATABASE_URL | sed 's/:[^:@]*@/:****@/'

# Verificar tablas directamente
psql $DATABASE_URL -c "\dt public.*"

# Verificar esquema actual
psql $DATABASE_URL -c "SELECT current_schema();"
```

## ✅ Después del Diagnóstico

1. **Si DATABASE_URL no tiene `?schema=public`**: Agrégalo
2. **Si las tablas están en otro esquema**: Muévelas o cambia el esquema en DATABASE_URL
3. **Si estás en otra BD**: Corrige DATABASE_URL en Render
4. **Redeploy el backend** después de corregir

## 🚀 Próximos Pasos

1. Ejecuta `npm run diagnose:db` en Render Shell
2. Comparte el resultado
3. Aplicamos la corrección según el diagnóstico

