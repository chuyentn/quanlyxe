import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Route = Database['public']['Tables']['routes']['Row'];
type NewRoute = Database['public']['Tables']['routes']['Insert'];
type UpdateRoute = Database['public']['Tables']['routes']['Update'];

/**
 * Hook to fetch all routes (excluding soft-deleted)
 */
export const useRoutes = () => {
    return useQuery({
        queryKey: ['routes'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('routes')
                .select('*')
                // .eq('is_deleted', false)
                .order('route_name', { ascending: true });

            if (error) throw error;
            return data as Route[];
        },
    });
};

/**
 * Hook to fetch a single route by ID
 */
export const useRoute = (id: string | undefined) => {
    return useQuery({
        queryKey: ['routes', id],
        queryFn: async () => {
            if (!id) return null;

            const { data, error } = await supabase
                .from('routes')
                .select('*')
                .eq('id', id)
                .eq('is_deleted', false)
                .single();

            if (error) throw error;
            return data as Route;
        },
        enabled: !!id,
    });
};

/**
 * Hook to create a new route
 */
export const useCreateRoute = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (route: NewRoute) => {
            const { data, error } = await supabase
                .from('routes')
                .insert(route)
                .select()
                .single();

            if (error) throw error;
            return data as Route;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routes'] });
            toast({
                title: 'Thêm tuyến đường thành công',
                description: 'Tuyến đường mới đã được thêm vào hệ thống.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi thêm tuyến đường',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to update an existing route
 */
export const useUpdateRoute = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateRoute }) => {
            const { data, error } = await supabase
                .from('routes')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Route;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routes'] });
            toast({
                title: 'Cập nhật thành công',
                description: 'Thông tin tuyến đường đã được cập nhật.',
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
 * Hook to soft delete a route
 */
/**
 * Hook to soft delete a route
 * Safe Delete Strategy: Rename unique fields to allow re-creation
 */
export const useDeleteRoute = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            // 1. Get current data
            const { data: current, error: fetchError } = await supabase
                .from('routes')
                .select('route_code')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            const timestamp = Date.now().toString(36);
            const updates: any = { is_deleted: true };

            // 2. Append suffix to unique fields
            if (current.route_code) updates.route_code = `${current.route_code}_del_${timestamp}`;

            const { data, error } = await supabase
                .from('routes')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Route;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routes'] });
            toast({
                title: 'Xóa tuyến đường thành công',
                description: 'Tuyến đường đã được xóa và mã tuyến đã được giải phóng.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi xóa tuyến đường',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to search routes
 */
export const useSearchRoutes = (searchTerm: string) => {
    return useQuery({
        queryKey: ['routes', 'search', searchTerm],
        queryFn: async () => {
            if (!searchTerm) {
                const { data, error } = await supabase
                    .from('routes')
                    .select('*')
                    .eq('is_deleted', false)
                    .order('route_name', { ascending: true });

                if (error) throw error;
                return data as Route[];
            }

            const { data, error } = await supabase
                .from('routes')
                .select('*')
                .eq('is_deleted', false)
                .or(`route_name.ilike.%${searchTerm}%,route_code.ilike.%${searchTerm}%,origin.ilike.%${searchTerm}%,destination.ilike.%${searchTerm}%`)
                .order('route_name', { ascending: true });

            if (error) throw error;
            return data as Route[];
        },
    });
};
