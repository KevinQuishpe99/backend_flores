-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'GERENTE', 'EMPLEADO', 'CLIENTE');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'TRANSFERENCIA_VERIFICADA', 'ASIGNADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoStock" AS ENUM ('DISPONIBLE', 'VENDIDO', 'RESERVADO');

-- CreateEnum
CREATE TYPE "MetodoPagoStock" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "imagen" TEXT,
    "googleId" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'CLIENTE',
    "telefono" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_arreglo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipos_arreglo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arreglos" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "arreglos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "arregloId" TEXT NOT NULL,
    "empleadoId" TEXT,
    "imagenReferencia" TEXT,
    "horaEntrega" TIMESTAMP(3) NOT NULL,
    "valorAcordado" DOUBLE PRECISION NOT NULL,
    "precioArreglo" DOUBLE PRECISION,
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

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "pedidoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "descripcion" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_googleId_key" ON "usuarios"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_arreglo_nombre_key" ON "tipos_arreglo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_clave_key" ON "configuracion"("clave");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_googleId_idx" ON "usuarios"("googleId");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE INDEX "arreglos_tipoId_idx" ON "arreglos"("tipoId");

-- CreateIndex
CREATE INDEX "arreglos_disponible_idx" ON "arreglos"("disponible");

-- CreateIndex
CREATE INDEX "pedidos_clienteId_idx" ON "pedidos"("clienteId");

-- CreateIndex
CREATE INDEX "pedidos_arregloId_idx" ON "pedidos"("arregloId");

-- CreateIndex
CREATE INDEX "pedidos_empleadoId_idx" ON "pedidos"("empleadoId");

-- CreateIndex
CREATE INDEX "pedidos_estado_idx" ON "pedidos"("estado");

-- CreateIndex
CREATE INDEX "pedidos_prioridad_idx" ON "pedidos"("prioridad");

-- CreateIndex
CREATE INDEX "notificaciones_usuarioId_idx" ON "notificaciones"("usuarioId");

-- CreateIndex
CREATE INDEX "notificaciones_leida_idx" ON "notificaciones"("leida");

-- CreateIndex
CREATE INDEX "stock_arregloId_idx" ON "stock"("arregloId");

-- CreateIndex
CREATE INDEX "stock_estado_idx" ON "stock"("estado");

-- AddForeignKey
ALTER TABLE "arreglos" ADD CONSTRAINT "arreglos_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "tipos_arreglo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arreglos" ADD CONSTRAINT "arreglos_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_arregloId_fkey" FOREIGN KEY ("arregloId") REFERENCES "arreglos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_arregloId_fkey" FOREIGN KEY ("arregloId") REFERENCES "arreglos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_vendidoPorId_fkey" FOREIGN KEY ("vendidoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateFunction
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- CreateTrigger
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON "usuarios"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CreateTrigger
CREATE TRIGGER update_tipos_arreglo_updated_at BEFORE UPDATE ON "tipos_arreglo"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CreateTrigger
CREATE TRIGGER update_arreglos_updated_at BEFORE UPDATE ON "arreglos"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CreateTrigger
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON "pedidos"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CreateTrigger
CREATE TRIGGER update_stock_updated_at BEFORE UPDATE ON "stock"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CreateTrigger
CREATE TRIGGER update_configuracion_updated_at BEFORE UPDATE ON "configuracion"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

