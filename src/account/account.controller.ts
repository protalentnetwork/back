import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { CbuResponseDto } from './dto/account.dto';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('cbus')
  @ApiOperation({ summary: 'Get all CBUs' })
  @ApiResponse({
    status: 200,
    description: 'List of all CBUs',
    type: CbuResponseDto
  })
  async getAllCbus(): Promise<CbuResponseDto> {
    const cbus = await this.accountService.findAllCbus();
    return { cbus };
  }
}