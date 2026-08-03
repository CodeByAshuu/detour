const request = require('supertest');
const app = require('../src/app');

describe('routing-service health endpoint', () => {
  it('reports that the service is available', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: 'routing-service' });
  });
});
