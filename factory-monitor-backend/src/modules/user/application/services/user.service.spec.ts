import { UserService } from './user.service';
import { InMemoryUserRepository } from '../../infrastructure/repositories/in-memory-user.repository';
import { CreateUserDto, UpdateUserDto } from '../../DTOs/user.dto';

describe('UserService (Advanced, In-Memory)', () => {
  let userService: UserService;
  let userRepository: InMemoryUserRepository;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    userService = new UserService(userRepository);
  });

  it('should create a new user with hashed password', async () => {
    const dto: CreateUserDto = { name: 'Alice', email: 'alice@test.com', password: 'secret123' };
    const user  = await userService.createUser(dto);

    expect(user ).toBeDefined();
    expect(user?.id).toBeDefined();
    expect(user?.email).toBe(dto.email);
    const stored = await userRepository.findByEmail(dto.email);
    expect(stored?.password).not.toBe(dto.password); // Password must be hashed
  });

  it('should fetch a user by ID', async () => {
    const user = await userService.createUser({ name: 'Bob', email: 'bob@test.com', password: 'pass' });
    const fetched = await userService.getUserById(user!.id);
    expect(fetched).toBeDefined();
    expect(fetched?.email).toBe('bob@test.com');
  });

  it('should return null for non-existent ID', async () => {
    const result = await userService.getUserById('non-existent-id');
    expect(result).toBeNull();
  });

  it('should update an existing user', async () => {
    const user = await userService.createUser({ name: 'Carl', email: 'carl@test.com', password: 'pass' });
    const updated = await userService.updateUser(user!.id, { name: 'Carl Updated' });

    
    expect(updated).toBeDefined();
    expect(updated?.name).toBe('Carl Updated');
    expect(updated?.email).toBe('carl@test.com');
  });

  it('should throw on updating a non-existent user', async () => {
    await expect(userService.updateUser('bad-id', { name: 'No One' })).rejects.toThrow();
  });

  it('should delete a user', async () => {
    const user = await userService.createUser({ name: 'Del', email: 'del@test.com', password: 'deletepwd' });
    const deleted = await userService.deleteUser(user!.id);
    expect(deleted).toEqual({
      message: 'User deleted successfully',
      id: user?.id,
    });

    const afterDelete = await userService.getUserById(user!.id);
    expect(afterDelete).toBeNull();
  });

  it('should throw on deleting a non-existent user', async () => {
    await expect(userService.deleteUser('fake-id')).rejects.toThrow();
  });

  it('should return all users', async () => {
    await userService.createUser({ name: 'Eva', email: 'eva@test.com', password: 'pass' });
    await userService.createUser({ name: 'Fred', email: 'fred@test.com', password: 'pass' });

    const allUsers = await userService.getAllUsers();
    expect(allUsers.length).toBe(2);
  });

  it('should return a user by email', async () => {
    await userService.createUser({ name: 'George', email: 'geo@test.com', password: 'pass' });
    const found = await userService.findByEmail('geo@test.com');
    expect(found?.name).toBe('George');
  });

  it('should return null for non-existent user', async () => {
    const result = await userService.getUserById('non-existent-id');
    expect(result).toBeNull();
  });
});
