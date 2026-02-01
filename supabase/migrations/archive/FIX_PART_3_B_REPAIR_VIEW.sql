-- ============================================================================
-- MASTER FIX - PART 3-B (REPAIR - V2)
-- FIX MISSING TABLES AND VIEWS
-- Run this to fix "category_code cannot be null" error
-- ============================================================================

-- 1. Ensure expense_categories table exists
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code TEXT NOT NULL UNIQUE, -- Added NOT NULL constraint based on error
    category_name TEXT NOT NULL,
    category_type TEXT, -- 'fixed' or 'variable'
    description TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS for expense_categories
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select expense_categories" ON public.expense_categories;
CREATE POLICY "Authenticated users can select expense_categories" ON public.expense_categories FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert expense_categories" ON public.expense_categories;
CREATE POLICY "Authenticated users can insert expense_categories" ON public.expense_categories FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update expense_categories" ON public.expense_categories;
CREATE POLICY "Authenticated users can update expense_categories" ON public.expense_categories FOR UPDATE TO authenticated USING (true);

-- 3. Insert default categories if empty (Now with category_code)
INSERT INTO public.expense_categories (category_code, category_name, category_type)
SELECT 'NHIEN_LIEU', 'Nhiên liệu', 'variable'
WHERE NOT EXISTS (SELECT 1 FROM public.expense_categories WHERE category_name = 'Nhiên liệu');

INSERT INTO public.expense_categories (category_code, category_name, category_type)
SELECT 'PHI_CAU_DUONG', 'Phí cầu đường', 'variable'
WHERE NOT EXISTS (SELECT 1 FROM public.expense_categories WHERE category_name = 'Phí cầu đường');

INSERT INTO public.expense_categories (category_code, category_name, category_type)
SELECT 'BAO_DUONG', 'Bảo dưỡng', 'fixed'
WHERE NOT EXISTS (SELECT 1 FROM public.expense_categories WHERE category_name = 'Bảo dưỡng');

INSERT INTO public.expense_categories (category_code, category_name, category_type)
SELECT 'LUONG_TAI_XE', 'Lương tài xế', 'fixed'
WHERE NOT EXISTS (SELECT 1 FROM public.expense_categories WHERE category_name = 'Lương tài xế');

INSERT INTO public.expense_categories (category_code, category_name, category_type)
SELECT 'KHAC', 'Khác', 'variable'
WHERE NOT EXISTS (SELECT 1 FROM public.expense_categories WHERE category_name = 'Khác');


-- 4. Re-create the missing View (Safe to run again)
DROP VIEW IF EXISTS expense_summary_by_category CASCADE;
CREATE OR REPLACE VIEW expense_summary_by_category AS
SELECT 
    ec.id as category_id,
    ec.category_name,
    ec.category_type,
    COUNT(e.id) as expense_count,
    SUM(CASE WHEN e.status = 'confirmed' THEN COALESCE(e.amount, e.total_amount, 0) ELSE 0 END) as total_confirmed,
    SUM(CASE WHEN e.status = 'draft' THEN COALESCE(e.amount, e.total_amount, 0) ELSE 0 END) as total_draft,
    SUM(COALESCE(e.amount, e.total_amount, 0)) as total_all
FROM expense_categories ec
LEFT JOIN expenses e ON e.category_id = ec.id AND e.is_deleted = false
WHERE ec.is_deleted = false
GROUP BY ec.id, ec.category_name, ec.category_type;

-- 5. Grant Permissions (Retry)
GRANT SELECT ON public.expense_categories TO authenticated;
GRANT SELECT ON public.expense_summary_by_category TO authenticated;
GRANT ALL ON public.maintenance_orders TO authenticated;

-- Force refresh
NOTIFY pgrst, 'reload config';
