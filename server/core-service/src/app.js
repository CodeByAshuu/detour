require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const coreRoutes = require('./routes/core.routes');

const app = express();
app.use(express.json());

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use('/api/core', coreRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'core-service' });
});

const PORT = process.env.PORT || 5002;
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Core service running on port ${PORT}`);
    });
  });
}

module.exports = app;
