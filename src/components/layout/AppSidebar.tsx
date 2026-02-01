import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Building2,
  Package,
  Calendar,
  Wallet,
  Wrench,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Lock,
  Bell, // Import Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useVehicles } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import { useRoutes } from "@/hooks/useRoutes";
import { useCustomers } from "@/hooks/useCustomers";
import { useToast } from "@/hooks/use-toast";
import { useAuth, UserRole } from "@/contexts/AuthContext";

// Define which roles can access each menu item
const roleAccessMap: Record<string, UserRole[]> = {
  "/": ["admin", "manager", "dispatcher", "accountant", "driver", "viewer"], // Dashboard for all
  "/vehicles": ["admin", "manager", "dispatcher"],
  "/drivers": ["admin", "manager", "dispatcher"],
  "/routes": ["admin", "manager", "dispatcher"],
  "/customers": ["admin", "manager", "dispatcher", "accountant"],
  "/trips": ["admin", "manager", "dispatcher", "accountant"],
  "/expenses": ["admin", "manager", "dispatcher", "accountant"],
  "/dispatch": ["admin", "manager", "dispatcher"],
  "/maintenance": ["admin", "manager"],
  "/reports": ["admin", "manager", "accountant"],
  "/alerts": ["admin", "manager", "dispatcher"],
  "/settings": ["admin"], // Only admin
};

const navItems = [
  { path: "/", label: "Bảng Điều Khiển", icon: LayoutDashboard },
  { path: "/vehicles", label: "Danh Mục Xe", icon: Truck },
  { path: "/drivers", label: "Danh Mục Tài Xế", icon: Users },
  { path: "/routes", label: "Danh Mục Tuyến Đường", icon: Route },
  { path: "/customers", label: "Danh Mục Khách Hàng", icon: Building2 },
  { path: "/trips", label: "Nhập Liệu Doanh Thu", icon: Package },
  { path: "/expenses", label: "Nhập Liệu Chi Phí", icon: Wallet },
  { path: "/dispatch", label: "Điều Phối Vận Tải", icon: Calendar },
  { path: "/maintenance", label: "Bảo Trì – Sửa Chữa", icon: Wrench },
  { path: "/reports", label: "Báo Cáo Tổng Hợp", icon: BarChart3 },
  { path: "/alerts", label: "Cài Đặt Cảnh Báo", icon: Bell },
  { path: "/settings", label: "Cài Đặt Hệ Thống", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { toast } = useToast();
  const { role } = useAuth();

  // Check for master data existence
  const { data: vehicles } = useVehicles();
  const { data: drivers } = useDrivers();
  const { data: routes } = useRoutes();
  const { data: customers } = useCustomers();

  // Check if user has access to a path based on role
  const hasAccess = (path: string) => {
    const allowedRoles = roleAccessMap[path] || [];
    return allowedRoles.includes(role);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Truck className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-base font-bold text-sidebar-foreground">SAVACO APP</h1>
              <p className="text-xs text-sidebar-foreground/60">Quản lý vận tải</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            // Role-based access control
            const isDisabled = !hasAccess(item.path);

            // Hide settings from non-admin users completely
            if (item.path === "/settings" && role !== "admin") {
              return null;
            }

            return (
              <li key={item.path}>
                <Link
                  to={isDisabled ? "#" : item.path}
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                      toast({
                        title: "Không có quyền truy cập",
                        description: "Bạn không có quyền sử dụng tính năng này. Liên hệ Admin để được cấp quyền.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className={cn(
                    "nav-item",
                    isActive ? "nav-item-active" : "nav-item-inactive",
                    isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-sidebar-foreground"
                  )}
                  title={isDisabled ? "Không có quyền truy cập" : (collapsed ? item.label : undefined)}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isDisabled && (
                      <div className="absolute -top-1 -right-1">
                        <Lock className="w-3 h-3 text-destructive" />
                      </div>
                    )}
                  </div>
                  {!collapsed && (
                    <span className="animate-fade-in truncate">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse button */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span>Thu gọn</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
