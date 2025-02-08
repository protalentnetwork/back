import { User } from '../entities/user.entity';
export declare abstract class UserRepository {
    abstract findAll(): Promise<User[]>;
    abstract create(user: User): Promise<User>;
}
