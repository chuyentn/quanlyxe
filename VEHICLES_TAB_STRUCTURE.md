# 📋 Tab "Đội Xe" - Cấu Trúc Code Chi Tiết

## 📂 Cấu Trúc Tệp

```
src/
├── pages/
│   └── Vehicles.tsx          ← UI logic (form, dialog, table)
├── hooks/
│   └── useVehicles.ts        ← Data fetching & mutations (CRUD)
└── integrations/
    └── supabase/
        ├── client.ts         ← Supabase connection
        └── types.ts          ← TypeScript type definitions
```

---

## 🔑 Component: Vehicles.tsx

**Vị trí:** [src/pages/Vehicles.tsx](src/pages/Vehicles.tsx)

**Chức năng:** Giao diện người dùng (UI)

### Cấu trúc:
```
1. Imports & Type Definitions
   - React hooks (useState, useRef)
   - React Hook Form for form management
   - Zod for validation
   - ShadCN UI components (Dialog, Form, Input, Select, Button)
   - Custom hooks (useVehicles, useCreateVehicle, etc.)

2. Validation Schema (vehicleSchema)
   - vehicle_code: string, required
   - license_plate: string, required (unique)
   - vehicle_type: string, required
   - brand: optional
   - model: optional
   - capacity_tons: number >= 0
   - current_odometer: number >= 0
   - fuel_consumption_per_100km: number >= 0
   - status: enum ['active', 'maintenance', 'inactive']

3. State Management
   - dialogOpen: boolean (show/hide form dialog)
   - deleteDialogOpen: boolean (confirm delete)
   - selectedVehicle: Vehicle | null (current editing)
   - searchQuery: string (search filter)
   - isImporting: boolean (import progress)

4. Event Handlers
   - handleAdd(): Open dialog for new vehicle
   - handleRowClick(): Open dialog to edit vehicle
   - handleDeleteClick(): Show delete confirmation
   - handleConfirmDelete(): Actually delete (soft delete)
   - onSubmit(): Save (create or update)
   - handleSyncAll(): Refresh from database
   - handleExport(): Export to CSV
   - handleImport(): Import from file
```

### Key Features:
- ✅ Add new vehicle
- ✅ Edit existing vehicle
- ✅ Soft delete (mark as deleted, not actually removed)
- ✅ Search by code, license plate, brand
- ✅ Export to CSV
- ✅ Import from CSV
- ✅ Sync with database
- ✅ Status management (active/maintenance/inactive)

---

## 🎣 Hook: useVehicles.ts

**Vị trí:** [src/hooks/useVehicles.ts](src/hooks/useVehicles.ts)

**Chức năng:** Data layer (React Query + Supabase)

### Exported Functions:

#### **1. useVehicles()** - Get all vehicles
```typescript
const { data: vehicles, isLoading } = useVehicles();

// Fetches from Supabase with filters:
// - WHERE is_deleted = false (only active vehicles)
// - ORDER BY created_at DESC
// - Returns: Vehicle[]
```

#### **2. useVehicle(id)** - Get single vehicle
```typescript
const { data: vehicle } = useVehicle(vehicleId);

// Fetches specific vehicle by ID
// - Only if not soft-deleted
// - Returns: Vehicle | null
```

#### **3. useCreateVehicle()** - Create new
```typescript
const createMutation = useCreateVehicle();
await createMutation.mutateAsync({
  vehicle_code: "XE-001",
  license_plate: "29A-123.45",
  // ...
});

// On success:
// - Inserts row to Supabase 'vehicles' table
// - Invalidates cache (refetch all vehicles)
// - Shows toast notification
```

#### **4. useUpdateVehicle()** - Update existing
```typescript
const updateMutation = useUpdateVehicle();
await updateMutation.mutateAsync({
  id: vehicleId,
  updates: { status: "maintenance", /* ... */ }
});

// On success:
// - Updates row in Supabase
// - Invalidates cache (refetch all)
// - Shows toast notification
```

