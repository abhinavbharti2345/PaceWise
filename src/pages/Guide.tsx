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
  DollarSign
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { Link } from 'react-router-dom';

interface FaqItem {
  question: string;
  answer: string;
  category: 'pacing' | 'people' | 'budget' | 'general';
}

const FAQS: FaqItem[] = [
  {
    category: 'pacing',
    question: 'How is my Daily Safe-to-Spend calculated?',
    answer: 'PaceWise calculates your daily allowance by taking your remaining discretionary budget (Monthly Income minus Fixed Bills minus Spent so far) and dividing it by the number of days left in the active month. As you spend or save, it recalculates every day automatically.'
  },
  {
    category: 'pacing',
    question: 'What do the Pace Speed statuses mean?',
    answer: '• Ahead of Pace (Green): You have spent less than the scheduled pace for today.\n• On Pace (Orange/Yellow): Your daily spending is exactly in harmony with your monthly budget.\n• Slow Down (Red): You have exceeded today\'s recommended spending rate. Your remaining days\' allowances will adjust slightly lower to keep you on budget.'
  },
  {
    category: 'people',
    question: 'What is the difference between Borrowed and "Paid for Me"?',
    answer: '• Borrowed (↘): A friend gave you actual cash or transferred money to your bank account. You owe them money, but no specific budget category is tied to it.\n• Paid for Me (💳): A friend bought an item, dinner, or subscription directly on your behalf. It does not deduct from your wallet immediately. When you pay them back and "Settle", you select a category (e.g., Dining Out) so it registers as an authentic budget expense.'
  },
  {
    category: 'people',
    question: 'Does settling a debt affect my monthly budget?',
    answer: '• Settling Cash Debts/Loans (Lent / Borrowed): Only moves cash in your wallet balance; it does NOT count as discretionary expense because money was already accounted for.\n• Settling "Paid for Me" items: Yes, it logs a budget expense in the chosen category, correctly reflecting that you consumed that product or service.'
  },
  {
    category: 'budget',
    question: 'What happens at the end of the month with leftover money or deficits?',
    answer: 'PaceWise supports Carryover. If you have leftover money, it can roll over to boost next month\'s starting pool. If you ran a deficit, it will carry forward to help you pace more cautiously and recover your savings.'
  },
  {
    category: 'general',
    question: 'Is my data synced across my devices?',
    answer: 'Yes! When signed in, all your budgets, transactions, custom categories, and friend records are securely encrypted and synced in real-time with the cloud.'
  }
];

