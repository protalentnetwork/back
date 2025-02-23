import { Exclude } from 'class-transformer';

export class UserResponseDto {
    id: number;
    username: string;
    email: string;
    role: string;
    status: string;
    office: string;
    createdAt: Date;
    withdrawal: string;
    lastLoginDate: Date | null;
    lastLogoutDate: Date | null;
    phoneNumber: string | null;
    description: string | null;

    @Exclude()
    password: string;

    constructor(partial: Partial<UserResponseDto>) {
        Object.assign(this, partial);
    }
} 