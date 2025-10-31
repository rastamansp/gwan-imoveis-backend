import { Injectable, Inject } from '@nestjs/common';
import { Artist } from '../../domain/entities/artist.entity';
import { IArtistRepository } from '../../domain/interfaces/artist-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { UpdateArtistDto } from '../../presentation/dtos/update-artist.dto';
import { ArtistNotFoundException } from '../../domain/exceptions/artist-not-found.exception';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { InsufficientPermissionsException } from '../../domain/exceptions/insufficient-permissions.exception';

@Injectable()
export class UpdateArtistUseCase {
  constructor(
    @Inject('IArtistRepository')
    private readonly artistRepository: IArtistRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(artistId: string, updateArtistDto: UpdateArtistDto, userId: string): Promise<Artist> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando atualização de artista', {
      artistId,
      userId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se o artista existe
      const existingArtist = await this.artistRepository.findById(artistId);
      if (!existingArtist) {
        throw new ArtistNotFoundException(artistId);
      }

      // Verificar se o usuário existe e tem permissão
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundException(userId);
      }

      if (!user.canCreateEvents()) {
        this.logger.warn('Usuário tentou atualizar artista sem permissão', {
          artistId,
          userId,
          userRole: user.role,
        });
        throw new InsufficientPermissionsException('User does not have permission to update artists');
      }

      // Atualizar campos
      const updatedArtist = existingArtist.updateDetails(
        updateArtistDto.artisticName ?? existingArtist.artisticName,
        updateArtistDto.name ?? existingArtist.name,
        updateArtistDto.birthDate ? new Date(updateArtistDto.birthDate) : existingArtist.birthDate,
        updateArtistDto.biography ?? existingArtist.biography,
        updateArtistDto.instagramUsername ?? existingArtist.instagramUsername,
        updateArtistDto.youtubeUsername ?? existingArtist.youtubeUsername,
        updateArtistDto.xUsername ?? existingArtist.xUsername,
        updateArtistDto.spotifyUsername ?? existingArtist.spotifyUsername,
        updateArtistDto.siteUrl ?? existingArtist.siteUrl,
        updateArtistDto.tiktokUsername ?? existingArtist.tiktokUsername,
        updateArtistDto.image ?? existingArtist.image,
      );

      // Salvar atualização
      const savedArtist = await this.artistRepository.update(artistId, updatedArtist);

      if (!savedArtist) {
        throw new ArtistNotFoundException(artistId);
      }

      const duration = Date.now() - startTime;
      this.logger.info('Artista atualizado com sucesso', {
        artistId,
        artisticName: savedArtist.artisticName,
        userId,
        duration,
      });

      return savedArtist;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao atualizar artista', {
        artistId,
        userId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

