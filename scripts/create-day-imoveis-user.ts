import { DataSource } from 'typeorm';
import { User } from '../src/shared/domain/entities/user.entity';
import { RealtorProfile } from '../src/shared/domain/entities/realtor-profile.entity';
import { Agent } from '../src/shared/domain/entities/agent.entity';
import { Conversation } from '../src/shared/domain/entities/conversation.entity';
import { Message } from '../src/shared/domain/entities/message.entity';
import { Property } from '../src/shared/domain/entities/property.entity';
import { PropertyImage } from '../src/shared/domain/entities/property-image.entity';
import { UserCredit } from '../src/shared/domain/entities/user-credit.entity';
import { UserRole } from '../src/shared/domain/value-objects/user-role.enum';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

// ─────────────────────────────────────────────
// Dados do usuário a ser criado
// Para criar outro usuário, edite apenas este objeto
// ─────────────────────────────────────────────
const USER_SEED = {
  name: 'Day Imóveis',
  email: 'dayimoveis@gwan.cloud.com',
  password: 'pazdedeus',
  phone: '+5512988450003',
  role: UserRole.CORRETOR,
};
// ─────────────────────────────────────────────

async function createUserFromSeed() {
  console.log(`🚀 Iniciando criação do usuário: ${USER_SEED.name}...`);

  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres:pazdedeus@postgres.gwan.cloud:5433/gwan_imoveis';

  const dataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: [User, RealtorProfile, Agent, Conversation, Message, Property, PropertyImage, UserCredit],
    synchronize: false,
    logging: true,
    ssl: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ DataSource inicializado com sucesso');

    const userRepository = dataSource.getRepository(User);

    const existingUser = await userRepository.findOne({
      where: { email: USER_SEED.email },
    });

    if (existingUser) {
      console.log('⚠️ Usuário já existe:', {
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(USER_SEED.password, 10);
    const newUser = User.create(
      uuidv4(),
      USER_SEED.name,
      USER_SEED.email,
      hashedPassword,
      USER_SEED.phone,
      null,            // whatsappNumber
      null,            // preferredAgentId
      USER_SEED.role,  // role
    );

    const savedUser = await userRepository.save(newUser);

    console.log('✅ Usuário criado com sucesso:', {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role,
      createdAt: savedUser.createdAt,
    });

    console.log('🔑 Credenciais:');
    console.log(`   Email: ${USER_SEED.email}`);
    console.log(`   Senha: ${USER_SEED.password}`);
    console.log(`   Role:  ${USER_SEED.role}`);
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('🔌 DataSource desconectado');
  }
}

if (require.main === module) {
  createUserFromSeed()
    .then(() => {
      console.log('🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro na execução do script:', error);
      process.exit(1);
    });
}

export { createUserFromSeed };
