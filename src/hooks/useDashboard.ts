import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
    official: {
        count: number;
        revenue: number;
        expense: number;
        profit: number;
        margin: number;
    };
    pending: {
        count: number;
        revenue: number;
        expense: number;
        profit: number;
        margin: number;
    };
    inProgress: {
        count: number;
        revenue: number;
    };
    draft: {
        count: number;
    };
}

interface TripFinancial {
    id: string;
    trip_code: string;
    departure_date: string;
    status: string;
    total_revenue: number | null;
    total_expense: number | null;
    profit: number | null;
    cargo_weight_tons: number | null;
    route_name: string | null;
    closed_at: string | null;
}

interface DashboardExpenseItem {
    name: string;
    value: number;
    percentage: number;
    count: number;
}

interface VehiclePerformance {
    vehicle_id: string;
    license_plate: string;
    total_revenue: number | null;
    total_expense: number | null;
    total_profit: number | null;
    trip_count: number | null;
    profit_margin: number | null;
}

interface DriverPerformance {
    driver_id: string;
    full_name: string;
    total_revenue: number | null;
    total_expense: number | null;
    total_profit: number | null;
    trip_count: number | null;
    profit_margin: number | null;
    driver_name?: string; // Fallback
}

interface PeriodInfo {
    period_code: string;
    period_name: string;
    is_closed: boolean;
    closed_at: string | null;
    closed_by: string | null;
    start_date: string;
    end_date: string;
}

/**
 * Hook to fetch dashboard statistics for a period
 * Separates CLOSED (official) vs COMPLETED (pending) trips
 */
export const useDashboardStats = (startDate: string, endDate: string) => {
    return useQuery({
        queryKey: ['dashboard', 'stats', startDate, endDate],
        queryFn: async () => {
            const { data: rawTrips, error } = await supabase
                .from('trip_financials' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                .select('*')
                .gte('departure_date', startDate)
                .lte('departure_date', endDate);

            if (error) throw error;
            if (!rawTrips) return getEmptyStats();

            const trips = rawTrips as unknown as TripFinancial[];

            // Separate by status and closed_at
            const closedTrips = trips.filter(t =>
                t.status === 'closed' || (t.status === 'completed' && t.closed_at !== null)
            );

            const pendingTrips = trips.filter(t =>
                t.status === 'completed' && t.closed_at === null
            );

            const inProgressTrips = trips.filter(t =>
                ['in_progress', 'assigned', 'active'].includes(t.status)
            );

            const draftTrips = trips.filter(t =>
                ['draft', 'unrouted', 'cancelled'].includes(t.status)
            );

            const stats: DashboardStats = {
                official: {
                    count: closedTrips.length,
                    revenue: sum(closedTrips, 'total_revenue'),
                    expense: sum(closedTrips, 'total_expense'),
                    profit: sum(closedTrips, 'profit'),
                    margin: calculateMargin(
                        sum(closedTrips, 'profit'),
                        sum(closedTrips, 'total_revenue')
                    ),
                },
                pending: {
                    count: pendingTrips.length,
                    revenue: sum(pendingTrips, 'total_revenue'),
                    expense: sum(pendingTrips, 'total_expense'),
                    profit: sum(pendingTrips, 'profit'),
                    margin: calculateMargin(
                        sum(pendingTrips, 'profit'),
                        sum(pendingTrips, 'total_revenue')
                    ),
                },
                inProgress: {
                    count: inProgressTrips.length,
                    revenue: sum(inProgressTrips, 'total_revenue'),
                },
                draft: {
                    count: draftTrips.length,
                },
            };

            return stats;
        },
    });
};

/**
 * Hook to fetch period lock status
 */
export const usePeriodStatus = (periodCode: string) => {
    return useQuery({
        queryKey: ['accounting_periods', periodCode],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('accounting_periods' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                .select('*')
                .eq('period_code', periodCode)
                .single();

            if (error) {
                // Period doesn't exist yet
                return null;
            }

            return data as unknown as PeriodInfo;
        },
    });
};

/**
 * Hook to fetch monthly trend data
 */
export const useMonthlyTrend = (months: number = 6) => {
    return useQuery({
        queryKey: ['dashboard', 'trend', months],
        queryFn: async () => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - months);

            const { data: rawTrips, error } = await supabase
                .from('trip_financials' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                .select('departure_date, total_revenue, total_expense, profit, status')
                .in('status', ['completed', 'closed']) // ONLY Realized Revenue
                .gte('departure_date', startDate.toISOString().split('T')[0])
                .lte('departure_date', endDate.toISOString().split('T')[0]);

            if (error) throw error;
            if (!rawTrips) return [];

            const trips = rawTrips as unknown as TripFinancial[];

            // Group by month
            const monthlyData = new Map<string, {
                month: string;
                revenue: number;
                expense: number;
                profit: number;
            }>();

            trips.forEach(trip => {
                const monthKey = trip.departure_date.substring(0, 7); // YYYY-MM
                const existing = monthlyData.get(monthKey) || {
                    month: formatMonthLabel(monthKey),
                    revenue: 0,
                    expense: 0,
                    profit: 0,
                };

                existing.revenue += trip.total_revenue || 0;
                existing.expense += trip.total_expense || 0;
                existing.profit += trip.profit || 0;

                monthlyData.set(monthKey, existing);
            });

            return Array.from(monthlyData.values()).sort((a, b) =>
                a.month.localeCompare(b.month)
            );
        },
    });
};

