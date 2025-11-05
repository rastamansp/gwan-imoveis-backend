import { ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { CacheModuleOptions } from '@nestjs/cache-manager';

/**
 * Configuração do Redis para cache
 * @param configService Serviço de configuração do NestJS
 * @returns Configuração do módulo de cache com Redis
 */
export const getRedisConfig = (configService: ConfigService): CacheModuleOptions => {
  const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

  // Extrair informações da URL do Redis
  // Formato: redis://[password@]host[:port][/database]
  const url = new URL(redisUrl);

  const config: CacheModuleOptions = {
    store: redisStore as any,
    host: url.hostname || 'localhost',
    port: url.port ? parseInt(url.port, 10) : 6379,
    // Não usar autenticação se não houver password na URL
    ...(url.password && { password: url.password }),
    // Usar database da URL se especificado, senão padrão 0
    db: url.pathname ? parseInt(url.pathname.slice(1), 10) : 0,
    ttl: 300, // TTL padrão de 5 minutos (em segundos)
  };

  return config;
};

