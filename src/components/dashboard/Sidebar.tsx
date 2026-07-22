import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Shirt,
  Handshake,
  Heart,
  CreditCard,
  Package,
  BarChart,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  UsersRound,
  Briefcase,
  Bell,
} from "lucide-react";
import logo from "../../assets/KCW-LOGO.png";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    href: "/dashboard",
  },
  {
    label: "Kit Orders",
    icon: <Shirt className="w-5 h-5" />,
    href: "/dashboard/orders",
  },
  {
    label: "Sponsors",
    icon: <Handshake className="w-5 h-5" />,
    href: "/dashboard/sponsors",
  },
  {
    label: "Donations",
    icon: <Heart className="w-5 h-5" />,
    href: "/dashboard/donations",
  },
  {
    label: "Payments",
    icon: <CreditCard className="w-5 h-5" />,
    href: "/dashboard/payments",
  },
  {
    label: "Inventory",
    icon: <Package className="w-5 h-5" />,
    href: "/dashboard/inventory",
  },
  {
    label: "Volunteers",
    icon: <Users className="w-5 h-5" />,
    href: "/dashboard/volunteers",
  },
  {
    label: "Buddy Groups",
    icon: <UsersRound className="w-5 h-5" />,
    href: "/dashboard/buddy-groups",
  },
  {
    label: "Influencers",
    icon: <Briefcase className="w-5 h-5" />,
    href: "/dashboard/influencers",
  },
  {
    label: "Reports",
    icon: <BarChart className="w-5 h-5" />,
    href: "/dashboard/reports",
  },
  {
    label: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    href: "/dashboard/notifications",
  },
  {
    label: "Settings",
    icon: <Settings className="w-5 h-5" />,
    href: "/dashboard/settings",
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-primary shadow-xl z-50 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo and Collapse Section */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="KCW Logo"
                className="h-10 w-auto brightness-0 invert"
              />
              <div>
                <div className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-white">
                  KCW
                </div>
                <div className="font-['Inter'] text-xs text-white/70">
                  KIGALI CANCER WALK
                </div>
              </div>
            </div>
          ) : (
            <img
              src={logo}
              alt="KCW Logo"
              className="h-10 w-auto mx-auto brightness-0 invert"
            />
          )}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg text-white"
          >
            <X className="w-5 h-5" />
          </button>
          {/* Desktop collapse button - now at top */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-white/20 text-white shadow-lg backdrop-blur-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.icon}
                {!isCollapsed && (
                  <span className="font-['Inter'] text-sm font-semibold whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-white/20">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && (
              <span className="font-['Inter'] text-sm font-semibold">
                Logout
              </span>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
