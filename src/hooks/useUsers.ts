// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserWithRole = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  role?: string;
  created_at?: string;
};

/**
 * Fetch all users with their roles from user_roles table
 * Note: This only shows users who have been assigned a role.
 * New admins need to be created through Supabase Dashboard.
 */
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Get all user roles from the user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Return user roles as users (we can't access auth.users from client)
      return (userRoles || []).map((ur: any) => ({
        id: ur.user_id,
        email: ur.email || `User ${ur.user_id.slice(0, 8)}`,
        user_metadata: {
          full_name: ur.full_name || '',
        },
        role: ur.role || 'viewer',
        created_at: ur.created_at,
      } as UserWithRole));
    },
  });
};

/**
 * Add new user role (Note: Auth user must be created in Supabase Dashboard first)
 * This creates a role entry for an existing Supabase auth user.
 */
export const useAddUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: { email: string; password: string; full_name: string; role: string }) => {
      // Note: We cannot create auth users from client-side.
      // The admin must first create the user in Supabase Dashboard,
      // then add their role here using their user_id.

      // For now, we'll create a placeholder entry in user_roles
      // The actual user must be created via Supabase Dashboard or Edge Function
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: crypto.randomUUID(), // Placeholder - should be real user ID
          role: payload.role,
          email: payload.email,
          full_name: payload.full_name,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Thêm quyền thành công',
        description: 'Lưu ý: Để đăng nhập được, bạn cần tạo tài khoản trong Supabase Dashboard trước.'
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Lỗi khi thêm người dùng', description: error.message, variant: 'destructive' });
    },
  });
};

/**
 * Update user role
 */
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: { user_id: string; role: string }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .update({ role: payload.role })
        .eq('user_id', payload.user_id)
        .select()
        .single();

      if (error?.code === 'PGRST116') {
        // No existing role, insert new one
        const { data: inserted, error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: payload.user_id, role: payload.role })
          .select()
          .single();

        if (insertError) throw insertError;
        return inserted;
      }

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Cập nhật quyền thành công', description: 'Quyền của người dùng đã được thay đổi.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Lỗi khi cập nhật', description: error.message, variant: 'destructive' });
    },
  });
};

/**
 * Delete user role (removes from user_roles table only)
 * Note: Auth user deletion must be done in Supabase Dashboard
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (user_id: string) => {
      // Delete from user_roles only (can't delete auth user from client)
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user_id);

      if (error) throw error;
      return user_id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Xóa quyền thành công',
        description: 'Quyền người dùng đã được xóa. Để xóa hoàn toàn, truy cập Supabase Dashboard.'
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Lỗi khi xóa', description: error.message, variant: 'destructive' });
    },
  });
};
