# Backend Dockerfile con PostgreSQL integrado
FROM node:18-alpine

# Instalar PostgreSQL y dependencias del sistema
RUN apk add --no-cache \
    openssl \
    postgresql \
    postgresql-contrib \
    su-exec

# Crear usuarios necesarios
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
# El usuario postgres se crea automáticamente al instalar PostgreSQL

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Cambiar ownership antes de instalar
RUN chown -R nodejs:nodejs /app

# Cambiar a usuario no-root
USER nodejs

# Instalar dependencias (todas para desarrollo)
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# Volver a root temporalmente para copiar archivos y configurar PostgreSQL
USER root

# Copiar código fuente
COPY --chown=nodejs:nodejs . .

# Crear directorio de uploads con permisos correctos
RUN mkdir -p uploads && \
    chown -R nodejs:nodejs uploads

# Crear directorios de PostgreSQL
RUN mkdir -p /var/lib/postgresql/data && \
    mkdir -p /run/postgresql && \
    chown -R postgres:postgres /var/lib/postgresql/data && \
    chown -R postgres:postgres /run/postgresql

# Copiar script de inicio
COPY --chown=root:root docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Mantener como root para ejecutar PostgreSQL (necesario para initdb)
# USER nodejs

# Exponer puertos
EXPOSE 5000 5432

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
