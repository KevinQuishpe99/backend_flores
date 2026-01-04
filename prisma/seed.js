import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Verificar si las tablas existen
  try {
    await prisma.$queryRaw`SELECT 1 FROM "public"."usuarios" LIMIT 1`;
  } catch (error) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.log('⚠️  Las tablas no existen en la base de datos');
      console.log('   Ejecuta el script RECREAR_TODO.sql en PgAdmin primero');
      return;
    }
    throw error;
  }

  // Verificar si ya existe un admin
  const existingAdmin = await prisma.usuario.findFirst({
    where: { rol: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log('✅ Ya existe un usuario admin:', existingAdmin.email);
    return;
  }

  // Crear usuario admin por defecto
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@flores.com',
      password: hashedPassword,
      nombre: 'Administrador',
      apellido: 'Sistema',
      rol: 'ADMIN',
      activo: true,
    },
  });

  console.log('✅ Usuario admin creado exitosamente:');
  console.log('   Email: admin@flores.com');
  console.log('   Contraseña: admin123');
  console.log('   ⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión');
}

main()
  .catch((e) => {
    if (e.code === 'P2021' || e.message?.includes('does not exist')) {
      console.log('⚠️  Las tablas no existen. Ejecuta RECREAR_TODO.sql primero.');
      process.exit(0); // Salir sin error si las tablas no existen
    } else {
      console.error('❌ Error en seed:', e);
      process.exit(1);
    }
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

