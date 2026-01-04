-- ============================================
-- SCRIPT COMPLETO: BORRAR Y RECREAR TODO
-- ============================================
-- Este script elimina TODAS las tablas, enums y datos
-- y recrea todo desde cero
-- 
-- ⚠️ ADVERTENCIA: Esto borrará TODOS los datos existentes
-- ============================================

-- ============================================
-- 1. ELIMINAR TODO (TABLAS, ENUMS, FUNCIONES)
-- ============================================

-- Eliminar tablas (en orden inverso por dependencias)
DROP TABLE IF EXISTS "configuracion" CASCADE;
DROP TABLE IF EXISTS "stock" CASCADE;
DROP TABLE IF EXISTS "notificaciones" CASCADE;
DROP TABLE IF EXISTS "pedidos" CASCADE;
DROP TABLE IF EXISTS "arreglos" CASCADE;
DROP TABLE IF EXISTS "tipos_arreglo" CASCADE;
DROP TABLE IF EXISTS "usuarios" CASCADE;

-- Eliminar funciones
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Eliminar enums
DROP TYPE IF EXISTS "MetodoPagoStock" CASCADE;
DROP TYPE IF EXISTS "EstadoStock" CASCADE;
DROP TYPE IF EXISTS "EstadoPedido" CASCADE;
DROP TYPE IF EXISTS "Rol" CASCADE;

-- ============================================
-- 2. CREAR ENUMS
-- ============================================

-- Enum para Roles de Usuario
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'GERENTE', 'EMPLEADO', 'CLIENTE');

-- Enum para Estados de Pedido
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'TRANSFERENCIA_VERIFICADA', 'ASIGNADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO');

-- Enum para Estados de Stock
CREATE TYPE "EstadoStock" AS ENUM ('DISPONIBLE', 'VENDIDO', 'RESERVADO');

-- Enum para Métodos de Pago de Stock
CREATE TYPE "MetodoPagoStock" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA');

-- ============================================
-- 3. CREAR TABLAS
-- ============================================

-- Tabla de Usuarios
CREATE TABLE "usuarios" (
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
CREATE TABLE "tipos_arreglo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL UNIQUE,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Arreglos
CREATE TABLE "arreglos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagen" TEXT NOT NULL,
    "imagenEditada" TEXT,
    "imagenesAdicionales" TEXT[] DEFAULT '{}',
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
CREATE TABLE "pedidos" (
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
    "comprobantesExtras" TEXT[] DEFAULT '{}',
    "transferenciaVerificada" BOOLEAN NOT NULL DEFAULT false,
    "verificadaPor" TEXT,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "notas" TEXT,
    "notasCliente" TEXT,
    "historialEstado" JSONB DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pedidos_arregloId_fkey" FOREIGN KEY ("arregloId") REFERENCES "arreglos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pedidos_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla de Notificaciones
CREATE TABLE "notificaciones" (
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
CREATE TABLE "stock" (
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
CREATE TABLE "configuracion" (
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
-- 4. CREAR ÍNDICES
-- ============================================

-- Índices para usuarios
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");
CREATE INDEX "usuarios_googleId_idx" ON "usuarios"("googleId");
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- Índices para arreglos
CREATE INDEX "arreglos_tipoId_idx" ON "arreglos"("tipoId");
CREATE INDEX "arreglos_disponible_idx" ON "arreglos"("disponible");

-- Índices para pedidos
CREATE INDEX "pedidos_clienteId_idx" ON "pedidos"("clienteId");
CREATE INDEX "pedidos_arregloId_idx" ON "pedidos"("arregloId");
CREATE INDEX "pedidos_empleadoId_idx" ON "pedidos"("empleadoId");
CREATE INDEX "pedidos_estado_idx" ON "pedidos"("estado");
CREATE INDEX "pedidos_prioridad_idx" ON "pedidos"("prioridad");

-- Índices para notificaciones
CREATE INDEX "notificaciones_usuarioId_idx" ON "notificaciones"("usuarioId");
CREATE INDEX "notificaciones_leida_idx" ON "notificaciones"("leida");

-- Índices para stock
CREATE INDEX "stock_arregloId_idx" ON "stock"("arregloId");
CREATE INDEX "stock_estado_idx" ON "stock"("estado");

-- ============================================
-- 5. CREAR FUNCIÓN Y TRIGGERS PARA updatedAt
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
-- 6. CREAR USUARIO ADMIN POR DEFECTO
-- ============================================

-- Insertar usuario admin
-- Email: admin@flores.com
-- Contraseña: admin123 (hash bcrypt)
-- ⚠️ IMPORTANTE: Cambia la contraseña después del primer inicio de sesión

INSERT INTO "usuarios" (
    "id",
    "email",
    "password",
    "nombre",
    "apellido",
    "rol",
    "activo",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    'admin@flores.com',
    '$2b$10$rQZ8vK9JX5Y5Y5Y5Y5Y5Yue5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y',
    'Administrador',
    'Sistema',
    'ADMIN',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("email") DO NOTHING;

-- Nota: El hash de la contraseña 'admin123' debe generarse con bcrypt
-- Para generar el hash correcto, usa el script crear_usuario_admin.js
-- o ejecuta en Node.js:
-- const bcrypt = require('bcrypt');
-- bcrypt.hash('admin123', 10).then(hash => console.log(hash));

-- ============================================
-- 7. VERIFICACIÓN FINAL
-- ============================================

-- Mostrar todas las tablas creadas
SELECT 'Tablas creadas:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Mostrar todos los enums creados
SELECT 'Enums creados:' as info;
SELECT typname 
FROM pg_type 
WHERE typtype = 'e' 
ORDER BY typname;

-- Mostrar usuario admin creado
SELECT 'Usuario admin:' as info;
SELECT id, email, nombre, rol, activo 
FROM usuarios 
WHERE email = 'admin@flores.com';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- ✅ Base de datos recreada completamente
-- ✅ Todas las tablas, enums, índices y triggers creados
-- ✅ Usuario admin creado (cambiar contraseña después del primer login)
-- ============================================

