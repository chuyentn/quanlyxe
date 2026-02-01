# Full Source Code - Quản Lý Xe (Fleet Management System)

## Complete Source Code Files & Architecture

---

## 1. ENTRY POINT & MAIN APP

### src/main.tsx
```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

### src/App.tsx
```typescript
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "@/pages/Auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Import all pages
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import RoutesPage from "./pages/Routes";
import Customers from "./pages/Customers";
import Trips from "./pages/Trips";
import Dispatch from "./pages/Dispatch";
import Expenses from "./pages/Expenses";
import Maintenance from "./pages/Maintenance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Alerts from "./pages/Alerts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Outlet />
                  </AppLayout>
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/dispatch" element={<Dispatch />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
```

---

## 2. AUTHENTICATION & CONTEXT

### src/contexts/AuthContext.tsx
```typescript
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type UserRole = 'admin' | 'manager' | 'dispatcher' | 'accountant' | 'driver' | 'viewer';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    role: UserRole;
    signOut: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: 'viewer',
    signOut: async () => { },
    loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(() => {
        const savedRole = localStorage.getItem('user_role');
        return (savedRole as UserRole) || 'viewer';
    });
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchUserRole = async (userId: string): Promise<UserRole> => {
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', userId)
                .single();

            if (error || !data) return 'viewer';
            return data.role as UserRole;
        } catch (error) {
            console.error("Error fetching role:", error);
            return 'viewer';
        }
    };

    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted && session) {
                    setSession(session);
                    setUser(session.user);
                    const userRole = await fetchUserRole(session.user.id);
                    setRole(userRole);
                    localStorage.setItem('user_role', userRole);
                }
            } catch (error) {
                console.error("Auth init error:", error);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    const userRole = await fetchUserRole(session.user.id);
                    setRole(userRole);
                    localStorage.setItem('user_role', userRole);
                } else {
                    setRole('viewer');
                    localStorage.removeItem('user_role');
                }
                setLoading(false);
            }
        });

        const timer = setTimeout(() => {
            if (mounted) setLoading(false);
        }, 3000);

        return () => {
            mounted = false;
            clearTimeout(timer);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        const previousRole = role;
        setRole('viewer');
        setSession(null);
        setUser(null);
        localStorage.removeItem('user_role');

        try {
            await supabase.auth.signOut();
            toast({
                title: "Đăng xuất thành công",
                description: "Hẹn gặp lại bạn!",
            });
        } catch (error) {
            console.error("Logout error details:", error);
            if (previousRole !== 'viewer') {
                window.location.reload();
            }
        }
    };

    return (
        <AuthContext.Provider value={{ session, user, role, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
```

### src/components/auth/ProtectedRoute.tsx
```typescript
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { session, loading } = useAuth();
    const isDemoMode = import.meta.env.MODE === 'development' && !session && !loading;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Đang kiểm tra xác thực...</p>
                </div>
            </div>
        );
    }

    if (!session && !isDemoMode) {
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};
```

---

## 3. LAYOUT COMPONENTS

### src/components/layout/AppLayout.tsx
```typescript
import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### src/components/layout/AppSidebar.tsx (175 lines)
Key features:
- Navigation menu with 12 main routes
- Role-based access control (RBAC)
- Lock icons for restricted features
- Collapsible sidebar
- Active route highlighting

**Routes with role access:**
- Dashboard: all users
- Vehicles, Drivers, Routes, Customers: admin, manager, dispatcher
- Trips, Expenses: admin, manager, dispatcher, accountant
- Dispatch: admin, manager, dispatcher
- Maintenance: admin, manager only
- Reports: admin, manager, accountant
- Alerts: admin, manager, dispatcher
- Settings: admin only

---

## 4. PAGES (13 Routes)

### src/pages/Auth.tsx (199 lines)
- Email/Password authentication
- Login & Registration tabs
- Supabase Auth integration
- Vietnamese UI

### src/pages/Dashboard.tsx
- 6 tabs: Overview, Revenue, Expenses, Trips, Fleet, Alerts
- Date range filter (Today, 7 days, This month)
- Key metrics display
- Charts & statistics

### src/pages/Vehicles.tsx (1264 lines)
**Features:**
- Full CRUD operations
- 19 vehicle fields
- Excel import/export
- Map view with GPS
- Column visibility control
- Excel-style filtering
- Bulk delete
- Vehicle status tracking

**Fields:**
- Basic: code, license plate, type, brand
- Capacity & fuel
- Insurance (dates & costs)
- Registration (dates & costs)
- Location & status
- Notes

### src/pages/Drivers.tsx (1076 lines)
**Features:**
- Driver management
- License tracking
- Salary management
- Vehicle assignment
- Import/export
- 16+ fields including tax code, ID card, address

### src/pages/Trips.tsx / TripsRevenue.tsx
**Features:**
- Trip creation & management
- Revenue tracking
- Cost allocation
- Workflow status
- Audit logging
- Financial calculations

### src/pages/Customers.tsx (948 lines)
**Features:**
- Customer database
- Contact management
- Credit limit tracking
- Debt monitoring
- Customer types (Business/Individual)
- Import/export

### src/pages/Routes.tsx
- Route planning
- Distance calculation
- Stop management
- Route templates

### src/pages/Dispatch.tsx
- Day view timeline
- Trip scheduling
- Real-time dispatch
- Driver assignment

### src/pages/Expenses.tsx
- Expense tracking
- Cost categorization
- Allocation to trips
- Approval workflow

### src/pages/Maintenance.tsx
- Maintenance orders
- Service scheduling
- Cost tracking
- Vehicle downtime

### src/pages/Reports.tsx
- Driver performance reports
- Vehicle analytics
- Fleet statistics
- Revenue analysis

### src/pages/Settings.tsx (494 lines)
**Tabs:**
- Company settings (name, tax code, address, contact)
- User management (add, delete, role assignment)
- Security settings (2FA, auto-logout)
- Data management (export, backup)

### src/pages/Alerts.tsx
- System alerts
- Vehicle/maintenance notifications
- Expiry warnings

---

## 5. CUSTOM HOOKS (16+ hooks)

### src/hooks/useVehicles.ts (252 lines)
```typescript
export const useVehicles = () => {
    return useQuery({
        queryKey: ['vehicles'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as Vehicle[];
        },
    });
};

export const useCreateVehicle = () => { /* ... */ };
export const useUpdateVehicle = () => { /* ... */ };
export const useDeleteVehicle = () => {
    // Soft delete strategy with unique field renaming
    // Appends timestamp suffix to prevent constraint violations
};
```

### src/hooks/useTrips.ts (719 lines)
```typescript
export type TripStatus = 'draft' | 'confirmed' | 'dispatched' | 'in_progress' | 'completed' | 'closed' | 'cancelled';

export const useTrips = () => {
    return useQuery({
        queryKey: ['trips'],
        queryFn: async () => {
            // Fetch with relationships
            // Return financial data from view if available
        },
    });
};

export const useTripsByStatus = (status: string) => { /* ... */ };
export const useTrip = (id: string | undefined) => { /* ... */ };
export const useCreateTrip = () => { /* ... */ };
export const useUpdateTrip = () => { /* ... */ };
export const useDeleteTrip = () => { /* ... */ };
```

### src/hooks/useDrivers.ts
- Full CRUD for drivers
- Search drivers
- Filter by status
- Vehicle assignment

### src/hooks/useCustomers.ts
- Customer management
- Search & filter
- Credit limit tracking
- Contact management

### src/hooks/useRoutes.ts
- Route CRUD
- Stop management
- Distance calculation

### src/hooks/useExpenses.ts (400 lines)
```typescript
export const useExpenses = () => { /* ... */ };
export const useExpensesByTrip = (tripId: string | undefined) => { /* ... */ };
export const useCreateExpense = () => { /* ... */ };
export const useUpdateExpense = () => { /* ... */ };
export const useConfirmExpense = () => {
    // Validates total_amount matches sum of expense lines
};
export const useDeleteExpense = () => { /* ... */ };
export const useExpenseAllocations = (expenseId: string | undefined) => { /* ... */ };
export const useCreateExpenseAllocation = () => { /* ... */ };
export const useDeleteExpenseAllocation = () => { /* ... */ };
```

### src/hooks/useDashboard.ts (385 lines)
```typescript
export const useDashboardStats = (startDate: string, endDate: string) => {
    // Separates CLOSED vs COMPLETED trips
    // Returns: official, pending, inProgress, draft stats
};

export const usePeriodStatus = (periodCode: string) => { /* ... */ };
export const useMonthlyTrend = (months: number = 6) => { /* ... */ };
export const useExpenseBreakdown = (startDate: string, endDate: string) => { /* ... */ };
export const useVehiclePerformance = (limit: number = 5) => { /* ... */ };
export const useDriverPerformance = (limit: number = 5) => { /* ... */ };
export const useRecentTrips = (limit: number = 5) => { /* ... */ };
export const useMaintenanceAlerts = () => { /* ... */ };
```

### src/hooks/useDataManagement.ts
- Data export (JSON, CSV)
- Data backup

### src/hooks/useCompanySettings.ts
- Company info management
- Settings persistence

### src/hooks/useSecuritySettings.ts
- 2FA configuration
- Auto-logout settings
- Action logging

### src/hooks/useBulkDelete.ts
- Bulk delete operations
- Progress tracking
- Error handling

### src/hooks/useUsers.ts
- User management
- Role assignment
- User creation/deletion

### src/hooks/useAccountingPeriods.ts
- Period lock status
- Closed period checking

### src/hooks/useTripWorkflow.ts
- Trip status transitions
- Workflow validation

---

## 6. UTILITIES & LIBRARIES

### src/lib/formatters.ts
```typescript
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number | null | undefined, decimals = 0): string => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  // Format with time
};

export const formatPercent = (value: number | null | undefined): string => {
  // Percentage formatting
};

export const formatKm = (value: number | null | undefined): string => {
  return `${formatNumber(value)} km`;
};

export const formatTons = (value: number | null | undefined): string => {
  return `${formatNumber(value, 2)} tấn`;
};
```

### src/lib/export.ts (103 lines)
```typescript
import * as XLSX from 'xlsx';

export function exportToCSV<T>(data: T[], filename: string, columns: { key: string; header: string }[]) {
    if (!data || data.length === 0) return;

    const transformedData = data.map(row => {
        const obj: Record<string, any> = {};
        columns.forEach(col => {
            const keys = col.key.split('.');
            let value: any = row;
            for (const k of keys) {
                value = (value as any)?.[k];
            }
            obj[col.header] = value === null || value === undefined ? '' : value;
        });
        return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(transformedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    const colWidths = columns.map(col => ({
        wch: Math.max(col.header.length, 15)
    }));
    worksheet['!cols'] = colWidths;

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
}

export async function importFromFile(
  file: File,
  columns: ImportColumn[],
  onProgress?: (message: string) => void
): Promise<Record<string, any>[]> {
    // File reading and validation
    // Column mapping
    // Data transformation
}
```

### src/lib/utils.ts
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateTripCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const shortId = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `CH-${year}${month}-${shortId}`;
}
```

---

## 7. SHARED COMPONENTS (50+ components)

### src/components/shared/DataTable.tsx (523 lines)
**Features:**
- Generic table component with TypeScript support
- Sorting (by any column)
- Pagination
- Search
- Filtering
- Column visibility
- Bulk selection
- Export functionality
- Custom cell rendering
- Responsive design

```typescript
export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: T[keyof T], row: T) => ReactNode;
  sortable?: boolean;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading,
  selectable,
  onSearch,
  onAdd,
  onExport,
  onRowClick,
  pageSize,
  // ... 15+ more props
}: DataTableProps<T>) {
  // Sorting, pagination, filtering logic
  // Selection management
  // UI rendering
}
```

### src/components/shared/ExcelImportDialog.tsx (387 lines)
**Features:**
- File upload dialog
- Excel parsing with XLSX
- Column mapping
- Data validation
- Preview before import
- Error reporting
- Duplicate detection
- Template generation
- Sample data export

```typescript
export interface ImportColumn {
    key: string;
    header: string;
    required?: boolean;
    type?: 'text' | 'number' | 'date';
    description?: string;
}

