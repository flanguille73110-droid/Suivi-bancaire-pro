
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { AppContextType, RecurringTransaction, Frequency, TransactionType, ReconciliationMarker, Transaction } from '../types';
import { Plus, Repeat, Trash2, Edit2, Calendar, X, ArrowRight, Pause, Play, Target, Zap, Clock, ArrowUpDown } from 'lucide-react';

const Recurring: React.FC = () => {
  const context = useContext(AppContext) as any;
  const { recurring, accounts, transactions, categories, goals, addRecurring, confirmDelete, updateRecurring, addTransaction } = context;
  const [showForm, setShowForm] = useState<'add' | 'edit' | null>(null);
  const [editingRec, setEditingRec] = useState<RecurringTransaction | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'startDate', direction: 'asc' });
  
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    type: TransactionType.EXPENSE,
    frequency: Frequency.MONTHLY,
    sourceAccountId: accounts[0]?.id || '',
    destinationAccountId: '',
    targetGoalId: '',
    categoryId: '',
    subCategory: '',
    description: '',
    amount: 0,
    paymentMethod: 'Virement'
  });

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const activeRecurring = recurring.filter((r: any) => !r.isPaused);
  const pausedCount = recurring.filter((r: any) => r.isPaused).length;
  const totalMonthly = activeRecurring.reduce((sum: number, r: any) => sum + r.amount, 0);

  // Logique de tri
  const sortedRecurring = useMemo(() => {
    let sortableItems = [...recurring];
    if (sortConfig !== null) {
      sortableItems.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [recurring, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Calcul du montant restant à passer ce mois-ci (Exclut ce qui est déjà dans le journal)
  const totalRemainingThisMonth = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const tomorrow = new Date(currentYear, currentMonth, now.getDate() + 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

    return activeRecurring.reduce((sum: number, r: any) => {
      const start = new Date(r.startDate);
      const end = r.endDate ? new Date(r.endDate) : null;
      let occurrencesRemaining = 0;

      // Fonction utilitaire pour vérifier si l'occurrence a déjà une transaction correspondante dans le journal pour ce mois
      const isAlreadyPaidInJournal = (date: Date) => {
        return transactions.some((t: Transaction) => 
          String(t.sourceAccountId) === String(r.sourceAccountId) &&
          t.categoryId === r.categoryId &&
          Math.abs((t.expense || t.revenue) - r.amount) < 0.1 &&
          new Date(t.date).getMonth() === date.getMonth() &&
          new Date(t.date).getFullYear() === date.getFullYear()
        );
      };

      if (r.frequency === Frequency.MONTHLY) {
        const occurrenceThisMonth = new Date(currentYear, currentMonth, start.getDate());
        if (occurrenceThisMonth >= tomorrow && occurrenceThisMonth <= endOfMonth) {
          if (!end || occurrenceThisMonth <= end) {
             if (!isAlreadyPaidInJournal(occurrenceThisMonth)) occurrencesRemaining = 1;
          }
        }
      } else if (r.frequency === Frequency.WEEKLY) {
        let tempDate = new Date(start);
        while (tempDate <= endOfMonth) {
          if (tempDate >= tomorrow && tempDate <= endOfMonth) {
            if (!end || tempDate <= end) {
                // Pour l'hebdomadaire on est plus strict, mais ici on garde la logique mois/catégorie simplifiée ou on peut affiner
                if (!isAlreadyPaidInJournal(tempDate)) occurrencesRemaining++;
            }
          }
          tempDate.setDate(tempDate.getDate() + 7);
        }
      } else if (r.frequency === Frequency.DAILY) {
        let tempDate = new Date(tomorrow > start ? tomorrow : start);
        while (tempDate <= endOfMonth) {
          if (!end || tempDate <= end) {
             // Difficile pour le quotidien de checker les doublons sans ID unique d'occurrence, 
             // On garde la logique temporelle simple ou on check par date précise
             const alreadyOnThisDay = transactions.some((t: Transaction) => 
                String(t.sourceAccountId) === String(r.sourceAccountId) &&
                t.categoryId === r.categoryId &&
                Math.abs((t.expense || t.revenue) - r.amount) < 0.1 &&
                t.date === tempDate.toISOString().split('T')[0]
             );
             if (!alreadyOnThisDay) occurrencesRemaining++;
          }
          tempDate.setDate(tempDate.getDate() + 1);
        }
      } else if (r.frequency === Frequency.YEARLY) {
        const occurrenceThisYear = new Date(currentYear, start.getMonth(), start.getDate());
        if (occurrenceThisYear.getMonth() === currentMonth && occurrenceThisYear >= tomorrow && occurrenceThisYear <= endOfMonth) {
          if (!end || occurrenceThisYear <= end) {
             if (!isAlreadyPaidInJournal(occurrenceThisYear)) occurrencesRemaining = 1;
          }
        }
      }

      return sum + (occurrencesRemaining * r.amount);
    }, 0);
  }, [activeRecurring, transactions]);

  const frequencyLabels: Record<Frequency, string> = {
    [Frequency.DAILY]: 'J',
    [Frequency.WEEKLY]: 'S',
    [Frequency.MONTHLY]: 'M',
    [Frequency.YEARLY]: 'A'
  };

  const typeLabels: Record<TransactionType, string> = {
    [TransactionType.EXPENSE]: 'Dépense',
    [TransactionType.REVENUE]: 'Revenu',
    [TransactionType.TRANSFER]: 'Transfert',
    [TransactionType.GOAL_DEPOSIT]: 'Épargne 🎯'
  };

  const handleOpenAdd = () => {
    setFormData({
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      type: TransactionType.EXPENSE,
      frequency: Frequency.MONTHLY,
      sourceAccountId: accounts[0]?.id || '',
      destinationAccountId: '',
      targetGoalId: '',
      categoryId: '',
      subCategory: '',
      description: '',
      amount: 0,
      paymentMethod: 'Virement'
    });
    setShowForm('add');
  };

  const handleOpenEdit = (rec: RecurringTransaction) => {
    setEditingRec(rec);
    setFormData({
      startDate: rec.startDate,
      endDate: rec.endDate || '',
      type: rec.type,
      frequency: rec.frequency,
      sourceAccountId: rec.sourceAccountId,
      destinationAccountId: rec.destinationAccountId || '',
      targetGoalId: rec.targetGoalId || '',
      categoryId: rec.categoryId,
      subCategory: rec.subCategory,
      description: rec.description,
      amount: rec.amount,
      paymentMethod: rec.paymentMethod
    });
    setShowForm('edit');
  };

  const handleTogglePause = (rec: RecurringTransaction) => {
    updateRecurring({ ...rec, isPaused: !rec.isPaused });
  };

  const handleManualExecute = (rec: RecurringTransaction) => {
    const newTransaction = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      categoryId: rec.categoryId,
      subCategory: rec.subCategory,
      description: `[Manuel] ${rec.description}`,
      sourceAccountId: rec.sourceAccountId,
      destinationAccountId: rec.destinationAccountId,
      paymentMethod: rec.paymentMethod,
      type: rec.type,
      revenue: rec.type === TransactionType.REVENUE ? rec.amount : 0,
      expense: (rec.type === TransactionType.EXPENSE || rec.type === TransactionType.TRANSFER || rec.type === TransactionType.GOAL_DEPOSIT) ? rec.amount : 0,
      reconciliation: ReconciliationMarker.NONE
    };

    addTransaction(newTransaction);
    alert("✅ Transaction réelle ajoutée ! Le reste à passer a été mis à jour.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sourceAccountId || (!formData.categoryId && formData.type !== TransactionType.GOAL_DEPOSIT) || !formData.amount) return;
    
    let paymentMethod = formData.paymentMethod;
    if (formData.type === TransactionType.TRANSFER) paymentMethod = 'Transfert';
    if (formData.type === TransactionType.GOAL_DEPOSIT) paymentMethod = 'Épargne Objectif';

    const recData = {
      ...formData,
      endDate: formData.endDate || undefined,
      destinationAccountId: (formData.type === TransactionType.TRANSFER || formData.type === TransactionType.GOAL_DEPOSIT) ? formData.destinationAccountId : undefined,
      targetGoalId: formData.type === TransactionType.GOAL_DEPOSIT ? formData.targetGoalId : undefined,
      paymentMethod
    };

    if (showForm === 'add') {
      addRecurring({
        ...recData,
        id: Date.now().toString(),
        isPaused: false
      } as any);
    } else if (showForm === 'edit' && editingRec) {
      updateRecurring({
        ...editingRec,
        ...recData
      } as any);
    }
    
    setShowForm(null);
  };

  const selectedCategory = categories.find((c: any) => String(c.id) === String(formData.categoryId));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Mensuel Actif</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalMonthly.toFixed(2)}€</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
            <Repeat size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-lg shadow-blue-50 flex items-center justify-between ring-2 ring-blue-50">
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Reste à passer (ce mois)</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{totalRemainingThisMonth.toFixed(2)}€</h3>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opérations Actives</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{activeRecurring.length}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opérations en Pause</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{pausedCount}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
            <Pause size={24} />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Échéancier Récurrent</h2>
        <button 
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-xl font-bold shadow-lg flex items-center hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus size={18} className="mr-2" /> Nouveau Contrat
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-50 text-slate-500 uppercase font-black tracking-widest">
              <tr>
                <th 
                  className="px-4 py-5 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => requestSort('startDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Date Début</span>
                    <ArrowUpDown size={10} className={sortConfig?.key === 'startDate' ? 'text-blue-500' : 'text-slate-300'} />
                  </div>
                </th>
                <th className="px-4 py-5 whitespace-nowrap">Date Fin</th>
                <th className="px-4 py-5">Catégorie</th>
                <th className="px-4 py-5">Sous-catégorie</th>
                <th className="px-4 py-5">Description</th>
                <th className="px-4 py-5">Cpt Source</th>
                <th className="px-4 py-5">Type d'opération</th>
                <th className="px-4 py-5">Compte destination</th>
                <th className="px-4 py-5 text-right">Dépense</th>
                <th className="px-4 py-5 text-right">Revenu</th>
                <th className="px-4 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRecurring.map((rec: any) => {
                const cat = categories.find((c: any) => String(c.id) === String(rec.categoryId));
                const sourceAcc = accounts.find((a: any) => String(a.id) === String(rec.sourceAccountId));
                const destAcc = rec.destinationAccountId ? accounts.find((a: any) => String(a.id) === String(rec.destinationAccountId)) : null;
                const targetGoal = rec.targetGoalId ? goals.find((g: any) => String(g.id) === String(rec.targetGoalId)) : null;
                
                return (
                  <tr key={rec.id} className={`hover:bg-slate-50 transition-colors group ${rec.isPaused ? 'bg-slate-50 opacity-60' : ''}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-400 font-bold">{formatDateDisplay(rec.startDate)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-400 font-bold">{formatDateDisplay(rec.endDate)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{cat?.icon || '📅'}</span>
                        <span className="font-bold text-slate-700 uppercase">{cat?.name || 'Virement'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-500 font-medium uppercase tracking-tighter">{rec.subCategory || '-'}</td>
                    <td className="px-4 py-4 text-slate-700 font-bold truncate max-w-[120px]">{rec.description || '-'}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-black uppercase tracking-tighter">
                        {sourceAcc?.name || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-1">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-black uppercase tracking-tighter border border-blue-100">
                          {typeLabels[rec.type as TransactionType]}
                        </span>
                        <span className="text-[9px] font-black text-slate-300">({frequencyLabels[rec.frequency as Frequency]})</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {destAcc ? (
                        <div className="flex items-center text-blue-500 font-black uppercase tracking-tighter">
                          <ArrowRight size={10} className="mr-1" /> {destAcc.name}
                        </div>
                      ) : targetGoal ? (
                        <div className="flex items-center text-pink-500 font-black uppercase tracking-tighter">
                           <Target size={10} className="mr-1" /> {targetGoal.name}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {rec.type !== TransactionType.REVENUE ? (
                        <span className="font-black text-rose-500">-{rec.amount.toFixed(2)}€</span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {rec.type === TransactionType.REVENUE ? (
                        <span className="font-black text-emerald-500">+{rec.amount.toFixed(2)}€</span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center space-x-1">
                        <button onClick={() => handleManualExecute(rec)} title="Exécuter maintenant" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all active:scale-90"><Zap size={14} /></button>
                        <button onClick={() => handleOpenEdit(rec)} title="Modifier" className="p-1.5 text-slate-300 hover:text-blue-500 rounded-lg transition-all"><Edit2 size={14} /></button>
                        <button onClick={() => handleTogglePause(rec)} title={rec.isPaused ? "Activer" : "Mettre en pause"} className="p-1.5 text-slate-300 hover:text-amber-500 rounded-lg transition-all">{rec.isPaused ? <Play size={14} /> : <Pause size={14} />}</button>
                        <button onClick={() => confirmDelete(rec, 'recurring')} title="Supprimer" className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 shadow-2xl animate-in zoom-in duration-200 border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{showForm === 'add' ? 'Saisir un Echéancier' : 'Modifier le Contrat'}</h3>
              <button onClick={() => setShowForm(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type d'opération</label>
                <select className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 transition-all" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TransactionType, categoryId: ''})}>
                  <option value={TransactionType.EXPENSE}>Dépense</option>
                  <option value={TransactionType.REVENUE}>Revenu</option>
                  <option value={TransactionType.TRANSFER}>Transfert (Compte à Compte)</option>
                  <option value={TransactionType.GOAL_DEPOSIT}>Vers Objectif d'Épargne 🎯</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fréquence</label>
                <select className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 transition-all" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value as Frequency})}>
                  <option value={Frequency.DAILY}>Quotidienne</option>
                  <option value={Frequency.WEEKLY}>Hebdomadaire</option>
                  <option value={Frequency.MONTHLY}>Mensuelle</option>
                  <option value={Frequency.YEARLY}>Annuelle</option>
                </select>
              </div>

              {formData.type === TransactionType.GOAL_DEPOSIT && (
                <div className="md:col-span-2 space-y-1 animate-in slide-in-from-top duration-200">
                  <label className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Cible Épargne 🎯</label>
                  <select required className="w-full px-5 py-4 bg-pink-50 border-2 border-pink-100 rounded-2xl outline-none font-bold focus:border-pink-500 transition-all" value={formData.targetGoalId} onChange={e => setFormData({...formData, targetGoalId: e.target.value})}>
                    <option value="">Sélectionner l'objectif...</option>
                    {goals.map((g: any) => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compte Source</label>
                <select required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 transition-all" value={formData.sourceAccountId} onChange={e => setFormData({...formData, sourceAccountId: e.target.value})}>
                  {accounts.map((a:any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant (€)</label>
                  <input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black outline-none focus:border-blue-500 transition-all" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</label>
                  <select required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 transition-all" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value, subCategory: ''})}>
                    <option value="">Sélectionner...</option>
                    {categories.filter((c:any) => c.type === (formData.type === TransactionType.REVENUE ? 'REVENUE' : 'EXPENSE') || formData.type === TransactionType.TRANSFER || formData.type === TransactionType.GOAL_DEPOSIT).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sous-Catégorie</label>
                <select className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 transition-all disabled:opacity-50" value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})} disabled={!selectedCategory}>
                  <option value="">Aucune</option>
                  {selectedCategory?.subCategories?.map((s: string) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date de début</label>
                <input type="date" required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 transition-all" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date de fin (Optionnelle)</label>
                <input type="date" className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 transition-all" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              </div>

              {formData.type === TransactionType.TRANSFER && (
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Compte de Destination</label>
                  <select required className="w-full px-5 py-4 bg-blue-50 border-2 border-blue-100 rounded-2xl outline-none font-bold focus:border-blue-500 transition-all" value={formData.destinationAccountId} onChange={e => setFormData({...formData, destinationAccountId: e.target.value})}>
                    <option value="">Sélectionner...</option>
                    {accounts.filter((a:any) => String(a.id) !== String(formData.sourceAccountId)).map((a:any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description libre / Mémo</label>
                <input type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 transition-all" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="ex: Loyer Appartement" />
              </div>

              <div className="md:col-span-2 flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowForm(null)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all">Annuler</button>
                <button type="submit" className="flex-1 py-4 font-bold bg-slate-900 text-white rounded-2xl shadow-xl uppercase text-[10px] tracking-widest active:scale-95 transition-all">Sauvegarder</button>
              </div>
            </form>

            {showForm === 'edit' && editingRec && (
              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center">
                <button 
                  type="button" 
                  onClick={() => { confirmDelete(editingRec, 'recurring'); setShowForm(null); }}
                  className="w-full py-4 bg-rose-50 text-rose-500 hover:bg-rose-100 font-black rounded-2xl uppercase text-[10px] tracking-widest border border-rose-100 flex items-center justify-center transition-all active:scale-95 shadow-sm"
                >
                  <Trash2 size={16} className="mr-2" /> Supprimer définitivement
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Recurring;
