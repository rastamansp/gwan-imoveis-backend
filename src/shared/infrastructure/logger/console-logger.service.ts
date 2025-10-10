import { Injectable, Logger } from '@nestjs/common';
import { ILogger } from '../../application/interfaces/logger.interface';

@Injectable()
export class ConsoleLoggerService implements ILogger {
  private readonly logger = new Logger('App');

  info(message: string, context?: any): void {
    if (context && Object.keys(context).length > 0) {
      this.logger.log(`${message} ${JSON.stringify(context)}`);
    } else {
      this.logger.log(message);
    }
  }

  warn(message: string, context?: any): void {
    if (context && Object.keys(context).length > 0) {
      this.logger.warn(`${message} ${JSON.stringify(context)}`);
    } else {
      this.logger.warn(message);
    }
  }

  error(message: string, context?: any): void {
    if (context && Object.keys(context).length > 0) {
      this.logger.error(`${message} ${JSON.stringify(context)}`);
    } else {
      this.logger.error(message);
    }
  }

  debug(message: string, context?: any): void {
    if (context && Object.keys(context).length > 0) {
      this.logger.debug(`${message} ${JSON.stringify(context)}`);
    } else {
      this.logger.debug(message);
    }
  }
}
