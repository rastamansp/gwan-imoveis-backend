import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [TicketsController],
})
export class TicketsModule {}
