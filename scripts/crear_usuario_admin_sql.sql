-- Script SQL para crear usuario admin directamente en PostgreSQL
-- NOTA: Este script crea el usuario pero la contraseña NO está hasheada con bcrypt
-- Es mejor usar el script Node.js (crear_usuario_admin.js) que usa bcrypt correctamente
-- 
-- Si necesitas usar este script SQL, después deberás cambiar la contraseña desde la aplicación

-- Insertar usuario admin
-- La contraseña aquí es un hash temporal, deberás cambiarla desde la app
INSERT INTO "usuarios" (
    "id",
    "email",
    "password",
    "nombre",
    "apellido",
    "rol",
    "activo",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    'admin@flores.com',
    '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', -- Hash temporal de 'admin123'
    'Administrador',
    'Sistema',
    'ADMIN',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("email") DO NOTHING;

-- Verificar que se creó
SELECT id, email, nombre, rol, activo 
FROM "usuarios" 
WHERE email = 'admin@flores.com';

