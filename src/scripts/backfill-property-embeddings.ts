import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { IPropertyRepository } from '../shared/domain/interfaces/property-repository.interface';
import { IEmbeddingService } from '../shared/application/interfaces/embedding-service.interface';
import { GeneratePropertyEmbeddingUseCase } from '../shared/application/use-cases/generate-property-embedding.use-case';
import { Property } from '../shared/domain/entities/property.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmbeddingProviderName } from '../shared/infrastructure/services/embedding/embedding-provider.interface';

interface CliArgs {
  force: boolean;
  providerOverride?: EmbeddingProviderName;
  rateMs: number;
  batchSize: number;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { force: false, rateMs: 200, batchSize: 50 };
  for (const arg of argv.slice(2)) {
    if (arg === '--force') args.force = true;
    else if (arg.startsWith('--provider=')) {
      const v = arg.split('=')[1];
      if (v === 'voyage' || v === 'openai') args.providerOverride = v;
    } else if (arg.startsWith('--rate-ms=')) {
      args.rateMs = parseInt(arg.split('=')[1], 10) || 200;
    } else if (arg.startsWith('--batch=')) {
      args.batchSize = parseInt(arg.split('=')[1], 10) || 50;
    }
  }
  return args;
}

async function main() {
  const logger = new Logger('BackfillPropertyEmbeddings');
  const args = parseArgs(process.argv);

  if (args.providerOverride) {
    process.env.EMBEDDING_PROVIDER = args.providerOverride;
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'error', 'warn'] });

  try {
    const repo = app.get<IPropertyRepository>('IPropertyRepository');
    const embedding = app.get<IEmbeddingService>('IEmbeddingService');
    const generate = app.get(GeneratePropertyEmbeddingUseCase);
    const propRepo = app.get<Repository<Property>>(getRepositoryToken(Property));

    const provider = embedding.getProviderName();
    const providerColumn = provider === 'voyage' ? 'embeddingVoyage' : 'embeddingOpenai';
    logger.log(`Backfill de embeddings — provider=${provider} model=${embedding.getModel()} dim=${embedding.getEmbeddingDimension()} force=${args.force} rate=${args.rateMs}ms batch=${args.batchSize}`);

    let succeeded = 0;
    let failed = 0;

    while (true) {
      let ids: string[];
      if (args.force) {
        const rows = await propRepo.query(
          `SELECT id FROM properties ORDER BY "createdAt" ASC OFFSET $1 LIMIT $2`,
          [succeeded + failed, args.batchSize],
        );
        ids = rows.map((r: { id: string }) => r.id);
      } else {
        ids = await repo.findIdsWithoutEmbedding(provider, args.batchSize);
      }

      if (ids.length === 0) break;

      for (const id of ids) {
        const property = await repo.findById(id);
        if (!property) {
          logger.warn(`Imóvel ${id} não encontrado, pulando`);
          continue;
        }
        await generate.execute(property);

        const row = await propRepo.query(
          `SELECT "${providerColumn}" IS NOT NULL AS ok FROM properties WHERE id = $1`,
          [id],
        );
        if (row[0]?.ok) {
          succeeded += 1;
        } else {
          failed += 1;
        }
        if ((succeeded + failed) % 10 === 0) {
          logger.log(`Progresso: ${succeeded} sucesso, ${failed} falhas`);
        }
        await sleep(args.rateMs);
      }

      if (!args.force && ids.length < args.batchSize) break;
    }

    if (failed > 0) {
      logger.error(`Backfill concluído com falhas: ${succeeded} sucesso, ${failed} falhas`);
      process.exitCode = 1;
    } else {
      logger.log(`Backfill concluído: ${succeeded} sucesso, ${failed} falhas`);
    }
  } finally {
    await app.close();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error('Erro fatal no backfill:', err);
  process.exit(1);
});
