import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Driver = Database['public']['Tables']['drivers']['Row'];
type NewDriver = Database['public']['Tables']['drivers']['Insert'];
type UpdateDriver = Database['public']['Tables']['drivers']['Update'];

/**
 * Hook to fetch all drivers (excluding soft-deleted)
 */
export const useDrivers = () => {
    return useQuery({
        queryKey: ['drivers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('drivers')
                .select('*, assigned_vehicle:assigned_vehicle_id(license_plate,vehicle_code,status)')
                // .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Driver[];
        },
    });
};

/**
 * Hook to fetch a single driver by ID
 */
export const useDriver = (id: string | undefined) => {
    return useQuery({
        queryKey: ['drivers', id],
        queryFn: async () => {
            if (!id) return null;

            const { data, error } = await supabase
                .from('drivers')
                .select('*, assigned_vehicle:assigned_vehicle_id(license_plate,vehicle_code,status)')
                .eq('id', id)
                // .eq('is_deleted', false)
                .single();

            if (error) throw error;
            return data as Driver;
        },
        enabled: !!id,
    });
};

/**
 * Hook to create a new driver
 */
export const useCreateDriver = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (driver: NewDriver) => {
            const { data, error } = await supabase
                .from('drivers')
                .insert(driver)
                .select()
                .single();

            if (error) throw error;
            return data as Driver;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            toast({
                title: 'Thêm tài xế thành công',
                description: 'Tài xế mới đã được thêm vào hệ thống.',
            });
        },
        onError: (error: any) => {
            let description = error.message;
            if (error.code === '23505' || error.message?.includes('duplicate')) {
                description = 'Mã tài xế đã tồn tại. Vui lòng kiểm tra lại.';
            }

            toast({
                title: 'Lỗi khi thêm tài xế',
                description: description,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to update an existing driver
 */
export const useUpdateDriver = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateDriver }) => {
            const { data, error } = await supabase
                .from('drivers')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Driver;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            toast({
                title: 'Cập nhật thành công',
                description: 'Thông tin tài xế đã được cập nhật.',
            });
        },
        onError: (error: any) => {
            let description = error.message;
            if (error.code === '23505' || error.message?.includes('duplicate')) {
                description = 'Mã tài xế đã tồn tại. Vui lòng kiểm tra lại.';
            }

            toast({
                title: 'Lỗi khi cập nhật',
                description: description,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to soft delete a driver
 */
/**
 * Hook to soft delete a driver
 * Performs a "Safe Soft Delete":
 * 1. Sets is_deleted = true
 * 2. Appends _DEL_{timestamp} to unique fields (driver_code, id_card, tax_code)
 *    to release the unique constraint for new records.
 */
export const useDeleteDriver = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            // 1. Get current driver data to append suffix safely
            const { data: currentDriver, error: fetchError } = await supabase
                .from('drivers')
                .select('driver_code, id_card, tax_code, phone')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            const timestamp = Date.now().toString(36);
            const updates: any = { is_deleted: true };

            // Append suffix to unique fields if they exist
            if (currentDriver.driver_code) updates.driver_code = `${currentDriver.driver_code}_del_${timestamp}`;
            if (currentDriver.id_card) updates.id_card = `${currentDriver.id_card}_del_${timestamp}`;
            if (currentDriver.tax_code) updates.tax_code = `${currentDriver.tax_code}_del_${timestamp}`;
            // Optional: phone might not be unique but good practice to release it
            // if (currentDriver.phone) updates.phone = `${currentDriver.phone}_DEL_${timestamp}`;

            const { error } = await supabase
                .from('drivers')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            return { id } as unknown as Driver;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            toast({
                title: 'Xóa tài xế thành công',
                description: 'Tài xế đã được xóa khỏi hệ thống. Mã tài xế đã được giải phóng.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi xóa tài xế',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to fetch drivers by status
 */
export const useDriversByStatus = (status: 'active' | 'on_leave' | 'inactive') => {
    return useQuery({
        queryKey: ['drivers', 'status', status],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .eq('is_deleted', false)
                .eq('status', status)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Driver[];
        },
    });
};

/**
 * Hook to search drivers by name, code, or phone
 */
export const useSearchDrivers = (searchTerm: string) => {
    return useQuery({
        queryKey: ['drivers', 'search', searchTerm],
        queryFn: async () => {
            if (!searchTerm) {
                const { data, error } = await supabase
                    .from('drivers')
                    .select('*')
                    // .eq('is_deleted', false)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data as Driver[];
            }

            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .eq('is_deleted', false)
                .or(`full_name.ilike.%${searchTerm}%,driver_code.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Driver[];
        },
    });
};

/**
 * Hook to fetch active drivers (for assignment dropdowns)
 */
export const useActiveDrivers = () => {
    return useQuery({
        queryKey: ['drivers', 'active'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .eq('is_deleted', false)
                .eq('status', 'active')
                .order('full_name', { ascending: true });

            if (error) throw error;
            return data as Driver[];
        },
    });
};
