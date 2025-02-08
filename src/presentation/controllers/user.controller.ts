import { Body, Controller, Get, Post } from '@nestjs/common';
import { User } from '../../core/entities/user.entity';
import { CreateUserUseCase } from 'src/application/use-cases/create-user.usecases';
import { GetAllUsersUseCase } from 'src/application/use-cases/get-all-users.usecase';

@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase
  ) {}

  @Post()
  async create(@Body() userData: Partial<User>) {
    return this.createUserUseCase.execute(userData);
  }

  @Get()
  async findAll() {
    return this.getAllUsersUseCase.execute();
  }
}