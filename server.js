// Main Server File for Ausbildung Test Prep
// This sets up an Express server with all API routes

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
const authRoutes = require('./api/auth');
const subscriptionRoutes = require('./api/subscriptions');
const testRoutes = require('./api/tests');
const adminRoutes = require('./api/admin');

app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend routes (for SPA-like behavior)
// All other routes should serve the index.html (for client-side routing)
app.get('*', (req, res) => {
  // Don't serve index.html for API requests
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Not Found' });
  }

  // For all other routes, serve the main index.html
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

module.exports = app;