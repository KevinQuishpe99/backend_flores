// Script de diagnóstico para verificar la conexión y las tablas
// Ejecutar: node scripts/diagnostico_bd.js

import { PrismaClient } from '@prisma/client';
import pg from 'pg';

const prisma = new PrismaClient();
const { Client } = pg;

async function diagnosticar() {
  try {
    console.log('🔍 DIAGNÓSTICO DE BASE DE DATOS\n');
    
    // 1. Verificar DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL no está configurada');
      return;
    }
    
    console.log('📋 DATABASE_URL configurada:');
    // Ocultar contraseña
    const urlOculta = databaseUrl.replace(/:[^:@]+@/, ':****@');
    console.log(`   ${urlOculta}\n`);
    
    // Extraer información de la URL
    const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?/);
    if (urlMatch) {
      const [, user, , host, port, database, params] = urlMatch;
      console.log('📊 Información de conexión:');
      console.log(`   Usuario: ${user}`);
      console.log(`   Host: ${host}`);
      console.log(`   Puerto: ${port}`);
      console.log(`   Base de datos: ${database}`);
      console.log(`   Parámetros: ${params || '(ninguno)'}\n`);
      
      // Verificar si tiene schema=public
      if (params && params.includes('schema=public')) {
        console.log('✅ DATABASE_URL tiene schema=public');
      } else {
        console.log('⚠️  DATABASE_URL NO tiene schema=public');
        console.log('   Agrega ?schema=public al final de DATABASE_URL');
      }
      console.log('');
    }
    
    // 2. Probar conexión con Prisma
    console.log('🔌 Probando conexión con Prisma...');
    await prisma.$connect();
    console.log('✅ Conexión con Prisma exitosa\n');
    
    // 3. Verificar esquema actual
    console.log('📋 Verificando esquema actual...');
    const currentSchema = await prisma.$queryRaw`SELECT current_schema()`;
    console.log(`   Esquema actual: ${currentSchema[0].current_schema}\n`);
    
    // 4. Listar todos los esquemas
    console.log('📋 Esquemas disponibles:');
    const schemas = await prisma.$queryRaw`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name;
    `;
    schemas.forEach(s => console.log(`   - ${s.schema_name}`));
    console.log('');
    
    // 5. Listar todas las tablas en todos los esquemas
    console.log('📋 Tablas en todos los esquemas:');
    const allTables = await prisma.$queryRaw`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY table_schema, table_name;
    `;
    
    if (allTables.length === 0) {
      console.log('   ⚠️  No se encontraron tablas en ningún esquema\n');
    } else {
      const tablesBySchema = {};
      allTables.forEach(t => {
        if (!tablesBySchema[t.table_schema]) {
          tablesBySchema[t.table_schema] = [];
        }
        tablesBySchema[t.table_schema].push(t.table_name);
      });
      
      Object.keys(tablesBySchema).forEach(schema => {
        console.log(`   📁 Esquema: ${schema}`);
        tablesBySchema[schema].forEach(table => {
          console.log(`      - ${table}`);
        });
      });
      console.log('');
    }
    
    // 6. Verificar tablas específicas en public
    console.log('📋 Verificando tablas requeridas en esquema "public":');
    const tablasRequeridas = [
      'usuarios',
      'arreglos',
      'tipos_arreglo',
      'pedidos',
      'notificaciones',
      'stock',
      'configuracion'
    ];
    
    for (const tabla of tablasRequeridas) {
      try {
        const result = await prisma.$queryRawUnsafe(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          ) as exists`,
          tabla
        );
        if (result[0].exists) {
          console.log(`   ✅ ${tabla} existe en public`);
        } else {
          console.log(`   ❌ ${tabla} NO existe en public`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error al verificar ${tabla}: ${error.message}`);
      }
    }
    console.log('');
    
    // 7. Intentar consulta directa
    console.log('🔍 Intentando consulta directa a public.usuarios...');
    try {
      const test = await prisma.$queryRaw`SELECT 1 FROM "public"."usuarios" LIMIT 1`;
      console.log('✅ Consulta a public.usuarios exitosa\n');
    } catch (error) {
      console.log(`❌ Error en consulta: ${error.message}`);
      console.log(`   Código: ${error.code}\n`);
    }
    
    // 8. Verificar con cliente pg directo
    console.log('🔍 Verificando con cliente PostgreSQL directo...');
    try {
      const client = new Client({ connectionString: databaseUrl });
      await client.connect();
      
      const result = await client.query(`
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('usuarios', 'arreglos', 'pedidos', 'notificaciones', 'stock', 'tipos_arreglo', 'configuracion')
        ORDER BY table_name;
      `);
      
      console.log(`   Tablas encontradas en public: ${result.rows.length}`);
      result.rows.forEach(row => {
        console.log(`      ✅ ${row.table_schema}.${row.table_name}`);
      });
      
      await client.end();
      console.log('');
    } catch (error) {
      console.log(`   ⚠️  Error con cliente directo: ${error.message}\n`);
    }
    
    // Resumen
    console.log('📊 RESUMEN:');
    console.log('   1. Verifica que DATABASE_URL tenga ?schema=public');
    console.log('   2. Verifica que las tablas estén en el esquema "public"');
    console.log('   3. Verifica que estés conectado a la base de datos correcta');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticar();

