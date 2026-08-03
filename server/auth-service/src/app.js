require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const { observeRequest, metricsHandler } = require('./monitoring/metrics');

const app = express();
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : true;
app.use(express.json());
app.use(observeRequest);

// CORS: Allow requests from the Vite dev server and from within Docker
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth-service' });
});
app.get('/metrics', metricsHandler);

const PORT = process.env.PORT || 5001;
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  });
}

module.exports = app;
