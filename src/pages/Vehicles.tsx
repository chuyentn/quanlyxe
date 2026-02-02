import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { VehicleMapView } from "@/components/vehicles/VehicleMapView";
import { ColumnChooser } from "@/components/vehicles/ColumnChooser";
import { ExcelFilter } from "@/components/vehicles/ExcelFilter";
import { ExcelImportDialog } from "@/components/shared/ExcelImportDialog";
import { formatNumber, formatDate, formatCurrency } from "@/lib/formatters";
import { importFromFile, exportToCSV } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Filter, Download, Upload, Trash2, RefreshCw, Loader2, Truck, AlertTriangle, MapPin } from "lucide-react";
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle } from "@/hooks/useVehicles";
import { useBulkDelete } from "@/hooks/useBulkDelete";
import { BulkDeleteDialog } from "@/components/shared/BulkDeleteDialog";
import { useQueryClient } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";
import { BulkDeleteToolbar } from "@/components/shared/BulkDeleteToolbar";

const importMap = {
  vehicle_code: 'Mã xe',
  license_plate: 'Biển số',
  vehicle_type: 'Loại xe',
  brand: 'Nhãn hiệu xe',
  capacity_tons: 'Tải trọng',
  fuel_type: 'Nhiên liệu',
  usage_limit_years: 'Niên hạn sử dụng',
  engine_number: 'Số máy',
  chassis_number: 'Số Khung',
  insurance_purchase_date: 'Ngày mua bảo hiểm',
  insurance_expiry_date: 'Ngày hết hạn bảo hiểm',
  insurance_cost: 'Số tiền mua bảo hiểm',
  registration_cycle: 'Chu kỳ đăng kiểm',
  registration_date: 'Ngày đăng kiểm',
  registration_expiry_date: 'Ngày hết hạn đăng kiểm',
  registration_cost: 'Số tiền đăng kiểm',
  current_location: 'Vị trí xe',
  status: 'Trạng thái xe',
  notes: 'Ghi chú'
};

// Type definitions from Supabase
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type NewVehicle = Database['public']['Tables']['vehicles']['Insert'];

