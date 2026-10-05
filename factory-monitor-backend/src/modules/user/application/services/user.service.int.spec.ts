import { Test } from '@nestjs/testing';
import { UserService } from './user.service';
import { IUserRepository } from '../../domain/interfaces/user.repository.interface';
import { InMemoryUserRepository } from '../../infrastructure/repositories/in-memory-user.repository';
import { CreateUserDto, UpdateUserDto } from '../../DTOs/user.dto';

describe('UserService (Integration)', () => {
  let userService: UserService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: IUserRepository, useClass: InMemoryUserRepository },
      ],
    }).compile();

    userService = moduleRef.get<UserService>(UserService);
  });

  it('should create a user with hashed password', async () => {
    const dto: CreateUserDto = { name: 'Alice', email: 'alice@test.com', password: 'secret' };
    const created = await userService.createUser(dto);

    expect(created).toBeDefined();
    expect(created?.email).toBe(dto.email);

    const stored = await userService.findByEmail(dto.email);
    expect(stored?.password).not.toBe(dto.password); // password should be hashed
  });

  it('should return a user by ID', async () => {
    const created = await userService.createUser({ name: 'Bob', email: 'bob@test.com', password: '123' });
    const found = await userService.getUserById(created!.id);

    expect(found).toBeDefined();
    expect(found?.email).toBe('bob@test.com');
  });

  it('should update a user', async () => {
    const created = await userService.createUser({ name: 'Carl', email: 'carl@test.com', password: 'pass' });
    const updated = await userService.updateUser(created!.id, { name: 'Carl Updated' });

    expect(updated?.name).toBe('Carl Updated');
  });

  it('should throw when updating non-existent user', async () => {
    await expect(userService.updateUser('bad-id', { name: 'Ghost' })).rejects.toThrow();
  });

  it('should delete a user', async () => {
    const user = await userService.createUser({ name: 'Del', email: 'del@test.com', password: 'pass' });
    const result = await userService.deleteUser(user!.id);

    expect(result).not.toBeNull();
    expect(result!.message).toContain('deleted');
  });

  it('should return all users', async () => {
    await userService.createUser({ name: 'Eva', email: 'eva@test.com', password: '123' });
    await userService.createUser({ name: 'Fred', email: 'fred@test.com', password: '123' });

    const users = await userService.getAllUsers();
    expect(users.length).toBe(2);
  });

  it('should return null for non-existent user', async () => {
    const result = await userService.getUserById('non-existent-id');
    expect(result).toBeNull();
  });
});
