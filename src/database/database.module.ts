import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../shared/domain/entities/user.entity';
import { Property } from '../shared/domain/entities/property.entity';
import { DatabaseSeeder } from './seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Property]),
  ],
  providers: [DatabaseSeeder],
  exports: [DatabaseSeeder],
})
export class DatabaseModule {}
