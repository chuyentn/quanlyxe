import { useState, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ExcelImportDialog, ImportColumn } from "@/components/shared/ExcelImportDialog";
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
import { Wallet, Receipt, Fuel, Wrench, Users, Loader2, Trash2, RefreshCw } from "lucide-react";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { useVehiclesByStatus } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import { useTrips } from "@/hooks/useTrips";
import { useClosedPeriods, isDateInClosedPeriod } from '@/hooks/useAccountingPeriods';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

// Types
type Expense = Database['public']['Tables']['expenses']['Row'] & {
  category?: Database['public']['Tables']['expense_categories']['Row'] | null;
  vehicle?: Database['public']['Tables']['vehicles']['Row'] | null;
  driver?: Database['public']['Tables']['drivers']['Row'] | null;
  trip?: Database['public']['Tables']['trips']['Row'] | null;
};

// Form Schema
const expenseSchema = z.object({
  expense_code: z.string().min(1, "Mã phiếu là bắt buộc"),
  expense_date: z.string().min(1, "Ngày chi là bắt buộc"),
  category_id: z.string().min(1, "Loại chi phí là bắt buộc"),
  amount: z.coerce.number().min(0, "Số tiền phải lớn hơn hoặc bằng 0"),
  description: z.string().min(1, "Diễn giải là bắt buộc"),
  trip_id: z.string().optional().nullable(),
  vehicle_id: z.string().optional().nullable(),
  driver_id: z.string().optional().nullable(),
  document_number: z.string().optional().nullable(),
  vendor_name: z.string().optional().nullable(),
  status: z.enum(['draft', 'confirmed', 'cancelled'] as const),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const categoryIcons: Record<string, typeof Fuel> = {
  fuel: Fuel,
  toll: Receipt,
  labor: Users,
  maintenance: Wrench,
  other: Wallet,
};

export default function Expenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Import Columns Config
  const importColumns: ImportColumn[] = [
    { key: 'expense_code', header: 'Mã phiếu', required: true },
    { key: 'expense_date', header: 'Ngày chi', required: true, type: 'date' },
    { key: 'category_name', header: 'Loại chi phí', required: true },
    { key: 'amount', header: 'Số tiền', required: true, type: 'number' },
    { key: 'description', header: 'Diễn giải', required: true },
    { key: 'license_plate', header: 'Biển số xe' },
    { key: 'trip_code', header: 'Mã chuyến' },
    { key: 'driver_code', header: 'Mã tài xế' },
    { key: 'document_number', header: 'Số chứng từ' },
    { key: 'vendor_name', header: 'Nhà cung cấp' },
  ];

  // Data Hooks
  const { data: expenses, isLoading } = useExpenses();
  const { data: vehicles } = useVehiclesByStatus('active');
  const { data: drivers } = useDrivers();
  const { data: trips } = useTrips(); // You might want to filter this for active/recent trips only if too many
  const { data: closedPeriods } = useClosedPeriods();

  // Expense Categories Hook
  const { data: categories } = useQuery({
    queryKey: ['expense_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_deleted', false);
      if (error) throw error;
      return data;
    }
  });

  // Mutation Hooks
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  // Form setup
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_code: "",
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      category_id: "",
      amount: 0,
      description: "",
      status: 'draft',
      trip_id: null,
      vehicle_id: null,
      driver_id: null,
    },
  });

  // Handlers
  const handleAdd = () => {
    setSelectedExpense(null);
    form.reset({
      expense_code: `CP-${new Date().getFullYear()}${new Date().getMonth() + 1}-${Math.floor(Math.random() * 1000)}`,
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      category_id: "",
      amount: 0,
      description: "",
      status: 'draft',
      trip_id: null,
      vehicle_id: null,
      driver_id: null,
    });
    setDialogOpen(true);
  };

  const handleRowClick = (expense: Expense) => {
    // Prevent editing if expense date is in a closed accounting period
    if (isDateInClosedPeriod(expense.expense_date, closedPeriods)) {
      toast({ title: 'Phiếu chi bị khóa', description: 'Phiếu chi này nằm trong kỳ đã đóng. Không thể chỉnh sửa.', variant: 'destructive' });
      return;
    }

    setSelectedExpense(expense);
    form.reset({
      expense_code: expense.expense_code,
      expense_date: format(parseISO(expense.expense_date), 'yyyy-MM-dd'),
      category_id: expense.category_id,
      amount: expense.amount || 0,
      description: expense.description || "",
      trip_id: expense.trip_id,
      vehicle_id: expense.vehicle_id,
      driver_id: expense.driver_id,
      document_number: expense.document_number,
      vendor_name: expense.vendor_name,
      status: expense.status || 'draft',
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, expense: Expense) => {
    e.stopPropagation();
    setSelectedExpense(expense);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedExpense) return;
    try {
      await deleteMutation.mutateAsync(selectedExpense.id);
      setDeleteDialogOpen(false);
      setSelectedExpense(null);
    } catch (error) {
      // handled by hook
    }
  };

  const onSubmit = async (data: ExpenseFormValues) => {
    const processedData = {
      ...data,
      trip_id: data.trip_id === "none" ? null : data.trip_id,
      vehicle_id: data.vehicle_id === "none" ? null : data.vehicle_id,
      driver_id: data.driver_id === "none" ? null : data.driver_id,
      document_number: data.document_number || null,
      vendor_name: data.vendor_name || null,
    };

    try {
      if (selectedExpense) {
        await updateMutation.mutateAsync({
          id: selectedExpense.id,
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
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: "Đồng bộ thành công", description: "Dữ liệu chi phí đã cập nhật" });
    } catch (error) {
      toast({ title: "Lỗi đồng bộ", description: "Không thể cập nhật dữ liệu", variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    import('@/lib/export').then(({ exportToCSV }) => {
      exportToCSV(expenses || [], 'Danh_sach_chi_phi', [
        { key: 'expense_code', header: 'Mã phiếu' },
        { key: 'expense_date', header: 'Ngày chi' },
        { key: 'category.category_name', header: 'Loại chi phí' },
        { key: 'description', header: 'Diễn giải' },
        { key: 'amount', header: 'Số tiền' },
        { key: 'status', header: 'Trạng thái' },
      ]);
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const handleImportData = async (rows: any[]) => {
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        // 1. Lookup Category
        const categoryName = String(row.category_name || '').toLowerCase();
        const category = categories?.find(c => c.category_name.toLowerCase().includes(categoryName));
        if (!category && row.category_name) {
          console.warn(`Category not found: ${row.category_name}`);
        }
        // If not found, one strategy is to create or error. Here we error to be safe, or use a default? 
        // Let's assume user must provide valid category or we skip.
        if (!category) throw new Error(`Không tìm thấy loại chi phí: ${row.category_name}`);

        // 2. Lookup Vehicle
        let vehicleId = null;
        if (row.license_plate) {
          const vehicle = vehicles?.find(v => v.license_plate.toLowerCase() === String(row.license_plate).toLowerCase());
          vehicleId = vehicle?.id;
        }

        // 3. Lookup Trip
        let tripId = null;
        if (row.trip_code) {
          const trip = trips?.find(t => t.trip_code.toLowerCase() === String(row.trip_code).toLowerCase());
          tripId = trip?.id;
        }

        // 4. Lookup Driver
        let driverId = null;
        if (row.driver_code) {
          const driver = drivers?.find(d => d.driver_code.toLowerCase() === String(row.driver_code).toLowerCase());
          driverId = driver?.id;
        }

        await createMutation.mutateAsync({
          expense_code: String(row.expense_code || `CP-${Date.now()}`),
          expense_date: String(row.expense_date),
          category_id: category.id,
          amount: Number(row.amount) || 0,
          description: String(row.description),
          vehicle_id: vehicleId,
          trip_id: tripId,
          driver_id: driverId,
          document_number: row.document_number ? String(row.document_number) : null,
          vendor_name: row.vendor_name ? String(row.vendor_name) : null,
          status: 'draft',
        });
        successCount++;
      } catch (error) {
        errorCount++;
        console.error("Import error", error);
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['expenses'] });

    toast({
      title: "Nhập chi phí thành công",
      description: `Đã nhập ${successCount} phiếu chi${errorCount > 0 ? `, ${errorCount} lỗi` : ''}`,
    });
  };

  // Filter data based on search query
  const filteredExpenses = (expenses || []).filter(expense => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      expense.expense_code?.toLowerCase().includes(query) ||
      expense.description?.toLowerCase().includes(query) ||
      expense.category?.category_name?.toLowerCase().includes(query)
    );
  });

  const totalAmount = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

  const columns = useMemo<Column<Expense>[]>(() => [
    {
      key: 'expense_code',
      header: 'Mã phiếu',
      width: '120px',
      render: (value) => <span className="font-mono font-medium">{value as string}</span>,
    },
    {
      key: 'expense_date',
      header: 'Ngày',
      width: '100px',
      render: (value) => formatDate(value as string),
    },
    {
      key: 'category',
      header: 'Loại chi phí',
      render: (_, row) => {
        const catType = row.category?.category_type || 'other';
        const Icon = categoryIcons[catType] || Wallet;
        return (
          <span className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            {row.category?.category_name || 'Khác'}
          </span>
        );
      },
    },
    {
      key: 'description',
      header: 'Diễn giải',
    },
    {
      key: 'trip_id',
      header: 'Chuyến',
      render: (value, row) => row.trip ? (
        <span className="font-mono text-sm">{row.trip.trip_code}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: 'amount',
      header: 'Số tiền',
      align: 'right',
      render: (value) => <span className="tabular-nums font-medium">{formatCurrency(value as number)}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '130px',
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
        title="Nhập Liệu Chi Phí"
        description={`Tổng chi phí: ${formatCurrency(totalAmount)}`}
      />

      <DataTable
        data={filteredExpenses}
        columns={columns}
        selectable
        searchPlaceholder="Tìm theo mã phiếu, diễn giải..."
        onAdd={handleAdd}
        addLabel="Thêm phiếu chi"
        onRowClick={handleRowClick}
        onExport={handleExport}
        onImport={handleImport}
        onSearch={handleSearch}
        onSync={handleSyncAll}
        isSyncing={isSyncing}
      />

      {/* Hidden file input for import */}
      <ExcelImportDialog
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImportData}
        entityName="chi phí"
        columns={importColumns}
        sampleData={[
          {
            expense_code: 'CP-001',
            expense_date: '2024-02-01',
            category_name: 'Nhiên liệu',
            amount: 2000000,
            description: 'Đổ dầu xe 29C-12345',
            license_plate: '29C-12345',
            vendor_name: 'Cây xăng A'
          }
        ]}
        // No unique code check needed for expenses usually, but maybe expense_code
        existingCodes={expenses?.map(e => e.expense_code) || []}
        codeField="expense_code"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              {selectedExpense ? 'Chi tiết phiếu chi' : 'Thêm phiếu chi mới'}
            </DialogTitle>
            <DialogDescription>
              {selectedExpense
                ? `Mã phiếu: ${selectedExpense.expense_code}`
                : 'Nhập thông tin chi phí phát sinh'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expense_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã phiếu *</FormLabel>
                      <FormControl>
                        <Input placeholder="CP-2024..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expense_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày huy *</FormLabel>
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
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại chi phí *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.category_name}
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số tiền (VND) *</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
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
                        <FormLabel>Diễn giải *</FormLabel>
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
                  name="trip_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chuyến hàng (nếu có)</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                        defaultValue={field.value || "none"}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn chuyến" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">-- Không chọn --</SelectItem>
                          {trips?.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.trip_code}
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
                  name="vehicle_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xe (nếu có)</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                        defaultValue={field.value || "none"}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn xe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">-- Không chọn --</SelectItem>
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
                  name="document_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số chứng từ</FormLabel>
                      <FormControl>
                        <Input placeholder="HD00123" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendor_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nhà cung cấp</FormLabel>
                      <FormControl>
                        <Input placeholder="Tên NCC" {...field} value={field.value || ''} />
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
                          <SelectItem value="draft">Nháp</SelectItem>
                          <SelectItem value="confirmed">Đã xác nhận</SelectItem>
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
                  {selectedExpense ? 'Cập nhật' : 'Thêm mới'}
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
              Hành động này sẽ xóa phiếu chi <strong>{selectedExpense?.expense_code}</strong>.
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
