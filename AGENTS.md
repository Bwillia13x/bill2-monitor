# Digital Strike - AI Agent Guide

## Project Overview

Digital Strike is a React/TypeScript web application for educational advocacy in Alberta, Canada. The platform enables teachers to anonymously share their experiences and builds community engagement through storytelling, referrals, and viral sharing mechanisms.

**Project URL**: https://lovable.dev/projects/9c8b3841-c7f5-43e3-b8d7-f8d5bb9121fb

## Technology Stack

- **Frontend Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.19 with SWC for fast compilation
- **Styling**: Tailwind CSS 3.4.17 with custom design system
- **UI Components**: shadcn/ui with Radix UI primitives
- **Backend/Auth**: Supabase 2.78.0 for authentication and data storage
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router DOM 6.30.1
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion, custom CSS animations
- **Development**: Lovable.dev platform integration

## Project Structure

```
src/
├── pages/                    # Route components
│   ├── Index.tsx            # V3 landing page (primary)
│   ├── V2Index.tsx          # V2 comprehensive dashboard
│   ├── Auth.tsx             # Authentication page
│   ├── Voices.tsx           # Teacher testimonials
│   ├── StoryWall.tsx        # Story collection
│   ├── SignStudio.tsx       # Sign/sticker creation
│   ├── Press.tsx            # Press coverage
│   ├── Pulse.tsx            # Daily sentiment tracking
│   └── Engage.tsx           # V2 engagement hub
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── metrics/             # Data visualization components
│   ├── voices/              # Testimonial components
│   ├── storywall/           # Story wall components
│   ├── viral/               # Viral sharing components
│   └── v3/                  # V3 specific components
├── contexts/
│   └── AuthContext.tsx      # Authentication context
├── integrations/
│   └── supabase/            # Supabase client and types
├── hooks/                   # Custom React hooks
├── lib/                     # Utility functions
└── assets/                  # Static assets
```

## Key Architecture Decisions

### Version Strategy
- **V2 (Legacy)**: Comprehensive engagement platform at `/v2`
- **V3 (Current)**: Streamlined viral landing page at `/`
- Both versions coexist with shared authentication and data layer

### Authentication
- Supabase authentication with persistent sessions
- Anonymous participation allowed for core features
- Protected routes for administrative functions

### Data Privacy
- Privacy threshold enforcement (n≥20) for data display
- Anonymized testimonials and stories
- Geographic aggregation for sensitive data

## Development Commands

```bash
# Install dependencies
npm install

# Development server (port 8080)
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Configuration Files

### Core Configuration
- **vite.config.ts**: Vite configuration with React SWC plugin, path aliases
- **tsconfig.json**: TypeScript configuration with strict mode disabled for flexibility
- **tailwind.config.ts**: Comprehensive design system with custom colors, animations
- **components.json**: shadcn/ui configuration
- **eslint.config.js**: ESLint configuration with TypeScript and React rules

### Environment Variables
```env
VITE_SUPABASE_URL="https://hshddfrqpyjenatftqpv.supabase.co"
VITE_SUPABASE_PROJECT_ID="hshddfrqpyjenatftqpv"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Design System

### Color Palette (HSL)
- **Background**: 217 33% 2% (dark theme)
- **Foreground**: 210 40% 98% (light text)
- **Primary**: 160 84% 39% (teal green)
- **Warning**: Amber variations
- **Success**: Green variations

### Typography
- **Sans**: Inter, system-ui, sans-serif
- **Display**: Playfair Display, Georgia, serif

### Custom Animations
- `accordion-down/up`: Smooth expansion/collapse
- `spin-slow`: 10s rotation for loading states
- `breathe`: Scale and opacity pulsing
- `glow-pulse`: Blur and opacity effects
- `needle-enter`: Gauge needle animation
- `shimmer`: Background position animation

## Key Features by Version

### V2 Features (Comprehensive)
- StoryCarousel: Rotating anonymized testimonials
- ReferralDashboard: Network tracking and leaderboards
- BadgeSystem: 12 achievement badges with progress tracking
- DailyPulse: Community sentiment tracking
- ProvinceHeatmap: Interactive Alberta map
- ShareableGenerator: Social media graphics creation
- Engage Page: Centralized hub with 11 tabs

### V3 Features (Viral)
- Ultra-simple landing page with two-tile hero
- Single-slider submission (0-100 scale)
- Instant confetti animation on submission
- Automatic share modal with generated social cards
- Dark theme with neon accents
- WCAG 2.2 AA accessibility compliance

## Testing Strategy

Currently no automated tests are implemented. Testing is manual through:
- Development server with hot reload
- Preview builds for production testing
- Lovable.dev platform for visual testing

## Deployment

### Lovable.dev Platform
- Primary deployment through Lovable.dev
- Automatic commits to GitHub repository
- Custom domain support available
- Share → Publish workflow

### Manual Deployment
- Build artifacts in `dist/` directory
- Static hosting compatible
- Environment variables required for Supabase integration

## Security Considerations

### Authentication
- Supabase handles user authentication securely
- Session persistence with automatic token refresh
- Protected routes for sensitive operations

### Data Privacy
- Privacy thresholds prevent individual identification
- Anonymous data collection for testimonials
- Geographic data aggregation

### Environment Variables
- Never commit `.env` file with real credentials
- Use environment-specific configurations
- Rotate API keys regularly

## Code Style Guidelines

### TypeScript
- Flexible typing enabled (strict mode disabled)
- Path aliases using `@/` for src directory
- Component props interfaces defined inline

### React Components
- Functional components with hooks
- Context providers for global state
- React Query for server state management

### Styling
- Tailwind CSS utility classes
- CSS custom properties for theming
- Responsive design mobile-first

### Naming Conventions
- Components: PascalCase (e.g., `StoryCarousel`)
- Functions/hooks: camelCase (e.g., `useAuth`)
- Constants: UPPER_SNAKE_CASE
- Files: PascalCase for components, camelCase for utilities

## Common Patterns

### Data Fetching
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
```

### Authentication
```typescript
import { useAuth } from '@/contexts/AuthContext';
const { user, session, signOut } = useAuth();
```

### UI Components
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
```

## Known Issues & Considerations

1. **No Automated Testing**: Project lacks unit/integration tests
2. **TypeScript Strict Mode Disabled**: Allows for more flexible but less safe code
3. **Large Bundle Size**: Many UI component dependencies
4. **Development Dependencies**: Includes Lovable.dev specific packages
5. **Environment Dependency**: Requires Supabase for full functionality

## Development Workflow

1. **Local Development**: Clone repository, install dependencies, run `npm run dev`
2. **Lovable Integration**: Changes can be made through Lovable.dev interface
3. **Git Workflow**: Automatic commits from Lovable, manual commits from local development
4. **Deployment**: Through Lovable.dev platform or manual static hosting

This project represents a sophisticated civic engagement platform with both comprehensive and viral design approaches, built with modern React ecosystem tools and designed for scalability and user privacy.