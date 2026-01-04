import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando usuario admin...\n');

  try {
    // Buscar usuario admin
    const admin = await prisma.usuario.findUnique({
      where: { email: 'admin@flores.com' },
    });

    if (!admin) {
      console.log('❌ No se encontró el usuario admin');
      console.log('   Ejecuta: npx prisma db seed');
      return;
    }

    console.log('✅ Usuario admin encontrado:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nombre: ${admin.nombre} ${admin.apellido || ''}`);
    console.log(`   Rol: ${admin.rol}`);
    console.log(`   Activo: ${admin.activo}`);
    console.log(`   Tiene contraseña: ${admin.password ? 'Sí' : 'No'}`);

    if (admin.password) {
      console.log(`   Hash (primeros 30 chars): ${admin.password.substring(0, 30)}...`);
      
      // Verificar si la contraseña 'admin123' funciona
      const isValid = await bcrypt.compare('admin123', admin.password);
      console.log(`   ✅ Contraseña 'admin123' es válida: ${isValid ? 'Sí' : 'No'}`);
      
      if (!isValid) {
        console.log('\n⚠️  La contraseña almacenada no coincide con "admin123"');
        console.log('   Regenerando hash...');
        
        const newHash = await bcrypt.hash('admin123', 10);
        await prisma.usuario.update({
          where: { email: 'admin@flores.com' },
          data: { password: newHash },
        });
        
        console.log('   ✅ Hash regenerado exitosamente');
        console.log('   Ahora puedes iniciar sesión con: admin@flores.com / admin123');
      }
    } else {
      console.log('\n⚠️  El usuario admin no tiene contraseña');
      console.log('   Creando contraseña...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.usuario.update({
        where: { email: 'admin@flores.com' },
        data: { password: hashedPassword },
      });
      
      console.log('   ✅ Contraseña creada exitosamente');
      console.log('   Ahora puedes iniciar sesión con: admin@flores.com / admin123');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

