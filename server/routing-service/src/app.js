const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'routing-service' });
});

const PORT = process.env.PORT || 5003;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Routing service running on port ${PORT}`);
  });
}

module.exports = app;
