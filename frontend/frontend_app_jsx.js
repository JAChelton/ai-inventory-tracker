import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Plus, 
  Minus, 
  Trash2,
  Sparkles,
  Search,
  Brain
} from 'lucide-react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [textInput, setTextInput] = useState('');
  const [basket, setBasket] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [aiStatus, setAiStatus] = useState({ show: false, type: 'loading', message: '' });
  const [baseInventory, setBaseInventory] = useState([]);
  const [pendingAiItems, setPendingAiItems] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load base inventory on mount
  useEffect(() => {
    loadBaseInventory();
  }, []);

  const loadBaseInventory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/inventory/base`);
      setBaseInventory(response.data);
    } catch (error) {
      console.error('Failed to load base inventory:', error);
    }
  };

  // AI item analysis
  const analyzeUnknownItem = async (itemText) => {
    if (pendingAiItems.has(itemText.toLowerCase())) {
      return null;
    }

    const newPendingItems = new Set(pendingAiItems);
    newPendingItems.add(itemText.toLowerCase());
    setPendingAiItems(newPendingItems);

    setAiStatus({
      show: true,
      type: 'loading',
      message: `AI analyzing "${itemText}"...`
    });

    try {
      const response = await axios.post(`${API_BASE_URL}/api/inventory/analyze`, {
        itemName: itemText
      });

      const aiItem = {
        id: Date.now() + Math.random(),
        ...response.data.item,
        type: 'ai-generated',
        sources: response.data.sources,
        originalText: itemText
      };

      setAiStatus({
        show: true,
        type: 'success',
        message: `Created "${aiItem.name}" (${aiItem.weight}kg)`
      });

      setTimeout(() => {
        setAiStatus({ show: false, type: '', message: '' });
      }, 3000);

      return aiItem;

    } catch (error) {
      console.error('AI analysis error:', error);
      setAiStatus({
        show: true,
        type: 'error',
        message: `Couldn't analyze "${itemText}"`
      });

      setTimeout(() => {
        setAiStatus({ show: false, type: '', message: '' });
      }, 3000);

      return null;
    } finally {
      const updatedPendingItems = new Set(pendingAiItems);
      updatedPendingItems.delete(itemText.toLowerCase());
      setPendingAiItems(updatedPendingItems);
    }
  };

  // Find matches in base inventory
  const findMatches = (text) => {
    if (!text.trim()) return [];
    
    const matches = [];
    const textLower = text.toLowerCase();
    
    // Simple word matching for known items
    const searchWords = ['bed', 'sofa', 'chair', 'table', 'box', 'tv', 'wardrobe', 'desk'];
    
    searchWords.forEach(word => {
      if (textLower.includes(word)) {
        const item = baseInventory.find(i => 
          i.name.toLowerCase().includes(word)
        );
        if (item && !matches.find(m => m.item.id === item.id)) {
          matches.push({ 
            item, 
            startIndex: textLower.indexOf(word),
            endIndex: textLower.indexOf(word) + word.length,
            matchedText: word 
          });
        }
      }
    });
    
    return matches;
  };

  // Find unknown items for AI analysis
  const findUnknownItems = (text) => {
    const itemPatterns = [
      /\b(\w+\s+)?(\w+)\s+(piano|guitar|instrument|tank|bike|machine|equipment|shed|table|rack)\b/gi,
      /\b(antique|vintage|old|new|exercise|fitness|garden|pool)\s+(\w+)\b/gi,
      /\b(\w{4,})\s+(stand|unit|system|set)\b/gi
    ];
    
    const unknownItems = [];
    
    itemPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const fullMatch = match[0].trim();
        if (!isKnownItem(fullMatch) && !unknownItems.includes(fullMatch)) {
          unknownItems.push(fullMatch);
        }
      }
    });
    
    return unknownItems;
  };

  const isKnownItem = (itemText) => {
    const lowerText = itemText.toLowerCase();
    return baseInventory.some(item => 
      item.name.toLowerCase().includes(lowerText) || 
      lowerText.includes(item.name.toLowerCase())
    ) || basket.some(item => 
      item.name.toLowerCase().includes(lowerText) ||
      lowerText.includes(item.name.toLowerCase())
    );
  };

  const extractQuantity = (text, matchStart) => {
    const beforeMatch = text.substring(Math.max(0, matchStart - 10), matchStart);
    const digitMatch = beforeMatch.match(/(\d+)\s*$/);
    return digitMatch ? parseInt(digitMatch[1], 10) : 1;
  };

  // Process input text
  const processInput = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const matches = findMatches(textInput);
      
      // Add matched known items
      matches.forEach(match => {
        const existing = basket.find(b => b.id === match.item.id);
        if (!existing) {
          const quantity = extractQuantity(textInput, match.startIndex);
          addToBasket(match.item, quantity);
        }
      });

      // Find and analyze unknown items
      const unknownItems = findUnknownItems(textInput);
      
      for (const unknownItem of unknownItems) {
        if (!basket.find(b => b.originalText === unknownItem)) {
          const aiItem = await analyzeUnknownItem(unknownItem);
          if (aiItem) {
            addToBasket(aiItem, 1);
          }
        }
      }
      
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [textInput, basket, baseInventory, isLoading, pendingAiItems]);

  // Debounced input processing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (textInput.trim()) {
        processInput();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [textInput, processInput]);

  const addToBasket = (item, quantity = 1) => {
    setBasket(prevBasket => {
      const existing = prevBasket.find(b => b.id === item.id);
      if (existing) {
        return prevBasket.map(b => 
          b.id === item.id 
            ? { ...b, quantity: b.quantity + quantity }
            : b
        );
      } else {
        return [...prevBasket, { 
          ...item, 
          quantity, 
          basketId: Date.now() + Math.random()
        }];
      }
    });
  };

  const updateQuantity = (basketId, change) => {
    setBasket(prevBasket => 
      prevBasket.map(item => 
        item.basketId === basketId 
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const removeFromBasket = (basketId) => {
    setBasket(prevBasket => prevBasket.filter(item => item.basketId !== basketId));
  };

  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeight = basket.reduce((sum, item) => sum + (item.weight * item.quantity), 0);

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <header className="header">
          <div></div>
          <button className="close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </header>

        {/* Title */}
        <div className="title-section">
          <h1 className="title">Tell us what you're moving</h1>
          <div className="subtitle">
            <div className="ai-badge-small">
              <Brain size={12} />
              AI ENHANCED
            </div>
            <span>Automatically creates items for unknown objects</span>
          </div>
        </div>

        {/* Input Section */}
        <section className="input-section">
          <div className="input-container">
            <textarea
              className="text-input"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Describe any items: antique piano, fish tank, exercise bike, garden shed..."
              rows="8"
            />
            <div className="ai-badge">
              <Sparkles size={16} />
              <span>POWERED BY AI</span>
            </div>
          </div>

          {/* AI Status */}
          <AnimatePresence>
            {aiStatus.show && (
              <motion.div
                className={`ai-status ${aiStatus.type}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="status-icon">
                  {aiStatus.type === 'loading' && <Loader2 size={16} className="spin" />}
                  {aiStatus.type === 'success' && <CheckCircle size={16} />}
                  {aiStatus.type === 'error' && <AlertCircle size={16} />}
                </div>
                <div className="status-text">{aiStatus.message}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="suggestions">
              <div className="suggestions-title">Did you mean?</div>
              <div className="suggestions-grid">
                {suggestions.map(item => (
                  <button
                    key={item.id}
                    className="suggestion-btn"
                    onClick={() => addToBasket(item, 1)}
                  >
                    <Plus size={14} />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Items Section */}
        <section className="items-section">
          {basket.length > 0 && (
            <>
              <h2 className="items-title">Your items:</h2>
              <div className="items-list">
                <AnimatePresence>
                  {basket.map(item => (
                    <motion.div
                      key={item.basketId}
                      className={`item-row ${item.type === 'ai-generated' ? 'ai-generated' : ''}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      layout
                    >
                      <div className="item-info">
                        <div className="item-name">
                          {item.name}
                          {item.type === 'ai-generated' && (
                            <span className="item-badge">
                              <Brain size={10} />
                              AI
                            </span>
                          )}
                        </div>
                        <div className="item-weight">{item.weight}kg each</div>
                        {item.dimensions && item.dimensions !== 'Variable' && (
                          <div className="item-dimensions">{item.dimensions}</div>
                        )}
                        {item.confidence && (
                          <div className="item-confidence">
                            Confidence: {Math.round(item.confidence * 100)}%
                          </div>
                        )}
                      </div>
                      <div className="item-controls">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.basketId, -1)}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="qty-display">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.basketId, 1)}
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => removeFromBasket(item.basketId)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Summary */}
              <div className="summary">
                <div className="summary-row">
                  <span>Total items:</span>
                  <span>{totalItems}</span>
                </div>
                <div className="summary-row">
                  <span>Estimated weight:</span>
                  <span>{totalWeight}kg</span>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Action Button */}
        {basket.length > 0 && (
          <div className="action-section">
            <button className="primary-btn">
              Continue to booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;