# ✅ Solución: Trust Proxy y CORS en Render

## 🔍 Problemas Detectados

### 1. **Error: Trust Proxy Permissive**

**Problema:**
```
ValidationError: The Express 'trust proxy' setting is true, which allows anyone to trivially bypass IP-based rate limiting.
```

**Causa:**
- `app.set('trust proxy', true)` es demasiado permisivo
- Permite que cualquiera falsifique headers `X-Forwarded-For`
- Esto puede permitir bypass del rate limiting basado en IP

**Solución:**
- ✅ Cambiado a `app.set('trust proxy', 1)`
- ✅ Esto confía solo en **1 nivel de proxy** (el de Render)
- ✅ Más seguro y evita el warning de `express-rate-limit`

### 2. **Error CORS: URLs de Preview de Vercel**

**Problema:**
```
⚠️  Origen no permitido por CORS: https://flowerspaulas-g2m9urhfm-kevinquishpe99s-projects.vercel.app
```

**Causa:**
- Vercel genera URLs de preview para cada deploy (branch, PR, etc.)
- Estas URLs tienen el formato: `https://flowerspaulas-{hash}.vercel.app`
- No estaban en la lista de orígenes permitidos

**Solución:**
- ✅ Agregado patrón regex: `/^https:\/\/flowerspaulas-.*\.vercel\.app$/`
- ✅ Esto permite todas las URLs de preview de Vercel que empiecen con `flowerspaulas-`

## 📋 Cambios Realizados

### 1. `backend/src/server.js`

**Trust Proxy:**
```javascript
// Antes:
app.set('trust proxy', true);

// Ahora:
app.set('trust proxy', 1); // Solo confiar en 1 nivel de proxy (Render)
```

**CORS - URLs de Preview:**
```javascript
const allowedOrigins = NODE_ENV === 'production' 
  ? [
      // ... otros orígenes ...
      'https://flowerspaulas.vercel.app',
      'https://www.flowerspaulas.com',
      /^https:\/\/flowerspaulas-.*\.vercel\.app$/, // URLs de preview de Vercel
    ]
```

## 🚀 Resultado

- ✅ **Trust Proxy**: Configurado de manera segura (solo 1 nivel)
- ✅ **Rate Limiting**: Funciona correctamente sin warnings
- ✅ **CORS**: Permite URLs de preview de Vercel automáticamente
- ✅ **Seguridad**: No permite bypass del rate limiting

## 📝 Nota

El patrón regex `/^https:\/\/flowerspaulas-.*\.vercel\.app$/` permite:
- ✅ `https://flowerspaulas-abc123.vercel.app`
- ✅ `https://flowerspaulas-g2m9urhfm-kevinquishpe99s-projects.vercel.app`
- ✅ Cualquier URL de preview de Vercel que empiece con `flowerspaulas-`

Pero **NO** permite:
- ❌ `https://otro-proyecto-abc123.vercel.app` (solo proyectos que empiecen con `flowerspaulas-`)

