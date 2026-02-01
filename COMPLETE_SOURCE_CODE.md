# Complete Source Code - Quản Lý Xe (Fleet Management System)

## Project Structure

```
quanlyxe/
├── src/                          # Source code
│   ├── pages/                    # Page components (13 routes)
│   │   ├── Dashboard.tsx
│   │   ├── Vehicles.tsx         # Vehicle management (1264 lines)
│   │   ├── Drivers.tsx          # Driver management (1076 lines)
│   │   ├── Trips.tsx / TripsRevenue.tsx
│   │   ├── Customers.tsx
│   │   ├── Routes.tsx
│   │   ├── Dispatch.tsx
│   │   ├── Expenses.tsx
│   │   ├── Maintenance.tsx
│   │   ├── Reports.tsx
│   │   ├── Alerts.tsx
│   │   ├── Settings.tsx
│   │   ├── Auth.tsx
│   │   └── NotFound.tsx
│   ├── components/               # React components (60+)
│   │   ├── layout/              # App shell
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── shared/              # Reusable components
│   │   ├── dashboard/           # Dashboard components
│   │   ├── vehicles/            # Vehicle-specific
│   │   ├── drivers/             # Driver-specific
│   │   ├── dispatch/            # Dispatch timeline
│   │   ├── routes/              # Route components
│   │   ├── reports/             # Report components
│   │   └── trips/               # Trip components
│   ├── hooks/                    # Custom hooks (16)
│   │   ├── useVehicles.ts
│   │   ├── useDrivers.ts
│   │   ├── useCustomers.ts
│   │   ├── useTrips.ts
│   │   ├── useRoutes.ts
│   │   ├── useExpenses.ts
│   │   └── more...
│   ├── contexts/                 # Context providers
│   │   └── AuthContext.tsx       # Role-based auth
│   ├── lib/                      # Utilities
│   │   ├── export.ts            # CSV/Excel import-export
│   │   ├── formatters.ts        # Number/currency/date formatting
│   │   └── utils.ts             # Helper functions
│   ├── integrations/             # External services
│   │   └── supabase/            # Database client & types
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── public/                       # Static assets
│   ├── favicon.ico
│   ├── robots.txt
│   └── placeholder.svg
├── supabase/                     # Database migrations & setup
│   ├── migrations/
│   ├── config.toml
│   ├── seed_demo_p0_supabase.sql
│   └── check_trip_view.sql
├── package.json                  # Dependencies
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript config
└── tailwind.config.ts           # Tailwind CSS config
```

## Key Technologies

### Frontend Stack
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router v6** - Routing
- **React Query** - State management & data fetching
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **Lucide React** - Icons

### Backend & Database
- **Supabase** - PostgreSQL database + Auth
- **Supabase JS Client** - Database client

### Additional Libraries
- **XLSX** - Excel import/export
- **Recharts** - Charts & graphs
- **Date-fns** - Date utilities
- **Sonner** - Toast notifications
- **Leaflet** - Maps
- **ag-grid** - Advanced tables

## Main Entry Points

