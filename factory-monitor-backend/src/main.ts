import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DtoValidationPipe } from './shared/validation/dto-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
      origin: 'http://localhost:3001', 
      credentials: true, 
    });

  await app.listen(3000);  
  app.useGlobalPipes(new DtoValidationPipe());
}
bootstrap();
