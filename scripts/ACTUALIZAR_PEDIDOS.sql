-- Script para actualizar la tabla pedidos con las columnas faltantes
-- Ejecutar este script en Render Shell si la tabla ya existe pero faltan columnas

-- Agregar columna empleadoId (si no existe)
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "empleadoId" TEXT;

-- Agregar foreign key para empleadoId (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_empleadoId_fkey'
    ) THEN
        ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_empleadoId_fkey" 
        FOREIGN KEY ("empleadoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Agregar otras columnas que puedan faltar
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "precioArreglo" DOUBLE PRECISION;
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "extras" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "comprobantesExtras" TEXT[] DEFAULT '{}';
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "verificadaPor" TEXT;
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "prioridad" INTEGER DEFAULT 0;
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "notasCliente" TEXT;
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "historialEstado" JSONB DEFAULT '[]'::jsonb;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS "pedidos_empleadoId_idx" ON "pedidos"("empleadoId");
CREATE INDEX IF NOT EXISTS "pedidos_prioridad_idx" ON "pedidos"("prioridad");

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pedidos'
ORDER BY ordinal_position;

