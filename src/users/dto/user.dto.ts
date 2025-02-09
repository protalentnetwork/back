import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({
        description: 'Username del usuario',
        example: 'john_doe'
    })
    username: string;

    @ApiProperty({
        description: 'Email del usuario',
        example: 'john@example.com'
    })
    email: string;

    @ApiProperty({
        description: 'Rol del usuario',
        example: 'admin'
    })
    role: string;

    @ApiProperty({
        description: 'Estado del usuario',
        example: 'active'
    })
    status: string;

    @ApiProperty({
        description: 'Oficina del usuario',
        example: 'main_office'
    })
    office: string;

    @ApiProperty({
        description: 'Retiro del usuario',
        example: 'enabled'
    })
    withdrawal: string;
}

export class UserResponseDto {
    @ApiProperty({
        description: 'ID único del usuario',
        example: 1
    })
    id: number;

    @ApiProperty({
        description: 'Username del usuario',
        example: 'john_doe'
    })
    username: string;

    @ApiProperty({
        description: 'Email del usuario',
        example: 'john@example.com'
    })
    email: string;

    @ApiProperty({
        description: 'Rol del usuario',
        example: 'admin'
    })
    role: string;

    @ApiProperty({
        description: 'Estado del usuario',
        example: 'active'
    })
    status: string;

    @ApiProperty({
        description: 'Oficina del usuario',
        example: 'main_office'
    })
    office: string;

    @ApiProperty({
        description: 'Fecha de creación',
        example: '2024-03-14T12:00:00Z'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Retiro del usuario',
        example: 'enabled'
    })
    withdrawal: string;
} 