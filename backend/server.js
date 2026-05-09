const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const rateLimitRoutes = require('./routes/rateLimit');
const apiRoutes = require('./routes/api');
const usageRoutes = require('./routes/usage');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rate-limits', rateLimitRoutes);
app.use('/api/protected', apiRoutes);
app.use('/api/usage', usageRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Rate-Limited API Access Management System', status: 'running' });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error('MongoDB connection error:', err));
