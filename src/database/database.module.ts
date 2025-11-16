import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../shared/domain/entities/user.entity';
import { DatabaseSeeder } from './seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
  ],
  providers: [DatabaseSeeder],
  exports: [DatabaseSeeder],
})
export class DatabaseModule {}
