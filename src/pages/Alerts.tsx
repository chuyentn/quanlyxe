import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Calendar, Truck, User, Settings } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import { useExpenses } from "@/hooks/useExpenses";
import { useCustomers } from "@/hooks/useCustomers";
import { format, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useState } from "react";


export default function Alerts() {
    const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
    const { data: drivers = [], isLoading: isLoadingDrivers } = useDrivers();
    const { data: expenses = [], isLoading: isLoadingExpenses } = useExpenses();
    const { data: customers = [], isLoading: isLoadingCustomers } = useCustomers();



    // Helper to determine status based on expiry date
    const getExpiryStatus = (dateStr: string | null) => {
        if (!dateStr) return { status: "unknown", color: "bg-gray-100 text-gray-800", label: "Chưa cập nhật" };

        const daysLeft = differenceInDays(new Date(dateStr), new Date());

        if (daysLeft < 0) return { status: "expired", color: "bg-red-100 text-red-800", label: "Đã hết hạn" };
        if (daysLeft <= 7) return { status: "critical", color: "bg-red-100 text-red-800", label: `Còn ${daysLeft} ngày` };
        if (daysLeft <= 30) return { status: "warning", color: "bg-yellow-100 text-yellow-800", label: `Còn ${daysLeft} ngày` };
        return { status: "safe", color: "bg-green-100 text-green-800", label: `Còn ${daysLeft} ngày` };
    };

    const vehicleWarnings = vehicles.filter(v => {
        const maintStatus = getExpiryStatus((v as any).next_maintenance_date);
        const regStatus = getExpiryStatus((v as any).registration_expiry);
        const insuranceStatus = getExpiryStatus((v as any).insurance_expiry);
        return maintStatus.status !== 'safe' || regStatus.status !== 'safe' || insuranceStatus.status !== 'safe';
    });

    const maintenanceWarnings = vehicles.filter(v => {
        const maintStatus = getExpiryStatus((v as any).next_maintenance_date);
        return maintStatus.status !== 'safe';
    });

    const driverWarnings = drivers.filter(d => {
        const licenseStatus = getExpiryStatus(d.license_expiry);
        const healthStatus = getExpiryStatus((d as any).health_check_expiry);
        return licenseStatus.status !== 'safe' || healthStatus.status !== 'safe';
    });

    const licenseWarnings = drivers.filter(d => {
        const licenseStatus = getExpiryStatus(d.license_expiry);
        return licenseStatus.status !== 'safe';
    });

    const expenseWarnings = expenses.filter(e => (e.amount || 0) > 10000000); // Pending threshold logic
    // Mocking debt warnings as no direct field available yet - checking logic later
    const debtWarnings = customers.slice(0, 0); // Placeholder

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Cảnh Báo & Nhắc Nhở"
                description="Theo dõi các cảnh báo quan trọng về xe và tài xế"
            />

            <Tabs defaultValue="vehicles" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="vehicles" className="gap-2">
                        <Truck className="w-4 h-4" />
                        Cảnh báo xe
                        {vehicleWarnings.length > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                {vehicleWarnings.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="drivers" className="gap-2">
                        <User className="w-4 h-4" />
                        Cảnh báo tài xế
                        {driverWarnings.length > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                {driverWarnings.length}
                            </Badge>
                        )}
                    </TabsTrigger>

                    <TabsTrigger value="maintenance" className="gap-2">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Bảo trì</Badge>
                        Cảnh báo bảo trì
                        {maintenanceWarnings.length > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                {maintenanceWarnings.length}
                            </Badge>
                        )}
                    </TabsTrigger>

                    <TabsTrigger value="licenses" className="gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">GPLX</Badge>
                        Cảnh báo bằng lái
                        {licenseWarnings.length > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                {licenseWarnings.length}
                            </Badge>
                        )}
                    </TabsTrigger>

                    <TabsTrigger value="expenses" className="gap-2">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Chi phí</Badge>
                        Cảnh báo chi phí
                        {expenseWarnings.length > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                {expenseWarnings.length}
                            </Badge>
                        )}
                    </TabsTrigger>

                    <TabsTrigger value="debt" className="gap-2">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Công nợ</Badge>
                        Nhắc nhở công nợ
                    </TabsTrigger>

                    <TabsTrigger value="drivers" className="gap-2">
                        <User className="w-4 h-4" />
                        Tổng hợp tài xế
                        {driverWarnings.length > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                {driverWarnings.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="vehicles">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tình trạng phương tiện</CardTitle>
                            <CardDescription>Danh sách phương tiện cần chú ý bảo trì hoặc gia hạn giấy tờ</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px] w-full rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3">Biển số</th>
                                            <th className="px-6 py-3">Loại xe</th>
                                            <th className="px-6 py-3">Bảo trì kế tiếp</th>
                                            <th className="px-6 py-3">Đăng kiểm</th>
                                            <th className="px-6 py-3">Bảo hiểm</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingVehicles ? (
                                            <tr><td colSpan={5} className="text-center py-4">Đang tải dữ liệu...</td></tr>
                                        ) : vehicles.map((vehicle) => {
                                            const maint = getExpiryStatus((vehicle as any).next_maintenance_date);
                                            const reg = getExpiryStatus((vehicle as any).registration_expiry);
                                            const ins = getExpiryStatus((vehicle as any).insurance_expiry);

                                            return (
                                                <tr key={vehicle.id} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{vehicle.license_plate}</td>
                                                    <td className="px-6 py-4">{vehicle.brand} - {vehicle.model}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${maint.color}`}>
                                                            {(vehicle as any).next_maintenance_date ? format(new Date((vehicle as any).next_maintenance_date), 'dd/MM/yyyy') : 'N/A'}
                                                            <span className="block text-[10px] opacity-75">{maint.label}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${reg.color}`}>
                                                            {(vehicle as any).registration_expiry ? format(new Date((vehicle as any).registration_expiry), 'dd/MM/yyyy') : 'N/A'}
                                                            <span className="block text-[10px] opacity-75">{reg.label}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ins.color}`}>
                                                            {(vehicle as any).insurance_expiry ? format(new Date((vehicle as any).insurance_expiry), 'dd/MM/yyyy') : 'N/A'}
                                                            <span className="block text-[10px] opacity-75">{ins.label}</span>
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="drivers">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tình trạng tài xế</CardTitle>
                            <CardDescription>Danh sách tài xế sắp hết hạn bằng lái hoặc giấy khám sức khỏe</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px] w-full rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3">Họ tên</th>
                                            <th className="px-6 py-3">Số bằng lái</th>
                                            <th className="px-6 py-3">Hạng bằng</th>
                                            <th className="px-6 py-3">Hết hạn bằng lái</th>
                                            <th className="px-6 py-3">Hết hạn khám SK</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingDrivers ? (
                                            <tr><td colSpan={5} className="text-center py-4">Đang tải dữ liệu...</td></tr>
                                        ) : drivers.map((driver) => {
                                            const license = getExpiryStatus(driver.license_expiry);
                                            const health = getExpiryStatus((driver as any).health_check_expiry);

                                            return (
                                                <tr key={driver.id} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        {driver.full_name}
                                                        <div className="text-xs text-gray-500">{driver.phone}</div>
                                                    </td>
                                                    <td className="px-6 py-4">{driver.license_number}</td>
                                                    <td className="px-6 py-4">{driver.license_class}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${license.color}`}>
                                                            {driver.license_expiry ? format(new Date(driver.license_expiry), 'dd/MM/yyyy') : 'N/A'}
                                                            <span className="block text-[10px] opacity-75">{license.label}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${health.color}`}>
                                                            {(driver as any).health_check_expiry ? format(new Date((driver as any).health_check_expiry), 'dd/MM/yyyy') : 'N/A'}
                                                            <span className="block text-[10px] opacity-75">{health.label}</span>
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="maintenance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cảnh báo bảo trì đến hạn</CardTitle>
                            <CardDescription>Nhận thông báo khi xe sắp đến hạn bảo trì</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px] w-full rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3">Biển số</th>
                                            <th className="px-6 py-3">Loại xe</th>
                                            <th className="px-6 py-3">Bảo trì kế tiếp</th>
                                            <th className="px-6 py-3">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingVehicles ? (
                                            <tr><td colSpan={4} className="text-center py-4">Đang tải dữ liệu...</td></tr>
                                        ) : maintenanceWarnings.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Không có xe nào cần bảo trì</td></tr>
                                        ) : maintenanceWarnings.map((vehicle) => {
                                            const maint = getExpiryStatus((vehicle as any).next_maintenance_date);
                                            return (
                                                <tr key={vehicle.id} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{vehicle.license_plate}</td>
                                                    <td className="px-6 py-4">{vehicle.brand} - {vehicle.model}</td>
                                                    <td className="px-6 py-4">
                                                        {(vehicle as any).next_maintenance_date ? format(new Date((vehicle as any).next_maintenance_date), 'dd/MM/yyyy') : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${maint.color}`}>
                                                            {maint.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="licenses">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cảnh báo GPLX hết hạn</CardTitle>
                            <CardDescription>Nhận thông báo khi giấy phép lái xe sắp hết hạn</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px] w-full rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3">Tài xế</th>
                                            <th className="px-6 py-3">Số bằng lái</th>
                                            <th className="px-6 py-3">Ngày hết hạn</th>
                                            <th className="px-6 py-3">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingDrivers ? (
                                            <tr><td colSpan={4} className="text-center py-4">Đang tải dữ liệu...</td></tr>
                                        ) : licenseWarnings.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Không có giấy phép sắp hết hạn</td></tr>
                                        ) : licenseWarnings.map((driver) => {
                                            const license = getExpiryStatus(driver.license_expiry);
                                            return (
                                                <tr key={driver.id} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{driver.full_name}</td>
                                                    <td className="px-6 py-4">{driver.license_number}</td>
                                                    <td className="px-6 py-4">
                                                        {driver.license_expiry ? format(new Date(driver.license_expiry), 'dd/MM/yyyy') : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${license.color}`}>
                                                            {license.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="expenses">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cảnh báo chi phí bất thường</CardTitle>
                            <CardDescription>Thông báo khi chi phí vượt ngưỡng cho phép (10,000,000 đ)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px] w-full rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3">Mã phiếu</th>
                                            <th className="px-6 py-3">Mô tả</th>
                                            <th className="px-6 py-3">Số tiền</th>
                                            <th className="px-6 py-3">Ngày chi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingExpenses ? (
                                            <tr><td colSpan={4} className="text-center py-4">Đang tải dữ liệu...</td></tr>
                                        ) : expenseWarnings.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Không có chi phí bất thường</td></tr>
                                        ) : expenseWarnings.map((expense) => {
                                            return (
                                                <tr key={expense.id} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{expense.expense_code}</td>
                                                    <td className="px-6 py-4">{expense.description}</td>
                                                    <td className="px-6 py-4 text-red-600 font-bold">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expense.amount || 0)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {expense.expense_date ? format(new Date(expense.expense_date), 'dd/MM/yyyy') : 'N/A'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="debt">
                    <Card>
                        <CardHeader>
                            <CardTitle>Nhắc nhở công nợ quá hạn</CardTitle>
                            <CardDescription>Thông báo khi khách hàng có công nợ quá hạn</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground">
                                <p>Phân hệ Quản lý Công nợ & Thanh toán chưa được kích hoạt trong phiên bản này.</p>
                                <p className="text-sm mt-2">Vui lòng liên hệ quản trị viên để biết thêm chi tiết.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
