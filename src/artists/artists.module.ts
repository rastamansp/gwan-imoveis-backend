import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtistsController } from './artists.controller';
import { Artist } from '../shared/domain/entities/artist.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Artist]),
    SharedModule,
  ],
  controllers: [ArtistsController],
})
export class ArtistsModule {}

