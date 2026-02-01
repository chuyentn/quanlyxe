// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type NotificationSettings = {
  id?: string;
  user_id?: string;
  maintenance_alert?: boolean;
  license_expiry_alert?: boolean;
  expense_alert?: boolean;
  debt_alert?: boolean;
  daily_report?: boolean;
  created_at?: string;
  updated_at?: string;
};

export const useNotificationSettings = () => {
  return useQuery({
    queryKey: ['notification_settings'],
    queryFn: async () => {
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.user.id)
        .limit(1)
        .single();

      if (error?.code === 'PGRST116') {
        // No row found, return defaults
        return {
          maintenance_alert: true,
          license_expiry_alert: true,
          expense_alert: true,
          debt_alert: true,
          daily_report: false,
        } as NotificationSettings;
      }
      if (error) throw error;
      return data as NotificationSettings;
    },
  });
};

export const useSaveNotificationSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: NotificationSettings) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) throw new Error('Not authenticated');

      const data_with_user = { ...payload, user_id: user.user.id };

      if (payload.id) {
        const { data, error } = await supabase
          .from('notification_settings')
          .update(data_with_user)
          .eq('id', payload.id)
          .select()
          .single();

        if (error) throw error;
        return data as NotificationSettings;
      }

      const { data, error } = await supabase
        .from('notification_settings')
        .insert(data_with_user)
        .select()
        .single();

      if (error) throw error;
      return data as NotificationSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_settings'] });
      toast({ title: 'Lưu thành công', description: 'Cài đặt thông báo đã được cập nhật.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Lỗi khi lưu', description: error.message, variant: 'destructive' });
    },
  });
};
