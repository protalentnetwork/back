import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { CbuResponseDto } from './dto/account.dto';
import { ApiKeyAuth } from '../auth/apikeys/decorators/api-key-auth.decorator';
import { API_PERMISSIONS } from '../auth/apikeys/permissions.constants';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('cbus')
  @ApiKeyAuth(API_PERMISSIONS.ACCOUNTS_READ_CBUS)
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