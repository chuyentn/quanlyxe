# Getting Started & Deployment Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

### Installation

```bash
# Clone repository
git clone <repo-url>
cd quanlyxe

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
EOF

# Start development server
npm run dev

# Open http://localhost:8080
```

---

## Development Workflow

### Project Structure
```
quanlyxe/
├── src/
│   ├── pages/              # Route pages
│   ├── components/         # React components
│   ├── hooks/              # Custom hooks
│   ├── contexts/           # Context providers
│   ├── lib/                # Utilities
│   ├── integrations/       # Supabase
│   ├── App.tsx             # Main app
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── supabase/               # Database migrations
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

### Common Tasks

#### Add a New Page
```bash
# 1. Create page component
# src/pages/MyPage.tsx

import { PageHeader } from "@/components/shared/PageHeader";

export default function MyPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="My Page" description="Description here" />
      {/* Page content */}
    </div>
  );
}

# 2. Add route in App.tsx
import MyPage from "./pages/MyPage";

<Route path="/mypage" element={<MyPage />} />

# 3. Add nav item in AppSidebar.tsx
{
  path: "/mypage",
  label: "My Page",
  icon: MyIcon,
}
```

#### Add a New Hook
```typescript
// src/hooks/useMyData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMyData = () => {
  return useQuery({
    queryKey: ['mydata'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('my_table')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateMyData = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item) => {
      const { data, error } = await supabase
        .from('my_table')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mydata'] });
      toast({ title: 'Success!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
```

#### Add a New Component
```typescript
// src/components/MyComponent.tsx
import { ReactNode } from "react";

interface MyComponentProps {
  title: string;
  children?: ReactNode;
}

export function MyComponent({ title, children }: MyComponentProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}
```

#### Add Database Migration
```bash
# Create migration file
supabase migration new add_new_column

# Edit migration file
supabase/migrations/20260201000000_add_new_column.sql

# Migration content
ALTER TABLE my_table ADD COLUMN new_column TEXT;

# Test locally
supabase db push

# Deploy to production
supabase db push --linked
```

---

## Build & Deployment

### Production Build
```bash
# Build optimized bundle
npm run build

# Output: dist/ directory
# Size: ~300-400KB gzipped (typical React SPA)

# Preview locally
npm run preview

# Serve on http://localhost:4173
```

### Deploy to Vercel
```bash
# Option 1: Using Vercel CLI
npm install -g vercel
vercel

# Option 2: Connect GitHub repo to Vercel dashboard
# Push to GitHub → Vercel auto-deploys

# Environment Variables in Vercel:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_PUBLISHABLE_KEY
```

### Deploy to Netlify
```bash
# Option 1: Using Netlify CLI
npm install -g netlify-cli
netlify deploy --prod

# Option 2: Connect GitHub repo to Netlify dashboard
# Netlify auto-builds and deploys on push

# Build settings:
# Build command: npm run build
# Publish directory: dist
```

### Deploy to AWS S3 + CloudFront
```bash
# 1. Build
npm run build

# 2. Create S3 bucket
aws s3 mb s3://my-fleet-app

# 3. Upload files
aws s3 sync dist/ s3://my-fleet-app --delete

# 4. Set up CloudFront distribution
# - Point to S3 bucket
# - Enable caching
# - Set TTL

# 5. Custom domain (Route 53)
```

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and push
docker build -t my-fleet-app:1.0 .
docker tag my-fleet-app:1.0 myregistry.azurecr.io/my-fleet-app:1.0
docker push myregistry.azurecr.io/my-fleet-app:1.0

# Deploy to Kubernetes, Azure Container Instances, etc.
```

---

## Environment Configuration

### Development (.env.local)
```env
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=dev-anon-key
```

### Staging (.env.staging)
```env
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=staging-anon-key
```

### Production (.env.production)
```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=prod-anon-key
```

### Build with Environment
```bash
# Development
npm run dev

# Production
npm run build

# Build with specific mode
vite build --mode production
vite build --mode staging
```

---

## Database Setup

### Initial Setup
```bash
# 1. Create Supabase project
# https://supabase.com/

# 2. Get credentials
# Copy SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY

# 3. Apply migrations
supabase db push

# 4. Set up auth
# Enable Email/Password in Auth settings
# Configure redirect URLs

# 5. Create seed data
# Run SQL scripts in supabase/seed_demo_p0_supabase.sql
```

### Database Schema Overview
```sql
-- Core tables
- users (from Supabase Auth)
- user_roles (admin, manager, dispatcher, accountant, driver, viewer)
- vehicles (19 fields)
- drivers (15 fields)
- customers (13 fields)
- routes (distance, stops)
- trips (trip workflow, revenue, expenses)
- expenses (categorized, allocated)
- expense_allocations (link expenses to trips)
- maintenance_orders (service history)
- accounting_periods (closed periods)
- company_settings (company info)

-- Views
- trip_financials (materialized view with calculated data)
```

### Row-Level Security (RLS)
```sql
-- Policies are set up per table:
-- Vehicles: Only admins can delete
-- Trips: Only own company can access
-- Expenses: Role-based access
-- etc.

-- Test RLS:
SELECT * FROM vehicles
-- Returns: Only non-deleted vehicles

UPDATE vehicles SET status = 'maintenance'
-- Requires: admin role (from RLS policy)
```

---

## Testing

### Unit Tests
```bash
npm run test
```

### Watch Mode
```bash
npm run test:watch
```

### Example Test (vitest)
```typescript
// src/lib/__tests__/formatters.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from '@/lib/formatters';

describe('formatters', () => {
  it('formatCurrency formats Vietnamese currency', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('₫');
  });

  it('formatDate formats dates correctly', () => {
    const result = formatDate('2026-02-01');
    expect(result).toBe('01/02/2026');
  });

  it('formatCurrency handles null/undefined', () => {
    expect(formatCurrency(null)).toBe('-');
    expect(formatCurrency(undefined)).toBe('-');
  });
});
```

### Integration Tests
```typescript
// Test data flow from component to database
describe('Vehicle Management', () => {
  it('creates vehicle successfully', async () => {
    // 1. Render component
    // 2. Fill form
    // 3. Submit
    // 4. Verify database change
  });
});
```

---

## Troubleshooting

### Common Issues

#### Issue: "Supabase URL not found"
**Solution:** Check .env.local has VITE_SUPABASE_URL

#### Issue: "RLS policy violation"
**Solution:** 
- Check user role in user_roles table
- Verify RLS policies in Supabase
- Ensure authenticated user has required role

#### Issue: "Unique constraint violation"
**Solution:**
- Check if code already exists
- For soft-deleted items, timestamp suffix should be appended
- Use search to find duplicates

#### Issue: "Slow query on dashboard"
**Solution:**
- Check materialized view is refreshed
- Add database indexes
- Use React Query caching

#### Issue: "Bulk import fails"
**Solution:**
- Verify Excel file format matches template
- Check for duplicate codes
- Review validation error messages
- Import smaller batches if too large

### Debug Mode
```typescript
// Enable verbose logging
localStorage.setItem('debug', 'true');

// Check Auth state
console.log(useAuth());

// Check React Query cache
console.log(queryClient.getQueryData(['vehicles']));
```

---

## Performance Optimization

### Bundle Size
```bash
# Analyze bundle
npm install -g vite-plugin-visualizer
npm run build

# Expected sizes:
- Gzipped: ~300-400KB
- Uncompressed: ~1-1.5MB
```

### Runtime Performance
```typescript
// Check Largest Contentful Paint (LCP)
// Check First Input Delay (FID)
// Check Cumulative Layout Shift (CLS)

// Optimize by:
// 1. Lazy loading routes
// 2. Code splitting
// 3. Image optimization
// 4. Minimizing large re-renders
```

### Database Performance
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_is_deleted ON vehicles(is_deleted);
CREATE INDEX idx_trips_departure_date ON trips(departure_date);
CREATE INDEX idx_trips_status ON trips(status);

-- Monitor slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Monitoring & Analytics

### Error Tracking
```typescript
// Use Sentry for error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

Sentry.captureException(error);
```

### Analytics
```typescript
// Track user behavior
import gtag from 'ga-gtag';

gtag('event', 'vehicle_created', {
  'vehicle_type': 'truck',
});

gtag('pageview', '/vehicles');
```

### Logs
```bash
# View Vercel logs
vercel logs

# View Supabase logs
# https://supabase.com/dashboard → Logs
```

---

## Security Best Practices

✅ **Environment Variables**
- Never commit .env files
- Use different keys per environment
- Rotate keys periodically

✅ **Authentication**
- Use strong passwords
- Enable 2FA
- Regular session timeout

✅ **Authorization**
- Verify user role before sensitive operations
- Use RLS policies in database
- Log sensitive actions

✅ **Data Protection**
- Enable HTTPS (automatic with Vercel/Netlify)
- Use strong encryption for PII
- Regular backups

✅ **Code Security**
- Keep dependencies updated
- Use dependabot/snyk
- Regular security audits

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check database performance
- Monitor user reports

**Weekly:**
- Update dependencies
- Run security scans
- Backup database

**Monthly:**
- Review analytics
- Performance optimization
- Capacity planning

**Quarterly:**
- Major version updates
- Security audit
- Disaster recovery drill

### Backup & Recovery

```bash
# Backup Supabase database
supabase db push --linked

# Restore from backup
supabase db reset

# Export data
supabase db dump > backup.sql

# Verify backups
# Supabase Dashboard → Backups tab
```

---

## Support & Resources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)

### Community
- GitHub Issues
- Supabase Discord
- Stack Overflow
- React Forum

### Getting Help
```bash
# Check logs
npm run build

# Run linter
npm run lint

# Test queries
# Supabase SQL Editor

# Debug in browser
# DevTools → Network, Console, Application tabs
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Tests passing (npm run test)
- [ ] No console errors (npm run lint)
- [ ] Bundle size acceptable
- [ ] Performance metrics acceptable
- [ ] Backup created
- [ ] Monitoring configured
- [ ] Rollback plan in place
- [ ] Documentation updated
- [ ] Team notified

---

## Version History

```
v1.0.0 (2026-02-01)
- Initial release
- Complete vehicle, driver, customer management
- Trip revenue and expense tracking
- Comprehensive dashboard and reports
- User authentication and RBAC
- Excel import/export
- Production-ready deployment
```

---

This application is **production-ready** and can be deployed immediately! 🚀

For questions or support, refer to the comprehensive documentation files:
- COMPLETE_SOURCE_CODE.md - Full source overview
- FULL_SOURCE_CODE.md - Detailed implementations
- ADVANCED_GUIDE.md - Advanced patterns
- API_AND_DATAFLOW.md - Data flow and architecture
