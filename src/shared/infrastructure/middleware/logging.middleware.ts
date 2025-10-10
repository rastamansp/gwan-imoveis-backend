import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use = (req: Request, res: Response, next: NextFunction): void => {
    const { method, originalUrl } = req;
    const userAgent = req.get('User-Agent') || '';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;
      const duration = Date.now() - start;

      // Formatação no estilo NestJS
      const logMessage = `${method} ${originalUrl} ${statusCode} ${duration}ms - ${contentLength}b - ${ip} - ${userAgent}`;
      
      if (statusCode >= 400) {
        this.logger.error(logMessage);
      } else if (statusCode >= 300) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  };
}
