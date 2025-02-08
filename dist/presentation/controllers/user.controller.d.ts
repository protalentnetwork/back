import { User } from '../../core/entities/user.entity';
import { CreateUserUseCase } from 'src/application/use-cases/create-user.usecases';
export declare class UserController {
    private readonly createUserUseCase;
    constructor(createUserUseCase: CreateUserUseCase);
    create(userData: Partial<User>): Promise<User>;
}
