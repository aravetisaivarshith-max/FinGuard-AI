import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react';
import { AppRoute } from '../types/finguard';

interface WorkspaceShellProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  userName: string;
  userEmail: string;
  userPhoto: string;
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: AppRoute; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ListOrdered },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'risk-monitor', label: 'Risk Monitor', icon: Activity },
  { id: 'scam-awareness', label: 'Scam Awareness', icon: ShieldAlert },
  { id: 'models-report', label: 'Models & Report', icon: BookOpen },
  { id: 'account-privacy', label: 'Account & Privacy', icon: UserCheck },
];

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  activeRoute,
  onNavigate,
  userName,
  userEmail,
  userPhoto,
  onSignOut,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeLabel = NAV_ITEMS.find((item) => item.id === activeRoute)?.label ?? 'Overview';

  const handleNavClick = (route: AppRoute) => {
    onNavigate(route);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#0B1220] text-slate-200 border-r border-slate-800">
        <div className="px-6 py-5 border-b border-slate-800/80">
          <span className="text-lg font-bold tracking-tight text-white font-display whitespace-nowrap">
            FinGuard AI
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#0D9488] text-white'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center gap-3 mb-3">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center text-sm font-semibold shrink-0">
                {userName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[80vw] bg-[#0B1220] text-slate-200 flex flex-col h-full z-10">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-base font-bold text-white font-display">FinGuard AI</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeRoute === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-[#0D9488] text-white'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onSignOut}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
              <span className="hidden sm:inline whitespace-nowrap">FinGuard Workspace</span>
              <span className="hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-[#0F172A] truncate">{activeLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline text-xs text-slate-500 whitespace-nowrap">
              Scoped to {userEmail}
            </span>
            <button
              type="button"
              onClick={() => handleNavClick('transactions')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Add Transaction
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-[1200px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
