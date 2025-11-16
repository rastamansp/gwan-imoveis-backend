import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAgentsTable1731510000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'agents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '50',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'route',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'active',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'agents',
      new TableIndex({
        name: 'IDX_agents_slug',
        columnNames: ['slug'],
        isUnique: true,
      }),
    );

    // Seed inicial: Agente de Eventos e Agente de Saúde (idempotente)
    await queryRunner.query(
      `
      INSERT INTO agents (id, name, slug, route, active)
      VALUES 
        (uuid_generate_v4(), 'Agente de Eventos', 'events', '/api/chat', true),
        (uuid_generate_v4(), 'Agente de Saúde', 'health', '/api/chat-health', true)
      ON CONFLICT (slug) DO NOTHING
      `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('agents', 'IDX_agents_slug');
    await queryRunner.dropTable('agents');
  }
}


