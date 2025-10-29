import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../domain/value-objects/user-role.enum';

export class PromoteUserDto {
  @ApiPropertyOptional({
    description: 'Role de destino para a promoção. Se não especificado, usa ORGANIZER como padrão.',
    enum: UserRole,
    default: UserRole.ORGANIZER,
    example: UserRole.ORGANIZER,
    enumName: 'UserRole'
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role deve ser USER, ORGANIZER ou ADMIN' })
  targetRole?: UserRole = UserRole.ORGANIZER;
}
