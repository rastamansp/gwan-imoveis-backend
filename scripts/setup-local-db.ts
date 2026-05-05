/**
 * Script para configurar o banco de dados local do zero.
 *
 * Fluxo:
 * 1. Cria todas as tabelas via synchronize (reflete o estado atual das entities)
 * 2. Marca todas as migrations como já executadas (evita re-aplicar sobre o schema existente)
 * 3. Cria o usuário admin padrão
 *
 * Uso: npm run db:setup:local
 */
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

const ENTITIES = [User, RealtorProfile, Agent, Conversation, Message, Property, PropertyImage, UserCredit];

const MIGRATIONS_TO_MARK = [
  { timestamp: 1733256423000, name: 'MigrateOrganizerToCorretor1733256423000' },
  { timestamp: 1733262000000, name: 'CreatePropertyImagesTable1733262000000' },
  { timestamp: 1733300000000, name: 'AddPropertyPurpose1733300000000' },
  { timestamp: 1733400000000, name: 'CreateRealtorProfile1733400000000' },
  { timestamp: 1733500000000, name: 'RenameFieldsToEnglish1733500000000' },
  { timestamp: 1733500001000, name: 'FixRealtorIdNullValues1733500001000' },
];

async function setupLocalDb() {
  console.log('🚀 Configurando banco de dados local...\n');

  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres:pazdeDeus%402025@localhost:5432/gwan_imoveis';

  // Fase 1: criar schema via synchronize
  console.log('📦 Fase 1: Criando schema a partir das entities...');
  const syncDataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: ENTITIES,
    synchronize: true,
    logging: false,
    ssl: false,
  });

  await syncDataSource.initialize();
  console.log('✅ Schema criado com sucesso\n');
  await syncDataSource.destroy();

  // Fase 2: marcar migrations como executadas
  console.log('📋 Fase 2: Marcando migrations como executadas...');
  const migrationDataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: ENTITIES,
    synchronize: false,
    logging: false,
    ssl: false,
  });

  await migrationDataSource.initialize();
  const queryRunner = migrationDataSource.createQueryRunner();

  // Garantir que a tabela migrations existe
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "migrations" (
      "id" SERIAL NOT NULL,
      "timestamp" bigint NOT NULL,
      "name" character varying NOT NULL,
      CONSTRAINT "PK_migrations" PRIMARY KEY ("id")
    )
  `);

  for (const migration of MIGRATIONS_TO_MARK) {
    const exists = await queryRunner.query(
      `SELECT id FROM migrations WHERE timestamp = $1`,
      [migration.timestamp],
    );
    if (exists.length === 0) {
      await queryRunner.query(
        `INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`,
        [migration.timestamp, migration.name],
      );
      console.log(`  ✅ Marcada: ${migration.name}`);
    } else {
      console.log(`  ⏭️  Já existe: ${migration.name}`);
    }
  }

  // Fase 3: criar usuário admin
  console.log('\n👤 Fase 3: Criando usuário admin padrão...');
  const userRepository = migrationDataSource.getRepository(User);
  const existing = await userRepository.findOne({ where: { email: 'admin@gwan.cloud' } });

  if (!existing) {
    const hashedPassword = await bcrypt.hash('pazdeDeus@2025', 10);
    const admin = User.create(
      uuidv4(),
      'Administrador',
      'admin@gwan.cloud',
      hashedPassword,
      '+5511999999999',
      UserRole.ADMIN,
    );
    await userRepository.save(admin);
    console.log('  ✅ Admin criado: admin@gwan.cloud / pazdeDeus@2025');
  } else {
    console.log('  ⏭️  Admin já existe');
  }

  await queryRunner.release();
  await migrationDataSource.destroy();

  console.log('\n🎉 Banco de dados local configurado com sucesso!');
  console.log('   Execute: npm run start:dev');
}

setupLocalDb()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Erro:', error.message);
    process.exit(1);
  });
