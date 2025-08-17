#!/bin/bash
# Setup script for development environment

set -e

echo "🚀 Setting up ZoomingOnline development environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the app/ directory"
    exit 1
fi

echo "📦 Installing npm dependencies..."
npm ci

echo "🔍 Running initial code quality checks..."
echo "  - TypeScript type checking..."
npm run type-check

echo "  - Svelte checking..."
npm run check

echo "✅ Setup complete!"
echo ""
echo "Available commands:"
echo "  npm run dev          - Start development server"
echo "  npm run lint         - Run ESLint"
echo "  npm run lint:fix     - Fix ESLint issues automatically"
echo "  npm run format       - Format code with Prettier"
echo "  npm run format:check - Check if code is properly formatted"
echo "  npm run validate     - Run all quality checks"
echo ""
echo "Run 'npm run validate' to check code quality before committing."
echo "Happy coding! 🎉"