import React from 'react';
import { useStore } from '../store/useStore';
import { calculateBudget } from '../features/budget/budgetEngine';
import { useCurrentDate } from '../hooks/useCurrentDate';
import { format, startOfDay } from 'date-fns';
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
  MoreHorizontal,
  ChevronDown
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
const BurnDownChart = React.memo(({ stats, endLabel = "End of Month" }: { stats: any; endLabel?: string }) => {
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

  // Y-axis: 100 is bottom (0 spent), 0 is top (max spent)
  const getX = React.useCallback((index: number) => {
    if (stats.totalDays <= 1) return 50;
    return (index / (stats.totalDays - 1)) * 100;
  }, [stats.totalDays]);
  
  const getY = React.useCallback((spent: number) => {
    if (stats.effectiveTotalBudget <= 0) return 100;
    const pct = (spent / stats.effectiveTotalBudget) * 100;
    return 100 - Math.max(0, Math.min(100, pct));
  }, [stats.effectiveTotalBudget]);

  const pastStats = React.useMemo(() => 
    stats.dailyStats.filter((s: any) => !s.isFuture || s.dayIndex === stats.daysPassed + 1),
  [stats.dailyStats, stats.daysPassed]);

  // Ideal cumulative spend line
  const idealPathD = React.useMemo(() => {
    if (stats.dailyStats.length === 0) return 'M 0 100';
    const points = stats.dailyStats.map((s: any) => [getX(s.dayIndex - 1), getY(s.cumulativeIdealSpent)]);
    
    let path = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i][0]} ${points[i][1]}`;
    }
    return path;
  }, [stats.dailyStats, getX, getY]);

  // Actual cumulative spend line
  const actualPathD = React.useMemo(() => {
    if (pastStats.length === 0) return 'M 0 100';
    const points = pastStats.map((s: any) => [getX(s.dayIndex - 1), getY(s.cumulativeDiscretionarySpent)]);
    
    if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

    let path = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i][0]} ${points[i][1]}`; // Use straight lines for cumulative graphs to prevent bezier overshoot
    }
    return path;
  }, [pastStats, getX, getY]);

  const fillPathD = React.useMemo(() => {
    if (pastStats.length === 0) return 'M 0 100 L 0 100 Z';
    const lastX = getX(pastStats[pastStats.length - 1].dayIndex - 1);
    // Fill from actual path down to bottom (100)
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
      <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 min-w-0">
        <CardTitle className="text-xs sm:text-base truncate">Spend vs Ideal Path</CardTitle>
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
          
          {/* Ideal Line (Mathematically accurate to baseDailyBudget) */}
          <path 
            d={idealPathD} 
            fill="none" 
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
        {hoverIndex === null && pastStats.length > 0 && (
          <div 
            className="absolute top-0 bottom-0 border-l border-dashed border-[var(--color-gray-light)] transition-opacity duration-200 pointer-events-none"
            style={{ left: `${getX(stats.daysPassed)}%` }}
          >
            <div className="absolute -top-6 -translate-x-1/2 bg-[var(--color-surface)] border border-[var(--color-gray-light)] px-2 py-1 rounded text-[11px] font-medium text-[var(--color-dark)] shadow-sm z-10 whitespace-nowrap">Today</div>
            <div 
              className="absolute -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)] z-10" 
              style={{ top: `${getY(pastStats[pastStats.length - 1]?.cumulativeDiscretionarySpent || 0)}%`, transform: 'translateY(-50%)' }}
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
                className="absolute -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)] pointer-events-none transition-all duration-150 ease-out z-10" 
                style={{ top: `${getY(stats.dailyStats[hoverIndex].cumulativeDiscretionarySpent)}%`, transform: 'translateY(-50%)' }}
              ></div>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-between mt-4 text-[11px] font-medium text-[var(--color-gray-dark)]">
        <span>Start</span>
        <span>{endLabel}</span>
      </div>
    </Card>
  );
});

export function Insights() {
  const { config, transactions, people } = useStore();
  const todayDateStr = useCurrentDate();
  
  // 'week' = This Week, 'current' = This Month, 'last1' = Last Month, 'last2' = 2 Months Ago
  const [timeFilter, setTimeFilter] = React.useState<string>('current');

  const { stats, activeDateRange } = React.useMemo(() => {
    let start: Date;
    let end: Date;

    if (timeFilter === 'current') {
      start = startOfDay(new Date(config.startDate));
      end = startOfDay(new Date(config.endDate));
      const calculatedStats = calculateBudget(config, transactions, todayDateStr);
      return { stats: calculatedStats, activeDateRange: { start, end } };
    }
    
    if (timeFilter === 'week') {
      const now = startOfDay(new Date(todayDateStr));
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = startOfDay(new Date(now.getFullYear(), now.getMonth(), diff));
      end = startOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
      
      const monthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const proratedMoney = (config.totalMoney / monthDays) * 7;
      
      const syntheticConfig = { 
        ...config, 
        totalMoney: proratedMoney, 
        startDate: start.toISOString(), 
        endDate: end.toISOString() 
      };
      const calculatedStats = calculateBudget(syntheticConfig, transactions, todayDateStr);
      return { stats: calculatedStats, activeDateRange: { start, end } };
    }
    
    // Calculate boundaries for past months
    const offset = timeFilter === 'last1' ? 1 : 2;
    const now = new Date(todayDateStr);
    const targetDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    
    start = startOfDay(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
    end = startOfDay(new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0));
    
    const syntheticConfig = { 
      ...config, 
      startDate: start.toISOString(), 
      endDate: end.toISOString() 
    };
    const calculatedStats = calculateBudget(syntheticConfig, transactions, end.toISOString());
    return { stats: calculatedStats, activeDateRange: { start, end } };
  }, [config, transactions, todayDateStr, timeFilter]);

  // Filter expenses strictly inside activeDateRange for period-accurate category and splurge analytics
  const periodExpenses = React.useMemo(() => {
    return transactions.filter(t => {
      if (t.type !== 'expense') return false;
      const tDate = startOfDay(new Date(t.date));
      return tDate.getTime() >= activeDateRange.start.getTime() && tDate.getTime() <= activeDateRange.end.getTime();
    });
  }, [transactions, activeDateRange]);
  
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

  // 2. Discretionary Categories (Scoped to active period)
  const categoryBreakdown = React.useMemo(() => {
    const categoryMap = periodExpenses.reduce((acc, t) => {
      const cat = t.category || 'Other';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: stats.totalDiscretionarySpent > 0 
          ? Math.round((amount / stats.totalDiscretionarySpent) * 100) 
          : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodExpenses, stats.totalDiscretionarySpent]);

  // 3. Largest Splurges (Scoped to active period)
  const largestSplurges = React.useMemo(() => {
    return [...periodExpenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [periodExpenses]);

  // 4. Dynamic Chart End Label
  const chartEndLabel = React.useMemo(() => {
    if (timeFilter === 'week') return 'End of Week';
    if (timeFilter === 'current') return 'End of Month';
    return `End of ${format(activeDateRange.end, 'MMM yyyy')}`;
  }, [timeFilter, activeDateRange.end]);

  // 5. IOUs and Buffer
  const friendsOweYou = people.filter(p => p.balance > 0).reduce((sum, p) => sum + p.balance, 0);

  // 6. Projected Rollover (Active vs Completed Historical Periods)
  const isHistoricalPeriod = timeFilter === 'last1' || timeFilter === 'last2';
  const projectedRollover = isHistoricalPeriod
    ? stats.moneyLeft
    : stats.moneyLeft - (avgDailyDiscretionary * stats.daysRemaining);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-8 sm:pb-0">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">Insights & Analytics</h1>
          <p className="text-[var(--color-gray-dark)] text-sm mt-0.5">Deep dive into your financial pacing and habits.</p>
        </div>
        <div className="relative shrink-0">
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="appearance-none bg-[var(--color-surface)] border border-[var(--color-gray-light)] text-[var(--color-dark)] rounded-xl text-sm font-bold pl-4 pr-10 py-2 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer shadow-sm w-full sm:w-auto"
          >
            <option value="week">This Week</option>
            <option value="current">This Month</option>
            <option value="last1">Last Month</option>
            <option value="last2">2 Months Ago</option>
          </select>
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-gray-dark)] pointer-events-none" />
        </div>
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
            <span className="text-[10px] sm:text-sm text-[var(--color-gray-dark)] shrink-0">/ {formatCurrency(stats.baseDailyBudget)}</span>
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
      <BurnDownChart stats={stats} endLabel={chartEndLabel} />

      {/* Zero-Spend Days & Projected Rollover Side-by-Side */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* Zero-Spend Days */}
        <Card className="flex flex-col justify-between border border-[var(--color-gray-light)] p-3.5 sm:p-6 min-w-0">
          <div className="flex justify-between items-start mb-2 sm:mb-4">
            <Star size={18} className="text-[var(--color-primary)] shrink-0 sm:w-5 sm:h-5" />
            <span className="text-base sm:text-xl">🔥</span>
          </div>
          <CardTitle className="mb-1 text-xs sm:text-base truncate">Zero-Spend Days</CardTitle>
          <div className="text-xl sm:text-[32px] font-bold text-[var(--color-primary)] leading-tight tracking-tight truncate">{stats.zeroSpendDays} Days</div>
          <p className="text-[10px] sm:text-[11px] font-medium text-[var(--color-gray-dark)] mt-2 sm:mt-4 truncate">Current Cycle</p>
        </Card>
        
        {/* Projected Rollover */}
        <Card className="flex flex-col justify-between border border-[var(--color-gray-light)] p-3.5 sm:p-6 min-w-0">
          <div className="flex justify-between items-start mb-2 sm:mb-4">
            <Wallet size={18} className="text-[var(--color-gray-dark)] shrink-0 sm:w-5 sm:h-5" />
          </div>
          <CardTitle className="mb-1 text-xs sm:text-base truncate">
            {isHistoricalPeriod ? "Final Rollover" : "Projected Rollover"}
          </CardTitle>
          <div className={cn(
            "text-xl sm:text-[32px] font-bold leading-tight tracking-tight truncate",
            projectedRollover > 0 ? "text-[var(--color-success)]" : "text-[var(--color-primary)]"
          )}>
            {formatCurrency(projectedRollover)}
          </div>
          <p className="text-[10px] sm:text-[11px] font-medium text-[var(--color-gray-dark)] mt-2 sm:mt-4 truncate">
            {isHistoricalPeriod ? "Actual final balance" : "Estimated next month"}
          </p>
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
