import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { calculateBudget } from '../features/budget/budgetEngine';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
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

export function Dashboard() {
  const { config, transactions, people } = useStore();
  const { profile, user } = useAuthStore();
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMoneyModalOpen, setIsMoneyModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  
  const todayDateStr = useCurrentDate();
  const stats = useMemo(() => calculateBudget(config, transactions, todayDateStr), [config, transactions, todayDateStr]);

  const currencySymbol = config.currency || '₹';
  const formatCurrency = (amount: number) => `${currencySymbol}${Math.round(amount).toLocaleString('en-IN')}`;

  // People calculations
  const toReceive = people.filter(p => (p.balance || 0) > 0).reduce((sum, p) => sum + p.balance, 0);
  const toGive = people.filter(p => (p.balance || 0) < 0).reduce((sum, p) => sum + Math.abs(p.balance), 0);
  const peopleOwingCount = people.filter(p => (p.balance || 0) > 0).length;
  const userOwingCount = people.filter(p => (p.balance || 0) < 0).length;
  const netPosition = toReceive - toGive;

  // Recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Recent / Upcoming Bills
  const bills = transactions
    .filter(t => t.type === 'bill')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const spentPercent = stats.todaysAvailable > 0 
    ? Math.min(100, Math.round((stats.spentToday / stats.todaysAvailable) * 100))
    : stats.spentToday > 0 ? 100 : 0;

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
              of {formatCurrency(config.totalMoney)} starting allowance
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
          <Card className="lg:col-span-4 flex flex-col justify-between border border-[var(--color-gray-light)] p-3.5 sm:p-5 min-w-0">
            <div>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm truncate">Today's Budget</CardTitle>
                {stats.isOverspent && (
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{background: 'var(--negative-bg)', color: 'var(--negative-text)', border: '1px solid var(--negative-border)'}}>
                    <AlertTriangle size={10} /> Over
                  </span>
                )}
              </div>
              <div className="mt-2 sm:mt-3 min-w-0">
                <h3 className="text-xl sm:text-3xl font-extrabold text-[var(--color-dark)] leading-none truncate">
                  {formatCurrency(Math.max(0, stats.todaysAvailable - stats.spentToday))}
                </h3>
                <p className="text-[var(--color-gray-dark)] text-[9px] sm:text-xs font-semibold mt-1 truncate">
                  left to spend (of {formatCurrency(stats.todaysAvailable)})
                </p>
              </div>
            </div>

            <div className="mt-3 sm:mt-6 pt-2.5 sm:pt-4 border-t border-[var(--color-gray-light)] flex items-end justify-between min-w-0">
              <div className="min-w-0">
                <p className="text-[9px] sm:text-xs font-bold text-[var(--color-gray-dark)] uppercase truncate">Spent today</p>
                <p className={cn(
                  "text-xs sm:text-lg font-black mt-0.5 leading-none truncate",
                  stats.isOverspent ? "text-[var(--color-primary)]" : "text-[var(--color-dark)]"
                )}>
                  {formatCurrency(stats.spentToday)}
                </p>
              </div>

              <div className="text-right min-w-0 pl-1">
                <p className="text-[9px] sm:text-xs font-bold text-[var(--color-dark)] truncate">
                  Base: {formatCurrency(stats.baseDailyBudget)}
                </p>
                <p className="text-[9px] sm:text-[11px] text-[var(--color-gray-dark)] mt-0.5 truncate">
                  {spentPercent}% used
                </p>
              </div>
            </div>
          </Card>

          {/* Carry Forward Card */}
          <Card
            className="lg:col-span-4 flex flex-col justify-between p-3.5 sm:p-5 min-w-0"
            style={{
              background: stats.carryForward >= 0 ? 'var(--positive-bg)' : 'var(--negative-bg)',
              border: `1px solid ${stats.carryForward >= 0 ? 'var(--positive-border)' : 'var(--negative-border)'}`,
            }}
          >
            <div className="relative z-10 h-full flex flex-col justify-between min-w-0">
              <div className="min-w-0">
                <div className="flex items-center justify-between min-w-0">
                  <CardTitle className="text-xs sm:text-sm truncate" style={{color: stats.carryForward >= 0 ? 'var(--positive-text)' : 'var(--negative-text)'}}>
                    Carry Forward
                  </CardTitle>
                  {stats.carryForward >= 0 ? (
                    <TrendingUp size={16} className="sm:w-5 sm:h-5 shrink-0" style={{color: 'var(--positive-accent)'}} />
                  ) : (
                    <TrendingDown size={16} className="sm:w-5 sm:h-5 text-[var(--color-primary)] shrink-0" />
                  )}
                </div>
                <div className="mt-2 sm:mt-3 min-w-0">
                  <h3 className={cn(
                    "text-xl sm:text-3xl font-extrabold leading-none truncate",
                    stats.carryForward >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-primary)]"
                  )}>
                    {stats.carryForward >= 0 ? `+${formatCurrency(stats.carryForward)}` : `-${formatCurrency(Math.abs(stats.carryForward))}`}
                  </h3>
                  <p className="text-[9px] sm:text-xs font-semibold mt-1 truncate" style={{color: stats.carryForward >= 0 ? 'var(--positive-text)' : 'var(--negative-text)'}}>
                    {stats.carryForward >= 0 ? "Saved from previous days" : "Overspent from previous days"}
                  </p>
                </div>
              </div>

              <div className="hidden sm:block mt-4 pt-3 border-t border-black/5 dark:border-white/5">
                <p className="text-[11px] text-[var(--color-gray-dark)] leading-tight">
                  {stats.carryForward >= 0 
                    ? "Your unspent daily limits are added to today's budget."
                    : "Overspending previously reduces today's allowance."}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Lower Section Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 xl:gap-6">
        
        {/* Main Content (Left) */}
        <div className="lg:col-span-8 flex flex-col space-y-4 sm:space-y-5 xl:space-y-6">
          {/* Quick Actions */}
          <Card className="border border-[var(--color-gray-light)] p-4 sm:p-5 shrink-0">
            <CardTitle className="mb-3 sm:mb-4 text-sm sm:text-xs">Quick Actions</CardTitle>
            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-2xl hover:bg-[var(--color-surface-light)] transition-all group"
              >
                <IconBadge iconName="ArrowUpRight" color="red" className="group-hover:scale-110 scale-90 sm:scale-100" />
                <span className="text-[10px] sm:text-xs font-bold text-[var(--color-dark)] text-center leading-tight">Expense</span>
              </button>
              <button 
                onClick={() => setIsMoneyModalOpen(true)}
                className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-2xl hover:bg-[var(--color-surface-light)] transition-all group"
              >
                <IconBadge iconName="ArrowDownRight" color="green" className="group-hover:scale-110 scale-90 sm:scale-100" />
                <span className="text-[10px] sm:text-xs font-bold text-[var(--color-dark)] text-center leading-tight">Income</span>
              </button>
              <button 
                onClick={() => setIsBillModalOpen(true)}
                className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-2xl hover:bg-[var(--color-surface-light)] transition-all group"
              >
                <IconBadge iconName="CreditCard" color="red" className="group-hover:scale-110 scale-90 sm:scale-100" />
                <span className="text-[10px] sm:text-xs font-bold text-[var(--color-dark)] text-center leading-tight">Pay Bill</span>
              </button>
              <button 
                onClick={() => setIsPersonModalOpen(true)}
                className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-2xl hover:bg-[var(--color-surface-light)] transition-all group"
              >
                <IconBadge iconName="UserPlus" color="blue" className="group-hover:scale-110 scale-90 sm:scale-100" />
                <span className="text-[10px] sm:text-xs font-bold text-[var(--color-dark)] text-center leading-tight">Person</span>
              </button>
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card className="border border-[var(--color-gray-light)] flex-1 flex flex-col p-4 sm:p-5 min-h-[260px] lg:min-h-[300px]">
            <CardHeader className="mb-3 sm:mb-4">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-sm sm:text-xs">Recent Transactions</CardTitle>
                <Link to="/transactions" className="text-[10px] sm:text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                  View All ({transactions.length}) <ArrowRight size={12} />
                </Link>
              </div>
            </CardHeader>

            <div className="mt-0 sm:mt-2 divide-y divide-[var(--color-gray-light)] flex-1 flex flex-col">
              {recentTransactions.map((t) => {
                const meta = getCategoryMeta(t.type, t.category);
                const isIncome = t.type === 'income' || (t.type === 'person' && t.direction === 'took' && t.isSettlement);

                return (
                  <div key={t.id} className="py-2.5 sm:py-3 flex items-center justify-between hover:bg-[var(--color-surface-light)] px-1 sm:px-3 -mx-1 sm:-mx-3 rounded-xl transition-colors gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <IconBadge 
                        iconName={meta.icon} 
                        color={meta.color} 
                        className="scale-90 sm:scale-100 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-[var(--color-dark)] leading-tight truncate">
                          {t.reason || t.category || t.type}
                        </p>
                        <p className="text-[10px] sm:text-xs text-[var(--color-gray-dark)] flex items-center gap-1 mt-0.5 truncate">
                          <span className="capitalize font-semibold text-[var(--color-dark)] shrink-0">
                            {t.type === 'person' && t.personName ? t.personName : (t.category || t.type)}
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
          </Card>
        </div>

        {/* Sidebar (Right) */}
        <div className="lg:col-span-4 flex flex-col space-y-4 sm:space-y-5 xl:space-y-6">
          {/* People Summary & Net Position */}
          <Card className="border border-[var(--color-gray-light)] flex flex-col justify-between p-4 sm:p-5 shrink-0">
            <CardHeader className="mb-3">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <Scale size={16} className="text-[var(--color-primary)]" />
                  <CardTitle className="text-sm sm:text-xs">People & Net Position</CardTitle>
                </div>
                <Link to="/people" className="text-[10px] sm:text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
            </CardHeader>

            {/* Prominent Net Position Banner */}
            <div 
              className="p-3 sm:p-3.5 rounded-2xl mb-3 flex items-center justify-between border transition-all"
              style={{
                background: netPosition > 0 ? 'var(--positive-bg)' : netPosition < 0 ? 'var(--negative-bg)' : 'var(--color-surface-light)',
                borderColor: netPosition > 0 ? 'var(--positive-border)' : netPosition < 0 ? 'var(--negative-border)' : 'var(--color-gray-light)'
              }}
            >
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] block">Net Position</span>
                <p className="text-[10px] sm:text-[11px] font-semibold text-[var(--color-gray-dark)] mt-0.5 truncate">
                  {netPosition > 0 ? "Overall net positive" : netPosition < 0 ? "Overall net payable" : "Completely settled"}
                </p>
              </div>
              <span className={cn(
                "text-lg sm:text-2xl font-black leading-none shrink-0",
                netPosition > 0 ? "text-[var(--color-success)]" : netPosition < 0 ? "text-[var(--color-primary)]" : "text-[var(--color-dark)]"
              )}>
                {netPosition > 0 ? `+${formatCurrency(netPosition)}` : netPosition < 0 ? `-${formatCurrency(Math.abs(netPosition))}` : '₹0'}
              </span>
            </div>

            {/* Side-by-Side To Receive / To Give Cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div
                className="p-2.5 sm:p-3 rounded-2xl flex flex-col justify-between border"
                style={{background: 'var(--positive-bg)', border: '1px solid var(--positive-border)'}}
              >
                <div className="min-w-0">
                  <span className="text-[11px] sm:text-xs font-bold block truncate" style={{color: 'var(--positive-text)'}}>To Receive</span>
                  <p className="text-[9px] sm:text-[11px] text-[var(--color-gray-dark)] font-medium truncate mt-0.5">{peopleOwingCount} owe you</p>
                </div>
                <span className="text-base sm:text-lg font-extrabold text-[var(--color-success)] leading-none mt-2 truncate">
                  {formatCurrency(toReceive)}
                </span>
              </div>

              <div
                className="p-2.5 sm:p-3 rounded-2xl flex flex-col justify-between border"
                style={{background: 'var(--negative-bg)', border: '1px solid var(--negative-border)'}}
              >
                <div className="min-w-0">
                  <span className="text-[11px] sm:text-xs font-bold block truncate" style={{color: 'var(--negative-text)'}}>To Give</span>
                  <p className="text-[9px] sm:text-[11px] text-[var(--color-gray-dark)] font-medium truncate mt-0.5">You owe {userOwingCount}</p>
                </div>
                <span className="text-base sm:text-lg font-extrabold text-[var(--color-primary)] leading-none mt-2 truncate">
                  {formatCurrency(toGive)}
                </span>
              </div>
            </div>
          </Card>

          {/* Bills Card */}
          <Card className="border border-[var(--color-gray-light)] flex-1 flex flex-col justify-between p-4 sm:p-5 min-h-[160px] lg:min-h-[190px]">
            <CardHeader className="mb-2 sm:mb-3 shrink-0">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-sm sm:text-xs">Recent Bills Paid</CardTitle>
                <button onClick={() => setIsBillModalOpen(true)} className="text-[10px] sm:text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                  + Add Bill
                </button>
              </div>
            </CardHeader>
            <div className="space-y-2 mt-0 sm:mt-2 flex-1 flex flex-col">
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
          </Card>
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
