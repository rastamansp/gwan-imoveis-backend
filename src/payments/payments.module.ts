import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
