const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const NodeCache = require('node-cache');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache for search results (24 hour TTL)
const cache = new NodeCache({ stdTTL: 86400 });

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
  }
});

// Base inventory items
const baseInventoryItems = [
  { id: 1, name: "Two Seater Sofa", weight: 42, category: "seating", type: "base" },
  { id: 2, name: "Three Seater Sofa", weight: 48, category: "seating", type: "base" },
  { id: 3, name: "Armchair", weight: 41, category: "seating", type: "base" },
  { id: 4, name: "Dining Chair", weight: 9, category: "seating", type: "base" },
  { id: 5, name: "Coffee Table", weight: 20, category: "tables", type: "base" },
  { id: 6, name: "Dining Table", weight: 60, category: "tables", type: "base" },
  { id: 7, name: "Double Bed", weight: 44, category: "bedroom", type: "base" },
  { id: 8, name: "Wardrobe", weight: 90, category: "storage", type: "base" },
  { id: 9, name: "Bookshelf", weight: 30, category: "storage", type: "base" },
  { id: 10, name: "TV Stand", weight: 20, category: "storage", type: "base" }
];

// Routes
app.get('/api/inventory/base', (req, res) => {
  res.json(baseInventoryItems);
});

app.post('/api/inventory/analyze', async (req, res) => {
  try {
    const { itemName } = req.body;
    
    if (!itemName || typeof itemName !== 'string' || itemName.trim().length < 2) {
      return res.status(400).json({ error: 'Invalid item name' });
    }

    const analysis = {
      name: itemName,
      weight: 25,
      dimensions: "100x50x50cm",
      category: "misc",
      confidence: 0.8,
      reasoning: "Default analysis"
    };
    
    res.json({
      item: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;