import React from 'react';
import { useStore } from '../store/useStore';
import { calculateBudget } from '../features/budget/budgetEngine';
import { useCurrentDate } from '../hooks/useCurrentDate';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import { Card, CardTitle } from '../components/ui/Card';
import { 
  ShieldCheck, 
  TrendingDown, 
  Star, 
  Wallet, 
  PieChart, 
  ShoppingBag, 
  ArrowRightLeft, 
  Users, 
  CalendarDays,
  Ticket,
  Smartphone,
  Coffee,
  Car,
  Home,
  Zap,
  MoreHorizontal
} from 'lucide-react';

// A mapping for category icons (using Lucide icons)
const getCategoryIcon = (category: string) => {
  const c = (category || '').toLowerCase();
  if (c.includes('food') || c.includes('coffee') || c.includes('dining')) return <Coffee size={16} className="text-[var(--color-primary)]" />;
  if (c.includes('transport') || c.includes('travel') || c.includes('cab')) return <Car size={16} className="text-[var(--color-orange)]" />;
  if (c.includes('entertainment') || c.includes('movie') || c.includes('concert')) return <Ticket size={16} className="text-[var(--color-success)]" />;
  if (c.includes('shopping') || c.includes('clothes')) return <ShoppingBag size={16} className="text-[var(--color-primary)]" />;
  if (c.includes('tech') || c.includes('gadget') || c.includes('electronics')) return <Smartphone size={16} className="text-[var(--color-primary)]" />;
  if (c.includes('home') || c.includes('rent')) return <Home size={16} className="text-[var(--color-gray-dark)]" />;
  if (c.includes('utility') || c.includes('bill')) return <Zap size={16} className="text-[var(--color-orange)]" />;
  return <MoreHorizontal size={16} className="text-[var(--color-gray-dark)]" />;
};

const formatCurrency = (amount: number) => `₹${Math.round(amount).toLocaleString('en-IN')}`;

