import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Settings as SettingsIcon, 
  Monitor, 
  Moon, 
  Sun, 
  Globe,
  Sparkles,
  LogOut,
  Mail,
  User,
  ChevronRight,
  Tag,
  ShieldCheck,
  Eye,
  EyeOff,
  Trash2,
  Plus
} from 'lucide-react';
import { cn } from '../utils/cn';
import { EXPENSE_CATEGORIES, BILL_CATEGORIES, INCOME_SOURCES } from '../utils/categoryHelpers';
import { AddCategoryModal } from '../components/modals/AddCategoryModal';

export function Settings() {
  const { 
    config, 
    updateConfig,
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
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [categoryTab, setCategoryTab] = useState<'expense' | 'bill' | 'income'>('expense');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl pb-20 sm:pb-0">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center font-bold">
          <SettingsIcon size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings & Preferences</h1>
          <p className="text-[var(--color-gray-dark)] text-sm">Manage account, currency, and appearance settings.</p>
        </div>
      </header>

      {/* User Profile Card */}
      <Card 
        onClick={() => navigate('/profile')}
        className="border border-[var(--color-gray-light)] hover:border-[var(--color-primary)]/40 transition-all cursor-pointer group p-4 sm:p-5 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
            <User size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[var(--color-dark)] group-hover:text-[var(--color-primary)] transition-colors truncate">
              User Profile
            </h3>
            <p className="text-xs text-[var(--color-gray-dark)] truncate">
              View and update your profile details, display name, and avatar.
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-[var(--color-gray-dark)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
      </Card>

      {/* Account Card */}
      <Card className="border border-[var(--color-gray-light)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-[var(--color-primary)]" />
            <CardTitle>Account</CardTitle>
          </div>
        </CardHeader>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-gray-dark)] uppercase font-bold tracking-wider">
                Email
              </p>
              <p className="text-sm font-semibold text-[var(--color-dark)] mt-1">{user?.email}</p>
            </div>
          </div>

          <Button
            onClick={handleSignOut}
            disabled={isSigningOut}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 font-bold text-red-600 hover:bg-red-50"
          >
            <LogOut size={16} />
            <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
          </Button>
        </div>
      </Card>

      {/* Currency Preference Card */}
      <Card className="border border-[var(--color-gray-light)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-[var(--color-primary)]" />
            <CardTitle>Currency Preference</CardTitle>
          </div>
        </CardHeader>

        <div className="p-6">
          <p className="text-xs text-[var(--color-gray-dark)] mb-3">
            Choose your preferred currency symbol to display throughout PaceWise.
          </p>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)] mb-1">
              Currency Symbol
            </label>
            <select
              value={config.currency || '₹'}
              onChange={(e) => updateConfig({ currency: e.target.value })}
              className="w-full sm:w-64 bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl px-3 py-2.5 text-sm font-bold text-[var(--color-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="₹">₹ (INR - Indian Rupee)</option>
              <option value="$">$ (USD - Dollar)</option>
              <option value="€">€ (EUR - Euro)</option>
              <option value="£">£ (GBP - Pound)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Appearance Card */}
      <Card className="border border-[var(--color-gray-light)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <CardTitle>Appearance & Theme</CardTitle>
          </div>
        </CardHeader>

        <div className="mt-4">
          <p className="text-xs text-[var(--color-gray-dark)] mb-3">
            Choose how PaceWise looks. Select dark mode for night usage or system to match your device.
          </p>
          <div className="grid grid-cols-3 gap-3 bg-[var(--color-surface-light)] p-1.5 rounded-2xl">
            <button 
              type="button"
              onClick={() => updateConfig({ theme: 'light' })}
              className={cn(
                "py-3 px-3 text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row justify-center items-center gap-2",
                config.theme === 'light' 
                  ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-md" 
                  : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
              )}
            >
              <Sun size={18} />
              <span>Light Mode</span>
            </button>

            <button 
              type="button"
              onClick={() => updateConfig({ theme: 'dark' })}
              className={cn(
                "py-3 px-3 text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row justify-center items-center gap-2",
                config.theme === 'dark' 
                  ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-md" 
                  : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
              )}
            >
              <Moon size={18} />
              <span>Dark Mode</span>
            </button>

            <button 
              type="button"
              onClick={() => updateConfig({ theme: 'system' })}
              className={cn(
                "py-3 px-3 text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row justify-center items-center gap-2",
                config.theme === 'system' 
                  ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-md" 
                  : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
              )}
            >
              <Monitor size={18} />
              <span>System Match</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Category & Bill Types Management Card */}
      <Card className="border border-[var(--color-gray-light)]">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-[var(--color-primary)]" />
              <CardTitle>Manage Categories & Types</CardTitle>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Custom {categoryTab === 'expense' ? 'Category' : (categoryTab === 'bill' ? 'Bill Type' : 'Income Source')}</span>
            </Button>
          </div>
        </CardHeader>

        <div className="p-6 space-y-4">
          {/* Safeguard Notice */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] text-xs text-[var(--color-gray-dark)]">
            <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <p className="font-semibold text-[var(--color-dark)]">🛡️ Smart Data Safeguards</p>
              <p>
                Default categories can be <strong>hidden</strong> to streamline your daily add menus without deleting them. 
                Custom categories can be permanently deleted. 
                Your past transactions will <em>always retain</em> their category history intact.
              </p>
            </div>
          </div>

          {/* Sub-tab Switch */}
          <div className="flex gap-2 p-1 bg-[var(--color-surface-light)] rounded-xl w-fit flex-wrap">
            <button
              type="button"
              onClick={() => setCategoryTab('expense')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                categoryTab === 'expense'
                  ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm"
                  : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
              )}
            >
              Expense Categories ({EXPENSE_CATEGORIES.length + customCategories.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryTab('bill')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                categoryTab === 'bill'
                  ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm"
                  : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
              )}
            >
              Bill Types ({BILL_CATEGORIES.length + customBillCategories.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryTab('income')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                categoryTab === 'income'
                  ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm"
                  : "text-[var(--color-gray-dark)] hover:text-[var(--color-dark)]"
              )}
            >
              Income Sources ({INCOME_SOURCES.length + customIncomeCategories.length})
            </button>
          </div>

          {/* Categories List */}
          <div className="divide-y divide-[var(--color-gray-light)] border border-[var(--color-gray-light)] rounded-2xl overflow-hidden bg-[var(--color-surface)]">
            {categoryTab === 'expense' ? (
              <>
                {/* Standard Expense Categories */}
                {EXPENSE_CATEGORIES.map((cat) => {
                  const isHidden = hiddenCategories.some(h => h.toLowerCase() === cat.name.toLowerCase());
                  return (
                    <div 
                      key={`def-exp-${cat.name}`}
                      className="flex items-center justify-between p-3 sm:px-4 hover:bg-[var(--color-surface-light)]/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={cn(
                          "text-sm font-semibold truncate",
                          isHidden ? "text-[var(--color-gray-dark)] line-through" : "text-[var(--color-dark)]"
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
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                          title="Unhide category in add forms"
                        >
                          <Eye size={14} />
                          <span>Unhide</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => hideCategory(cat.name)}
                          className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-gray-dark)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
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
                    className="flex items-center justify-between p-3 sm:px-4 hover:bg-[var(--color-surface-light)]/50 transition-colors bg-purple-50/20 dark:bg-purple-950/10"
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
                      className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
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
                      className="flex items-center justify-between p-3 sm:px-4 hover:bg-[var(--color-surface-light)]/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={cn(
                          "text-sm font-semibold truncate",
                          isHidden ? "text-[var(--color-gray-dark)] line-through" : "text-[var(--color-dark)]"
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
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                          title="Unhide bill type in add forms"
                        >
                          <Eye size={14} />
                          <span>Unhide</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => hideCategory(cat.name)}
                          className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-gray-dark)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
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
                    className="flex items-center justify-between p-3 sm:px-4 hover:bg-[var(--color-surface-light)]/50 transition-colors bg-red-50/20 dark:bg-red-950/10"
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
                      className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
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
                      className="flex items-center justify-between p-3 sm:px-4 hover:bg-[var(--color-surface-light)]/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={cn(
                          "text-sm font-semibold truncate",
                          isHidden ? "text-[var(--color-gray-dark)] line-through" : "text-[var(--color-dark)]"
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
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                          title="Unhide income source in add forms"
                        >
                          <Eye size={14} />
                          <span>Unhide</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => hideCategory(cat.name)}
                          className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-gray-dark)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
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
                    className="flex items-center justify-between p-3 sm:px-4 hover:bg-[var(--color-surface-light)]/50 transition-colors bg-emerald-50/20 dark:bg-emerald-950/10"
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
                      className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
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

      {/* Modal to add custom category from Settings */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categoryType={categoryTab}
        title={categoryTab === 'expense' ? 'Add Custom Expense Category' : (categoryTab === 'bill' ? 'Add Custom Bill Type' : 'Add Custom Income Source')}
      />
    </div>
  );
}

