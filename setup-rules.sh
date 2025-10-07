#!/bin/bash

# Libretto Project Rules Setup Script
# This script installs all necessary dependencies and configures the development environment

echo "🚀 Setting up Libretto project rules and development environment..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing development dependencies..."
npm install

# Install Husky for git hooks
echo "🔧 Setting up Husky for pre-commit hooks..."
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"

# Make the pre-commit hook executable
chmod +x .husky/pre-commit

# Run initial linting to check for issues
echo "🔍 Running initial linting check..."
npm run lint

# Format all code
echo "✨ Formatting code with Prettier..."
npm run format

echo ""
echo "✅ Setup complete! Your project now has:"
echo "   • ESLint configuration for code quality"
echo "   • Prettier for code formatting"
echo "   • Husky pre-commit hooks"
echo "   • TypeScript support"
echo "   • Jest testing setup"
echo "   • Comprehensive .gitignore"
echo "   • Editor configuration"
echo "   • Cursor AI rules"
echo ""
echo "🎯 Next steps:"
echo "   1. Run 'npm run lint' to check for any remaining issues"
echo "   2. Run 'npm run test' to run tests"
echo "   3. Read PROJECT_RULES.md for detailed guidelines"
echo "   4. Start coding with confidence! 🚀"
echo ""
echo "📚 Available scripts:"
echo "   • npm start          - Start Expo development server"
echo "   • npm run lint       - Run ESLint"
echo "   • npm run lint:fix   - Fix ESLint issues automatically"
echo "   • npm run format     - Format code with Prettier"
echo "   • npm run test       - Run tests"
echo "   • npm run clean      - Clean and reinstall dependencies"
