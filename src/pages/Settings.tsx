// @ts-nocheck
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useCompanySettings, useSaveCompanySettings } from "@/hooks/useCompanySettings";
import { useSecuritySettings, useSaveSecuritySettings } from "@/hooks/useSecuritySettings";
import { useDataExport, useDataBackup } from "@/hooks/useDataManagement";
import { useUsers, useAddUser, useUpdateUserRole, useDeleteUser } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "react-router-dom";
import {
  Building2,
  Users as UsersIcon,
  Trash2,
  Plus,
  Shield,
  Database,
  RefreshCw,
  Download,
  X,
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const defaultTab = searchParams.get('tab') || 'company';

  // All mutations for syncing
  const companySave = useSaveCompanySettings();
  const secSave = useSaveSecuritySettings();

  // Users Management
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const addUserMutation = useAddUser();
  const updateRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ email: '', password: '', full_name: '', role: 'dispatcher' });

  // Company Settings (local state only)
  const { data: companyData, isLoading: companyLoading } = useCompanySettings();
  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    tax_code: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  });

  useEffect(() => {
    if (companyData) {
      setCompanyForm({
        company_name: companyData.company_name || '',
        tax_code: companyData.tax_code || '',
        address: companyData.address || '',
        phone: companyData.phone || '',
        email: companyData.email || '',
        website: companyData.website || '',
      });
    }
  }, [companyData]);

  const handleCompanySave = async () => {
    try {
      await companySave.mutateAsync({ ...companyForm, id: companyData?.id });
    } catch (e) {
      // error handled by hook toast
    }
  };



  // Security Settings (local state only)
  const { data: secData, isLoading: secLoading } = useSecuritySettings();
  const [secForm, setSecForm] = useState({
    two_factor_enabled: false,
    lock_completed_data: true,
    log_all_actions: true,
    auto_logout_30min: true,
  });

  useEffect(() => {
    if (secData) {
      setSecForm({
        two_factor_enabled: secData.two_factor_enabled ?? false,
        lock_completed_data: secData.lock_completed_data ?? true,
        log_all_actions: secData.log_all_actions ?? true,
        auto_logout_30min: secData.auto_logout_30min ?? true,
      });
    }
  }, [secData]);

  const handleSecSave = async () => {
    try {
      await secSave.mutateAsync({ ...secForm, id: secData?.id });
    } catch (e) {
      // error handled by hook toast
    }
  };

  // Data Management
  const { exportData } = useDataExport();
  const { performBackup } = useDataBackup();

  const { user } = useAuth();

  const handleAddUser = async () => {
    if (!addUserForm.email || !addUserForm.password || !addUserForm.full_name) {
      toast({ title: 'Lỗi', description: 'Vui lòng điền đầy đủ thông tin', variant: 'destructive' });
      return;
    }
    try {
      await addUserMutation.mutateAsync(addUserForm);
      setAddUserForm({ email: '', password: '', full_name: '', role: 'dispatcher' });
      setShowAddUserModal(false);
    } catch (e) {
      // error handled by hook toast
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Bạn chắc chắn muốn xóa người dùng này?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Sync all data
  const handleSyncAll = async () => {
    try {
      const results = await Promise.all([
        companySave.mutateAsync({ ...companyForm, id: companyData?.id }),
        secSave.mutateAsync({ ...secForm, id: secData?.id }),
      ]);
      toast({ title: 'Đồng bộ thành công', description: 'Tất cả cài đặt đã được lưu vào hệ thống.' });
    } catch (e) {
      // errors handled by individual hooks
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Cài Đặt Hệ Thống"
        description="Quản lý cấu hình và tùy chỉnh hệ thống"
      />

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Công ty</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <UsersIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Người dùng</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Bảo mật</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Dữ liệu</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin công ty</CardTitle>
              <CardDescription>
                Cập nhật thông tin doanh nghiệp (chỉ Admin)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Tên công ty</Label>
                  <Input
                    id="company_name"
                    value={companyForm.company_name}
                    onChange={(e) => setCompanyForm((s) => ({ ...s, company_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_code">Mã số thuế</Label>
                  <Input id="tax_code" value={companyForm.tax_code} onChange={(e) => setCompanyForm((s) => ({ ...s, tax_code: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input id="address" value={companyForm.address} onChange={(e) => setCompanyForm((s) => ({ ...s, address: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" value={companyForm.phone} onChange={(e) => setCompanyForm((s) => ({ ...s, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={companyForm.email} onChange={(e) => setCompanyForm((s) => ({ ...s, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" value={companyForm.website} onChange={(e) => setCompanyForm((s) => ({ ...s, website: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý người dùng</CardTitle>
              <CardDescription>
                Phân quyền và quản lý tài khoản
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={() => setShowAddUserModal(true)} className="mb-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm người dùng
                </Button>

                {/* Add User Modal */}
                {showAddUserModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Thêm người dùng mới</CardTitle>
                        <button onClick={() => setShowAddUserModal(false)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" placeholder="user@company.vn" value={addUserForm.email} onChange={(e) => setAddUserForm(s => ({ ...s, email: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Họ tên</Label>
                          <Input placeholder="Nguyễn Văn A" value={addUserForm.full_name} onChange={(e) => setAddUserForm(s => ({ ...s, full_name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Mật khẩu tạm</Label>
                          <Input type="password" placeholder="Mật khẩu tạm thời" value={addUserForm.password} onChange={(e) => setAddUserForm(s => ({ ...s, password: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Quyền</Label>
                          <select className="w-full px-3 py-2 border rounded-md" value={addUserForm.role} onChange={(e) => setAddUserForm(s => ({ ...s, role: e.target.value }))}>
                            <option value="admin">Quản trị viên</option>
                            <option value="manager">Quản lý</option>
                            <option value="dispatcher">Điều phối</option>
                            <option value="accountant">Kế toán</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleAddUser} disabled={addUserMutation.isLoading} className="flex-1">
                            Thêm
                          </Button>
                          <Button variant="outline" onClick={() => setShowAddUserModal(false)} className="flex-1">
                            Hủy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Users Table */}
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Họ tên</th>
                        <th className="px-4 py-2 text-left">Quyền</th>
                        <th className="px-4 py-2 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersLoading ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-center text-muted-foreground">
                            Đang tải...
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-center text-muted-foreground">
                            Không có người dùng
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className="border-t hover:bg-muted/50">
                            <td className="px-4 py-2">{u.email}</td>
                            <td className="px-4 py-2">{u.user_metadata?.full_name || '—'}</td>
                            <td className="px-4 py-2">
                              <select
                                value={u.role || 'viewer'}
                                onChange={(e) => updateRoleMutation.mutate({ user_id: u.id, role: e.target.value })}
                                className="px-2 py-1 border rounded text-xs"
                                disabled={updateRoleMutation.isLoading}
                              >
                                <option value="admin">Quản trị viên</option>
                                <option value="manager">Quản lý</option>
                                <option value="dispatcher">Điều phối</option>
                                <option value="accountant">Kế toán</option>
                                <option value="driver">Tài xế</option>
                                <option value="viewer">Xem</option>
                              </select>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={deleteUserMutation.isLoading}
                                className="text-red-500 hover:text-red-700 inline-flex"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Bảo mật & Quyền truy cập</CardTitle>
              <CardDescription>
                Cài đặt bảo mật hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Yêu cầu xác thực 2 bước</Label>
                  <p className="text-sm text-muted-foreground">
                    Bảo vệ tài khoản bằng xác thực 2 bước
                  </p>
                </div>
                <Switch
                  checked={secForm.two_factor_enabled}
                  onCheckedChange={(checked) => setSecForm(s => ({ ...s, two_factor_enabled: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Khóa chỉnh sửa dữ liệu đã chốt</Label>
                  <p className="text-sm text-muted-foreground">
                    Không cho phép sửa chuyến/chi phí đã hoàn thành
                  </p>
                </div>
                <Switch
                  checked={secForm.lock_completed_data}
                  onCheckedChange={(checked) => setSecForm(s => ({ ...s, lock_completed_data: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ghi log tất cả thao tác</Label>
                  <p className="text-sm text-muted-foreground">
                    Lưu lại lịch sử tất cả các thay đổi
                  </p>
                </div>
                <Switch
                  checked={secForm.log_all_actions}
                  onCheckedChange={(checked) => setSecForm(s => ({ ...s, log_all_actions: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tự động đăng xuất sau 30 phút</Label>
                  <p className="text-sm text-muted-foreground">
                    Đăng xuất tự động khi không hoạt động
                  </p>
                </div>
                <Switch
                  checked={secForm.auto_logout_30min}
                  onCheckedChange={(checked) => setSecForm(s => ({ ...s, auto_logout_30min: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý dữ liệu</CardTitle>
              <CardDescription>
                Sao lưu, khôi phục và xuất dữ liệu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-4">
                      <RefreshCw className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium">Sao lưu dữ liệu</p>
                        <p className="text-sm text-muted-foreground">
                          Sao lưu tất cả dữ liệu hệ thống
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => performBackup()}>
                      Sao lưu ngay
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Download className="w-8 h-8 text-success" />
                      <div>
                        <p className="font-medium">Xuất dữ liệu</p>
                        <p className="text-sm text-muted-foreground">
                          Xuất ra file JSON/CSV
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 text-sm" onClick={() => exportData('json')}>
                        JSON
                      </Button>
                      <Button variant="outline" className="flex-1 text-sm" onClick={() => exportData('csv')}>
                        CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Lưu ý:</strong> Sao lưu tạo một bản sao toàn bộ dữ liệu của bạn.
                  Các sao lưu được lưu trữ trong Supabase Storage hoặc tải về máy.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Global Sync Button */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Đồng bộ dữ liệu</p>
              <p className="text-sm text-muted-foreground">
                Lưu tất cả các thay đổi vào hệ thống
              </p>
            </div>
            <Button
              onClick={handleSyncAll}
              disabled={companySave.isLoading || secSave.isLoading}
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Đồng bộ dữ liệu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div >
  );
}
