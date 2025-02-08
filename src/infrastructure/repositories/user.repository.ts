import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../core/entities/user.entity';
import { UserRepository } from '../../core/repositories/user.repository';

@Injectable()
export class UserRepositoryImpl extends UserRepository { // Extiende la clase abstracta
    constructor(
        @InjectRepository(User)
        private readonly typeOrmRepository: Repository<User>,
    ) {
        super();
    }

    async findAll(): Promise<User[]> {
        return this.typeOrmRepository.find();
    }

    async create(user: User): Promise<User> {
        return this.typeOrmRepository.save(user);
    }
}