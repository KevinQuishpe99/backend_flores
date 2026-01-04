# 🔧 Variables de Entorno en Render

## 📋 Variables Requeridas

### ✅ Variables Configuradas en `render.yaml`

Estas ya están configuradas automáticamente:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Ambiente de producción |
| `DATABASE_URL` | (automático) | URL de conexión a PostgreSQL |
| `JWT_SECRET` | (generado) | Secret para JWT tokens |
| `FRONTEND_URL` | `https://flowerspaulas.vercel.app` | URL completa del frontend |
| `DOMAIN` | `flowerspaulas.com` | Solo el dominio (sin https://, sin www) |

### ⚙️ Variables que Debes Configurar Manualmente

Ve a Render Dashboard → Tu servicio → Environment → Add Environment Variable:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `GOOGLE_CLIENT_ID` | `tu-google-client-id` | ID de cliente de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | `tu-google-client-secret` | Secret de Google OAuth |
| `CLOUDINARY_URL` | `cloudinary://api_key:api_secret@cloud_name` | URL completa de Cloudinary |

## 🎯 Valores Correctos

### `DOMAIN`
```
✅ CORRECTO: flowerspaulas.com
❌ INCORRECTO: https://flowerspaulas.com
❌ INCORRECTO: www.flowerspaulas.com
❌ INCORRECTO: flowerspaulas.com/
```

**Por qué:** El código agrega `https://` y `http://` automáticamente:
```javascript
`https://${process.env.DOMAIN}`  // → https://flowerspaulas.com
`http://${process.env.DOMAIN}`   // → http://flowerspaulas.com
```

### `FRONTEND_URL`
```
✅ CORRECTO: https://flowerspaulas.vercel.app
❌ INCORRECTO: flowerspaulas.vercel.app
❌ INCORRECTO: http://flowerspaulas.vercel.app
```

**Por qué:** Debe ser la URL completa con protocolo porque se usa directamente en CORS.

## 📝 Cómo Configurar en Render

### Opción 1: Desde el Dashboard (Recomendado)

1. Ve a: https://dashboard.render.com
2. Selecciona tu servicio `flores-backend`
3. Click en "Environment" (en el menú lateral)
4. Para cada variable:
   - Click en "Add Environment Variable"
   - Key: `GOOGLE_CLIENT_ID` (por ejemplo)
   - Value: `tu-valor-aqui`
   - Click en "Save Changes"

### Opción 2: Desde `render.yaml` (Ya configuradas)

Las siguientes ya están en `render.yaml`:
- `NODE_ENV`
- `DATABASE_URL` (automático desde la BD)
- `JWT_SECRET` (generado automáticamente)
- `FRONTEND_URL`
- `DOMAIN`

**No necesitas configurarlas manualmente** a menos que quieras cambiarlas.

## 🔍 Verificar Variables

### En Render Shell:

```bash
# Ver todas las variables
env

# Ver una variable específica
echo $FRONTEND_URL
echo $DOMAIN
```

### En los Logs del Servidor:

Al iniciar, el servidor muestra:
```
🔗 Frontend URL: https://flowerspaulas.vercel.app
```

## ⚠️ Importante

- **`DOMAIN`**: Solo el nombre del dominio (sin protocolo, sin www)
- **`FRONTEND_URL`**: URL completa con protocolo (https://)
- **No uses `www.`** en DOMAIN, el código ya maneja eso automáticamente

## ✅ Resumen

En Render Dashboard, solo necesitas configurar manualmente:
1. `GOOGLE_CLIENT_ID`
2. `GOOGLE_CLIENT_SECRET`
3. `CLOUDINARY_URL`

Todo lo demás ya está configurado en `render.yaml`.

