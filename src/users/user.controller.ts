import { Body, Controller, Get, Post, Param, Patch, Delete, UseInterceptors, ClassSerializerInterceptor, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(
    private readonly userService: UserService
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid user data'
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userService.create(createUserDto);
    return new UserResponseDto(user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    type: [UserResponseDto]
  })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userService.findAll();
    return users.map(user => new UserResponseDto(user));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userService.updateUser(parseInt(id), updateUserDto);
    return new UserResponseDto(user);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  async updatePassword(@Param('id') id: string, @Body() updatePasswordDto: UpdatePasswordDto): Promise<void> {
    await this.userService.updatePassword(parseInt(id), updatePasswordDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiResponse({
    status: 204,
    description: 'Usuario eliminado correctamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado'
  })
  async remove(@Param('id') id: number): Promise<void> {
    await this.userService.remove(id);
  }
}