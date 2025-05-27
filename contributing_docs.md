# Contributing to AI Enhanced Moving Inventory

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## 🤝 How to Contribute

### Reporting Issues
- Use the GitHub issue tracker
- Search existing issues before creating new ones
- Provide detailed reproduction steps
- Include environment information (Node.js version, OS, etc.)

### Suggesting Features
- Open an issue with the "enhancement" label
- Describe the feature and its use case
- Consider implementation complexity
- Be open to discussion and feedback

### Code Contributions
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- OpenAI API key (for testing AI features)

### Quick Setup
```bash
# Clone your fork
git clone https://github.com/yourusername/ai-inventory-tracker.git
cd ai-inventory-tracker

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# Start development
npm run dev  # Backend
cd frontend && npm run dev  # Frontend
```

### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Add required variables
OPENAI_API_KEY=your-test-api-key
NODE_ENV=development
```

## 📝 Code Style Guidelines

### JavaScript/Node.js
- Use ES6+ features
- 2 spaces for indentation
- Semicolons required
- Use `const`/`let`, avoid `var`
- Meaningful variable names

**Example:**
```javascript
// ✅ Good
const analyzeUserInput = async (inputText) => {
  const trimmedText = inputText.trim();
  if (!trimmedText) {
    throw new Error('Input text cannot be empty');
  }
  return await performAnalysis(trimmedText);
};

// ❌ Bad
var analyze = function(input) {
  var text = input.trim()
  if(!text) throw new Error('empty')
  return performAnalysis(text)
}
```

### React/JSX
- Functional components with hooks
- Props destructuring
- Meaningful component names
- Use React.Fragment or `<>` for wrappers

**Example:**
```jsx
// ✅ Good
const ItemCard = ({ item, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div className="item-card">
      <h3>{item.name}</h3>
      {/* component content */}
    </div>
  );
};

// ❌ Bad
function Card(props) {
  return <div class="card">{props.item.name}</div>
}
```

### CSS
- BEM naming convention
- CSS custom properties for themes
- Mobile-first responsive design
- Consistent spacing units

**Example:**
```css
/* ✅ Good */
.item-card {
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  background: var(--surface);
}

