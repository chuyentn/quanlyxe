import { useState } from "react";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import {
    Truck,
    Package,
    Wallet,
    TrendingUp,
    Users,
    AlertTriangle,
    Calendar,
    Wrench,
    Loader2,
    Filter
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Sector,
} from "recharts";
import { useNavigate } from "react-router-dom";
import {
    useDashboardStats,
    useMonthlyTrend,
    useExpenseBreakdown,
    useRecentTrips,
    useMaintenanceAlerts,
    useDriverPerformance,
} from "@/hooks/useDashboard";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfMonth, endOfMonth, subDays, format, startOfDay, endOfDay } from "date-fns";

export function DashboardOverview() {
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState("this_month");
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    // Calculate Date Range
    const now = new Date();
    let startDate: string;
    let endDate: string;

    switch (dateRange) {
        case "today":
            startDate = format(startOfDay(now), 'yyyy-MM-dd');
            endDate = format(endOfDay(now), 'yyyy-MM-dd');
            break;
        case "7_days":
            startDate = format(subDays(now, 7), 'yyyy-MM-dd');
            endDate = format(now, 'yyyy-MM-dd');
            break;
        case "this_month":
        default:
            startDate = format(startOfMonth(now), 'yyyy-MM-dd');
            endDate = format(endOfMonth(now), 'yyyy-MM-dd');
            break;
    }

    // Fetch real data
    const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats(startDate, endDate);
    const { data: trendData, isLoading: trendLoading, error: trendError } = useMonthlyTrend(6);
    const { data: expenseData, isLoading: expenseLoading, error: expenseError } = useExpenseBreakdown(startDate, endDate);
    const { data: recentTripsData, isLoading: recentLoading, error: recentError } = useRecentTrips(5);
    const { data: maintenanceData, isLoading: maintenanceLoading, error: maintenanceError } = useMaintenanceAlerts();
    const { data: driverPerf, isLoading: driverLoading, error: driverError } = useDriverPerformance(5);

    // Fallback colors if no data
    const chartColors = [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))',
    ];

    const withColor = (expenseData || []).map((item, idx) => ({
        ...item,
        color: chartColors[idx % chartColors.length]
    }));

    // Calculate previous month for trend (simple approximation for comparison)
    // Note: API might need adjustment for correct "previous period" based on selection, 
    // but for now we stick to previous month comparison as per existing logic.
    const prevStartDate = format(startOfMonth(subDays(startOfMonth(now), 1)), 'yyyy-MM-dd');
    const prevEndDate = format(endOfMonth(subDays(startOfMonth(now), 1)), 'yyyy-MM-dd');
    const { data: prevStats } = useDashboardStats(prevStartDate, prevEndDate);

    // Safe calculations for trends
    const revenueTrend = stats && prevStats
        ? ((stats.official.revenue - prevStats.official.revenue) / (prevStats.official.revenue || 1)) * 100
        : 0;

    const profitTrend = stats && prevStats
        ? ((stats.official.profit - prevStats.official.profit) / (prevStats.official.profit || 1)) * 100
        : 0;

    // Custom Active Shape for Pie Chart
    const renderActiveShape = (props: any) => {
        const RADIAN = Math.PI / 180;
        const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
        const sin = Math.sin(-RADIAN * midAngle);
        const cos = Math.cos(-RADIAN * midAngle);
        const sx = cx + (outerRadius + 10) * cos;
        const sy = cy + (outerRadius + 10) * sin;
        const mx = cx + (outerRadius + 30) * cos;
        const my = cy + (outerRadius + 30) * sin;
        const ex = mx + (cos >= 0 ? 1 : -1) * 22;
        const ey = my;
        const textAnchor = cos >= 0 ? 'start' : 'end';

        return (
            <g>
                <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-xl font-bold">
                    {/* Center text handled by separate text element for better control, 
                        or we can show selected item info here if desired */}
                </text>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />
                <Sector
                    cx={cx}
                    cy={cy}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    innerRadius={outerRadius + 6}
                    outerRadius={outerRadius + 10}
                    fill={fill}
                />
            </g>
        );
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border text-popover-foreground px-3 py-2 rounded-lg shadow-md text-sm">
                    <p className="font-semibold mb-1">{payload[0].name}</p>
                    <p className="text-primary font-mono">{formatCurrency(payload[0].value)}</p>
                    <p className="text-muted-foreground text-xs">{(payload[0].payload.percentage).toFixed(1)}% tổng chi phí</p>
                </div>
            );
        }
        return null;
    };



    // REMOVED: Global blocking loader
    // if (statsLoading || trendLoading || ...) { ... }

    // Error logic remains, but maybe we should allow partial errors?
    // For now, let's keep global error if ALL fail, or maybe toast specific errors?
    // Let's keep the existing error block but maybe make it less aggressive or specific.
    if (statsError && trendError && expenseError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive">
                <AlertTriangle className="w-12 h-12 mb-4" />
                <h3 className="text-lg font-semibold">Đã xảy ra lỗi nghiêm trọng</h3>
                <p className="text-sm text-muted-foreground">{statsError.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 animate-fade-in relative">
            {/* Show error toast or banner if partial error? */}

            {/* Date Filter Row */}
            <div className="flex justify-end bg-muted/20 p-2 rounded-lg border">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Thời gian:
                    </span>
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[180px] h-8 bg-background">
                            <SelectValue placeholder="Chọn thời gian" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Hôm nay</SelectItem>
                            <SelectItem value="7_days">7 ngày qua</SelectItem>
                            <SelectItem value="this_month">Tháng này</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div onClick={() => navigate('/reports', { state: { filter: { status: 'closed' } } })} className="cursor-pointer">
                    <StatCard
                        title="Tổng doanh thu"
                        value={statsLoading ? "..." : formatCurrency((stats?.official.revenue || 0) + (stats?.pending.revenue || 0))}
                        subtitle={stats?.pending.revenue ? `(Gồm ${formatCurrency(stats.pending.revenue)} chưa chốt)` : undefined}
                        trend={{ value: revenueTrend, label: "so với tháng trước" }}
                        icon={<Wallet className="w-6 h-6" />}
                        className={statsLoading ? "opacity-50" : ""}
                    />
                </div>

                <div onClick={() => navigate('/reports', { state: { filter: { showProfit: true } } })} className="cursor-pointer">
                    <StatCard
                        title="Lợi nhuận"
                        value={statsLoading ? "..." : formatCurrency((stats?.official.profit || 0) + (stats?.pending.profit || 0))}
                        variant="profit"
                        subtitle={stats?.pending.profit ? `(Gồm ${formatCurrency(stats.pending.profit)} tạm tính)` : undefined}
                        trend={{ value: profitTrend, label: "so với tháng trước" }}
                        icon={<TrendingUp className="w-6 h-6" />}
                        className={statsLoading ? "opacity-50" : ""}
                    />
                </div>

                <StatCard
                    title="Chuyến hàng"
                    value={statsLoading ? "..." : formatNumber((stats?.official.count || 0) + (stats?.pending.count || 0))}
                    subtitle={statsLoading ? "Đang tải..." : `${stats?.inProgress.count || 0} đang thực hiện`}
                    icon={<Package className="w-6 h-6" />}
                    className={statsLoading ? "opacity-50" : ""}
                />

                <StatCard
                    title="Hệ thống"
                    value={statsLoading ? "..." : `${stats?.official.count || 0} / ${(stats?.official.count || 0) + (stats?.pending.count || 0)}`}
                    subtitle="chuyến đã đóng"
                    icon={<Truck className="w-6 h-6" />}
                    className={statsLoading ? "opacity-50" : ""}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Doanh thu & Lợi nhuận</CardTitle>
                        <CardDescription>Biểu đồ 6 tháng gần nhất</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center">
                            {trendLoading ? (
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            ) : trendError ? (
                                <p className="text-destructive text-sm">Lỗi tải biểu đồ</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData || []}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="month" className="text-xs" />
                                        <YAxis
                                            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                            className="text-xs"
                                        />
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="hsl(var(--chart-1))"
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                            name="Doanh thu"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="profit"
                                            stroke="hsl(var(--chart-4))"
                                            fillOpacity={1}
                                            fill="url(#colorProfit)"
                                            name="Lợi nhuận"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Expense Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cơ cấu chi phí</CardTitle>
                        <CardDescription>Phân bổ theo loại</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full relative">
                            {expenseLoading ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : expenseError ? (
                                <div className="flex justify-center items-center h-full">
                                    <p className="text-destructive text-sm">Lỗi tải chi phí</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            activeIndex={activeIndex}
                                            activeShape={renderActiveShape}
                                            data={withColor}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                            onMouseEnter={onPieEnter}
                                            onClick={(data) => {
                                                navigate('/reports', {
                                                    state: {
                                                        tab: 'expenses', // Assuming there's an expense tab or we navigate to expense page
                                                        filter: { searchQuery: data.name }
                                                    }
                                                });
                                                // If no reports/expenses, maybe navigate to /expenses
                                                navigate('/expenses?search=' + encodeURIComponent(data.name));
                                            }}
                                            className="cursor-pointer outline-none"
                                        >
                                            {withColor.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                                            <tspan x="50%" dy="-0.5em" fontSize="12" fill="#888">Tổng chi phí</tspan>
                                            <tspan x="50%" dy="1.2em" fontSize="16" fontWeight="bold" fill="#333">
                                                {formatNumber((expenseData || []).reduce((sum, item) => sum + item.value, 0) / 1000000, 1)}M
                                            </tspan>
                                        </text>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-2 mt-4 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                            {!expenseLoading && (expenseData || []).map((item, idx) => (
                                <div
                                    key={item.name}
                                    className={`flex items-center gap-2 text-sm p-1.5 rounded-md transition-colors cursor-pointer ${activeIndex === idx ? 'bg-muted' : 'hover:bg-muted/50'}`}
                                    onMouseEnter={() => setActiveIndex(idx)}
                                    onMouseLeave={() => setActiveIndex(-1)}
                                >
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                                    />
                                    <span className="text-muted-foreground truncate flex-1" title={item.name}>{item.name}</span>
                                    <div className="text-right">
                                        <span className="font-medium block">{formatCurrency(item.value)}</span>
                                        <span className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Trips */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Chuyến hàng gần đây</CardTitle>
                            <CardDescription>Cập nhật mới nhất</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate('/trips')}>
                            Xem tất cả
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : recentError ? (
                            <p className="text-destructive text-center py-4 text-sm">Lỗi tải dữ liệu</p>
                        ) : (
                            <div className="space-y-4">
                                {(recentTripsData || []).map((trip) => (
                                    <div
                                        key={trip.id}
                                        onClick={() => navigate(`/trips`)}
                                        className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 px-2 rounded transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                                                <Truck className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium font-mono text-sm">{trip.trip_code}</p>
                                                <p className="text-xs text-muted-foreground">{formatNumber(trip.cargo_weight_tons || 0, 1)} tấn • {trip.route_name || 'Chưa định tuyến'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-sm">{formatCurrency(trip.total_revenue || 0)}</p>
                                            <StatusBadge status={trip.status as string} />
                                        </div>
                                    </div>
                                ))}
                                {(!recentTripsData || recentTripsData.length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-4">Chưa có chuyến hàng nào.</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Info Column */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Maintenance Alerts */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wrench className="w-5 h-5" />
                                Bảo trì xe
                            </CardTitle>
                            <CardDescription>Lịch bảo trì sắp tới</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {maintenanceLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {(maintenanceData || []).map((alert) => (
                                        <div key={alert.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg border">
                                            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{alert.vehicle?.license_plate}</p>
                                                <p className="text-xs text-muted-foreground">{alert.maintenance_type === 'routine' ? 'Bảo dưỡng định kỳ' : alert.description}</p>
                                                <p className="text-xs text-orange-600 mt-1">
                                                    <Calendar className="w-3 h-3 inline mr-1" />
                                                    {new Date(alert.scheduled_date).toLocaleDateString('vi-VN')}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <StatusBadge status={alert.status as any} />
                                            </div>
                                        </div>
                                    ))}
                                    {(!maintenanceData || maintenanceData.length === 0) && (
                                        <p className="text-sm text-muted-foreground text-center py-4">Không có lịch bảo trì</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Performance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Hiệu suất tài xế
                            </CardTitle>
                            <CardDescription>Top 5 tài xế</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {driverLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {(driverPerf || []).map((driver: any, idx: number) => (
                                        <div key={driver.id || idx} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-sm">{driver.driver_name || driver.full_name || `Tài xế #${idx + 1}`}</p>
                                                <p className="text-xs text-muted-foreground">{formatCurrency(driver.total_profit || 0)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm">{driver.trip_count || 0} chuyến</p>
                                                <p className="text-xs text-muted-foreground">{((driver.profit_margin || 0) * 100).toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!driverPerf || driverPerf.length === 0) && (
                                        <p className="text-sm text-muted-foreground text-center py-4">Chưa có dữ liệu</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
