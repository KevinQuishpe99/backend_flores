#!/bin/sh
set -e

PGDATA=${PGDATA:-/var/lib/postgresql/data}
DB_NAME=${POSTGRES_DB:-flores_db}
DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD:-postgres123}

# Detectar si estamos en Render o Railway (base de datos externa)
# Si DATABASE_URL apunta a un host externo (no localhost), saltar inicialización de PostgreSQL
USE_EXTERNAL_DB=false
if [ -n "$DATABASE_URL" ]; then
    # Verificar si DATABASE_URL contiene un host que no sea localhost
    if echo "$DATABASE_URL" | grep -qE '(dpg-|\.render\.com|\.railway\.app|\.supabase\.co|amazonaws\.com|\.azure\.com)' || \
       ! echo "$DATABASE_URL" | grep -qE '(localhost|127\.0\.0\.1|::1)'; then
        USE_EXTERNAL_DB=true
        echo "🔗 Detectada base de datos externa (Render/Railway), saltando inicialización de PostgreSQL local"
    fi
fi

# Asegurar permisos del directorio de datos
mkdir -p "$PGDATA"
chmod 700 "$PGDATA" || true

# Asegurar que el usuario postgres existe
if ! id postgres >/dev/null 2>&1; then
    echo "Creando usuario postgres..."
    addgroup -g 70 postgres 2>/dev/null || true
    adduser -D -u 70 -G postgres postgres 2>/dev/null || true
fi

# Inicializar PostgreSQL solo si no estamos usando base de datos externa
if [ "$USE_EXTERNAL_DB" = "false" ] && [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "Inicializando base de datos PostgreSQL..."
    # Limpiar directorio si existe pero no está inicializado correctamente
    if [ -d "$PGDATA" ] && [ ! -f "$PGDATA/PG_VERSION" ]; then
        echo "Limpiando directorio de datos incompleto..."
        rm -rf "$PGDATA"/*
    fi
    # Asegurar permisos del directorio
    mkdir -p "$PGDATA"
    chown -R postgres:postgres "$PGDATA"
    chmod 700 "$PGDATA"
    
    # Ejecutar initdb como usuario postgres
    su - postgres -c "initdb -D $PGDATA --auth-host=scram-sha-256 --auth-local=trust"
    
    # Configurar PostgreSQL
    echo "host all all 0.0.0.0/0 scram-sha-256" >> "$PGDATA/pg_hba.conf"
    echo "listen_addresses='*'" >> "$PGDATA/postgresql.conf"
    # Reducir logs de warnings (especialmente "invalid length of startup packet")
    echo "log_min_messages = 'error'" >> "$PGDATA/postgresql.conf"
    echo "log_connections = off" >> "$PGDATA/postgresql.conf"
    echo "log_disconnections = off" >> "$PGDATA/postgresql.conf"
    echo "log_min_error_statement = 'error'" >> "$PGDATA/postgresql.conf"
    echo "log_min_duration_statement = -1" >> "$PGDATA/postgresql.conf"
    echo "logging_collector = off" >> "$PGDATA/postgresql.conf"
    
    # Iniciar PostgreSQL como usuario postgres
    chown -R postgres:postgres "$PGDATA"
    su - postgres -c "pg_ctl -D $PGDATA -o '-c listen_addresses=*' -w start"
    
    # Crear base de datos y usuario
    sleep 2
    psql -U postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
    
    # Asegurar que el usuario postgres tenga contraseña
    # Si el usuario ya existe, solo actualizar la contraseña
    if [ "$DB_USER" = "postgres" ]; then
        psql -U postgres -c "ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
        psql -U postgres -c "ALTER USER postgres WITH SUPERUSER;" 2>/dev/null || true
    else
        psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || \
        psql -U postgres -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
        psql -U postgres -c "ALTER USER $DB_USER WITH SUPERUSER;" 2>/dev/null || true
    fi
    
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
    
    # Detener PostgreSQL temporalmente
    su - postgres -c "pg_ctl -D $PGDATA -m fast -w stop"
fi

# Iniciar PostgreSQL solo si no estamos usando base de datos externa
if [ "$USE_EXTERNAL_DB" = "false" ]; then
    # Crear directorio para archivos de lock de PostgreSQL
    mkdir -p /run/postgresql
    chown -R postgres:postgres /run/postgresql 2>/dev/null || true

    # Iniciar PostgreSQL en background
    echo "Iniciando PostgreSQL..."
    chown -R postgres:postgres "$PGDATA" 2>/dev/null || true
    su - postgres -c "pg_ctl -D $PGDATA -o '-c listen_addresses=*' -w start"

    # Esperar a que PostgreSQL esté listo
    echo "Esperando a que PostgreSQL esté listo..."
    for i in $(seq 1 30); do
        if pg_isready -U "$DB_USER" 2>/dev/null || pg_isready -U postgres 2>/dev/null; then
            echo "✅ PostgreSQL está listo"
            break
        fi
        sleep 1
    done
else
    echo "✅ Usando base de datos externa, PostgreSQL local no requerido"
fi

# Generar cliente de Prisma
echo "Generando cliente de Prisma..."
# Si estamos usando base de datos externa, usar DATABASE_URL del entorno
# Si no, construir DATABASE_URL local
if [ "$USE_EXTERNAL_DB" = "false" ]; then
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"
fi
# DATABASE_URL ya está configurado en el entorno si es externa
npx prisma generate || true

# Ejecutar migraciones de Prisma para crear las tablas
echo "Ejecutando migraciones de Prisma..."
npx prisma migrate deploy || true

# Ejecutar seed para crear usuario admin
echo "Ejecutando seed para crear usuario admin..."
npx prisma db seed || true

# Ejecutar el comando principal (npm start)
echo "Iniciando aplicación backend..."
exec "$@"

