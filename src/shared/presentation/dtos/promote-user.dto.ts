import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../domain/value-objects/user-role.enum';

export class PromoteUserDto {
  @ApiPropertyOptional({
    description: 'Role de destino para a promoção. Se não especificado, usa ADMIN como padrão.',
    enum: UserRole,
    default: UserRole.ADMIN,
    example: UserRole.ADMIN,
    enumName: 'UserRole'
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role deve ser USER, ADMIN ou ADMIN' })
  targetRole?: UserRole = UserRole.ADMIN;
}
