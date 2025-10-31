import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Event } from './event.entity';

@Entity('artists')
@Index(['artisticName'])
@Index(['name'])
export class Artist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'artistic_name', type: 'varchar', length: 255 })
  artisticName: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: Date | null;

  @Column({ type: 'text', nullable: true })
  biography: string | null;

  @Column({ name: 'instagram_username', type: 'varchar', length: 255, nullable: true })
  instagramUsername: string | null;

  @Column({ name: 'youtube_username', type: 'varchar', length: 255, nullable: true })
  youtubeUsername: string | null;

  @Column({ name: 'x_username', type: 'varchar', length: 255, nullable: true })
  xUsername: string | null;

  @Column({ name: 'spotify_username', type: 'varchar', length: 255, nullable: true })
  spotifyUsername: string | null;

  @Column({ name: 'site_url', type: 'varchar', length: 500, nullable: true })
  siteUrl: string | null;

  @Column({ name: 'tiktok_username', type: 'varchar', length: 255, nullable: true })
  tiktokUsername: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'real', array: true, nullable: true })
  embedding: number[] | null;

  @Column({ name: 'embedding_model', type: 'varchar', length: 100, nullable: true, default: 'text-embedding-3-small' })
  embeddingModel: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relacionamento ManyToMany com Event
  @ManyToMany(() => Event, event => event.artists)
  @JoinTable({
    name: 'event_artists',
    joinColumn: { name: 'artist_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'event_id', referencedColumnName: 'id' },
  })
  events: Event[];

  // Constructor vazio para TypeORM
  constructor() {}

  // Constructor com parâmetros para criação manual
  static create(
    id: string,
    artisticName: string,
    name: string,
    birthDate: Date | null = null,
    biography: string | null = null,
    instagramUsername: string | null = null,
    youtubeUsername: string | null = null,
    xUsername: string | null = null,
    spotifyUsername: string | null = null,
    siteUrl: string | null = null,
    tiktokUsername: string | null = null,
    image: string | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): Artist {
    const artist = new Artist();
    artist.id = id;
    artist.artisticName = artisticName;
    artist.name = name;
    artist.birthDate = birthDate;
    artist.biography = biography;
    artist.instagramUsername = instagramUsername;
    artist.youtubeUsername = youtubeUsername;
    artist.xUsername = xUsername;
    artist.spotifyUsername = spotifyUsername;
    artist.siteUrl = siteUrl;
    artist.tiktokUsername = tiktokUsername;
    artist.image = image;
    artist.createdAt = createdAt;
    artist.updatedAt = updatedAt;
    return artist;
  }

  // Métodos de domínio
  public updateDetails(
    artisticName: string,
    name: string,
    birthDate: Date | null = null,
    biography: string | null = null,
    instagramUsername: string | null = null,
    youtubeUsername: string | null = null,
    xUsername: string | null = null,
    spotifyUsername: string | null = null,
    siteUrl: string | null = null,
    tiktokUsername: string | null = null,
    image: string | null = null,
  ): Artist {
    this.artisticName = artisticName;
    this.name = name;
    this.birthDate = birthDate;
    this.biography = biography;
    this.instagramUsername = instagramUsername;
    this.youtubeUsername = youtubeUsername;
    this.xUsername = xUsername;
    this.spotifyUsername = spotifyUsername;
    this.siteUrl = siteUrl;
    this.tiktokUsername = tiktokUsername;
    this.image = image;
    this.updatedAt = new Date();
    return this;
  }
}

