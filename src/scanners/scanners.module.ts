import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ScannersController } from './scanners.controller';
import { ScannerAuthService } from '../shared/infrastructure/services/scanner-auth.service';
import { ScannerTypeOrmRepository } from '../shared/infrastructure/repositories/scanner-typeorm.repository';
import { Scanner } from '../shared/domain/entities/scanner.entity';
import { IScannerRepository } from '../shared/domain/interfaces/scanner-repository.interface';
import { ILogger } from '../shared/application/interfaces/logger.interface';
import { ConsoleLoggerService } from '../shared/infrastructure/logger/console-logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Scanner]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'pazdedeus',
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [ScannersController],
  providers: [
    ScannerAuthService,
    {
      provide: 'IScannerRepository',
      useClass: ScannerTypeOrmRepository,
    },
    {
      provide: 'ILogger',
      useClass: ConsoleLoggerService,
    },
  ],
  exports: [ScannerAuthService, 'IScannerRepository'],
})
export class ScannersModule {}
