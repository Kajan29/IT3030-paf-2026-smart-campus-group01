# Zentaritas Frontend

React-based frontend application for Zentaritas.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   └── common/       # Common components (Header, Footer, etc.)
├── context/          # React Context providers
├── hooks/            # Custom React hooks
├── layouts/          # Page layouts
├── pages/            # Page components
├── services/         # API services
└── utils/            # Utility functions and constants
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
