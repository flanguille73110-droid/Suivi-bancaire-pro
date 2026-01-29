
import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { AppContext } from '../App';
import { BankAccount, Transaction, ReconciliationMarker, TransactionType, Frequency, AppContextType } from '../types';
import { Plus, Trash2, Edit2, X, Info, ArrowRight, ArrowUpDown, Target, Repeat, Wallet, CreditCard, Check, Clock, Zap, RotateCcw, Landmark, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';
import IconPicker from './IconPicker';

const Accounts: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const { accounts, transactions, recurring, categories, goals, cards, addAccount, confirmDelete, updateAccount, updateTransaction, addTransaction, updateGoal, notify } = context;
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<'add' | 'edit' | null>(null);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  const [displayInitialBalance, setDisplayInitialBalance] = useState("");
  const [displayTAmount, setDisplayTAmount] = useState("");
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const [formData, setFormData] = useState<Partial<BankAccount>>({ 
    name: '', icon: '🏦', color: '#6366f1', initialBalance: 0, isPrincipal: false,
    bankBalanceManual: 0, cardOutstandingManual: 0
  });

  const [tFormData, setTFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: TransactionType.EXPENSE,
    sourceAccountId: '',
    destinationAccountId: '',
    targetGoalId: '',
    categoryId: '',
    subCategory: '',
    description: '',
    amount: 0,
    paymentMethod: 'Virement',
    chequeNumber: '',
    reconciliation: ReconciliationMarker.NONE
  });

  const scrollToTop = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ 
        top: tableContainerRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const calculateRealBalance = (acc: BankAccount) => {
    const accTransactions = transactions.filter((t: Transaction) => 
      String(t.sourceAccountId) === String(acc.id) || 
      String(t.destinationAccountId) === String(acc.id)
    );
    
    return accTransactions.reduce((balance: number, t: Transaction) => {
      if (String(t.sourceAccountId) === String(acc.id)) {
        return balance + t.revenue - t.expense;
      }
      if (String(t.destinationAccountId) === String(acc.id)) {
        return balance + t.expense;
      }
      return balance;
    }, acc.initialBalance);
  };

  const totalCardsOutstandingApp = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.reduce((sum, t) => {
      const tDate = new Date(t.date);
      if (t.paymentMethod.startsWith('Carte:') && 
          tDate.getMonth() === currentMonth && 
          tDate.getFullYear() === currentYear) {
        return sum + t.expense;
      }
      return sum;
    }, 0);
  }, [transactions]);

  const selectedAccount = useMemo(() => 
    accounts.find((a: BankAccount) => String(a.id) === String(selectedAccountId)),
    [accounts, selectedAccountId]
  );

  const processedTransactions = useMemo(() => {
    if (!selectedAccount) return [];
    
    let filtered = transactions.filter((t: Transaction) => 
      String(t.sourceAccountId) === String(selectedAccount.id) || 
      String(t.destinationAccountId) === String(selectedAccount.id)
    );

    const reconOrder = [
        ReconciliationMarker.GREEN_CHECK,
        ReconciliationMarker.G,
        ReconciliationMarker.G2,
        ReconciliationMarker.D,
        ReconciliationMarker.D2,
        ReconciliationMarker.C,
        ReconciliationMarker.NONE
    ];

    const sorted = [...filtered].sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA: any;
      let valB: any;

      if (key === 'reconciliation') {
        valA = reconOrder.indexOf(a.reconciliation);
        valB = reconOrder.indexOf(b.reconciliation);
        if (valA === -1) valA = 99;
        if (valB === -1) valB = 99;
      } else {
        valA = (a as any)[key];
        valB = (b as any)[key];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    let currentBalance = selectedAccount.initialBalance;
    return sorted.map(t => {
      const isSource = String(t.sourceAccountId) === String(selectedAccount.id);
      const impact = isSource ? (t.revenue - t.expense) : t.expense;
      currentBalance += impact;
      return { ...t, runningBalance: currentBalance };
    });
  }, [selectedAccount, transactions, sortConfig]);

  const soldeRestantReel = useMemo(() => {
    if (processedTransactions.length === 0) return selectedAccount?.initialBalance || 0;
    return (processedTransactions[processedTransactions.length - 1] as any).runningBalance;
  }, [processedTransactions, selectedAccount]);

  const pointCValue = useMemo(() => {
    const lastC = [...processedTransactions].reverse().find(t => t.reconciliation === ReconciliationMarker.C);
    return lastC ? (lastC as any).runningBalance : (selectedAccount?.initialBalance || 0);
  }, [processedTransactions, selectedAccount]);

  const calculateRemainingRecurring = (accId: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return recurring
      .filter(rec => !rec.isPaused && String(rec.sourceAccountId) === String(accId))
      .reduce((sum, rec) => {
        const hasPassed = transactions.some(t => {
          const tDate = new Date(t.date);
          return tDate.getMonth() === currentMonth && 
                 tDate.getFullYear() === currentYear &&
                 String(t.sourceAccountId) === String(rec.sourceAccountId) &&
                 (Math.abs(t.expense - rec.amount) < 0.01 || Math.abs(t.revenue - rec.amount) < 0.01) &&
                 t.description.toLowerCase().includes(rec.description.toLowerCase());
        });
        return hasPassed ? sum : sum + rec.amount;
      }, 0);
  };

  const resteAPasserCeMois = useMemo(() => {
    if (!selectedAccount) return 0;
    return calculateRemainingRecurring(selectedAccount.id);
  }, [selectedAccount, transactions, recurring]);

  const handleBulkReconcile = (marker: ReconciliationMarker) => {
    processedTransactions.forEach(t => {
        updateTransaction({ ...t, reconciliation: marker });
    });
    notify(`⚡ Toutes les transactions affichées sont passées en statut : ${marker === ReconciliationMarker.GREEN_CHECK ? '✅' : marker}`);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    if (showForm === 'add') {
      addAccount({ ...formData as BankAccount, id: Date.now().toString() });
    } else if (showForm === 'edit' && editingAccount) {
      updateAccount({ ...editingAccount, ...formData } as BankAccount);
    }
    setShowForm(null);
    setEditingAccount(null);
  };

  const handleUpdateReconciliation = (t: Transaction, marker: ReconciliationMarker) => {
    updateTransaction({ ...t, reconciliation: marker });
  };

  const handleOpenTransactionForm = () => {
    const sourceId = selectedAccountId || (accounts.find(a => a.isPrincipal)?.id || '');
    setTFormData({
      date: new Date().toISOString().split('T')[0],
      type: TransactionType.EXPENSE,
      sourceAccountId: sourceId,
      destinationAccountId: '',
      targetGoalId: '',
      categoryId: '',
      subCategory: '',
      description: '',
      amount: 0,
      paymentMethod: 'Virement',
      chequeNumber: '',
      reconciliation: ReconciliationMarker.NONE
    });
    setDisplayTAmount("");
    setShowTransactionForm(true);
  };

  const handleTAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace('.', ',');
    if (/^[0-9]*,?[0-9]*$/.test(val)) {
      setDisplayTAmount(val);
      const numericVal = parseFloat(val.replace(',', '.'));
      setTFormData({ ...tFormData, amount: isNaN(numericVal) ? 0 : numericVal });
    }
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tFormData.sourceAccountId || !tFormData.amount) return;

    let finalPaymentMethod = tFormData.paymentMethod;
    if (tFormData.paymentMethod === 'Chèque' && tFormData.chequeNumber) {
      finalPaymentMethod = `Chèque n°${tFormData.chequeNumber}`;
    }

    const isTransfer = tFormData.type === TransactionType.TRANSFER;
    const isGoalDeposit = tFormData.type === TransactionType.GOAL_DEPOSIT;
    const targetGoal = goals.find(g => String(g.id) === String(tFormData.targetGoalId));

    const tData: Transaction = {
      id: Date.now().toString(),
      date: tFormData.date,
      type: tFormData.type,
      sourceAccountId: tFormData.sourceAccountId,
      destinationAccountId: (isTransfer || isGoalDeposit) ? tFormData.destinationAccountId : undefined,
      categoryId: tFormData.categoryId,
      subCategory: tFormData.subCategory,
      description: isGoalDeposit ? `Épargne Objectif : ${targetGoal?.name || ''}` : tFormData.description,
      revenue: tFormData.type === TransactionType.REVENUE ? tFormData.amount : 0,
      expense: (tFormData.type === TransactionType.EXPENSE || isTransfer || isGoalDeposit) ? tFormData.amount : 0,
      paymentMethod: finalPaymentMethod,
      reconciliation: tFormData.reconciliation
    };

    addTransaction(tData);

    if (isGoalDeposit && tFormData.targetGoalId) {
      if (targetGoal) updateGoal({ ...targetGoal, currentAmount: targetGoal.currentAmount + tFormData.amount });
    }

    setShowTransactionForm(false);
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const selectedTCategory = categories.find((c: any) => String(c.id) === String(tFormData.categoryId));

  const openAccountEdit = (acc: BankAccount) => {
    setEditingAccount(acc);
    setFormData({ ...acc });
    setDisplayInitialBalance(acc.initialBalance.toString().replace('.', ','));
    setShowForm('edit');
  };

  return (
    <div className="space-y-6 pb-20">
      {!selectedAccountId ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Mes Comptes</h2>
            <button 
              onClick={() => { 
                setEditingAccount(null); 
                setFormData({ name: '', icon: '🏦', color: '#6366f1', initialBalance: 0, isPrincipal: false, bankBalanceManual: 0, cardOutstandingManual: 0 }); 
                setDisplayInitialBalance("");
                setShowForm('add'); 
              }} 
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-2xl shadow-xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center"
            >
              <Plus size={18} className="mr-2" /> Nouveau Compte
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((acc: any) => {
              const realBalance = calculateRealBalance(acc);
              return (
                <div key={acc.id} onClick={() => setSelectedAccountId(acc.id)} className="group relative cursor-pointer bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: acc.color + '15', color: acc.color }}>{acc.icon}</div>
                    {acc.isPrincipal && <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black rounded-xl uppercase tracking-widest">Principal</span>}
                  </div>
                  <h3 className="font-black text-slate-800 text-xl tracking-tight uppercase">{acc.name}</h3>
                  <p className={`text-3xl font-black mt-2 tracking-tighter ${realBalance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {realBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Banque: {acc.bankBalanceManual?.toLocaleString('fr-FR') || 0}€</span>
                    <span>En-cours: {acc.cardOutstandingManual?.toLocaleString('fr-FR') || 0}€</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openAccountEdit(acc); }} 
                    className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all font-bold text-[10px] uppercase border border-slate-100 z-10"
                  >
                    <Edit2 size={12} className="inline mr-1" /> Modifier
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="animate-in slide-in-from-right duration-500 space-y-8">
           <div className="flex items-center justify-between">
              <button onClick={() => setSelectedAccountId(null)} className="text-[10px] font-black text-slate-400 hover:text-blue-500 flex items-center bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 uppercase tracking-widest transition-all">
                ← Retour
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4 bg-white px-8 py-4 rounded-2xl border border-slate-100 shadow-sm relative">
                  <span className="text-2xl">{selectedAccount?.icon}</span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{selectedAccount?.name}</h2>
                  <button 
                      onClick={() => openAccountEdit(selectedAccount!)} 
                      className="p-2 ml-4 text-slate-300 hover:text-blue-500 transition-colors"
                      title="Modifier ce compte"
                  >
                      <Edit2 size={16} />
                  </button>
                </div>
                
                {selectedAccount?.isPrincipal && (
                  <button 
                    onClick={handleOpenTransactionForm}
                    className="px-8 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[1.5rem] shadow-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 active:scale-95 transition-all flex items-center border border-white/20"
                  >
                    <Plus size={18} className="mr-3" /> Saisie Rapide
                  </button>
                )}
              </div>
           </div>

           <div className="w-full">
              {selectedAccount?.isPrincipal ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* ENCADRÉ GAUCHE : BANQUE VS APPLI (Réorganisé verticalement) */}
                  <div className="lg:col-span-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-pink-500 p-8 rounded-[3rem] shadow-2xl border border-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-8 items-start relative z-10">
                      {/* COLONNE 1 : SOLDE */}
                      <div className="space-y-10">
                        <StatItem 
                          label="Solde Banque" 
                          value={selectedAccount?.bankBalanceManual || 0} 
                          isManual 
                          onManualChange={(val) => {
                            if (selectedAccount) updateAccount({...selectedAccount, bankBalanceManual: val});
                          }} 
                          isInGradient 
                        />
                        <StatItem 
                          label="Solde Appli" 
                          value={pointCValue + totalCardsOutstandingApp} 
                          highlight="blue" 
                          isInGradient 
                        />
                      </div>
                      
                      {/* COLONNE 2 : EN-COURS CARTE */}
                      <div className="space-y-10">
                        <StatItem 
                          label="En-cours carte banque" 
                          value={selectedAccount?.cardOutstandingManual || 0} 
                          isManual 
                          onManualChange={(val) => {
                            if (selectedAccount) updateAccount({...selectedAccount, cardOutstandingManual: val});
                          }} 
                          isInGradient 
                        />
                        <StatItem 
                          label="En-cours carte appli" 
                          value={totalCardsOutstandingApp} 
                          highlight="rose" 
                          isInGradient 
                        />
                      </div>
                      
                      {/* COLONNE 3 : COMPARAISON */}
                      <div className="space-y-10">
                        <StatItem 
                          label="Différence banque" 
                          value={(selectedAccount?.bankBalanceManual || 0) - (selectedAccount?.cardOutstandingManual || 0)} 
                          highlight={ ((selectedAccount?.bankBalanceManual || 0) - (selectedAccount?.cardOutstandingManual || 0)) < 0 ? 'rose' : 'emerald' } 
                          isInGradient 
                        />
                        <StatItem 
                          label="Pointé (C)" 
                          value={pointCValue} 
                          highlight="blue" 
                          isInGradient 
                        />
                      </div>
                    </div>
                  </div>

                  {/* ENCADRÉ DROITE : SOLDE RESTANT RÉEL & PRÉVISIONNEL */}
                  <div className="lg:col-span-4 bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-600 p-8 rounded-[3rem] shadow-2xl border border-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    <div className="flex flex-col justify-between h-full space-y-10 relative z-10">
                      <StatItem label="Solde restant réel" value={soldeRestantReel} isInGradient large />
                      <div className="grid grid-cols-2 gap-4">
                        <StatItem label="Reste à passer" value={resteAPasserCeMois} highlight="rose" isInGradient />
                        <StatItem label="Reste à vivre" value={soldeRestantReel - resteAPasserCeMois} highlight="emerald" isInGradient />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-blue-600 to-pink-500 p-10 px-14 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/10 inline-block">
                   <StatItem label="SOLDE RÉEL" value={calculateRealBalance(selectedAccount!)} isInGradient large />
                </div>
              )}
           </div>

           <div className="relative group/table">
              {/* BOUTONS DE NAVIGATION VIOLETS */}
              <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-center space-y-4 opacity-0 group-hover/table:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={scrollToTop}
                  className="p-3 bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-700 hover:scale-110 active:scale-95 transition-all"
                  title="Retourner vers le haut"
                >
                  <ChevronUp size={20} strokeWidth={3} />
                </button>
                <button 
                  onClick={scrollToBottom}
                  className="p-3 bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-700 hover:scale-110 active:scale-95 transition-all"
                  title="Descendre vers le bas"
                >
                  <ChevronDown size={20} strokeWidth={3} />
                </button>
              </div>

              <div 
                ref={tableContainerRef}
                className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden mt-8 max-h-[600px] overflow-y-auto custom-table-scroll relative"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] relative border-collapse min-w-[1200px]">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-black tracking-widest border-b border-slate-100 sticky top-0 z-20 shadow-sm">
                      <tr>
                        <SortHeader label="Date" active={sortConfig.key === 'date'} onClick={() => requestSort('date')} className="py-3 px-6" />
                        <SortHeader label="Catégories" active={sortConfig.key === 'categoryId'} onClick={() => requestSort('categoryId')} className="py-3 px-6" />
                        <SortHeader label="Sous catégories" active={sortConfig.key === 'subCategory'} onClick={() => requestSort('subCategory')} className="py-3 px-6" />
                        <SortHeader label="Descriptifs" active={sortConfig.key === 'description'} onClick={() => requestSort('description')} className="py-3 px-6" />
                        <SortHeader label="Moyen de paiement" active={sortConfig.key === 'paymentMethod'} onClick={() => requestSort('paymentMethod')} className="min-w-[180px] px-8 py-3" />
                        <SortHeader label="Revenus" className="text-right py-3" active={sortConfig.key === 'revenue'} onClick={() => requestSort('revenue')} />
                        <SortHeader label="Dépenses" className="text-right py-3" active={sortConfig.key === 'expense'} onClick={() => requestSort('expense')} />
                        <SortHeader label="Solde restant" className="text-right py-3" active={sortConfig.key === 'runningBalance'} onClick={() => requestSort('runningBalance')} />
                        <th className="px-6 py-2 border-b text-center">
                          <div className="flex flex-col items-center space-y-1">
                              <span className="flex items-center space-x-1 justify-center whitespace-nowrap text-[9px]">
                                  <span>Pointage</span>
                                  <ArrowUpDown size={8} className={sortConfig.key === 'reconciliation' ? 'text-blue-500' : 'text-slate-300'} onClick={() => requestSort('reconciliation')} />
                              </span>
                              <div className="flex items-center space-x-1">
                                  <button 
                                      onClick={() => handleBulkReconcile(ReconciliationMarker.GREEN_CHECK)} 
                                      title="Tout valider (✅)"
                                      className="p-1 bg-emerald-100 text-emerald-600 rounded-md hover:bg-emerald-200 transition-all"
                                  >
                                      <Check size={10} strokeWidth={4} />
                                  </button>
                                  <button 
                                      onClick={() => handleBulkReconcile(ReconciliationMarker.NONE)} 
                                      title="Tout réinitialiser (-)"
                                      className="p-1 bg-slate-100 text-slate-400 rounded-md hover:bg-slate-200 transition-all"
                                  >
                                      <RotateCcw size={10} strokeWidth={4} />
                                  </button>
                              </div>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedTransactions.map((t) => {
                        const cat = categories.find((c: any) => String(c.id) === String(t.categoryId));
                        return (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-5 whitespace-nowrap text-slate-400 font-bold">{formatDateDisplay(t.date)}</td>
                            <td className="px-6 py-5 font-black text-slate-700 uppercase tracking-tighter whitespace-nowrap">
                              <span className="mr-2 text-base">{cat?.icon}</span>{cat?.name || 'Virement'}
                            </td>
                            <td className="px-6 py-5 text-slate-400 uppercase font-medium whitespace-nowrap">{t.subCategory || '-'}</td>
                            <td className="px-6 py-5 text-slate-600 font-bold truncate max-w-[180px]">{t.description}</td>
                            <td className="px-8 py-5 whitespace-nowrap">
                               <div className="flex">
                                 <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg font-black uppercase text-[9px] tracking-tight shadow-sm border border-slate-200/50">
                                   {t.paymentMethod}
                                 </span>
                               </div>
                            </td>
                            <td className="px-6 py-5 text-right font-black text-emerald-500 text-sm whitespace-nowrap">
                              {t.revenue > 0 ? `+${t.revenue.toFixed(2)}€` : '-'}
                            </td>
                            <td className="px-6 py-5 text-right font-black text-rose-500 text-sm whitespace-nowrap">
                              {t.expense > 0 ? `-${t.expense.toFixed(2)}€` : '-'}
                            </td>
                            <td className={`px-6 py-5 text-right font-black bg-slate-50/20 ${t.runningBalance < 0 ? 'text-rose-600' : 'text-slate-900'} text-sm whitespace-nowrap`}>
                              {(t as any).runningBalance.toFixed(2)}€
                            </td>
                            <td className="px-6 py-5 text-center">
                              <select 
                                  className={`text-[9px] font-black border-2 border-slate-200 rounded-xl px-3 py-1.5 bg-white outline-none cursor-pointer focus:ring-0 text-slate-900 transition-all hover:border-blue-300`}
                                  value={t.reconciliation}
                                  onChange={(e) => handleUpdateReconciliation(t, e.target.value as ReconciliationMarker)}
                                >
                                  <option value={ReconciliationMarker.NONE}>-</option>
                                  <option value={ReconciliationMarker.GREEN_CHECK}>✅ Check</option>
                                  <option value={ReconciliationMarker.G}>G</option>
                                  <option value={ReconciliationMarker.G2}>G2</option>
                                  <option value={ReconciliationMarker.D}>D</option>
                                  <option value={ReconciliationMarker.D2}>D2</option>
                                  <option value={ReconciliationMarker.C}>C</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
           </div>
        </div>
      )}

      {showTransactionForm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 shadow-2xl animate-in zoom-in duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Saisie Rapide : {selectedAccount?.name}</h3>
              <button onClick={() => setShowTransactionForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSaveTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                <input type="date" required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold" value={tFormData.date} onChange={e => setTFormData({...tFormData, date: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                <select className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold" value={tFormData.type} onChange={e => setTFormData({...tFormData, type: e.target.value as TransactionType, categoryId: '', subCategory: ''})}>
                  <option value={TransactionType.EXPENSE}>Dépense</option>
                  <option value={TransactionType.REVENUE}>Revenu</option>
                  <option value={TransactionType.TRANSFER}>Transfert</option>
                  <option value={TransactionType.GOAL_DEPOSIT}>Vers objectif 🎯</option>
                </select>
              </div>

              {tFormData.type === TransactionType.GOAL_DEPOSIT && (
                <div className="md:col-span-2 space-y-1 animate-in slide-in-from-top duration-200">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objectif cible 🎯</label>
                  <select required className="w-full px-5 py-4 bg-blue-50 border-2 border-blue-100 rounded-2xl outline-none font-black uppercase" value={tFormData.targetGoalId} onChange={e => setTFormData({...tFormData, targetGoalId: e.target.value})}>
                    <option value="">Sélectionner l'objectif...</option>
                    {goals.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compte Source</label>
                <input type="text" disabled className="w-full px-5 py-4 bg-slate-100 border-2 border-transparent rounded-2xl font-bold uppercase" value={selectedAccount?.name || accounts.find(a => a.id === tFormData.sourceAccountId)?.name || ''} />
              </div>

              {(tFormData.type === TransactionType.TRANSFER || tFormData.type === TransactionType.GOAL_DEPOSIT) ? (
                <div className="space-y-1 animate-in slide-in-from-top duration-200">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compte Destinataire</label>
                  <select required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold uppercase" value={tFormData.destinationAccountId} onChange={e => setTFormData({...tFormData, destinationAccountId: e.target.value})}>
                    <option value="">Sélectionner...</option>
                    {accounts.map((a:any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="hidden md:block" />
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode de paiement</label>
                <select className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold uppercase" value={tFormData.paymentMethod} onChange={e => setTFormData({...tFormData, paymentMethod: e.target.value})}>
                  <option value="Virement">Virement</option>
                  <option value="Prélèvement">Prélèvement</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Chèque">Chèque</option>
                  {cards.map(c => (
                    <option key={c.id} value={`Carte: ${c.name}`}>Carte: {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant (€)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  required 
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black outline-none" 
                  value={displayTAmount} 
                  onChange={handleTAmountChange}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold uppercase" 
                  value={tFormData.categoryId} 
                  onChange={e => setTFormData({...tFormData, categoryId: e.target.value, subCategory: ''})}
                >
                  <option value="">Sélectionner...</option>
                  {categories.filter(c => c.type === (tFormData.type === TransactionType.REVENUE ? 'REVENUE' : 'EXPENSE')).map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sous-catégorie</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold uppercase disabled:opacity-50" 
                  value={tFormData.subCategory} 
                  onChange={e => setTFormData({...tFormData, subCategory: e.target.value})}
                  disabled={!selectedTCategory}
                >
                  <option value="">Aucune</option>
                  {selectedTCategory?.subCategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Libellé / Mémo (Description)</label>
                <textarea className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl h-20 focus:border-blue-500 outline-none font-bold" value={tFormData.description} onChange={e => setTFormData({...tFormData, description: e.target.value})} placeholder="ex: Courses hebdomadaires" />
              </div>

              <div className="md:col-span-2 flex space-x-4 pt-6">
                <button type="button" onClick={() => setShowTransactionForm(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest border border-slate-100 rounded-2xl">Annuler</button>
                <button type="submit" className="flex-1 py-4 font-bold bg-slate-900 text-white rounded-2xl shadow-xl uppercase text-[10px] tracking-widest">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-sm p-10 shadow-2xl animate-in zoom-in duration-200 flex flex-col relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{showForm === 'add' ? 'Nouveau Compte' : 'Configuration Compte'}</h3>
              <button onClick={() => { setShowForm(null); setEditingAccount(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSaveAccount} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom du compte</label>
                <input type="text" required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold transition-all uppercase" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="ex: Compte Courant" />
              </div>
              
              <IconPicker value={formData.icon || '🏦'} onChange={(icon) => setFormData({ ...formData, icon })} />
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Couleur</label>
                  <input type="color" className="w-full h-14 p-1 bg-slate-50 border-2 border-transparent rounded-2xl outline-none" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solde Initial (€)</label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    required 
                    className="w-full px-6 py-4 h-14 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-black" 
                    value={displayInitialBalance} 
                    onChange={e => {
                      let val = e.target.value.replace('.', ',');
                      if (/^[0-9]*,?[0-9]*$/.test(val)) {
                        setDisplayInitialBalance(val);
                        const numericVal = parseFloat(val.replace(',', '.'));
                        setFormData({ ...formData, initialBalance: isNaN(numericVal) ? 0 : numericVal });
                      }
                    }} 
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input type="checkbox" id="isPrincipal" checked={formData.isPrincipal} onChange={e => setFormData({ ...formData, isPrincipal: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="isPrincipal" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Définir comme compte principal</label>
              </div>
              
              <div className="flex space-x-4 mt-8">
                <button type="button" onClick={() => { setShowForm(null); setEditingAccount(null); }} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all">Annuler</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-transform">Enregistrer</button>
              </div>
            </form>

            {showForm === 'edit' && editingAccount && (
              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center">
                <button 
                  type="button" 
                  onClick={() => { confirmDelete(editingAccount, 'account'); setShowForm(null); }}
                  className="w-full py-4 bg-rose-50 text-rose-500 hover:bg-rose-100 font-black rounded-2xl uppercase text-[10px] tracking-widest border border-rose-100 flex items-center justify-center transition-all active:scale-95 shadow-sm"
                >
                  <Trash2 size={16} className="mr-2" /> Supprimer ce compte
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StatItem: React.FC<{ label: string, value: number, isManual?: boolean, highlight?: string, onManualChange?: (v: number) => void, isInGradient?: boolean, large?: boolean }> = ({ label, value, isManual, highlight, onManualChange, isInGradient, large }) => {
  const [displayText, setDisplayText] = useState(value.toString().replace('.', ','));

  // S'assure que l'affichage est mis à jour si la valeur change (pour les calculs automatiques)
  useEffect(() => {
    if (!isManual) {
      setDisplayText(value.toLocaleString('fr-FR', { minimumFractionDigits: 2 }));
    }
  }, [value, isManual]);

  const highlights: Record<string, string> = {
    blue: isInGradient ? 'text-blue-50' : 'text-blue-600',
    rose: isInGradient ? 'text-white drop-shadow-sm' : 'text-rose-600',
    emerald: isInGradient ? 'text-emerald-300' : 'text-emerald-600',
    amber: isInGradient ? 'text-amber-200' : 'text-amber-600',
    slate: isInGradient ? 'text-white' : 'text-slate-900'
  };

  const effectiveHighlight = value < 0 ? 'rose' : (highlight || 'slate');
  const labelColor = isInGradient ? 'text-white/70' : 'text-slate-400';
  const borderClass = isInGradient ? 'border-white/20 focus-within:border-white' : 'border-slate-100 focus-within:border-blue-400';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace('.', ',');
    if (/^[0-9]*,?[0-9]*$/.test(val)) {
      setDisplayText(val);
      const numericVal = parseFloat(val.replace(',', '.'));
      onManualChange?.(isNaN(numericVal) ? 0 : numericVal);
    }
  };

  return (
    <div className="flex flex-col space-y-1.5 min-w-0">
      <p className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none truncate ${labelColor}`}>{label}</p>
      {isManual ? (
        <div className={`flex items-center border-b transition-all pb-1 ${borderClass}`}>
          <input 
            type="text" 
            inputMode="decimal"
            className={`w-full bg-transparent border-none p-0 text-lg font-black focus:ring-0 transition-all ${highlights[effectiveHighlight]}`}
            value={displayText}
            onChange={handleChange}
          />
          <span className={`${isInGradient ? 'text-white/40' : 'text-slate-300'} font-black ml-1 text-sm`}>€</span>
        </div>
      ) : (
        <p className={`${large ? 'text-4xl' : 'text-xl'} font-black tracking-tighter truncate ${highlights[effectiveHighlight]}`}>
          {isManual ? displayText : value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
        </p>
      )}
    </div>
  );
};

const SortHeader: React.FC<{ label: string, active?: boolean, onClick: () => void, className?: string }> = ({ label, active, onClick, className }) => (
  <th className={`cursor-pointer hover:bg-slate-100/50 transition-all border-b ${className || ''}`} onClick={onClick}>
    <div className={`flex items-center space-x-1 ${className?.includes('right') ? 'justify-end' : className?.includes('center') ? 'justify-center' : ''}`}>
      <span className="whitespace-nowrap">{label}</span>
      <ArrowUpDown size={10} className={active ? 'text-blue-500' : 'text-slate-300'} />
    </div>
  </th>
);

export default Accounts;
