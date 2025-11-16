import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealtorsController, PropertiesRealtorController } from './realtors.controller';
import { RealtorProfile } from '../shared/domain/entities/realtor-profile.entity';
import { RealtorProfileTypeOrmRepository } from '../shared/infrastructure/repositories/realtor-profile-typeorm.repository';
import { IRealtorProfileRepository } from '../shared/domain/interfaces/realtor-profile-repository.interface';
import { GetMyRealtorProfileUseCase } from '../shared/application/use-cases/get-my-realtor-profile.use-case';
import { UpdateMyRealtorProfileUseCase } from '../shared/application/use-cases/update-my-realtor-profile.use-case';
import { GetPropertyByIdUseCase } from '../shared/application/use-cases/get-property-by-id.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([RealtorProfile])],
  controllers: [RealtorsController, PropertiesRealtorController],
  providers: [
    {
      provide: 'IRealtorProfileRepository',
      useClass: RealtorProfileTypeOrmRepository,
    },
    GetMyRealtorProfileUseCase,
    UpdateMyRealtorProfileUseCase,
    GetPropertyByIdUseCase,
  ],
  exports: ['IRealtorProfileRepository'],
})
export class RealtorsModule {}

