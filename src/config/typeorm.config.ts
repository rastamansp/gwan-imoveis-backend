import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');
  
  // Parse DATABASE_URL se fornecido
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
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/migrations/*.js'],
    synchronize: configService.get<string>('NODE_ENV') !== 'production',
    logging: false, // Desabilitar logging de queries SQL
    ssl: false,  // Desabilitar SSL explicitamente
  };
};
