import { IsString, IsUUID, IsEmail } from 'class-validator';

export class AuthResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  token: string;
}
