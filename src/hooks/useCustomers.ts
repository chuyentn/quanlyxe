import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Customer = Database['public']['Tables']['customers']['Row'];
type NewCustomer = Database['public']['Tables']['customers']['Insert'];
type UpdateCustomer = Database['public']['Tables']['customers']['Update'];

/**
 * Hook to fetch all customers (excluding soft-deleted)
 */
export const useCustomers = () => {
    return useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('is_deleted', false)
                .order('customer_name', { ascending: true });

            if (error) throw error;
            return data as Customer[];
        },
    });
};

/**
 * Hook to fetch a single customer by ID
 */
export const useCustomer = (id: string | undefined) => {
    return useQuery({
        queryKey: ['customers', id],
        queryFn: async () => {
            if (!id) return null;

            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('id', id)
                .eq('is_deleted', false)
                .single();

            if (error) throw error;
            return data as Customer;
        },
        enabled: !!id,
    });
};

/**
 * Hook to create a new customer
 */
export const useCreateCustomer = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (customer: NewCustomer) => {
            const { data, error } = await supabase
                .from('customers')
                .insert(customer)
                .select()
                .single();

            if (error) throw error;
            return data as Customer;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast({
                title: 'Thêm khách hàng thành công',
                description: 'Khách hàng mới đã được thêm vào hệ thống.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi thêm khách hàng',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to update an existing customer
 */
export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateCustomer }) => {
            const { data, error } = await supabase
                .from('customers')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Customer;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast({
                title: 'Cập nhật thành công',
                description: 'Thông tin khách hàng đã được cập nhật.',
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
 * Hook to soft delete a customer
 */
/**
 * Hook to soft delete a customer
 * Safe Delete Strategy: Rename unique fields to allow re-creation
 */
export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            // 1. Get current data
            const { data: current, error: fetchError } = await supabase
                .from('customers')
                .select('customer_code, tax_code')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            const timestamp = Math.floor(Date.now() / 1000);
            const updates: any = { is_deleted: true };

            // 2. Append suffix to unique fields
            if (current.customer_code) updates.customer_code = `${current.customer_code}_DEL_${timestamp}`;
            if (current.tax_code) updates.tax_code = `${current.tax_code}_DEL_${timestamp}`;

            const { data, error } = await supabase
                .from('customers')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Customer;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast({
                title: 'Xóa khách hàng thành công',
                description: 'Khách hàng đã được xóa và mã khách hàng đã được giải phóng.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi xóa khách hàng',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to search customers
 */
export const useSearchCustomers = (searchTerm: string) => {
    return useQuery({
        queryKey: ['customers', 'search', searchTerm],
        queryFn: async () => {
            if (!searchTerm) {
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('is_deleted', false)
                    .order('customer_name', { ascending: true });

                if (error) throw error;
                return data as Customer[];
            }

            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('is_deleted', false)
                .or(`customer_name.ilike.%${searchTerm}%,customer_code.ilike.%${searchTerm}%,short_name.ilike.%${searchTerm}%,tax_code.ilike.%${searchTerm}%`)
                .order('customer_name', { ascending: true });

            if (error) throw error;
            return data as Customer[];
        },
    });
};
