-- AlterTable: Agregar columna empleadoId a pedidos
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "empleadoId" TEXT;

-- AddForeignKey: Relación con usuarios (empleados)
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_empleadoId_fkey" 
FOREIGN KEY ("empleadoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Agregar otras columnas que puedan faltar según el schema actual
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "precioArreglo" DOUBLE PRECISION;
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "extras" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "comprobantesExtras" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "verificadaPor" TEXT;
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "prioridad" INTEGER DEFAULT 0;
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "notasCliente" TEXT;
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "historialEstado" JSONB DEFAULT ARRAY[]::JSONB;

