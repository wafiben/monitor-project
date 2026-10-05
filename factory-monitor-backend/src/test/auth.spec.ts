import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule], // real module with real controllers
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  let token: string;

  it('should sign up a new user', async () => {
    const res = await request(server)
      .post('/auth/signup')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'pass' })
      .expect(201);

    expect(res.body.token).toBeDefined();
    expect(res.body.email).toBe('alice@test.com');
    token = res.body.token;
  });

  it('should fail to sign up with existing email', async () => {
    await request(server)
      .post('/auth/signup')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'pass' })
      .expect(400);
  });

  it('should login and return a token', async () => {
    const res = await request(server)
      .post('/auth/login')
      .send({ email: 'alice@test.com', password: 'pass' })
      .expect(200);

    expect(res.body.token).toBeDefined();
  });

  it('should not login with wrong password', async () => {
    await request(server)
      .post('/auth/login')
      .send({ email: 'alice@test.com', password: 'wrong' })
      .expect(401);
  });

  it('should get all users (protected route)', async () => {
    const res = await request(server)
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
  });
});
