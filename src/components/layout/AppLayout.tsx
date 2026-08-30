import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowRightLeft, Users, PieChart, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store/useStore';
import { calculateBudget } from '../../features/budget/budgetEngine';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: ArrowRightLeft },
  { name: 'People', path: '/people', icon: Users },
  { name: 'Insights', path: '/insights', icon: PieChart },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function AppLayout() {
  const { config, transactions } = useStore();
  const todayDateStr = new Date().toISOString();
  const stats = calculateBudget(config, transactions, todayDateStr);

  const formatCurrency = (val: number) => `₹${Math.round(val).toLocaleString('en-IN')}`;

  return (
    <div className="flex h-screen bg-[var(--color-bg-light)] text-[var(--color-dark)] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--color-surface)] border-r border-[var(--color-gray-light)] shadow-sm shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-[var(--color-gray-light)]">
          <div className="w-9 h-9 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
            P
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-[var(--color-dark)]">Pace<span className="text-[var(--color-primary)]">Wise</span></span>
            <p className="text-[10px] text-[var(--color-gray-dark)] font-semibold uppercase tracking-wider">Student Budget</p>
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1.5 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all',
                  isActive
                    ? 'bg-[var(--color-primary)] text-white shadow-md'
                    : 'text-[var(--color-gray-dark)] hover:bg-[var(--color-surface-light)] hover:text-[var(--color-dark)]'
                )
              }
            >
              <item.icon size={18} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 mt-auto border-t border-[var(--color-gray-light)] space-y-3">
          <div className="bg-[var(--color-surface-light)] rounded-2xl p-3.5 border border-[var(--color-gray-light)]">
            <p className="text-[10px] text-[var(--color-gray-dark)] font-bold uppercase tracking-wider mb-0.5">Money Left</p>
            <p className="text-xl font-extrabold text-[var(--color-dark)]">{formatCurrency(stats.moneyLeft)}</p>
            <p className="text-[11px] text-[var(--color-gray-dark)] font-medium mt-0.5">
              Allowance: {formatCurrency(stats.baseDailyBudget)}/day
            </p>
          </div>

          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-amber-500 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm">
              S
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--color-dark)]">Student Account</p>
              <p className="text-[10px] text-[var(--color-success)] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" /> Active Month
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-y-auto pb-28 md:pb-8">
        <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 md:p-8 lg:p-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-gray-light)] pb-safe shadow-[0_-4px_24px_rgba(20,23,26,0.08)] z-50">
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center py-1.5 px-3 rounded-xl gap-1 transition-all',
                  isActive
                    ? 'text-[var(--color-primary)] font-bold'
                    : 'text-[var(--color-gray-dark)] font-medium'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-bold">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
