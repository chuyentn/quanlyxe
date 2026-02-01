import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to dispatch a trip (DRAFT → DISPATCHED)
 */
export const useDispatchTrip = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (tripId: string) => {
            const { data, error } = await supabase
                .from('trips')
                .update({
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    status: 'dispatched' as any,
                    dispatched_at: new Date().toISOString()
                })
                .eq('id', tripId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Điều xe thành công',
                description: 'Chuyến đã được điều xe.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi điều xe',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to start a trip (DISPATCHED → IN_PROGRESS)
 */
export const useStartTrip = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (tripId: string) => {
            const { data, error } = await supabase
                .from('trips')
                .update({
                    status: 'in_progress',
                    actual_departure_time: new Date().toISOString()
                })
                .eq('id', tripId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Bắt đầu chuyến thành công',
                description: 'Chuyến đã bắt đầu.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi bắt đầu chuyến',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to complete a trip (IN_PROGRESS → COMPLETED)
 * Requires: actual_departure_time, actual_arrival_time, actual_distance_km
 */
export const useCompleteTrip = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (tripId: string) => {
            const { data, error } = await supabase
                .from('trips')
                .update({
                    status: 'completed',
                    actual_arrival_time: new Date().toISOString()
                })
                .eq('id', tripId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Hoàn thành chuyến',
                description: 'Chuyến đã hoàn thành.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi hoàn thành chuyến',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to close a trip (COMPLETED → CLOSED)
 * Requires: total_revenue > 0, actual times, actual_distance_km, no draft expenses
 * After closing, financial fields are LOCKED
 */
export const useCloseTrip = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (tripId: string) => {
            const { data, error } = await supabase
                .from('trips')
                .update({
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    status: 'closed' as any,
                    closed_at: new Date().toISOString()
                })
                .eq('id', tripId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Đóng chuyến thành công',
                description: 'Chuyến đã được đóng. Không thể sửa thông tin tài chính.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi đóng chuyến',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to cancel a trip (ANY → CANCELLED)
 * Preserves all data, just changes status
 */
export const useCancelTrip = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (tripId: string) => {
            const { data, error } = await supabase
                .from('trips')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString()
                })
                .eq('id', tripId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Hủy chuyến thành công',
                description: 'Chuyến đã được hủy. Dữ liệu được giữ lại.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi hủy chuyến',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to update trip status (generic)
 * Use specific hooks above for better type safety
 */
export const useUpdateTripStatus = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ tripId, status }: { tripId: string; status: string }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updates: any = { status };

            // Auto-set timestamps based on status
            if (status === 'dispatched') {
                updates.dispatched_at = new Date().toISOString();
            } else if (status === 'in_progress' && !updates.actual_departure_time) {
                updates.actual_departure_time = new Date().toISOString();
            } else if (status === 'completed' && !updates.actual_arrival_time) {
                updates.actual_arrival_time = new Date().toISOString();
            } else if (status === 'closed') {
                updates.closed_at = new Date().toISOString();
            } else if (status === 'cancelled') {
                updates.cancelled_at = new Date().toISOString();
            }

            const { data, error } = await supabase
                .from('trips')
                .update(updates)
                .eq('id', tripId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi cập nhật trạng thái',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to fetch draft expense count for a trip
 * Used to validate before closing
 */
export const useDraftExpenseCount = (tripId: string | undefined) => {
    return useQuery({
        queryKey: ['draft_expenses_count', tripId],
        queryFn: async () => {
            if (!tripId) return 0;

            const { count, error } = await supabase
                .from('expenses')
                .select('*', { count: 'exact', head: true })
                .eq('trip_id', tripId)
                .eq('status', 'draft')
            // .eq('is_deleted', false);

            if (error) throw error;
            return count || 0;
        },
        enabled: !!tripId,
    });
};
