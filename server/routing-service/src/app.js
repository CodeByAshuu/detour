require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routingRoutes = require('./routes/routing.routes');
const { startWorker } = require('./queue/worker');
const { observeRequest, metricsHandler } = require('./monitoring/metrics');

const app = express();
const DEFAULT_CORS_ORIGINS = ['https://detourhq.vercel.app', 'http://localhost:5173', 'http://localhost'];
const corsOrigin = [...new Set([
  ...DEFAULT_CORS_ORIGINS,
  ...(process.env.CORS_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean),
])];
app.use(express.json());
app.use(observeRequest);

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use('/api/routing', routingRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'routing-service' });
});
app.get('/metrics', metricsHandler);

const PORT = process.env.PORT || 5003;
if (require.main === module) {
  // Start BullMQ background worker
  try {
    startWorker();
    console.log('BullMQ routing worker started');
  } catch (e) {
    console.warn('BullMQ worker failed to start (Redis offline):', e.message);
  }

  app.listen(PORT, () => {
    console.log(`Routing service running on port ${PORT}`);
  });
}

module.exports = app;
