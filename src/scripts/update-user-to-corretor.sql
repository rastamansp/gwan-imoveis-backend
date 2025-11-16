-- Script SQL para atualizar um usuário para role CORRETOR
-- Substitua '<user-id>' ou '<user-email>' pelo ID ou email do usuário

-- Opção 1: Atualizar por ID
UPDATE users 
SET role = 'CORRETOR' 
WHERE id = '<user-id>';

-- Opção 2: Atualizar por email
UPDATE users 
SET role = 'CORRETOR' 
WHERE email = '<user-email>';

-- Verificar valores disponíveis no enum
SELECT enumlabel as role_value
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_role_enum')
ORDER BY enumsortorder;

-- Verificar usuários e seus roles
SELECT id, name, email, role::text as role
FROM users
ORDER BY "createdAt";

