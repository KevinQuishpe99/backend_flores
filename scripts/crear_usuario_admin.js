// Script para crear usuario admin en PostgreSQL
// Ejecutar: node scripts/crear_usuario_admin.js

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function crearAdmin() {
  try {
    console.log('🌱 Iniciando creación de usuario admin...');

    // Verificar si ya existe un admin
    const existingAdmin = await prisma.usuario.findFirst({
      where: { rol: 'ADMIN' },
    });

    if (existingAdmin) {
      console.log('✅ Ya existe un usuario admin:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   ID: ${existingAdmin.id}`);
      return;
    }

    // Generar hash de la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Crear usuario admin
    const admin = await prisma.usuario.create({
      data: {
        id: crypto.randomUUID(),
        email: 'admin@flores.com',
        password: hashedPassword,
        nombre: 'Administrador',
        apellido: 'Sistema',
        rol: 'ADMIN',
        activo: true,
      },
    });

    console.log('✅ Usuario admin creado exitosamente:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nombre: ${admin.nombre} ${admin.apellido}`);
    console.log(`   Rol: ${admin.rol}`);
    console.log('');
    console.log('🔑 Credenciales de acceso:');
    console.log('   Email: admin@flores.com');
    console.log('   Contraseña: admin123');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión');
  } catch (error) {
    console.error('❌ Error al crear usuario admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

crearAdmin()
  .then(() => {
    console.log('✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

