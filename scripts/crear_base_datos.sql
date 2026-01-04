-- Script SQL para crear todas las tablas en PostgreSQL
-- Ejecutar este script en Render Shell o en cualquier cliente PostgreSQL

-- ============================================
-- 1. CREAR ENUMS
-- ============================================

-- Enum para Roles de Usuario
DO $$ BEGIN
    CREATE TYPE "Rol" AS ENUM ('ADMIN', 'GERENTE', 'EMPLEADO', 'CLIENTE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para Estados de Pedido
DO $$ BEGIN
    CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'TRANSFERENCIA_VERIFICADA', 'ASIGNADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para Estados de Stock
DO $$ BEGIN
    CREATE TYPE "EstadoStock" AS ENUM ('DISPONIBLE', 'VENDIDO', 'RESERVADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para Métodos de Pago de Stock
DO $$ BEGIN
    CREATE TYPE "MetodoPagoStock" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. CREAR TABLAS
-- ============================================

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS "usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "imagen" TEXT,
    "googleId" TEXT UNIQUE,
    "rol" "Rol" NOT NULL DEFAULT 'CLIENTE',
    "telefono" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Tipos de Arreglo
CREATE TABLE IF NOT EXISTS "tipos_arreglo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL UNIQUE,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Arreglos
CREATE TABLE IF NOT EXISTS "arreglos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagen" TEXT NOT NULL,
    "imagenEditada" TEXT,
    "imagenesAdicionales" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "costo" DOUBLE PRECISION NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "tipoId" TEXT,
    "creadorId" TEXT,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "arreglos_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "tipos_arreglo"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "arreglos_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla de Pedidos
CREATE TABLE IF NOT EXISTS "pedidos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "arregloId" TEXT NOT NULL,
    "empleadoId" TEXT,
    "imagenReferencia" TEXT,
    "horaEntrega" TIMESTAMP(3) NOT NULL,
    "valorAcordado" DOUBLE PRECISION NOT NULL,
    "precioArreglo" DOUBLE PRECISION NOT NULL,
    "extras" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comprobantePago" TEXT,
    "comprobantesExtras" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "transferenciaVerificada" BOOLEAN NOT NULL DEFAULT false,
    "verificadaPor" TEXT,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "notas" TEXT,
    "notasCliente" TEXT,
    "historialEstado" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pedidos_arregloId_fkey" FOREIGN KEY ("arregloId") REFERENCES "arreglos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pedidos_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS "notificaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "pedidoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla de Stock
CREATE TABLE IF NOT EXISTS "stock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "arregloId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precioVenta" DOUBLE PRECISION NOT NULL,
    "imagen" TEXT,
    "estado" "EstadoStock" NOT NULL DEFAULT 'DISPONIBLE',
    "creadoPorId" TEXT NOT NULL,
    "vendidoPorId" TEXT,
    "metodoPago" "MetodoPagoStock",
    "comprobantePago" TEXT,
    "notas" TEXT,
    "fechaVenta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_arregloId_fkey" FOREIGN KEY ("arregloId") REFERENCES "arreglos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_vendidoPorId_fkey" FOREIGN KEY ("vendidoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla de Configuración
CREATE TABLE IF NOT EXISTS "configuracion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clave" TEXT NOT NULL UNIQUE,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "descripcion" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. CREAR ÍNDICES
-- ============================================

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS "usuarios_email_idx" ON "usuarios"("email");
CREATE INDEX IF NOT EXISTS "usuarios_googleId_idx" ON "usuarios"("googleId");
CREATE INDEX IF NOT EXISTS "usuarios_rol_idx" ON "usuarios"("rol");

-- Índices para arreglos
CREATE INDEX IF NOT EXISTS "arreglos_tipoId_idx" ON "arreglos"("tipoId");
CREATE INDEX IF NOT EXISTS "arreglos_disponible_idx" ON "arreglos"("disponible");

-- Índices para pedidos
CREATE INDEX IF NOT EXISTS "pedidos_clienteId_idx" ON "pedidos"("clienteId");
CREATE INDEX IF NOT EXISTS "pedidos_arregloId_idx" ON "pedidos"("arregloId");
CREATE INDEX IF NOT EXISTS "pedidos_empleadoId_idx" ON "pedidos"("empleadoId");
CREATE INDEX IF NOT EXISTS "pedidos_estado_idx" ON "pedidos"("estado");
CREATE INDEX IF NOT EXISTS "pedidos_prioridad_idx" ON "pedidos"("prioridad");

-- Índices para notificaciones
CREATE INDEX IF NOT EXISTS "notificaciones_usuarioId_idx" ON "notificaciones"("usuarioId");
CREATE INDEX IF NOT EXISTS "notificaciones_leida_idx" ON "notificaciones"("leida");

-- Índices para stock
CREATE INDEX IF NOT EXISTS "stock_arregloId_idx" ON "stock"("arregloId");
CREATE INDEX IF NOT EXISTS "stock_estado_idx" ON "stock"("estado");

-- ============================================
-- 4. FUNCIÓN PARA ACTUALIZAR updatedAt
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updatedAt automáticamente
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON "usuarios"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipos_arreglo_updated_at BEFORE UPDATE ON "tipos_arreglo"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_arreglos_updated_at BEFORE UPDATE ON "arreglos"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON "pedidos"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_updated_at BEFORE UPDATE ON "stock"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracion_updated_at BEFORE UPDATE ON "configuracion"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. VERIFICAR QUE TODO SE CREÓ CORRECTAMENTE
-- ============================================

-- Mostrar todas las tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Mostrar todos los enums creados
SELECT typname 
FROM pg_type 
WHERE typtype = 'e' 
ORDER BY typname;

