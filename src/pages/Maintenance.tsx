import { useState, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/formatters";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Wrench, AlertTriangle, Loader2, Trash2, RefreshCw } from "lucide-react";
import { useMaintenanceOrders, useCreateMaintenanceOrder, useUpdateMaintenanceOrder, useDeleteMaintenanceOrder } from "@/hooks/useMaintenance";
import { useVehiclesByStatus } from "@/hooks/useVehicles";
import { useQueryClient } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";

// Types
type Maintenance = Database['public']['Tables']['maintenance_orders']['Row'] & {
  vehicle?: Database['public']['Tables']['vehicles']['Row'] | null;
};

// Form Schema
const maintenanceSchema = z.object({
  order_code: z.string().min(1, "Mã lệnh là bắt buộc"),
  vehicle_id: z.string().min(1, "Xe là bắt buộc"),
  maintenance_type: z.enum(['routine', 'repair', 'inspection', 'tire', 'other'] as const),
  description: z.string().min(1, "Mô tả công việc là bắt buộc"),
  scheduled_date: z.string().min(1, "Ngày dự kiến là bắt buộc"),
  vendor_name: z.string().optional().nullable(),
  odometer_at_service: z.coerce.number().min(0).nullable(),
  labor_cost: z.coerce.number().min(0).nullable(),
  parts_cost: z.coerce.number().min(0).nullable(),
  next_service_km: z.coerce.number().min(0).nullable(),
  next_service_date: z.string().optional().nullable(),
  completed_at: z.string().optional().nullable(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled'] as const),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

const maintenanceTypeLabels: Record<string, string> = {
  routine: 'Bảo dưỡng định kỳ',
  repair: 'Sửa chữa',
  inspection: 'Đăng kiểm',
  tire: 'Lốp xe',
  other: 'Khác',
};

export default function Maintenance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Maintenance | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  // Data Hooks
  const { data: orders, isLoading } = useMaintenanceOrders();
  const { data: vehicles } = useVehiclesByStatus('active');

  // Mutation Hooks
  const createMutation = useCreateMaintenanceOrder();
  const updateMutation = useUpdateMaintenanceOrder();
  const deleteMutation = useDeleteMaintenanceOrder();

  // Form setup
  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      order_code: "",
      vehicle_id: "",
      maintenance_type: 'routine',
      description: "",
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'scheduled',
      labor_cost: 0,
      parts_cost: 0,
      odometer_at_service: 0,
    },
  });

  // Handlers
  const handleAdd = () => {
    setSelectedOrder(null);
    form.reset({
      order_code: `BT-${new Date().getFullYear()}${new Date().getMonth() + 1}-${Math.floor(Math.random() * 1000)}`,
      vehicle_id: "",
      maintenance_type: 'routine',
      description: "",
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'scheduled',
      labor_cost: 0,
      parts_cost: 0,
      odometer_at_service: 0,
      vendor_name: "",
      next_service_km: 0,
      next_service_date: "",
      completed_at: "",
    });
    setDialogOpen(true);
  };

  const handleRowClick = (order: Maintenance) => {
    setSelectedOrder(order);
    form.reset({
      order_code: order.order_code,
      vehicle_id: order.vehicle_id,
      maintenance_type: order.maintenance_type as "routine" | "repair" | "inspection" | "tire" | "other",
      description: order.description,
      scheduled_date: format(parseISO(order.scheduled_date), 'yyyy-MM-dd'),
      vendor_name: order.vendor_name,
      odometer_at_service: order.odometer_at_service || 0,
      labor_cost: order.labor_cost || 0,
      parts_cost: order.parts_cost || 0,
      next_service_km: order.next_service_km || 0,
      next_service_date: order.next_service_date ? format(parseISO(order.next_service_date), 'yyyy-MM-dd') : "",
      completed_at: order.completed_at ? format(parseISO(order.completed_at), 'yyyy-MM-dd') : "",
      status: order.status || 'scheduled',
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = useCallback((e: React.MouseEvent, order: Maintenance) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!selectedOrder) return;
    try {
      await deleteMutation.mutateAsync(selectedOrder.id);
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      // handled by hook
    }
  };

  const onSubmit = async (data: MaintenanceFormValues) => {
    const processedData = {
      ...data,
      next_service_date: data.next_service_date === "" ? null : data.next_service_date,
      completed_at: data.completed_at === "" ? null : data.completed_at,
    };

    try {
      if (selectedOrder) {
        await updateMutation.mutateAsync({
          id: selectedOrder.id,
          updates: processedData,
        });
      } else {
        await createMutation.mutateAsync(processedData);
      }
      setDialogOpen(false);
    } catch (error) {
      // handled by hook
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast({ title: "Đồng bộ thành công", description: "Dữ liệu bảo trì đã cập nhật" });
    } catch (error) {
      toast({ title: "Lỗi đồng bộ", description: "Không thể cập nhật dữ liệu", variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    import('@/lib/export').then(({ exportToCSV }) => {
      exportToCSV(orders || [], 'Danh_sach_bao_tri', [
        { key: 'order_code', header: 'Mã lệnh' },
        { key: 'vehicle.license_plate', header: 'Xe' },
        { key: 'maintenance_type', header: 'Loại bảo trì' },
        { key: 'scheduled_date', header: 'Ngày dự kiến' },
        { key: 'completed_at', header: 'Ngày hoàn thành' },
        { key: 'total_cost', header: 'Chi phí' },
        { key: 'status', header: 'Trạng thái' },
      ]);
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const { importFromFile } = await import('@/lib/export');
      const importedData = await importFromFile(file, [
        { key: 'order_code', header: 'Mã lệnh', required: true },
        { key: 'maintenance_type', header: 'Loại bảo trì', required: true },
        { key: 'scheduled_date', header: 'Ngày dự kiến', required: true },
        { key: 'description', header: 'Mô tả' },
        { key: 'total_cost', header: 'Chi phí' },
      ]);

      let successCount = 0;
      let errorCount = 0;

      for (const data of importedData) {
        try {
          await createMutation.mutateAsync({
            ...data,
            total_cost: data.total_cost ? Number(data.total_cost) : 0,
            status: 'scheduled',
          });
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['maintenance_orders'] });

      toast({
        title: "Nhập lệnh bảo trì thành công",
        description: `Đã nhập ${successCount} lệnh${errorCount > 0 ? `, ${errorCount} lỗi` : ''}`,
      });
    } catch (error) {
      toast({
        title: "Lỗi nhập file",
        description: error instanceof Error ? error.message : "Không thể nhập file",
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Filter data based on search query
  const filteredOrders = (orders || []).filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.order_code?.toLowerCase().includes(query) ||
      order.vehicle?.license_plate?.toLowerCase().includes(query) ||
      order.maintenance_type?.toLowerCase().includes(query)
    );
  });

  const scheduledCount = orders?.filter(o => o.status === 'scheduled').length || 0;
  const totalCost = orders?.reduce((sum, o) => sum + (o.total_cost || 0), 0) || 0;

  const columns = useMemo<Column<Maintenance>[]>(() => [
    {
      key: 'order_code',
      header: 'Mã lệnh',
      width: '120px',
      render: (value) => <span className="font-mono font-medium">{value as string}</span>,
    },
    {
      key: 'vehicle',
      header: 'Biển số xe',
      render: (_, row) => <span className="font-mono">{row.vehicle?.license_plate || 'N/A'}</span>,
    },
    {
      key: 'maintenance_type',
      header: 'Loại bảo trì',
      render: (value) => maintenanceTypeLabels[value as string] || value,
    },
    {
      key: 'description',
      header: 'Mô tả công việc',
    },
    {
      key: 'scheduled_date',
      header: 'Ngày dự kiến',
      render: (value) => formatDate(value as string),
    },
    {
      key: 'total_cost',
      header: 'Chi phí',
      align: 'right',
      render: (value) => <span className="tabular-nums">{formatCurrency(value as number)}</span>,
    },
    {
      key: 'vendor_name',
      header: 'Nhà cung cấp',
      render: (value) => value ? (value as string) : <span className="text-muted-foreground">-</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '140px',
      render: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: 'id',
      header: '',
      width: '50px',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => handleDeleteClick(e, row)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
    }
  ], [handleDeleteClick]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Bảo Trì – Sửa Chữa"
        description={`${scheduledCount} lệnh đang chờ thực hiện • Tổng chi phí: ${formatCurrency(totalCost)}`}
        actions={
          scheduledCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 text-warning rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4" />
              {scheduledCount} lệnh sắp đến hạn
            </div>
          )
        }
      />

      <DataTable
        data={filteredOrders}
        columns={columns}
        selectable
        searchPlaceholder="Tìm theo mã lệnh, mô tả..."
        onAdd={handleAdd}
        addLabel="Tạo lệnh bảo trì"
        onRowClick={handleRowClick}
        onExport={handleExport}
        onImport={handleImport}
        onSearch={handleSearch}
        onSync={handleSyncAll}
        isSyncing={isSyncing}
      />

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              {selectedOrder ? 'Chi tiết lệnh bảo trì' : 'Tạo lệnh bảo trì mới'}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder
                ? `Mã lệnh: ${selectedOrder.order_code}`
                : 'Nhập thông tin bảo trì xe'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="order_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã lệnh *</FormLabel>
                      <FormControl>
                        <Input placeholder="BT-2024..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicle_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xe *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn xe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicles?.map(v => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.license_plate}
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
                  name="maintenance_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại bảo trì *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="routine">Bảo dưỡng định kỳ</SelectItem>
                          <SelectItem value="repair">Sửa chữa</SelectItem>
                          <SelectItem value="inspection">Đăng kiểm</SelectItem>
                          <SelectItem value="tire">Lốp xe</SelectItem>
                          <SelectItem value="other">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduled_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày dự kiến *</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value ? parseISO(field.value) : undefined}
                          onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-1 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả công việc *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Chi tiết..." rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="vendor_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nhà cung cấp/Garage</FormLabel>
                      <FormControl>
                        <Input placeholder="Tên garage..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="odometer_at_service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Odo lúc bảo trì</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value || 0} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="labor_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chi phí nhân công</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value || 0} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parts_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chi phí phụ tùng</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value || 0} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="next_service_km"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Km bảo trì tiếp theo</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value || 0} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="next_service_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày bảo trì tiếp theo</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value ? parseISO(field.value) : undefined}
                          onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="completed_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày hoàn thành</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value ? parseISO(field.value) : undefined}
                          onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                          <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                          <SelectItem value="completed">Hoàn thành</SelectItem>
                          <SelectItem value="cancelled">Đã hủy</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {selectedOrder ? 'Cập nhật' : 'Tạo lệnh'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa lệnh bảo trì <strong>{selectedOrder?.order_code}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
