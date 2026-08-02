require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routingRoutes = require('./routes/routing.routes');
const { startWorker } = require('./queue/worker');

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost', 'http://127.0.0.1:5173'],
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
