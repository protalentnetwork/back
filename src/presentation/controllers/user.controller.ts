import { Body, Controller, Post } from '@nestjs/common';
import { User } from '../../core/entities/user.entity';
import { CreateUserUseCase } from 'src/application/use-cases/create-user.usecases';

@Controller('users')
export class UserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post()
  async create(@Body() userData: Partial<User>) {
    return this.createUserUseCase.execute(userData);
  }
}