# Xbox Racing Club Management System

## Overview

This is a full-stack web application for managing an Xbox racing club, built with React, TypeScript, and Express. The system allows members to register for racing events, view race schedules, and manage their participation in upcoming races. The application features a modern, racing-themed UI with a dark design optimized for gaming communities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**React SPA with TypeScript**: The client is built as a single-page application using React 18 with TypeScript for type safety. The application uses a component-based architecture with reusable UI components.

**Styling System**: The application uses Tailwind CSS for utility-first styling combined with shadcn/ui components for consistent, accessible UI elements. Custom CSS variables define a racing-themed color palette with dark backgrounds and racing green accents.

**State Management**: Uses TanStack Query (React Query) for server state management, providing caching, background updates, and optimistic updates for race registrations. Local component state is managed with React hooks.

**Routing**: Implements client-side routing with Wouter, a lightweight routing library. The application has a simple structure with Dashboard and Races pages.

**Form Handling**: React Hook Form with Zod validation provides type-safe form management for race registration and member creation.

### Backend Architecture

**Express.js Server**: RESTful API server built with Express.js and TypeScript. The server handles race management, member registration, and race participation tracking.

**Route Structure**: Clean separation of concerns with dedicated route handlers for races, members, and registrations. All API endpoints are prefixed with `/api/`.

**Data Storage**: Currently uses an in-memory storage implementation for development, with a well-defined interface that can be easily swapped for database persistence.

**Error Handling**: Centralized error handling middleware provides consistent error responses and logging.

### Data Models

**Members**: User profiles with display name, Xbox gamertag, and experience level (Beginner, Intermediate, Advanced, Professional).

**Races**: Racing events with details like track, car class, date/time, participant limits, and registration deadlines.

**Registrations**: Junction table linking members to races with registration timestamps.

**Extended Race Data**: Races are enhanced with calculated statistics including registration counts, time until deadline, and user registration status.

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