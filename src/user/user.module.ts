import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../core/entities/user.entity';
import { UserController } from '../presentation/controllers/user.controller';
import { UserRepository } from '../core/repositories/user.repository'; // Clase abstracta
import { UserRepositoryImpl } from '../infrastructure/repositories/user.repository';
import { CreateUserUseCase } from 'src/application/use-cases/create-user.usecases';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [UserController],
    providers: [
        CreateUserUseCase,
        {
            provide: UserRepository, // Usa la clase abstracta como token
            useClass: UserRepositoryImpl, // Implementación concreta
        },
    ],
})
export class UserModule { }