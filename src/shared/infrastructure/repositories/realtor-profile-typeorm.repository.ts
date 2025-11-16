import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RealtorProfile } from '../../domain/entities/realtor-profile.entity';
import { IRealtorProfileRepository } from '../../domain/interfaces/realtor-profile-repository.interface';

@Injectable()
export class RealtorProfileTypeOrmRepository implements IRealtorProfileRepository {
  constructor(
    @InjectRepository(RealtorProfile)
    private readonly profileRepository: Repository<RealtorProfile>,
  ) {}

  async save(profile: RealtorProfile): Promise<RealtorProfile> {
    return this.profileRepository.save(profile);
  }

  async findByUserId(userId: string): Promise<RealtorProfile | null> {
    return this.profileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async update(id: string, profile: RealtorProfile): Promise<RealtorProfile | null> {
    await this.profileRepository.update(id, profile);
    return this.profileRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }
}

