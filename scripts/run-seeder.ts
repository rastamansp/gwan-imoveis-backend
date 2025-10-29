import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DatabaseSeeder } from '../src/database/seeder';

async function runSeeder() {
  console.log('🚀 Iniciando seeder do banco de dados...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const seeder = app.get(DatabaseSeeder);
    await seeder.seed();
    console.log('✅ Seeder executado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar seeder:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runSeeder();
