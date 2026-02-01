import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Truck, User, MapPin, Calendar, Clock, DollarSign, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateTrip, useUpdateTrip, useTripsByDateRange } from "@/hooks/useTrips";
import { useVehicles } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import { useRoutes } from "@/hooks/useRoutes";
import { useCustomers } from "@/hooks/useCustomers";
import { formatCurrency } from "@/lib/formatters";

// Schema Validation
// Mapping: route.standard_freight_rate -> trip.freight_revenue
//          route.toll_cost -> trip.additional_charges
const tripSchema = z.object({
    trip_code: z.string().optional(), // Auto-generated if empty
    departure_date: z.string().min(1, "Ngày khởi hành là bắt buộc"),
    departure_time: z.string().min(1, "Giờ khởi hành là bắt buộc"),
    customer_id: z.string().min(1, "Khách hàng là bắt buộc"),
    route_id: z.string().min(1, "Tuyến đường là bắt buộc"),
    vehicle_id: z.string().min(1, "Xe là bắt buộc"),
    driver_id: z.string().min(1, "Tài xế là bắt buộc"),
    cargo_description: z.string().optional(),
    freight_revenue: z.coerce.number().min(0, "Cước vận chuyển phải >= 0"),
    additional_charges: z.coerce.number().min(0, "Phí cầu đường phải >= 0"),
    notes: z.string().optional(),
    status: z.enum(['draft', 'confirmed', 'dispatched', 'in_progress', 'completed', 'cancelled', 'closed']),
});

type TripFormValues = z.infer<typeof tripSchema>;

interface DispatchTripDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedTrip?: any | null; // Replace 'any' with Trip type if available
    selectedDate?: Date; // Default date if creating new
}

