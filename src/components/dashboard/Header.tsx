import { Bell, Search, Calendar, ChevronDown, Menu } from "lucide-react";
import { useState } from "react";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="bg-white border-b border-outline-variant px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-surface-container rounded-lg"
          >
            <Menu className="w-6 h-6 text-on-surface" />
          </button>
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-on-surface">
              Dashboard
            </h1>
            <p className="font-['Inter'] text-sm text-on-surface-variant">
              Welcome back, Admin! Here's what's happening with KCW.
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="hidden md:flex items-center gap-2 bg-surface-container rounded-xl px-4 py-2.5 w-80 border border-outline-variant">
            <Search className="w-5 h-5 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none font-['Inter'] text-sm w-full placeholder:text-on-surface-variant"
            />
          </div>

          {/* Date Range */}
          <div className="hidden lg:flex items-center gap-2 bg-surface-container rounded-xl px-4 py-2.5 border border-outline-variant">
            <Calendar className="w-5 h-5 text-on-surface-variant" />
            <span className="font-['Inter'] text-sm text-on-surface">
              May 1 - May 31, 2026
            </span>
            <ChevronDown className="w-4 h-4 text-on-surface-variant" />
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-surface-container rounded-xl transition-colors">
            <Bell className="w-6 h-6 text-on-surface-variant" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full" />
          </button>

          {/* Profile */}
          <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-2 border border-outline-variant">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="font-['Inter'] text-sm font-bold text-white">AD</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-['Inter'] text-sm font-semibold text-on-surface">
                Admin
              </div>
              <div className="font-['Inter'] text-xs text-on-surface-variant">
                Administrator
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
