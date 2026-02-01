import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type MaintenanceOrder = Database['public']['Tables']['maintenance_orders']['Row'];
type NewMaintenanceOrder = Database['public']['Tables']['maintenance_orders']['Insert'];
type UpdateMaintenanceOrder = Database['public']['Tables']['maintenance_orders']['Update'];

/**
 * Hook to fetch all maintenance orders
 */
export const useMaintenanceOrders = () => {
    return useQuery({
        queryKey: ['maintenance_orders'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('maintenance_orders')
                .select('*, vehicle:vehicles(license_plate)')
                .eq('is_deleted', false)
                .order('scheduled_date', { ascending: false });

            if (error) throw error;
            return data;
        },
    });
};

/**
 * Hook to fetch a single maintenance order
 */
export const useMaintenanceOrder = (id: string | undefined) => {
    return useQuery({
        queryKey: ['maintenance_orders', id],
        queryFn: async () => {
            if (!id) return null;

            const { data, error } = await supabase
                .from('maintenance_orders')
                .select('*, vehicle:vehicles(license_plate)')
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
 * Hook to create a new maintenance order
 */
export const useCreateMaintenanceOrder = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (order: NewMaintenanceOrder) => {
            const { data, error } = await supabase
                .from('maintenance_orders')
                .insert(order)
                .select()
                .single();

            if (error) throw error;
            return data as MaintenanceOrder;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance_orders'] });
            toast({
                title: 'Tạo phiếu bảo trì thành công',
                description: 'Phiếu bảo trì mới đã được tạo.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi tạo phiếu bảo trì',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to update an existing maintenance order
 */
export const useUpdateMaintenanceOrder = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateMaintenanceOrder }) => {
            const { data, error } = await supabase
                .from('maintenance_orders')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as MaintenanceOrder;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance_orders'] });
            toast({
                title: 'Cập nhật thành công',
                description: 'Thông tin phiếu bảo trì đã được cập nhật.',
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
 * Hook to soft delete a maintenance order
 */
export const useDeleteMaintenanceOrder = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('maintenance_orders')
                .update({ is_deleted: true })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as MaintenanceOrder;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance_orders'] });
            toast({
                title: 'Xóa phiếu bảo trì thành công',
                description: 'Phiếu bảo trì đã được xóa.',
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
