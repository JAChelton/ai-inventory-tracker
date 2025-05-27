const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const NodeCache = require('node-cache');
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
  keyGenerator: (req) => req.ip,
  points: 10, // Number of requests
  duration: 60, // Per 60 seconds
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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
  { id: 3, name: "Four Seater Sofa", weight: 55, category: "seating", type: "base" },
  { id: 4, name: "Corner Sofa", weight: 65, category: "seating", type: "base" },
  { id: 5, name: "Armchair", weight: 41, category: "seating", type: "base" },
  { id: 6, name: "Recliner Chair", weight: 45, category: "seating", type: "base" },
  { id: 7, name: "Dining Chair", weight: 9, category: "seating", type: "base" },
  { id: 8, name: "Office Chair", weight: 12, category: "seating", type: "base" },
  { id: 9, name: "Bar Stool", weight: 8, category: "seating", type: "base" },
  { id: 10, name: "Dining Table", weight: 60, category: "tables", type: "base" },
  { id: 11, name: "Coffee Table", weight: 20, category: "tables", type: "base" },
  { id: 12, name: "Side Table", weight: 15, category: "tables", type: "base" },
  { id: 13, name: "Console Table", weight: 25, category: "tables", type: "base" },
  { id: 14, name: "Desk", weight: 35, category: "tables", type: "base" },
  { id: 15, name: "Dressing Table", weight: 40, category: "tables", type: "base" },
  { id: 16, name: "Double Bed", weight: 44, category: "bedroom", type: "base" },
  { id: 17, name: "Single Bed", weight: 30, category: "bedroom", type: "base" },
  { id: 18, name: "King Bed", weight: 60, category: "bedroom", type: "base" },
  { id: 19, name: "Queen Bed", weight: 50, category: "bedroom", type: "base" },
  { id: 20, name: "Bunk Bed", weight: 55, category: "bedroom", type: "base" },
  { id: 21, name: "Mattress Double", weight: 25, category: "bedroom", type: "base" },
  { id: 22, name: "Mattress Single", weight: 18, category: "bedroom", type: "base" },
  { id: 23, name: "Bed Frame", weight: 35, category: "bedroom", type: "base" },
  { id: 24, name: "Wardrobe", weight: 90, category: "storage", type: "base" },
  { id: 25, name: "Chest Of Drawers", weight: 35, category: "storage", type: "base" },
  { id: 26, name: "Bookshelf", weight: 30, category: "storage", type: "base" },
  { id: 27, name: "TV Stand", weight: 20, category: "storage", type: "base" },
  { id: 28, name: "Filing Cabinet", weight: 40, category: "storage", type: "base" },
  { id: 29, name: "Shoe Rack", weight: 12, category: "storage", type: "base" },
  { id: 30, name: "Storage Ottoman", weight: 15, category: "storage", type: "base" },
  { id: 31, name: "Large Box", weight: 10, category: "boxes", type: "base" },
  { id: 32, name: "Medium Box", weight: 8, category: "boxes", type: "base" },
  { id: 33, name: "Small Box", weight: 5, category: "boxes", type: "base" },
  { id: 34, name: "Book Box", weight: 15, category: "boxes", type: "base" },
  { id: 35, name: "Wardrobe Box", weight: 8, category: "boxes", type: "base" },
  { id: 36, name: "Refrigerator", weight: 125, category: "appliances", type: "base" },
  { id: 37, name: "Washing Machine", weight: 70, category: "appliances", type: "base" },
  { id: 38, name: "Dishwasher", weight: 50, category: "appliances", type: "base" },
  { id: 39, name: "Microwave", weight: 15, category: "appliances", type: "base" },
  { id: 40, name: "TV", weight: 25, category: "appliances", type: "base" },
  { id: 41, name: "Mirror", weight: 8, category: "misc", type: "base" },
  { id: 42, name: "Lamp", weight: 5, category: "misc", type: "base" },
  { id: 43, name: "Carpet", weight: 12, category: "misc", type: "base" },
  { id: 44, name: "Plant Pot", weight: 10, category: "misc", type: "base" },
  { id: 45, name: "Bicycle", weight: 15, category: "misc", type: "base" }
];

// Web search function using multiple sources
async function performWebSearch(query) {
  const cacheKey = `search_${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Search multiple sources for better data
    const searches = await Promise.allSettled([
      searchGoogle(query + ' weight dimensions specifications'),
      searchWikipedia(query),
      searchProductSpecs(query)
    ]);

    const results = searches
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(Boolean);

    const combinedResults = {
      query,
      sources: results,
      timestamp: new Date().toISOString()
    };

    cache.set(cacheKey, combinedResults);
    return combinedResults;

  } catch (error) {
    console.error('Web search error:', error);
    return null;
  }
}

// Google search simulation (you would use Google Custom Search API)
async function searchGoogle(query) {
  try {
    // Replace with actual Google Custom Search API
    // For demo, using DuckDuckGo instant answer API
    const response = await axios.get(`https://api.duckduckgo.com/`, {
      params: {
        q: query,
        format: 'json',
        no_html: '1',
        skip_disambig: '1'
      },
      timeout: 5000
    });

    return {
      source: 'duckduckgo',
      data: response.data,
      abstract: response.data.Abstract,
      url: response.data.AbstractURL
    };
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return null;
  }
}

