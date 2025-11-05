import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios, { AxiosError } from 'axios';

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
  private readonly cacheKey = 'spotify:access_token';

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    // Tentar obter das variáveis de ambiente diretamente também (fallback)
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID') || process.env.SPOTIFY_CLIENT_ID || '';
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET') || process.env.SPOTIFY_CLIENT_SECRET || '';

    // Log detalhado para debug
    this.logger.log('Inicializando SpotifyAuthService', {
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
      clientIdLength: this.clientId?.length || 0,
      clientSecretLength: this.clientSecret?.length || 0,
      fromConfigService: {
        clientId: !!this.configService.get<string>('SPOTIFY_CLIENT_ID'),
        clientSecret: !!this.configService.get<string>('SPOTIFY_CLIENT_SECRET'),
      },
      fromProcessEnv: {
        clientId: !!process.env.SPOTIFY_CLIENT_ID,
        clientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
      },
    });

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('SPOTIFY_CLIENT_ID ou SPOTIFY_CLIENT_SECRET não configurados. Integração com Spotify não funcionará.');
    } else {
      this.logger.debug('Credenciais do Spotify carregadas com sucesso', {
        hasClientId: !!this.clientId,
        hasClientSecret: !!this.clientSecret,
        clientIdLength: this.clientId.length,
        clientSecretLength: this.clientSecret.length,
      });
    }
  }

  /**
   * Obtém um token de acesso válido (usa cache Redis se disponível)
   * @returns Token de acesso para a API do Spotify
   */
  async getAccessToken(): Promise<string> {
    // Verificar se temos um token válido em cache Redis
    try {
      const cachedToken = await this.cacheManager.get<string>(this.cacheKey);
      if (cachedToken) {
        this.logger.debug('Usando token em cache Redis');
        return cachedToken;
      }
    } catch (error) {
      // Se Redis não estiver disponível, continuar sem cache
      this.logger.warn('[CACHE] Erro ao verificar cache Redis, continuando sem cache', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Obter novo token
    this.logger.debug('Obtendo novo token do Spotify');
    
    // Validar credenciais antes de fazer a requisição
    if (!this.clientId || !this.clientSecret) {
      this.logger.error('Credenciais do Spotify não configuradas', {
        hasClientId: !!this.clientId,
        hasClientSecret: !!this.clientSecret,
      });
      throw new Error('SPOTIFY_CLIENT_ID ou SPOTIFY_CLIENT_SECRET não configurados');
    }

    try {
      const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      this.logger.debug('Fazendo requisição de token', {
        url: this.tokenUrl,
        hasClientId: !!this.clientId,
        hasClientSecret: !!this.clientSecret,
        authHeaderLength: authHeader.length,
      });

      const response = await axios.post<TokenResponse>(
        this.tokenUrl,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${authHeader}`,
          },
          timeout: 10000,
        },
      );

      const { access_token, expires_in } = response.data;

      // Cachear token no Redis (subtrair 60 segundos para garantir renovação antes de expirar)
      const ttl = expires_in - 60; // TTL em segundos
      try {
        await this.cacheManager.set(this.cacheKey, access_token, ttl);
        this.logger.debug('Token cacheado no Redis', {
          expiresIn: expires_in,
          ttl,
        });
      } catch (error) {
        // Se Redis não estiver disponível, continuar sem cache
        this.logger.warn('[CACHE] Erro ao salvar token no cache Redis, continuando sem cache', {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return access_token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const errorData = axiosError.response?.data;
        const errorMessage = typeof errorData === 'string' 
          ? errorData 
          : (errorData && typeof errorData === 'object' ? JSON.stringify(errorData) : axiosError.message);
        
        this.logger.error('Erro ao obter token do Spotify', {
          error: axiosError.message,
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          responseData: errorMessage,
          hasClientId: !!this.clientId,
          hasClientSecret: !!this.clientSecret,
          clientIdLength: this.clientId?.length || 0,
          clientSecretLength: this.clientSecret?.length || 0,
        });
      } else {
        this.logger.error('Erro desconhecido ao obter token do Spotify', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      throw new Error('Falha na autenticação com a API do Spotify');
    }
  }
}

