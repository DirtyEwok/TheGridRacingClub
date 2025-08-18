# The Grid Racing Club Management System

## Overview

This is a full-stack web application for managing The Grid Racing Club, built with React, TypeScript, and Express. The system allows members to register for racing events, view race schedules, and manage their participation in upcoming races. The application features a modern, racing-themed UI with a black background design optimized for gaming communities.

## User Preferences

Preferred communication style: Simple, everyday language.
Background color: Pure black for racing theme.
Registration status color: Orange instead of green.
Admin access: User requires exclusive control over race management and calendar editing.
Member access: Members should only access /races link without admin functionality visible.
Layout: Removed calendar to show 9 races in 3x3 grid layout for better space utilization.

## System Architecture

### Frontend Architecture

**React SPA with TypeScript**: The client is built as a single-page application using React 18 with TypeScript for type safety. The application uses a component-based architecture with reusable UI components.

**Styling System**: The application uses Tailwind CSS for utility-first styling combined with shadcn/ui components for consistent, accessible UI elements. Custom CSS variables define a racing-themed color palette with pure black backgrounds and racing green accents.

**State Management**: Uses TanStack Query (React Query) for server state management, providing caching, background updates, and optimistic updates for race registrations. Local component state is managed with React hooks.

**Routing**: Implements client-side routing with Wouter, a lightweight routing library. The application structure includes Dashboard, Races, Championships, and Admin pages. Member-specific routes (/races, /championships) use MemberHeader without admin access, while admin routes use the full Header with admin navigation.

**Form Handling**: React Hook Form with Zod validation provides type-safe form management for race registration and member creation.

### Backend Architecture

**Express.js Server**: RESTful API server built with Express.js and TypeScript. The server handles race management, member registration, and race participation tracking.

**Route Structure**: Clean separation of concerns with dedicated route handlers for races, members, and registrations. All API endpoints are prefixed with `/api/`. Admin-only endpoints for race CRUD operations are protected with authorization headers.

**Data Storage**: Currently uses an in-memory storage implementation for development, with a well-defined interface that can be easily swapped for database persistence. PostgreSQL database is configured and ready for production use.

**Error Handling**: Centralized error handling middleware provides consistent error responses and logging.

### Data Models

**Members**: User profiles with display name, Xbox gamertag, experience level (Beginner, Intermediate, Advanced, Professional), and admin status for race management permissions.

**Championships**: Seasonal racing competitions with multiple races, including details like season name, description, start/end dates, participant limits, and championship-specific rules.

**Races**: Racing events with details like track, car class, date/time, participant limits, registration deadlines, and optional championship association with round numbers and points structure.

**Registrations**: Junction table linking members to races with registration timestamps.

**Extended Data**: Races are enhanced with calculated statistics including registration counts, time until deadline, user registration status, and championship names. Championships include race counts and total registrations.

### Development Architecture

**Monorepo Structure**: Single repository with clear separation between client, server, and shared code. Shared schema definitions ensure type consistency across the stack.

**Build System**: Vite for frontend development and building, with ESBuild for server bundling. Development mode includes HMR and error overlays.

**TypeScript Configuration**: Strict TypeScript settings with path mapping for clean imports. Shared types between client and server prevent API contract mismatches.

## External Dependencies

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Radix UI**: Accessible, unstyled UI primitives for building the component system
- **shadcn/ui**: Pre-built component library built on Radix UI with consistent styling
- **Lucide React**: Icon library providing consistent iconography

### State Management and Data Fetching
- **TanStack Query**: Server state management with caching, background sync, and optimistic updates
- **React Hook Form**: Performant forms with easy validation
- **Zod**: Schema validation for type-safe data handling

### Database and ORM
- **Drizzle ORM**: Type-safe database ORM configured for PostgreSQL
- **Neon Database**: Serverless PostgreSQL database service (configured but not yet implemented)

### Development Tools
- **Vite**: Fast build tool and development server with HMR
- **TypeScript**: Static type checking across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional CSS class composition
- **nanoid**: Unique ID generation for entities

The application is designed to be easily deployable and scalable, with clear separation between development and production configurations. The database layer is abstracted to allow easy migration from in-memory storage to PostgreSQL when needed.