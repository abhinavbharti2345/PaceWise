import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { calculateBudget } from '../features/budget/budgetEngine';
import { IconBadge } from '../components/ui/IconBadge';
import { LiveClock } from '../components/ui/LiveClock';
import { AddExpenseModal } from '../components/modals/AddExpenseModal';
import { AddMoneyModal } from '../components/modals/AddMoneyModal';
import { AddBillModal } from '../components/modals/AddBillModal';
import { AddPersonModal } from '../components/modals/AddPersonModal';
import { useCurrentDate } from '../hooks/useCurrentDate';
import { format } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  Scale,
  ArrowRightLeft,
  CreditCard
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getCategoryMeta } from '../utils/categoryHelpers';
import { formatCurrency as formatCurrencyUtil } from '../utils/currencyUtils';

export function Dashboard() {
  const { config, transactions, people, customCategories, customBillCategories = [] } = useStore();
  const { profile, user } = useAuthStore();
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMoneyModalOpen, setIsMoneyModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  
  const todayDateStr = useCurrentDate();
  const stats = useMemo(() => calculateBudget(config, transactions, todayDateStr), [config, transactions, todayDateStr]);

  const currencySymbol = config.currency || '₹';
  const formatCurrency = (amount: number) => formatCurrencyUtil(amount, currencySymbol);

  // People calculations
  const toReceive = people.filter(p => (p.balance || 0) > 0).reduce((sum, p) => sum + p.balance, 0);
  const toGive = people.filter(p => (p.balance || 0) < 0).reduce((sum, p) => sum + Math.abs(p.balance), 0);
  const peopleOwingCount = people.filter(p => (p.balance || 0) > 0).length;
  const userOwingCount = people.filter(p => (p.balance || 0) < 0).length;
  const netPosition = toReceive - toGive;

  // Recent transactions (adaptive)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  // Recent / Upcoming Bills
  const bills = transactions
    .filter(t => t.type === 'bill')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const spentPercent = stats.todaysAvailable > 0 
    ? Math.min(100, Math.round((stats.spentToday / stats.todaysAvailable) * 100))
    : stats.spentToday > 0 ? 100 : 0;

  const bufferDays = stats.baseDailyBudget > 0 
    ? (Math.abs(stats.carryForward) / stats.baseDailyBudget).toFixed(1) 
    : '0';

  const paceDiff = stats.remainingDailyPace - stats.baseDailyBudget;
  const paceBoostFormatted = paceDiff >= 0 
    ? `+${formatCurrency(paceDiff)}/d` 
    : `-${formatCurrency(Math.abs(paceDiff))}/d`;

  const displayName = profile?.displayName
    || user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'User';

  return (
    <div className="flex-1 flex flex-col space-y-4 sm:space-y-5 xl:space-y-6 animate-in fade-in duration-300 pb-8 sm:pb-0 min-h-full">
      {/* Top Header */}
      <header>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">Good day, {displayName} 👋</h1>
          <LiveClock />
        </div>
      </header>

      {/* Row 1: Hero & Budget Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 xl:gap-6">
        {/* Money Left Hero Card */}
        <div className="lg:col-span-4 bg-gradient-to-br from-[#1c1c1e] via-[#2c1515] to-[#991b1b] rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px] sm:min-h-[220px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-red-200">Total Money Left</span>
            <span className="text-[10px] sm:text-xs font-semibold text-red-200 bg-black/30 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full backdrop-blur-sm">
              {stats.daysRemaining} days left
            </span>
          </div>
          <div className="my-3 sm:my-4">
            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight leading-none truncate">{formatCurrency(stats.moneyLeft)}</h2>
            <p className="text-red-200 text-xs sm:text-sm mt-1 sm:mt-1.5 font-medium opacity-90 truncate">
              of {formatCurrency(stats.effectiveTotalBudget)} total budget
            </p>
          </div>
          <div>
            <div className="flex justify-between text-[10px] sm:text-[11px] text-red-200 font-semibold mb-1 sm:mb-1.5">
              <span>Remaining Budget</span>
              <span>{stats.progressPercentage}%</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-1.5 sm:h-2 overflow-hidden backdrop-blur-sm">
              <div 
                className="bg-gradient-to-r from-red-400 to-white h-full rounded-full transition-all duration-1000" 
                style={{ width: `${stats.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Side-by-Side Container for Today's Budget & Carry Forward on Mobile / lg:contents on Desktop */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:contents">
          {/* Today's Budget Card */}
          <div className="lg:col-span-4 rounded-3xl p-5 sm:p-6 flex flex-col justify-between min-w-0 text-white shadow-xl relative overflow-hidden bg-gradient-to-br from-[#121624] via-[#16233b] to-[#1d4ed8] min-h-[160px] sm:min-h-[220px]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-blue-200 truncate">
                  Today's Budget
                </span>
                {stats.isOverspent && (
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-red-500/20 text-red-200 border border-red-400/40 backdrop-blur-sm">
                    <AlertTriangle size={10} /> Over
                  </span>
                )}
              </div>
              <div className="mt-2 sm:mt-3 min-w-0">
                <h3 className="text-xl sm:text-3xl font-black text-white leading-none truncate">
                  {formatCurrency(Math.max(0, stats.todaysAvailable - stats.spentToday))}
                </h3>
                <p className="text-blue-200/90 text-[9px] sm:text-xs font-semibold mt-1 truncate">
                  left to spend (of {formatCurrency(stats.todaysAvailable)})
                </p>
              </div>
            </div>

            <div className="mt-3 sm:mt-6 pt-2.5 sm:pt-4 border-t border-blue-700/40 flex items-end justify-between min-w-0">
              <div className="min-w-0">
                <p className="text-[9px] sm:text-xs font-bold text-blue-200/80 uppercase truncate">Spent today</p>
                <p className={cn(
                  "text-xs sm:text-lg font-black mt-0.5 leading-none truncate",
                  stats.isOverspent ? "text-red-300" : "text-white"
                )}>
                  {formatCurrency(stats.spentToday)}
                </p>
                <p className="text-[9px] sm:text-[10px] text-blue-200/80 mt-0.5 truncate font-medium">
                  {spentPercent}% used
                </p>
              </div>

              <div className="text-right min-w-0 pl-1">
                <p className="text-[9px] sm:text-xs font-bold text-blue-200/90 truncate">
                  Pace: <span className="font-black text-white">{formatCurrency(stats.remainingDailyPace)}</span><span className="text-[9px] sm:text-[10px] font-normal text-blue-200/70">/d</span>
                </p>
                <p className="text-[9px] sm:text-[10px] text-blue-200/80 mt-0.5 truncate font-medium">
                  Base: {formatCurrency(stats.baseDailyBudget)}
                </p>
              </div>
            </div>
          </div>

          {/* Carry Forward Card */}
          <div
            className={cn(
              "lg:col-span-4 rounded-3xl p-5 sm:p-6 flex flex-col justify-between min-w-0 text-white shadow-xl relative overflow-hidden min-h-[160px] sm:min-h-[220px]",
              stats.carryForward >= 0
                ? "bg-gradient-to-br from-[#151c17] via-[#143222] to-[#047857]"
                : "bg-gradient-to-br from-[#1c1c1e] via-[#2d1515] to-[#7f1d1d]"
            )}
          >
            <div className="relative z-10 h-full flex flex-col justify-between min-w-0">
              <div className="min-w-0">
                <div className="flex items-center justify-between min-w-0">
                  <span className={cn(
                    "text-xs sm:text-sm font-extrabold uppercase tracking-wide truncate",
                    stats.carryForward >= 0 ? "text-emerald-200" : "text-red-200"
                  )}>
                    Carry Forward
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {stats.carryForward > 0 && Number(bufferDays) >= 1 && (
                      <span 
                        className="text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center bg-black/40 text-emerald-200 border border-emerald-400/30 backdrop-blur-sm shadow-xs"
                      >
                        +{bufferDays}d buffer
                      </span>
                    )}
                    {stats.carryForward >= 0 ? (
                      <TrendingUp size={18} className="sm:w-5 sm:h-5 text-emerald-300 shrink-0" />
                    ) : (
                      <TrendingDown size={18} className="sm:w-5 sm:h-5 text-red-300 shrink-0" />
                    )}
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 min-w-0">
                  <h3 className="text-xl sm:text-3xl font-black text-white leading-none truncate">
                    {stats.carryForward >= 0 ? `+${formatCurrency(stats.carryForward)}` : `-${formatCurrency(Math.abs(stats.carryForward))}`}
                  </h3>
                  <p className={cn(
                    "text-[9px] sm:text-xs font-semibold mt-1 truncate",
                    stats.carryForward >= 0 ? "text-emerald-200/90" : "text-red-200/90"
                  )}>
                    {stats.carryForward >= 0 ? "Saved from previous days" : "Overspent from previous days"}
                  </p>
                </div>
              </div>

              {/* Symmetrical 2-Column Footer */}
              <div 
                className={cn(
                  "mt-3 sm:mt-6 pt-2.5 sm:pt-4 border-t flex items-end justify-between min-w-0",
                  stats.carryForward >= 0 ? "border-emerald-700/40" : "border-red-800/40"
                )}
              >
                <div className="min-w-0">
                  <p className={cn(
                    "text-[9px] sm:text-xs font-bold uppercase truncate",
                    stats.carryForward >= 0 ? "text-emerald-200/80" : "text-red-200/80"
                  )}>
                    Runway Cushion
                  </p>
                  <p className="text-xs sm:text-lg font-black text-white mt-0.5 leading-none truncate">
                    {stats.carryForward >= 0 ? `+${bufferDays} Days` : `-${bufferDays} Days`}
                  </p>
                  <p className={cn(
                    "text-[9px] sm:text-[10px] mt-0.5 truncate font-medium",
                    stats.carryForward >= 0 ? "text-emerald-200/80" : "text-red-200/80"
                  )}>
                    {paceDiff >= 0 ? `${paceBoostFormatted} boost` : `${paceBoostFormatted} drag`}
                  </p>
                </div>

                <div className="text-right min-w-0 pl-1">
                  <p className={cn(
                    "text-[9px] sm:text-xs font-bold truncate",
                    stats.carryForward >= 0 ? "text-emerald-200/90" : "text-red-200/90"
                  )}>
                    Status: <span className="font-black text-white">{stats.remainingDailyPace >= stats.baseDailyBudget ? '🟢 Ahead' : '🔴 Behind'}</span>
                  </p>
                  <p className={cn(
                    "text-[9px] sm:text-[10px] mt-0.5 truncate font-medium",
                    stats.carryForward >= 0 ? "text-emerald-200/80" : "text-red-200/80"
                  )}>
                    Base: {formatCurrency(stats.baseDailyBudget)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section Grid with Responsive Mobile/Desktop Ordering */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 xl:gap-10 pt-2 items-stretch">
        {/* 1. Quick Actions (Mobile: 1st | Desktop: Top Left Col 8) */}
        <div className="order-1 lg:order-1 lg:col-span-8 flex flex-col justify-between bg-[var(--color-bg-light)] border border-[var(--color-gray-light)] dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-sm lg:bg-transparent lg:border-none lg:p-0 lg:shadow-none">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-2xl hover:bg-[var(--color-surface-light)] transition-all group border border-transparent hover:border-[var(--color-gray-light)]"
            >
              <IconBadge iconName="ArrowUpRight" color="red" className="group-hover:scale-110 scale-95 sm:scale-100 transition-transform" />
              <span className="text-[11px] sm:text-xs font-bold text-[var(--color-dark)] text-center leading-tight">Expense</span>
            </button>
            <button 
              onClick={() => setIsMoneyModalOpen(true)}
              className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-2xl hover:bg-[var(--color-surface-light)] transition-all group border border-transparent hover:border-[var(--color-gray-light)]"
            >
              <IconBadge iconName="ArrowDownRight" color="green" className="group-hover:scale-110 scale-95 sm:scale-100 transition-transform" />
              <span className="text-[11px] sm:text-xs font-bold text-[var(--color-dark)] text-center leading-tight">Income</span>
            </button>
            <button 
              onClick={() => setIsBillModalOpen(true)}
              className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-2xl hover:bg-[var(--color-surface-light)] transition-all group border border-transparent hover:border-[var(--color-gray-light)]"
            >
              <IconBadge iconName="CreditCard" color="red" className="group-hover:scale-110 scale-95 sm:scale-100 transition-transform" />
              <span className="text-[11px] sm:text-xs font-bold text-[var(--color-dark)] text-center leading-tight">Pay Bill</span>
            </button>
            <button 
              onClick={() => setIsPersonModalOpen(true)}
              className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-2xl hover:bg-[var(--color-surface-light)] transition-all group border border-transparent hover:border-[var(--color-gray-light)]"
            >
              <IconBadge iconName="UserPlus" color="blue" className="group-hover:scale-110 scale-95 sm:scale-100 transition-transform" />
              <span className="text-[11px] sm:text-xs font-bold text-[var(--color-dark)] text-center leading-tight">Person</span>
            </button>
          </div>
        </div>

        {/* 2. People Summary & Net Position (Mobile: Card Style | Desktop: Compact Open Strip) */}
        <div className="order-3 lg:order-2 lg:col-span-4 flex flex-col justify-between">
          {/* MOBILE VIEW (< lg): Card Container matching page background */}
          <div className="lg:hidden bg-[var(--color-bg-light)] border border-[var(--color-gray-light)] dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Scale size={16} className="text-[var(--color-primary)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">People & Net Position</h3>
              </div>
              <Link to="/people" className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {/* Net Position (Borderless / Clean) */}
            <div className="flex items-center justify-between pt-1">
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)] block">Net Position</span>
                <p className="text-[11px] font-semibold text-[var(--color-gray-dark)] mt-0.5 truncate">
                  {netPosition > 0 ? "Overall net positive" : netPosition < 0 ? "Overall net payable" : "Completely settled"}
                </p>
              </div>
              <span className={cn(
                "text-2xl font-black leading-none shrink-0",
                netPosition > 0 ? "text-[var(--color-success)]" : netPosition < 0 ? "text-[var(--color-primary)]" : "text-[var(--color-dark)]"
              )}>
                {netPosition > 0 ? `+${formatCurrency(netPosition)}` : netPosition < 0 ? `-${formatCurrency(Math.abs(netPosition))}` : '₹0'}
              </span>
            </div>

            {/* Side-by-Side To Receive / To Give (Clean borderless split) */}
            <div className="grid grid-cols-2 gap-4 pt-3.5 border-t border-[var(--color-gray-light)]">
              <div className="min-w-0">
                <span className="text-xs font-bold block truncate text-[var(--color-dark)]">To Receive</span>
                <span className="text-xl font-extrabold text-[var(--color-success)] leading-tight block mt-1 truncate">
                  {formatCurrency(toReceive)}
                </span>
                <p className="text-[10px] text-[var(--color-gray-dark)] font-medium truncate mt-0.5">{peopleOwingCount} owe you</p>
              </div>

              <div className="min-w-0 pl-4 border-l border-[var(--color-gray-light)]">
                <span className="text-xs font-bold block truncate text-[var(--color-dark)]">To Give</span>
                <span className="text-xl font-extrabold text-[var(--color-primary)] leading-tight block mt-1 truncate">
                  {formatCurrency(toGive)}
                </span>
                <p className="text-[10px] text-[var(--color-gray-dark)] font-medium truncate mt-0.5">You owe {userOwingCount}</p>
              </div>
            </div>
          </div>

          {/* DESKTOP VIEW (lg+): Open Strip for Horizontal Symmetry */}
          <div className="hidden lg:flex flex-col justify-between h-full">
            <div className="flex items-center justify-between w-full mb-3">
              <div className="flex items-center gap-1.5">
                <Scale size={15} className="text-[var(--color-primary)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">People & Net Position</h3>
              </div>
              <Link to="/people" className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            <div className="flex items-center justify-between py-1.5 px-0.5">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] block">
                  Net Position
                </span>
                <div className={cn(
                  "text-xl sm:text-2xl font-black leading-tight mt-0.5",
                  netPosition > 0 ? "text-[var(--color-success)]" : netPosition < 0 ? "text-[var(--color-primary)]" : "text-[var(--color-dark)]"
                )}>
                  {netPosition > 0 ? `+${formatCurrency(netPosition)}` : netPosition < 0 ? `-${formatCurrency(Math.abs(netPosition))}` : '₹0'}
                </div>
                <p className="text-[10px] text-[var(--color-gray-dark)] font-semibold truncate mt-0.5">
                  {netPosition > 0 ? "Overall net positive" : netPosition < 0 ? "Overall net payable" : "Settled"}
                </p>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 text-right shrink-0">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)] block">To Receive</span>
                  <span className="text-sm sm:text-base font-extrabold text-[var(--color-success)] leading-tight block">
                    {formatCurrency(toReceive)}
                  </span>
                  <span className="text-[9px] text-[var(--color-gray-dark)] font-medium">{peopleOwingCount} owe you</span>
                </div>

                <div className="h-8 w-px bg-[var(--color-gray-light)]"></div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)] block">To Give</span>
                  <span className="text-sm sm:text-base font-extrabold text-[var(--color-primary)] leading-tight block">
                    {formatCurrency(toGive)}
                  </span>
                  <span className="text-[9px] text-[var(--color-gray-dark)] font-medium">You owe {userOwingCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Recent Transactions (Mobile: 2nd [above People] | Desktop: Bottom Left Col 8) */}
        <div className="order-2 lg:order-3 lg:col-span-8 flex flex-col min-h-[260px] lg:min-h-[300px] bg-[var(--color-bg-light)] border border-[var(--color-gray-light)] dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-sm lg:bg-transparent lg:border-none lg:p-0 lg:shadow-none">
          <div className="flex items-center justify-between w-full pb-3 border-b border-[var(--color-gray-light)] mb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">Recent Transactions</h3>
            <Link to="/transactions" className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
              View All ({transactions.length}) <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-[var(--color-gray-light)] flex-1 flex flex-col">
            {recentTransactions.map((t) => {
              const meta = getCategoryMeta(t.type, t.category, customCategories, customBillCategories);
              const isIncome = t.type === 'income' || (t.type === 'person' && t.direction === 'took' && t.isSettlement);

              return (
                <div key={t.id} className="py-3 flex items-center justify-between hover:bg-[var(--color-surface-light)] px-2 -mx-2 rounded-xl transition-colors gap-2">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <IconBadge 
                      iconName={meta.icon} 
                      color={meta.color} 
                      className="scale-95 sm:scale-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-[var(--color-dark)] leading-tight truncate">
                        {t.reason || t.category || t.type}
                      </p>
                      <p className="text-[10px] sm:text-xs text-[var(--color-gray-dark)] flex items-center gap-1 mt-0.5 truncate">
                        <span className="capitalize font-semibold text-[var(--color-dark)] shrink-0">
                          {t.personName ? t.personName : (t.category || t.type)}
                        </span>
                        <span>•</span>
                        <span className="shrink-0">{format(new Date(t.date), 'd MMM, h:mm a')}</span>
                      </p>
                    </div>
                  </div>

                  <span className={cn(
                    'text-sm sm:text-base font-extrabold shrink-0', 
                    isIncome ? 'text-[var(--color-success)]' : 'text-[var(--color-primary)]'
                  )}>
                    {isIncome ? '+' : '−'}{formatCurrency(t.amount)}
                  </span>
                </div>
              );
            })}

            {recentTransactions.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-8 sm:py-12 text-[var(--color-gray-dark)] my-auto">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] flex items-center justify-center mb-2.5 text-[var(--color-gray-dark)] opacity-70">
                  <ArrowRightLeft size={20} />
                </div>
                <p className="font-bold text-xs sm:text-sm text-[var(--color-dark)]">No transactions yet</p>
                <p className="text-[11px] text-[var(--color-gray-dark)] mt-1 max-w-xs text-center">Add your daily expenses or income to track your cash flow.</p>
              </div>
            )}
          </div>
        </div>

        {/* 4. Recent Bills Paid (Mobile: 4th | Desktop: Bottom Right Col 4) */}
        <div className="order-4 lg:order-4 lg:col-span-4 flex flex-col justify-between min-h-[160px] lg:min-h-[190px] bg-[var(--color-bg-light)] border border-[var(--color-gray-light)] dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-sm lg:bg-transparent lg:border-none lg:p-0 lg:shadow-none">
          <div className="flex items-center justify-between w-full pb-3 border-b border-[var(--color-gray-light)] mb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">Recent Bills Paid</h3>
            <button onClick={() => setIsBillModalOpen(true)} className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
              + Add Bill
            </button>
          </div>
          <div className="space-y-1 mt-1 flex-1 flex flex-col">
            {bills.length > 0 ? (
              bills.map(b => (
                <div key={b.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--color-surface-light)] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <IconBadge iconName="CreditCard" color="red" size="sm" className="scale-90 sm:scale-100" />
                    <div>
                      <p className="text-[11px] sm:text-xs font-bold text-[var(--color-dark)] leading-tight">{b.category || 'Bill'}</p>
                      <p className="text-[9px] sm:text-[10px] text-[var(--color-gray-dark)] mt-0.5">{format(new Date(b.date), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[var(--color-primary)]">{formatCurrency(b.amount)}</span>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-4 sm:py-6 text-[var(--color-gray-dark)] my-auto">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] flex items-center justify-center mb-2 text-[var(--color-gray-dark)] opacity-70">
                  <CreditCard size={18} />
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-[var(--color-dark)]">No bills recorded</p>
                <p className="text-[9px] sm:text-[10px] mt-0.5 text-center text-[var(--color-gray-dark)]">Record fixed payments like Rent or Credit Card.</p>
              </div>
            )}
          </div>
        </div>
      </div>

    {/* Modals */}
      <AddExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
      />
      <AddMoneyModal
        isOpen={isMoneyModalOpen}
        onClose={() => setIsMoneyModalOpen(false)}
      />
      <AddBillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
      />
      <AddPersonModal
        isOpen={isPersonModalOpen}
        onClose={() => setIsPersonModalOpen(false)}
      />
    </div>
  );
}
