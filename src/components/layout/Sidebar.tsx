import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Send,
  Users,
  Settings,
  FileStack,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/documents", label: "Tài liệu", icon: FileText },
  { to: "/distributions", label: "Phân phát & Thu hồi", icon: Send },
  { to: "/employees", label: "Nhân viên", icon: Users },
  { to: "/settings", label: "Cài đặt", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay trên mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar text-white transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 px-5">
          <div className="flex items-center gap-2">
            <FileStack className="h-6 w-6 text-sky-300" />
            <div className="leading-tight">
              <p className="text-sm font-bold">Document Control</p>
              <p className="text-[11px] text-sky-200/80">Quản lý tài liệu</p>
            </div>
          </div>
          <button
            className="rounded p-1 text-sky-200 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-sky-100/80 hover:bg-white/10 hover:text-white"
                )
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 text-[11px] text-sky-200/70">
          Phase 1 · localStorage
        </div>
      </aside>
    </>
  );
}
