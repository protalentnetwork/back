import { Injectable } from '@nestjs/common';
import { User } from '../../core/entities/user.entity';
import { UserRepository } from '../../core/repositories/user.repository';

@Injectable()
export class GetAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    return await this.userRepository.findAll();
  }
}