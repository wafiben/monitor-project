import { IUserRepository } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];

  async createUser(user: Partial<User>): Promise<User> {
    const newUser = {
      id: uuidv4(),
      name: user.name!,
      email: user.email!,
      password: user.password!,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Partial<User> as User;
    this.users.push(newUser);
    return newUser;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async findAll(): Promise<User[]> {
    return this.users;
  }

  async updateUser(id: string, update: Partial<User>): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;

    if (update.name !== undefined) user.name = update.name;
    if (update.email !== undefined) user.email = update.email;
    if (update.password !== undefined) user.password = update.password;

    user.updatedAt = new Date();
    return user;
  }

  async deleteUser(id: string): Promise<User | null> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return null;

    const [deleted] = this.users.splice(index, 1);
    return deleted;
  }
}
