import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from "./entities/user.entity";
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) { }

    async findAll(): Promise<User[]> {
        return this.userRepository.find();
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const existingUser = await this.userRepository.findOne({
            where: { email: createUserDto.email }
        });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        return this.userRepository.save(user);
    }

    async updateUser(userId: number, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Update only the fields that are provided
        if (updateUserDto.status !== undefined) {
            user.status = updateUserDto.status;
        }
        
        if (updateUserDto.withdrawal !== undefined) {
            user.withdrawal = updateUserDto.withdrawal;
        }
        
        if (updateUserDto.role !== undefined) {
            user.role = updateUserDto.role;
        }
        
        if (updateUserDto.office !== undefined) {
            user.office = updateUserDto.office;
        }

        return this.userRepository.save(user);
    }

    async updateLastLoginDate(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.lastLoginDate = new Date();
        return this.userRepository.save(user);
    }

    async findOne(id: number): Promise<User> {
        return this.userRepository.findOne({ where: { id } });
    }

    async findByEmail(email: string): Promise<User> {
        return this.userRepository.findOne({ where: { email } });
    }

    async updatePassword(userId: number, updatePasswordDto: UpdatePasswordDto): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(updatePasswordDto.password, 10);
        user.password = hashedPassword;

        return this.userRepository.save(user);
    }

    async remove(userId: number): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        await this.userRepository.remove(user);
    }
}
