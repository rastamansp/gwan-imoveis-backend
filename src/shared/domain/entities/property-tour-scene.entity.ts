import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Property } from './property.entity';

/**
 * Ponto clicável dentro de uma cena que leva o visitante a outra cena.
 *
 * A posição é guardada em coordenadas esféricas (yaw/pitch em radianos), e não
 * em pixels: a mesma cena é renderizada em telas de tamanhos diferentes e com
 * zoom variável, então pixel não significaria nada fora do momento do clique.
 */
export interface TourHotspot {
  id: string;
  /** Cena de destino (id de outra PropertyTourScene do mesmo imóvel). */
  targetSceneId: string;
  /** Ângulo horizontal, em radianos. */
  yaw: number;
  /** Ângulo vertical, em radianos. */
  pitch: number;
  /** Rótulo exibido no marcador. Quando vazio, usa-se o nome da cena de destino. */
  label?: string | null;
}

@Entity({ name: 'property_tour_scenes', synchronize: true })
export class PropertyTourScene {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  propertyId: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  /** Nome do ambiente: "Sala", "Suíte máster", "Varanda". */
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 500 })
  imageUrl: string;

  @Column({ type: 'varchar', length: 500 })
  imagePath: string;

  /** Ordem de exibição; a primeira cena é a de entrada do tour. */
  @Column({ type: 'int', default: 0 })
  order: number;

  /** Direção inicial da câmera ao entrar nesta cena, em radianos. */
  @Column({ type: 'double precision', default: 0 })
  initialYaw: number;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  hotspots: TourHotspot[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  public belongsToProperty(propertyId: string): boolean {
    return this.propertyId === propertyId;
  }
}