export function ExcelImportDialog({
    isOpen,
    onClose,
    onImport,
    entityName,
    columns,
    sampleData,
    existingCodes,
    codeField,
}: ExcelImportDialogProps) {
  // 3-step process: upload → preview → import
}
```

### src/components/shared/BulkDeleteDialog.tsx
- Confirmation dialog
- Delete count display
- Loading state

### src/components/shared/BulkDeleteToolbar.tsx
- Selection controls
- Bulk action buttons
- Count display

### src/components/shared/StatusBadge.tsx
- Status color coding
- Vehicle/Driver/Trip statuses

### src/components/shared/StatCard.tsx
- Key metric display
- Trend indicator
- Loading skeleton

### src/components/shared/PageHeader.tsx
- Page title
- Description
- Optional actions

### src/components/dashboard/DashboardOverview.tsx (536 lines)
**Features:**
- 4 key metric cards (revenue, profit, trips, vehicles)
- Revenue trend chart (6 months)
- Expense breakdown pie chart
- Recent trips table
- Driver performance table
- Maintenance alerts
- Date range filter
- Interactive charts with Recharts

**Data displayed:**
- Official vs Pending revenue
- Expense breakdown by category
- Vehicle/driver performance metrics
- Maintenance alerts with expiry warnings

### src/components/trips/RevenueManager.tsx (900 lines)
**Features:**
- Full trip CRUD
- Revenue & cost calculation
- Expense allocation
- Workflow status management
- Trip audit logging
- Financial summary
- Excel import/export

### src/components/vehicles/VehicleMapView.tsx
- Leaflet map integration
- GPS position display
- Vehicle markers
- Vehicle info popup

### src/components/vehicles/ColumnChooser.tsx
- Column visibility toggle
- Reset to defaults

### src/components/vehicles/ExcelFilter.tsx
- Excel-style filtering
- Date range picker
- Multi-select filters
- Range filters for numbers

### src/components/drivers/DriverImportDialog.tsx
- Specialized import for drivers
- Custom validation

### src/components/dispatch/DispatchTripDrawer.tsx
- Side panel for trip details
- Driver/vehicle assignment

### src/components/dispatch/DayViewTimeline.tsx
- Day-based timeline view
- Trip blocks by time
- Click to edit

### src/components/reports/ReportByDriverTable.tsx
- Driver performance metrics
- Revenue, expenses, profit
- Trip count

### src/components/reports/ReportByVehicleTable.tsx
- Vehicle performance metrics
- Utilization rate
- Maintenance costs

### src/components/reports/ReportByFleetTable.tsx
- Fleet-wide summary
- Comparison metrics

### src/components/reports/DrillDownTripTable.tsx
- Detailed trip list
- Click to drill down

### src/components/reports/ExcelDataTable.tsx
- Advanced table with Excel features
- Filtering & sorting

### src/components/reports/ExportButtons.tsx
- Export to PDF/Excel/CSV

### src/components/ui/* (30+ components)
shadcn/ui components:
- Button, Card, Dialog
- Input, Select, Textarea
- Table, Tabs, Badge
- Alert, Checkbox, Switch
- Calendar, DatePicker
- Toast/Toaster
- And more...

---

## 8. DATABASE INTEGRATION

### src/integrations/supabase/client.ts
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### Database Tables
- users (Supabase Auth)
- user_roles (RBAC)
- vehicles
- drivers
- customers
- routes
- trips
- expenses
- expense_allocations
- maintenance_orders
- accounting_periods
- company_settings
- trip_financials (materialized view)

---

## 9. CONFIGURATION FILES

### package.json
```json
{
  "name": "vite_react_shadcn_ts",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "typescript": "^5.8.3",
    "@tanstack/react-query": "^5.83.0",
    "react-hook-form": "^7.61.1",
    "zod": "^3.25.76",
    "@supabase/supabase-js": "^2.91.0",
    "tailwindcss": "^3.4.17",
    "lucide-react": "^0.462.0",
    "recharts": "^2.15.4",
    "xlsx": "^0.18.5",
    "leaflet": "^1.9.4",
    "sonner": "^1.7.4",
    "date-fns": "^3.6.0",
    "ag-grid-react": "^35.0.1"
  }
}
```

### vite.config.ts
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

---

## 10. STYLING

### Tailwind CSS
- Custom color scheme
- Responsive utilities
- Dark mode support
- Animation utilities

### Colors
- Primary, Secondary, Accent
- Destructive, Warning, Success
- Muted, Foreground, Background
- Card, Popover, Input

---

## KEY FEATURES SUMMARY

✅ **Complete Fleet Management**
- Vehicles: 19 fields, map view, GPS tracking
- Drivers: License, salary, assignments
- Routes: Planning, optimization
- Customers: Credit management

✅ **Trip & Revenue Management**
- Trip creation & workflow
- Revenue tracking
- Cost allocation
- Profit calculation

✅ **Expense Management**
- Expense tracking
- Categorization
- Trip allocation
- Approval workflow

✅ **Reporting & Analytics**
- Driver performance
- Vehicle performance
- Fleet statistics
- Financial reports

✅ **Security & Access Control**
- 6 role-based access levels
- Admin controls
- User management
- Audit logging

✅ **Data Management**
- Excel import/export
- Bulk operations
- Data backup
- Data cleaning

✅ **User Experience**
- Vietnamese UI
- Dark mode
- Responsive design
- Toast notifications
- Real-time data sync

---

## DEPLOYMENT

**Build:**
```bash
npm run build
```

**Output:** `/dist` directory (Vite static build)

**Deploy to:** Vercel, Netlify, AWS S3, or any static hosting

**Environment Variables:**
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

---

## Statistics

- **Total Files:** 214
- **Pages:** 13 main routes
- **Components:** 60+
- **Custom Hooks:** 16+
- **UI Components:** 30+
- **Utilities:** 5+
- **Lines of Code:** 10,000+
- **Languages:** TypeScript, TSX, CSS
- **Database:** PostgreSQL (Supabase)

---

This is a **production-ready** fleet management SaaS application built with modern React patterns, comprehensive type safety, and professional UX design.