#### **5. useDeleteVehicle()** - Soft delete
```typescript
const deleteMutation = useDeleteVehicle();
await deleteMutation.mutateAsync(vehicleId);

// IMPORTANT: NOT a hard delete!
// - Sets is_deleted = true (soft delete)
// - Data remains in database
// - useVehicles() filters out these rows
// - Invalidates cache
```

#### **6. useVehiclesByStatus(status)** - Filter by status
```typescript
const { data: activeVehicles } = useVehiclesByStatus('active');

// Used in Trips tab to show only available vehicles
```

#### **7. useSearchVehicles(searchTerm)** - Search
```typescript
const { data: results } = useSearchVehicles("29A");

// Searches by:
// - license_plate (ilike, case-insensitive)
// - vehicle_code (ilike)
// - brand (ilike)
```

---

## 💾 Data Storage Architecture

### **Where is data stored?**

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR BROWSER                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  React Component State (useState)                │   │
│  │  - dialogOpen, selectedVehicle, etc.             │   │
│  │  - Only while page is open                       │   │
│  │  - Lost on F5 refresh ❌                          │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↑                                 │
│                    fetches from                          │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  React Query Cache (TanStack Query)              │   │
│  │  - Stores fetched vehicle data                   │   │
│  │  - Invalidated on create/update/delete           │   │
│  │  - Auto-refetches on invalidation                │   │
│  │  - Lost on F5 refresh ❌                          │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↑                                 │
│                  fetches from                            │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Browser IndexedDB (Optional, not used)          │   │
│  │  - Could persist between sessions                │   │
│  │  - Currently NOT configured                      │   │
│  │  - Lost on F5 refresh ❌                          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↑
                    syncs with (RPC)
                           ↓
┌─────────────────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL Database)             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Table: vehicles                                 │   │
│  │  Columns:                                        │   │
│  │  - id: uuid (Primary Key)                        │   │
│  │  - vehicle_code: text (unique)                   │   │
│  │  - license_plate: text (unique)                  │   │
│  │  - vehicle_type: text                            │   │
│  │  - brand: text                                   │   │
│  │  - model: text                                   │   │
│  │  - capacity_tons: decimal                        │   │
│  │  - current_odometer: decimal                     │   │
│  │  - fuel_consumption_per_100km: decimal           │   │
│  │  - status: enum (active/maintenance/inactive)    │   │
│  │  - is_deleted: boolean (soft delete flag)        │   │
│  │  - created_at: timestamp                         │   │
│  │  - updated_at: timestamp                         │   │
│  │  - company_id: uuid (RLS policy)                 │   │
│  │                                                  │   │
│  │  ✅ PERSISTS FOREVER (unless hard deleted)      │   │
│  │  🔐 Protected by RLS policies                    │   │
│  │  🗄️ Auto-backed up by Supabase                  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### **Answer: Khi F5, data có còn không?**

**✅ CÓ, data vẫn còn!** 

**Chi tiết:**

| Nơi lưu | F5 Refresh | Tính chất |
|---------|-----------|----------|
| **React Component State** | ❌ Mất | Tạm thời, chỉ trong component |
| **React Query Cache** | ❌ Mất | Tạm thời, chỉ trong session |
| **Supabase (PostgreSQL)** | ✅ CÒN | **Vĩnh viễn** (trừ soft delete) |

**Luồng hoạt động:**

```
1. Bạn thêm xe "XE-001"
   Component State: { vehicles: [XE-001] }
         ↓ save
   Supabase: INSERT INTO vehicles (vehicle_code='XE-001', ...)
         ↓
   Toast: "Thêm xe thành công"

2. Bạn F5 refresh
   Component State: {} (empty, loading)
   React Query Cache: {} (empty, loading)
         ↓ auto-fetch
   Supabase: SELECT * FROM vehicles WHERE is_deleted=false
         ↓ returns XE-001
   Component State: { vehicles: [XE-001] } (reload)
         ↓
   Table: XE-001 hiển thị lại

✅ DATA CÒN!
```

