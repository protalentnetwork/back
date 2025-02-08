import { Repository } from 'typeorm';
import { User } from '../../core/entities/user.entity';
import { UserRepository } from '../../core/repositories/user.repository';
export declare class UserRepositoryImpl extends UserRepository {
    private readonly typeOrmRepository;
    constructor(typeOrmRepository: Repository<User>);
    findAll(): Promise<User[]>;
    create(user: User): Promise<User>;
}
