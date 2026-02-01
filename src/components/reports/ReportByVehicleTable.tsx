import { useState, useMemo } from "react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExcelDataTable, ColumnDef } from "./ExcelDataTable";
import { ExcelFilterBar, FilterState } from "./ExcelFilterBar";
import { ColumnPicker } from "./ColumnPicker";
import { ExportButtons } from "./ExportButtons";
import { RowDetailDrawer } from "./RowDetailDrawer";
import { useVehicleReport, VehicleReportRow } from "@/hooks/useReportData";
import { startOfMonth, endOfMonth, format } from "date-fns";
import * as XLSX from 'xlsx';
import { useTripsByDateRange } from "@/hooks/useTrips";
import { DrillDownTripTable } from "./DrillDownTripTable";

export function ReportByVehicleTable() {
  const [filters, setFilters] = useState<FilterState>({
    searchPromise: "",
    dateRange: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    status: [],
    vehicleIds: [],
    driverIds: []
  });

  const { data: reportData, isLoading, refetch } = useVehicleReport(filters);
  const [selectedRow, setSelectedRow] = useState<VehicleReportRow | null>(null);

  // Fetch all trips for drill down (optimize: only fetch when drawer is open? 
  // For now fetch all to be responsive is fine for small scale, 
  // or better: useTripsByDateRange is cached if used correctly)
  const { data: allTrips, isLoading: isLoadingTrips } = useTripsByDateRange(
    filters.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : '',
    filters.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : ''
  );

  const selectedTrips = useMemo(() => {
    if (!selectedRow || !allTrips) return [];
    return allTrips.filter(t => t.vehicle_id === selectedRow.vehicle_id);
  }, [selectedRow, allTrips]);

  // Column definitions
  const [columns, setColumns] = useState<ColumnDef<VehicleReportRow>[]>([
    {
      id: "vehicle_code",
      label: "Mã xe",
      width: "100px",
      render: (row) => <span className="font-medium text-primary">{row.vehicle_code}</span>,
      pinned: true,
      visible: true
    },
    {
      id: "license_plate",
      label: "Biển số",
      width: "120px",
      render: (row) => <span className="font-bold">{row.license_plate}</span>,
      pinned: true,
      visible: true
    },
    {
      id: "status",
      label: "Trạng thái",
      width: "120px",
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
          {row.status === 'active' ? 'Hoạt động' : row.status}
        </Badge>
      ),
      visible: true
    },
    {
      id: "vehicle_type",
      label: "Loại xe",
      width: "150px",
      render: (row) => row.vehicle_type,
      visible: true
    },
    {
      id: "trip_count",
      label: "Số chuyến",
      align: "center",
      width: "100px",
      render: (row) => formatNumber(row.trip_count),
      footer: (data) => formatNumber(data.reduce((sum, r) => sum + r.trip_count, 0)),
      visible: true
    },
    {
      id: "total_distance_km",
      label: "Tổng Km",
      align: "right",
      width: "120px",
      render: (row) => formatNumber(row.total_distance_km) + " km",
      footer: (data) => formatNumber(data.reduce((sum, r) => sum + r.total_distance_km, 0)),
      visible: true
    },
    {
      id: "total_revenue",
      label: "Doanh thu",
      align: "right",
      width: "150px",
      render: (row) => <span className="font-medium text-green-600">{formatCurrency(row.total_revenue)}</span>,
      footer: (data) => formatCurrency(data.reduce((sum, r) => sum + r.total_revenue, 0)),
      visible: true
    },
    {
      id: "fuel_cost",
      label: "Chi phí NL",
      align: "right",
      width: "140px",
      render: (row) => formatCurrency(row.fuel_cost),
      footer: (data) => formatCurrency(data.reduce((sum, r) => sum + r.fuel_cost, 0)),
      visible: true
    },
    {
      id: "toll_cost",
      label: "Phí cầu đường",
      align: "right",
      width: "140px",
      render: (row) => formatCurrency(row.toll_cost),
      footer: (data) => formatCurrency(data.reduce((sum, r) => sum + r.toll_cost, 0)),
      visible: false
    },
    {
      id: "other_cost",
      label: "Phí khác",
      align: "right",
      width: "120px",
      render: (row) => formatCurrency(row.other_cost),
      footer: (data) => formatCurrency(data.reduce((sum, r) => sum + r.other_cost, 0)),
      visible: false
    },
    {
      id: "total_expense",
      label: "Tổng Khấu hao & CP",
      align: "right",
      width: "160px",
      render: (row) => <span className="text-red-600">{formatCurrency(row.total_expense)}</span>,
      footer: (data) => formatCurrency(data.reduce((sum, r) => sum + r.total_expense, 0)),
      visible: true
    },
    {
      id: "profit",
      label: "Lợi nhuận",
      align: "right",
      width: "160px",
      render: (row) => (
        <span className={row.profit >= 0 ? "text-green-700 font-bold" : "text-red-700 font-bold"}>
          {formatCurrency(row.profit)}
        </span>
      ),
      footer: (data) => formatCurrency(data.reduce((sum, r) => sum + r.profit, 0)),
      visible: true
    },
    {
      id: "profit_margin_pct",
      label: "Biên LN %",
      align: "right",
      width: "100px",
      render: (row) => (
        <span className={row.profit_margin_pct >= 20 ? "text-green-700 font-bold" : row.profit_margin_pct < 10 ? "text-red-600" : ""}>
          {formatPercent(row.profit_margin_pct / 100)}
        </span>
      ),
      // Average margin weighted by revenue? Or simple average? Let's do Overall Margin
      footer: (data) => {
        const totalRev = data.reduce((sum, r) => sum + r.total_revenue, 0);
        const totalProfit = data.reduce((sum, r) => sum + r.profit, 0);
        return totalRev ? formatPercent(totalProfit / totalRev) : "0%";
      },
      visible: true
    }
  ]);

  const toggleColumn = (id: string, visible: boolean) => {
    setColumns(prev => prev.map(col => col.id === id ? { ...col, visible } : col));
  };

  const resetColumns = () => {
    setColumns(prev => prev.map(col => ({ ...col, visible: true })));
  };

  const handleExport = (type: 'csv' | 'xlsx' | 'pdf') => {
    if (!reportData || reportData.length === 0) {
      alert("Không có dữ liệu để xuất");
      return;
    }

    if (type === 'pdf') {
      alert("Tính năng xuất PDF đang được phát triển. Vui lòng sử dụng 'In' (Ctrl+P) hoặc xuất Excel.");
      return;
    }

    // Map data to export format (Vietnamese headers)
    const exportData = reportData.map(row => ({
      "Mã xe": row.vehicle_code,
      "Biển số": row.license_plate,
      "Trạng thái": row.status === 'active' ? 'Hoạt động' : row.status,
      "Loại xe": row.vehicle_type,
      "Số chuyến": row.trip_count,
      "Tổng Km": row.total_distance_km,
      "Doanh thu": row.total_revenue,
      "Chi phí NL": row.fuel_cost,
      "Phí cầu đường": row.toll_cost,
      "Phí khác": row.other_cost,
      "Tổng Chi phí": row.total_expense,
      "Lợi nhuận": row.profit,
      "Biên LN (%)": (row.profit_margin_pct / 100).toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BaoCaoXe");

    // Generate file
    if (type === 'csv') {
      XLSX.writeFile(wb, `BaoCao_Xe_${format(new Date(), 'ddMMyyyy')}.csv`);
    } else {
      XLSX.writeFile(wb, `BaoCao_Xe_${format(new Date(), 'ddMMyyyy')}.xlsx`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <ExcelFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onRefresh={refetch}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Hiển thị <strong>{reportData?.length || 0}</strong> xe
        </div>
        <div className="flex items-center gap-2">
          <ColumnPicker
            columns={columns.map(c => ({ id: c.id, label: c.label, visible: c.visible !== false }))}
            onToggleColumn={toggleColumn}
            onReset={resetColumns}
          />
          <ExportButtons onExport={handleExport} />
        </div>
      </div>

      {/* Main Table */}
      <div className="h-[600px] border rounded-md bg-card">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ExcelDataTable
            data={reportData || []}
            columns={columns}
            onRowClick={setSelectedRow}
          />
        )}
      </div>

      {/* Drill Down Drawer */}
      <RowDetailDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        title={`Chi tiết xe ${selectedRow?.vehicle_code} - ${selectedRow?.license_plate}`}
        description="Danh sách chuyến và chi phí liên quan trong kỳ báo cáo"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-100">
              <div className="text-xs text-muted-foreground">Doanh thu</div>
              <div className="text-lg font-bold text-green-700">{formatCurrency(selectedRow?.total_revenue || 0)}</div>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-100">
              <div className="text-xs text-muted-foreground">Chi phí</div>
              <div className="text-lg font-bold text-red-700">{formatCurrency(selectedRow?.total_expense || 0)}</div>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
              <div className="text-xs text-muted-foreground">Lợi nhuận</div>
              <div className="text-lg font-bold text-blue-700">{formatCurrency(selectedRow?.profit || 0)}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="text-xs text-muted-foreground">Số chuyến</div>
              <div className="text-lg font-bold">{selectedRow?.trip_count}</div>
            </div>
          </div>

          <div className="bg-muted/30 p-2 rounded-lg">
            <div className="text-sm font-semibold mb-2 px-2">Danh sách chuyến trong kỳ:</div>
            <DrillDownTripTable trips={selectedTrips} isLoading={isLoadingTrips} />
          </div>
        </div>
      </RowDetailDrawer>
    </div>
  );
}