---

## 🗑️ Xóa Data: Hard Delete vs Soft Delete

### **Soft Delete (Hiện tại dùng)**

```typescript
// Khi bạn click nút Xóa:
await supabase
  .from('vehicles')
  .update({ is_deleted: true })  // ← Chỉ đánh dấu, không xóa thực
  .eq('id', vehicleId)
  .select()
  .single();

// Kết quả:
// - Dòng vẫn tồn tại trong database ✓
// - is_deleted = true
// - useVehicles() filter out (WHERE is_deleted=false)
// - Không hiển thị trong UI ✓
// - Có thể phục hồi bằng SET is_deleted=false ✓
```

**Ưu điểm:**
- ✅ Không mất data
- ✅ Có lịch sử
- ✅ Có thể undo
- ✅ Áudit trail

**Nhược điểm:**
- ❌ Database vẫn lớn (dữ liệu cũ accumulate)
- ❌ Cần filter `is_deleted=false` ở mọi nơi

### **Hard Delete (Không dùng)**

```typescript
// Nếu dùng hard delete:
await supabase
  .from('vehicles')
  .delete()  // ← Xóa hoàn toàn
  .eq('id', vehicleId)
```

**Kết quả:**
- ❌ Data mất vĩnh viễn
- ❌ Không phục hồi được
- ❌ Có thể vi phạm FK constraints
- ✅ Database sạch hơn

---

## 🔄 Data Flow (Từ UI đến Database)

### **Scenario: Thêm xe mới**

```
┌─────────────────────────────────────────┐
│  User: Click "Thêm xe" button           │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Vehicles.tsx: handleAdd()               │
│  - Reset form                            │
│  - setDialogOpen(true)                   │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Dialog appears: Vehicle form             │
│  - Input: vehicle_code, license_plate    │
│  - Input: vehicle_type, brand, model     │
│  - Input: capacity_tons, fuel, status    │
│  - Validation by vehicleSchema (Zod)     │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  User: Fill form + Click "Save"          │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Vehicles.tsx: onSubmit()                │
│  - Validate form data (Zod)              │
│  - Call createMutation.mutateAsync()     │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  useCreateVehicle() hook:                │
│  - mutationFn: supabase.from('vehicles') │
│    .insert(vehicle)                      │
│    .select()                             │
│    .single()                             │
└──────────────────┬──────────────────────┘
                   ↓
        [Network Request to Supabase]
                   ↓
┌─────────────────────────────────────────┐
│  Supabase (PostgreSQL):                  │
│  INSERT INTO vehicles (...)              │
│  VALUES (...)                            │
│  RETURNING *                             │
│  ↓                                       │
│  - Check constraints (status enum, etc.) │
│  - Check unique (vehicle_code, license)  │
│  - Check FK (company_id)                 │
│  - RLS policy: current_user_id=company   │
│  ↓                                       │
│  ✅ Success → Return new vehicle row     │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  useCreateVehicle() hook:                │
│  - onSuccess() callback:                 │
│    1. Invalidate query cache:            │
│       queryClient.invalidateQueries()    │
│    2. Show toast:                        │
│       "Thêm xe thành công"               │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  React Query:                            │
│  - Detects cache invalidation            │
│  - Auto-refetch: useVehicles()           │
│  - New query: SELECT * FROM vehicles     │
│    WHERE is_deleted=false                │
│    ORDER BY created_at DESC              │
└──────────────────┬──────────────────────┘
                   ↓
        [Network Request to Supabase]
                   ↓
┌─────────────────────────────────────────┐
│  Supabase:                               │
│  Return all non-deleted vehicles         │
│  (including the new one)                 │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Vehicles.tsx:                           │
│  - Update state: vehicles = [...]        │
│  - Close dialog                          │
│  - Table re-renders with new vehicle     │
│  - setDialogOpen(false)                  │
│  - setSelectedVehicle(null)              │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  User sees:                              │
│  ✅ New vehicle in table                 │
│  ✅ Toast notification                   │
│  ✅ Dialog closed                        │
└─────────────────────────────────────────┘
```

