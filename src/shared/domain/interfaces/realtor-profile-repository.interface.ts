import { RealtorProfile } from '../entities/realtor-profile.entity';

export interface IRealtorProfileRepository {
  save(profile: RealtorProfile): Promise<RealtorProfile>;
  findByUserId(userId: string): Promise<RealtorProfile | null>;
  update(id: string, profile: RealtorProfile): Promise<RealtorProfile | null>;
}

