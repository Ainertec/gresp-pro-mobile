import request from 'supertest';
import app from '../../src/app';
import { Document } from 'mongoose';

import { closeConnection, openConnection } from '../utils/connection';
import Token from '../utils/getToken';
import factory from '../factories';
import User from '../../src/models/User';
import { Questions } from '../../src/models/User';

interface UserInterface extends Document {
  name: string;
  password_hash: string;
  password: string;
  question: string;
  response: string;
  admin: boolean;
  generateToken(): string;
  checkPassword(password: string): Promise<boolean>;
}

describe('User Tests', () => {
  beforeAll(() => {
    openConnection();
  });
  afterAll(() => {
    closeConnection();
  });
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should create a user', async () => {
    const token = await Token;

    const response = await request(app)
      .post('/users')
      .send({
        name: 'Cleiton',
        password: '123123',
        admin: true,
        question: Questions.second,
        response: 'Num sei',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('should not create a admin user without admin privileges', async () => {
    const token = await Token;
    const user = await factory.create<UserInterface>('User', {
      admin: false,
    });

    const response = await request(app)
      .post('/users')
      .send({
        name: 'Cleiton',
        password: '123123',
        admin: true,
        question: Questions.first,
        response: 'Num sei',
      })
      .set('Authorization', `Bearer ${user.generateToken()}`);

    expect(response.status).toBe(200);
  });

  it('should not create a user with name already existent', async () => {
    const token = await Token;
    const user = await factory.create<UserInterface>('User', {
      name: 'Cleiton',
    });

    const response = await request(app)
      .post('/users')
      .send({
        name: 'Cleiton',
        password: '123123',
        admin: true,
        question: Questions.first,
        response: 'Num sei',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('should not create a user with invalid question', async () => {
    const token = await Token;

    const response = await request(app)
      .post('/users')
      .send({
        name: 'Cleiton',
        password: '123123',
        admin: true,
        question: '23qwq',
        response: 'Num sei',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('should not update a user name if it already exist', async () => {
    const token = await Token;
    const user = await factory.create<UserInterface>('User', {
      name: 'Cleiton',
    });

    const response = await request(app)
      .put(`/users/${user._id}`)
      .send({
        name: 'Cleiton',
        password: '123123',
        admin: true,
        question: Questions.first,
        response: 'Num sei',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('should update a user', async () => {
    const token = await Token;
    const user = await factory.create<UserInterface>('User');

    const response = await request(app)
      .put(`/users/${user._id}`)
      .send({
        name: 'Cleiton',
        password: '123123',
        admin: true,
        question: Questions.first,
        response: 'Num sei',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        name: 'Cleiton',
      })
    );
  });

  it('should update a user without user provider', async () => {
    const token = await Token;
    const user = await factory.create<UserInterface>('User');

    const response = await request(app)
      .put(`/users/${user._id}`)
      .send({
        password: '123123',
        admin: true,
        question: Questions.first,
        response: 'Num sei',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        name: user.name,
        response: 'Num sei',
      })
    );
  });

  it('should update a user without password provider', async () => {
    const token = await Token;
    const user = await factory.create<UserInterface>('User');

    const response = await request(app)
      .put(`/users/${user._id}`)
      .send({
        name: 'Cleiton',
        admin: true,
        question: Questions.first,
        response: 'Num sei',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        name: 'Cleiton',
      })
    );
  });

  it('should delete a user', async () => {
    const token = await Token;
    const user = await factory.create<UserInterface>('User');

    const response = await request(app)
      .delete(`/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('should list all users', async () => {
    const user = await factory.create<UserInterface>('User', {
      admin: true,
      name: 'Cleiton',
    });

    await factory.createMany<UserInterface>('User', 5);

    const response = await request(app)
      .get(`/users/`)
      .set('Authorization', `Bearer ${user.generateToken()}`);

    expect(response.status).toBe(200);
  });

  it('should not list all users if authenticate user do not be admin', async () => {
    const user = await factory.create<UserInterface>('User', {
      admin: false,
    });

    await factory.createMany<UserInterface>('User', 5);

    const response = await request(app)
      .get(`/users/`)
      .set('Authorization', `Bearer ${user.generateToken()}`);
    expect(response.status).toBe(401);
  });

  it('should show a expecific user', async () => {
    const user = await factory.create<UserInterface>('User', {
      admin: true,
      name: 'Cleiton',
    });

    await factory.createMany<UserInterface>('User', 5);

    const response = await request(app)
      .get(`/users/${user._id}`)
      .set('Authorization', `Bearer ${user.generateToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        name: 'Cleiton',
      })
    );
  });

  it('should list the user posible questions', async () => {
    const response = await request(app).get(`/users/questions`);
    expect(response.status).toBe(200);
  });
});
