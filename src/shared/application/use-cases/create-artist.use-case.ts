import { Injectable, Inject } from '@nestjs/common';
import { Artist } from '../../domain/entities/artist.entity';
import { IArtistRepository } from '../../domain/interfaces/artist-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { CreateArtistDto } from '../../presentation/dtos/create-artist.dto';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { InsufficientPermissionsException } from '../../domain/exceptions/insufficient-permissions.exception';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreateArtistUseCase {
  constructor(
    @Inject('IArtistRepository')
    private readonly artistRepository: IArtistRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(createArtistDto: CreateArtistDto, userId: string): Promise<Artist> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando criação de artista', {
      artisticName: createArtistDto.artisticName,
      userId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se o usuário existe
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundException(userId);
      }

      // Verificar se o usuário pode criar artistas (organizador ou admin)
      if (!user.canCreateEvents()) {
        this.logger.warn('Usuário tentou criar artista sem permissão', {
          userId,
          userRole: user.role,
          userEmail: user.email,
        });
        throw new InsufficientPermissionsException('User does not have permission to create artists');
      }

      // Criar artista
      const artist = Artist.create(
        uuidv4(),
        createArtistDto.artisticName,
        createArtistDto.name,
        createArtistDto.birthDate ? new Date(createArtistDto.birthDate) : null,
        createArtistDto.biography || null,
        createArtistDto.instagramUsername || null,
        createArtistDto.youtubeUsername || null,
        createArtistDto.xUsername || null,
        createArtistDto.spotifyUsername || null,
        createArtistDto.siteUrl || null,
        createArtistDto.tiktokUsername || null,
        createArtistDto.image || null,
        new Date(),
        new Date(),
      );

      // Salvar artista
      const savedArtist = await this.artistRepository.save(artist);

      const duration = Date.now() - startTime;
      this.logger.info('Artista criado com sucesso', {
        artistId: savedArtist.id,
        artisticName: savedArtist.artisticName,
        userId,
        duration,
      });

      return savedArtist;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao criar artista', {
        artisticName: createArtistDto.artisticName,
        userId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

