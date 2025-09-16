const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// Create Express app
const app = express();

// Middleware: enable CORS and JSON body parsing
app.use(cors());
app.use(bodyParser.json());

// Basic health route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Import routes (will be implemented next)
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rural_bank';
const PORT = process.env.PORT || 5000;

mongoose
    .connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });


