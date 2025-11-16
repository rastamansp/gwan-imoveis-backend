import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { PromoteUserToCorretorUseCase } from '../shared/application/use-cases/promote-user-to-corretor.use-case';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [UsersController],
  providers: [PromoteUserToCorretorUseCase],
  exports: [],
})
export class UsersModule {}
