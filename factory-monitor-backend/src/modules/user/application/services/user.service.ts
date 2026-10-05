import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository, IUserRepository as IUserRepositoryToken } from '../../domain/interfaces/user.repository.interface';
import { CreateUserDto, UpdateUserDto } from '../../DTOs/user.dto';
import { User } from '../../domain/entities/user.entity';
import { UserResponseDto } from '../../DTOs/user-response.dto';;
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository,
  ) {}

  private toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto | null> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = await this.userRepository.createUser({
        ...createUserDto,
        password: hashedPassword,
      });
    return user ? this.toResponse(user) : null;
  }

  async getUserById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findById(id);
    return user ? this.toResponse(user) : null;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto | null> {
    const updatedUser = await this.userRepository.updateUser(id, updateUserDto);
    if (!updatedUser) {throw new NotFoundException(`User with ID ${id} not found`);}
      return {
        id: updatedUser.id,  
        name: updatedUser.name,
        email: updatedUser.email,
      };
  }

  async deleteUser(id: string): Promise<{ message: string; id: string } | null> {
  const deletedUser = await this.userRepository.deleteUser(id);
  if (!deletedUser) {
    throw new NotFoundException(`User with ID ${id} not found`);
  }
  return { message: 'User deleted successfully', id: deletedUser.id };
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findAll();
    return users.map(this.toResponse);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
  
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }
}
