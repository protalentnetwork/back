import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsNumber, IsEnum, IsArray, IsBoolean } from 'class-validator';

export class CreateTicketDto {
    @ApiProperty({ description: 'Email of the ticket requester' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Subject of the ticket' })
    @IsString()
    subject: string;

    @ApiProperty({ description: 'Description of the ticket' })
    @IsString()
    description: string;

    @ApiProperty({
        description: 'Custom field of the ticket',
        example: [{
            id: 1,
            value: "Custom value"
        }],
        type: 'array'
    })
    @IsArray()
    custom_fields: {
        id?: number;
        value: string;
    }[];
}

export class ChangeTicketStatusDto {
    @ApiProperty({ description: 'New status for the ticket', enum: ['new', 'open', 'pending', 'hold', 'solved', 'closed'] })
    @IsEnum(['new', 'open', 'pending', 'hold', 'solved', 'closed'])
    status: string;
}

export class AssignTicketDto {
    @ApiProperty({ description: 'ID of the agent to assign the ticket to' })
    @IsString()
    userId: string;
}

export class TicketResponseDto {
    @ApiProperty()
    @IsNumber()
    id: number;

    @ApiProperty()
    @IsString()
    subject: string;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsString()
    status: string;

    @ApiProperty()
    @IsNumber()
    requester_id: number;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    assignee_id?: number;

    @ApiProperty()
    user?: {
        name: string;
        email: string;
    };

    @ApiProperty()
    @IsNumber()
    group_id: number;

    @ApiProperty({ type: 'array' })
    @IsOptional()
    custom_fields?: {
        id: number;
        value: string;
    }[];
}

export class CommentResponseDto {
    @ApiProperty()
    @IsNumber()
    id: number;

    @ApiProperty()
    @IsString()
    body: string;

    @ApiProperty()
    @IsNumber()
    author_id: number;

    @ApiProperty()
    @IsString()
    created_at: string;
}

export class UserResponseDto {
    @ApiProperty()
    @IsNumber()
    id: number;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    role: string;
}

export class GroupMembershipResponseDto {
    @ApiProperty()
    @IsString()
    url: string;

    @ApiProperty()
    @IsNumber()
    id: number;

    @ApiProperty()
    @IsNumber()
    user_id: number;

    @ApiProperty()
    @IsNumber()
    group_id: number;

    @ApiProperty()
    @IsString()
    group_name: string;

    @ApiProperty()
    @IsString()
    created_at: string;

    @ApiProperty()
    @IsString()
    updated_at: string;

    @ApiProperty()
    @IsBoolean()
    default: boolean;

    @ApiProperty()
    user?: {
        name: string;
        email: string;
        role: string;
        assigned_tickets_count: number;
    };
} 