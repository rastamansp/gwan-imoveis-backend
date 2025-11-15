import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('knowledge_diseases')
@Index('IDX_KNOWLEDGE_DISEASES_NAME', ['diseaseName'])
export class KnowledgeDisease {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  diseaseName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  causes: string | null;

  @Column({ type: 'text', nullable: true })
  treatment: string | null;

  @Column({ type: 'text', nullable: true })
  plants: string | null;

  @Column({ type: 'text', nullable: true })
  embedding: string | null; // JSON serializado do embedding

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Deserializa o embedding armazenado como JSON string para array de números
   */
  public getEmbeddingArray(): number[] | null {
    if (!this.embedding) {
      return null;
    }
    try {
      return JSON.parse(this.embedding);
    } catch (error) {
      return null;
    }
  }

  /**
   * Serializa um array de números para JSON string para armazenamento
   */
  public setEmbeddingArray(embedding: number[]): void {
    this.embedding = JSON.stringify(embedding);
  }
}

