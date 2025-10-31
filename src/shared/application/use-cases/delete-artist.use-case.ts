import { Injectable, Inject } from '@nestjs/common';
import { IArtistRepository } from '../../domain/interfaces/artist-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { ArtistNotFoundException } from '../../domain/exceptions/artist-not-found.exception';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { InsufficientPermissionsException } from '../../domain/exceptions/insufficient-permissions.exception';

@Injectable()
export class DeleteArtistUseCase {
  constructor(
    @Inject('IArtistRepository')
    private readonly artistRepository: IArtistRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(artistId: string, userId: string): Promise<void> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando exclusão de artista', {
      artistId,
      userId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se o artista existe
      const artist = await this.artistRepository.findById(artistId);
      if (!artist) {
        throw new ArtistNotFoundException(artistId);
      }

      // Verificar se o usuário existe e tem permissão
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundException(userId);
      }

      if (!user.canCreateEvents()) {
        this.logger.warn('Usuário tentou deletar artista sem permissão', {
          artistId,
          userId,
          userRole: user.role,
        });
        throw new InsufficientPermissionsException('User does not have permission to delete artists');
      }

      // Deletar artista (cascata remove relacionamentos na tabela event_artists)
      const deleted = await this.artistRepository.delete(artistId);
      if (!deleted) {
        throw new ArtistNotFoundException(artistId);
      }

      const duration = Date.now() - startTime;
      this.logger.info('Artista deletado com sucesso', {
        artistId,
        userId,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao deletar artista', {
        artistId,
        userId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

