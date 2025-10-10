import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [EventsController],
})
export class EventsModule {}
