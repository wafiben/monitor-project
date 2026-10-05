import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request  } from '@nestjs/common';
import { UserService } from './application/services/user.service';
import { CreateUserDto, UpdateUserDto } from './DTOs/user.dto';
import { AuthGuard } from '@nestjs/passport';

//@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Get()
  async getAll() {
    return this.userService.getAllUsers();
  }
  
}
