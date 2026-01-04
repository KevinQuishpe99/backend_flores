// Script para verificar si las tablas existen y tienen datos
// Ejecutar: node scripts/verificar_tablas.js
// Exit code 0 = OK, Exit code 1 = Faltan tablas

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarTablas() {
  try {
    console.log('🔍 Verificando estado de las tablas...\n');

    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos exitosa\n');

    // Lista de tablas requeridas
    const tablasRequeridas = [
      'usuarios',
      'arreglos',
      'tipos_arreglo',
      'pedidos',
      'notificaciones',
      'stock',
      'configuracion'
    ];

    const tablasExistentes = [];
    const tablasFaltantes = [];

    // Verificar cada tabla
    for (const tabla of tablasRequeridas) {
      try {
        // Intentar hacer una consulta simple (especificar esquema public explícitamente)
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "public"."${tabla}" LIMIT 1`);
        tablasExistentes.push(tabla);
        console.log(`✅ Tabla "${tabla}" existe`);
      } catch (error) {
        if (error.code === 'P2021' || error.message?.includes('does not exist')) {
          tablasFaltantes.push(tabla);
          console.log(`❌ Tabla "${tabla}" NO existe`);
        } else {
          // Otro tipo de error, pero la tabla existe
          tablasExistentes.push(tabla);
          console.log(`✅ Tabla "${tabla}" existe (con error de consulta)`);
        }
      }
    }

    console.log('\n📊 RESUMEN:');
    console.log(`   Tablas existentes: ${tablasExistentes.length}/${tablasRequeridas.length}`);
    console.log(`   Tablas faltantes: ${tablasFaltantes.length}`);

    if (tablasFaltantes.length > 0) {
      console.log('\n⚠️  TABLAS FALTANTES:');
      tablasFaltantes.forEach(t => console.log(`   - ${t}`));
      console.log('\n❌ ACCIÓN REQUERIDA:');
      console.log('   Ejecuta el script RECREAR_TODO.sql en PgAdmin para crear las tablas');
      process.exit(1);
    }

    // Verificar si hay datos en tablas críticas
    console.log('\n📋 Verificando datos en tablas críticas...');
    
    try {
      const usuariosCount = await prisma.usuario.count();
      console.log(`   Usuarios: ${usuariosCount}`);
      
      if (usuariosCount === 0) {
        console.log('   ⚠️  No hay usuarios. Ejecuta el seed para crear admin.');
      } else {
        const admin = await prisma.usuario.findFirst({
          where: { rol: 'ADMIN' },
          select: { email: true }
        });
        if (admin) {
          console.log(`   ✅ Usuario admin existe: ${admin.email}`);
        } else {
          console.log('   ⚠️  No hay usuario admin');
        }
      }
    } catch (error) {
      console.log('   ⚠️  No se pudo verificar usuarios');
    }

    console.log('\n✅ Todas las tablas existen. Base de datos lista.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error al verificar tablas:', error.message);
    if (error.code === 'P1001') {
      console.error('   No se pudo conectar a la base de datos');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verificarTablas();