/**
 * Hook to fetch expense breakdown by category (Using Real 'expenses' table)
 */
export const useExpenseBreakdown = (startDate: string, endDate: string) => {
    return useQuery({
        queryKey: ['dashboard', 'expenses', startDate, endDate],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('expenses')
                .select(`
                    amount,
                    status,
                    expense_date,
                    expense_categories!inner (
                        category_name
                    )
                `)
                .eq('status', 'confirmed') // Consider confirmed expenses as actual cost
                .gte('expense_date', startDate)
                .lte('expense_date', endDate)
            // .eq('is_deleted', false);

            if (error) throw error;
            if (!data) return [];

            // Group by Category
            const categoryMap = new Map<string, number>();
            const categoryCount = new Map<string, number>();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.forEach((item: any) => {
                const name = item.expense_categories?.category_name || 'Khác';
                const value = item.amount || 0;

                categoryMap.set(name, (categoryMap.get(name) || 0) + value);
                categoryCount.set(name, (categoryCount.get(name) || 0) + 1);
            });

            const total = Array.from(categoryMap.values()).reduce((sum, v) => sum + v, 0);

            const result: DashboardExpenseItem[] = Array.from(categoryMap.entries())
                .map(([name, value]) => ({
                    name,
                    value,
                    percentage: total > 0 ? (value / total) * 100 : 0,
                    count: categoryCount.get(name) || 0
                }))
                .filter(item => item.value > 0) // Hide categories with 0 cost
                .sort((a, b) => b.value - a.value);

            return result;
        },
    });
};

/**
 * Hook to fetch vehicle performance
 */
export const useVehiclePerformance = (limit: number = 5) => {
    return useQuery({
        queryKey: ['dashboard', 'vehicles', limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vehicle_performance' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                .select('*')
                .order('total_profit', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return (data || []) as unknown as VehiclePerformance[];
        },
    });
};

/**
 * Hook to fetch driver performance
 */
export const useDriverPerformance = (limit: number = 5) => {
    return useQuery({
        queryKey: ['dashboard', 'drivers', limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('driver_performance' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                .select('*')
                .order('total_profit', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return (data || []) as unknown as DriverPerformance[];
        },
    });
};



/**
 * Hook to fetch recent trips
 */
export const useRecentTrips = (limit: number = 5) => {
    return useQuery({
        queryKey: ['dashboard', 'recent_trips', limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('trip_financials' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                .select('*')
                .order('departure_date', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return (data || []) as unknown as TripFinancial[];
        },
    });
};

/**
 * Hook to fetch maintenance alerts
 */
export const useMaintenanceAlerts = () => {
    return useQuery({
        queryKey: ['dashboard', 'maintenance'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('maintenance_orders')
                .select('*, vehicle:vehicles(license_plate)')
                .eq('status', 'scheduled')
                .gte('scheduled_date', new Date().toISOString().split('T')[0])
                .order('scheduled_date', { ascending: true })
                .limit(5);

            if (error) throw error;
            return data || [];
        },
    });
};

// Helper functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sum(items: any[], field: string): number {
    return items.reduce((total, item) => total + (item[field] || 0), 0);
}

function calculateMargin(profit: number, revenue: number): number {
    return revenue > 0 ? (profit / revenue) * 100 : 0;
}

function getEmptyStats(): DashboardStats {
    return {
        official: { count: 0, revenue: 0, expense: 0, profit: 0, margin: 0 },
        pending: { count: 0, revenue: 0, expense: 0, profit: 0, margin: 0 },
        inProgress: { count: 0, revenue: 0 },
        draft: { count: 0 },
    };
}

function formatMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    return `T${parseInt(month)}/${year.substring(2)}`;
}
