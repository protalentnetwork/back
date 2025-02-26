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
  @ApiOperation({ summary: 'Update user fields (status, withdrawal, role, office)' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  async updateUser(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    const user = await this.userService.updateUser(id, updateUserDto);
    return new UserResponseDto(user);
  }

  @Patch(':id/login')
  @ApiOperation({ summary: 'Update user last login date' })
  @ApiResponse({
    status: 200,
    description: 'User last login date updated successfully',
    type: UserResponseDto
  })
  async updateLastLoginDate(@Param('id') id: number): Promise<UserResponseDto> {
    const user = await this.userService.updateLastLoginDate(id);
    return new UserResponseDto(user);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Actualizar contraseña de usuario' })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada correctamente',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado'
  })
  async updatePassword(
    @Param('id') id: number,
    @Body() updatePasswordDto: UpdatePasswordDto
  ): Promise<UserResponseDto> {
    const user = await this.userService.updatePassword(id, updatePasswordDto);
    return new UserResponseDto(user);
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