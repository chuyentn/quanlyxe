import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth, endOfDay } from "date-fns";

export interface ReportFilters {
    dateRange: DateRange | undefined;
    status: string[];
    vehicleIds: string[];
    driverIds: string[];
    searchPromise: string;
}

export interface VehicleReportRow {
    vehicle_id: string;
    vehicle_code: string;
    license_plate: string;
    vehicle_type: string;
    status: string;
    trip_count: number;
    total_distance_km: number;
    total_revenue: number;
    fuel_cost: number;
    toll_cost: number;
    other_cost: number;
    total_expense: number;
    profit: number;
    profit_margin_pct: number;
}

export const useVehicleReport = (filters: ReportFilters) => {
    return useQuery({
        queryKey: ['report-vehicle', filters],
        queryFn: async () => {
            const fromDate = filters.dateRange?.from ? filters.dateRange.from.toISOString() : startOfMonth(new Date()).toISOString();
            const toDate = filters.dateRange?.to ? endOfDay(filters.dateRange.to).toISOString() : endOfMonth(new Date()).toISOString();

            const { data: vehicles, error: vehicleError } = await supabase
                .from('vehicles')
                .select('id, vehicle_code, license_plate, vehicle_type, status')
                .order('vehicle_code');

            if (vehicleError) throw vehicleError;

            let tripQuery = supabase
                .from('trips')
                .select(`
          vehicle_id, id, status, total_revenue, actual_distance_km, freight_revenue, additional_charges
        `)
                .gte('departure_date', fromDate)
                .lte('departure_date', toDate)
                .neq('status', 'cancelled');

            if (filters.status.length > 0) tripQuery = tripQuery.in('status', filters.status);
            const { data: trips, error: tripError } = await tripQuery;
            if (tripError) throw tripError;

            const { data: expenses, error: expenseError } = await supabase
                .from('expenses')
                .select('vehicle_id, amount, category_id, expense_categories(category_code, category_type)')
                .gte('expense_date', fromDate)
                .lte('expense_date', toDate)
            // .not('is_deleted', 'is', true);

            if (expenseError) throw expenseError;

            const vehicleMap = new Map<string, VehicleReportRow>();

            vehicles?.forEach(v => {
                vehicleMap.set(v.id, {
                    vehicle_id: v.id,
                    vehicle_code: v.vehicle_code,
                    license_plate: v.license_plate,
                    vehicle_type: v.vehicle_type,
                    status: v.status || 'unknown',
                    trip_count: 0,
                    total_distance_km: 0,
                    total_revenue: 0,
                    fuel_cost: 0,
                    toll_cost: 0,
                    other_cost: 0,
                    total_expense: 0,
                    profit: 0,
                    profit_margin_pct: 0
                });
            });

            trips?.forEach(t => {
                const row = vehicleMap.get(t.vehicle_id);
                if (row) {
                    row.trip_count++;
                    row.total_distance_km += (t.actual_distance_km || 0);
                    row.total_revenue += (t.total_revenue || (t.freight_revenue || 0) + (t.additional_charges || 0));
                }
            });

            expenses?.forEach(e => {
                const row = vehicleMap.get(e.vehicle_id || '');
                if (row) {
                    const amount = e.amount || 0;
                    row.total_expense += amount;
                    const catType = e.expense_categories?.category_type;
                    const catCode = e.expense_categories?.category_code?.toLowerCase();

                    if (catCode?.includes('fuel') || catType === 'fuel') row.fuel_cost += amount;
                    else if (catCode?.includes('toll') || catType === 'toll') row.toll_cost += amount;
                    else row.other_cost += amount;
                }
            });

            const result = Array.from(vehicleMap.values()).map(row => {
                row.profit = row.total_revenue - row.total_expense;
                row.profit_margin_pct = row.total_revenue ? (row.profit / row.total_revenue) * 100 : 0;
                return row;
            });

            if (filters.searchPromise) {
                const search = filters.searchPromise.toLowerCase();
                return result.filter(r => r.vehicle_code.toLowerCase().includes(search) || r.license_plate.toLowerCase().includes(search));
            }

            return result;
        }
    });
};

