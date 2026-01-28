
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { BankAccount, Transaction, ReconciliationMarker, TransactionType, Frequency, AppContextType } from '../types';
import { Plus, Trash2, Edit2, X, Info, ArrowRight, ArrowUpDown, Target, Repeat, Wallet, CreditCard, Check, Clock } from 'lucide-react';
import IconPicker from './IconPicker';

const Accounts: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const { accounts, transactions, recurring, categories, goals, addAccount, confirmDelete, updateAccount, updateTransaction, addTransaction, updateGoal } = context;
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<'add' | 'edit' | null>(null);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  
  const [displayInitialBalance, setDisplayInitialBalance] = useState("");
  const [displayTAmount, setDisplayTAmount] = useState("");
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'reconciliation', direction: 'asc' });

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
                 (t.expense === rec.amount || t.revenue === rec.amount) &&
                 t.description.toLowerCase().includes(rec.description.toLowerCase());
        });
        return hasPassed ? sum : sum + rec.amount;
      }, 0);
  };

  const selectedAccount = useMemo(() => 
    accounts.find((a: BankAccount) => String(a.id) === String(selectedAccountId)),
    [accounts, selectedAccountId]
  );

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

  const reconOrder = [
    ReconciliationMarker.GREEN_CHECK,
    ReconciliationMarker.G,
    ReconciliationMarker.G2,
    ReconciliationMarker.D,
    ReconciliationMarker.D2,
    ReconciliationMarker.C,
    ReconciliationMarker.NONE
  ];

  const processedTransactions = useMemo(() => {
    if (!selectedAccount) return [];
    
    let filtered = transactions.filter((t: Transaction) => 
      String(t.sourceAccountId) === String(selectedAccount.id) || 
      String(t.destinationAccountId) === String(selectedAccount.id)
    );

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
      
      return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
    });

    let currentBalance = selectedAccount.initialBalance;
    return sorted.map(t => {
      const isSource = String(t.sourceAccountId) === String(selectedAccount.id);
      const impact = isSource ? (t.revenue - t.expense) : t.expense;
      currentBalance += impact;
      return { ...t, runningBalance: currentBalance };
    });
  }, [selectedAccount, transactions, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const selectedTCategory = categories.find((c: any) => String(c.id) === String(tFormData.categoryId));

  return (
    <div className="space-y-6">
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
                    onClick={(e) => { e.stopPropagation(); setEditingAccount(acc); setFormData({ ...acc }); setDisplayInitialBalance(acc.initialBalance.toString().replace('.', ',')); setShowForm('edit'); }} 
                    className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all font-bold text-[10px] uppercase border border-slate-100"
                  >
                    <Edit2 size={12} className="inline mr-1" /> Modifier
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="animate-in slide-in-from-right duration-500 space-y-6">
           <div className="flex items-center justify-between">
              <button onClick={() => setSelectedAccountId(null)} className="text-[10px] font-black text-slate-400 hover:text-blue-500 flex items-center bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-100 uppercase tracking-widest transition-all">
                ← Retour
              </button>
              <div className="flex items-center space-x-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-2xl">{selectedAccount?.icon}</span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{selectedAccount?.name}</h2>
              </div>
           </div>

           {selectedAccount?.isPrincipal && (
             <div className="flex justify-end animate-in zoom-in duration-300">
               <button 
                onClick={handleOpenTransactionForm}
                className="px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[2rem] shadow-2xl font-black uppercase text-xs tracking-[0.2em] hover:scale-105 active:scale-95 transition-all flex items-center border border-white/20"
               >
                 <Plus size={20} className="mr-3" /> Saisir une Opération Rapide
               </button>
             </div>
           )}

           {selectedAccount?.isPrincipal ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-pink-500 p-8 rounded-[2.5rem] shadow-2xl grid grid-cols-2 gap-6 relative overflow-hidden border border-white/10">
                  <StatItem label="Solde Compte bancaire" value={selectedAccount?.bankBalanceManual || 0} isManual onManualChange={(val) => updateAccount({...selectedAccount!, bankBalanceManual: val})} isInGradient />
                  <StatItem label="Encourt carte" value={selectedAccount?.cardOutstandingManual || 0} isManual onManualChange={(val) => updateAccount({...selectedAccount!, cardOutstandingManual: val})} isInGradient />
                  <StatItem label="Différence" value={(selectedAccount?.bankBalanceManual || 0) - (selectedAccount?.cardOutstandingManual || 0)} highlight={ ((selectedAccount?.bankBalanceManual || 0) - (selectedAccount?.cardOutstandingManual || 0)) < 0 ? 'rose' : 'emerald' } isInGradient />
                  <StatItem label="Solde Compte (Pointé C)" value={processedTransactions.find(t => t.reconciliation === ReconciliationMarker.C) ? (processedTransactions.find(t => t.reconciliation === ReconciliationMarker.C) as any).runningBalance : selectedAccount?.initialBalance || 0} highlight="blue" isInGradient />
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-pink-500 p-8 rounded-[2.5rem] shadow-2xl grid grid-cols-3 gap-6 relative overflow-hidden border border-white/10">
                  <StatItem label="Solde Réel" value={calculateRealBalance(selectedAccount!)} isInGradient />
                  <StatItem label="Reste à passer (Rec)" value={calculateRemainingRecurring(selectedAccount!.id)} highlight="rose" isInGradient />
                  <StatItem label="Budget restant" value={calculateRealBalance(selectedAccount!) - calculateRemainingRecurring(selectedAccount!.id)} highlight="emerald" isInGradient />
                </div>
             </div>
           ) : (
             <div className="flex justify-start">
                <div className="bg-gradient-to-br from-blue-600 to-pink-500 p-8 px-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/10">
                   <StatItem label="SOLDE RÉEL" value={calculateRealBalance(selectedAccount!)} isInGradient />
                </div>
             </div>
           )}

           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-black tracking-widest">
                    <tr>
                      <SortHeader label="Date" active={sortConfig.key === 'date'} onClick={() => requestSort('date')} />
                      <SortHeader label="Catégories" active={sortConfig.key === 'categoryId'} onClick={() => requestSort('categoryId')} />
                      <SortHeader label="Sous catégories" active={sortConfig.key === 'subCategory'} onClick={() => requestSort('subCategory')} />
                      <SortHeader label="Descriptifs" active={sortConfig.key === 'description'} onClick={() => requestSort('description')} />
                      <SortHeader label="Moyen de paiement" active={sortConfig.key === 'paymentMethod'} onClick={() => requestSort('paymentMethod')} />
                      <SortHeader label="Revenus" className="text-right" active={sortConfig.key === 'revenue'} onClick={() => requestSort('revenue')} />
                      <SortHeader label="Dépenses" className="text-right" active={sortConfig.key === 'expense'} onClick={() => requestSort('expense')} />
                      <SortHeader label="Solde restant" className="text-right" active={sortConfig.key === 'runningBalance'} onClick={() => requestSort('runningBalance')} />
                      <SortHeader label="Rapprochement" className="text-center" active={sortConfig.key === 'reconciliation'} onClick={() => requestSort('reconciliation')} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedTransactions.map((t) => {
                      const cat = categories.find((c: any) => String(c.id) === String(t.categoryId));
                      return (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-bold">{formatDateDisplay(t.date)}</td>
                          <td className="px-6 py-4 font-black text-slate-700 uppercase tracking-tighter">
                            <span className="mr-2">{cat?.icon}</span>{cat?.name || 'Virement'}
                          </td>
                          <td className="px-6 py-4 text-slate-400 uppercase font-medium">{t.subCategory || '-'}</td>
                          <td className="px-6 py-4 text-slate-600 font-bold truncate max-w-[150px]">{t.description}</td>
                          <td className="px-6 py-4">
                             <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg font-black uppercase tracking-tighter">{t.paymentMethod}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-emerald-500">
                            {t.revenue > 0 ? `+${t.revenue.toFixed(2)}€` : '-'}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-rose-500">
                            {t.expense > 0 ? `-${t.expense.toFixed(2)}€` : '-'}
                          </td>
                          <td className={`px-6 py-4 text-right font-black bg-slate-50/30 ${t.runningBalance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {(t as any).runningBalance.toFixed(2)}€
                          </td>
                          <td className="px-6 py-4 text-center">
                            <select 
                                className={`text-[10px] font-black border-2 border-slate-400 rounded-xl px-3 py-1 bg-white outline-none cursor-pointer focus:ring-0 text-slate-900 transition-all`}
                                value={t.reconciliation}
                                onChange={(e) => handleUpdateReconciliation(t, e.target.value as ReconciliationMarker)}
                              >
                                <option value={ReconciliationMarker.NONE} className="text-slate-900 font-black">-</option>
                                <option value={ReconciliationMarker.GREEN_CHECK} className="text-emerald-600 font-black">✅ Check</option>
                                <option value={ReconciliationMarker.G} className="text-slate-900 font-black">G</option>
                                <option value={ReconciliationMarker.G2} className="text-slate-900 font-black">G2</option>
                                <option value={ReconciliationMarker.D} className="text-slate-900 font-black">D</option>
                                <option value={ReconciliationMarker.D2} className="text-slate-900 font-black">D2</option>
                                <option value={ReconciliationMarker.C} className="text-slate-900 font-black">C</option>
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
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
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

              {tFormData.paymentMethod === 'Chèque' && (
                <div className="md:col-span-2 space-y-1 animate-in slide-in-from-top duration-200">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Numéro du chèque</label>
                  <input 
                    type="text" 
                    placeholder="N° du chèque"
                    className="w-full px-5 py-4 bg-blue-50 border-2 border-blue-100 rounded-2xl outline-none font-black placeholder:text-slate-300"
                    value={tFormData.chequeNumber}
                    onChange={e => setTFormData({...tFormData, chequeNumber: e.target.value})}
                  />
                </div>
              )}

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

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rapprochement</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                  {Object.values(ReconciliationMarker).map((m) => (
                    <button key={m} type="button" onClick={() => setTFormData({...tFormData, reconciliation: m})} className={`py-2 rounded-xl border-2 text-[10px] font-black transition-all ${tFormData.reconciliation === m ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                      {m === ReconciliationMarker.GREEN_CHECK ? 'Check' : m === ReconciliationMarker.NONE ? '-' : m}
                    </button>
                  ))}
                </div>
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
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-200 flex flex-col relative border border-slate-100 max-h-[90vh] overflow-y-auto">
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

const StatItem: React.FC<{ label: string, value: number, isManual?: boolean, highlight?: string, onManualChange?: (v: number) => void, isInGradient?: boolean }> = ({ label, value, isManual, highlight, onManualChange, isInGradient }) => {
  const [displayText, setDisplayText] = useState(value === 0 ? "" : value.toString().replace('.', ','));

  const highlights: Record<string, string> = {
    blue: isInGradient ? 'text-blue-100/90' : 'text-blue-600',
    rose: isInGradient ? 'text-red-200 drop-shadow-sm font-black' : 'text-rose-600',
    emerald: isInGradient ? 'text-emerald-300' : 'text-emerald-600',
    amber: isInGradient ? 'text-amber-200' : 'text-amber-600',
    slate: isInGradient ? 'text-white' : 'text-slate-900'
  };

  const effectiveHighlight = value < 0 ? 'rose' : (highlight || 'slate');
  const labelColor = isInGradient ? 'text-white/70' : 'text-slate-400';
  const borderClass = isInGradient ? 'border-white/30 focus-within:border-white' : 'border-slate-100 focus-within:border-blue-400';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace('.', ',');
    if (/^[0-9]*,?[0-9]*$/.test(val)) {
      setDisplayText(val);
      const numericVal = parseFloat(val.replace(',', '.'));
      onManualChange?.(isNaN(numericVal) ? 0 : numericVal);
    }
  };

  return (
    <div className="flex flex-col space-y-1">
      <p className={`text-[9px] font-black uppercase tracking-widest leading-tight ${labelColor}`}>{label}</p>
      {isManual ? (
        <div className={`flex items-center border-b-2 transition-all ${borderClass}`}>
          <input 
            type="text" 
            inputMode="decimal"
            className={`w-full bg-transparent border-none p-0 text-lg font-black focus:ring-0 transition-all ${highlights[effectiveHighlight]}`}
            value={displayText}
            onChange={handleChange}
          />
          <span className={`${isInGradient ? 'text-white/50' : 'text-slate-300'} font-bold ml-1`}>€</span>
        </div>
      ) : (
        <p className={`text-xl font-black tracking-tighter ${highlights[effectiveHighlight]}`}>
          {value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
        </p>
      )}
    </div>
  );
};

const SortHeader: React.FC<{ label: string, active?: boolean, onClick: () => void, className?: string }> = ({ label, active, onClick, className }) => (
  <th className={`px-6 py-5 border-b cursor-pointer hover:bg-slate-100/50 transition-all ${className || ''}`} onClick={onClick}>
    <div className={`flex items-center space-x-1 ${className?.includes('right') ? 'justify-end' : className?.includes('center') ? 'justify-center' : ''}`}>
      <span>{label}</span>
      <ArrowUpDown size={10} className={active ? 'text-blue-500' : 'text-slate-300'} />
    </div>
  </th>
);

export default Accounts;
