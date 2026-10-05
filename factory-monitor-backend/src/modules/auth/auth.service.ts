import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../user/domain/interfaces/user.repository.interface';
import { SignupDto, LoginDto } from './auth.dto';
import { AuthResponseDto } from './auth-response.dto';


@Injectable()
export class AuthService {
  constructor(
    @Inject(IUserRepository) private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    const { name, email, password } = signupDto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userRepository.createUser({
      name,
      email,
      password: hashedPassword,
    });

    if (!user) {
      throw new BadRequestException('User creation failed');
    }
    
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      token,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
  const user = await this.userRepository.findByEmail(dto.email);
  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const passwordValid = await bcrypt.compare(dto.password, user.password);
  if (!passwordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const token = this.jwtService.sign({
    sub: user.id,
    email: user.email,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    token,
  };
}
}
