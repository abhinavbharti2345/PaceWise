import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { useStore } from '../store/useStore';
import { calculateBudget } from '../features/budget/budgetEngine';
import { 
  TrendingDown, 
  PieChart, 
  ArrowDownRight, 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';

export function Insights() {
  const { config, transactions } = useStore();
  const todayDateStr = new Date().toISOString();
  const stats = calculateBudget(config, transactions, todayDateStr);

  const formatCurrency = (amount: number) => `₹${Math.round(amount).toLocaleString('en-IN')}`;
  const monthStr = format(new Date(), 'MMMM yyyy');

  // Breakdown calculations
  const totalNormalExpenses = transactions
    .filter(t => t.type === 'expense' || (t.type === 'person' && t.direction === 'gave' && !t.isSettlement))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBills = transactions
    .filter(t => t.type === 'bill')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income' || (t.type === 'person' && t.direction === 'took' && t.isSettlement))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAllSpending = totalNormalExpenses + totalBills;

  // Category breakdown
  const categoryMap = transactions
    .filter(t => t.type === 'expense' || t.type === 'bill')
    .reduce((acc, t) => {
      const cat = t.category || (t.type === 'bill' ? 'Bills' : 'Other');
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAllSpending > 0 ? Math.round((amount / totalAllSpending) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Largest expenses
  const largestExpenses = [...transactions]
    .filter(t => t.type === 'expense' || t.type === 'bill')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const currentDayOfMonth = Math.max(1, new Date().getDate());
  const avgDailySpend = Math.round(totalAllSpending / currentDayOfMonth);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header>
        <h1 className="text-2xl font-bold">Insights & Analytics</h1>
        <p className="text-[var(--color-gray-dark)] text-sm">{monthStr} Budget Breakdown & Spending Habits</p>
      </header>

      {/* Row 1: Key Monthly Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 border border-[var(--color-gray-light)]">
          <p className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider">Starting Allowance</p>
          <h3 className="text-2xl font-extrabold text-[var(--color-dark)] mt-1.5">{formatCurrency(config.totalMoney)}</h3>
          <p className="text-[11px] text-[var(--color-gray-dark)] mt-1">Allocated for the month</p>
        </Card>

        <Card className="p-5 border border-[var(--color-gray-light)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider" style={{color: 'var(--positive-text)'}}>Extra Income</p>
            <ArrowDownRight size={16} style={{color: 'var(--positive-accent)'}} />
          </div>
          <h3 className="text-2xl font-extrabold text-[var(--color-success)] mt-1.5">+{formatCurrency(totalIncome)}</h3>
          <p className="text-[11px] text-[var(--color-gray-dark)] mt-1">Pocket money, gigs & repayments</p>
        </Card>

        <Card className="p-5 border border-[var(--color-gray-light)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Bills & Fixed</p>
            <CreditCard size={16} className="text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-2xl font-extrabold text-[var(--color-primary)] mt-1.5">−{formatCurrency(totalBills)}</h3>
          <p className="text-[11px] text-[var(--color-gray-dark)] mt-1">Rent, credit card & utilities</p>
        </Card>

        <Card className="p-5 border border-[var(--color-gray-light)]">
          <p className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider">Discretionary Spend</p>
          <h3 className="text-2xl font-extrabold text-[var(--color-dark)] mt-1.5">{formatCurrency(totalNormalExpenses)}</h3>
          <p className="text-[11px] text-[var(--color-gray-dark)] mt-1">Food, travel, shopping, etc.</p>
        </Card>
      </div>

      {/* Row 2: Pacing Health & Daily Average Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border border-[var(--color-gray-light)]">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <PieChart size={18} className="text-blue-500" />
                <CardTitle>Pacing Health</CardTitle>
              </div>
              {stats.isOverspent ? (
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"
                  style={{background: 'var(--negative-bg)', color: 'var(--negative-text)', border: '1px solid var(--negative-border)'}}
                >
                  <AlertTriangle size={12} /> Over Daily Pace
                </span>
              ) : (
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"
                  style={{background: 'var(--positive-bg)', color: 'var(--positive-text)', border: '1px solid var(--positive-border)'}}
                >
                  <ShieldCheck size={12} /> Healthy Pacing
                </span>
              )}
            </div>
          </CardHeader>

          <div className="space-y-4 mt-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-[var(--color-gray-dark)]">Month Budget Consumed</span>
                <span className="text-[var(--color-dark)]">
                  {Math.round((totalAllSpending / (stats.effectiveTotalBudget || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-[var(--color-surface-light)] rounded-full h-3 overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    stats.moneyLeft <= 0 ? "bg-red-600" : "bg-[var(--color-primary)]"
                  )}
                  style={{ width: `${Math.min(100, (totalAllSpending / (stats.effectiveTotalBudget || 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-[var(--color-surface-light)] rounded-2xl space-y-1.5 text-xs text-[var(--color-dark)]">
              <p className="font-bold flex items-center gap-1.5">
                💡 Pacing Recommendation:
              </p>
              <p className="text-[var(--color-gray-dark)] leading-relaxed">
                You have <strong className="text-[var(--color-dark)]">{formatCurrency(stats.moneyLeft)}</strong> remaining across <strong className="text-[var(--color-dark)]">{stats.daysRemaining} days</strong>. Safe recommended daily allowance is <strong className="text-[var(--color-dark)]">{formatCurrency(stats.baseDailyBudget)}/day</strong>.
              </p>
            </div>
          </div>
        </Card>

        {/* Daily Spending Rate Card */}
        <Card className="border border-[var(--color-gray-light)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown size={18} className="text-amber-500" />
              <CardTitle>Daily Spending Rate</CardTitle>
            </div>
          </CardHeader>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--color-surface-light)]">
              <p className="text-xs font-bold text-[var(--color-gray-dark)] uppercase">Actual Avg. Spend</p>
              <h4 className="text-3xl font-extrabold text-[var(--color-dark)] mt-1">{formatCurrency(avgDailySpend)}</h4>
              <p className="text-[10px] text-[var(--color-gray-dark)] mt-0.5">per day so far</p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-surface-light)]">
              <p className="text-xs font-bold text-[var(--color-gray-dark)] uppercase">Target Base Daily</p>
              <h4 className="text-3xl font-extrabold text-[var(--color-primary)] mt-1">{formatCurrency(stats.baseDailyBudget)}</h4>
              <p className="text-[10px] text-[var(--color-gray-dark)] mt-0.5">recommended limit</p>
            </div>
          </div>

          <p className="text-xs text-[var(--color-gray-dark)] mt-4">
            {avgDailySpend <= stats.baseDailyBudget 
              ? " Great job! Your average spending is below your daily target budget."
              : "⚠️ Your actual daily spend exceeds your target. Consider trimming discretionary expenses to avoid month-end deficits."}
          </p>
        </Card>
      </div>

      {/* Row 3: Category Breakdown & Top Expenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Category Breakdown */}
        <Card className="border border-[var(--color-gray-light)]">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>

          <div className="mt-4 space-y-3.5">
            {categoryBreakdown.map((item) => (
              <div key={item.category} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[var(--color-dark)] flex items-center gap-1.5">
                    <span>{item.category}</span>
                  </span>
                  <span className="text-[var(--color-gray-dark)]">
                    {formatCurrency(item.amount)} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-[var(--color-surface-light)] rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-[var(--color-primary)] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}

            {categoryBreakdown.length === 0 && (
              <p className="text-sm text-[var(--color-gray-dark)] py-8 text-center">No expense categories to display yet.</p>
            )}
          </div>
        </Card>

        {/* Largest Expenses */}
        <Card className="border border-[var(--color-gray-light)]">
          <CardHeader>
            <CardTitle>Largest Outflows</CardTitle>
          </CardHeader>

          <div className="mt-3 divide-y divide-[var(--color-gray-light)]">
            {largestExpenses.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs">
                    ₹
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--color-dark)]">{t.reason || t.category || t.type}</p>
                    <p className="text-[10px] text-[var(--color-gray-dark)]">{format(new Date(t.date), 'dd MMM yyyy')} • {t.category || t.type}</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-[var(--color-primary)]">
                  {formatCurrency(t.amount)}
                </span>
              </div>
            ))}

            {largestExpenses.length === 0 && (
              <p className="text-sm text-[var(--color-gray-dark)] py-8 text-center">No expenses recorded yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
