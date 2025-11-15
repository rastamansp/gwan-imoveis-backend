import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getKnowledgeDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('DATABASE_KWNOWLEDGE_URL');
  
  // Parse DATABASE_KWNOWLEDGE_URL se fornecido
  let connectionOptions: any = {};
  if (databaseUrl) {
    const url = new URL(databaseUrl.replace('postgresql://', 'http://'));
    connectionOptions = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1),
    };
  }
  
  return {
    type: 'postgres',
    ...connectionOptions,
    url: databaseUrl,
    name: 'knowledge', // Nome da conexão para diferenciar do banco principal
    entities: [__dirname + '/../**/*knowledge*.entity{.ts,.js}', __dirname + '/../**/knowledge-disease.entity{.ts,.js}'],
    synchronize: false, // Nunca usar synchronize em produção
    logging: false, // Desabilitar logging de queries SQL
    ssl: false,  // Desabilitar SSL explicitamente
  };
};

