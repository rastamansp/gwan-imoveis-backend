import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('agents')
@Index(['slug'], { unique: true })
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  route: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Factory estática para criação explícita
  static create(name: string, slug: string, route: string, active: boolean = true): Agent {
    const agent = new Agent();
    agent.name = name;
    agent.slug = slug;
    agent.route = route;
    agent.active = active;
    return agent;
  }
}


