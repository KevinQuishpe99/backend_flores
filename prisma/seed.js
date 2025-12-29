import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

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
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

