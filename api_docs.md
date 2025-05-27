# API Documentation

## Base URL
- **Development:** `http://localhost:3001`
- **Production:** `https://api.yourapp.com`

## Authentication
Currently no authentication required. In production, consider implementing:
- API keys for rate limiting
- JWT tokens for user sessions
- OAuth for third-party integrations

## Rate Limiting
- **Limit:** 10 requests per minute per IP
- **Headers:** 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

## Endpoints

### Health Check
Check if the API is running and healthy.

```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Get Base Inventory
Retrieve the base inventory of standard moving items.

```http
GET /api/inventory/base
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Two Seater Sofa",
    "weight": 42,
    "category": "seating",
    "type": "base"
  }
]
```

### Analyze Item with AI
Send an item name for AI analysis and web search.

```http
POST /api/inventory/analyze
Content-Type: application/json

{
  "itemName": "antique piano"
}
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| itemName | string | Yes | Name or description of item to analyze (max 100 chars) |

**Response:**
```json
{
  "item": {
    "name": "Antique Piano",
    "weight": 220,
    "dimensions": "160x65x115cm",
    "category": "musical",
    "confidence": 0.92,
    "reasoning": "Based on typical antique piano specifications from multiple sources"
  },
  "sources": [
    {
      "source": "wikipedia",
      "title": "Piano",
      "extract": "A piano is an acoustic...",
      "url": "https://en.wikipedia.org/wiki/Piano"
    },
    {
      "source": "duckduckgo",
      "abstract": "Piano information...",
      "url": "https://duckduckgo.com/..."
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "error": "Analysis failed",
  "message": "OpenAI API quota exceeded"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |
| 503 | Service Unavailable - External API unavailable |

## Data Models

### Base Item
```typescript
interface BaseItem {
  id: number;
  name: string;
  weight: number; // in kg
  category: string;
  type: "base";
}
```

### AI Generated Item
```typescript
interface AIItem {
  name: string;
  weight: number; // in kg
  dimensions?: string; // format: "LxWxH cm"
  category: string;
  confidence: number; // 0.0 to 1.0
  reasoning: string;
}
```

### Search Source
```typescript
interface SearchSource {
  source: "wikipedia" | "duckduckgo" | "product_db";
  title?: string;
  extract?: string;
  abstract?: string;
  url?: string;
}
```

## Categories
Standard categories used in the system:
- `seating` - Chairs, sofas, stools
- `tables` - Dining tables, desks, coffee tables
- `bedroom` - Beds, mattresses, dressers
- `storage` - Wardrobes, bookshelves, cabinets
- `boxes` - Moving boxes of various sizes
- `appliances` - Electronics, kitchen appliances
- `musical` - Instruments and audio equipment
- `fitness` - Exercise equipment
- `outdoor` - Garden furniture, sheds
- `misc` - Other items

## Usage Examples

### cURL Examples

**Get base inventory:**
```bash
curl https://api.yourapp.com/api/inventory/base
```

**Analyze an item:**
```bash
curl -X POST https://api.yourapp.com/api/inventory/analyze \
  -H "Content-Type: application/json" \
  -d '{"itemName": "antique piano"}'
```

### JavaScript Examples

**Using fetch:**
```javascript
// Analyze item
const response = await fetch('/api/inventory/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ itemName: 'exercise bike' })
});

const result = await response.json();
console.log(result.item.weight); // 45
```

**Using axios:**
```javascript
import axios from 'axios';

const analyzeItem = async (itemName) => {
  try {
    const response = await axios.post('/api/inventory/analyze', {
      itemName
    });
    return response.data;
  } catch (error) {
    console.error('Analysis failed:', error.response.data);
  }
};
```

## External APIs Used

### OpenAI GPT-3.5 Turbo
- **Purpose:** Analyze web search results and generate item specifications
- **Rate Limit:** 3,500 requests per minute
- **Cost:** ~$0.002 per 1K tokens

### DuckDuckGo Instant Answer API
- **Purpose:** General web search for item information
- **Rate Limit:** No official limit (be respectful)
- **Cost:** Free

### Wikipedia API
- **Purpose:** Detailed specifications from encyclopedia entries
- **Rate Limit:** 200 requests per second
- **Cost:** Free

## Security Considerations

### Input Validation
- Item names are limited to 100 characters
- Special characters are sanitized
- SQL injection protection (though we don't use SQL)

### Rate Limiting
- Prevents abuse of expensive AI API calls
- IP-based limiting with burst allowance
- Consider implementing user-based limits

### API Keys
- OpenAI API key stored in environment variables
- Never exposed in client-side code
- Rotate keys regularly

## Monitoring & Logging

### Health Checks
- `/health` endpoint for load balancer checks
- Database connectivity (if applicable)
- External API availability

### Metrics to Track
- Response times for AI analysis
- Success/failure rates
- Popular item searches
- Cache hit rates

### Logging
- All API requests with timestamps
- Error details for debugging
- AI analysis results for improvement