#!/bin/bash

# AI Enhanced Moving Inventory - Setup Script
echo "🚀 Setting up AI Enhanced Moving Inventory..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your OpenAI API key"
else
    echo "✅ .env file already exists"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your OpenAI API key:"
echo "   OPENAI_API_KEY=your_api_key_here"
echo ""
echo "2. Start the development servers:"
echo "   npm run dev          (backend)"
echo "   cd frontend && npm run dev  (frontend)"
echo ""
echo "3. Or start with Docker:"
echo "   docker-compose up"
echo ""
echo "📚 Read README.md for more information"