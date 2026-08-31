import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowRightLeft, Users, PieChart, Settings, User } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
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
  const { profile, user } = useAuthStore();
  const todayDateStr = new Date().toISOString();
  const stats = calculateBudget(config, transactions, todayDateStr);

  const formatCurrency = (val: number) => `${config.currency || '₹'}${Math.round(val).toLocaleString('en-IN')}`;

  return (
    <div className="flex h-screen bg-[var(--color-bg-light)] text-[var(--color-dark)] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-3xl my-3 ml-3 shadow-sm shrink-0 overflow-hidden">
        <div className="p-6 flex items-center gap-3 border-b border-[var(--color-gray-light)]">
          <div className="w-9 h-9 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
            P
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-[var(--color-dark)]">Pace<span className="text-[var(--color-primary)]">Wise</span></span>
            <p className="text-[10px] text-[var(--color-gray-dark)] font-semibold uppercase tracking-wider">Personal Budget</p>
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

          <NavLink 
            to="/profile"
            className={({ isActive }) => 
              cn(
                "flex items-center gap-3 px-2 py-1.5 rounded-xl transition-all cursor-pointer",
                isActive ? "bg-[var(--color-surface-light)] shadow-sm" : "hover:bg-[var(--color-surface-light)]"
              )
            }
          >
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-amber-500 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm shrink-0 overflow-hidden">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (profile?.displayName || user?.email || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-[var(--color-dark)] truncate">
                {profile?.displayName || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[10px] text-[var(--color-success)] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" /> Active Month
              </p>
            </div>
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-y-auto pb-28 md:pb-8">
        <div className="flex-1 flex flex-col w-full max-w-[1440px] mx-auto p-4 sm:p-6 md:p-8 lg:p-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-gray-light)] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(20,23,26,0.08)] z-30">
        <div className="flex items-center justify-around px-1 sm:px-2 py-1 sm:py-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center py-1 px-1.5 sm:px-3 rounded-xl gap-0.5 sm:gap-1 transition-all shrink-0',
                  isActive
                    ? 'text-[var(--color-primary)] font-bold'
                    : 'text-[var(--color-gray-dark)] font-medium'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className="sm:w-[22px] sm:h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[9px] sm:text-[10px] font-bold">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center py-1 px-1.5 sm:px-3 rounded-xl gap-0.5 sm:gap-1 transition-all shrink-0',
                isActive
                  ? 'text-[var(--color-primary)] font-bold'
                  : 'text-[var(--color-gray-dark)] font-medium'
              )
            }
          >
            {({ isActive }) => (
              <>
                <User size={20} className="sm:w-[22px] sm:h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] sm:text-[10px] font-bold">Profile</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
