import { DataSource } from 'typeorm';
import { User } from '../src/shared/domain/entities/user.entity';
import * as jwt from 'jsonwebtoken';

async function generateSwaggerToken() {
  console.log('🚀 Iniciando geração do token permanente para Swagger...');
  
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:pazdedeus@postgres.gwan.com.br:5433/gwan_events',
    entities: [User],
    synchronize: false,
    logging: false,
    ssl: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ DataSource inicializado com sucesso');

    const userRepository = dataSource.getRepository(User);

    // Buscar usuário ADMIN
    const adminEmail = 'admin@gwan.com.br';
    const adminUser = await userRepository.findOne({ 
      where: { email: adminEmail } 
    });

    if (!adminUser) {
      console.error(`❌ Usuário ADMIN não encontrado com email: ${adminEmail}`);
      console.log('💡 Execute primeiro: npm run admin:create');
      process.exit(1);
    }

    // Gerar token permanente
    const jwtSecret = process.env.JWT_SECRET || 'pazdedeus';
    const payload = {
      email: adminUser.email,
      sub: adminUser.id,
      role: adminUser.role,
    };

    // Gerar token com expiração muito longa (9999 anos)
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: '9999y',
    });

    console.log('\n✅ Token gerado com sucesso!\n');
    console.log('📋 Token permanente para Swagger:');
    console.log('─'.repeat(80));
    console.log(token);
    console.log('─'.repeat(80));
    console.log('\n💡 Copie este token e configure no arquivo src/main.ts');
    console.log('   Ele será usado para pré-preencher o campo de autorização no Swagger.\n');

    // Salvar token em arquivo temporário para facilitar
    const fs = require('fs');
    const path = require('path');
    const tokenFile = path.join(__dirname, '..', '.swagger-token.txt');
    fs.writeFileSync(tokenFile, token, 'utf8');
    console.log(`💾 Token salvo em: ${tokenFile}`);

  } catch (error) {
    console.error('❌ Erro ao gerar token:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

generateSwaggerToken();

