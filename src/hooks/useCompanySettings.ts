import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type CompanySettings = {
  id?: string;
  company_name?: string | null;
  tax_code?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  metadata?: any;
};

export const useCompanySettings = () => {
  return useQuery({
    queryKey: ['company_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data as CompanySettings;
    },
  });
};

export const useSaveCompanySettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: CompanySettings) => {
      // Prefer updating the existing row by id. If no id provided, insert a new row.
      if (payload.id) {
        const updates = { ...payload } as any;
        const { data, error } = await supabase
          .from('company_settings')
          .update(updates)
          .eq('id', payload.id)
          .select('*')
          .single();

        if (error) throw error;
        return data as CompanySettings;
      }

      // No id: get first row and update it (single-row pattern)
      const { data: existing, error: selectError } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      if (existing) {
        // Update existing row
        const { data, error } = await supabase
          .from('company_settings')
          .update(payload)
          .eq('id', existing.id)
          .select('*')
          .single();

        if (error) throw error;
        return data as CompanySettings;
      }

      // No existing row: insert new one
      const { data, error } = await supabase
        .from('company_settings')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;
      return data as CompanySettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_settings'] });
      toast({ title: 'Lưu thành công', description: 'Thông tin công ty đã được cập nhật.' });
    },
    onError: (error: Error) => {
      const msg = String(error.message || error);
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbid') || msg.toLowerCase().includes('not authorized')) {
        toast({ title: 'Không có quyền', description: 'Bạn cần quyền Admin để cập nhật thông tin công ty.', variant: 'destructive' });
      } else {
        toast({ title: 'Lỗi khi lưu', description: msg, variant: 'destructive' });
      }
    },
  });
};
