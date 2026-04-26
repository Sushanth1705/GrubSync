require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const connectDB = require('./config/db');
const initSocket = require('./socket/socket');

const app = express();
const server = http.createServer(app);

// Connect Database
connectDB();

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rounds', require('./routes/round'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/bill', require('./routes/bill'));

app.get('/', (req, res) => {
  res.send('GrubSync API is running...');
});

// Generic Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
