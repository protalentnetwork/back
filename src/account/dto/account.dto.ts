import { ApiProperty } from '@nestjs/swagger';

export class AccountDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  office: string;

  @ApiProperty()
  wallet: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  alias: string;

  @ApiProperty()
  cbu: string;

  @ApiProperty()
  operator: string;

  @ApiProperty()
  agent: string;

  @ApiProperty()
  status: string;
}

export class CbuResponseDto {
  @ApiProperty({ type: [String] })
  cbus: string[];
}