### main.tsx
```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

### App.tsx
Main application with routing, providers, and auth:
- QueryClientProvider (React Query)
- AuthProvider (Role-based authentication)
- TooltipProvider
- BrowserRouter with 13 routes
- Protected routes using ProtectedRoute component

## Core Components

### Authentication (AuthContext.tsx)
- Role-based access control (admin, manager, dispatcher, accountant, driver, viewer)
- Session management
- User role caching in localStorage
- Auth state subscription

### Pages Overview

#### Dashboard (Dashboard.tsx)
- Overview tab with key metrics
- Revenue analytics
- Expense breakdown
- Trip statistics
- Fleet performance
- System alerts

#### Vehicles (Vehicles.tsx)
- Full CRUD operations
- Excel import/export
- 19 vehicle fields:
  - Basic info: code, license plate, type, brand
  - Capacity & fuel type
  - Insurance dates & costs
  - Registration dates & costs
  - Current location tracking
  - Status & notes
- Map view with GPS tracking
- Column visibility customization
- Excel-style filtering

#### Drivers (Drivers.tsx)
- Driver management
- License tracking
- Salary management
- Vehicle assignment
- Tax code & ID tracking
- Import/export
- Bulk delete

#### Trips / Revenue (TripsRevenue.tsx)
- Trip creation & management
- Revenue tracking
- Cost allocation
- Workflow status (pending, confirmed, completed)
- Audit logging

#### Customers (Customers.tsx)
- Customer database
- Contact information
- Payment terms
- Address management

#### Routes (Routes.tsx)
- Route planning
- Distance calculation
- Stop management
- Route templates

#### Dispatch (Dispatch.tsx)
- Day view timeline
- Trip scheduling
- Real-time dispatch
- Driver assignment

#### Expenses (Expenses.tsx)
- Expense tracking
- Cost categorization
- Allocation to trips
- Approval workflow

#### Maintenance (Maintenance.tsx)
- Maintenance orders
- Service scheduling
- Cost tracking
- Vehicle downtime

#### Reports (Reports.tsx)
- Driver performance
- Vehicle performance
- Fleet analytics
- Revenue reports
- Expense analysis

#### Settings (Settings.tsx)
- Company settings
- User management
- Security settings
- Data export/backup
- Notification settings

## Custom Hooks

### Data Hooks
- **useVehicles()** - Vehicle CRUD
- **useDrivers()** - Driver CRUD
- **useCustomers()** - Customer CRUD
- **useTrips()** - Trip CRUD
- **useRoutes()** - Route CRUD
- **useExpenses()** - Expense CRUD
- **useMaintenance()** - Maintenance CRUD
- **useReportData()** - Report generation
- **useDashboard()** - Dashboard metrics

### UI & Utility Hooks
- **useAuth()** - Authentication state
- **useBulkDelete()** - Bulk delete operations
- **useTripWorkflow()** - Trip workflow state
- **useAccountingPeriods()** - Period management
- **useCompanySettings()** - Company configuration
- **useSecuritySettings()** - Security options
- **useNotificationSettings()** - Notifications
- **useDataManagement()** - Data export/import
- **useToast()** - Toast notifications

## Shared Components

### DataTable
Generic data table component with:
- Sorting
- Filtering
- Pagination
- Selection
- Column visibility
- Export functionality

### BulkDelete
- Bulk deletion with confirmation
- Selection management
- Progress feedback

### ExcelImportDialog
- File upload
- Column mapping
- Validation
- Sample template generation

### StatusBadge
Status indicators for:
- Vehicles (active, maintenance, inactive)
- Drivers (active, on_leave, inactive)
- Trips (pending, confirmed, completed)
- Expenses (draft, pending, approved)

## Styling & Theme

### Tailwind CSS
- Custom colors
- Responsive design
- Dark mode support

### shadcn/ui Components
- Button, Card, Dialog, Form
- Input, Select, Textarea
- Table, Tabs, Toast
- Calendar, DatePicker
- Alert, Badge, Skeleton
- And 30+ more UI components

## Database Schema (Supabase)

Key tables:
- users
- vehicles
- drivers
- customers
- routes
- trips
- expenses
- maintenance_orders
- user_roles (for RBAC)

## Formatters (lib/formatters.ts)

Vietnamese locale formatters:
- formatCurrency() - Currency formatting (VND)
- formatNumber() - Number formatting
- formatDate() - Date formatting
- formatDateTime() - DateTime formatting
- formatPercent() - Percentage formatting
- formatKm() - Distance formatting
- formatTons() - Weight formatting

## Export Functions (lib/export.ts)

- exportToCSV() - Export data to Excel
- importFromFile() - Import from Excel with validation

## Build & Development

### package.json Scripts
- `npm run dev` - Development server (port 8080)
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - ESLint check
- `npm run test` - Run tests
- `npm run test:watch` - Watch test mode

### Environment Variables
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

## Deployment
- Vite build output to `/dist`
- Deploy to Vercel, Netlify, or any static hosting
- Supabase handles backend

---

## Summary Statistics
- **Total Files**: 214
- **Pages**: 13
- **Components**: 60+
- **Custom Hooks**: 16+
- **UI Components**: 30+
- **Utilities**: 5+
- **Lines of Code**: 10,000+
- **Languages**: TypeScript, TSX, CSS
- **Database**: PostgreSQL (Supabase)

This is a production-ready fleet management SaaS application with comprehensive features for vehicle tracking, driver management, trip planning, expense tracking, and reporting.
