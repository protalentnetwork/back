import { Injectable } from '@nestjs/common';
import { User } from '../../core/entities/user.entity';
import { UserRepository } from '../../core/repositories/user.repository'; // Clase abstracta

@Injectable()
export class CreateUserUseCase {
    constructor(private readonly userRepository: UserRepository) { } // Inyecta la clase abstracta

    async execute(userData: Partial<User>): Promise<User> {
        const user = new User();
        user.name = userData.name ?? '';
        user.email = userData.email ?? '';
        return this.userRepository.create(user);
    }
}