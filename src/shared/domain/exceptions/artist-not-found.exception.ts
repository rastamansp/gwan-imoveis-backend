import { DomainException } from './domain.exception';

export class ArtistNotFoundException extends DomainException {
  constructor(artistId: string) {
    super(`Artist with ID ${artistId} not found`, 'ARTIST_NOT_FOUND');
  }
}

