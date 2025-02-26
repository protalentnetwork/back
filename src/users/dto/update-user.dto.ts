import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum WithdrawalStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled'
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    required: false
  })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({
    description: 'Withdrawal status',
    enum: WithdrawalStatus,
    example: WithdrawalStatus.ENABLED,
    required: false
  })
  @IsEnum(WithdrawalStatus)
  @IsOptional()
  withdrawal?: WithdrawalStatus;

  @ApiProperty({
    description: 'User role',
    example: 'admin',
    required: false
  })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiProperty({
    description: 'User office',
    example: 'headquarters',
    required: false
  })
  @IsString()
  @IsOptional()
  office?: string;
} 