export function Guide() {
  const [activeTab, setActiveTab] = useState<'all' | 'pacing' | 'people' | 'budget' | 'faqs'>('all');
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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 max-w-4xl pb-24 sm:pb-12">
      {/* Hero Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-light)] p-5 sm:p-7 rounded-3xl border border-[var(--color-gray-light)] shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center font-bold shadow-md shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">
                How PaceWise Works
              </h1>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                Guide & FAQs
              </span>
            </div>
            <p className="text-[var(--color-gray-dark)] text-sm sm:text-base mt-1 max-w-xl">
              Master your daily spending flow, smart debt tracking, and adaptive pacing algorithms.
            </p>
          </div>
        </div>

        <Link to="/profile">
          <Button variant="outline" size="sm" className="w-full sm:w-auto font-bold gap-1 text-xs">
            Back to Profile
          </Button>
        </Link>
      </header>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface-light)] rounded-2xl border border-[var(--color-gray-light)] overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Overview' },
            { id: 'pacing', label: '⚡ Pacing' },
            { id: 'people', label: '👥 People & IOUs' },
            { id: 'budget', label: '🎯 Budget & Rollover' },
            { id: 'faqs', label: '❓ FAQs' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer",
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
        <div className="relative min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-gray-dark)]" />
          <input
            type="text"
            placeholder="Search guides & FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl text-[var(--color-dark)] placeholder-[var(--color-gray-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* ── Section 1: The Pacing Engine ── */}
      {(activeTab === 'all' || activeTab === 'pacing') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="text-[var(--color-primary)]" size={20} />
            <h2 className="text-xl font-extrabold text-[var(--color-dark)]">1. The Dynamic Pacing Engine</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 border-[var(--color-gray-light)] flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold mb-3">
                  <Compass size={20} />
                </div>
                <h3 className="text-base font-bold text-[var(--color-dark)]">Safe-to-Spend Allowance</h3>
                <p className="text-xs text-[var(--color-gray-dark)] mt-2 leading-relaxed">
                  Instead of guessing if you can afford a dinner out, PaceWise calculates an exact daily allowance.
                </p>
              </div>
              <div className="mt-4 p-3 bg-[var(--color-surface-light)] rounded-xl border border-[var(--color-gray-light)] text-[11px] font-semibold text-[var(--color-dark)]">
                Formula: <span className="text-[var(--color-primary)] font-bold">Money Left ÷ Remaining Days</span>
              </div>
            </Card>

            <Card className="p-5 border-[var(--color-gray-light)] flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-950/50 text-[var(--color-success)] flex items-center justify-center font-bold mb-3">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-base font-bold text-[var(--color-dark)]">Live Self-Healing</h3>
                <p className="text-xs text-[var(--color-gray-dark)] mt-2 leading-relaxed">
                  Spent extra today? No guilt! PaceWise gently redistributes the remainder across future days so you naturally recover without breaking your plan.
                </p>
              </div>
              <div className="mt-4 p-3 bg-[var(--color-surface-light)] rounded-xl border border-[var(--color-gray-light)] text-[11px] font-semibold text-[var(--color-dark)]">
                Adapts instantly after every transaction.
              </div>
            </Card>

            <Card className="p-5 border-[var(--color-gray-light)] flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold mb-3">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-base font-bold text-[var(--color-dark)]">Pacing Speed Dial</h3>
                <p className="text-xs text-[var(--color-gray-dark)] mt-2 leading-relaxed">
                  The dashboard speedometer gauges your burn rate in real time, alerting you when you are safely cruising or speeding.
                </p>
              </div>
              <div className="mt-4 flex gap-1.5 text-[10px] font-bold text-center">
                <span className="flex-1 py-1 rounded-lg bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300">Ahead</span>
                <span className="flex-1 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">On Pace</span>
                <span className="flex-1 py-1 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300">Slow Down</span>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* ── Section 2: People & IOUs ── */}
      {(activeTab === 'all' || activeTab === 'people') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="text-purple-600 dark:text-purple-400" size={20} />
            <h2 className="text-xl font-extrabold text-[var(--color-dark)]">2. People & Smart Debt Tracking</h2>
          </div>

          <Card className="p-5 sm:p-6 border-[var(--color-gray-light)]">
            <p className="text-xs sm:text-sm text-[var(--color-gray-dark)] mb-5">
              PaceWise separates pure cash lending from shared purchases so your budget remains 100% accurate:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Lent */}
              <div 
                className="p-4 rounded-2xl border"
                style={{
                  background: 'var(--positive-bg)',
                  borderColor: 'var(--positive-border)',
                }}
              >
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--positive-text)' }}>
                  <ArrowUpRight size={18} />
                  <span>↗ Lent (+₹)</span>
                </div>
                <p className="text-xs mt-2 leading-relaxed text-[var(--color-dark)]">
                  You gave physical cash or bank transfer to a friend. <strong>They owe you money</strong>.
                </p>
                <span className="inline-block mt-3 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-white/70 dark:bg-black/30" style={{ color: 'var(--positive-text)' }}>
                  Cash Flow Asset
                </span>
              </div>

              {/* Borrowed */}
              <div 
                className="p-4 rounded-2xl border"
                style={{
                  background: 'var(--negative-bg)',
                  borderColor: 'var(--negative-border)',
                }}
              >
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--negative-text)' }}>
                  <ArrowDownRight size={18} />
                  <span>↘ Borrowed (-₹)</span>
                </div>
                <p className="text-xs mt-2 leading-relaxed text-[var(--color-dark)]">
                  A friend handed you cash or transferred money. <strong>You owe them money</strong>.
                </p>
                <span className="inline-block mt-3 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-white/70 dark:bg-black/30" style={{ color: 'var(--negative-text)' }}>
                  Cash Flow Liability
                </span>
              </div>

              {/* Paid for Me */}
              <div 
                className="p-4 rounded-2xl border"
                style={{
                  background: 'var(--purple-bg)',
                  borderColor: 'var(--purple-border)',
                }}
              >
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--purple-text)' }}>
                  <CreditCard size={18} />
                  <span>💳 Paid for Me (-₹)</span>
                </div>
                <p className="text-xs mt-2 leading-relaxed text-[var(--color-dark)]">
                  A friend paid directly for your coffee, dinner, or shopping. <strong>You owe them</strong>, and upon settling, you categorize it as a budget expense.
                </p>
                <span className="inline-block mt-3 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-white/70 dark:bg-black/30" style={{ color: 'var(--purple-text)' }}>
                  Categorized Expense Item
                </span>
              </div>
            </div>

            {/* Settlement Pro-Tip */}
            <div className="mt-5 p-4 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] flex items-start gap-3">
              <CheckCircle size={18} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-[var(--color-dark)]">How Settle Item Works:</p>
                <p className="text-[var(--color-gray-dark)] mt-0.5 leading-relaxed">
                  When you repay a <strong className="text-[var(--color-dark)]">"Paid for Me"</strong> item, tap <strong>Settle</strong>. PaceWise records your repayment to your friend AND simultaneously attributes the cost to your chosen category (e.g. Food, Entertainment) without double-counting.
                </p>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* ── Section 3: Budget & Rollover ── */}
      {(activeTab === 'all' || activeTab === 'budget') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-[var(--color-success)]" size={20} />
            <h2 className="text-xl font-extrabold text-[var(--color-dark)]">3. Monthly Budget & Rollover</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 border-[var(--color-gray-light)]">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-dark)] mb-2">
                <DollarSign size={18} className="text-[var(--color-primary)]" />
                <span>Monthly Income vs Fixed Bills</span>
              </div>
              <p className="text-xs text-[var(--color-gray-dark)] leading-relaxed">
                PaceWise isolates your recurring bills (Rent, Utilities, Subscriptions) on Day 1. Your daily pacing allowance only pulls from your remaining discretionary pool so bills are never accidentally spent.
              </p>
            </Card>

            <Card className="p-5 border-[var(--color-gray-light)]">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-dark)] mb-2">
                <TrendingUp size={18} className="text-[var(--color-success)]" />
                <span>End-of-Month Carryover</span>
              </div>
              <p className="text-xs text-[var(--color-gray-dark)] leading-relaxed">
                At midnight on the last day of the month, any remaining savings or deficit rolls forward into the new cycle. Your history remains permanently archived for clean insights.
              </p>
            </Card>
          </div>
        </section>
      )}

      {/* ── Section 4: FAQs ── */}
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
                  className="border-[var(--color-gray-light)] overflow-hidden transition-all"
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
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--color-gray-dark)] leading-relaxed border-t border-[var(--color-gray-light)] bg-[var(--color-surface-light)]/40 whitespace-pre-line animate-in fade-in duration-150">
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
                <p className="text-xs mt-1">Try searching for keywords like "pacing", "settle", or "debt".</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
