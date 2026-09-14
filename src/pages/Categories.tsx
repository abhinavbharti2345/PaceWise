import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Tag, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../utils/cn';
import { EXPENSE_CATEGORIES, BILL_CATEGORIES, INCOME_SOURCES } from '../utils/categoryHelpers';
import { AddCategoryModal } from '../components/modals/AddCategoryModal';

export function Categories() {
  const { 
    customCategories = [],
    customBillCategories = [],
    customIncomeCategories = [],
    hiddenCategories = [],
    hideCategory,
    unhideCategory,
    deleteCustomCategory,
    deleteCustomBillCategory,
    deleteCustomIncomeCategory
  } = useStore();
  
  const navigate = useNavigate();
  const [categoryTab, setCategoryTab] = useState<'expense' | 'bill' | 'income'>('expense');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Per-tab visible item counts to drive empty state
  const visibleExpenseCount = EXPENSE_CATEGORIES.filter(
    c => !hiddenCategories.some(h => h.toLowerCase() === c.name.toLowerCase())
  ).length + customCategories.length;
  const visibleBillCount = BILL_CATEGORIES.filter(
    c => !hiddenCategories.some(h => h.toLowerCase() === c.name.toLowerCase())
  ).length + customBillCategories.length;
  const visibleIncomeCount = INCOME_SOURCES.filter(
    c => !hiddenCategories.some(h => h.toLowerCase() === c.name.toLowerCase())
  ).length + customIncomeCategories.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl pb-20 sm:pb-0">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-gray-light)] text-[var(--color-dark)] flex items-center justify-center hover:bg-[var(--color-surface-light)] transition-colors shadow-sm cursor-pointer"
            title="Back to Settings"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-dark)]">Categories & Types</h1>
            <p className="text-[var(--color-gray-dark)] text-sm">Customize, hide, and manage your spending categories.</p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 font-bold shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add {categoryTab === 'expense' ? 'Category' : (categoryTab === 'bill' ? 'Bill Type' : 'Income Source')}</span>
        </Button>
      </header>

      {/* Safeguard Notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] text-xs text-[var(--color-gray-dark)] shadow-sm">
        <ShieldCheck size={20} className="text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-bold text-[var(--color-dark)] text-sm">🛡️ Smart Data Safeguards</p>
          <p>
            Default categories can be <strong>hidden</strong> to streamline your daily add menus without deleting them. 
            Custom categories can be permanently deleted. 
            Your past transactions will <em>always retain</em> their category history intact.
          </p>
        </div>
      </div>

      {/* Main Categories Card */}
      <Card className="border border-[var(--color-gray-light)]">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-[var(--color-primary)]" />
              <CardTitle>Manage Categories</CardTitle>
            </div>

            {/* Sub-tab Switch */}
            <div className="flex gap-1.5 p-1 bg-[var(--color-surface-light)] rounded-xl w-full sm:w-auto flex-wrap">
              <button
                type="button"
                onClick={() => setCategoryTab('expense')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-none text-center",
                  categoryTab === 'expense'
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm"
                    : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
                )}
              >
                Expense ({EXPENSE_CATEGORIES.length + customCategories.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryTab('bill')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-none text-center",
                  categoryTab === 'bill'
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm"
                    : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
                )}
              >
                Bills ({BILL_CATEGORIES.length + customBillCategories.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryTab('income')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-none text-center",
                  categoryTab === 'income'
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm"
                    : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
                )}
              >
                Income ({INCOME_SOURCES.length + customIncomeCategories.length})
              </button>
            </div>
          </div>
        </CardHeader>

        <div className="p-4 sm:p-6">
          {/* Categories List */}
          <div className="divide-y divide-[var(--color-gray-light)] border border-[var(--color-gray-light)] rounded-2xl overflow-hidden bg-[var(--color-surface)]">
            {/* Empty state when all categories in a tab are hidden with no custom ones */}
            {((categoryTab === 'expense' && visibleExpenseCount === 0 && customCategories.length === 0) ||
              (categoryTab === 'bill' && visibleBillCount === 0 && customBillCategories.length === 0) ||
              (categoryTab === 'income' && visibleIncomeCount === 0 && customIncomeCategories.length === 0)) && (
              <div className="flex flex-col items-center justify-center py-10 px-4 gap-3 text-center">
                <EyeOff size={28} className="text-[var(--color-gray-dark)] opacity-50" />
                <div>
                  <p className="text-sm font-bold text-[var(--color-dark)]">All categories are hidden</p>
                  <p className="text-xs text-[var(--color-gray-dark)] mt-0.5">
                    Unhide some above, or add a custom {categoryTab === 'expense' ? 'category' : categoryTab === 'bill' ? 'bill type' : 'income source'}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer"
                >
                  + Add Custom
                </button>
              </div>
            )}
            {categoryTab === 'expense' ? (
              <>
                {/* Standard Expense Categories */}
                {EXPENSE_CATEGORIES.map((cat) => {
                  const isHidden = hiddenCategories.some(h => h.toLowerCase() === cat.name.toLowerCase());
                  return (
                    <div 
                      key={`def-exp-${cat.name}`}
                      className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-[var(--color-surface-light)]/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={cn(
                          "text-sm font-semibold truncate",
                          isHidden ? "text-[var(--color-gray-dark)] line-through opacity-75" : "text-[var(--color-dark)]"
                        )}>
                          {cat.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[var(--color-gray-dark)] font-bold">
                          Default
                        </span>
                        {isHidden && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold">
                            Hidden
                          </span>
                        )}
                      </div>

                      {isHidden ? (
                        <button
                          type="button"
                          onClick={() => unhideCategory(cat.name)}
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                          title="Unhide category in add forms"
                        >
                          <Eye size={14} />
                          <span>Unhide</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => hideCategory(cat.name)}
                          className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-gray-dark)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                          title="Hide category from add forms"
                        >
                          <EyeOff size={14} />
                          <span>Hide</span>
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Custom Expense Categories */}
                {customCategories.map((cat) => (
                  <div 
                    key={`custom-exp-${cat.name}`}
                    className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-[var(--color-surface-light)]/50 transition-colors bg-purple-50/20 dark:bg-purple-950/10"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm font-semibold text-[var(--color-dark)] truncate">
                        {cat.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">
                        Custom
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteCustomCategory(cat.name)}
                      className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                      title="Permanently delete custom category"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                ))}
              </>
            ) : categoryTab === 'bill' ? (
              <>
                {/* Standard Bill Categories */}
                {BILL_CATEGORIES.map((cat) => {
                  const isHidden = hiddenCategories.some(h => h.toLowerCase() === cat.name.toLowerCase());
                  return (
                    <div 
                      key={`def-bill-${cat.name}`}
                      className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-[var(--color-surface-light)]/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={cn(
                          "text-sm font-semibold truncate",
                          isHidden ? "text-[var(--color-gray-dark)] line-through opacity-75" : "text-[var(--color-dark)]"
                        )}>
                          {cat.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[var(--color-gray-dark)] font-bold">
                          Default
                        </span>
                        {isHidden && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold">
                            Hidden
                          </span>
                        )}
                      </div>

                      {isHidden ? (
                        <button
                          type="button"
                          onClick={() => unhideCategory(cat.name)}
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                          title="Unhide bill type in add forms"
                        >
                          <Eye size={14} />
                          <span>Unhide</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => hideCategory(cat.name)}
                          className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-gray-dark)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                          title="Hide bill type from add forms"
                        >
                          <EyeOff size={14} />
                          <span>Hide</span>
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Custom Bill Categories */}
                {customBillCategories.map((cat) => (
                  <div 
                    key={`custom-bill-${cat.name}`}
                    className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-[var(--color-surface-light)]/50 transition-colors bg-red-50/20 dark:bg-red-950/10"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm font-semibold text-[var(--color-dark)] truncate">
                        {cat.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold">
                        Custom
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteCustomBillCategory(cat.name)}
                      className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                      title="Permanently delete custom bill type"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                ))}
              </>
            ) : (
              <>
                {/* Standard Income Sources */}
                {INCOME_SOURCES.map((cat) => {
                  const isHidden = hiddenCategories.some(h => h.toLowerCase() === cat.name.toLowerCase());
                  return (
                    <div 
                      key={`def-inc-${cat.name}`}
                      className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-[var(--color-surface-light)]/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={cn(
                          "text-sm font-semibold truncate",
                          isHidden ? "text-[var(--color-gray-dark)] line-through opacity-75" : "text-[var(--color-dark)]"
                        )}>
                          {cat.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[var(--color-gray-dark)] font-bold">
                          Default
                        </span>
                        {isHidden && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold">
                            Hidden
                          </span>
                        )}
                      </div>

                      {isHidden ? (
                        <button
                          type="button"
                          onClick={() => unhideCategory(cat.name)}
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                          title="Unhide income source in add forms"
                        >
                          <Eye size={14} />
                          <span>Unhide</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => hideCategory(cat.name)}
                          className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-gray-dark)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                          title="Hide income source from add forms"
                        >
                          <EyeOff size={14} />
                          <span>Hide</span>
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Custom Income Sources */}
                {customIncomeCategories.map((cat) => (
                  <div 
                    key={`custom-inc-${cat.name}`}
                    className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-[var(--color-surface-light)]/50 transition-colors bg-emerald-50/20 dark:bg-emerald-950/10"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm font-semibold text-[var(--color-dark)] truncate">
                        {cat.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                        Custom
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteCustomIncomeCategory(cat.name)}
                      className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                      title="Permanently delete custom income source"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Modal to add custom category */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categoryType={categoryTab}
        title={categoryTab === 'expense' ? 'Add Custom Expense Category' : (categoryTab === 'bill' ? 'Add Custom Bill Type' : 'Add Custom Income Source')}
      />
    </div>
  );
}