// Form Schema Validation - đầy đủ 18 trường theo Excel
const vehicleSchema = z.object({
  vehicle_code: z.string().min(1, "Mã xe là bắt buộc"),
  license_plate: z.string().min(1, "Biển số là bắt buộc"),
  vehicle_type: z.string().min(1, "Loại xe là bắt buộc"),
  brand: z.string().optional(),
  capacity_tons: z.coerce.number().min(0, "Tải trọng phải >= 0").optional(),
  fuel_type: z.string().optional(),
  usage_limit_years: z.string().optional(),
  engine_number: z.string().optional(),
  chassis_number: z.string().optional(),
  insurance_purchase_date: z.string().optional(),
  insurance_expiry_date: z.string().optional(),
  insurance_cost: z.coerce.number().optional(),
  registration_cycle: z.string().optional(),
  registration_date: z.string().optional(),
  registration_expiry_date: z.string().optional(),
  registration_cost: z.coerce.number().optional(),
  current_location: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'maintenance', 'inactive'] as const),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export default function Vehicles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [mapSelectedVehicle, setMapSelectedVehicle] = useState<Vehicle | null>(null);

  // Selection State
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Column visibility state
  const allColumnKeys = [
    'vehicle_code', 'license_plate', 'vehicle_type', 'brand', 'capacity_tons',
    'fuel_type', 'usage_limit_years', 'engine_number', 'chassis_number',
    'insurance_purchase_date', 'insurance_expiry_date', 'insurance_cost',
    'registration_cycle', 'registration_date', 'registration_expiry_date', 'registration_cost',
    'current_location', 'status', 'notes', 'id'
  ];
  const [visibleColumns, setVisibleColumns] = useState<string[]>(allColumnKeys);

  // Excel-style filters state
  const [activeFilters, setActiveFilters] = useState<Record<string, string[] | number | boolean>>({});

  // Import Excel dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Hooks
  const { data: vehicles, isLoading, isError, error } = useVehicles();
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();

  // Bulk Delete Hook
  const { deleteIds: deleteVehicles, isDeleting: isBulkDeleting } = useBulkDelete({
    table: 'vehicles',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setSelectedRowIds(new Set()); // Clear selection
      setBulkDeleteDialogOpen(false);
    }
  });

  // Form setup
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicle_code: "",
      license_plate: "",
      vehicle_type: "",
      brand: "",
      capacity_tons: 0,
      fuel_type: "",
      usage_limit_years: "",
      engine_number: "",
      chassis_number: "",
      insurance_purchase_date: "",
      insurance_expiry_date: "",
      insurance_cost: 0,
      registration_cycle: "",
      registration_date: "",
      registration_expiry_date: "",
      registration_cost: 0,
      current_location: "",
      notes: "",
      status: "active",
    },
  });

  // Handlers
  const handleAdd = () => {
    setSelectedVehicle(null);
    form.reset({
      vehicle_code: `XE-${format(new Date(), 'yyMM')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      license_plate: "",
      vehicle_type: "",
      brand: "",
      capacity_tons: 0,
      fuel_type: "",
      usage_limit_years: "",
      engine_number: "",
      chassis_number: "",
      insurance_purchase_date: "",
      insurance_expiry_date: "",
      insurance_cost: 0,
      registration_cycle: "",
      registration_date: "",
      registration_expiry_date: "",
      registration_cost: 0,
      current_location: "",
      notes: "",
      status: "active",
    });
    setDialogOpen(true);
  };

  const handleRowClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    form.reset({
      vehicle_code: vehicle.vehicle_code,
      license_plate: vehicle.license_plate,
      vehicle_type: vehicle.vehicle_type,
      brand: vehicle.brand || "",
      capacity_tons: vehicle.capacity_tons || 0,
      fuel_type: vehicle.fuel_type || "",
      usage_limit_years: vehicle.usage_limit_years || "",
      engine_number: vehicle.engine_number || "",
      chassis_number: vehicle.chassis_number || "",
      insurance_purchase_date: vehicle.insurance_purchase_date || "",
      insurance_expiry_date: vehicle.insurance_expiry_date || "",
      insurance_cost: vehicle.insurance_cost || 0,
      registration_cycle: vehicle.registration_cycle || "",
      registration_date: vehicle.registration_date || "",
      registration_expiry_date: vehicle.registration_expiry_date || "",
      registration_cost: vehicle.registration_cost || 0,
      current_location: vehicle.current_location || "",
      notes: vehicle.notes || "",
      status: vehicle.status || "active",
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = useCallback((e: React.MouseEvent, vehicle: Vehicle) => {
    e.stopPropagation();
    setSelectedVehicle(vehicle);
    setDeleteDialogOpen(true);
  }, []);

  const handleBulkDelete = () => {
    if (selectedRowIds.size > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    deleteVehicles(Array.from(selectedRowIds));
  };

  const handleSelectAll = () => {
    const allIds = filteredVehicles.map(v => v.id);
    setSelectedRowIds(new Set(allIds));
  };

  const handleClearSelection = () => {
    setSelectedRowIds(new Set());
  };

  const handleConfirmDelete = async () => {
    if (!selectedVehicle) return;
    try {
      await deleteMutation.mutateAsync(selectedVehicle.id);
      setDeleteDialogOpen(false);
      setSelectedVehicle(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const onSubmit = async (data: VehicleFormValues) => {
    // Validate Dates
    if (data.insurance_purchase_date && data.insurance_expiry_date) {
      if (new Date(data.insurance_expiry_date) < new Date(data.insurance_purchase_date)) {
        toast({ title: "Dữ liệu không hợp lệ", description: "Ngày hết hạn bảo hiểm phải sau ngày mua", variant: "destructive" });
        return;
      }
    }
    if (data.registration_date && data.registration_expiry_date) {
      if (new Date(data.registration_expiry_date) < new Date(data.registration_date)) {
        toast({ title: "Dữ liệu không hợp lệ", description: "Ngày hết hạn đăng kiểm phải sau ngày đăng kiểm", variant: "destructive" });
        return;
      }
    }

    // Process data to ensure empty strings are converted to null for optional fields
    const processedData = {
      ...data,
      brand: data.brand || null,
      capacity_tons: data.capacity_tons || null,
      fuel_type: data.fuel_type || null,
      usage_limit_years: data.usage_limit_years || null,
      engine_number: data.engine_number || null,
      chassis_number: data.chassis_number || null,
      insurance_purchase_date: data.insurance_purchase_date || null,
      insurance_expiry_date: data.insurance_expiry_date || null,
      insurance_cost: data.insurance_cost || null,
      registration_cycle: data.registration_cycle || null,
      registration_date: data.registration_date || null,
      registration_expiry_date: data.registration_expiry_date || null,
      registration_cost: data.registration_cost || null,
      current_location: data.current_location || null,
      notes: data.notes || null,
    };

    try {
      if (selectedVehicle) {
        await updateMutation.mutateAsync({
          id: selectedVehicle.id,
          updates: processedData,
        });
      } else {
        await createMutation.mutateAsync(processedData as NewVehicle);
      }
      setDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({ title: "Đồng bộ thành công", description: "Dữ liệu xe đã cập nhật" });
    } catch (error) {
      toast({ title: "Lỗi đồng bộ", description: "Không thể cập nhật dữ liệu", variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    exportToCSV(vehicles || [], 'Danh_sach_xe', [
      { key: 'vehicle_code', header: 'Mã xe' },
      { key: 'license_plate', header: 'Biển số' },
      { key: 'vehicle_type', header: 'Loại xe' },
      { key: 'brand', header: 'Nhãn hiệu xe' },
      { key: 'capacity_tons', header: 'Tải trọng' },
      { key: 'fuel_type', header: 'Nhiên liệu' },
      { key: 'usage_limit_years', header: 'Niên hạn sử dụng' },
      { key: 'engine_number', header: 'Số máy' },
      { key: 'chassis_number', header: 'Số Khung' },
      { key: 'insurance_purchase_date', header: 'Ngày mua bảo hiểm' },
      { key: 'insurance_expiry_date', header: 'Ngày hết hạn bảo hiểm' },
      { key: 'insurance_cost', header: 'Số tiền mua bảo hiểm' },
      { key: 'registration_cycle', header: 'Chu kỳ đăng kiểm' },
      { key: 'registration_date', header: 'Ngày đăng kiểm' },
      { key: 'registration_expiry_date', header: 'Ngày hết hạn đăng kiểm' },
      { key: 'registration_cost', header: 'Số tiền đăng kiểm' },
      { key: 'current_location', header: 'Vị trí xe' },
      { key: 'status', header: 'Trạng thái xe' },
      { key: 'notes', header: 'Ghi chú' },
    ]);
  };

  const handleImport = async () => {
    setImportDialogOpen(true);
  };

  // Handle Excel import data
  const handleExcelImport = async (data: Record<string, unknown>[]) => {
    let successCount = 0;
    for (const row of data) {
      try {
        await createMutation.mutateAsync({
          vehicle_code: String(row.vehicle_code),
          license_plate: String(row.license_plate),
          vehicle_type: String(row.vehicle_type),
          brand: row.brand ? String(row.brand) : null,
          capacity_tons: row.capacity_tons ? Number(row.capacity_tons) : null,
          fuel_type: row.fuel_type ? String(row.fuel_type) : null,
          usage_limit_years: row.usage_limit_years ? String(row.usage_limit_years) : null,
          engine_number: row.engine_number ? String(row.engine_number) : null,
          chassis_number: row.chassis_number ? String(row.chassis_number) : null,
          insurance_purchase_date: row.insurance_purchase_date ? String(row.insurance_purchase_date) : null,
          insurance_expiry_date: row.insurance_expiry_date ? String(row.insurance_expiry_date) : null,
          insurance_cost: row.insurance_cost ? Number(row.insurance_cost) : null,
          registration_cycle: row.registration_cycle ? String(row.registration_cycle) : null,
          registration_date: row.registration_date ? String(row.registration_date) : null,
          registration_expiry_date: row.registration_expiry_date ? String(row.registration_expiry_date) : null,
          registration_cost: row.registration_cost ? Number(row.registration_cost) : null,
          current_location: row.current_location ? String(row.current_location) : null,
          notes: row.notes ? String(row.notes) : null,
          status: (row.status as 'active' | 'inactive' | 'maintenance') || 'active',
        });
        successCount++;
      } catch (error) {
        console.error('Error importing row:', error);
      }
    }
    toast({
      title: `Nhập thành công`,
      description: `Đã nhập ${successCount} xe vào hệ thống`,
    });
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await importFromFile(file, [
        { key: 'vehicle_code', header: 'Mã xe', required: true },
        { key: 'license_plate', header: 'Biển số', required: true },
        { key: 'vehicle_type', header: 'Loại xe', required: true },
        { key: 'brand', header: 'Nhãn hiệu xe' },
        { key: 'capacity_tons', header: 'Tải trọng' },
        { key: 'fuel_type', header: 'Nhiên liệu' },
        { key: 'usage_limit_years', header: 'Niên hạn sử dụng' },
        { key: 'engine_number', header: 'Số máy' },
        { key: 'chassis_number', header: 'Số Khung' },
        { key: 'insurance_purchase_date', header: 'Ngày mua bảo hiểm' },
        { key: 'insurance_expiry_date', header: 'Ngày hết hạn bảo hiểm' },
        { key: 'insurance_cost', header: 'Số tiền mua bảo hiểm' },
        { key: 'registration_cycle', header: 'Chu kỳ đăng kiểm' },
        { key: 'registration_date', header: 'Ngày đăng kiểm' },
        { key: 'registration_expiry_date', header: 'Ngày hết hạn đăng kiểm' },
        { key: 'registration_cost', header: 'Số tiền đăng kiểm' },
        { key: 'current_location', header: 'Vị trí xe' },
        { key: 'notes', header: 'Ghi chú' },
      ]);

      let successCount = 0;
      let errorCount = 0;

      for (const data of importedData) {
        try {
          await createMutation.mutateAsync({
            vehicle_code: data.vehicle_code,
            license_plate: data.license_plate,
            vehicle_type: data.vehicle_type,
            brand: data.brand || '',
            capacity_tons: data.capacity_tons ? Number(data.capacity_tons) : 0,
            fuel_type: data.fuel_type || '',
            usage_limit_years: data.usage_limit_years || '',
            engine_number: data.engine_number || '',
            chassis_number: data.chassis_number || '',
            insurance_purchase_date: data.insurance_purchase_date || '',
            insurance_expiry_date: data.insurance_expiry_date || '',
            insurance_cost: data.insurance_cost ? Number(data.insurance_cost) : 0,
            registration_cycle: data.registration_cycle || '',
            registration_date: data.registration_date || '',
            registration_expiry_date: data.registration_expiry_date || '',
            registration_cost: data.registration_cost ? Number(data.registration_cost) : 0,
            current_location: data.current_location || '',
            notes: data.notes || '',
            status: 'active',
          });
          successCount++;
        } catch {
          errorCount++;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });

      toast({
        title: "Nhập xe thành công",
        description: `Đã nhập ${successCount} xe${errorCount > 0 ? `, ${errorCount} lỗi` : ''}`,
      });
    } catch (error) {
      toast({
        title: "Lỗi nhập file",
        description: error instanceof Error ? error.message : "Không thể nhập file",
        variant: 'destructive',
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter data based on search query AND active filters
  const filteredVehicles = useMemo(() => {
    return (vehicles || []).filter(vehicle => {
      // 1. Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          vehicle.vehicle_code?.toLowerCase().includes(query) ||
          vehicle.license_plate?.toLowerCase().includes(query) ||
          vehicle.brand?.toLowerCase().includes(query) ||
          vehicle.vehicle_type?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // 2. Active Filters (Excel-style)
      // Multi-select columns
      if (activeFilters.vehicle_type && Array.isArray(activeFilters.vehicle_type) && activeFilters.vehicle_type.length > 0) {
        if (!activeFilters.vehicle_type.includes(vehicle.vehicle_type)) return false;
      }
      if (activeFilters.status && Array.isArray(activeFilters.status) && activeFilters.status.length > 0) {
        if (!activeFilters.status.includes(vehicle.status || 'active')) return false;
      }
      if (activeFilters.current_location && Array.isArray(activeFilters.current_location) && activeFilters.current_location.length > 0) {
        if (!activeFilters.current_location.includes(vehicle.current_location || '')) return false;
      }

      // Expiry days logic
      // Insurance Expiry
      if (activeFilters.insurance_expiry) {
        const days = activeFilters.insurance_expiry as number;
        if (!vehicle.insurance_expiry_date) return false;
        const expiryDate = parseISO(vehicle.insurance_expiry_date);
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > days) return false; // Filter out if expiry is further away than 'days'
      }

      // Registration Expiry
      if (activeFilters.registration_expiry) {
        const days = activeFilters.registration_expiry as number;
        if (!vehicle.registration_expiry_date) return false;
        const expiryDate = parseISO(vehicle.registration_expiry_date);
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > days) return false;
      }

      return true;
    });
  }, [vehicles, searchQuery, activeFilters]);

  // Đầy đủ 18 cột theo thứ tự Excel
  const columns = useMemo<Column<Vehicle>[]>(() => [
    {
      key: 'vehicle_code',
      header: 'Mã xe',
      width: '100px',
      render: (value) => <span className="font-mono font-medium">{String(value || '')}</span>,
    },
    {
      key: 'license_plate',
      header: 'Biển số',
      width: '120px',
      render: (value) => <span className="font-mono">{String(value || '')}</span>,
    },
    {
      key: 'vehicle_type',
      header: 'Loại xe',
      width: '120px',
    },
    {
      key: 'brand',
      header: 'Nhãn hiệu xe',
      width: '120px',
    },
    {
      key: 'capacity_tons',
      header: 'Tải trọng',
      width: '100px',
      align: 'right',
      render: (value) => value ? `${formatNumber(value as number)} tấn` : '',
    },
    {
      key: 'fuel_type',
      header: 'Nhiên liệu',
      width: '100px',
    },
    {
      key: 'usage_limit_years',
      header: 'Niên hạn sử dụng',
      width: '140px',
    },
    {
      key: 'engine_number',
      header: 'Số máy',
      width: '120px',
    },
    {
      key: 'chassis_number',
      header: 'Số Khung',
      width: '120px',
    },
    {
      key: 'insurance_purchase_date',
      header: 'Ngày mua bảo hiểm',
      width: '150px',
      render: (value) => formatDate(value as string),
    },
    {
      key: 'insurance_expiry_date',
      header: 'Ngày hết hạn bảo hiểm',
      width: '170px',
      render: (value) => formatDate(value as string),
    },
    {
      key: 'insurance_cost',
      header: 'Số tiền bảo hiểm',
      width: '160px',
      align: 'right',
      render: (value) => formatCurrency(value as number),
    },
    {
      key: 'registration_cycle',
      header: 'Chu kỳ đăng kiểm',
      width: '140px',
    },
    {
      key: 'registration_date',
      header: 'Ngày đăng kiểm',
      width: '130px',
      render: (value) => formatDate(value as string),
    },
    {
      key: 'registration_expiry_date',
      header: 'Ngày hết hạn đăng kiểm',
      width: '180px',
      render: (value) => formatDate(value as string),
    },
    {
      key: 'registration_cost',
      header: 'Số tiền đăng kiểm',
      width: '150px',
      align: 'right',
      render: (value) => formatCurrency(value as number),
    },
    {
      key: 'current_location',
      header: 'Vị trí xe',
      width: '150px',
    },
    {
      key: 'status',
      header: 'Trạng thái xe',
      width: '140px',
      render: (value) => {
        const statusLabels: Record<string, string> = {
          active: 'Đang hoạt động',
          inactive: 'Tạm dừng',
          maintenance: 'Bảo trì',
        };
        const status = (value as string) || 'active';
        const colors: Record<string, string> = {
          active: 'bg-green-100 text-green-700 border-green-200',
          inactive: 'bg-gray-100 text-gray-700 border-gray-200',
          maintenance: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[status] || colors.active}`}>
            {statusLabels[status] || status}
          </span>
        );
      },
    },
    {
      key: 'notes',
      header: 'Ghi chú',
      width: '200px',
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

  if (!vehicles && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <p className="text-destructive font-medium">Không thể tải dữ liệu xe.</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['vehicles'] })}>
          <RefreshCw className="w-4 h-4 mr-2" /> Thử lại
        </Button>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-destructive">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <h3 className="text-lg font-semibold">Không thể tải dữ liệu xe</h3>
        <p className="text-sm text-muted-foreground mb-4">{error?.message || "Đã xảy ra lỗi không xác định"}</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['vehicles'] })}>
          Tải lại dữ liệu
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-fade-in">
      {/* 1. Compact Header Row */}
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Danh Mục Xe</h1>
          <p className="text-muted-foreground text-sm">Danh sách và thông tin chi tiết các xe trong đội</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMapDialogOpen(true)}
          className="gap-2 shrink-0 border-primary/20 hover:bg-primary/5 text-primary"
        >
          <MapPin className="w-4 h-4" />
          <span className="hidden sm:inline">Xem bản đồ</span>
        </Button>
      </div>

      {/* 2. Unified Toolbar Row */}
      <div className="flex flex-col xl:flex-row gap-2 items-start xl:items-center justify-between bg-muted/10 p-2 rounded-lg border">
        {/* Left Side: Search + Filters */}
        <div className="flex flex-col sm:flex-row flex-1 w-full xl:w-auto gap-2">
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm mã xe, biển số..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 bg-background"
            />
          </div>

          {/* Filters Wrapper */}
          <div className="flex-1 overflow-x-auto pb-1 sm:pb-0">
            <ExcelFilter
              data={vehicles || []}
              filterConfigs={[
                { key: 'vehicle_type', label: 'Loại xe', type: 'multi-select' },
                { key: 'status', label: 'Trạng thái', type: 'multi-select' },
                { key: 'current_location', label: 'Vị trí', type: 'multi-select' },
                { key: 'insurance_expiry', label: 'BH hết hạn', type: 'expiry-days', expiryField: 'insurance_expiry_date' },
                { key: 'registration_expiry', label: 'ĐK hết hạn', type: 'expiry-days', expiryField: 'registration_expiry_date' },
              ]}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
            />
          </div>
        </div>

        {/* Right Side: Actions (Compact) */}
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto max-w-full pt-1 xl:pt-0 w-full xl:w-auto justify-end">
          <ColumnChooser
            columns={columns.map(c => ({ key: String(c.key), header: c.header }))}
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
            storageKey="vehicles_visible_columns_v2"
            defaultRequiredKeys={['vehicle_code', 'license_plate']}
          />

          <div className="w-px h-6 bg-border mx-1" />

          <Button variant="ghost" size="icon" onClick={handleSyncAll} disabled={isSyncing} title="Đồng bộ">
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
          </Button>

          <Button variant="outline" size="sm" onClick={handleImport} className="h-8 px-2 lg:px-3">
            <Upload className="w-4 h-4 mr-2" />
            <span className="hidden lg:inline">Nhập</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handleExport} className="h-8 px-2 lg:px-3">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden lg:inline">Xuất</span>
          </Button>

          <Button size="sm" onClick={handleAdd} className="h-8 gap-1 ml-1">
            <Plus className="w-4 h-4" />
            Thêm xe
          </Button>
        </div>
      </div>

      <DataTable
        data={filteredVehicles}
        columns={columns.filter(c => visibleColumns.includes(String(c.key)))}
        selectable
        onRowClick={handleRowClick}
        pageSize={50}
        selectedRowIds={selectedRowIds}
        onSelectionChange={setSelectedRowIds}
        onDeleteSelected={handleBulkDelete}
        hideToolbar={true}
      />

      {/* Bulk Delete Dialog */}
      <BulkDeleteDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        selectedCount={selectedRowIds.size}
        entityName="xe"
        onConfirm={confirmBulkDelete}
        isDeleting={isBulkDeleting}
      />

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />

      {/* Add/Edit Dialog - Form đầy đủ 18 trường */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              {selectedVehicle ? 'Chỉnh sửa thông tin xe' : 'Thêm xe mới'}
            </DialogTitle>
            <DialogDescription>
              {selectedVehicle
                ? `Mã xe: ${selectedVehicle.vehicle_code}`
                : 'Nhập thông tin xe mới vào hệ thống'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Thông tin cơ bản */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground border-b pb-1">Thông tin cơ bản</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="vehicle_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mã xe *</FormLabel>
                        <FormControl>
                          <Input placeholder="VD: XE-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="license_plate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biển số *</FormLabel>
                        <FormControl>
                          <Input placeholder="VD: 79C-01468" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicle_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loại xe *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại xe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Xe thùng">Xe thùng</SelectItem>
                            <SelectItem value="Xe cẩu">Xe cẩu</SelectItem>
                            <SelectItem value="Romooc">Romooc</SelectItem>
                            <SelectItem value="Xe đầu kéo">Xe đầu kéo</SelectItem>
                            <SelectItem value="Xe ben">Xe ben</SelectItem>
                            <SelectItem value="Xe cont">Xe cont</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nhãn hiệu xe</FormLabel>
                        <FormControl>
                          <Input placeholder="VD: Hino, Hyundai..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="capacity_tons"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tải trọng (tấn)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="VD: 5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fuel_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nhiên liệu</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn nhiên liệu" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Dầu/Diesel">Dầu/Diesel</SelectItem>
                            <SelectItem value="Xăng">Xăng</SelectItem>
                            <SelectItem value="Điện">Điện</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Thông số kỹ thuật */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground border-b pb-1">Thông số kỹ thuật</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="usage_limit_years"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Niên hạn sử dụng</FormLabel>
                        <FormControl>
                          <Input placeholder="VD: 2011-2036" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="engine_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số máy</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập số máy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="chassis_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số Khung</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập số khung" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Bảo hiểm */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground border-b pb-1">Bảo hiểm</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="insurance_purchase_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày mua bảo hiểm</FormLabel>
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
                    name="insurance_expiry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày hết hạn bảo hiểm</FormLabel>
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
                    name="insurance_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số tiền mua bảo hiểm</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="VD: 3580000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Đăng kiểm */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground border-b pb-1">Đăng kiểm</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="registration_cycle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chu kỳ đăng kiểm</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="6 tháng">6 tháng</SelectItem>
                            <SelectItem value="12 tháng">12 tháng</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="registration_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày đăng kiểm</FormLabel>
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
                    name="registration_expiry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày hết hạn đăng kiểm</FormLabel>
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
                    name="registration_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số tiền đăng kiểm</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="VD: 500000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Vị trí & Ghi chú */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground border-b pb-1">Khác</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="current_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vị trí xe</FormLabel>
                        <FormControl>
                          <Input placeholder="VD: Bãi xe A" {...field} />
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Hoạt động</SelectItem>
                            <SelectItem value="maintenance">Bảo trì</SelectItem>
                            <SelectItem value="inactive">Ngừng</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ghi chú</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Nhập ghi chú về xe..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {selectedVehicle ? 'Cập nhật' : 'Thêm mới'}
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
              Hành động này sẽ xóa xe <strong>{selectedVehicle?.vehicle_code}</strong> khỏi danh sách.
              Dữ liệu sẽ được đánh dấu là đã xóa và có thể khôi phục bởi quản trị viên.
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

      {/* Vehicle Map View Dialog */}
      <VehicleMapView
        vehicles={filteredVehicles}
        selectedVehicle={mapSelectedVehicle}
        isOpen={mapDialogOpen}
        onClose={() => {
          setMapDialogOpen(false);
          setMapSelectedVehicle(null);
        }}
      />

      {/* Excel Import Dialog */}
      <ExcelImportDialog
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleExcelImport}
        entityName="xe"
        existingCodes={(vehicles || []).map(v => v.vehicle_code)}
        codeField="vehicle_code"
        columns={Object.keys(importMap).map(key => ({
          key,
          header: importMap[key as keyof typeof importMap],
          required: ['vehicle_code', 'license_plate', 'vehicle_type'].includes(key),
          type: ['capacity_tons', 'insurance_cost', 'registration_cost'].includes(key) ? 'number' :
            ['insurance_purchase_date', 'insurance_expiry_date', 'registration_date', 'registration_expiry_date'].includes(key) ? 'date' : 'text'
        }))}
        sampleData={[
          {
            vehicle_code: 'XE001',
            license_plate: '29C-12345',
            vehicle_type: 'Xe tải 5 tấn',
            brand: 'Hino',
            capacity_tons: 5,
            fuel_type: 'Dầu',
            usage_limit_years: '2030',
            engine_number: 'ENGINE123',
            chassis_number: 'CHASSIS123',
            insurance_purchase_date: '2025-01-01',
            insurance_expiry_date: '2026-01-01',
            insurance_cost: 12000000,
            registration_cycle: '12 tháng',
            registration_date: '2025-01-01',
            registration_expiry_date: '2026-01-01',
            registration_cost: 2000000,
            current_location: 'Hà Nội',
            status: 'Đang hoạt động',
            notes: 'Xe mới'
          }
        ]}
      />
    </div>
  );
}
