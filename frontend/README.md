# Smart Chef Frontend

React-based frontend for the Smart Chef AI recipe generator.

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui (styling)
- Framer Motion (animations)
- React Query (data fetching)
- IndexedDB (image storage)

## Features

- Recipe request form with dish name and location
- Budget/Luxury recipe type selection
- Beautiful recipe cards with parsed markdown
- Ingredient checklist with price tracking
- Adjustable serving sizes with auto-calculated costs
- AI-generated recipe images
- Efficient IndexedDB storage for large base64 images

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/        # UI components
│   ├── ui/           # shadcn/ui components
│   ├── GeneratedRecipeCard.tsx
│   └── HeroSection.tsx
├── lib/
│   ├── api.ts        # Backend API client
│   └── imageStorage.ts  # IndexedDB image storage
├── pages/            # Page components
├── types/            # TypeScript types
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## Image Storage

Large base64 images are stored in IndexedDB to avoid localStorage limits:

```typescript
import { saveImage, getImage } from '@/lib/imageStorage';

// Save image
await saveImage('recipe-123-img-0', base64Data);

// Retrieve image
const imageData = await getImage('recipe-123-img-0');
```

## Environment

The frontend connects to the backend API at `http://localhost:3001` by default.
