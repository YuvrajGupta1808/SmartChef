# Smart Chef - AI Recipe Generator

A full-stack AI-powered recipe generation application that creates budget-friendly and luxury recipes with real ingredient prices, powered by a multi-agent system.

## Features

- **Budget Recipes**: Affordable recipes under $15-20 with real price estimates
- **Luxury Recipes**: Premium restaurant-quality recipes ($40-80+) with wine pairings
- **Real-time Pricing**: Web search for current ingredient prices in your location
- **AI-Generated Images**: Recipe images generated via Gemini API
- **IndexedDB Image Storage**: Efficient storage for large base64 images
- **Beautiful UI**: Modern React frontend with Tailwind CSS and shadcn/ui

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  - Recipe request UI                                            │
│  - Generated recipe cards with images                           │
│  - IndexedDB for image storage                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Express/Node)                     │
│  - REST API endpoints                                           │
│  - OpenAgents client integration                                │
│  - Gemini image generation                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   OpenAgents Multi-Agent System                 │
│  ┌─────────┐    ┌──────────────┐    ┌─────────────┐            │
│  │ Router  │───▶│ Web-Searcher │───▶│ Budget-Chef │            │
│  │         │    │              │    │ Luxury-Chef │            │
│  └─────────┘    └──────────────┘    └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
├── frontend/          # React + Vite + TypeScript frontend
├── backend/           # Express.js API server
├── openagents/chef/   # Multi-agent recipe system
│   ├── agents/        # Agent configurations (router, chefs)
│   ├── tools/         # Custom tools (web search)
│   └── network.yaml   # Network configuration
├── requirements.txt   # Python dependencies
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- OpenAgents CLI (`pip install openagents`)

### 1. Install Dependencies

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install

# Python (for OpenAgents)
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` files:

**backend/.env**
```env
PORT=3001
OPENAGENTS_URL=http://localhost:8700
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Start OpenAgents Network

```bash
cd openagents/chef

# Start the network
openagents network start --config network.yaml

# In separate terminals, start agents:
openagents agent start --config agents/router.yaml
openagents agent start --config agents/web-searcher.yaml
openagents agent start --config agents/budget-chef.yaml
openagents agent start --config agents/luxury-chef.yaml
```

### 4. Start the Application

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Visit `http://localhost:5173` to use the app.

## Agent Workflow

1. **User Request**: User enters a dish name and selects budget/luxury
2. **Router**: Coordinates the workflow, delegates tasks
3. **Web-Searcher**: Searches for real ingredient prices in user's location
4. **Chef Agent**: Creates formatted recipe with prices
   - Budget-Chef: Affordable recipes with cost-saving tips
   - Luxury-Chef: Premium recipes with wine pairings
5. **Response**: Complete recipe returned to frontend with generated images

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Framer Motion
- React Query
- IndexedDB for image storage

**Backend**
- Express.js + TypeScript
- Strands Agents SDK
- Gemini API (image generation)

**Agents**
- OpenAgents framework
- Multi-agent collaboration
- Custom web search tools

## License

MIT
