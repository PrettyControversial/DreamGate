# Dream State - Dream Journal Application

## Overview

Dream State is a personal dream journaling and analysis web application. Users can log their dreams, track emotions and themes, decode symbolic meanings, and view insights through features like moon phase tracking, tarot readings, sound healing, and annual "Wrapped" summaries. The application draws design inspiration from Notion, Spotify Wrapped, Headspace, and Calm to create a dreamlike yet functional experience.

**Note**: Birth Chart feature was removed due to accuracy issues.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state and data fetching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints under `/api/` prefix
- **Build Process**: Custom build script using esbuild for server bundling, Vite for client

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: Shared schema in `shared/schema.ts` for type safety across client/server
- **Validation**: Zod schemas generated from Drizzle schemas using drizzle-zod
- **Storage Interface**: Abstract `IStorage` interface in `server/storage.ts` allowing different implementations

### Project Structure
```
├── client/src/          # React frontend application
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page-level components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities and query client
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Data access layer
│   └── index.ts         # Server entry point
├── shared/              # Shared types and schemas
└── migrations/          # Database migrations
```

### Key Design Patterns
- **Monorepo Structure**: Client and server code co-located with shared types
- **Path Aliases**: `@/` for client sources, `@shared/` for shared modules
- **Theme System**: CSS variables for consistent theming with dark mode support
- **Component Architecture**: Compound components following Radix UI patterns

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured via `DATABASE_URL` environment variable)
- **Drizzle Kit**: Database migration and schema management tool

### UI Libraries
- **Radix UI**: Accessible, unstyled component primitives (dialog, dropdown, tabs, etc.)
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel/slider functionality
- **date-fns**: Date formatting and manipulation

### Development Tools
- **Vite**: Frontend dev server with HMR
- **tsx**: TypeScript execution for Node.js
- **Replit plugins**: Runtime error overlay, cartographer, dev banner (dev only)

### Session Management
- **express-session**: Server-side session handling
- **connect-pg-simple**: PostgreSQL session store (available in build allowlist)

## Recent Changes (January 2026)

### Schema Validation Improvements
- **insertDreamSchema**: Extended to make emotions, themes, and symbols optional with default empty arrays
- **updateDreamSchema**: Added new schema for PATCH request validation to prevent data corruption
- **PATCH route validation**: Now validates request body using updateDreamSchema before processing

### Data Test ID Coverage
- Added comprehensive data-testid attributes to all interactive elements and meaningful content across all pages for e2e testing support
- Key pages covered: Dashboard, DreamArchive, WritingPrompts, DreamDecoder, MoonTracker
- Components with testids: StatsCard, CelestialWidget, DreamCard, PromptCard, ZodiacBadge, MoonPhaseVisual

### New Features Added (January 2026)
- **Meditation Sound Healing** (`/meditation`): Web Audio API-powered ambient sounds (rain, ocean, wind, fire, birds), binaural beats (theta/delta/alpha waves), healing frequencies (528Hz, 432Hz), session timers (5-30 min), volume control with mute toggle
- **Tarot Reading** (`/tarot`): Full 22-card Major Arcana deck, three spread types (single card, past/present/future, dream insight), reversed card meanings, dream connection interpretations, animated card reveals
- **Moon Calendar Redesign** (`/calendar`): Improved visual design with zodiac element colors and gradients, enhanced day selection with detailed lunar info, MoonPhaseVisual component (no emojis), lunar guidance text for each phase

## iOS App Configuration (Capacitor)

The app is configured for iOS deployment using Capacitor. This wraps the web app in a native iOS container.

### Configuration
- **App ID**: com.dreamstate.app
- **App Name**: Dream State
- **Web Directory**: dist/public
- **Config File**: capacitor.config.ts

### Building for iOS (requires Mac with Xcode)
```bash
# 1. Build the web app
npm run build

# 2. Sync web assets to iOS project
npx cap sync ios

# 3. Open in Xcode
npx cap open ios

# 4. Build and run in Xcode (or submit to App Store)
```

### Requirements
- Mac with Xcode installed
- Apple Developer Account ($99/year) for App Store submission
- Code signing certificates and provisioning profiles configured in Xcode