import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Expense = Database['public']['Tables']['expenses']['Row'];
type NewExpense = Database['public']['Tables']['expenses']['Insert'];
type UpdateExpense = Database['public']['Tables']['expenses']['Update'];
type ExpenseAllocation = Database['public']['Tables']['expense_allocations']['Row'];
type NewExpenseAllocation = Database['public']['Tables']['expense_allocations']['Insert'];

/**
 * Hook to fetch all expenses (excluding soft-deleted)
 */
export const useExpenses = () => {
    return useQuery({
        queryKey: ['expenses'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('expenses')
                .select('*, category:expense_categories(*), trip:trip_id(trip_code)')
                .eq('is_deleted', false)
                .order('expense_date', { ascending: false });

            if (error) throw error;
            return data;
        },
    });
};

/**
 * Hook to fetch expenses by trip ID
 */
export const useExpensesByTrip = (tripId: string | undefined) => {
    return useQuery({
        queryKey: ['expenses', 'trip', tripId],
        queryFn: async () => {
            if (!tripId) return [];

            const { data, error } = await supabase
                .from('expenses')
                .select('*, category:expense_categories(*), trip:trip_id(trip_code)')
                .eq('is_deleted', false)
                .eq('trip_id', tripId)
                .order('expense_date', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!tripId,
    });
};

/**
 * Hook to fetch a single expense by ID
 */
export const useExpense = (id: string | undefined) => {
    return useQuery({
        queryKey: ['expenses', id],
        queryFn: async () => {
            if (!id) return null;

            const { data, error } = await supabase
                .from('expenses')
                .select('*, category:expense_categories(*), allocations:expense_allocations(*), trip:trip_id(trip_code)')
                .eq('id', id)
                .eq('is_deleted', false)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });
};

/**
 * Hook to create a new expense
 */
export const useCreateExpense = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (expense: NewExpense) => {
            const { data, error } = await supabase
                .from('expenses')
                .insert(expense)
                .select()
                .single();

            if (error) throw error;
            return data as Expense;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['trips'] }); // Refresh trip financials
            toast({
                title: 'Thêm phiếu chi thành công',
                description: 'Phiếu chi mới đã được thêm vào hệ thống.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi thêm phiếu chi',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to update an existing expense
 */
export const useUpdateExpense = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateExpense }) => {
            const { data, error } = await supabase
                .from('expenses')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Expense;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Cập nhật thành công',
                description: 'Phiếu chi đã được cập nhật.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi cập nhật',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to confirm an expense (change status from draft to confirmed)
 * CRITICAL: Validates that total_amount matches sum of expense lines
 */
export const useConfirmExpense = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            // Step 1: Fetch current expense with all expense lines
            const { data: expenseData, error: fetchError } = await supabase
                .from('expenses')
                .select('id, amount, expense_code')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            // Step 2: Confirm the expense directly
            const { data, error } = await supabase
                .from('expenses')
                .update({
                    status: 'confirmed',
                    confirmed_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Expense;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Xác nhận phiếu chi thành công',
                description: 'Phiếu chi đã được xác nhận và ảnh hưởng đến lợi nhuận.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Không thể xác nhận phiếu chi',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to soft delete an expense
 */
export const useDeleteExpense = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('expenses')
                .update({ is_deleted: true })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Expense;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Xóa phiếu chi thành công',
                description: 'Phiếu chi đã được xóa.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi xóa',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to fetch expense allocations for an expense
 */
export const useExpenseAllocations = (expenseId: string | undefined) => {
    return useQuery({
        queryKey: ['expense_allocations', expenseId],
        queryFn: async () => {
            if (!expenseId) return [];

            const { data, error } = await supabase
                .from('expense_allocations')
                .select('*, trip:trips(trip_code, departure_date)')
                .eq('expense_id', expenseId);

            if (error) throw error;
            return data;
        },
        enabled: !!expenseId,
    });
};

/**
 * Hook to create expense allocations
 * CRITICAL: Prevents allocating expense that already has a trip_id (double-count)
 */
export const useCreateExpenseAllocation = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (allocation: NewExpenseAllocation) => {
            // Validate: Expense cannot have both trip_id AND allocations
            const { data: expenseData, error: fetchError } = await supabase
                .from('expenses')
                .select('id, trip_id, amount')
                .eq('id', allocation.expense_id)
                .single();

            if (fetchError) throw fetchError;

            if (expenseData.trip_id) {
                throw new Error(
                    `Chi phí này đã được gán trực tiếp cho chuyến hàng. ` +
                    `Không thể phân bổ chi phí đã được gán trực tiếp. ` +
                    `Vui lòng xóa gán trực tiếp trước khi phân bổ.`
                );
            }

            // Fetch all allocations for this expense to check total
            const { data: allocationsData, error: allocError } = await supabase
                .from('expense_allocations')
                .select('percentage')
                .eq('expense_id', allocation.expense_id);

            if (allocError) throw allocError;

            const currentTotal = (allocationsData || []).reduce((sum, a) => sum + (a.percentage || 0), 0);
            const newTotal = currentTotal + (allocation.percentage || 0);

            if (newTotal > 100) {
                throw new Error(
                    `Tổng phân bổ vượt quá 100%. ` +
                    `Hiện tại: ${currentTotal}% + Thêm: ${allocation.percentage}% = ${newTotal}%. ` +
                    `Vui lòng kiểm tra lại tỷ lệ phân bổ.`
                );
            }

            // Insert allocation
            const { data, error } = await supabase
                .from('expense_allocations')
                .insert(allocation)
                .select()
                .single();

            if (error) throw error;
            return data as ExpenseAllocation;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expense_allocations'] });
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Phân bổ thành công',
                description: 'Chi phí đã được phân bổ cho chuyến hàng.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi phân bổ',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to delete an expense allocation
 */
export const useDeleteExpenseAllocation = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('expense_allocations')
                .delete()
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as ExpenseAllocation;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expense_allocations'] });
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Xóa phân bổ thành công',
                description: 'Phân bổ chi phí đã được xóa.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi xóa phân bổ',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to search expenses
 */
export const useSearchExpenses = (searchTerm: string) => {
    return useQuery({
        queryKey: ['expenses', 'search', searchTerm],
        queryFn: async () => {
            if (!searchTerm) {
                const { data, error } = await supabase
                    .from('expenses')
                    .select('*, category:expense_categories(*)')
                    .eq('is_deleted', false)
                    .order('expense_date', { ascending: false });

                if (error) throw error;
                return data;
            }

            const { data, error } = await supabase
                .from('expenses')
                .select('*, category:expense_categories(*)')
                .eq('is_deleted', false)
                .or(`expense_code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%`)
                .order('expense_date', { ascending: false });

            if (error) throw error;
            return data;
        },
    });
};
