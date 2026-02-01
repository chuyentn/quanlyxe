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
  "/": ["admin", "manager", "dispatcher", "accountant", "driver", "viewer"],
  "/vehicles": ["admin", "manager", "dispatcher", "accountant", "driver", "viewer"],
  "/drivers": ["admin", "manager", "dispatcher", "accountant", "driver", "viewer"],
  "/routes": ["admin", "manager", "dispatcher", "accountant", "driver", "viewer"],
  "/customers": ["admin", "manager", "dispatcher", "accountant", "driver", "viewer"],
  "/trips": ["admin", "manager", "dispatcher", "accountant", "driver", "viewer"],
  "/expenses": ["admin", "manager", "dispatcher", "accountant", "driver", "viewer"],
  "/dispatch": ["admin", "manager", "dispatcher", "accountant", "driver", "viewer"],
  "/maintenance": ["admin", "manager", "dispatcher", "accountant", "driver", "viewer"],
  "/reports": ["admin", "manager", "accountant", "viewer"],
  "/alerts": ["admin", "manager", "dispatcher", "viewer"],
  "/settings": ["admin"], // Only admin (Keep strict)
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

  // Check for master data existence - REMOVED for performance (unused)
  // const { data: vehicles } = useVehicles();
  // const { data: drivers } = useDrivers();
  // const { data: routes } = useRoutes();
  // const { data: customers } = useCustomers();

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
            // FORCED UNLOCK for debugging
            const isDisabled = false; // !hasAccess(item.path);

            // Hide settings from non-admin users completely
            if (item.path === "/settings" && role !== "admin") {
              return null;
            }

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "nav-item",
                    isActive ? "nav-item-active" : "nav-item-inactive",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5 flex-shrink-0" />
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
      <div className="p-2 border-t border-sidebar-border space-y-2">
        {/* Debug Role Info - Always visible for now to help user */}
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 bg-sidebar-accent/50 rounded">
          {!collapsed && (
            <>
              <p>Role: <span className="font-bold text-primary">{role}</span></p>
            </>
          )}
        </div>

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
