import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
  ChevronDown,
  ChevronRight,
  BarChart3,
  Flame
} from 'lucide-react';
import { formatCurrency } from '../utils/currencyUtils';
import { CategoryDetailModal } from '../components/modals/CategoryDetailModal';
import { SplurgeDetailModal } from '../components/modals/SplurgeDetailModal';
import { EditTransactionModal } from '../components/modals/EditTransactionModal';
import type { Transaction } from '../features/budget/budgetEngine';

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

const CATEGORY_COLORS = [
  '#f43f5e', // Rose / Primary
  '#f97316', // Orange
  '#10b981', // Emerald / Success
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#eab308', // Yellow
  '#64748b', // Slate
];

// Extracted to prevent entire Insights page re-rendering on hover
const BurnDownChart = React.memo(({ stats, endLabel = "End of Month" }: { stats: any; endLabel?: string }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Y-axis: 100 is bottom (0 spent), 0 is top (max spent)
  const getX = useCallback((index: number) => {
    if (stats.totalDays <= 1) return 50;
    return (index / (stats.totalDays - 1)) * 100;
  }, [stats.totalDays]);

  const getY = useCallback((spent: number) => {
    if (stats.effectiveTotalBudget <= 0) return 100;
    const pct = (spent / stats.effectiveTotalBudget) * 100;
    return 100 - Math.max(0, Math.min(100, pct));
  }, [stats.effectiveTotalBudget]);

  const pastStats = useMemo(() =>
    stats.dailyStats.filter((s: any) => !s.isFuture || s.dayIndex === stats.daysPassed + 1),
    [stats.dailyStats, stats.daysPassed]);

  // Ideal cumulative spend line
  const idealPathD = useMemo(() => {
    if (stats.dailyStats.length === 0) return 'M 0 100';
    const points = stats.dailyStats.map((s: any) => [getX(s.dayIndex - 1), getY(s.cumulativeIdealSpent)]);

    let path = `M 0 100`;
    for (let i = 0; i < points.length; i++) {
      path += ` L ${points[i][0]} ${points[i][1]}`;
    }
    return path;
  }, [stats.dailyStats, getX, getY]);

  // Actual cumulative spend line
  const actualPathD = useMemo(() => {
    if (pastStats.length === 0) return 'M 0 100';
    const points = pastStats.map((s: any) => [getX(s.dayIndex - 1), getY(s.cumulativeDiscretionarySpent)]);

    let path = `M 0 100`;
    for (let i = 0; i < points.length; i++) {
      path += ` L ${points[i][0]} ${points[i][1]}`;
    }
    return path;
  }, [pastStats, getX, getY]);

  const fillPathD = useMemo(() => {
    if (pastStats.length === 0) return 'M 0 100 L 0 100 Z';
    const lastX = getX(pastStats[pastStats.length - 1].dayIndex - 1);
    return `${actualPathD} L ${lastX} 100 L 0 100 Z`;
  }, [actualPathD, pastStats, getX]);

  const calculateIndexFromClientX = useCallback((clientX: number) => {
    if (!containerRef.current || stats.totalDays <= 1) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = ((clientX - rect.left) / rect.width) * 100;
    const estimatedIndex = Math.round((xPct / 100) * (stats.totalDays - 1));
    const clampedIndex = Math.max(0, Math.min(stats.totalDays - 1, estimatedIndex));
    setHoverIndex(clampedIndex);
  }, [stats.totalDays]);

  const clearTouchTimer = useCallback(() => {
    if (touchDismissTimer.current) {
      clearTimeout(touchDismissTimer.current);
      touchDismissTimer.current = null;
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    calculateIndexFromClientX(e.clientX);
  }, [calculateIndexFromClientX]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    clearTouchTimer();
    if (e.touches.length > 0) {
      calculateIndexFromClientX(e.touches[0].clientX);
    }
  }, [calculateIndexFromClientX, clearTouchTimer]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    clearTouchTimer();
    if (e.touches.length > 0) {
      calculateIndexFromClientX(e.touches[0].clientX);
    }
  }, [calculateIndexFromClientX, clearTouchTimer]);

  const handleTouchEnd = useCallback(() => {
    clearTouchTimer();
    touchDismissTimer.current = setTimeout(() => {
      setHoverIndex(null);
      touchDismissTimer.current = null;
    }, 3000);
  }, [clearTouchTimer]);

  useEffect(() => {
    return () => { clearTouchTimer(); };
  }, [clearTouchTimer]);

  const handleMouseLeave = useCallback(() => setHoverIndex(null), []);

  const activeDayStat = hoverIndex !== null ? stats.dailyStats[hoverIndex] : null;
  const activeDiff = activeDayStat && !activeDayStat.isFuture
    ? activeDayStat.cumulativeIdealSpent - activeDayStat.cumulativeDiscretionarySpent
    : null;

  return (
    <Card className="lg:col-span-2 flex flex-col relative border border-[var(--color-gray-light)] p-4 sm:p-6">
      {/* Header & Mobile Top Inspection HUD */}
      <div className="flex flex-col gap-2 mb-3 sm:mb-6 min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <CardTitle className="text-xs sm:text-base truncate flex items-center gap-1.5">
            <TrendingDown size={16} className="text-[var(--color-primary)]" /> Spend vs Ideal Path
          </CardTitle>
          {hoverIndex !== null && (
            <button
              type="button"
              onClick={() => setHoverIndex(null)}
              className="md:hidden text-[10px] text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] px-2.5 py-0.5 rounded-full font-bold transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Mobile Top HUD Banner */}
        {activeDayStat && (
          <div className="md:hidden animate-in fade-in duration-150 p-2.5 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] shadow-sm text-xs">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[var(--color-gray-light)]">
              <span className="font-bold text-[var(--color-dark)]">Day {activeDayStat.dayIndex} · {format(new Date(activeDayStat.date), 'MMM dd')}</span>
              {activeDiff !== null ? (
                <span className={cn("font-bold text-[11px]", activeDiff >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-primary)]")}>
                  {activeDiff >= 0 ? `🟢 +${formatCurrency(activeDiff)} Ahead` : `🔴 -${formatCurrency(Math.abs(activeDiff))} Behind`}
                </span>
              ) : (
                <span className="text-[10px] text-[var(--color-gray-dark)] font-medium">Future Date</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1 text-[11px]">
              <div>
                <span className="text-[var(--color-gray-dark)] block text-[9px] uppercase font-semibold">Spent</span>
                <span className="font-bold text-[var(--color-primary)]">
                  {activeDayStat.isFuture ? '-' : formatCurrency(activeDayStat.cumulativeDiscretionarySpent)}
                </span>
              </div>
              <div>
                <span className="text-[var(--color-gray-dark)] block text-[9px] uppercase font-semibold">Ideal</span>
                <span className="font-medium text-[var(--color-dark)]">
                  {formatCurrency(activeDayStat.cumulativeIdealSpent)}
                </span>
              </div>
              <div>
                <span className="text-[var(--color-gray-dark)] block text-[9px] uppercase font-semibold">Day Spend</span>
                <span className="font-medium text-[var(--color-dark)]">
                  {activeDayStat.isFuture ? '-' : formatCurrency(activeDayStat.discretionarySpent)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="flex-grow relative min-h-[200px] rounded-b-lg border-b border-[var(--color-primary)]/30 bg-gradient-to-b from-[var(--color-primary)]/10 dark:from-[var(--color-primary)]/20 to-transparent flex items-end group/chart cursor-crosshair touch-none select-none"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)"></stop>
              <stop offset="100%" stopColor="transparent"></stop>
            </linearGradient>
          </defs>

          {/* Ideal Line */}
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

        {/* Today Indicator */}
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

        {/* Interactive Indicator Line & Desktop Tooltip */}
        {hoverIndex !== null && stats.dailyStats[hoverIndex] && (
          <div
            className="absolute top-0 bottom-0 border-l border-solid border-[var(--color-gray-dark)] z-20 pointer-events-none transition-all duration-75 ease-out"
            style={{ left: `${getX(hoverIndex)}%` }}
          >
            {/* Desktop Tooltip Card */}
            <div
              className={cn(
                "hidden md:block absolute top-4 bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl shadow-xl p-3 min-w-[170px] whitespace-nowrap z-30 pointer-events-none animate-in fade-in duration-100",
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
                className="absolute -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)] pointer-events-none transition-all duration-75 ease-out z-10"
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

// Interactive SVG Donut Chart Component
const CategoryDonutChart = React.memo(({ 
  categories, 
  totalSpend,
  onSelectCategory 
}: { 
  categories: { category: string; amount: number; percentage: number }[];
  totalSpend: number;
  onSelectCategory: (category: string) => void;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG Ring calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke dash offsets
  let accumulatedPercent = 0;
  const segments = categories.map((cat, idx) => {
    const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += cat.percentage;
    const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
    return { ...cat, strokeDasharray, strokeDashoffset, color, idx };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Donut Ring Visual */}
      <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="var(--color-surface-light)"
            strokeWidth="12"
          />
          {segments.map((seg) => (
            <circle
              key={seg.category}
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={hoveredIndex === seg.idx ? "16" : "12"}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredIndex(seg.idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onSelectCategory(seg.category)}
            />
          ))}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
          {hoveredIndex !== null && segments[hoveredIndex] ? (
            <>
              <span className="text-[10px] font-bold text-[var(--color-gray-dark)] uppercase truncate max-w-[80px]">
                {segments[hoveredIndex].category}
              </span>
              <span className="text-xs font-black text-[var(--color-dark)]">
                {segments[hoveredIndex].percentage}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">
                Outflow
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-[var(--color-primary)] truncate max-w-[80px]">
                {formatCurrency(totalSpend)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Categories Interactive List */}
      <div className="flex-1 w-full space-y-2.5">
        {categories.slice(0, 5).map((item, idx) => {
          const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
          return (
            <button
              key={item.category}
              type="button"
              onClick={() => onSelectCategory(item.category)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                "w-full flex items-center justify-between p-2 rounded-xl bg-[var(--color-surface-light)]/60 hover:bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] transition-all cursor-pointer text-left group",
                hoveredIndex === idx && "ring-1 ring-[var(--color-primary)]/40 bg-[var(--color-surface-light)]"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs font-bold text-[var(--color-dark)] truncate">{item.category}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-[var(--color-dark)]">{formatCurrency(item.amount)}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-gray-light)] text-[var(--color-gray-dark)]">
                  {item.percentage}%
                </span>
                <ChevronRight size={14} className="text-[var(--color-gray-dark)] group-hover:text-[var(--color-dark)] transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
        {categories.length > 5 && (
          <p className="text-[10px] text-center font-medium text-[var(--color-gray-dark)] pt-0.5">
            + {categories.length - 5} more categories (tap to inspect)
          </p>
        )}
      </div>
    </div>
  );
});

export function Insights() {
  const { config, transactions, people } = useStore();
  const todayDateStr = useCurrentDate();

  // Time filter state: 'week' = This Week, 'current' = This Month, 'last1' = Last Month, 'last2' = 2 Months Ago
  const [timeFilter, setTimeFilter] = useState<string>('current');

  // Modal inspection states
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [selectedSplurge, setSelectedSplurge] = useState<Transaction | null>(null);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);

  const { stats, activeDateRange } = useMemo(() => {
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

      const currentStats = calculateBudget(config, transactions, todayDateStr);
      const totalMoneyLeft = currentStats.effectiveTotalBudget - currentStats.totalDiscretionarySpent;
      const daysLeft = currentStats.daysRemaining;
      const weeksLeft = daysLeft > 0 ? daysLeft / 7 : 0;
      const weeklyIdeal = weeksLeft > 0 ? totalMoneyLeft / weeksLeft : 0;

      const syntheticConfig = {
        ...config,
        totalMoney: weeklyIdeal,
        startDate: start.toISOString(),
        endDate: end.toISOString()
      };
      const weeklyTransactions = transactions.filter(t => t.type !== 'income' && t.type !== 'bill');
      const calculatedStats = calculateBudget(syntheticConfig, weeklyTransactions, todayDateStr);
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

  // Scoped transactions strictly inside activeDateRange
  const periodTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = startOfDay(new Date(t.date));
      return tDate.getTime() >= activeDateRange.start.getTime() && tDate.getTime() <= activeDateRange.end.getTime();
    });
  }, [transactions, activeDateRange]);

  const periodExpenses = useMemo(() => {
    return periodTransactions.filter(t => t.type === 'expense');
  }, [periodTransactions]);

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

  // 2. Discretionary Categories Breakdown
  const categoryBreakdown = useMemo(() => {
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

  // 3. Largest Splurges
  const largestSplurges = useMemo(() => {
    return [...periodExpenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [periodExpenses]);

  // 4. Peer Debt vs Personal Outflow Breakdown
  const peerDebtDynamics = useMemo(() => {
    let personalSpend = 0;
    let lentToFriends = 0;
    let settlementsReceived = 0;

    periodTransactions.forEach(t => {
      if (t.type === 'expense') {
        if (t.personId || t.direction === 'gave' || t.direction === 'bought_for_me') {
          lentToFriends += t.amount;
        } else {
          personalSpend += t.amount;
        }
      } else if (t.type === 'income' && t.personId) {
        settlementsReceived += t.amount;
      }
    });

    const totalOutflow = personalSpend + lentToFriends;
    const personalPct = totalOutflow > 0 ? Math.round((personalSpend / totalOutflow) * 100) : 100;
    const lentPct = totalOutflow > 0 ? Math.round((lentToFriends / totalOutflow) * 100) : 0;

    return {
      personalSpend,
      lentToFriends,
      settlementsReceived,
      totalOutflow,
      personalPct,
      lentPct
    };
  }, [periodTransactions]);

  // 5. Weekly Spend Progression
  const weeklyProgression = useMemo(() => {
    const weeks = [
      { name: 'Week 1', label: 'Day 1–7', amount: 0, count: 0 },
      { name: 'Week 2', label: 'Day 8–14', amount: 0, count: 0 },
      { name: 'Week 3', label: 'Day 15–21', amount: 0, count: 0 },
      { name: 'Week 4', label: 'Day 22+', amount: 0, count: 0 },
    ];

    periodExpenses.forEach(t => {
      const day = new Date(t.date).getDate();
      const idx = Math.min(3, Math.floor((day - 1) / 7.5));
      weeks[idx].amount += t.amount;
      weeks[idx].count += 1;
    });

    const maxWeekSpend = Math.max(1, ...weeks.map(w => w.amount));
    return { weeks, maxWeekSpend };
  }, [periodExpenses]);

  // 6. Chart End Label
  const chartEndLabel = useMemo(() => {
    if (timeFilter === 'week') return 'End of Week';
    if (timeFilter === 'current') return 'End of Month';
    return `End of ${format(activeDateRange.end, 'MMM yyyy')}`;
  }, [timeFilter, activeDateRange.end]);

  // 7. IOUs and Buffer
  const friendsOweYou = people.filter(p => p.balance > 0).reduce((sum, p) => sum + p.balance, 0);

  // 8. Projected Rollover
  const isHistoricalPeriod = timeFilter === 'last1' || timeFilter === 'last2';
  const projectedRollover = isHistoricalPeriod
    ? stats.moneyLeft
    : stats.moneyLeft - (avgDailyDiscretionary * stats.daysRemaining);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 sm:pb-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">Insights & Analytics</h1>
          <p className="text-[var(--color-gray-dark)] text-sm mt-0.5">Deep dive into your financial pacing, categories, and peer dynamics.</p>
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
          {(() => {
            const targetPace = stats.remainingDailyPace > 0 ? stats.remainingDailyPace : stats.baseDailyBudget;
            const paceDiff = targetPace - stats.baseDailyBudget;
            const isDifferent = Math.abs(paceDiff) >= 0.5 && stats.baseDailyBudget > 0 && targetPace > 0;

            return (
              <>
                <div>
                  <div className="flex justify-between items-start mb-2 sm:mb-4">
                    <TrendingDown size={20} className="text-[var(--color-gray-dark)] shrink-0 sm:w-5 sm:h-5" />
                    <span className={cn(
                      "inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[11px] font-medium shrink-0",
                      avgDailyDiscretionary <= targetPace ? "bg-[var(--color-positive-bg)] text-[var(--color-success)]" : "bg-[var(--negative-bg)] text-[var(--color-primary)]"
                    )}>
                      {avgDailyDiscretionary <= targetPace ? "Better" : "Worse"}
                    </span>
                  </div>
                  <CardTitle className="mb-1 text-xs sm:text-base truncate">Daily Spend Engine</CardTitle>
                  <div className="flex items-baseline gap-1 sm:gap-2 truncate">
                    <span className="text-lg sm:text-[32px] font-bold text-[var(--color-dark)] leading-tight tracking-tight truncate">{formatCurrency(avgDailyDiscretionary)}</span>
                    <span className="text-[10px] sm:text-sm text-[var(--color-gray-dark)] shrink-0">/ {formatCurrency(targetPace)}</span>
                  </div>
                  {isDifferent ? (
                    <div className="text-[9px] sm:text-xs font-medium text-[var(--color-gray-dark)] mt-0.5 sm:mt-1 truncate flex items-center gap-1">
                      <span>Base <span className="line-through decoration-[var(--color-gray-dark)] opacity-70">{formatCurrency(stats.baseDailyBudget)}</span></span>
                      <span>➔</span>
                      <span className={cn("font-bold truncate", paceDiff > 0 ? "text-[var(--color-success)]" : "text-[var(--color-primary)]")}>
                        Pace {formatCurrency(targetPace)}
                        <span className="hidden sm:inline ml-1 font-semibold opacity-90">({paceDiff > 0 ? `+${formatCurrency(paceDiff)}/d` : `-${formatCurrency(Math.abs(paceDiff))}/d`})</span>
                      </span>
                    </div>
                  ) : (
                    <div className="text-[9px] sm:text-xs font-medium text-[var(--color-gray-dark)] mt-0.5 sm:mt-1 truncate">
                      Target: {formatCurrency(targetPace)}/d
                    </div>
                  )}
                </div>
                <div className="mt-2 sm:mt-4 w-full h-1.5 bg-[var(--color-surface-light)] rounded-full overflow-hidden">
                  <div
                    className={cn("h-full", avgDailyDiscretionary <= targetPace ? "bg-[var(--color-success)]" : "bg-[var(--color-primary)]")}
                    style={{ width: `${Math.min(100, targetPace > 0 ? (avgDailyDiscretionary / targetPace) * 100 : 0)}%` }}
                  ></div>
                </div>
              </>
            );
          })()}
        </Card>
      </div>

      {/* Burn-down Chart */}
      <BurnDownChart stats={stats} endLabel={chartEndLabel} />

      {/* Peer Debt vs Personal Outflow Card (PaceWise Killer Feature) */}
      <Card className="border border-[var(--color-gray-light)] p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Users size={18} className="text-[var(--color-primary)]" /> Personal vs. Peer Spends
          </CardTitle>
          <span className="text-[11px] font-bold text-[var(--color-gray-dark)] uppercase tracking-wider">
            Period Breakdown
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4">
          {/* Real Personal Consumption */}
          <div className="p-3.5 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-dark)] opacity-60" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)] block">
              Personal Consumption
            </span>
            <div className="text-xl sm:text-2xl font-black text-[var(--color-dark)] mt-0.5">
              {formatCurrency(peerDebtDynamics.personalSpend)}
            </div>
            <p className="text-[10px] text-[var(--color-gray-dark)] font-medium mt-1">
              {peerDebtDynamics.personalPct}% of total period outflow
            </p>
          </div>

          {/* Lent / Bought for Friends */}
          <div className="p-3.5 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-primary)]" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">
                Lent / Friend Spends
              </span>
              {peerDebtDynamics.lentToFriends > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  Pending Payback
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-black text-[var(--color-primary)] mt-0.5">
              {formatCurrency(peerDebtDynamics.lentToFriends)}
            </div>
            <p className="text-[10px] text-[var(--color-gray-dark)] font-medium mt-1">
              {peerDebtDynamics.lentPct}% locked in peer debt
            </p>
          </div>

          {/* Settlements Inflow */}
          <div className="p-3.5 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-success)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)] block">
              Settlements Received
            </span>
            <div className="text-xl sm:text-2xl font-black text-[var(--color-success)] mt-0.5">
              +{formatCurrency(peerDebtDynamics.settlementsReceived)}
            </div>
            <p className="text-[10px] text-[var(--color-gray-dark)] font-medium mt-1">
              UPI repayments collected
            </p>
          </div>
        </div>

        {/* Proportional Split Bar */}
        <div className="w-full space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold text-[var(--color-gray-dark)]">
            <span>Personal ({peerDebtDynamics.personalPct}%)</span>
            <span>Lent to Friends ({peerDebtDynamics.lentPct}%)</span>
          </div>
          <div className="w-full h-3 bg-[var(--color-surface-light)] rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-[var(--color-dark)] transition-all duration-500 opacity-80" 
              style={{ width: `${peerDebtDynamics.personalPct}%` }}
              title="Personal Consumption"
            />
            <div 
              className="h-full bg-[var(--color-primary)] transition-all duration-500" 
              style={{ width: `${peerDebtDynamics.lentPct}%` }}
              title="Lent to Friends"
            />
          </div>
        </div>
      </Card>

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

      {/* Bottom Section: Interactive Donut & Weekly Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Where it's going (Interactive Donut Ring + Tap to Drill Down) */}
        <Card className="flex flex-col border border-[var(--color-gray-light)] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <PieChart size={18} className="text-[var(--color-primary)]" /> Where it's going
            </CardTitle>
            <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full">
              Tap to Inspect
            </span>
          </div>

          {categoryBreakdown.length > 0 ? (
            <CategoryDonutChart
              categories={categoryBreakdown}
              totalSpend={stats.totalDiscretionarySpent}
              onSelectCategory={(catName) => setSelectedCategoryName(catName)}
            />
          ) : (
            <div className="py-12 text-center text-xs text-[var(--color-gray-dark)]">
              No discretionary expenses recorded in this period.
            </div>
          )}
        </Card>

        {/* Weekly Spend Pace Progression */}
        <Card className="flex flex-col justify-between border border-[var(--color-gray-light)] p-5 sm:p-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <BarChart3 size={18} className="text-[var(--color-success)]" /> Weekly Spend Pace
              </CardTitle>
              <span className="text-[10px] font-semibold text-[var(--color-gray-dark)]">
                Cycle Progression
              </span>
            </div>

            <div className="space-y-3">
              {weeklyProgression.weeks.map((w) => {
                const widthPct = Math.round((w.amount / weeklyProgression.maxWeekSpend) * 100);
                const isMax = w.amount === weeklyProgression.maxWeekSpend && w.amount > 0;

                return (
                  <div key={w.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-[var(--color-dark)]">
                        <span>{w.name}</span>
                        <span className="text-[10px] font-medium text-[var(--color-gray-dark)]">({w.label})</span>
                        {isMax && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600">
                            <Flame size={10} /> Peak
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--color-gray-dark)]">{w.count} txs</span>
                        <span className="font-extrabold text-[var(--color-dark)]">{formatCurrency(w.amount)}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[var(--color-surface-light)] rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isMax ? "bg-[var(--color-primary)]" : "bg-[var(--color-success)]"
                        )}
                        style={{ width: `${Math.max(4, widthPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[var(--color-gray-light)] flex items-center justify-between text-[11px] text-[var(--color-gray-dark)] font-medium">
            <span>Average per active week:</span>
            <span className="font-bold text-[var(--color-dark)]">
              {formatCurrency(Math.round(stats.totalDiscretionarySpent / 4))}
            </span>
          </div>
        </Card>
      </div>

      {/* Bottom Row: Largest Splurges & IOUs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Largest Splurges (Interactive cards) */}
        <Card className="flex flex-col border border-[var(--color-gray-light)] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <ShoppingBag size={18} className="text-[var(--color-primary)]" /> Largest Splurges
            </CardTitle>
            <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full">
              Top 3 Outflows
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {largestSplurges.length > 0 ? largestSplurges.map(t => (
              <div 
                key={t.id} 
                onClick={() => setSelectedSplurge(t)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-gray-light)] flex items-center justify-center shrink-0 shadow-inner group-hover:border-[var(--color-primary)]/30 transition-colors">
                    {getCategoryIcon(t.category || t.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[var(--color-dark)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                      {t.reason || t.category || 'Purchase'}
                    </div>
                    <div className="text-[10px] font-medium text-[var(--color-gray-dark)] flex items-center gap-1.5 mt-0.5">
                      <span>{format(new Date(t.date), 'MMM dd')}</span>
                      <span>•</span>
                      <span>{t.personName ? `With ${t.personName}` : (t.category || t.type)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-xs sm:text-sm font-black text-[var(--color-primary)] tracking-wide">
                    - {formatCurrency(t.amount)}
                  </div>
                  <span className="text-[9px] font-bold text-[var(--color-gray-dark)] block">
                    Inspect ➔
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-[var(--color-gray-dark)] py-4 text-center">No expenses to show in this period.</p>
            )}
          </div>
        </Card>

        {/* IOUs & Hidden Liquidity */}
        <Card className="flex flex-col border border-[var(--color-gray-light)] p-5 sm:p-6">
          <CardTitle className="mb-4 flex items-center gap-2 text-sm sm:text-base">
            <ArrowRightLeft size={18} className="text-[var(--color-success)]" /> IOUs & Hidden Liquidity
          </CardTitle>
          <div className="flex flex-col gap-3.5 flex-1 justify-center">
            {/* Friends Owe You */}
            <div className="flex items-center justify-between p-4 rounded-2xl relative overflow-hidden bg-[var(--color-surface-light)] border border-[var(--color-gray-light)]">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--color-success)]" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">Friends owe you</div>
                <div className="text-2xl font-black text-[var(--color-success)] leading-tight mt-0.5">+{formatCurrency(friendsOweYou)}</div>
                <p className="text-[10px] text-[var(--color-gray-dark)] mt-0.5 font-medium">Unsettled peer balances</p>
              </div>
              <Users size={32} className="text-[var(--color-success)] opacity-30" />
            </div>

            {/* Fixed Bills Paid */}
            <div className="flex items-center justify-between p-4 rounded-2xl relative overflow-hidden bg-[var(--color-surface-light)] border border-[var(--color-gray-light)]">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--color-primary)]" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">Fixed Bills Paid</div>
                <div className="text-2xl font-black text-[var(--color-dark)] leading-tight mt-0.5">{formatCurrency(stats.totalBills)}</div>
                <p className="text-[10px] text-[var(--color-gray-dark)] mt-0.5 font-medium">Excluded from daily pacing</p>
              </div>
              <CalendarDays size={32} className="text-[var(--color-primary)] opacity-30" />
            </div>
          </div>
        </Card>
      </div>

      {/* Category Detail Bottom Sheet Modal */}
      {selectedCategoryName && (
        <CategoryDetailModal
          isOpen={!!selectedCategoryName}
          onClose={() => setSelectedCategoryName(null)}
          categoryName={selectedCategoryName}
          transactions={periodExpenses}
          totalPeriodSpend={stats.totalDiscretionarySpent}
          daysInPeriod={stats.daysPassed || 1}
          onEditTransaction={(tx) => setTxToEdit(tx)}
        />
      )}

      {/* Splurge Detail Modal */}
      {selectedSplurge && (
        <SplurgeDetailModal
          isOpen={!!selectedSplurge}
          onClose={() => setSelectedSplurge(null)}
          transaction={selectedSplurge}
          onEditTransaction={(tx) => setTxToEdit(tx)}
        />
      )}

      {/* Edit Transaction Modal Integration */}
      {txToEdit && (
        <EditTransactionModal
          isOpen={!!txToEdit}
          onClose={() => setTxToEdit(null)}
          transaction={txToEdit}
        />
      )}
    </div>
  );
}
