import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { calculateBudget } from '../features/budget/budgetEngine';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IconBadge } from '../components/ui/IconBadge';
import { AddExpenseModal } from '../components/modals/AddExpenseModal';
import { AddMoneyModal } from '../components/modals/AddMoneyModal';
import { AddBillModal } from '../components/modals/AddBillModal';
import { AddPersonModal } from '../components/modals/AddPersonModal';
import { format } from 'date-fns';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  Receipt
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
  
  const todayDateStr = new Date().toISOString();
  const stats = calculateBudget(config, transactions, todayDateStr);

  const formatCurrency = (amount: number) => `₹${Math.round(amount).toLocaleString('en-IN')}`;

  const todayStr = format(new Date(), 'EEEE, d MMMM yyyy');

  // People calculations
  const toReceive = people.filter(p => (p.balance || 0) > 0).reduce((sum, p) => sum + p.balance, 0);
  const toGive = people.filter(p => (p.balance || 0) < 0).reduce((sum, p) => sum + Math.abs(p.balance), 0);
  const peopleOwingCount = people.filter(p => (p.balance || 0) > 0).length;
  const userOwingCount = people.filter(p => (p.balance || 0) < 0).length;

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

  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">Good day, {displayName} 👋</h1>
          <p className="text-[var(--color-gray-dark)] text-sm mt-0.5">{todayStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 font-semibold"
            onClick={() => setIsMoneyModalOpen(true)}
          >
            <Plus size={16} className="text-[var(--color-success)]" />
            <span>Add Money</span>
          </Button>
          <Button 
            variant="primary" 
            className="flex items-center gap-2 font-bold shadow-md"
            onClick={() => setIsExpenseModalOpen(true)}
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </Button>
        </div>
      </header>

      {/* Row 1: Hero & Budget Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6">
        {/* Money Left Hero Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#1c1c1e] via-[#2c1515] to-[#991b1b] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-200">Total Money Left</span>
            <span className="text-xs font-semibold text-red-200 bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
              {stats.daysRemaining} days left
            </span>
          </div>
          <div className="my-4">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">{formatCurrency(stats.moneyLeft)}</h2>
            <p className="text-red-200 text-sm mt-1.5 font-medium">
              of {formatCurrency(config.totalMoney)} starting allowance
            </p>
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-red-200 font-semibold mb-1.5">
              <span>Remaining Budget</span>
              <span>{Math.max(0, Math.round((stats.moneyLeft / (config.totalMoney || 1)) * 100))}%</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden backdrop-blur-sm">
              <div 
                className="bg-gradient-to-r from-red-400 to-white h-full rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, Math.max(0, (stats.moneyLeft / (config.totalMoney || 1)) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Today's Budget Card */}
        <Card className="lg:col-span-4 flex flex-col justify-between border border-[var(--color-gray-light)]">
          <div>
            <div className="flex items-center justify-between">
              <CardTitle>Today's Budget</CardTitle>
              {stats.isOverspent && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background: 'var(--negative-bg)', color: 'var(--negative-text)', border: '1px solid var(--negative-border)'}}>
                  <AlertTriangle size={12} /> Over budget
                </span>
              )}
            </div>
            <div className="mt-3">
              <h3 className="text-4xl font-extrabold text-[var(--color-dark)]">
                {formatCurrency(Math.max(0, stats.todaysAvailable - stats.spentToday))}
              </h3>
              <p className="text-[var(--color-gray-dark)] text-xs font-semibold mt-1">
                left to spend today (of {formatCurrency(stats.todaysAvailable)})
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--color-gray-light)] flex items-end justify-between">
            <div>
              <p className="text-xs font-bold text-[var(--color-gray-dark)] uppercase">Spent today</p>
              <p className={cn(
                "text-lg font-black mt-0.5",
                stats.isOverspent ? "text-[var(--color-primary)]" : "text-[var(--color-dark)]"
              )}>
                {formatCurrency(stats.spentToday)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold text-[var(--color-dark)]">
                Base: {formatCurrency(stats.baseDailyBudget)}/day
              </p>
              <p className="text-[11px] text-[var(--color-gray-dark)] mt-0.5">
                {spentPercent}% used today
              </p>
            </div>
          </div>
        </Card>

        {/* Carry Forward Card */}
        <Card
          className="lg:col-span-3 flex flex-col justify-between"
          style={{
            background: stats.carryForward >= 0 ? 'var(--positive-bg)' : 'var(--negative-bg)',
            border: `1px solid ${stats.carryForward >= 0 ? 'var(--positive-border)' : 'var(--negative-border)'}`,
          }}
        >
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
            <div className="flex items-center justify-between">
              <CardTitle style={{color: stats.carryForward >= 0 ? 'var(--positive-text)' : 'var(--negative-text)'}}>
                Carry Forward
              </CardTitle>
              {stats.carryForward >= 0 ? (
                <TrendingUp size={20} style={{color: 'var(--positive-accent)'}} />
              ) : (
                <TrendingDown size={20} className="text-[var(--color-primary)]" />
              )}
            </div>
            <div className="mt-3">
              <h3 className={cn(
                "text-3xl font-extrabold",
                stats.carryForward >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-primary)]"
              )}>
                {stats.carryForward >= 0 ? `+${formatCurrency(stats.carryForward)}` : `-${formatCurrency(Math.abs(stats.carryForward))}`}
              </h3>
              <p className="text-xs font-semibold mt-1" style={{color: stats.carryForward >= 0 ? 'var(--positive-text)' : 'var(--negative-text)'}}>
                {stats.carryForward >= 0 ? "Saved from previous days" : "Deficit from previous days"}
              </p>
            </div>
          </div>

            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
              <p className="text-[11px] text-[var(--color-gray-dark)] leading-tight">
                {stats.carryForward >= 0 
                  ? "Your unspent daily limits are added to today's budget."
                  : "Overspending previously reduces today's allowance."}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lower Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6">
        
        {/* Main Content (Left) */}
        <div className="lg:col-span-8 flex flex-col">
          {/* Recent Transactions */}
          <Card className="border border-[var(--color-gray-light)] flex-1 flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle>Recent Transactions</CardTitle>
                <Link to="/transactions" className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                  View All ({transactions.length}) <ArrowRight size={12} />
                </Link>
              </div>
            </CardHeader>

            <div className="mt-4 divide-y divide-[var(--color-gray-light)]">
              {recentTransactions.map((t) => {
                const meta = getCategoryMeta(t.type, t.category);
                const isIncome = t.type === 'income' || (t.type === 'person' && t.direction === 'took' && t.isSettlement);

                return (
                  <div key={t.id} className="py-3 flex items-center justify-between hover:bg-[var(--color-surface-light)] px-3 -mx-3 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <IconBadge 
                        iconName={meta.icon} 
                        color={meta.color} 
                      />
                      <div>
                        <p className="text-sm font-bold text-[var(--color-dark)]">
                          {t.reason || t.category || t.type}
                        </p>
                        <p className="text-xs text-[var(--color-gray-dark)] flex items-center gap-1 mt-0.5">
                          <span className="capitalize font-semibold text-[var(--color-dark)]">{t.category || t.type}</span>
                          <span>•</span>
                          <span>{format(new Date(t.date), 'd MMM, h:mm a')}</span>
                        </p>
                      </div>
                    </div>

                    <span className={cn(
                      'text-base font-extrabold', 
                      isIncome ? 'text-[var(--color-success)]' : 'text-[var(--color-primary)]'
                    )}>
                      {isIncome ? '+' : '−'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                );
              })}

              {recentTransactions.length === 0 && (
                <div className="text-center py-12 text-[var(--color-gray-dark)]">
                  <p className="font-semibold text-sm">No transactions yet.</p>
                  <p className="text-xs mt-1">Tap "Add Expense" above to record your first transaction.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar (Right) */}
        <div className="lg:col-span-4 space-y-5 xl:space-y-6">
          {/* Quick Actions */}
        <Card className="border border-[var(--color-gray-light)]">
          <CardTitle className="mb-4">Quick Actions</CardTitle>
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-[var(--color-surface-light)] transition-all group"
            >
              <IconBadge iconName="ArrowUpRight" color="red" className="group-hover:scale-110" />
              <span className="text-xs font-bold text-[var(--color-dark)] text-center leading-tight">Expense</span>
            </button>
            <button 
              onClick={() => setIsMoneyModalOpen(true)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-[var(--color-surface-light)] transition-all group"
            >
              <IconBadge iconName="ArrowDownRight" color="green" className="group-hover:scale-110" />
              <span className="text-xs font-bold text-[var(--color-dark)] text-center leading-tight">Income</span>
            </button>
            <button 
              onClick={() => setIsBillModalOpen(true)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-[var(--color-surface-light)] transition-all group"
            >
              <IconBadge iconName="CreditCard" color="red" className="group-hover:scale-110" />
              <span className="text-xs font-bold text-[var(--color-dark)] text-center leading-tight">Pay Bill</span>
            </button>
            <button 
              onClick={() => setIsPersonModalOpen(true)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-[var(--color-surface-light)] transition-all group"
            >
              <IconBadge iconName="UserPlus" color="blue" className="group-hover:scale-110" />
              <span className="text-xs font-bold text-[var(--color-dark)] text-center leading-tight">Person</span>
            </button>
          </div>
        </Card>

        {/* People Summary */}
        <Card className="border border-[var(--color-gray-light)] flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle>People Summary</CardTitle>
              <Link to="/people" className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <div className="space-y-3 mt-2">
            <div
              className="flex justify-between items-center p-2.5 rounded-xl"
              style={{background: 'var(--positive-bg)', border: '1px solid var(--positive-border)'}}
            >
              <div>
                <span className="text-xs font-bold" style={{color: 'var(--positive-text)'}}>To Receive</span>
                <p className="text-[11px] text-[var(--color-gray-dark)]">{peopleOwingCount} people owe you</p>
              </div>
              <span className="text-lg font-extrabold text-[var(--color-success)]">{formatCurrency(toReceive)}</span>
            </div>
            <div
              className="flex justify-between items-center p-2.5 rounded-xl"
              style={{background: 'var(--negative-bg)', border: '1px solid var(--negative-border)'}}
            >
              <div>
                <span className="text-xs font-bold" style={{color: 'var(--negative-text)'}}>To Give</span>
                <p className="text-[11px] text-[var(--color-gray-dark)]">You owe {userOwingCount} people</p>
              </div>
              <span className="text-lg font-extrabold text-[var(--color-primary)]">{formatCurrency(toGive)}</span>
            </div>
          </div>
        </Card>

        {/* Bills Card */}
        <Card className="border border-[var(--color-gray-light)] flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle>Recent Bills Paid</CardTitle>
              <button onClick={() => setIsBillModalOpen(true)} className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                + Add Bill
              </button>
            </div>
          </CardHeader>
          <div className="space-y-2 mt-2">
            {bills.length > 0 ? (
              bills.map(b => (
                <div key={b.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--color-surface-light)] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <IconBadge iconName="CreditCard" color="red" size="sm" />
                    <div>
                      <p className="text-xs font-bold text-[var(--color-dark)]">{b.category || 'Bill'}</p>
                      <p className="text-[10px] text-[var(--color-gray-dark)]">{format(new Date(b.date), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[var(--color-primary)]">{formatCurrency(b.amount)}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-[var(--color-gray-dark)]">
                <Receipt size={24} className="mx-auto mb-1 opacity-40" />
                <p className="text-xs font-semibold">No bills recorded</p>
                <p className="text-[10px]">Record fixed payments like Rent or Credit Card.</p>
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
