import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type NewVehicle = Database['public']['Tables']['vehicles']['Insert'];
type UpdateVehicle = Database['public']['Tables']['vehicles']['Update'];

/**
 * Hook to fetch all vehicles (excluding soft-deleted)
 */
export const useVehicles = () => {
    return useQuery({
        queryKey: ['vehicles'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                // .select('*')
                // .eq('is_deleted', false) // Temp remove filter
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Vehicle[];
        },
    });
};

/**
 * Hook to fetch a single vehicle by ID
 */
export const useVehicle = (id: string | undefined) => {
    return useQuery({
        queryKey: ['vehicles', id],
        queryFn: async () => {
            if (!id) return null;

            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('id', id)
                .eq('is_deleted', false)
                .single();

            if (error) throw error;
            return data as Vehicle;
        },
        enabled: !!id,
    });
};

/**
 * Hook to create a new vehicle
 */
export const useCreateVehicle = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (vehicle: NewVehicle) => {
            const { data, error } = await supabase
                .from('vehicles')
                .insert(vehicle)
                .select()
                .single();

            if (error) throw error;
            return data as Vehicle;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            toast({
                title: 'Thêm xe thành công',
                description: 'Xe mới đã được thêm vào hệ thống.',
            });
        },
        onError: (error: Error) => {
            let message = error.message;
            if ((error as any).code === '23505' || message.includes('duplicate key')) {
                if (message.includes('vehicles_vehicle_code_key')) {
                    message = 'Mã xe đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.';
                } else if (message.includes('vehicles_license_plate_key')) {
                    message = 'Biển số xe này đã tồn tại. Vui lòng kiểm tra lại.';
                } else {
                    message = 'Thông tin bị trùng lặp (Mã xe hoặc Biển số).';
                }
            }

            toast({
                title: 'Lỗi khi thêm xe',
                description: message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to update an existing vehicle
 */
export const useUpdateVehicle = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateVehicle }) => {
            const { data, error } = await supabase
                .from('vehicles')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Vehicle;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            toast({
                title: 'Cập nhật thành công',
                description: 'Thông tin xe đã được cập nhật.',
            });
        },
        onError: (error: Error) => {
            let message = error.message;
            if ((error as any).code === '23505' || message.includes('duplicate key')) {
                if (message.includes('vehicles_vehicle_code_key')) {
                    message = 'Mã xe đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.';
                } else if (message.includes('vehicles_license_plate_key')) {
                    message = 'Biển số xe này đã tồn tại. Vui lòng kiểm tra lại.';
                } else {
                    message = 'Thông tin bị trùng lặp (Mã xe hoặc Biển số).';
                }
            }

            toast({
                title: 'Lỗi khi cập nhật',
                description: message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to soft delete a vehicle
 */
/**
 * Hook to soft delete a vehicle
 * Safe Delete Strategy: Rename unique fields to allow re-creation
 */
export const useDeleteVehicle = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            // 1. Get current data
            const { data: current, error: fetchError } = await supabase
                .from('vehicles')
                .select('vehicle_code, license_plate, engine_number, chassis_number')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            const timestamp = Date.now().toString(36); // Compact timestamp
            const updates: any = { is_deleted: true };

            // 2. Append suffix to unique fields
            if (current.vehicle_code) updates.vehicle_code = `${current.vehicle_code}_del_${timestamp}`;
            if (current.license_plate) updates.license_plate = `${current.license_plate}_del_${timestamp}`;
            if (current.engine_number) updates.engine_number = `${current.engine_number}_del_${timestamp}`;
            if (current.chassis_number) updates.chassis_number = `${current.chassis_number}_del_${timestamp}`;

            const { error } = await supabase
                .from('vehicles')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            return { id } as unknown as Vehicle;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            toast({
                title: 'Xóa xe thành công',
                description: 'Xe đã được xóa và mã xe đã được giải phóng.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi xóa xe',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to fetch vehicles by status
 */
export const useVehiclesByStatus = (status: 'active' | 'maintenance' | 'inactive') => {
    return useQuery({
        queryKey: ['vehicles', 'status', status],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('is_deleted', false)
                .eq('status', status)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Vehicle[];
        },
    });
};

/**
 * Hook to search vehicles by license plate or vehicle code
 */
export const useSearchVehicles = (searchTerm: string) => {
    return useQuery({
        queryKey: ['vehicles', 'search', searchTerm],
        queryFn: async () => {
            if (!searchTerm) {
                const { data, error } = await supabase
                    .from('vehicles')
                    .select('*')
                    .eq('is_deleted', false)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data as Vehicle[];
            }

            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('is_deleted', false)
                .or(`license_plate.ilike.%${searchTerm}%,vehicle_code.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Vehicle[];
        },
    });
};
