import { useState, useMemo } from "react";
import { DataTable, Column } from "@/components/shared/DataTable";
import { formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { DashboardAlertRow } from "../types";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import { useVehiclesByStatus } from "@/hooks/useVehicles";
import { useActiveDrivers } from "@/hooks/useDrivers";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { addDays, isBefore, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useQueryClient } from "@tanstack/react-query";

export const DashboardAlertsTab = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { data: vehicles, isLoading: isLoadingVehicles, isError: isErrorVehicles } = useVehiclesByStatus('active');
    const { data: drivers, isLoading: isLoadingDrivers, isError: isErrorDrivers } = useActiveDrivers();

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [severityFilter, setSeverityFilter] = useState<string>("all");

    // Severity options
    const severityOptions = [
        { value: 'high', label: 'Cao (đã/sắp hết hạn)' },
        { value: 'medium', label: 'Trung bình (còn < 15 ngày)' },
        { value: 'low', label: 'Thấp (còn < 30 ngày)' },
    ];

    // Derive Alerts
    const alerts = useMemo(() => {
        if (!vehicles || !drivers) return [];
        const allAlerts: DashboardAlertRow[] = [];
        const now = new Date();
        const days7 = addDays(now, 7);
        const days15 = addDays(now, 15);
        const days30 = addDays(now, 30);

        // 1. Vehicle Alerts
        vehicles.forEach(v => {
            // Registration
            if (v.registration_expiry_date) {
                const date = parseISO(v.registration_expiry_date);
                let severity: 'high' | 'medium' | 'low' | null = null;
                if (isBefore(date, now)) severity = 'high';
                else if (isBefore(date, days15)) severity = 'medium';
                else if (isBefore(date, days30)) severity = 'low';

                if (severity) {
                    allAlerts.push({
                        id: `reg-${v.id}`,
                        alert_type: 'registration',
                        severity,
                        entity_type: 'vehicle',
                        entity_name: v.license_plate,
                        message: `Đăng kiểm ${isBefore(date, now) ? 'đã hết hạn' : 'sắp hết hạn'} (${formatDate(v.registration_expiry_date)})`,
                        created_at: new Date().toISOString() // Dynamic
                    });
                }
            }

            // Insurance
            if (v.insurance_expiry_date) {
                const date = parseISO(v.insurance_expiry_date);
                let severity: 'high' | 'medium' | 'low' | null = null;
                if (isBefore(date, now)) severity = 'high';
                else if (isBefore(date, days15)) severity = 'medium';
                else if (isBefore(date, days30)) severity = 'low';

                if (severity) {
                    allAlerts.push({
                        id: `ins-${v.id}`,
                        alert_type: 'insurance',
                        severity,
                        entity_type: 'vehicle',
                        entity_name: v.license_plate,
                        message: `Bảo hiểm ${isBefore(date, now) ? 'đã hết hạn' : 'sắp hết hạn'} (${formatDate(v.insurance_expiry_date)})`,
                        created_at: new Date().toISOString()
                    });
                }
            }
        });

        // 2. Driver Alerts
        drivers.forEach(d => {
            // License
            if (d.license_expiry) {
                const date = parseISO(d.license_expiry);
                let severity: 'high' | 'medium' | 'low' | null = null;
                if (isBefore(date, now)) severity = 'high';
                else if (isBefore(date, days15)) severity = 'medium';
                else if (isBefore(date, days30)) severity = 'low';

                if (severity) {
                    allAlerts.push({
                        id: `lic-${d.id}`,
                        alert_type: 'license',
                        severity,
                        entity_type: 'driver',
                        entity_name: d.full_name,
                        message: `Bằng lái ${isBefore(date, now) ? 'đã hết hạn' : 'sắp hết hạn'} (${formatDate(d.license_expiry)})`,
                        created_at: new Date().toISOString()
                    });
                }
            }
        });

        // Filter Alerts
        return allAlerts.filter(alert => {
            // Search
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!alert.entity_name.toLowerCase().includes(query) && !alert.message.toLowerCase().includes(query)) return false;
            }

            // Severity
            if (severityFilter !== "all" && severityFilter) {
                if (alert.severity !== severityFilter) return false;
            }

            // Date Range (Optional creation date filter? Maybe not relevant for calculated alerts, 
            // but we can filter by "due date" if we stored it, or just ignore date range for now as these are "current status" alerts)

            return true;
        });

    }, [vehicles, drivers, searchQuery, severityFilter]);

    const columns = useMemo<Column<DashboardAlertRow>[]>(() => [
        {
            key: 'severity',
            header: 'Mức độ',
            width: '120px',
            render: (v) => {
                const val = v as string;
                if (val === 'high') return <Badge variant="destructive" className="gap-1 animate-pulse"><AlertCircle className="w-3 h-3" /> Cao</Badge>;
                if (val === 'medium') return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 gap-1"><AlertTriangle className="w-3 h-3" /> Trung bình</Badge>;
                return <Badge variant="outline" className="gap-1 text-slate-600"><Info className="w-3 h-3" /> Thấp</Badge>;
            }
        },
        { key: 'entity_name', header: 'Đối tượng', width: '150px', render: (v) => <span className="font-semibold">{v as string}</span> },
        { key: 'message', header: 'Nội dung cảnh báo', render: (v) => <span className="text-sm">{v as string}</span> },
        {
            key: 'entity_type',
            header: 'Loại',
            width: '100px',
            render: (v) => v === 'vehicle' ? <Badge variant="outline">Xe</Badge> : <Badge variant="outline">Tài xế</Badge>
        },
    ], []);

    // Error handling
    if (isErrorVehicles || isErrorDrivers) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive">
                <AlertTriangle className="w-12 h-12 mb-4" />
                <h3 className="text-lg font-semibold">Không thể tải dữ liệu cảnh báo</h3>
                <p className="text-sm text-muted-foreground">Vui lòng kiểm tra kết nối hoặc quyền truy cập.</p>
                <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['maintenance_alerts'] })}>Tải lại trang</Button>
            </div>
        );
    }

    if (isLoadingVehicles || isLoadingDrivers) {
        return (
            <div className="flex flex-col justify-center p-8 min-h-[400px] items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <div className="text-xs text-muted-foreground bg-slate-100 p-2 rounded">
                    <p>DEBUG INFO:</p>
                    <p>Loading Vehicles: {isLoadingVehicles ? 'TRUE' : 'FALSE'}</p>
                    <p>Loading Drivers: {isLoadingDrivers ? 'TRUE' : 'FALSE'}</p>
                    <p>Vehicles Data: {vehicles ? `Found ${vehicles.length}` : 'NULL'}</p>
                    <p>Drivers Data: {drivers ? `Found ${drivers.length}` : 'NULL'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-orange-800">Trung Tâm Cảnh Báo</h3>
                <div className="text-sm font-medium bg-orange-50 text-orange-700 px-3 py-1 rounded-md border border-orange-200 shadow-sm">
                    Tổng số cảnh báo: <span className="font-bold text-lg ml-1">{alerts.length}</span>
                </div>
            </div>

            <DashboardFilterBar
                onSearchChange={setSearchQuery}
                onDateRangeChange={setDateRange}
                onFilterChange={(type, val) => setSeverityFilter(val)}
                showStatusFilter={true}
                statusOptions={severityOptions}
                placeholder="Tìm cảnh báo xe, tài xế..."
            />

            <DataTable
                data={alerts}
                columns={columns}
                searchPlaceholder="Tìm kiếm..."
                emptyMessage="Không có cảnh báo nào cần xử lý."
                hideToolbar={true}
            />
        </div>
    );
}
