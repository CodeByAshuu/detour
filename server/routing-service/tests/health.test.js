const request = require('supertest');
const app = require('../src/app');

describe('routing-service health endpoint', () => {
  it('reports that the service is available', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: 'routing-service' });
  });

  it('exposes Prometheus-compatible process metrics', async () => {
    const response = await request(app).get('/metrics');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toContain('detour_process_uptime_seconds{service="routing-service"}');
  });

  it('allows the deployed Vercel frontend through CORS', async () => {
    const response = await request(app).get('/health').set('Origin', 'https://detourhq.vercel.app');

    expect(response.headers['access-control-allow-origin']).toBe('https://detourhq.vercel.app');
  });
});
