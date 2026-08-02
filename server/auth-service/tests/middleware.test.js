/**
 * Tests for verifyToken and checkRole middleware.
 *
 * These are unit tests — we test the middleware functions directly,
 * not via HTTP. We pass mock Express (req, res, next) objects so we
 * can assert on exactly what the middleware does without spinning up
 * the full server or touching a database.
 *
 * Interview angle: "This proves the middleware enforces our security
 * contract independently of any route that uses it — if the middleware
 * breaks, these tests catch it before it reaches a route test."
 */

const { verifyToken, checkRole } = require('../src/middleware/auth');
const jwt = require('jsonwebtoken');

// Use a fixed secret that matches what the middleware uses.
const TEST_SECRET = 'devsecret_please_change';
process.env.JWT_SECRET = TEST_SECRET;

// Helper: builds the mock (req, res, next) triple Express passes to middleware.
const buildMocks = () => ({
  req: { headers: {} },
  res: {
    status: jest.fn().mockReturnThis(), // .status(...) returns res so we can chain .json(...)
    json: jest.fn(),
  },
  next: jest.fn(),
});

describe('verifyToken middleware', () => {
  it('should call next() with a valid Bearer token', () => {
    const token = jwt.sign({ id: 'user123', role: 'admin' }, TEST_SECRET, { expiresIn: '1h' });
    const { req, res, next } = buildMocks();
    req.headers['authorization'] = `Bearer ${token}`;

    verifyToken(req, res, next);

    // next() called means middleware passed control forward — auth succeeded
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe('user123');
    expect(req.userRole).toBe('admin');
  });

  it('should return 403 when no token is provided', () => {
    const { req, res, next } = buildMocks();

    verifyToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
  });

  it('should return 401 for an expired token', () => {
    // Sign a token that expired 1 second ago
    const token = jwt.sign({ id: 'user123', role: 'agent' }, TEST_SECRET, { expiresIn: -1 });
    const { req, res, next } = buildMocks();
    req.headers['authorization'] = `Bearer ${token}`;

    verifyToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 401 for a tampered token', () => {
    const token = jwt.sign({ id: 'user123', role: 'admin' }, 'WRONG_SECRET');
    const { req, res, next } = buildMocks();
    req.headers['authorization'] = `Bearer ${token}`;

    verifyToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('checkRole middleware', () => {
  it('should call next() when the user has an allowed role', () => {
    const { req, res, next } = buildMocks();
    req.userRole = 'admin'; // Simulates req after verifyToken has run

    const middleware = checkRole(['admin', 'dispatcher']);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should return 403 when the user role is not in the allowed list', () => {
    const { req, res, next } = buildMocks();
    req.userRole = 'agent'; // agent trying to hit an admin-only route

    const middleware = checkRole(['admin', 'dispatcher']);
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: Insufficient privileges' });
  });

  it('should return 403 when userRole is missing entirely', () => {
    // This would happen if verifyToken somehow didn't run (e.g. route ordering bug)
    const { req, res, next } = buildMocks();
    // req.userRole is undefined

    const middleware = checkRole(['admin']);
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
