# Unit Tests

This directory contains unit tests for all modules in the vonsteinkirch.com project.

## Running Tests

```bash
# Install dependencies first
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

- `core/` - Tests for core modules (window-manager, panel, music-player, kamikaze)
- `applications/` - Tests for application modules (todo, diary, email, b-bot, etc.)
- `utils/` - Test utilities and helpers

## Test Coverage

All JavaScript modules have comprehensive unit tests covering:
- Initialization
- Core functionality
- Edge cases
- Error handling
- DOM interactions
