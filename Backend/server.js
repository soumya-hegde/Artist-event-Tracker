const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const connectDB = require('./config/db');
const authRoutes = require('./app/routes/authRoutes');
const artistRoutes = require('./app/routes/artistRoutes');
const eventRoutes = require('./app/routes/eventRoutes');
const errorMiddleware = require('./app/middleware/errorMiddleware');

dotenv.config({ path: path.join(__dirname, '.env') });
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/artists', artistRoutes);
app.use('/api/v1/events', eventRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
