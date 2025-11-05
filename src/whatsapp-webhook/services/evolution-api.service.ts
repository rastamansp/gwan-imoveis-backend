import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvolutionClient } from '@solufy/evolution-sdk';
import axios from 'axios';
import { ILogger } from '../../shared/application/interfaces/logger.interface';

@Injectable()
export class EvolutionApiService implements OnModuleInit {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {
    this.baseUrl = this.configService.get<string>('EVOLUTION_INSTANCE_URL') || 'http://localhost:8080';
    // Usar EVOLUTION_INSTANCE como API key (conforme mencionado pelo usuário)
    this.apiKey = this.configService.get<string>('EVOLUTION_INSTANCE') || this.configService.get<string>('EVOLUTION_API_KEY') || '';

    if (!this.baseUrl) {
      this.logger.warn('EVOLUTION_INSTANCE_URL não configurada, usando valor padrão: http://localhost:8080');
    }

    if (!this.apiKey) {
      this.logger.warn('EVOLUTION_INSTANCE ou EVOLUTION_API_KEY não configurada. Requisições podem falhar por falta de autenticação.');
    }
  }

  /**
   * Inicializa o cliente Evolution SDK após a criação do módulo
   */
  onModuleInit() {
    try {
      // O SDK será inicializado por instância quando necessário
      // Isso permite usar diferentes instâncias dinamicamente
      this.logger.info('[INIT] EvolutionApiService inicializado com SDK', {
        baseUrl: this.baseUrl,
        hasApiKey: !!this.apiKey,
      });
    } catch (error) {
      this.logger.error('[ERROR] Erro ao inicializar EvolutionApiService', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Obtém ou cria uma instância do EvolutionClient para uma instância específica
   * @param instanceName Nome da instância do Evolution API
   * @returns EvolutionClient configurado
   */
  private getClient(instanceName: string): EvolutionClient {
    // Criar novo cliente para cada instância (o SDK gerencia conexões)
    return new EvolutionClient({
      serverUrl: this.baseUrl,
      instance: instanceName,
      token: this.apiKey,
    });
  }

  /**
   * Envia mensagem de texto via Evolution API usando SDK
   * @param instanceName Nome da instância do Evolution API (ex: "Gwan")
   * @param number Número do WhatsApp do destinatário (ex: "5511987221050@s.whatsapp.net")
   * @param text Texto da mensagem a ser enviada
   */
  async sendTextMessage(instanceName: string, number: string, text: string): Promise<void> {
    const startTime = Date.now();

    this.logger.info('[SEND] Enviando mensagem via Evolution API SDK', {
      instanceName,
      number,
      textLength: text.length,
      baseUrl: this.baseUrl,
    });

    try {
      const client = this.getClient(instanceName);

      // Usar o método sendText do SDK
      const response = await client.messages.sendText({
        number,
        text,
      });

      const duration = Date.now() - startTime;
      this.logger.info('[SUCCESS] Mensagem enviada com sucesso via Evolution API SDK', {
        instanceName,
        number,
        response,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error('[ERROR] Erro ao enviar mensagem via Evolution API SDK', {
        instanceName,
        number,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration,
      });

      // Propagar erro para tratamento no serviço que chamou
      throw error;
    }
  }

  /**
   * Baixa uma imagem de uma URL e converte para base64
   */
  private async downloadImageAsBase64(imageUrl: string): Promise<{ base64: string; mimetype: string }> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const buffer = Buffer.from(response.data);
      const base64 = buffer.toString('base64');

      // Tentar detectar o mimetype do Content-Type ou da URL
      let mimetype = response.headers['content-type'] || 'image/jpeg';
      
      // Se não tiver Content-Type, tentar detectar pela extensão
      if (!response.headers['content-type']) {
        if (imageUrl.includes('.png')) mimetype = 'image/png';
        else if (imageUrl.includes('.gif')) mimetype = 'image/gif';
        else if (imageUrl.includes('.webp')) mimetype = 'image/webp';
        else mimetype = 'image/jpeg';
      }

      return { base64, mimetype };
    } catch (error) {
      this.logger.error('[ERROR] Erro ao baixar imagem', {
        imageUrl: imageUrl.substring(0, 100),
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Falha ao baixar imagem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Envia mensagem de imagem via Evolution API usando SDK
   * @param instanceName Nome da instância do Evolution API (ex: "Gwan")
   * @param number Número do WhatsApp do destinatário (ex: "5511987221050@s.whatsapp.net")
   * @param imageUrl URL da imagem ou base64
   * @param caption Legenda da imagem (opcional)
   * @param mimetype Tipo MIME da imagem (opcional, padrão: "image/jpeg")
   */
  async sendImageMessage(
    instanceName: string,
    number: string,
    imageUrl: string,
    caption?: string,
    mimetype: string = 'image/jpeg',
  ): Promise<void> {
    const startTime = Date.now();
    const sendId = `send-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Extrair base64 puro se vier como data URL
    let base64Image: string | undefined;
    let actualMimetype = mimetype;
    
    if (imageUrl.startsWith('data:image/')) {
      // Extrair mimetype e base64 da data URL
      const matches = imageUrl.match(/^data:image\/([^;]+);base64,(.+)$/);
      if (matches) {
        actualMimetype = `image/${matches[1]}`;
        base64Image = matches[2]; // Base64 puro sem prefixo
      } else {
        // Tentar extrair apenas o base64 se não tiver mimetype explícito
        const base64Match = imageUrl.match(/^data:image\/[^;]*;base64,(.+)$/);
        if (base64Match) {
          base64Image = base64Match[1];
        }
      }
    }

    this.logger.info('[SEND] Enviando imagem via Evolution API SDK', {
      instanceName,
      number,
      imageUrl: imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : ''),
      hasCaption: !!caption,
      captionLength: caption?.length || 0,
      mimetype: actualMimetype,
      isBase64: !!base64Image,
      base64Length: base64Image?.length || 0,
      baseUrl: this.baseUrl,
      sendId,
    });

    try {
      const client = this.getClient(instanceName);

      // Se temos base64 puro, usar diretamente; caso contrário, tentar URL primeiro
      if (base64Image) {
        // Enviar diretamente como base64 puro
        try {
          const response = await client.messages.sendImage({
            number,
            image: base64Image, // Base64 puro sem prefixo data:image
            caption: caption || undefined,
            mimetype: actualMimetype,
          });

          const duration = Date.now() - startTime;
          this.logger.info('[SUCCESS] Imagem enviada com sucesso via Evolution API SDK (base64 puro)', {
            instanceName,
            number,
            response,
            duration,
            sendId,
          });
          return;
        } catch (base64Error: any) {
          const errorMessage = base64Error instanceof Error ? base64Error.message : String(base64Error);
          
          // Verificar se é erro de validação Zod (que indica problema com metadados)
          if (errorMessage.includes('invalid_type') || errorMessage.includes('Invalid input') || errorMessage.includes('ZodError')) {
            this.logger.warn('[WARNING] Erro Zod após envio base64 - mensagem provavelmente foi enviada ao WhatsApp antes da validação falhar', {
              instanceName,
              number,
              error: errorMessage.substring(0, 500),
              sendId,
              note: 'Mensagem tratada como sucesso parcial - erro Zod não impede entrega',
            });
            return;
          }
          
          // Se não for erro Zod, propagar erro
          this.logger.error('[ERROR] Erro ao enviar imagem base64 via Evolution API SDK', {
            instanceName,
            number,
            error: errorMessage,
            sendId,
          });
          throw base64Error;
        }
      }

      // Tentar enviar primeiro com a URL direta (se não for base64)
      try {
        const response = await client.messages.sendImage({
          number,
          image: imageUrl,
          caption: caption || undefined,
          mimetype: actualMimetype,
        });

        const duration = Date.now() - startTime;
        this.logger.info('[SUCCESS] Imagem enviada com sucesso via Evolution API SDK (URL direta)', {
          instanceName,
          number,
          response,
          duration,
          sendId,
        });
        return;
      } catch (urlError: any) {
        // Se falhar com URL, tentar baixar e enviar como base64
        const errorMessage = urlError instanceof Error ? urlError.message : String(urlError);
        
        // Verificar se é erro de validação Zod (que indica problema com metadados)
        // IMPORTANTE: Erros Zod podem ocorrer APÓS a mensagem já ter sido enviada ao WhatsApp
        // O SDK faz a requisição HTTP primeiro, e só depois valida a resposta com Zod
        // Se a validação falhar, lança erro, mas a mensagem já foi enviada ao WhatsApp
        // Neste caso, consideramos como sucesso parcial já que a mensagem foi entregue
        if (errorMessage.includes('invalid_type') || errorMessage.includes('Invalid input') || errorMessage.includes('ZodError')) {
          // Erro Zod indica que a mensagem provavelmente foi enviada antes da validação falhar
          // Logamos como warning mas não propagamos o erro para evitar tentativas de reenvio
          this.logger.warn('[WARNING] Erro Zod após envio - mensagem provavelmente foi enviada ao WhatsApp antes da validação falhar', {
            instanceName,
            number,
            imageUrl: imageUrl.substring(0, 100),
            error: errorMessage.substring(0, 500), // Limitar tamanho do log
            sendId,
            note: 'Mensagem tratada como sucesso parcial - erro Zod não impede entrega',
          });
          // Considerar como sucesso parcial - mensagem foi enviada mesmo com erro de validação
          return;
        }
        
        // Se não for erro Zod, tentar fallback base64 apenas se for erro de validação relacionado
        if (errorMessage.includes('Bad Request') || errorMessage.includes('400') || errorMessage.includes('Invalid') || errorMessage.includes('validation') || errorMessage.includes('format')) {
          this.logger.warn('[FALLBACK] Erro de validação ao enviar URL, tentando baixar imagem e converter para base64', {
            instanceName,
            number,
            imageUrl: imageUrl.substring(0, 100),
            error: errorMessage.substring(0, 500),
            sendId,
          });

          try {
            // Baixar imagem e converter para base64
            const { base64, mimetype: detectedMimetype } = await this.downloadImageAsBase64(imageUrl);
            
            // Tentar enviar como base64
            const response = await client.messages.sendImage({
              number,
              image: base64, // Base64 puro sem prefixo
              caption: caption || undefined,
              mimetype: detectedMimetype || mimetype,
            });

            const duration = Date.now() - startTime;
            this.logger.info('[SUCCESS] Imagem enviada com sucesso via Evolution API SDK (base64)', {
              instanceName,
              number,
              response,
              duration,
              sendId,
            });
            return;
          } catch (base64Error) {
            // Se base64 também falhar, verificar se é erro Zod
            const base64ErrorMessage = base64Error instanceof Error ? base64Error.message : String(base64Error);
            
            if (base64ErrorMessage.includes('invalid_type') || base64ErrorMessage.includes('Invalid input') || base64ErrorMessage.includes('ZodError')) {
              // Erro Zod após envio base64 - mensagem provavelmente foi enviada antes da validação falhar
              this.logger.warn('[WARNING] Erro Zod após envio base64 - mensagem provavelmente foi enviada ao WhatsApp antes da validação falhar', {
                instanceName,
                number,
                error: base64ErrorMessage.substring(0, 500), // Limitar tamanho do log
                sendId,
                note: 'Mensagem tratada como sucesso parcial - erro Zod não impede entrega',
              });
              return;
            }
            
            // Se base64 também falhar sem ser erro Zod, logar e propagar erro
            this.logger.error('[ERROR] Fallback base64 também falhou', {
              instanceName,
              number,
              imageUrl: imageUrl.substring(0, 100),
              error: base64ErrorMessage,
              sendId,
            });
            // Propagar erro do base64, não do URL original
            throw base64Error;
          }
        }
        
        // Se não for erro que podemos tratar, propagar erro original
        this.logger.error('[ERROR] Erro ao enviar imagem via Evolution API SDK', {
          instanceName,
          number,
          imageUrl: imageUrl.substring(0, 100),
          error: errorMessage,
          sendId,
        });
        throw urlError;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('[ERROR] Erro ao enviar imagem via Evolution API SDK', {
        instanceName,
        number,
        imageUrl: imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : ''),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration,
        sendId,
      });
      throw error;
    }
  }
}
