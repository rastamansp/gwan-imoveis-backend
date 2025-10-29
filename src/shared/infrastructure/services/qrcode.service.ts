import { Injectable, Inject } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { IQRCodeService } from '../../application/interfaces/qrcode.interface';
import { ILogger } from '../../application/interfaces/logger.interface';

@Injectable()
export class QRCodeService implements IQRCodeService {
  constructor(
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  /**
   * Gera um QR Code em formato PNG base64
   * @param data - Dados que serão codificados no QR Code
   * @returns Promise<string> - Imagem PNG em formato base64
   */
  async generateQRCode(data: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Iniciando geração de QR Code', { 
        dataLength: data.length,
        timestamp: new Date().toISOString()
      });

      // Configurações do QR Code
      const options: QRCode.QRCodeToDataURLOptions = {
        type: 'image/png',
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300,
        errorCorrectionLevel: 'H' // Alta correção de erro (até 30% de dano)
      };

      // Gerar QR Code como data URL (base64)
      const qrCodeDataUrl = await QRCode.toDataURL(data, options);
      
      // Extrair apenas o base64 (remover o prefixo "data:image/png;base64,")
      const base64Data = qrCodeDataUrl.split(',')[1];

      const duration = Date.now() - startTime;
      this.logger.info('QR Code gerado com sucesso', {
        dataLength: data.length,
        qrCodeSize: base64Data.length,
        duration
      });

      return base64Data;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao gerar QR Code', {
        dataLength: data.length,
        error: error.message,
        stack: error.stack,
        duration
      });
      
      throw new Error(`Falha ao gerar QR Code: ${error.message}`);
    }
  }
}
