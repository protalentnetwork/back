import { User } from '../../core/entities/user.entity';
import { UserRepository } from '../../core/repositories/user.repository';
export declare class CreateUserUseCase {
    private readonly userRepository;
    constructor(userRepository: UserRepository);
    execute(userData: Partial<User>): Promise<User>;
}
