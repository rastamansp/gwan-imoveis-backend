import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SharedModule } from '../shared/shared.module';
import { RealtorsModule } from '../realtors/realtors.module';
import { CreateCorretorUseCase } from './use-cases/create-corretor.use-case';
import { ListCorretoresUseCase } from './use-cases/list-corretores.use-case';

@Module({
  imports: [SharedModule, RealtorsModule],
  controllers: [AdminController],
  providers: [AdminService, CreateCorretorUseCase, ListCorretoresUseCase],
  exports: [AdminService],
})
export class AdminModule {}
