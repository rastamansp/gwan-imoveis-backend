import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { PromoteUserToOrganizerUseCase } from '../shared/application/use-cases/promote-user-to-organizer.use-case';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [UsersController],
  providers: [PromoteUserToOrganizerUseCase],
  exports: [],
})
export class UsersModule {}
