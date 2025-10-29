import { DataSource } from 'typeorm';
import { User } from '../src/shared/domain/entities/user.entity';
import { UserRole } from '../src/shared/domain/value-objects/user-role.enum';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function createAdmin() {
  console.log('🚀 Iniciando criação do usuário ADMIN...');
  
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:pazdedeus@postgres.gwan.com.br:5433/gwan_events',
    entities: [User],
    synchronize: false,
    logging: true,
    ssl: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ DataSource inicializado com sucesso');

    const userRepository = dataSource.getRepository(User);

    // Verificar se já existe admin@gwan.com.br
    const existingAdmin = await userRepository.findOne({ 
      where: { email: 'admin@gwan.com.br' } 
    });

    if (existingAdmin) {
      console.log('⚠️ Usuário ADMIN já existe:', {
        id: existingAdmin.id,
        email: existingAdmin.email,
        role: existingAdmin.role,
      });
      return;
    }

    // Criar usuário ADMIN
    const hashedPassword = await bcrypt.hash('pazdedeus', 10);
    const adminUser = User.create(
      uuidv4(),
      'Administrador do Sistema',
      'admin@gwan.com.br',
      hashedPassword,
      '+5511999999999',
      UserRole.ADMIN
    );

    const savedAdmin = await userRepository.save(adminUser);
    
    console.log('✅ Usuário ADMIN criado com sucesso:', {
      id: savedAdmin.id,
      email: savedAdmin.email,
      name: savedAdmin.name,
      role: savedAdmin.role,
      createdAt: savedAdmin.createdAt,
    });

    console.log('🔑 Credenciais do ADMIN:');
    console.log('   Email: admin@gwan.com.br');
    console.log('   Senha: pazdedeus');
    console.log('   Role: ADMIN');

  } catch (error) {
    console.error('❌ Erro ao criar usuário ADMIN:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('🔌 DataSource desconectado');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createAdmin()
    .then(() => {
      console.log('🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro na execução do script:', error);
      process.exit(1);
    });
}

export { createAdmin };