.item-card__title {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

.item-card--highlighted {
  border-color: var(--primary-color);
}

/* ❌ Bad */
.card {
  padding: 20px;
  background: white;
}
.title {
  font-size: 18px;
}
```

## 🧪 Testing

### Running Tests
```bash
# Backend tests
npm test

# Frontend tests
cd frontend && npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Writing Tests
- Unit tests for utilities and helpers
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for critical user flows

**Example Test:**
```javascript
// utils/textProcessor.test.js
import { findMatches } from './textProcessor.js';

describe('findMatches', () => {
  it('should find furniture items in text', () => {
    const text = 'I have a sofa and dining table';
    const matches = findMatches(text);
    
    expect(matches).toHaveLength(2);
    expect(matches[0].item.name).toContain('Sofa');
    expect(matches[1].item.name).toContain('Table');
  });

  it('should handle empty text', () => {
    const matches = findMatches('');
    expect(matches).toHaveLength(0);
  });
});
```

## 🏗️ Architecture Guidelines

### Backend Structure
```
server.js           # Main server file
routes/            # API route handlers
├── inventory.js   # Inventory-related routes
├── analysis.js    # AI analysis routes
└── health.js      # Health check routes
services/          # Business logic
├── aiService.js   # AI integration
├── webSearch.js   # Web search logic
└── cache.js       # Caching logic
utils/             # Helper functions
middleware/        # Express middleware
tests/             # Test files
```

### Frontend Structure
```
src/
├── components/    # Reusable components
│   ├── ItemCard.jsx
│   ├── AIStatus.jsx
│   └── SearchInput.jsx
├── hooks/         # Custom React hooks
│   ├── useInventory.js
│   └── useAIAnalysis.js
├── services/      # API communication
│   └── apiClient.js
├── utils/         # Helper functions
├── styles/        # CSS modules/styled components
└── App.jsx        # Main component
```

### Database Schema (if applicable)
```sql
-- Items table
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  weight INTEGER NOT NULL,
  dimensions VARCHAR(100),
  category VARCHAR(50),
  type VARCHAR(20) DEFAULT 'base',
  confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User sessions (future)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

## 🚀 Feature Development

### Adding New Item Types
1. Update base inventory in `server.js`
2. Add recognition patterns in text processor
3. Update frontend categories
4. Add tests for new patterns
5. Update documentation

### Integrating New AI Models
1. Create service in `services/aiService.js`
2. Add configuration options
3. Implement fallback mechanisms
4. Add monitoring and logging
5. Update environment variables

### Adding New Data Sources
1. Create search function in `services/webSearch.js`
2. Add error handling and timeouts
3. Update aggregation logic
4. Add caching for results
5. Document API requirements

## 📋 Pull Request Process

### Before Submitting
- [ ] Code follows style guidelines
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] No console.log statements left
- [ ] Environment variables documented

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added and passing
- [ ] Documentation updated
```

### Review Process
1. Automated checks must pass
2. At least one maintainer review required
3. Address all feedback
4. Squash commits before merge
5. Update CHANGELOG.md

## 🐛 Debugging

### Common Issues

**AI Analysis Fails**
```javascript
// Add debugging to aiService.js
console.log('OpenAI request:', {
  model: 'gpt-3.5-turbo',
  messages: [...],
  temperature: 0.3
});

// Check API response
console.log('OpenAI response:', response.data);
```

**Text Recognition Issues**
```javascript
// Debug text processing
const debug = require('debug')('inventory:textProcessor');

export function findMatches(text) {
  debug('Processing text:', text);
  const matches = /* processing logic */;
  debug('Found matches:', matches.length);
  return matches;
}
```

**Frontend State Issues**
```jsx
// React DevTools and console debugging
const [items, setItems] = useState([]);

useEffect(() => {
  console.log('Items updated:', items);
}, [items]);
```

## 📈 Performance Guidelines

### Backend Optimization
- Cache expensive operations (AI calls, web searches)
- Use compression middleware
- Implement request timeout
- Monitor memory usage
- Use connection pooling for databases

### Frontend Optimization
- Lazy load components
- Memoize expensive calculations
- Optimize bundle size
- Use React.memo for pure components
- Implement virtual scrolling for long lists

### Database Optimization
- Add indexes on frequently queried columns
- Use explain plans to optimize queries
- Implement proper pagination
- Consider read replicas for scaling

## 🔒 Security Guidelines

### Input Validation
```javascript
// Always validate and sanitize input
const validateItemName = (name) => {
  if (!name || typeof name !== 'string') {
    throw new Error('Invalid item name');
  }
  
  if (name.length > 100) {
    throw new Error('Item name too long');
  }
  
  // Remove potentially harmful characters
  return name.replace(/[<>\"']/g, '').trim();
};
```

### API Security
- Rate limiting implemented
- Input sanitization
- Error messages don't leak sensitive info
- API keys stored securely
- CORS properly configured

### Frontend Security
- Sanitize user input before display
- Use HTTPS in production
- Implement CSP headers
- Avoid inline scripts/styles

## 📚 Documentation

### Code Documentation
```javascript
/**
 * Analyzes item text using AI and web search
 * @param {string} itemText - Description of item to analyze
 * @param {Object} options - Analysis options
 * @param {boolean} options.includeWebSearch - Whether to perform web search
 * @returns {Promise<Object>} Analysis result with weight, dimensions, etc.
 * @throws {Error} When itemText is invalid or AI service fails
 */
async function analyzeItem(itemText, options = {}) {
  // Implementation
}
```

### API Documentation
- Keep API.md updated with changes
- Include request/response examples
- Document error codes and messages
- Provide usage examples

### User Documentation
- Update README.md for setup changes
- Document new features
- Include troubleshooting steps
- Provide migration guides for breaking changes

## 🎯 Roadmap Priorities

### High Priority
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Mobile responsive design
- [ ] Accessibility compliance

### Medium Priority
- [ ] User authentication
- [ ] Data persistence
- [ ] Advanced AI features
- [ ] API rate limiting improvements

### Low Priority
- [ ] Multi-language support
- [ ] Offline functionality
- [ ] Advanced analytics
- [ ] Third-party integrations

## 📞 Getting Help

### Communication Channels
- **GitHub Issues:** Bug reports and feature requests
- **GitHub Discussions:** General questions and ideas
- **Discord:** Real-time chat (if available)
- **Email:** maintainer@yourproject.com

### Resources
- [API Documentation](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Architecture Overview](ARCHITECTURE.md)
- [OpenAI API Docs](https://platform.openai.com/docs)

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- CHANGELOG.md for significant contributions
- Release notes for major features
- Annual contributor spotlight

Thank you for contributing to making moving inventory tracking smarter and more efficient! 🚀