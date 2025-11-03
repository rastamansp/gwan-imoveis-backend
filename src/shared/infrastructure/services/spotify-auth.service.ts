import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable()
export class SpotifyAuthService {
  private readonly logger = new Logger(SpotifyAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tokenUrl = 'https://accounts.spotify.com/api/token';
  
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET') || '';

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('SPOTIFY_CLIENT_ID ou SPOTIFY_CLIENT_SECRET não configurados. Integração com Spotify não funcionará.');
    }
  }

  /**
   * Obtém um token de acesso válido (usa cache se disponível)
   * @returns Token de acesso para a API do Spotify
   */
  async getAccessToken(): Promise<string> {
    // Verificar se temos um token válido em cache
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      this.logger.debug('Usando token em cache');
      return this.cachedToken;
    }

    // Obter novo token
    this.logger.debug('Obtendo novo token do Spotify');
    
    try {
      const response = await axios.post<TokenResponse>(
        this.tokenUrl,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          },
          timeout: 10000,
        },
      );

      const { access_token, expires_in } = response.data;

      // Cachear token (subtrair 60 segundos para garantir renovação antes de expirar)
      this.cachedToken = access_token;
      this.tokenExpiresAt = Date.now() + (expires_in - 60) * 1000;

      this.logger.debug('Token obtido com sucesso', {
        expiresIn: expires_in,
      });

      return access_token;
    } catch (error) {
      this.logger.error('Erro ao obter token do Spotify', {
        error: axios.isAxiosError(error) ? error.message : String(error),
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
      });
      throw new Error('Falha na autenticação com a API do Spotify');
    }
  }
}