export function DispatchTripDrawer({
    open,
    onOpenChange,
    selectedTrip,
    selectedDate,
}: DispatchTripDrawerProps) {
    const { toast } = useToast();
    const createMutation = useCreateTrip();
    const updateMutation = useUpdateTrip();

    // Load Data for Options
    const { data: vehicles } = useVehicles();
    const { data: drivers } = useDrivers();
    const { data: routes } = useRoutes();
    const { data: customers } = useCustomers();

    // Load Trips for Availability Check (Same Day)
    const queryDate = selectedTrip?.departure_date || (selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const { data: dayTrips } = useTripsByDateRange(queryDate, queryDate);

    const form = useForm<TripFormValues>({
        resolver: zodResolver(tripSchema),
        defaultValues: {
            trip_code: "",
            departure_date: format(new Date(), 'yyyy-MM-dd'),
            departure_time: "08:00",
            customer_id: "",
            route_id: "",
            vehicle_id: "",
            driver_id: "",
            cargo_description: "",
            freight_revenue: 0,
            additional_charges: 0,
            notes: "",
            status: "draft",
        },
    });

    // Watch for changes to calculate defaults or check availability
    const selectedVehicleId = form.watch("vehicle_id");
    const selectedDriverId = form.watch("driver_id");
    const selectedRouteId = form.watch("route_id");
    const selectedDepartureDate = form.watch("departure_date");
    const currentFreightRevenue = form.watch("freight_revenue");
    const currentAdditionalCharges = form.watch("additional_charges");

    // Get selected route data for reference display
    const selectedRoute = routes?.find(r => r.id === selectedRouteId);

    // Reset form when Dialog opens/changes
    useEffect(() => {
        if (open) {
            if (selectedTrip) {
                form.reset({
                    trip_code: selectedTrip.trip_code,
                    departure_date: selectedTrip.departure_date ? format(parseISO(selectedTrip.departure_date), 'yyyy-MM-dd') : "",
                    departure_time: selectedTrip.departure_date ? new Date(selectedTrip.departure_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : "08:00",
                    customer_id: selectedTrip.customer_id || "",
                    route_id: selectedTrip.route_id || "",
                    vehicle_id: selectedTrip.vehicle_id || "",
                    driver_id: selectedTrip.driver_id || "",
                    cargo_description: selectedTrip.cargo_description || "",
                    freight_revenue: selectedTrip.freight_revenue || 0,
                    additional_charges: selectedTrip.additional_charges || 0,
                    notes: selectedTrip.notes || "",
                    status: selectedTrip.status || "draft",
                });
            } else {
                form.reset({
                    trip_code: "",
                    departure_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                    departure_time: "08:00",
                    customer_id: "",
                    route_id: "",
                    vehicle_id: "",
                    driver_id: "",
                    cargo_description: "",
                    freight_revenue: 0,
                    additional_charges: 0,
                    notes: "",
                    status: "draft",
                });
            }
        }
    }, [open, selectedTrip, selectedDate, form]);

    // Auto-fill Revenue from Route (ONLY when creating new and fields are empty)
    useEffect(() => {
        if (selectedRouteId && routes && !selectedTrip) {
            const route = routes.find(r => r.id === selectedRouteId);
            if (route) {
                // Only auto-fill if field is currently 0 (empty/default)
                if (currentFreightRevenue === 0 && route.standard_freight_rate) {
                    form.setValue("freight_revenue", route.standard_freight_rate);
                }
                if (currentAdditionalCharges === 0 && route.toll_cost) {
                    form.setValue("additional_charges", route.toll_cost);
                }
            }
        }
    }, [selectedRouteId, routes, selectedTrip, form, currentFreightRevenue, currentAdditionalCharges]);

    // Apply Route Price Handler (manual button - always overwrites)
    const handleApplyRoutePrice = () => {
        if (!selectedRoute) {
            toast({
                title: "Chưa chọn tuyến",
                description: "Vui lòng chọn tuyến đường trước.",
                variant: "destructive",
            });
            return;
        }

        if (!selectedRoute.standard_freight_rate && !selectedRoute.toll_cost) {
            toast({
                title: "Tuyến chưa có giá",
                description: "Tuyến đường này chưa được cấu hình đơn giá chuẩn.",
                variant: "destructive",
            });
            return;
        }

        // Apply route prices
        if (selectedRoute.standard_freight_rate) {
            form.setValue("freight_revenue", selectedRoute.standard_freight_rate);
        }
        if (selectedRoute.toll_cost) {
            form.setValue("additional_charges", selectedRoute.toll_cost);
        }

        toast({
            title: "Đã áp dụng giá tuyến",
            description: `Cước: ${formatCurrency(selectedRoute.standard_freight_rate || 0)}, Phí cầu đường: ${formatCurrency(selectedRoute.toll_cost || 0)}`,
        });
    };

    // Handle Submit
    const onSubmit = async (data: TripFormValues) => {
        try {
            // Check for conflicts
            if (!selectedTrip && dayTrips) {
                const conflict = dayTrips.find(t =>
                    (t.vehicle_id === data.vehicle_id || t.driver_id === data.driver_id) &&
                    t.status !== 'cancelled' && t.status !== 'completed'
                );

                if (conflict) {
                    const isVehicleConflict = conflict.vehicle_id === data.vehicle_id;
                    const confirm = window.confirm(
                        `Cảnh báo: ${isVehicleConflict ? 'Xe' : 'Tài xế'} này đã có chuyến ${conflict.trip_code} trong ngày ${data.departure_date}. Bạn có chắc chắn muốn tiếp tục không?`
                    );
                    if (!confirm) return;
                }
            }

            // Format Date+Time for saving
            const combinedDateTime = `${data.departure_date}T${data.departure_time}:00`;

            const payload = {
                ...data,
                vehicle_id: data.vehicle_id, // Ensure UUID
                driver_id: data.driver_id,   // Ensure UUID
                customer_id: data.customer_id === "none" ? null : data.customer_id,
                route_id: data.route_id === "none" ? null : data.route_id,
                // Don't send status if creating new, default is draft (handled by DB default usually, but schema has it, so optional)
                status: data.status,
                departure_date: combinedDateTime, // Save as ISO timestamp
            };

            // Remove non-DB fields if necessary (trip_code handled by DB trigger optionally, but here we pass it if exists or empty)
            if (!payload.trip_code) delete payload.trip_code;

            if (selectedTrip) {
                await updateMutation.mutateAsync({
                    id: selectedTrip.id,
                    updates: { ...payload, updated_at: new Date().toISOString() } as any, // Cast to any to bypass strict type check for now
                });
            } else {
                await createMutation.mutateAsync({
                    ...payload,
                    trip_code: payload.trip_code || `TRIP-${Date.now()}`, // Fallback if no DB trigger
                } as any);
            }

            onOpenChange(false);
        } catch (error) {
            console.error(error);
            // Toast handled by hook
        }
    };

    // Filter Active Vehicles/Drivers
    const activeVehicles = vehicles?.filter(v => v.status === 'active' && !v.is_deleted) || [];
    const activeDrivers = drivers?.filter(d => d.status === 'active' && !d.is_deleted) || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-primary" />
                        {selectedTrip ? `Chi tiết chuyến: ${selectedTrip.trip_code}` : "Tạo chuyến xe mới"}
                    </DialogTitle>
                    <DialogDescription>
                        {selectedTrip
                            ? "Xem và cập nhật thông tin chuyến vận chuyển."
                            : "Lập kế hoạch vận chuyển mới cho đội xe."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* 1. Lịch trình */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormItem className="col-span-1">
                                <FormLabel>Ngày khởi hành</FormLabel>
                                <div className="flex gap-2">
                                    <FormField
                                        control={form.control}
                                        name="departure_date"
                                        render={({ field }) => (
                                            <FormControl>
                                                <DatePicker
                                                    value={field.value ? parseISO(field.value) : undefined}
                                                    onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                                />
                                            </FormControl>
                                        )}
                                    />
                                </div>
                                <FormMessage />
                            </FormItem>

                            <FormItem className="col-span-1">
                                <FormLabel>Giờ xuất phát</FormLabel>
                                <FormField
                                    control={form.control}
                                    name="departure_time"
                                    render={({ field }) => (
                                        <div className="relative">
                                            <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input type="time" className="pl-9" {...field} />
                                        </div>
                                    )}
                                />
                            </FormItem>

                            <FormField
                                control={form.control}
                                name="trip_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mã chuyến (Tự động)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="TRIP-..." {...field} disabled />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* 2. Thông tin chính */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                            {/* Khách hàng - Tuyến */}
                            <FormField
                                control={form.control}
                                name="customer_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Khách hàng *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn khách hàng" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[200px]">
                                                {customers?.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.customer_name} ({c.short_name || c.customer_code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="route_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tuyến đường *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn tuyến đường" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[200px]">
                                                {routes?.map((r) => (
                                                    <SelectItem key={r.id} value={r.id}>
                                                        {r.route_name} ({r.distance_km}km)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* 3. Phân công */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                            <FormField
                                control={form.control}
                                name="vehicle_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex justify-between">
                                            Xe vận chuyển *
                                            {/* Basic Availability Indicator */}
                                            {field.value && dayTrips?.some(t => t.vehicle_id === field.value && t.id !== selectedTrip?.id) && (
                                                <span className="text-xs text-amber-600 font-medium animate-pulse">Xe đang có chuyến khác!</span>
                                            )}
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn xe" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[200px]">
                                                {activeVehicles.map((v) => (
                                                    <SelectItem key={v.id} value={v.id}>
                                                        {v.vehicle_code} - {v.license_plate} ({v.vehicle_type || 'N/A'})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="driver_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex justify-between">
                                            Tài xế phụ trách *
                                            {field.value && dayTrips?.some(t => t.driver_id === field.value && t.id !== selectedTrip?.id) && (
                                                <span className="text-xs text-amber-600 font-medium animate-pulse">Tài xế đang có chuyến khác!</span>
                                            )}
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn tài xế" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[200px]">
                                                {activeDrivers.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>
                                                        {d.full_name} ({d.driver_code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* 4. Hàng hóa & Doanh thu */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                            <FormField
                                control={form.control}
                                name="cargo_description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Thông tin hàng hóa</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="VD: 20 tấn xi măng..." className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Route Info Panel */}
                            {selectedRoute && (
                                <div className="p-3 rounded-lg bg-muted/50 border border-dashed space-y-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                                        <span>📋 Giá tuyến tham khảo</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-[10px] px-2"
                                            onClick={handleApplyRoutePrice}
                                        >
                                            Áp dụng giá tuyến
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Cước chuẩn:</span>
                                            <span className="font-medium">{formatCurrency(selectedRoute.standard_freight_rate || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Phí cầu đường:</span>
                                            <span className="font-medium">{formatCurrency(selectedRoute.toll_cost || 0)}</span>
                                        </div>
                                        {selectedRoute.distance_km && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Khoảng cách:</span>
                                                <span className="font-medium">{selectedRoute.distance_km} km</span>
                                            </div>
                                        )}
                                        {selectedRoute.estimated_duration_hours && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Thời gian:</span>
                                                <span className="font-medium">{selectedRoute.estimated_duration_hours}h</span>
                                            </div>
                                        )}
                                    </div>
                                    {!selectedRoute.standard_freight_rate && (
                                        <div className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                            ⚠️ Tuyến chưa có cước chuẩn, vui lòng nhập tay
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Pricing Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="freight_revenue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cước vận chuyển (VND)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" className="pl-9 font-medium text-right" {...field} />
                                            </div>
                                        </FormControl>
                                        <div className="text-xs text-muted-foreground text-right">
                                            {formatCurrency(Number(field.value))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="additional_charges"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phí cầu đường (VND)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" className="pl-9 font-medium text-right" {...field} />
                                            </div>
                                        </FormControl>
                                        <div className="text-xs text-muted-foreground text-right">
                                            {formatCurrency(Number(field.value))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Estimated Total */}
                            <div className="flex flex-col justify-center p-3 rounded-lg bg-green-50 border border-green-200">
                                <span className="text-xs text-muted-foreground mb-1">Thành tiền dự kiến</span>
                                <span className="text-lg font-bold text-green-700">
                                    {formatCurrency(currentFreightRevenue + currentAdditionalCharges)}
                                </span>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ghi chú</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Ghi chú thêm về chuyến đi..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 5. Trạng thái (Chỉ hiện khi Edit) */}
                        {selectedTrip && (
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem className="border-t pt-4">
                                        <FormLabel>Trạng thái chuyến</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Trạng thái" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="draft">Nháp</SelectItem>
                                                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                                                <SelectItem value="dispatched">Đã điều xe</SelectItem>
                                                <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                                                <SelectItem value="completed">Hoàn thành</SelectItem>
                                                <SelectItem value="cancelled">Hủy</SelectItem>
                                                <SelectItem value="closed">Đóng (Kế toán)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Hủy bỏ
                            </Button>
                            <Button type="submit">
                                {selectedTrip ? "Lưu thay đổi" : "Tạo chuyến mới"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
