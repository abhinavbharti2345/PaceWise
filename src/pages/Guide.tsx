import { useState } from 'react';
import { 
  BookOpen, 
  Compass, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  CheckCircle, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  HelpCircle, 
  Zap, 
  Receipt, 
  ShieldCheck, 
  SlidersHorizontal, 
  Layers, 
  Tag, 
  MousePointerClick, 
  Info,
  Calculator,
  Shield,
  Gauge
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { Link } from 'react-router-dom';

interface FaqItem {
  question: string;
  answer: string;
  category: 'pacing' | 'bills' | 'people' | 'categories' | 'budget' | 'general';
}

const FAQS: FaqItem[] = [
  {
    category: 'pacing',
    question: 'What is the difference between "Base Daily Allowance" and "Sustainable Live Pace"?',
    answer: '• Base Daily Allowance: Your static baseline speed calculated as (Total Discretionary Budget ÷ Days in Month). It shows what you would spend daily if you spent exactly the same amount every single day.\n• Sustainable Live Pace (Pace: ₹X/d): Your real-time adaptive speed calculated as (Discretionary Money Left ÷ Days Remaining). If you spend less on earlier days, your live pace increases; if you spend more, it gracefully recalculates lower to keep you completely safe without running out of money.'
  },
  {
    category: 'pacing',
    question: 'How is "Today\'s Safe-to-Spend" calculated?',
    answer: 'Today\'s Safe-to-Spend starts with your daily allowance plus any accumulated Carry Forward savings from previous days this month. If you spent extra yesterday, the engine recalculates to gently redistribute the deficit so you naturally recover across the rest of the month without any guilt.'
  },
  {
    category: 'pacing',
    question: 'What do the Pacing Speed Dial statuses mean?',
    answer: '• 🟢 Ahead of Pace: Your current spending rate is lower than your scheduled daily rate, giving you surplus savings.\n• 🟡 On Pace: Your daily spending is in exact harmony with your monthly budget targets.\n• 🔴 Slow Down: You have spent above today\'s recommended threshold. PaceWise automatically adjusts future days so your monthly budget remains intact.'
  },
  {
    category: 'bills',
    question: 'How do mid-month bills work? Does logging a bill penalize my past days?',
    answer: 'No! PaceWise features Forward Pacing Protection. When you log or pay a recurring bill mid-month (e.g. Credit Card, Rent, Electricity), your past carry-forward savings are completely protected and never penalized retroactively. The bill amount is smoothly balanced across the remaining days of the month.'
  },
  {
    category: 'bills',
    question: 'Can I add custom bill types beyond standard utility bills?',
    answer: 'Yes! When adding a bill or visiting Settings, you can create Custom Bill Types (e.g., Wifi, Tuition, Insurance, Gym). They can be organized, color-coded, and managed just like standard bills.'
  },
  {
    category: 'people',
    question: 'What is the difference between Borrowed and "Paid for Me"?',
    answer: '• Borrowed (↘): A friend gave you cash or transferred money into your account. You owe them money, but no specific budget expense category is consumed.\n• Paid for Me (⇄): A friend paid directly for your coffee, meal, or ride. It does not pull cash from your wallet immediately. When you pay them back and tap "Settle", you select a category (e.g., Food, Entertainment) so it accurately registers in your monthly spending analytics without double-counting.'
  },
  {
    category: 'people',
    question: 'Does settling a cash debt affect my monthly budget?',
    answer: '• Settling Cash Debts (Lent / Borrowed): Only moves cash in your wallet balance; it does NOT affect your monthly discretionary budget because the money was already accounted for.\n• Settling "Paid for Me" items: Yes, it records a genuine budget expense under your chosen category to reflect the product or service you consumed.'
  },
  {
    category: 'categories',
    question: 'What happens when I hide a default category versus deleting a custom category?',
    answer: '• Default Categories (Food, Transport, etc.): Cannot be accidentally destroyed; instead, they are marked as "Hidden" in your preferences so your add menus remain uncluttered. You can unhide them anytime in Settings.\n• Custom Categories: Can be permanently deleted whenever you want.\n• Past Transactions Safety: In all cases, your existing past transactions always preserve their category names safely.'
  },
  {
    category: 'categories',
    question: 'How can I customize or reorder categories in the Add Expense, Add Bill, and Add Money modals?',
    answer: '• Top "Customize" Button: Tap the Customize toggle in the modal header to reveal reorder arrows and quick hide/delete icons.\n• Desktop Right-Click: Right-click on any category chip to open a fast context menu to move left/right or hide/delete. Click anywhere outside to instantly dismiss it.\n• Mobile Long-Press: Press and hold any category chip for 450ms to activate customization mode with haptic feedback.'
  },
  {
    category: 'budget',
    question: 'What happens at the end of the month with leftover money or deficits?',
    answer: 'PaceWise supports Month-End Rollover. At midnight on the final day of your monthly cycle, any remaining discretionary savings can roll over into next month\'s starting pool. If you ended with a deficit, you can carry it forward into the new cycle to stay accountable.'
  },
  {
    category: 'general',
    question: 'Is my data securely synced across all my devices?',
    answer: 'Yes! When signed in, all your budgets, transactions, custom categories, hidden preferences, and debt records are synced in real-time with the database and securely available across all your browsers and mobile devices.'
  }
];

export function Guide() {
  const [activeTab, setActiveTab] = useState<'all' | 'pacing' | 'bills' | 'people' | 'categories' | 'budget' | 'faqs'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
  };

  const filteredFaqs = FAQS.filter(faq => {
    const matchesTab = activeTab === 'all' || activeTab === 'faqs' || faq.category === activeTab;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full pb-24 sm:pb-12">
      {/* Hero Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--color-surface)] p-5 sm:p-7 rounded-3xl border border-[var(--color-gray-light)] shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center font-bold shadow-md shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">
                How PaceWise Works
              </h1>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-surface-light)] text-[var(--color-dark)] border border-[var(--color-gray-light)]">
                Guide & System Rules
              </span>
            </div>
            <p className="text-[var(--color-gray-dark)] text-sm sm:text-base mt-1 max-w-3xl leading-relaxed">
              Master your daily spending flow, smart debt tracking, mid-month bill pacing, and category safeguards.
            </p>
          </div>
        </div>

        <Link to="/profile">
          <Button variant="outline" size="sm" className="w-full sm:w-auto font-bold gap-1 text-xs cursor-pointer shrink-0">
            Back to Profile
          </Button>
        </Link>
      </header>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface-light)] rounded-2xl border border-[var(--color-gray-light)] overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Topics' },
            { id: 'pacing', label: '⚡ Pacing Engine' },
            { id: 'bills', label: '🛡️ Mid-Month Bills' },
            { id: 'people', label: '👥 People & IOUs' },
            { id: 'categories', label: '🏷️ Category Safeguards' },
            { id: 'budget', label: '🎯 Budget & Rollover' },
            { id: 'faqs', label: '❓ FAQs' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-[var(--color-surface)] text-[var(--color-dark)] shadow-sm border border-[var(--color-gray-light)]"
                  : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[280px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-gray-dark)]" />
          <input
            type="text"
            placeholder="Search guides, formulas & rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl text-[var(--color-dark)] placeholder-[var(--color-gray-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Main 2-Column Responsive Layout: Fills 100% of the Desktop Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        
        {/* Left / Main Column: Detailed System Explanations */}
        <div className="lg:col-span-8 space-y-6">

          {/* ── Section 1: The Adaptive Pacing Engine ── */}
          {(activeTab === 'all' || activeTab === 'pacing') && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="text-[var(--color-primary)]" size={20} />
                <h2 className="text-xl font-extrabold text-[var(--color-dark)]">1. The Dynamic Pacing Engine</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Safe-to-Spend Allowance */}
                <Card className="p-5 border-[var(--color-gray-light)] flex flex-col justify-between bg-[var(--color-surface)] shadow-sm">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 flex items-center justify-center font-bold mb-3">
                      <Compass size={20} />
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-dark)]">Base vs Live Pace</h3>
                    <p className="text-xs text-[var(--color-gray-dark)] mt-2 leading-relaxed">
                      PaceWise continuously monitors both your static daily baseline and your real-time sustainable speed.
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-[var(--color-surface-light)] rounded-xl border border-[var(--color-gray-light)] text-[11px] font-semibold text-[var(--color-dark)] space-y-1">
                    <div>• <span className="font-bold text-[var(--color-primary)]">Base</span>: Total Budget ÷ Month Days</div>
                    <div>• <span className="font-bold text-emerald-700 dark:text-emerald-400">Pace</span>: Money Left ÷ Days Left</div>
                  </div>
                </Card>

                {/* Live Self-Healing */}
                <Card className="p-5 border-[var(--color-gray-light)] flex flex-col justify-between bg-[var(--color-surface)] shadow-sm">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 flex items-center justify-center font-bold mb-3">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-dark)]">Daily Self-Healing</h3>
                    <p className="text-xs text-[var(--color-gray-dark)] mt-2 leading-relaxed">
                      Spent extra today? No guilt! PaceWise automatically absorbs it and smoothly redistributes the remainder across future days.
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-[var(--color-surface-light)] rounded-xl border border-[var(--color-gray-light)] text-[11px] font-semibold text-[var(--color-dark)]">
                    Accumulated savings roll cleanly into Today's Allowance.
                  </div>
                </Card>

                {/* Pacing Speed Dial */}
                <Card className="p-5 border-[var(--color-gray-light)] flex flex-col justify-between bg-[var(--color-surface)] shadow-sm">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 flex items-center justify-center font-bold mb-3">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-dark)]">Speedometer Dial</h3>
                    <p className="text-xs text-[var(--color-gray-dark)] mt-2 leading-relaxed">
                      The dashboard speedometer gauges your burn rate in real time, alerting you when you are cruising safely or speeding.
                    </p>
                  </div>
                  <div className="mt-4 flex gap-1.5 text-[11px] font-bold text-center">
                    <span className="flex-1 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                      Ahead
                    </span>
                    <span className="flex-1 py-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                      On Pace
                    </span>
                    <span className="flex-1 py-1.5 rounded-lg bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                      Slow Down
                    </span>
                  </div>
                </Card>
              </div>
            </section>
          )}

          {/* ── Section 2: Mid-Month Bills & Protection ── */}
          {(activeTab === 'all' || activeTab === 'bills') && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Receipt className="text-rose-500" size={20} />
                <h2 className="text-xl font-extrabold text-[var(--color-dark)]">2. Mid-Month Bills & Forward Protection</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Past Carry Forward Protection */}
                <Card className="p-5 sm:p-6 border-[var(--color-gray-light)] bg-[var(--color-surface)] shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--color-dark)]">Past Carry Forward Protection</h3>
                      <p className="text-[11px] text-[var(--color-gray-dark)]">100% safe historical savings</p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-gray-dark)] leading-relaxed">
                    When you add or pay a fixed recurring bill mid-month (e.g. Credit Card on the 15th), PaceWise never applies a retroactive penalty to past days. Your past saved carry-forwards remain 100% safe.
                  </p>
                  <div className="p-2.5 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] text-[11px] font-semibold text-[var(--color-dark)]">
                    🛡️ Past savings are never docked when logging bills.
                  </div>
                </Card>

                {/* Forward-Looking Redistribution */}
                <Card className="p-5 sm:p-6 border-[var(--color-gray-light)] bg-[var(--color-surface)] shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center justify-center shrink-0">
                      <Layers size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--color-dark)]">Forward Redistribution</h3>
                      <p className="text-[11px] text-[var(--color-gray-dark)]">Dynamic daily recalculation</p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-gray-dark)] leading-relaxed">
                    The remaining discretionary balance is factored cleanly across the remaining days of the month, updating your live daily sustainable pace seamlessly.
                  </p>
                  <div className="p-2.5 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] text-[11px] font-semibold text-[var(--color-dark)]">
                    ⚡ Live pace adjusts gracefully without sudden shock.
                  </div>
                </Card>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-gray-light)] flex items-center gap-3 text-xs text-[var(--color-dark)] shadow-sm">
                <Info size={16} className="text-[var(--color-primary)] shrink-0" />
                <span>
                  <strong>Custom Bill Types:</strong> You can add any custom bill type (e.g., Wifi, Tuition, Gym) with custom colors and icons in the Add Bill modal.
                </span>
              </div>
            </section>
          )}

          {/* ── Section 3: People & Smart Debt Tracking ── */}
          {(activeTab === 'all' || activeTab === 'people') && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="text-purple-600 dark:text-purple-400" size={20} />
                <h2 className="text-xl font-extrabold text-[var(--color-dark)]">3. People & Smart Debt Tracking</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Lent */}
                <Card className="p-5 border-[var(--color-gray-light)] bg-[var(--color-surface)] shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center shrink-0">
                        <ArrowUpRight size={20} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                        Asset
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-dark)]">↗ Lent (+₹)</h3>
                    <p className="text-xs text-[var(--color-gray-dark)] mt-2 leading-relaxed">
                      You gave cash or transferred money to a friend. <strong className="text-[var(--color-dark)]">They owe you money</strong>.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] text-[11px] font-semibold text-[var(--color-dark)]">
                    Does not consume budget.
                  </div>
                </Card>

                {/* Borrowed */}
                <Card className="p-5 border-[var(--color-gray-light)] bg-[var(--color-surface)] shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center justify-center shrink-0">
                        <ArrowDownRight size={20} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                        Liability
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-dark)]">↘ Borrowed (-₹)</h3>
                    <p className="text-xs text-[var(--color-gray-dark)] mt-2 leading-relaxed">
                      A friend gave you cash or transferred money. <strong className="text-[var(--color-dark)]">You owe them money</strong>.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] text-[11px] font-semibold text-[var(--color-dark)]">
                    Wallet cash loan.
                  </div>
                </Card>

                {/* Paid for Me */}
                <Card className="p-5 border-[var(--color-gray-light)] bg-[var(--color-surface)] shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center justify-center shrink-0">
                        <CreditCard size={20} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
                        Expense
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-dark)]">⇄ Paid for Me (-₹)</h3>
                    <p className="text-xs text-[var(--color-gray-dark)] mt-2 leading-relaxed">
                      A friend paid directly for your coffee or ride. <strong className="text-[var(--color-dark)]">You owe them</strong>, and upon settling, it logs as an expense.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] text-[11px] font-semibold text-[var(--color-dark)]">
                    Categorized on settle.
                  </div>
                </Card>
              </div>

              {/* Settlement Pro-Tip */}
              <Card className="p-4 sm:p-5 border-[var(--color-gray-light)] bg-[var(--color-surface)] shadow-sm flex items-start gap-3">
                <CheckCircle size={20} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-[var(--color-dark)]">How Settle Item Works:</p>
                  <p className="text-[var(--color-gray-dark)] mt-0.5 leading-relaxed">
                    When you repay a <strong className="text-[var(--color-dark)]">"Paid for Me"</strong> item, tap <strong>Settle</strong>. PaceWise records your repayment to your friend AND simultaneously attributes the cost to your chosen category (e.g. Food, Entertainment) without double-counting.
                  </p>
                </div>
              </Card>
            </section>
          )}

          {/* ── Section 4: Category Customization & Safeguards ── */}
          {(activeTab === 'all' || activeTab === 'categories') && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="text-amber-500" size={20} />
                <h2 className="text-xl font-extrabold text-[var(--color-dark)]">4. Categories & Smart Data Safeguards</h2>
              </div>

              <Card className="p-5 sm:p-6 border-[var(--color-gray-light)] bg-[var(--color-surface)] shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-[var(--color-dark)]">
                      <ShieldCheck size={18} className="text-emerald-500" />
                      <span>Default Protection</span>
                    </div>
                    <p className="text-xs text-[var(--color-gray-dark)] leading-relaxed">
                      Standard categories (Food, Transport, Bills, Salary) are marked as <strong>Hidden</strong> instead of being deleted, keeping your forms clean without risking data corruption.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-[var(--color-dark)]">
                      <SlidersHorizontal size={18} className="text-purple-500" />
                      <span>Custom Categories</span>
                    </div>
                    <p className="text-xs text-[var(--color-gray-dark)] leading-relaxed">
                      Create personalized expense, bill, and income categories with custom names, icons, and colors. You can permanently delete them anytime.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-[var(--color-dark)]">
                      <BookOpen size={18} className="text-blue-500" />
                      <span>Past Transaction Safety</span>
                    </div>
                    <p className="text-xs text-[var(--color-gray-dark)] leading-relaxed">
                      If any category is hidden or deleted, all existing past transactions safely retain their exact recorded category name and analytics without corruption.
                    </p>
                  </div>
                </div>

                {/* Gestures guide */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--color-dark)]">
                    <MousePointerClick size={16} className="text-amber-500" />
                    <span>Gestures & Reordering Shortcuts</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[var(--color-dark)]">
                    <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-gray-light)] shadow-xs">
                      <span className="font-bold">💻 Desktop Right-Click:</span> Opens quick menu to move left/right or hide/delete.
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-gray-light)] shadow-xs">
                      <span className="font-bold">📱 Mobile Long-Press:</span> Hold 450ms on any chip for haptic edit mode.
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-gray-light)] shadow-xs">
                      <span className="font-bold">⚙️ Settings Hub:</span> Unhide or manage any category in Settings anytime.
                    </div>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* ── Section 5: Budget & Rollover ── */}
          {(activeTab === 'all' || activeTab === 'budget') && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-[var(--color-success)]" size={20} />
                <h2 className="text-xl font-extrabold text-[var(--color-dark)]">5. Monthly Budget & Rollover</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-5 border-[var(--color-gray-light)] bg-[var(--color-surface)] shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-dark)] mb-2">
                    <CreditCard size={18} className="text-[var(--color-primary)]" />
                    <span>Discretionary Pool Isolation</span>
                  </div>
                  <p className="text-xs text-[var(--color-gray-dark)] leading-relaxed">
                    PaceWise isolates recurring fixed bills on Day 1. Your daily safe-to-spend allowance only pulls from your remaining discretionary budget, ensuring essential bills are never accidentally spent on daily outings.
                  </p>
                </Card>

                <Card className="p-5 border-[var(--color-gray-light)] bg-[var(--color-surface)] shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-dark)] mb-2">
                    <TrendingUp size={18} className="text-[var(--color-success)]" />
                    <span>Month-End Cycle Rollover</span>
                  </div>
                  <p className="text-xs text-[var(--color-gray-dark)] leading-relaxed">
                    At midnight on the final day of your monthly cycle, any remaining savings or deficit rolls forward into the new cycle. Your previous months remain permanently archived for clean insights.
                  </p>
                </Card>
              </div>
            </section>
          )}

          {/* ── Section 6: FAQs ── */}
          {(activeTab === 'all' || activeTab === 'faqs') && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="text-amber-500" size={20} />
                <h2 className="text-xl font-extrabold text-[var(--color-dark)]">Frequently Asked Questions</h2>
              </div>

              <div className="space-y-3">
                {filteredFaqs.map((faq, index) => {
                  const isExpanded = expandedFaqIndex === index;
                  return (
                    <Card 
                      key={faq.question}
                      className="border-[var(--color-gray-light)] overflow-hidden transition-all bg-[var(--color-surface)] shadow-sm"
                    >
                      <button
                        onClick={() => toggleFaq(index)}
                        className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-[var(--color-surface-light)] transition-colors cursor-pointer"
                      >
                        <span className="font-bold text-sm sm:text-base text-[var(--color-dark)]">
                          {faq.question}
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={18} className="text-[var(--color-gray-dark)] shrink-0" />
                        ) : (
                          <ChevronDown size={18} className="text-[var(--color-gray-dark)] shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 sm:px-5 pb-5 pt-2 text-xs sm:text-sm text-[var(--color-dark)] leading-relaxed border-t border-[var(--color-gray-light)] bg-[var(--color-surface-light)]/60 whitespace-pre-line animate-in fade-in duration-150 font-medium">
                          {faq.answer}
                        </div>
                      )}
                    </Card>
                  );
                })}

                {filteredFaqs.length === 0 && (
                  <div className="text-center py-10 text-[var(--color-gray-dark)]">
                    <Search size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No matching guide topics found</p>
                    <p className="text-xs mt-1">Try searching for keywords like "pace", "bills", "safeguards", or "settle".</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Sticky Quick Reference & Formula Cheat Sheet (Fills the Desktop Layout) */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
          
          {/* Mathematical Formulas Card */}
          <Card className="p-5 border-[var(--color-gray-light)] bg-[var(--color-surface)] shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold">
                <Calculator size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--color-dark)]">Formulas Cheat Sheet</h3>
                <p className="text-[10px] text-[var(--color-gray-dark)]">Mathematical pacing rules</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)]">
                <p className="font-bold text-[var(--color-dark)] text-[11px] mb-1">Base Daily Allowance</p>
                <code className="text-[11px] font-bold text-[var(--color-primary)] font-mono">
                  Total Discretionary ÷ Days in Month
                </code>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)]">
                <p className="font-bold text-[var(--color-dark)] text-[11px] mb-1">Sustainable Live Pace</p>
                <code className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                  Money Left ÷ Days Remaining
                </code>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)]">
                <p className="font-bold text-[var(--color-dark)] text-[11px] mb-1">Today's Available Spending</p>
                <code className="text-[11px] font-bold text-purple-700 dark:text-purple-400 font-mono">
                  Daily Allowance + Carry Forward
                </code>
              </div>
            </div>
          </Card>

          {/* Pacing Speed Dial Matrix */}
          <Card className="p-5 border-[var(--color-gray-light)] bg-[var(--color-surface)] shadow-sm space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Gauge size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--color-dark)]">Pacing Status Matrix</h3>
                <p className="text-[10px] text-[var(--color-gray-dark)]">Burn rate indicators</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-[var(--color-dark)]">Ahead of Pace</p>
                  <p className="text-[11px] text-[var(--color-gray-dark)] mt-0.5">Spending below daily threshold. Surplus accumulates into carry forward.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-[var(--color-dark)]">On Pace</p>
                  <p className="text-[11px] text-[var(--color-gray-dark)] mt-0.5">Spending in sweet spot. Exactly matched with monthly targets.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-[var(--color-dark)]">Slow Down</p>
                  <p className="text-[11px] text-[var(--color-gray-dark)] mt-0.5">Higher daily burn. Future allowances adjust lower to self-heal.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Smart Safeguards Summary */}
          <Card className="p-5 border-[var(--color-gray-light)] bg-[var(--color-surface)] shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Shield size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--color-dark)]">PaceWise Core Rules</h3>
                <p className="text-[10px] text-[var(--color-gray-dark)]">Key design safeguards</p>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-[var(--color-dark)]">
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Bills Protection:</strong> Never deduct retroactively from past carry forward.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Defaults Hidden:</strong> Standard categories hide to keep forms clean.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Past Integrity:</strong> Existing transactions always preserve their category names.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Zero Double-Counting:</strong> Paid for Me expenses only record on settlement.</span>
              </li>
            </ul>
          </Card>

        </div>
      </div>
    </div>
  );
}
