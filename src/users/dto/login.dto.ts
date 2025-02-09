import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from "./user.dto";

export class LoginDto {
    @ApiProperty({
        description: 'Email del usuario',
        example: 'user@example.com'
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'Contraseña del usuario',
        example: '********'
    })
    @IsNotEmpty()
    @IsString()
    password: string;
}

export class LoginResponseDto {
    @ApiProperty({
        description: 'Token de acceso JWT',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    access_token: string;

    @ApiProperty({
        description: 'Información del usuario',
        type: () => UserResponseDto
    })
    user: UserResponseDto;
}
