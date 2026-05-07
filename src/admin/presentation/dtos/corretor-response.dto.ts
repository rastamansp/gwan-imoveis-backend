import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../../shared/domain/entities/user.entity';
import { RealtorProfile } from '../../../shared/domain/entities/realtor-profile.entity';

export class CorretorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone: string | null;

  @ApiProperty()
  role: string;

  @ApiPropertyOptional()
  businessName: string | null;

  @ApiPropertyOptional()
  whatsappBusiness: string | null;

  @ApiProperty()
  createdAt: Date;

  static fromEntities(user: User, profile?: RealtorProfile | null): CorretorResponseDto {
    const dto = new CorretorResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.phone = user.phone ?? null;
    dto.role = user.role;
    dto.businessName = profile?.businessName ?? null;
    dto.whatsappBusiness = profile?.whatsappBusiness ?? null;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
