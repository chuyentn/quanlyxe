// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDataExport = () => {
  const { toast } = useToast();

  const exportData = async (format: 'json' | 'csv') => {
    try {
      // Fetch all main tables
      const [trips, expenses, drivers, vehicles, customers] = await Promise.all([
        supabase.from('trips').select('*').limit(10000),
        supabase.from('expenses').select('*').limit(10000),
        supabase.from('drivers').select('*').limit(10000),
        supabase.from('vehicles').select('*').limit(10000),
        supabase.from('customers').select('*').limit(10000),
      ]);

      const allData = {
        trips: trips.data || [],
        expenses: expenses.data || [],
        drivers: drivers.data || [],
        vehicles: vehicles.data || [],
        customers: customers.data || [],
        exported_at: new Date().toISOString(),
      };

      let content: string;
      let filename: string;

      if (format === 'json') {
        content = JSON.stringify(allData, null, 2);
        filename = `export_${new Date().toISOString().split('T')[0]}.json`;
      } else {
        // CSV format - flatten and convert
        const csvRows: string[] = [];
        
        // Add trips sheet header
        csvRows.push('===== TRIPS =====');
        if (allData.trips.length > 0) {
          csvRows.push(Object.keys(allData.trips[0]).join(','));
          allData.trips.forEach(row => csvRows.push(Object.values(row).map(v => `"${v}"`).join(',')));
        }
        
        csvRows.push('');
        csvRows.push('===== EXPENSES =====');
        if (allData.expenses.length > 0) {
          csvRows.push(Object.keys(allData.expenses[0]).join(','));
          allData.expenses.forEach(row => csvRows.push(Object.values(row).map(v => `"${v}"`).join(',')));
        }
        
        content = csvRows.join('\n');
        filename = `export_${new Date().toISOString().split('T')[0]}.csv`;
      }

      const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: 'Xuất dữ liệu thành công', description: `File ${filename} đã được tải về.` });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Lỗi khi xuất';
      toast({ title: 'Lỗi xuất dữ liệu', description: msg, variant: 'destructive' });
    }
  };

  return { exportData };
};

export const useDataBackup = () => {
  const { toast } = useToast();

  const performBackup = async () => {
    try {
      // Fetch all critical tables
      const [trips, expenses, drivers, vehicles, customers, trips_financials] = await Promise.all([
        supabase.from('trips').select('*').limit(10000),
        supabase.from('expenses').select('*').limit(10000),
        supabase.from('drivers').select('*').limit(10000),
        supabase.from('vehicles').select('*').limit(10000),
        supabase.from('customers').select('*').limit(10000),
        supabase.from('trip_financials').select('*').limit(10000),
      ]);

      const backupData = {
        trips: trips.data || [],
        expenses: expenses.data || [],
        drivers: drivers.data || [],
        vehicles: vehicles.data || [],
        customers: customers.data || [],
        trip_financials: trips_financials.data || [],
        backup_timestamp: new Date().toISOString(),
        version: '1.0',
      };

      const json = JSON.stringify(backupData, null, 2);
      const filename = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;

      // Upload to Supabase Storage if bucket exists, otherwise download
      try {
        const file = new File([json], filename, { type: 'application/json' });
        const { error: uploadError } = await supabase.storage
          .from('backups')
          .upload(`system_backups/${filename}`, file, { upsert: false });

        if (!uploadError) {
          toast({
            title: 'Sao lưu thành công',
            description: `Sao lưu được lưu vào hệ thống lúc ${new Date().toLocaleTimeString('vi-VN')}.`,
          });
          return;
        }
      } catch {
        // Fallback: download backup file
      }

      // Fallback: download backup file to user's computer
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Sao lưu thành công',
        description: `Tệp sao lưu ${filename} đã được tải về máy của bạn.`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Lỗi khi sao lưu';
      toast({ title: 'Lỗi sao lưu', description: msg, variant: 'destructive' });
    }
  };

  return { performBackup };
};
