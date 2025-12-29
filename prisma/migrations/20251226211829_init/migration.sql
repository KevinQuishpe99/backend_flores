-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'CLIENTE', 'FLORISTA');

-- CreateEnum
CREATE TYPE "Temporada" AS ENUM ('PRIMAVERA', 'VERANO', 'OTONO', 'INVIERNO', 'TODO_EL_ANIO');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'TRANSFERENCIA_VERIFICADA', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "imagen" TEXT,
    "googleId" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'CLIENTE',
    "telefono" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "temporada" "Temporada" NOT NULL,
    "costoBase" DOUBLE PRECISION NOT NULL,
    "imagen" TEXT,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arreglos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagen" TEXT NOT NULL,
    "imagenEditada" TEXT,
    "costo" DOUBLE PRECISION NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "floristaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arreglos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "arregloId" TEXT,
    "imagenReferencia" TEXT,
    "horaEntrega" TIMESTAMP(3) NOT NULL,
    "valorAcordado" DOUBLE PRECISION NOT NULL,
    "comprobantePago" TEXT,
    "transferenciaVerificada" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_flores" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "florId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "pedido_flores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_googleId_key" ON "usuarios"("googleId");

-- AddForeignKey
ALTER TABLE "arreglos" ADD CONSTRAINT "arreglos_floristaId_fkey" FOREIGN KEY ("floristaId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_arregloId_fkey" FOREIGN KEY ("arregloId") REFERENCES "arreglos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_flores" ADD CONSTRAINT "pedido_flores_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_flores" ADD CONSTRAINT "pedido_flores_florId_fkey" FOREIGN KEY ("florId") REFERENCES "flores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
