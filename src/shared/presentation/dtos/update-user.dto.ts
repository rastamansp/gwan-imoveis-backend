import { IsString, IsOptional, IsEmail, IsEnum, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../domain/value-objects/user-role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ 
    description: 'Nome completo do usuário',
    example: 'João Silva Santos',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ 
    description: 'Endereço de email do usuário',
    example: 'joao.silva@email.com',
    format: 'email'
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email deve ser um endereço de email válido' })
  email?: string;

  @ApiPropertyOptional({ 
    description: 'Telefone do usuário',
    example: '11999999999',
    pattern: '^[0-9]{10,11}$'
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ 
    description: 'Role/permissão do usuário. Apenas ADMIN pode alterar roles.',
    enum: UserRole,
    example: UserRole.CORRETOR,
    enumName: 'UserRole'
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role deve ser USER, CORRETOR ou ADMIN' })
  role?: UserRole;
}
