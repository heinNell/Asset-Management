# Copilot Coding Agent Instructions for Asset-Management

## Project Overview

This is a TypeScript/React/Expo monorepo for asset and vehicle management. The codebase is organized into logical domains for vehicles, inspections, drivers, assignments, and service records. Data models are defined as TypeScript interfaces in `src/entities/`.

## Architecture & Data Flow

- **Entities:** All core data models (Vehicle, DriverProfile, ServiceRecord, VehicleInspection, etc.) are defined in `src/entities/` as TypeScript interfaces. These replace legacy JSON schema files.
- **Services:** Business logic and Firestore integration are implemented in `src/services/` (e.g., `InspectionService.ts`, `VehicleService.ts`). Services use Firebase Firestore for CRUD operations and data queries.
- **Pages & Components:** UI logic is split between `src/pages/` (feature screens) and `src/components/` (reusable UI elements). Expo Router is used for navigation.
- **Contexts:** React Contexts in `contexts/` provide global state for authentication and vehicle data.

## Developer Workflows

- **Build/Run:** Use Expo CLI scripts in `package.json` (e.g., `npm run dev`, `npm run build`, `npm run start:web`).
- **Type Safety:** All new code should use strict TypeScript types. Interfaces in `src/entities/` are the source of truth for data shapes.
- **Firestore:** All persistent data is stored in Firebase Firestore. Use the provided service files for all Firestore access.
- **Testing:** (No explicit test files found; add details if/when tests are present.)

## Project-Specific Patterns

- **Model Conversion:** Legacy JSON schemas are being replaced by TypeScript interfaces. Always update interfaces in `src/entities/` when changing data shapes.
- **Service Layer:** All business logic and Firestore access should go through service files in `src/services/`. Avoid direct Firestore calls in UI components.
- **Context Usage:** Use React Contexts for global state (auth, vehicles). Avoid prop drilling for these domains.
- **Routing:** Use Expo Router for navigation. Route-based code splitting is recommended for performance.

## Integration Points

- **Firebase:** All authentication and data storage is via Firebase. Config is in `lib/firebase.ts` and `src/config/firebase.ts`.
- **Expo:** Project uses Expo for mobile/web builds. See scripts in `package.json`.
- **Third-Party Libraries:** Includes `lucide-react` for icons, `react-router-dom` for web routing, and various Expo modules for device features.

## Examples

- To add a new entity, create a TypeScript interface in `src/entities/` and update relevant service files in `src/services/`.
- To fetch vehicle inspections, use `getVehicleInspections` in `InspectionService.ts`.
- To update vehicle status, use the appropriate method in `VehicleService.ts`.

## Conventions

- Prefer named exports for all modules.
- Use strict TypeScript options (`strict: true` in `tsconfig.json`).
- Remove dead code and unused imports regularly.
- Document new service methods with JSDoc comments.

---

I'll help define clear principles and structure for this TypeScript/React/Expo project, ensuring type safety and best practices.

# Asset Management System - Architecture Principles

## 1. Type Safety Principles

### 1.1 Base Entity Types
```typescript
// src/entities/types/base.ts
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditableEntity extends BaseEntity {
  createdBy: string;
  updatedBy: string;
}
```

### 1.2 Domain Entities
```typescript
// src/entities/Vehicle.ts
import { AuditableEntity } from './types/base';

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED'
}

export interface Vehicle extends AuditableEntity {
  make: string;
  model: string;
  year: number;
  status: VehicleStatus;
  lastInspectionDate?: Date;
}
```

## 2. Service Layer Pattern

### 2.1 Base Service
```typescript
// src/services/base/BaseService.ts
import { BaseEntity } from '@/entities/types/base';
import { FirebaseError } from 'firebase/app';
import { CollectionReference, DocumentData } from 'firebase/firestore';

export abstract class BaseService<T extends BaseEntity> {
  protected abstract collection: CollectionReference<DocumentData>;

  protected handleError(error: unknown): never {
    if (error instanceof FirebaseError) {
      throw new ApplicationError(error.message, error.code, 500);
    }
    throw error;
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      // Implementation
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

### 2.2 Specific Services
```typescript
// src/services/VehicleService.ts
import { Vehicle } from '@/entities/Vehicle';

export class VehicleService extends BaseService<Vehicle> {
  protected collection = this.db.collection('vehicles');

  async getActiveVehicles(): Promise<Vehicle[]> {
    try {
      // Implementation with type safety
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

## 3. Context Management

### 3.1 Type-Safe Context Creation
```typescript
// src/contexts/createTypedContext.ts
export function createTypedContext<T>() {
  const Context = createContext<T | undefined>(undefined);

  function useTypedContext() {
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error('useTypedContext must be used within its provider');
    }
    return context;
  }

  return [Context.Provider, useTypedContext] as const;
}
```

### 3.2 Application Contexts
```typescript
// src/contexts/VehicleContext.tsx
interface VehicleContextState {
  vehicles: Vehicle[];
  loading: boolean;
  error: Error | null;
  refreshVehicles: () => Promise<void>;
}

const [VehicleProvider, useVehicles] = createTypedContext<VehicleContextState>();
```

## 4. Error Handling

```typescript
// src/types/errors.ts
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}
```

## 5. Component Structure

### 5.1 Component Props Pattern
```typescript
// src/components/Vehicle/VehicleList.tsx
interface VehicleListProps {
  vehicles: Vehicle[];
  onVehicleSelect: (vehicleId: string) => void;
  isLoading?: boolean;
}

export const VehicleList: React.FC<VehicleListProps> = ({
  vehicles,
  onVehicleSelect,
  isLoading = false
}) => {
  // Implementation
};
```

## 6. Type-Safe API Integration

```typescript
// src/api/types.ts
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  totalPages: number;
  hasMore: boolean;
}
```

## 7. Configuration Management

```typescript
// src/config/types.ts
export interface AppConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
}

// src/config/index.ts
export const config: AppConfig = {
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY!,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.FIREBASE_PROJECT_ID!
  },
  api: {
    baseUrl: process.env.API_BASE_URL ?? 'http://localhost:3000',
    timeout: 5000
  }
};
```

## 8. Utility Types

```typescript
// src/types/utility.ts
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<Result<T>>;

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Key Principles to Follow:

1. **Type Safety First**
   - Always define explicit types for data structures
   - Use TypeScript's strict mode
   - Avoid using `any` type

2. **Single Responsibility**
   - Each service should handle one domain
   - Components should be focused on specific UI responsibilities
   - Separate business logic from UI components

3. **Error Handling**
   - Use typed error classes
   - Handle errors at appropriate levels
   - Provide meaningful error messages

4. **State Management**
   - Use contexts for global state
   - Keep component state local when possible
   - Implement proper loading and error states

5. **Code Organization**
   - Follow the defined folder structure
   - Use barrel exports for cleaner imports
   - Keep related code together

6. **Testing**
   - Write unit tests for services
   - Test components in isolation
   - Use TypeScript-aware testing utilities

These principles ensure type safety, maintainability, and scalability of the application. Would you like me to elaborate on any specific aspect?