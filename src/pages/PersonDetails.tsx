import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IconBadge } from '../components/ui/IconBadge';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle, 
  Trash2, 
  Clock, 
  Receipt,
  ShoppingCart
} from 'lucide-react';
import { cn } from '../utils/cn';
import { PersonTransactionModal } from '../components/modals/PersonTransactionModal';
import { SettleModal } from '../components/modals/SettleModal';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import type { Transaction } from '../features/budget/budgetEngine';

export function PersonDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { people, transactions, deletePerson } = useStore();

  const person = people.find((p) => p.id === id);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txDirection, setTxDirection] = useState<'gave' | 'took' | 'bought_for_me'>('gave');
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleTransaction, setSettleTransaction] = useState<Transaction | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (!person) {
    return (
      <div className="text-center py-20 space-y-4 animate-in fade-in">
        <h2 className="text-2xl font-bold text-[var(--color-dark)]">Person Not Found</h2>
        <p className="text-sm text-[var(--color-gray-dark)]">The person you are looking for does not exist or was deleted.</p>
        <Link to="/people">
          <Button variant="primary">Back to People</Button>
        </Link>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `₹${Math.abs(amount).toLocaleString('en-IN')}`;

  // Filter all transactions for this person
  const personTransactions = transactions
    .filter((t) => t.personId === person.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalLent = personTransactions
    .filter(t => t.direction === 'gave' && !t.isBoughtForMeSettlement)
    .reduce((sum, t) => sum + (t.isSettlement ? -t.amount : t.amount), 0);

  const totalBorrowed = personTransactions
    .filter(t => t.direction === 'took' && !t.isBoughtForMeSettlement)
    .reduce((sum, t) => sum + (t.isSettlement ? -t.amount : t.amount), 0);

  const totalBoughtForMe = personTransactions
    .filter(t => t.direction === 'bought_for_me' && t.status !== 'settled')
    .reduce((sum, t) => sum + t.amount, 0);

  const isOwedToUser = person.balance > 0;
  const isUserOwing = person.balance < 0;
  const isSettled = person.balance === 0;

  const handleDelete = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleOpenTransaction = (direction: 'gave' | 'took' | 'bought_for_me') => {
    setTxDirection(direction);
    setIsTxModalOpen(true);
  };

  const handleSettleIndividual = (t: Transaction) => {
    setSettleTransaction(t);
    setIsSettleModalOpen(true);
  };

  const handleSettleAll = () => {
    setSettleTransaction(null);
    setIsSettleModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top navigation & action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/people')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-gray-dark)] hover:text-[var(--color-dark)] transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to People</span>
        </button>

        <button 
          onClick={handleDelete}
          className="p-2 text-[var(--color-gray-dark)] hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors"
          title="Delete person"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Hero Person Profile Card */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-amber-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
              {person.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)]">{person.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold w-fit",
                  isOwedToUser ? "" :
                  isUserOwing ? "" :
                  "bg-gray-100 dark:bg-gray-800 text-[var(--color-gray-dark)]"
                )}
                style={isOwedToUser ? {
                  background: 'var(--positive-bg)',
                  color: 'var(--positive-text)',
                  border: '1px solid var(--positive-border)'
                } : isUserOwing ? {
                  background: 'var(--negative-bg)',
                  color: 'var(--negative-text)',
                  border: '1px solid var(--negative-border)'
                } : undefined}>
                  {isOwedToUser ? "Owes you money" : isUserOwing ? "You owe money" : "Settled up"}
                </div>
                <span className="text-xs text-[var(--color-gray-dark)]">• {personTransactions.length} transactions</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-[var(--color-gray-light)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-dark)]">Outstanding Balance</p>
            <h2 className={cn(
              "text-4xl font-extrabold mt-1",
              isOwedToUser ? "text-[var(--color-success)]" :
              isUserOwing ? "text-[var(--color-primary)]" :
              "text-[var(--color-gray-dark)]"
            )}>
              {formatCurrency(person.balance)}
            </h2>
          </div>
        </div>

        {/* 3-Way Financial Breakdown */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-[var(--color-gray-light)] text-center">
          <div className="p-3 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)] block">↗ Lent</span>
            <span className="text-base sm:text-lg font-extrabold text-[var(--color-success)] mt-0.5 block">
              ₹{Math.max(0, totalLent).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)] block">↘ Borrowed</span>
            <span className="text-base sm:text-lg font-extrabold text-[var(--color-primary)] mt-0.5 block">
              ₹{Math.max(0, totalBorrowed).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--color-surface-light)] border border-[var(--color-gray-light)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-gray-dark)] block">🛒 Purchases</span>
            <span className="text-base sm:text-lg font-extrabold text-purple-600 dark:text-purple-400 mt-0.5 block">
              ₹{totalBoughtForMe.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-6 pt-6 border-t border-[var(--color-gray-light)] space-y-3">
          {!isSettled && (
            <Button 
              variant="primary" 
              onClick={handleSettleAll}
              className="w-full font-bold flex items-center justify-center gap-2 py-3 shadow-sm text-base"
              style={isOwedToUser ? {background: 'var(--positive-accent)'} : undefined}
            >
              <CheckCircle size={18} />
              <span>Settle {isOwedToUser ? "Repayment" : "Debt"}</span>
            </Button>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleOpenTransaction('gave')}
              className="w-full font-bold flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs"
              style={{
                color: 'var(--positive-text)',
                borderColor: 'var(--positive-border)',
              }}
            >
              <ArrowUpRight size={16} className="shrink-0" />
              <span>Lent (+₹)</span>
            </Button>

            <Button 
              variant="outline" 
              onClick={() => handleOpenTransaction('took')}
              className="w-full font-bold flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs"
              style={{
                color: 'var(--negative-text)',
                borderColor: 'var(--negative-border)',
              }}
            >
              <ArrowDownRight size={16} className="shrink-0" />
              <span>Borrowed (-₹)</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handleOpenTransaction('bought_for_me')}
              className="col-span-2 sm:col-span-1 w-full font-bold flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs"
              style={{
                color: 'var(--negative-text)',
                borderColor: 'var(--negative-border)',
              }}
            >
              <ShoppingCart size={16} className="shrink-0" />
              <span>Bought for Me (-₹)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Chronological History with this Person */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[var(--color-gray-dark)]" />
              <CardTitle>History with {person.name}</CardTitle>
            </div>
            <span className="text-xs text-[var(--color-gray-dark)]">{personTransactions.length} records</span>
          </div>
        </CardHeader>

        <div className="mt-4 divide-y divide-[var(--color-gray-light)]">
          {personTransactions.map((t) => {
            const isLent = t.direction === 'gave' && !t.isSettlement;
            const isBorrowed = t.direction === 'took' && !t.isSettlement;
            const isBoughtForMe = t.direction === 'bought_for_me' && !t.isSettlement;
            const isSettlement = t.isSettlement;
            const isSettled = t.status === 'settled';

            return (
              <div key={t.id} className="py-4 flex flex-col hover:bg-[var(--color-surface-light)] px-3 -mx-3 rounded-xl transition-colors">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <IconBadge 
                      iconName={isSettlement ? 'CheckCircle' : isLent ? 'ArrowUpRight' : (isBoughtForMe ? 'ShoppingCart' : 'ArrowDownRight')}
                      color={isSettlement ? 'blue' : isLent ? 'green' : 'red'}
                    />
                    <div>
                      <p className="text-sm font-bold text-[var(--color-dark)] flex items-center gap-2">
                        {t.reason || (isSettlement ? 'Settlement Payment' : isLent ? 'Lent Money' : (isBoughtForMe ? 'Bought for Me' : 'Borrowed Money'))}
                        {isBoughtForMe && (
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase",
                            isSettled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {isSettled ? '✓ Settled' : 'Unsettled'}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--color-gray-dark)] flex items-center gap-1.5 mt-0.5">
                        <span>{format(new Date(t.date), 'dd MMM yyyy, h:mm a')}</span>
                        {t.note && <span>• {t.note}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={cn(
                      "text-base font-extrabold",
                      isSettlement ? "text-blue-600 dark:text-blue-400" :
                      isLent ? "text-[var(--color-success)]" :
                      "text-[var(--color-primary)]"
                    )}>
                      {isLent ? `+₹${t.amount.toLocaleString('en-IN')}` :
                       isBorrowed || isBoughtForMe ? `-₹${t.amount.toLocaleString('en-IN')}` :
                       `₹${t.amount.toLocaleString('en-IN')}`}
                    </span>
                    <p className="text-[10px] uppercase font-bold text-[var(--color-gray-dark)]">
                      {isSettlement ? 'Settlement' : isLent ? 'Lent' : (isBoughtForMe ? (t.category || 'Item') : 'Borrowed')}
                    </p>
                  </div>
                </div>
                {isBoughtForMe && !isSettled && (
                  <div className="mt-3 flex justify-end w-full">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleSettleIndividual(t)}
                      className="text-xs h-7 py-0 px-3 flex items-center gap-1 border-[var(--color-success)] text-[var(--color-success)] hover:bg-[var(--color-success)] hover:text-white"
                    >
                      <CheckCircle size={14} />
                      Settle Item
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {personTransactions.length === 0 && (
            <div className="text-center py-12 text-[var(--color-gray-dark)]">
              <Receipt size={32} className="mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-sm">No transaction history yet</p>
              <p className="text-xs mt-1">Record when you lend or borrow money from {person.name}.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modals */}
      <PersonTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        person={person}
        defaultDirection={txDirection}
      />

      <SettleModal
        isOpen={isSettleModalOpen}
        onClose={() => {
          setIsSettleModalOpen(false);
          setSettleTransaction(null);
        }}
        person={person}
        transactionToSettle={settleTransaction || undefined}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          deletePerson(person.id);
          navigate('/people');
        }}
        title="Delete person?"
        description={
          <>
            Are you sure you want to delete{' '}
            <span className="font-bold text-[var(--color-dark)]">"{person.name}"</span> from your People list?
            This action cannot be undone.
          </>
        }
        confirmText="Delete Person"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
