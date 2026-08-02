const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../src/config/db', () => jest.fn().mockResolvedValue(true)); // Mock DB connection

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user', async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedpassword');
    User.prototype.save = jest.fn().mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123', role: 'dispatcher' });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully');
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
  });

  it('should not register user with existing email', async () => {
    User.findOne.mockResolvedValue({ email: 'test@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.statusCode).toEqual(409);
    expect(res.body).toHaveProperty('error', 'User already exists');
  });

  it('should login and return a token', async () => {
    const mockUser = { _id: '123', email: 'test@example.com', password: 'hashedpassword', role: 'admin' };
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mockedtoken');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token', 'mockedtoken');
    expect(res.body).toHaveProperty('role', 'admin');
  });

  it('should return 401 for invalid credentials', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.statusCode).toEqual(401);
  });
});
