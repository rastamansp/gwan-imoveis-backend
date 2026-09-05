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
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    /**
     * DESLIGADO EM TODOS OS AMBIENTES. Não religue sem ler isto.
     *
     * Este valor era `NODE_ENV !== 'production'`, e o efeito medido em
     * 2026-09-05 foi: **duas colunas antes do boot, zero depois.**
     *
     * O `synchronize` alinha o banco às entidades — e por isso **remove o que as
     * entidades não declaram**. As colunas `embeddingVoyage vector(512)` e
     * `embeddingOpenai vector(1536)` não podem ser declaradas na entidade
     * `Property`, porque o TypeORM não modela o tipo `vector` do pgvector; elas
     * são criadas por migration e escritas por SQL cru. O resultado é que todo
     * boot em desenvolvimento as apagava, e a busca semântica (F02) **nunca
     * funcionou em local** — respondia `500 — column property.embeddingVoyage
     * does not exist`, com a migration constando como executada e o pgvector
     * instalado, o que mandava quem investigasse para o lado errado.
     *
     * O risco maior não era o dev: era produção depender de uma variável de
     * ambiente para não se autodestruir. Com `NODE_ENV` vazio ou errado num
     * deploy, o boot apagaria os embeddings de todos os imóveis — sem erro, sem
     * aviso, e com o custo de refazer o backfill inteiro pagando de novo as
     * chamadas ao provider.
     *
     * O schema deste projeto vem das migrations versionadas, que é o mecanismo
     * real. Mudou entidade? Gere a migration:
     *
     *   npm run typeorm:migration:generate -- src/migrations/NomeDaMudanca
     *   npm run typeorm:migration:run
     */
    synchronize: false,
    logging: false, // Desabilitar logging de queries SQL
    ssl: false,  // Desabilitar SSL explicitamente
  };
};
