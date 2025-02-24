import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'john_doe' })
    @IsNotEmpty()
    @IsString()
    username: string;

    @ApiProperty({ example: 'john_doe@example.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'securepassword123' })
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'admin' })
    @IsNotEmpty()
    @IsString()
    role: string;

    @ApiProperty({ example: 'Central Office' })
    @IsNotEmpty()
    @IsString()
    office: string;
}