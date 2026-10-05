import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { SignupDto, LoginDto } from './auth.dto';
import { IUserRepository } from '../user/domain/interfaces/user.repository.interface';
import { InMemoryUserRepository } from '../user/infrastructure/repositories/in-memory-user.repository';

describe('AuthService (Integration)', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: 'test-secret' }),
      ],
      providers: [
        AuthService,
        { provide: IUserRepository, useClass: InMemoryUserRepository },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
  });

  it('should signup a new user and return token', async () => {
    const dto: SignupDto = {
      name: 'Alice',
      email: 'alice@test.com',
      password: 'securepass',
    };

    const result = await authService.signup(dto);

    expect(result.token).toBeDefined();
    expect(result.email).toBe(dto.email);
    expect(result.name).toBe(dto.name);
  });

  it('should throw if email already exists', async () => {
    const dto: SignupDto = {
      name: 'Bob',
      email: 'bob@test.com',
      password: 'pass',
    };

    await authService.signup(dto);
    await expect(authService.signup(dto)).rejects.toThrow('User already exists');
  });

  it('should login with correct credentials', async () => {
    const signupDto: SignupDto = {
      name: 'Carl',
      email: 'carl@test.com',
      password: 'mypassword',
    };
    await authService.signup(signupDto);

    const loginDto: LoginDto = {
      email: 'carl@test.com',
      password: 'mypassword',
    };

    const result = await authService.login(loginDto);
    expect(result.token).toBeDefined();
    expect(result.email).toBe('carl@test.com');
  });

  it('should fail login with wrong email', async () => {
    const loginDto: LoginDto = {
      email: 'nonexistent@test.com',
      password: 'pass',
    };

    await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials');
  });

  it('should fail login with wrong password', async () => {
    const signupDto: SignupDto = {
      name: 'Dana',
      email: 'dana@test.com',
      password: 'correctpass',
    };
    await authService.signup(signupDto);

    const loginDto: LoginDto = {
      email: 'dana@test.com',
      password: 'wrongpass',
    };

    await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials');
  });
});
