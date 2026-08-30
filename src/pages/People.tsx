import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UserPlus, ChevronRight, Search, Users, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import { cn } from '../utils/cn';
import { AddPersonModal } from '../components/modals/AddPersonModal';

export function People() {
  const navigate = useNavigate();
  const { people } = useStore();
  const [search, setSearch] = useState('');
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);

  const formatCurrency = (amount: number) => `₹${Math.abs(amount).toLocaleString('en-IN')}`;

  // Positive balance means they owe us (To Receive)
  // Negative balance means we owe them (To Give)
  const toReceive = people.filter(p => (p.balance || 0) > 0).reduce((sum, p) => sum + p.balance, 0);
  const toGive = people.filter(p => (p.balance || 0) < 0).reduce((sum, p) => sum + Math.abs(p.balance), 0);
  const netBalance = toReceive - toGive;

  const filteredPeople = people
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Math.abs(b.balance || 0) - Math.abs(a.balance || 0));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">People & Debts</h1>
          <p className="text-[var(--color-gray-dark)] text-sm">Track informal loans and shared expenses with friends.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsAddPersonOpen(true)} 
          className="h-10 px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm"
        >
          <UserPlus size={18} />
          <span>Add Person</span>
        </Button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className="p-4 border"
          style={{background: 'var(--positive-bg)', border: '1px solid var(--positive-border)'}}
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{color: 'var(--positive-text)'}}>To Receive</p>
              <ArrowDownRight style={{color: 'var(--positive-accent)'}} size={18} />
            </div>
            <p className="text-3xl font-extrabold text-[var(--color-success)]">{formatCurrency(toReceive)}</p>
            <p className="text-xs mt-1 font-medium" style={{color: 'var(--positive-text)'}}>
              {people.filter(p => (p.balance || 0) > 0).length} people owe you
            </p>
          </div>
        </Card>

        <Card
          className="p-4 border"
          style={{background: 'var(--negative-bg)', border: '1px solid var(--negative-border)'}}
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{color: 'var(--negative-text)'}}>To Give</p>
              <ArrowUpRight style={{color: 'var(--negative-text)'}} size={18} />
            </div>
            <p className="text-3xl font-extrabold text-[var(--color-primary)]">{formatCurrency(toGive)}</p>
            <p className="text-xs mt-1 font-medium" style={{color: 'var(--negative-text)'}}>
              You owe {people.filter(p => (p.balance || 0) < 0).length} people
            </p>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[var(--color-gray-dark)] uppercase tracking-wider">Net Position</p>
            <Scale className="text-[var(--color-gray-dark)]" size={18} />
          </div>
          <h3 className={cn(
            "text-2xl font-extrabold mt-2",
            netBalance > 0 ? "text-[var(--color-success)]" : netBalance < 0 ? "text-[var(--color-primary)]" : "text-[var(--color-dark)]"
          )}>
            {netBalance > 0 ? `+${formatCurrency(netBalance)}` : netBalance < 0 ? `-${formatCurrency(netBalance)}` : '₹0'}
          </h3>
          <p className="text-xs text-[var(--color-gray-dark)] mt-1 font-medium">
            {netBalance > 0 ? "Overall net positive" : netBalance < 0 ? "Overall net payable" : "Completely settled"}
          </p>
        </Card>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-gray-dark)]" />
        <input 
          type="text"
          placeholder="Search by friend's name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-gray-light)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm font-medium"
        />
      </div>

      {/* People List */}
      <div className="space-y-3 pb-20 sm:pb-0">
        {filteredPeople.map(person => {
          const balance = person.balance || 0;
          return (
            <Card 
              key={person.id} 
              onClick={() => navigate(`/people/${person.id}`)}
              className="p-4 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group border border-[var(--color-gray-light)] hover:border-gray-400"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[var(--color-surface-light)] border border-[var(--color-gray-light)] flex items-center justify-center text-[var(--color-dark)] font-extrabold text-base group-hover:scale-105 transition-transform">
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-[var(--color-dark)] text-base group-hover:text-[var(--color-primary)] transition-colors">{person.name}</p>
                  {balance === 0 ? (
                    <p className="text-xs font-semibold text-[var(--color-gray-dark)]">Settled up</p>
                  ) : (
                    <p className={cn("text-xs font-semibold flex items-center gap-1", balance > 0 ? "text-[var(--color-success)]" : "text-[var(--color-primary)]")}>
                      {balance > 0 ? "Owes you" : "You owe"}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className={cn(
                    "font-extrabold text-lg block",
                    balance === 0 ? "text-[var(--color-gray-dark)]" : balance > 0 ? "text-[var(--color-success)]" : "text-[var(--color-primary)]"
                  )}>
                    {formatCurrency(balance)}
                  </span>
                  <span className="text-[10px] text-[var(--color-gray-dark)] uppercase font-semibold">
                    {balance === 0 ? 'No Debt' : balance > 0 ? 'To Receive' : 'To Give'}
                  </span>
                </div>
                <ChevronRight size={20} className="text-[var(--color-gray-light)] group-hover:text-[var(--color-dark)] group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          );
        })}

        {filteredPeople.length === 0 && (
          <div className="text-center py-16 text-[var(--color-gray-dark)] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-gray-light)]">
            <Users size={36} className="mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-base">No people found</p>
            <p className="text-xs mt-1">Add friends to start tracking shared bills and loans.</p>
            <Button variant="outline" size="sm" onClick={() => setIsAddPersonOpen(true)} className="mt-4">
              <UserPlus size={16} className="mr-1.5" /> Add Friend
            </Button>
          </div>
        )}
      </div>

      <AddPersonModal 
        isOpen={isAddPersonOpen} 
        onClose={() => setIsAddPersonOpen(false)} 
      />
    </div>
  );
}
