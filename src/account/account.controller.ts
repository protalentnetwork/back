import { Controller, Get, Post, Body, Param, Delete, Put, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { AccountDto, AccountsResponseDto, CbuResponseDto, CreateAccountDto } from './dto/account.dto';
import { ApiKeyAuth } from '../auth/apikeys/decorators/api-key-auth.decorator';
import { API_PERMISSIONS } from '../auth/apikeys/permissions.constants';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiResponse({
    status: 200,
    description: 'List of all accounts',
    type: AccountsResponseDto
  })
  async findAll(): Promise<AccountsResponseDto> {
    const accounts = await this.accountService.findAll();
    return { accounts };
  }

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

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiResponse({
    status: 200,
    description: 'The account',
    type: AccountDto
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found'
  })
  async findOne(@Param('id') id: string): Promise<AccountDto> {
    return this.accountService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({
    status: 201,
    description: 'The account has been successfully created',
    type: AccountDto
  })
  async create(@Body() createAccountDto: CreateAccountDto): Promise<AccountDto> {
    return this.accountService.create(createAccountDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an account' })
  @ApiResponse({
    status: 200,
    description: 'The account has been successfully updated',
    type: AccountDto
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found'
  })
  async update(
    @Param('id') id: string,
    @Body() updateAccountDto: Partial<CreateAccountDto>,
  ): Promise<AccountDto> {
    return this.accountService.update(+id, updateAccountDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an account' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'The account has been successfully deleted'
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found'
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.accountService.remove(+id);
  }
}