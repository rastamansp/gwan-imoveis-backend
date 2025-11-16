export interface ProcessedImage {
  original: Buffer;
  thumbnail: Buffer;
  originalFormat: string;
}

export interface IImageProcessorService {
  processImage(imageBuffer: Buffer, fileName: string): Promise<ProcessedImage>;
  resizeImage(imageBuffer: Buffer, maxWidth: number, maxHeight: number, quality?: number): Promise<Buffer>;
  generateThumbnail(imageBuffer: Buffer, width: number, height: number, quality?: number): Promise<Buffer>;
}

