export interface IQRCodeService {
  /**
   * Gera um QR Code em formato PNG base64 a partir dos dados fornecidos
   * @param data - Dados que serão codificados no QR Code
   * @returns Promise<string> - Imagem PNG em formato base64
   */
  generateQRCode(data: string): Promise<string>;
}