export interface DriverReportRow {
    driver_id: string;
    driver_code: string;
    full_name: string;
    license_class: string;
    status: string;
    trip_count: number;
    total_distance_km: number;
    total_revenue: number;
    revenue_per_trip: number;
}

export const useDriverReport = (filters: ReportFilters) => {
    return useQuery({
        queryKey: ['report-driver', filters],
        queryFn: async () => {
            const fromDate = filters.dateRange?.from ? filters.dateRange.from.toISOString() : startOfMonth(new Date()).toISOString();
            const toDate = filters.dateRange?.to ? endOfDay(filters.dateRange.to).toISOString() : endOfMonth(new Date()).toISOString();

            const { data: drivers, error: driverError } = await supabase
                .from('drivers')
                .select('id, driver_code, full_name, license_class, status')
                .order('driver_code');

            if (driverError) throw driverError;

            let tripQuery = supabase
                .from('trips')
                .select(`driver_id, id, status, total_revenue, actual_distance_km, freight_revenue, additional_charges`)
                .gte('departure_date', fromDate)
                .lte('departure_date', toDate)
                .neq('status', 'cancelled');

            if (filters.status.length > 0) tripQuery = tripQuery.in('status', filters.status);
            const { data: trips, error: tripError } = await tripQuery;
            if (tripError) throw tripError;

            const driverMap = new Map<string, DriverReportRow>();

            drivers?.forEach(d => {
                driverMap.set(d.id, {
                    driver_id: d.id,
                    driver_code: d.driver_code,
                    full_name: d.full_name,
                    license_class: d.license_class || '',
                    status: d.status || 'unknown',
                    trip_count: 0,
                    total_distance_km: 0,
                    total_revenue: 0,
                    revenue_per_trip: 0
                });
            });

            trips?.forEach(t => {
                const row = driverMap.get(t.driver_id);
                if (row) {
                    row.trip_count++;
                    row.total_distance_km += (t.actual_distance_km || 0);
                    row.total_revenue += (t.total_revenue || (t.freight_revenue || 0) + (t.additional_charges || 0));
                }
            });

            const result = Array.from(driverMap.values()).map(row => {
                row.revenue_per_trip = row.trip_count > 0 ? row.total_revenue / row.trip_count : 0;
                return row;
            });

            if (filters.searchPromise) {
                const search = filters.searchPromise.toLowerCase();
                return result.filter(r => r.driver_code.toLowerCase().includes(search) || r.full_name.toLowerCase().includes(search));
            }

            return result;
        }
    });
};

export interface FleetReportRow {
    group_name: string; // Group by Vehicle Type or Status
    items_count: number;
    trip_count: number;
    total_revenue: number;
    total_expense: number;
    profit: number;
    profit_margin_pct: number;
}

export const useFleetReport = (filters: ReportFilters, groupBy: 'vehicle_type' | 'status') => {
    // Reuse vehicle report logic to get base data, then group it
    const { data: vehicleData, isLoading } = useVehicleReport(filters);

    const fleetData = vehicleData ? Object.values(vehicleData.reduce((acc, row) => {
        // Determine group key
        const key = groupBy === 'vehicle_type' ? (row.vehicle_type || 'Khác') : (row.status || 'Khác');

        if (!acc[key]) {
            acc[key] = {
                group_name: key,
                items_count: 0,
                trip_count: 0,
                total_revenue: 0,
                total_expense: 0,
                profit: 0,
                profit_margin_pct: 0
            };
        }

        acc[key].items_count++;
        acc[key].trip_count += row.trip_count;
        acc[key].total_revenue += row.total_revenue;
        acc[key].total_expense += row.total_expense;
        acc[key].profit += row.profit;

        return acc;
    }, {} as Record<string, FleetReportRow>)) : [];

    // Calculate margin
    fleetData.forEach(row => {
        row.profit_margin_pct = row.total_revenue ? (row.profit / row.total_revenue) * 100 : 0;
    });

    return { data: fleetData, isLoading };
};