// Extracted to prevent entire Insights page re-rendering on hover
const BurnDownChart = React.memo(({ stats }: { stats: any }) => {
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

  // We want to show cumulative spending.
  // 0% (top) means 0 spent. 100% (bottom) means total budget spent.
  // So Y = (spent / budget) * 100.
  // Wait, if Y=0 is TOP, then spent=0 -> Y=0 (top). spent=budget -> Y=100 (bottom).
  // So the line starts at top left and goes down to bottom right. This represents cumulative spent accurately.
  
  const getX = React.useCallback((index: number) => {
    if (stats.totalDays <= 1) return 50;
    return (index / (stats.totalDays - 1)) * 100;
  }, [stats.totalDays]);
  
  const getY = React.useCallback((spent: number) => {
    if (stats.effectiveTotalBudget <= 0) return 0;
    const pct = (spent / stats.effectiveTotalBudget) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [stats.effectiveTotalBudget]);

  const pastStats = React.useMemo(() => 
    stats.dailyStats.filter((s: any) => !s.isFuture || s.dayIndex === stats.daysPassed + 1),
  [stats.dailyStats, stats.daysPassed]);

  // Actual cumulative spend line
  const actualPathD = React.useMemo(() => {
    if (pastStats.length === 0) return 'M 0 0';
    const points = pastStats.map((s: any) => [getX(s.dayIndex - 1), getY(s.cumulativeDiscretionarySpent)]);
    
    if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

    let path = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev[0] + curr[0]) / 2;
      path += ` C ${cpX},${prev[1]} ${cpX},${curr[1]} ${curr[0]},${curr[1]}`;
    }
    return path;
  }, [pastStats, getX, getY]);

  const fillPathD = React.useMemo(() => {
    if (pastStats.length === 0) return 'M 0 100 L 0 100 Z';
    const lastX = getX(pastStats[pastStats.length - 1].dayIndex - 1);
    // Fill from actual path down to bottom (100) or up to top?
    // Usually fill is below the line. Since Y goes from 0 (top) to 100 (bottom),
    // below the line is from Y to 0? No, 100 is bottom.
    // If the line is at Y=20, below it is Y=100. 
    return `${actualPathD} L ${lastX} 100 L 0 100 Z`;
  }, [actualPathD, pastStats, getX]);

  const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (stats.totalDays <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const estimatedIndex = Math.round((xPct / 100) * (stats.totalDays - 1));
    const clampedIndex = Math.max(0, Math.min(stats.totalDays - 1, estimatedIndex));
    setHoverIndex(clampedIndex);
  }, [stats.totalDays]);

  const handleMouseLeave = React.useCallback(() => setHoverIndex(null), []);

  return (
    <Card className="lg:col-span-2 flex flex-col relative border border-[var(--color-gray-light)] p-5 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <CardTitle>Spend vs Ideal Path</CardTitle>
        <select className="bg-[var(--color-surface)] border border-[var(--color-gray-light)] text-[var(--color-dark)] rounded-lg text-[11px] font-medium px-2 py-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none">
          <option>This Month</option>
        </select>
      </div>
      <div 
        className="flex-grow relative min-h-[200px] rounded-b-lg border-b border-[var(--color-primary)]/30 bg-gradient-to-b from-[var(--color-primary)]/10 dark:from-[var(--color-primary)]/20 to-transparent flex items-end group/chart cursor-crosshair touch-pan-y"
        onPointerMove={handleMouseMove}
        onPointerLeave={handleMouseLeave}
      >
        
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)"></stop>
              <stop offset="100%" stopColor="transparent"></stop>
            </linearGradient>
          </defs>
          
          {/* Ideal Line (Diagonal - from top left to bottom right) */}
          <line
            x1="0"
            y1="0"
            x2="100"
            y2="100"
            stroke="var(--color-gray-light)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="4 4"
            opacity="0.8"
          />

          {/* Actual Path Fill */}
          <path d={fillPathD} fill="url(#grad)" className="opacity-40" />
          
          {/* Actual Path Stroke */}
          <path d={actualPathD} fill="none" stroke="var(--color-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        
        {/* Today Indicator (only shown if not hovering) */}
        {stats.daysPassed > 0 && hoverIndex === null && (
          <div 
            className="absolute top-0 bottom-0 border-l border-dashed border-[var(--color-gray-light)] transition-opacity duration-200 pointer-events-none"
            style={{ left: `${getX(stats.daysPassed)}%` }}
          >
            <div className="absolute -top-6 -translate-x-1/2 bg-[var(--color-surface)] border border-[var(--color-gray-light)] px-2 py-1 rounded text-[11px] font-medium text-[var(--color-dark)] shadow-sm">Today</div>
            <div 
              className="absolute -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)]" 
              style={{ top: `${getY(pastStats[pastStats.length - 1]?.cumulativeDiscretionarySpent || 0)}%` }}
            ></div>
          </div>
        )}

        {/* Interactive Tooltip */}
        {hoverIndex !== null && stats.dailyStats[hoverIndex] && (
          <div 
            className="absolute top-0 bottom-0 border-l border-solid border-[var(--color-gray-dark)] z-20 pointer-events-none transition-all duration-150 ease-out"
            style={{ left: `${getX(hoverIndex)}%` }}
          >
            {/* Tooltip Card */}
            <div 
              className={cn(
                "absolute top-4 bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl shadow-xl p-2.5 sm:p-3 min-w-[150px] sm:min-w-[170px] whitespace-nowrap z-30 pointer-events-none",
                getX(hoverIndex) > 70 ? "right-2" : getX(hoverIndex) < 30 ? "left-2" : "-translate-x-1/2"
              )}
            >
              <div className="flex justify-between items-center text-[11px] font-bold text-[var(--color-dark)] mb-3 uppercase tracking-wide border-b border-[var(--color-gray-light)] pb-1">
                <span>Day {stats.dailyStats[hoverIndex].dayIndex}</span>
                <span className="text-[var(--color-gray-dark)] font-medium">{format(new Date(stats.dailyStats[hoverIndex].date), 'MMM dd')}</span>
              </div>
              
              <div className="flex flex-col gap-1.5 text-[12px]">
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--color-gray-dark)]">Ideal spent</span>
                  <span className="font-medium text-[var(--color-dark)]">{formatCurrency(stats.dailyStats[hoverIndex].cumulativeIdealSpent)}</span>
                </div>
                
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--color-gray-dark)]">Spent till day</span>
                  <span className="font-semibold text-[var(--color-primary)]">
                    {stats.dailyStats[hoverIndex].isFuture ? '-' : formatCurrency(stats.dailyStats[hoverIndex].cumulativeDiscretionarySpent)}
                  </span>
                </div>
                
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--color-gray-dark)]">Spent today</span>
                  <span className="font-medium text-[var(--color-dark)]">
                    {stats.dailyStats[hoverIndex].isFuture ? '-' : formatCurrency(stats.dailyStats[hoverIndex].discretionarySpent)}
                  </span>
                </div>

                {!stats.dailyStats[hoverIndex].isFuture && (() => {
                  const diff = stats.dailyStats[hoverIndex].cumulativeIdealSpent - stats.dailyStats[hoverIndex].cumulativeDiscretionarySpent;
                  const isUnder = diff >= 0;
                  return (
                    <div className="flex justify-between gap-4 pt-2 mt-1 border-t border-[var(--color-gray-light)]">
                      <span className={cn("font-medium", isUnder ? "text-[var(--color-success)]" : "text-[var(--color-primary)]")}>
                        {isUnder ? 'Under pace' : 'Over pace'}
                      </span>
                      <span className={cn("font-bold", isUnder ? "text-[var(--color-success)]" : "text-[var(--color-primary)]")}>
                        {formatCurrency(Math.abs(diff))}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {/* Point dot on line */}
            {!stats.dailyStats[hoverIndex].isFuture && (
              <div 
                className="absolute -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)] pointer-events-none transition-all duration-150 ease-out" 
                style={{ top: `${getY(stats.dailyStats[hoverIndex].cumulativeDiscretionarySpent)}%` }}
              ></div>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-between mt-4 text-[11px] font-medium text-[var(--color-gray-dark)]">
        <span>Start</span>
        <span>End of Month</span>
      </div>
    </Card>
  );
});

export function Insights() {
  const { config, transactions, people } = useStore();
  const todayDateStr = useCurrentDate();
  const stats = calculateBudget(config, transactions, todayDateStr);
  
  // 1. Pacing Narrative Logic
  const avgDailyDiscretionary = Math.round(stats.totalDiscretionarySpent / Math.max(1, stats.daysPassed));
  let heroTitle = "Pacing Health";
  let heroMessage: React.ReactNode = "";
  let badgeText = "On Track";
  let badgeColor = "text-[var(--color-success)]";
  let badgeBg = "bg-[var(--color-positive-bg)]";

  if (stats.moneyLeft < 0) {
    heroMessage = <>Deficit: <span className="font-bold text-[var(--color-primary)]">{formatCurrency(Math.abs(stats.moneyLeft))}</span></>;
    badgeText = "Critical Deficit";
    badgeColor = "text-[var(--color-primary)]";
    badgeBg = "bg-[var(--negative-bg)]";
  } else if (stats.daysPassed === 0) {
    heroMessage = <>Limit: <span className="font-bold text-[var(--color-success)]">{formatCurrency(stats.baseDailyBudget)}</span>/d</>;
    badgeText = "Fresh Start";
  } else if (stats.isOverspent) {
    heroMessage = <><span className="font-bold text-[var(--color-primary)]">{formatCurrency(avgDailyDiscretionary)}</span>/d (High)</>;
    badgeText = "Overspending";
    badgeColor = "text-[var(--color-primary)]";
    badgeBg = "bg-[var(--negative-bg)]";
  } else if (stats.carryForward > 0) {
    heroMessage = <>Saved <span className="font-bold text-[var(--color-primary)]">{formatCurrency(stats.carryForward)}</span> extra</>;
  } else {
    heroMessage = <>Perfect: <span className="font-bold text-[var(--color-success)]">{formatCurrency(avgDailyDiscretionary)}</span>/d</>;
  }

  // 2. Discretionary Categories (Leakage)
  const categoryMap = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const cat = t.category || 'Other';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: stats.totalDiscretionarySpent > 0 ? Math.round((amount / stats.totalDiscretionarySpent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 3. Largest Splurges
  const largestSplurges = transactions
    .filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  // 4. IOUs and Buffer
  const friendsOweYou = people.filter(p => p.balance > 0).reduce((sum, p) => sum + p.balance, 0);

  // 5. Projected Rollover
  const projectedRollover = stats.moneyLeft - (avgDailyDiscretionary * stats.daysRemaining);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-8 sm:pb-0">
      {/* Page Header */}
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">Insights & Analytics</h1>
        <p className="text-[var(--color-gray-dark)] text-sm mt-0.5">Deep dive into your financial pacing and habits.</p>
      </header>
      
      {/* Top Row: Pacing Health & Daily Spend Engine Side-by-Side */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* Pacing Health Hero */}
        <Card className="flex flex-col justify-between relative overflow-hidden group border border-[var(--color-gray-light)] p-3.5 sm:p-6 min-w-0">
          <div className="absolute inset-0 bg-[var(--color-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="flex justify-between items-start mb-2 sm:mb-4">
            <ShieldCheck className="text-[var(--color-success)] shrink-0 sm:w-8 sm:h-8" size={22} />
            <span className={cn("inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[11px] font-medium shrink-0", badgeBg, badgeColor)}>
              <TrendingDown size={12} className="sm:w-3.5 sm:h-3.5" /> {badgeText}
            </span>
          </div>
          <div>
            <h3 className="text-xs sm:text-lg font-bold text-[var(--color-dark)] mb-1 truncate">{heroTitle}</h3>
            <p className="text-[13px] sm:text-xl font-extrabold text-[var(--color-success)] leading-tight sm:truncate break-words line-clamp-2 sm:line-clamp-none">
              {heroMessage}
            </p>
          </div>
        </Card>

        {/* Daily Spend Engine */}
        <Card className="flex flex-col justify-between border border-[var(--color-gray-light)] p-3.5 sm:p-6 min-w-0">
          <div className="flex justify-between items-start mb-2 sm:mb-4">
            <TrendingDown size={20} className="text-[var(--color-gray-dark)] shrink-0 sm:w-5 sm:h-5" />
            <span className={cn(
              "inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[11px] font-medium shrink-0",
              avgDailyDiscretionary <= stats.baseDailyBudget ? "bg-[var(--color-positive-bg)] text-[var(--color-success)]" : "bg-[var(--negative-bg)] text-[var(--color-primary)]"
            )}>
              {avgDailyDiscretionary <= stats.baseDailyBudget ? "Better" : "Worse"}
            </span>
          </div>
          <CardTitle className="mb-1 text-xs sm:text-base truncate">Daily Spend Engine</CardTitle>
          <div className="flex items-baseline gap-1 sm:gap-2 truncate">
            <span className="text-lg sm:text-[32px] font-bold text-[var(--color-dark)] leading-tight tracking-tight truncate">{formatCurrency(avgDailyDiscretionary)}</span>
            <span className="text-[10px] sm:text-sm text-[var(--color-gray-dark)] line-through shrink-0">/ {formatCurrency(stats.baseDailyBudget)}</span>
          </div>
          <div className="mt-2 sm:mt-4 w-full h-1.5 bg-[var(--color-surface-light)] rounded-full overflow-hidden">
            <div 
              className={cn("h-full", avgDailyDiscretionary <= stats.baseDailyBudget ? "bg-[var(--color-success)]" : "bg-[var(--color-primary)]")} 
              style={{ width: `${Math.min(100, stats.baseDailyBudget > 0 ? (avgDailyDiscretionary / stats.baseDailyBudget) * 100 : 0)}%` }}
            ></div>
          </div>
        </Card>
      </div>

      {/* Burn-down Chart */}
      <BurnDownChart stats={stats} />

      {/* Zero-Spend Streak & Projected Rollover Side-by-Side */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* Zero-Spend Days */}
        <Card className="flex flex-col justify-between border border-[var(--color-gray-light)] p-3.5 sm:p-6 min-w-0">
          <div className="flex justify-between items-start mb-2 sm:mb-4">
            <Star size={18} className="text-[var(--color-primary)] shrink-0 sm:w-5 sm:h-5" />
            <span className="text-base sm:text-xl">🔥</span>
          </div>
          <CardTitle className="mb-1 text-xs sm:text-base truncate">Zero-Spend Streak</CardTitle>
          <div className="text-xl sm:text-[32px] font-bold text-[var(--color-primary)] leading-tight tracking-tight truncate">{stats.zeroSpendDays} Days</div>
          <p className="text-[10px] sm:text-[11px] font-medium text-[var(--color-gray-dark)] mt-2 sm:mt-4 truncate">Current Cycle</p>
        </Card>
        
        {/* Projected Rollover */}
        <Card className="flex flex-col justify-between border border-[var(--color-gray-light)] p-3.5 sm:p-6 min-w-0">
          <div className="flex justify-between items-start mb-2 sm:mb-4">
            <Wallet size={18} className="text-[var(--color-gray-dark)] shrink-0 sm:w-5 sm:h-5" />
          </div>
          <CardTitle className="mb-1 text-xs sm:text-base truncate">Projected Rollover</CardTitle>
          <div className={cn(
            "text-xl sm:text-[32px] font-bold leading-tight tracking-tight truncate",
            projectedRollover > 0 ? "text-[var(--color-success)]" : "text-[var(--color-primary)]"
          )}>
            {formatCurrency(projectedRollover)}
          </div>
          <p className="text-[10px] sm:text-[11px] font-medium text-[var(--color-gray-dark)] mt-2 sm:mt-4 truncate">Estimated next month</p>
        </Card>
      </div>

      {/* Bottom Row: Categories, Splurges, IOUs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Where it's going */}
        <Card className="flex flex-col border border-[var(--color-gray-light)] p-5 sm:p-6">
          <CardTitle className="mb-6 flex items-center gap-2">
            <PieChart size={16} /> Where it's going
          </CardTitle>
          <div className="flex flex-col gap-4">
            {categoryBreakdown.length > 0 ? categoryBreakdown.map((item, idx) => {
              const colors = [
                { bg: 'bg-[var(--color-primary)]', text: 'text-[var(--color-primary)]' },
                { bg: 'bg-[var(--color-orange)]', text: 'text-[var(--color-orange)]' },
                { bg: 'bg-[var(--color-success)]', text: 'text-[var(--color-success)]' },
                { bg: 'bg-[var(--color-gray-dark)]', text: 'text-[var(--color-gray-dark)]' },
              ];
              const c = colors[idx % colors.length];
              
              return (
                <div key={item.category}>
                  <div className="flex justify-between text-[11px] font-medium mb-1">
                    <span className="text-[var(--color-dark)]">{item.category}</span>
                    <span className={cn("font-bold", c.text)}>{item.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--color-surface-light)] rounded-full overflow-hidden">
                    <div className={cn("h-full", c.bg)} style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-[var(--color-gray-dark)] py-2">No discretionary expenses yet.</p>
            )}
          </div>
        </Card>
        
        {/* Largest Splurges */}
        <Card className="flex flex-col border border-[var(--color-gray-light)] p-5 sm:p-6">
          <CardTitle className="mb-6 flex items-center gap-2">
            <ShoppingBag size={16} /> Largest Splurges
          </CardTitle>
          <div className="flex flex-col gap-4">
            {largestSplurges.length > 0 ? largestSplurges.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] hover:border-[var(--color-primary)]/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-gray-light)] flex items-center justify-center shrink-0">
                    {getCategoryIcon(t.category || t.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-[var(--color-dark)] truncate">{t.reason || t.category || 'Purchase'}</div>
                    <div className="text-[10px] font-medium text-[var(--color-gray-dark)]">
                      {format(new Date(t.date), 'MMM dd')} • {t.category || t.type}
                    </div>
                  </div>
                </div>
                <div className="text-[12px] font-semibold text-[var(--color-primary)] tracking-wide shrink-0 ml-2">- {formatCurrency(t.amount)}</div>
              </div>
            )) : (
              <p className="text-sm text-[var(--color-gray-dark)] py-2">No expenses to show.</p>
            )}
          </div>
        </Card>
        
        {/* IOUs & Hidden Liquidity */}
        <Card className="flex flex-col border border-[var(--color-gray-light)] p-5 sm:p-6">
          <CardTitle className="mb-6 flex items-center gap-2">
            <ArrowRightLeft size={16} /> IOUs & Hidden Liquidity
          </CardTitle>
          <div className="flex flex-col gap-4">
            {/* Friends Owe You */}
            <div
              className="flex items-center justify-between p-4 rounded-xl relative overflow-hidden"
              style={{ background: 'var(--positive-bg)', border: '1px solid var(--positive-border)' }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-success)]" />
              <div>
                <div className="text-[11px] font-medium" style={{ color: 'var(--positive-text)' }}>Friends owe you</div>
                <div className="text-xl font-semibold text-[var(--color-success)] leading-7 mt-1">+{formatCurrency(friendsOweYou)}</div>
              </div>
              <Users size={30} className="text-[var(--color-success)] opacity-50" />
            </div>
            
            {/* Fixed Bills Paid */}
            <div
              className="flex items-center justify-between p-4 rounded-xl relative overflow-hidden"
              style={{ background: 'var(--negative-bg)', border: '1px solid var(--negative-border)' }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-primary)]" />
              <div>
                <div className="text-[11px] font-medium" style={{ color: 'var(--negative-text)' }}>Fixed Bills Paid</div>
                <div className="text-xl font-semibold text-[var(--color-dark)] leading-7 mt-1">{formatCurrency(stats.totalBills)}</div>
              </div>
              <CalendarDays size={30} className="text-[var(--color-primary)] opacity-50" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
