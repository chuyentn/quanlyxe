// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type SecuritySettings = {
  id?: string;
  user_id?: string;
  two_factor_enabled?: boolean;
  lock_completed_data?: boolean;
  log_all_actions?: boolean;
  auto_logout_30min?: boolean;
  created_at?: string;
  updated_at?: string;
};

export const useSecuritySettings = () => {
  return useQuery({
    queryKey: ['security_settings'],
    queryFn: async () => {
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .eq('user_id', user.user.id)
        .limit(1)
        .single();

      if (error?.code === 'PGRST116') {
        // No row found, return defaults
        return {
          two_factor_enabled: false,
          lock_completed_data: true,
          log_all_actions: true,
          auto_logout_30min: true,
        } as SecuritySettings;
      }
      if (error) throw error;
      return data as SecuritySettings;
    },
  });
};

export const useSaveSecuritySettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: SecuritySettings) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) throw new Error('Not authenticated');

      const data_with_user = { ...payload, user_id: user.user.id };

      if (payload.id) {
        const { data, error } = await supabase
          .from('security_settings')
          .update(data_with_user)
          .eq('id', payload.id)
          .select()
          .single();

        if (error) throw error;
        return data as SecuritySettings;
      }

      const { data, error } = await supabase
        .from('security_settings')
        .insert(data_with_user)
        .select()
        .single();

      if (error) throw error;
      return data as SecuritySettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security_settings'] });
      toast({ title: 'Lưu thành công', description: 'Cài đặt bảo mật đã được cập nhật.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Lỗi khi lưu', description: error.message, variant: 'destructive' });
    },
  });
};
