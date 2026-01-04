#!/bin/sh
set -e

PGDATA=${PGDATA:-/var/lib/postgresql/data}
DB_NAME=${POSTGRES_DB:-flores_db}
DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD:-postgres123}

# Asegurar permisos del directorio de datos
mkdir -p "$PGDATA"
chmod 700 "$PGDATA" || true

# Asegurar que el usuario postgres existe
if ! id postgres >/dev/null 2>&1; then
    echo "Creando usuario postgres..."
    addgroup -g 70 postgres 2>/dev/null || true
    adduser -D -u 70 -G postgres postgres 2>/dev/null || true
fi

# Inicializar PostgreSQL si no existe
if [ ! -s "$PGDATA/PG_VERSION" ]; then
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

# Generar cliente de Prisma (sin migraciones, la BD se crea manualmente)
echo "Generando cliente de Prisma..."
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"
npx prisma generate || true

# Ejecutar seed para crear usuario admin (opcional, si la BD ya tiene tablas)
echo "Ejecutando seed para crear usuario admin..."
npx prisma db seed || true

# Ejecutar el comando principal (npm start)
echo "Iniciando aplicación backend..."
exec "$@"

