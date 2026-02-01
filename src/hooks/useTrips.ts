import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Trip = Database['public']['Tables']['trips']['Row'];
type NewTrip = Database['public']['Tables']['trips']['Insert'];
type UpdateTrip = Database['public']['Tables']['trips']['Update'];

// Trip status enum - must match database enum
export type TripStatus = 'draft' | 'confirmed' | 'dispatched' | 'in_progress' | 'completed' | 'closed' | 'cancelled';

// Type for trip with financial data from materialized view
interface TripFinancial {
    id: string;
    trip_code: string;
    vehicle_id: string;
    driver_id: string;
    route_id: string | null;
    customer_id: string | null;
    departure_date: string;
    status: TripStatus;
    cargo_description: string | null;
    cargo_weight_tons: number | null;
    freight_revenue: number;
    additional_charges: number;
    total_revenue: number;
    direct_expenses: number;
    allocated_expenses: number;
    total_expense: number;
    profit: number;
    profit_margin_pct: number;
    expense_count: number;
    allocation_count: number;
    actual_distance_km: number | null;
    actual_departure_time: string | null;
    actual_arrival_time: string | null;
    closed_at: string | null;
    cancelled_at: string | null;
}

/**
 * Hook to fetch all trips with financial data
 */
export const useTrips = () => {
    return useQuery({
        queryKey: ['trips'],
        queryFn: async () => {
            // Try to fetch from materialized view first
            // const { data: viewData, error: viewError } = await supabase
            //     .from('trip_financials')
            //     .select('*')
            //     .order('departure_date', { ascending: false });

            // // If view works, return the data
            // if (!viewError && viewData) {
            //     return viewData as TripFinancial[];
            // }

            // Fallback: Query from trips table with joins
            // Fallback: Query from trips table with joins
            // console.warn('trip_financials view not accessible, using fallback query');

            const { data: tripsData, error: tripsError } = await supabase
                .from('trips')
                // SIMPLIFIED QUERY TO FIX INFINITE LOADING
                // We suspect one of the joins is causing the query to hang or loop
                // Restoring relationships query as RLS policies are now fixed
                .select('*')
                // .select(`
                //     *,
                //     vehicle:vehicles(id, license_plate, vehicle_type, status),
                //     driver:drivers(id, full_name, driver_code),
                //     route:routes(id, route_name, origin, destination),
                //     customer:customers(id, customer_name, short_name)
                // `)

                .eq('is_deleted', false)
                .order('departure_date', { ascending: false })
                .limit(100);

            console.log('Fetching trips...', { data: tripsData, error: tripsError });

            if (tripsError) {
                console.error('Error fetching trips:', tripsError);
                throw tripsError;
            }

            // Map to TripFinancial format with default financial values
            return (tripsData || []).map(trip => ({
                ...trip,
                total_revenue: (trip.freight_revenue || 0) + (trip.additional_charges || 0),
                direct_expenses: 0,
                allocated_expenses: 0,
                total_expense: 0,
                profit: (trip.freight_revenue || 0) + (trip.additional_charges || 0),
                profit_margin_pct: 0,
                expense_count: 0,
                allocation_count: 0,
            })) as any[];
        },
    });
};

/**
 * Hook to fetch trips by status
 */
export const useTripsByStatus = (status: string) => {
    return useQuery({
        queryKey: ['trips', 'status', status],
        queryFn: async () => {
            // Try to fetch from materialized view first
            // const { data: viewData, error: viewError } = await supabase
            //     .from('trip_financials')
            //     .select('*')
            //     .eq('status', status)
            //     .order('departure_date', { ascending: false });

            // // If view works, return the data
            // if (!viewError && viewData) {
            //     return viewData as TripFinancial[];
            // }

            // Fallback: Query from trips table with joins
            // Fallback: Query from trips table with joins
            // console.warn('trip_financials view not accessible, using fallback query');

            const { data: tripsData, error: tripsError } = await supabase
                .from('trips')
                .select(`
                    *,
                    vehicle:vehicles(id, license_plate, vehicle_type, status),
                    driver:drivers(id, full_name, driver_code),
                    route:routes(id, route_name, origin, destination),
                    customer:customers(id, customer_name, short_name)
                `)
                .eq('is_deleted', false)
                .eq('status', status)
                .order('departure_date', { ascending: false });

            if (tripsError) throw tripsError;

            // Map to TripFinancial format with default financial values
            return (tripsData || []).map(trip => ({
                ...trip,
                total_revenue: (trip.freight_revenue || 0) + (trip.additional_charges || 0),
                direct_expenses: 0,
                allocated_expenses: 0,
                total_expense: 0,
                profit: (trip.freight_revenue || 0) + (trip.additional_charges || 0),
                profit_margin_pct: 0,
                expense_count: 0,
                allocation_count: 0,
            })) as any[];
        },
    });
};

/**
 * Hook to fetch a single trip with financial data
 */