// Wikipedia search
async function searchWikipedia(query) {
  try {
    const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
      timeout: 5000
    });

    return {
      source: 'wikipedia',
      title: response.data.title,
      extract: response.data.extract,
      url: response.data.content_urls?.desktop?.page
    };
  } catch (error) {
    // If direct page doesn't exist, try search
    try {
      const searchResponse = await axios.get('https://en.wikipedia.org/api/rest_v1/page/summary/' + 
        encodeURIComponent(query.split(' ')[0]), { timeout: 5000 });
      
      return {
        source: 'wikipedia',
        title: searchResponse.data.title,
        extract: searchResponse.data.extract,
        url: searchResponse.data.content_urls?.desktop?.page
      };
    } catch (searchError) {
      console.error('Wikipedia search error:', searchError);
      return null;
    }
  }
}

// Product specifications search (simulate product database)
async function searchProductSpecs(query) {
  try {
    // In a real app, this would query product databases, manufacturer specs, etc.
    // For now, return structured data format
    return {
      source: 'product_db',
      query,
      specifications: {
        // This would be populated from real product data
        estimated: true
      }
    };
  } catch (error) {
    console.error('Product specs search error:', error);
    return null;
  }
}

// AI analysis using OpenAI
async function analyzeWithAI(itemName, webSearchResults) {
  try {
    const prompt = `
Analyze the following item for a moving inventory system: "${itemName}"

Web search results:
${JSON.stringify(webSearchResults, null, 2)}

Based on the search results and your knowledge, provide ONLY a JSON response with:
{
  "name": "Proper capitalized name of the item",
  "weight": number (in kg, realistic average weight),
  "dimensions": "LxWxH format in cm",
  "category": "one of: seating, tables, bedroom, storage, boxes, appliances, misc, musical, fitness, outdoor",
  "confidence": number (0.0-1.0, how confident you are in the estimates),
  "reasoning": "brief explanation of weight/size estimation"
}

Important:
- Be realistic with weights (research actual products)
- Use metric units (kg, cm)
- If unsure, estimate conservatively
- Category should match existing categories when possible
- Only respond with valid JSON, no other text
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that analyzes furniture and household items for moving companies. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const aiResponse = response.choices[0].message.content.trim();
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(aiResponse);
    
    // Validate the response
    if (!parsedResponse.name || !parsedResponse.weight || !parsedResponse.category) {
      throw new Error('Invalid AI response format');
    }

    return parsedResponse;

  } catch (error) {
    console.error('AI analysis error:', error);
    
    // Fallback to heuristic analysis
    return analyzeHeuristically(itemName);
  }
}

// Fallback heuristic analysis
function analyzeHeuristically(itemName) {
  const lowerName = itemName.toLowerCase();
  
  // Basic heuristics for common items
  const heuristics = {
    piano: { weight: 180, dimensions: '150x60x110', category: 'musical' },
    'grand piano': { weight: 400, dimensions: '200x150x100', category: 'musical' },
    'upright piano': { weight: 180, dimensions: '150x60x110', category: 'musical' },
    treadmill: { weight: 85, dimensions: '180x80x140', category: 'fitness' },
    'exercise bike': { weight: 45, dimensions: '110x50x140', category: 'fitness' },
    'pool table': { weight: 320, dimensions: '280x150x80', category: 'misc' },
    'hot tub': { weight: 400, dimensions: '220x220x90', category: 'outdoor' },
    safe: { weight: 125, dimensions: '60x50x40', category: 'misc' },
    'fish tank': { weight: 35, dimensions: '120x40x50', category: 'misc' },
    aquarium: { weight: 35, dimensions: '120x40x50', category: 'misc' }
  };

  // Try exact match
  for (const [key, value] of Object.entries(heuristics)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return {
        name: capitalizeWords(itemName),
        weight: value.weight,
        dimensions: value.dimensions + 'cm',
        category: value.category,
        confidence: 0.75,
        reasoning: 'Heuristic analysis based on common item patterns'
      };
    }
  }

  // Generic estimation
  let baseWeight = 25;
  let category = 'misc';
  
  if (lowerName.includes('table')) {
    baseWeight = 40;
    category = 'tables';
  } else if (lowerName.includes('chair')) {
    baseWeight = 15;
    category = 'seating';
  } else if (lowerName.includes('bed')) {
    baseWeight = 45;
    category = 'bedroom';
  }

  // Adjust for size descriptors
  if (lowerName.includes('large') || lowerName.includes('big')) {
    baseWeight *= 1.5;
  }
  if (lowerName.includes('small') || lowerName.includes('mini')) {
    baseWeight *= 0.7;
  }

  return {
    name: capitalizeWords(itemName),
    weight: Math.round(baseWeight),
    dimensions: 'Variable',
    category,
    confidence: 0.6,
    reasoning: 'Generic estimation based on item type and size descriptors'
  };
}

function capitalizeWords(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

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

    const sanitizedItemName = itemName.trim().substring(0, 100); // Limit length

    // Perform web search
    const webResults = await performWebSearch(sanitizedItemName);
    
    // Analyze with AI
    const analysis = await analyzeWithAI(sanitizedItemName, webResults);
    
    res.json({
      item: analysis,
      sources: webResults ? webResults.sources : [],
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

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Inventory Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 OpenAI API: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Missing'}`);
});

module.exports = app;