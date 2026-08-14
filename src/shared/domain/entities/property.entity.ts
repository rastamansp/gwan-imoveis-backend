import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { PropertyType } from '../value-objects/property-type.enum';
import { PropertyPurpose } from '../value-objects/property-purpose.enum';
import { User } from './user.entity';
import { PropertyImage } from './property-image.entity';

@Entity({ name: 'properties', synchronize: true })
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: PropertyType })
  type: PropertyType;

  @Column({ type: 'enum', enum: PropertyPurpose, default: PropertyPurpose.RENT })
  purpose: PropertyPurpose;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 255 })
  neighborhood: string;

  @Column({ type: 'varchar', length: 255 })
  city: string;

  @Column({ type: 'int', nullable: true })
  bedrooms?: number;

  @Column({ type: 'int', nullable: true })
  bathrooms?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  area: number;

  @Column({ type: 'int', nullable: true })
  garageSpaces?: number;

  // Amenities
  @Column({ type: 'boolean', default: false })
  hasPool: boolean;

  @Column({ type: 'boolean', default: false })
  hasJacuzzi: boolean;

  @Column({ type: 'boolean', default: false })
  oceanFront: boolean;

  @Column({ type: 'boolean', default: false })
  hasGarden: boolean;

  @Column({ type: 'boolean', default: false })
  hasGourmetArea: boolean;

  @Column({ type: 'boolean', default: false })
  furnished: boolean;

  // Relationship with realtor
  @Column({ type: 'uuid' })
  realtorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'realtorId' })
  realtor: User;

  // Imagem de capa
  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImageUrl?: string;

  // Tour virtual: foto panorâmica equirretangular (360°) exibida em visualizador
  // interativo na página do imóvel. Guardada sem redimensionamento — recortar ou
  // reescalar quebraria a projeção e o tour sairia distorcido.
  @Column({ type: 'varchar', length: 500, nullable: true })
  tourImageUrl?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  tourImagePath?: string | null;

  // Cache do PDF do anúncio armazenado no MinIO.
  // Invalidado (nulled) em qualquer mudança no imóvel ou nas suas imagens; regenerado on-demand no próximo download.
  @Column({ type: 'varchar', length: 500, nullable: true })
  adPdfUrl?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  adPdfPath?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  adPdfGeneratedAt?: Date | null;

  // Relacionamento com imagens
  @OneToMany(() => PropertyImage, (image) => image.property)
  images: PropertyImage[];

  @Column({ type: 'varchar', length: 64, nullable: true })
  embeddingVoyageModel?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  embeddingVoyageUpdatedAt?: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  embeddingOpenaiModel?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  embeddingOpenaiUpdatedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  embeddingChunk?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Constructor vazio para TypeORM
  constructor() {}

  // Domain methods
  public belongsToRealtor(realtorId: string): boolean {
    return this.realtorId === realtorId;
  }

  public updatePrice(newPrice: number): void {
    if (newPrice <= 0) {
      throw new Error('Price must be greater than zero');
    }
    this.price = newPrice;
    this.updatedAt = new Date();
  }

  public updateArea(newArea: number): void {
    if (newArea <= 0) {
      throw new Error('Area must be greater than zero');
    }
    this.area = newArea;
    this.updatedAt = new Date();
  }

  public getCoverImage(): string | null {
    return this.coverImageUrl || null;
  }

  public hasVirtualTour(): boolean {
    return !!this.tourImageUrl;
  }
}

