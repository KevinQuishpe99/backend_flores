# 🔧 Solución: CORS y 429 Too Many Requests

## ✅ Cambios Realizados

### 1. **CORS - Agregado dominio de Vercel**

Actualizado en `src/server.js`:
```javascript
const allowedOrigins = NODE_ENV === 'production' 
  ? [
      FRONTEND_URL,
      'https://flowerspaulas.vercel.app', // ✅ Agregado explícitamente
      'https://www.flowerspaulas.com',     // ✅ Con www
      // ... otros orígenes
    ]
```

### 2. **Rate Limiting - Aumentado límite**

Actualizado en `src/server.js`:
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // ✅ Aumentado de 5 a 20 intentos
  // ...
});
```

### 3. **Logs Reducidos**

Los warnings de CORS solo se muestran en desarrollo para no llenar los logs.

## 🔍 Verificar en Render

### Variable de Entorno `FRONTEND_URL`

Asegúrate de que en Render esté configurada:
```
FRONTEND_URL=https://flowerspaulas.vercel.app
```

**Cómo verificar:**
1. Ve a Render Dashboard
2. Selecciona tu servicio `flores-backend`
3. Ve a "Environment"
4. Verifica que `FRONTEND_URL` sea `https://flowerspaulas.vercel.app`

## 🚀 Próximos Pasos

1. **Redeploy el backend en Render** para aplicar los cambios
2. **Verifica que `FRONTEND_URL` esté configurado** en Render
3. **Prueba el login** desde `https://flowerspaulas.vercel.app`

## ⚠️ Si Sigue Fallando

### Verificar CORS en Render Shell:

```bash
# Ver las variables de entorno
env | grep FRONTEND_URL

# Ver los logs del servidor
# (deberías ver los orígenes permitidos al iniciar)
```

### Verificar Rate Limiting:

Si sigues viendo 429, puedes aumentar más el límite temporalmente:
```javascript
max: 50, // Temporalmente más permisivo
```

## 📊 Estado Esperado

Después del redeploy:
- ✅ CORS debe permitir `https://flowerspaulas.vercel.app`
- ✅ Rate limiting: 20 intentos por 15 minutos
- ✅ No más errores 429 (a menos que realmente haya muchos intentos)

