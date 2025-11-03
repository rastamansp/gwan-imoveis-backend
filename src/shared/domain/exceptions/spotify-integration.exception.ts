import { DomainException } from './domain.exception';

export class SpotifyIntegrationException extends DomainException {
  constructor(message: string, code: string = 'SPOTIFY_INTEGRATION_ERROR') {
    super(message, code);
  }

  static invalidUrl(url: string): SpotifyIntegrationException {
    return new SpotifyIntegrationException(
      `URL do Spotify inválida: ${url}`,
      'SPOTIFY_INVALID_URL',
    );
  }

  static artistNotFound(spotifyId: string): SpotifyIntegrationException {
    return new SpotifyIntegrationException(
      `Artista não encontrado no Spotify: ${spotifyId}`,
      'SPOTIFY_ARTIST_NOT_FOUND',
    );
  }

  static authenticationFailed(): SpotifyIntegrationException {
    return new SpotifyIntegrationException(
      'Falha na autenticação com a API do Spotify',
      'SPOTIFY_AUTH_FAILED',
    );
  }

  static apiError(message: string): SpotifyIntegrationException {
    return new SpotifyIntegrationException(
      `Erro na API do Spotify: ${message}`,
      'SPOTIFY_API_ERROR',
    );
  }
}

