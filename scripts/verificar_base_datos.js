// Script para verificar el estado de la base de datos
// Ejecutar: node scripts/verificar_base_datos.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarBaseDatos() {
  try {
    console.log('🔍 Verificando estado de la base de datos...\n');

    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos exitosa\n');

    // Verificar tablas
    const tablas = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('📋 Tablas existentes:');
    if (tablas.length === 0) {
      console.log('   ⚠️  No hay tablas en la base de datos');
    } else {
      tablas.forEach(t => console.log(`   ✅ ${t.table_name}`));
    }
    console.log('');

    // Verificar enums
    const enums = await prisma.$queryRaw`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      ORDER BY typname;
    `;
    
    console.log('📋 Enums existentes:');
    if (enums.length === 0) {
      console.log('   ⚠️  No hay enums en la base de datos');
    } else {
      enums.forEach(e => console.log(`   ✅ ${e.typname}`));
    }
    console.log('');

    // Verificar columnas de pedidos (si existe)
    try {
      const columnasPedidos = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'pedidos'
        ORDER BY ordinal_position;
      `;
      
      if (columnasPedidos.length > 0) {
        console.log('📋 Columnas de la tabla pedidos:');
        columnasPedidos.forEach(c => {
          const nullable = c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          console.log(`   ${c.column_name} (${c.data_type}) ${nullable}`);
        });
        console.log('');

        // Verificar específicamente empleadoId
        const tieneEmpleadoId = columnasPedidos.some(c => c.column_name === 'empleadoId');
        if (!tieneEmpleadoId) {
          console.log('   ⚠️  FALTA: columna empleadoId');
        } else {
          console.log('   ✅ Columna empleadoId existe');
        }
        console.log('');
      }
    } catch (error) {
      console.log('   ⚠️  La tabla pedidos no existe\n');
    }

    // Verificar usuarios
    try {
      const usuarios = await prisma.usuario.count();
      console.log(`👥 Usuarios en la base de datos: ${usuarios}`);
      
      if (usuarios > 0) {
        const admin = await prisma.usuario.findFirst({
          where: { rol: 'ADMIN' },
          select: { email: true, nombre: true, rol: true }
        });
        if (admin) {
          console.log(`   ✅ Usuario admin: ${admin.email} (${admin.nombre})`);
        } else {
          console.log('   ⚠️  No hay usuario admin');
        }
      }
      console.log('');
    } catch (error) {
      console.log('   ⚠️  La tabla usuarios no existe\n');
    }

    // Resumen
    console.log('📊 RESUMEN:');
    console.log(`   Tablas: ${tablas.length}/7 esperadas`);
    console.log(`   Enums: ${enums.length}/4 esperados`);
    
    if (tablas.length < 7) {
      console.log('\n⚠️  ACCIÓN REQUERIDA:');
      console.log('   Ejecuta el script RECREAR_TODO.sql en PgAdmin para crear todas las tablas');
    } else {
      console.log('\n✅ Base de datos configurada correctamente');
    }

  } catch (error) {
    console.error('❌ Error al verificar base de datos:', error.message);
    if (error.code === 'P2021') {
      console.error('   La base de datos no tiene las tablas necesarias');
      console.error('   Ejecuta RECREAR_TODO.sql en PgAdmin');
    }
  } finally {
    await prisma.$disconnect();
  }
}

verificarBaseDatos();

