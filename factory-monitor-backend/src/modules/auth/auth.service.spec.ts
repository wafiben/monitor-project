import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { SignupDto, LoginDto } from './auth.dto';
import { InMemoryUserRepository } from '../user/infrastructure/repositories/in-memory-user.repository';

describe('AuthService (Advanced, In-Memory)', () => {
  let authService: AuthService;
  let userRepository: InMemoryUserRepository;
  let jwtService: JwtService;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    jwtService = new JwtService({ secret: 'test-secret' });
    authService = new AuthService(userRepository, jwtService);
  });

  it('should sign up a user and return a token', async () => {
    const dto: SignupDto = { name: 'Alice', email: 'alice@test.com', password: 'pass' };
    const result = await authService.signup(dto);

    expect(result).toHaveProperty('token');
    expect(result.email).toBe(dto.email);
  });

  it('should throw if email already exists on signup', async () => {
    const dto: SignupDto = { name: 'Bob', email: 'bob@test.com', password: 'pass' };
    await authService.signup(dto);

    await expect(authService.signup(dto)).rejects.toThrow('User already exists');
  });

  it('should login a valid user and return token', async () => {
    const signupDto: SignupDto = { name: 'Carl', email: 'carl@test.com', password: 'pass' };
    await authService.signup(signupDto);

    const loginDto: LoginDto = { email: 'carl@test.com', password: 'pass' };
    const result = await authService.login(loginDto);

    expect(result).toHaveProperty('token');
    expect(result.email).toBe('carl@test.com');
  });

  it('should throw on login with wrong email', async () => {
    const dto: LoginDto = { email: 'nope@test.com', password: '123' };
    await expect(authService.login(dto)).rejects.toThrow('Invalid credentials');
  });

  it('should throw on login with wrong password', async () => {
    const signupDto: SignupDto = { name: 'Don', email: 'don@test.com', password: 'realpass' };
    await authService.signup(signupDto);

    const wrongPassDto: LoginDto = { email: 'don@test.com', password: 'wrongpass' };
    await expect(authService.login(wrongPassDto)).rejects.toThrow('Invalid credentials');
  });
});
