require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(express.json());

// CORS: Allow requests from the Vite dev server and from within Docker
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth-service' });
});

const PORT = process.env.PORT || 5001;
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  });
}

module.exports = app;
