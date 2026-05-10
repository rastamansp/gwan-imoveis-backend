import { Injectable, Logger } from '@nestjs/common';
import { ILogger } from '../../application/interfaces/logger.interface';
import { redactReplacer } from '../utils/redact.util';

@Injectable()
export class ConsoleLoggerService implements ILogger {
  private readonly logger = new Logger('App');

  private serialize(context: any): string {
    return JSON.stringify(context, redactReplacer);
  }

  info(message: string, context?: any): void {
    if (context && Object.keys(context).length > 0) {
      this.logger.log(`${message} ${this.serialize(context)}`);
    } else {
      this.logger.log(message);
    }
  }

  warn(message: string, context?: any): void {
    if (context && Object.keys(context).length > 0) {
      this.logger.warn(`${message} ${this.serialize(context)}`);
    } else {
      this.logger.warn(message);
    }
  }

  error(message: string, context?: any): void {
    if (context && Object.keys(context).length > 0) {
      this.logger.error(`${message} ${this.serialize(context)}`);
    } else {
      this.logger.error(message);
    }
  }

  debug(message: string, context?: any): void {
    if (context && Object.keys(context).length > 0) {
      this.logger.debug(`${message} ${this.serialize(context)}`);
    } else {
      this.logger.debug(message);
    }
  }
}
