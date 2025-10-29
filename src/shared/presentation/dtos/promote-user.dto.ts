import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../domain/value-objects/user-role.enum';

export class PromoteUserDto {
  @ApiProperty({
    description: 'ID do usuário que será promovido',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
  })
  @IsUUID(4, { message: 'ID do usuário deve ser um UUID válido' })
  userId: string;

  @ApiPropertyOptional({
    description: 'Role de destino para a promoção',
    enum: UserRole,
    default: UserRole.ORGANIZER,
    example: UserRole.ORGANIZER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role deve ser um valor válido do enum UserRole' })
  targetRole?: UserRole = UserRole.ORGANIZER;
}