export const useTrip = (id: string | undefined) => {
    return useQuery({
        queryKey: ['trips', id],
        queryFn: async () => {
            if (!id) return null;

            // Get trip details from main table
            const { data: tripData, error: tripError } = await supabase
                .from('trips')
                .select(`
                    *,
                    vehicle:vehicles(id, license_plate, vehicle_type, status),
                    driver:drivers(id, full_name, driver_code),
                    route:routes(id, route_name, origin, destination),
                    customer:customers(id, customer_name, short_name)
                `)
                .eq('id', id)
                .eq('is_deleted', false)
                .single();

            if (tripError) throw tripError;

            // Get financial data from view
            const { data: financialData, error: financialError } = await supabase
                .from('trip_financials')
                .select('*')
                .eq('id', id)
                .single();

            if (financialError) {
                // If not in view yet, return trip data only
                return tripData as Trip;
            }

            return { ...tripData, ...financialData } as Trip & TripFinancial;
        },
        enabled: !!id,
    });
};

/**
 * Hook to create a new trip
 */
export const useCreateTrip = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (trip: NewTrip) => {
            const { data, error } = await supabase
                .from('trips')
                .insert(trip)
                .select()
                .single();

            if (error) throw error;
            return data as Trip;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Tạo chuyến thành công',
                description: 'Chuyến hàng mới đã được tạo.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi tạo chuyến',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to update an existing trip
 */
export const useUpdateTrip = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateTrip }) => {
            const { data, error } = await supabase
                .from('trips')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Trip;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Cập nhật thành công',
                description: 'Thông tin chuyến hàng đã được cập nhật.',
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
 * Hook to confirm a trip (change status from draft to confirmed)
 */
export const useConfirmTrip = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('trips')
                .update({
                    status: 'confirmed',
                    confirmed_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Trip;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Xác nhận chuyến thành công',
                description: 'Chuyến hàng đã được xác nhận.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi xác nhận',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to dispatch a trip (change status to dispatched)
 */
export const useDispatchTrip = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('trips')
                .update({
                    status: 'dispatched',
                    dispatched_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Trip;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Phái chuyến thành công',
                description: 'Chuyến hàng đã được phái đi.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi khi phái chuyến',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Hook to start/complete a trip (change status to in_progress then completed)
 */
export const useStartTrip = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, actualDepartureTime }: { id: string; actualDepartureTime: string }) => {
            const { data, error } = await supabase
                .from('trips')
                .update({
                    status: 'in_progress',
                    actual_departure_time: actualDepartureTime
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Trip;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Bắt đầu chuyến thành công',
                description: 'Chuyến hàng đã được bắt đầu.',
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
 * Hook to complete a trip (change status to completed)
 */
export const useCompleteTrip = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({
            id,
            actualArrivalTime,
            actualDistanceKm
        }: {
            id: string;
            actualArrivalTime: string;
            actualDistanceKm: number;
        }) => {
            // Update trip status to completed
            const { data: trip, error: tripError } = await supabase
                .from('trips')
                .update({
                    status: 'completed',
                    actual_arrival_time: actualArrivalTime,
                    actual_distance_km: actualDistanceKm
                })
                .eq('id', id)
                .select('vehicle_id, departure_date')
                .single();

            if (tripError) throw tripError;

            // P0-2: Auto-create fuel expense
            try {
                // Fetch vehicle fuel consumption
                const { data: vehicle, error: vehicleError } = await supabase
                    .from('vehicles')
                    .select('fuel_consumption_per_100km')
                    .eq('id', trip.vehicle_id)
                    .single();

                if (!vehicleError && vehicle && vehicle.fuel_consumption_per_100km && actualDistanceKm > 0) {
                    // Calculate fuel consumption
                    const fuelLiters = (actualDistanceKm / 100) * vehicle.fuel_consumption_per_100km;

                    // TODO Sprint 2: Get fuel price from fuel_prices table by date
                    // For now, use hardcoded price
                    const fuelPricePerLiter = 22000; // VND
                    const fuelCost = fuelLiters * fuelPricePerLiter;

                    // Get fuel expense category ID
                    const { data: fuelCategory } = await supabase
                        .from('expense_categories')
                        .select('id')
                        .eq('category_name', 'Nhiên liệu')
                        .single();

                    if (fuelCategory) {
                        // Create fuel expense
                        await supabase
                            .from('expenses')
                            .insert({
                                trip_id: id,
                                vehicle_id: trip.vehicle_id,
                                category_id: fuelCategory.id,
                                amount: Math.round(fuelCost),
                                description: `Nhiên liệu tự động - ${fuelLiters.toFixed(1)}L × ${fuelPricePerLiter.toLocaleString()}đ`,
                                expense_date: trip.departure_date,
                                status: 'confirmed',
                            });
                    }
                }
            } catch (expenseError) {
                // Log error but don't fail the trip completion
                console.error('Failed to create auto fuel expense:', expenseError);
            }

            return trip as Trip;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Hoàn thành chuyến thành công',
                description: 'Chuyến hàng đã được hoàn thành.',
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
 * Hook to close a trip (final state, locks from edits)
 */
export const useCloseTrip = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('trips')
                .update({
                    status: 'closed',
                    closed_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Trip;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Đóng chuyến thành công',
                description: 'Chuyến hàng đã được đóng. Dữ liệu sẽ được khóa.',
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
 * Hook to cancel a trip
 */
export const useCancelTrip = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('trips')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Trip;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Hủy chuyến thành công',
                description: 'Chuyến hàng đã được hủy.',
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
 * Hook to soft delete a trip
 */
export const useDeleteTrip = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            // 1. Get current data
            const { data: current, error: fetchError } = await supabase
                .from('trips')
                .select('trip_code')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            // 2. Perform soft delete date with rename
            const timestamp = Math.floor(Date.now() / 1000).toString(36);
            const { error } = await supabase
                .from('trips')
                .update({
                    is_deleted: true,
                    trip_code: `${current.trip_code}_del_${timestamp}`
                })
                .eq('id', id);

            if (error) throw error;
            return { id } as unknown as Trip;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast({
                title: 'Xóa chuyến thành công',
                description: 'Chuyến hàng đã được xóa.',
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
 * Hook to search trips
 */
export const useSearchTrips = (searchTerm: string) => {
    return useQuery({
        queryKey: ['trips', 'search', searchTerm],
        queryFn: async () => {
            // Try materialized view first - DISABLED to ensure relations are loaded
            // if (!searchTerm) {
            //     const { data: viewData, error: viewError } = await supabase
            //         .from('trip_financials')
            //         .select('*')
            //         .order('departure_date', { ascending: false });

            //     if (!viewError && viewData) return viewData as TripFinancial[];
            // } else {
            //     const { data: viewData, error: viewError } = await supabase
            //         .from('trip_financials')
            //         .select('*')
            //         .or(`trip_code.ilike.%${searchTerm}%,cargo_description.ilike.%${searchTerm}%`)
            //         .order('departure_date', { ascending: false });

            //     if (!viewError && viewData) return viewData as TripFinancial[];
            // }

            // Fallback to trips table
            const query = supabase
                .from('trips')
                .select(`
                    *,
                    vehicle:vehicles(id, license_plate, vehicle_type, status),
                    driver:drivers(id, full_name, driver_code),
                    route:routes(id, route_name, origin, destination),
                    customer:customers(id, customer_name, short_name)
                `)
                .eq('is_deleted', false);

            if (searchTerm) {
                query.or(`trip_code.ilike.%${searchTerm}%,cargo_description.ilike.%${searchTerm}%`);
            }

            const { data: tripsData, error: tripsError } = await query.order('departure_date', { ascending: false });
            if (tripsError) throw tripsError;

            return (tripsData || []).map(trip => ({
                ...trip,
                total_revenue: (trip.freight_revenue || 0) + (trip.additional_charges || 0),
                direct_expenses: 0,
                allocated_expenses: 0,
                total_expense: 0,
                profit: (trip.freight_revenue || 0) + (trip.additional_charges || 0),
                profit_margin_pct: 0,
                expense_count: 0,
                allocation_count: 0,
            })) as any[];
        },
    });
};

/**
 * Hook to fetch trips by date range
 */
export const useTripsByDateRange = (startDate: string, endDate: string) => {
    return useQuery({
        queryKey: ['trips', 'dateRange', startDate, endDate],
        queryFn: async () => {
            // Use materialized view for performance
            const { data: viewData, error: viewError } = await supabase
                .from('trip_financials')
                .select('*')
                .gte('departure_date', startDate)
                .lte('departure_date', endDate)
                .order('departure_date', { ascending: false });

            if (viewError) {
                console.error('Error fetching trips by date range from view:', viewError);
                // Fallback to trips table if view fails
                const { data: tripsData, error: tripsError } = await supabase
                    .from('trips')
                    .select(`
                    *,
                    vehicle:vehicles(id, license_plate, vehicle_type, status),
                    driver:drivers(id, full_name, driver_code),
                    route:routes(id, route_name, origin, destination),
                    customer:customers(id, customer_name, short_name)
                `)
                    .eq('is_deleted', false)
                    .gte('departure_date', startDate)
                    .lte('departure_date', endDate)
                    .order('departure_date', { ascending: false })
                    .limit(100);

                if (tripsError) throw tripsError;

                return (tripsData || []).map(trip => ({
                    ...trip,
                    total_revenue: (trip.freight_revenue || 0) + (trip.additional_charges || 0),
                    direct_expenses: 0,
                    allocated_expenses: 0,
                    total_expense: 0,
                    profit: (trip.freight_revenue || 0) + (trip.additional_charges || 0),
                    profit_margin_pct: 0,
                    expense_count: 0,
                    allocation_count: 0,
                })) as any[];
            }

            return viewData as TripFinancial[];
        },
        enabled: !!startDate && !!endDate,
    });
};