---

## 🔐 RLS Policy (Row-Level Security)

**Vị trí:** Database > Supabase > RLS Policies

```sql
-- vehicles table RLS policy:
CREATE POLICY "Users can view vehicles in their company"
ON vehicles
FOR SELECT
USING (auth.uid()::uuid = company_id OR company_id = auth.uid());

CREATE POLICY "Users can insert vehicles in their company"
ON vehicles
FOR INSERT
WITH CHECK (auth.uid()::uuid = company_id);

CREATE POLICY "Users can update vehicles in their company"
ON vehicles
FOR UPDATE
USING (auth.uid()::uuid = company_id)
WITH CHECK (auth.uid()::uuid = company_id);

CREATE POLICY "Users can delete vehicles in their company"
ON vehicles
FOR DELETE
USING (auth.uid()::uuid = company_id);
```

**Ý nghĩa:**
- ✅ Chỉ xem được xe của công ty mình
- ✅ Chỉ thêm xe cho công ty mình
- ✅ Chỉ sửa xe của công ty mình
- ✅ Chỉ xóa xe của công ty mình
- ❌ Không thể xem/sửa/xóa xe của công ty khác

---

## 📊 Database Schema

```sql
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Thông tin xe
    vehicle_code TEXT NOT NULL UNIQUE,
    license_plate TEXT NOT NULL UNIQUE,
    vehicle_type TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    year_manufactured SMALLINT,
    
    -- Thông số kỹ thuật
    capacity_tons DECIMAL(8,2) DEFAULT 0,
    current_odometer DECIMAL(10,2) DEFAULT 0,
    fuel_type TEXT,
    fuel_consumption_per_100km DECIMAL(5,2),
    
    -- Trạng thái
    status vehicle_status DEFAULT 'active',
    notes TEXT,
    
    -- Xóa mềm (Soft Delete)
    is_deleted BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(company_id, vehicle_code),
    UNIQUE(company_id, license_plate),
    CHECK (capacity_tons >= 0),
    CHECK (current_odometer >= 0),
    CHECK (fuel_consumption_per_100km > 0)
);

-- Index cho tìm kiếm nhanh
CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX idx_vehicles_status ON vehicles(status) WHERE NOT is_deleted;
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate) WHERE NOT is_deleted;
CREATE INDEX idx_vehicles_vehicle_code ON vehicles(vehicle_code) WHERE NOT is_deleted;
```

---

## 🚀 Summary

| Câu hỏi | Đáp án |
|--------|--------|
| **Tab Đội Xe code ở đâu?** | `src/pages/Vehicles.tsx` (UI) + `src/hooks/useVehicles.ts` (data) |
| **Data lưu ở đâu?** | Supabase PostgreSQL database |
| **Khi F5 refresh, data có còn?** | ✅ CÓ - data vẫn lưu ở Supabase, React Query refetch tự động |
| **Xóa data có thực sự xóa không?** | ❌ KHÔNG - dùng soft delete, chỉ đánh dấu `is_deleted=true` |
| **Có thể phục hồi data xóa?** | ✅ CÓ - update `is_deleted=false` để lấy lại |
| **Ai có quyền xem xe?** | Chỉ user của công ty đó (RLS policy) |
| **Cần phải reload browser?** | ❌ KHÔNG - React Query tự động refetch |

---

## 📚 Liên kết quan trọng

- [Vehicles Component](src/pages/Vehicles.tsx)
- [useVehicles Hook](src/hooks/useVehicles.ts)
- [Supabase Client](src/integrations/supabase/client.ts)
- [Database Schema](supabase/migrations/ULTIMATE_MIGRATION.sql)
- [QA Test Plan](QA_TEST_PLAN.md)
- [Customization Analysis](APP_CUSTOMIZATION_ANALYSIS.md)
