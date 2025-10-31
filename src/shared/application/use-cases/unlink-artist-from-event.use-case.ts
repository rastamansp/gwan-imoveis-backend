import { Injectable, Inject } from '@nestjs/common';
import { IArtistRepository } from '../../domain/interfaces/artist-repository.interface';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { ArtistNotFoundException } from '../../domain/exceptions/artist-not-found.exception';
import { EventNotFoundException } from '../../domain/exceptions/event-not-found.exception';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { InsufficientPermissionsException } from '../../domain/exceptions/insufficient-permissions.exception';

@Injectable()
export class UnlinkArtistFromEventUseCase {
  constructor(
    @Inject('IArtistRepository')
    private readonly artistRepository: IArtistRepository,
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(artistId: string, eventId: string, userId: string): Promise<void> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando desvinculação de artista do evento', {
      artistId,
      eventId,
      userId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se o artista existe
      const artist = await this.artistRepository.findById(artistId);
      if (!artist) {
        throw new ArtistNotFoundException(artistId);
      }

      // Verificar se o evento existe
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        throw new EventNotFoundException(eventId);
      }

      // Verificar se o usuário existe
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundException(userId);
      }

      // Verificar permissões: organizador do evento ou admin
      if (!user.isAdmin() && !(user.isOrganizer() && event.belongsTo(userId))) {
        this.logger.warn('Usuário tentou desvincular artista sem permissão', {
          artistId,
          eventId,
          userId,
          userRole: user.role,
          eventOrganizerId: event.organizerId,
        });
        throw new InsufficientPermissionsException('User does not have permission to unlink artist from this event');
      }

      // Desvincular artista do evento
      await this.artistRepository.unlinkFromEvent(artistId, eventId);

      const duration = Date.now() - startTime;
      this.logger.info('Artista desvinculado do evento com sucesso', {
        artistId,
        eventId,
        userId,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao desvincular artista do evento', {
        artistId,
        eventId,
        userId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

