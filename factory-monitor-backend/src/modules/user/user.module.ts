import { Module } from '@nestjs/common';
import { UserService } from './application/services/user.service';
import { InMemoryUserRepository } from './infrastructure/repositories/in-memory-user.repository';
import { IUserRepository } from './domain/interfaces/user.repository.interface';
import { UserController } from './user.controller'; 

@Module({
  imports: [],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: IUserRepository, 
      useClass: InMemoryUserRepository, 
    },
  ],
  exports: [
    UserService,
    {
      provide: IUserRepository,
      useClass: InMemoryUserRepository,
    },
  ],
})
export class UserModule {}
