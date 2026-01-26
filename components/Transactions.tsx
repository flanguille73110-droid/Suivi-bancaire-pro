
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Transaction, TransactionType, ReconciliationMarker } from '../types';
import { Plus, Trash2, Edit2, X, ArrowRight, Target } from 'lucide-react';

const Transactions: React.FC = () => {
  const context = useContext(AppContext) as any;
  const { transactions, accounts, categories, cards, goals, addTransaction, confirmDelete, updateTransaction, updateGoal } = context;
  
  const [showForm, setShowForm] = useState<'add' | 'edit' | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: TransactionType.EXPENSE,
    sourceAccountId: accounts[0]?.id || '',
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

  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction, direction: 'asc' | 'desc' } | null>(null);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const handleSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key]! < b[key]!) return direction === 'asc' ? -1 : 1;
    if (a[key]! > b[key]!) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const openAdd = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: TransactionType.EXPENSE,
      sourceAccountId: accounts[0]?.id || '',
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
    setShowForm('add');
  };

  const openEdit = (t: Transaction) => {
    setEditingTransaction(t);
    const amount = t.revenue > 0 ? t.revenue : t.expense;
    const isCheque = t.paymentMethod.startsWith('Chèque n°');
    const chequeNum = isCheque ? t.paymentMethod.replace('Chèque n°', '') : '';
    
    setFormData({
      date: t.date,
      type: t.type,
      sourceAccountId: t.sourceAccountId,
      destinationAccountId: t.destinationAccountId || '',
      targetGoalId: '', 
      categoryId: t.categoryId,
      subCategory: t.subCategory,
      description: t.description,
      amount: amount,
      paymentMethod: isCheque ? 'Chèque' : t.paymentMethod,
      chequeNumber: chequeNum,
      reconciliation: t.reconciliation || ReconciliationMarker.NONE
    });
    setShowForm('edit');
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sourceAccountId || (!formData.categoryId && formData.type !== TransactionType.TRANSFER && formData.type !== TransactionType.GOAL_DEPOSIT) || !formData.amount) return;

    let finalPaymentMethod = formData.paymentMethod;
    if (formData.paymentMethod === 'Chèque' && formData.chequeNumber) {
      finalPaymentMethod = `Chèque n°${formData.chequeNumber}`;
    }

    const isTransfer = formData.type === TransactionType.TRANSFER;
    const isGoalDeposit = formData.type === TransactionType.GOAL_DEPOSIT;

    const tData: Partial<Transaction> = {
      date: formData.date,
      type: formData.type,
      sourceAccountId: formData.sourceAccountId,
      destinationAccountId: (isTransfer || isGoalDeposit) ? formData.destinationAccountId : undefined,
      categoryId: formData.categoryId,
      subCategory: formData.subCategory,
      description: isGoalDeposit ? `Épargne Objectif : ${goals.find((g:any) => String(g.id) === String(formData.targetGoalId))?.name}` : formData.description,
      revenue: formData.type === TransactionType.REVENUE ? formData.amount : 0,
      expense: (formData.type === TransactionType.EXPENSE || isTransfer || isGoalDeposit) ? formData.amount : 0,
      paymentMethod: finalPaymentMethod,
      reconciliation: formData.reconciliation as ReconciliationMarker
    };

    if (showForm === 'add') {
      addTransaction({ ...tData as Transaction, id: Date.now().toString() });
      if (isGoalDeposit && formData.targetGoalId) {
        const goal = goals.find((g: any) => String(g.id) === String(formData.targetGoalId));
        if (goal) updateGoal({ ...goal, currentAmount: goal.currentAmount + formData.amount });
      }
    } else if (showForm === 'edit' && editingTransaction) {
      updateTransaction({ ...editingTransaction, ...tData } as Transaction);
    }
    setShowForm(null);
  };

  const paymentMethods = [
    'Virement', 'Prélèvement', 'Chèque', 'Espèces',
    ...cards.map((c: any) => `Carte: ${c.name}`)
  ];

  const selectedCategory = categories.find((c: any) => String(c.id) === String(formData.categoryId));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Journal des Transactions</h2>
        <button 
          onClick={openAdd}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-2xl shadow-xl font-bold hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus size={18} className="mr-2" /> Ajouter une Transaction
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-[0.15em]">
              <tr>
                <th className="px-6 py-5 border-b cursor-pointer" onClick={() => handleSort('date')}>Date</th>
                <th className="px-6 py-5 border-b">Catégorie</th>
                <th className="px-6 py-5 border-b">Sous-catégories</th>
                <th className="px-6 py-5 border-b">Libellé / Description</th>
                <th className="px-6 py-5 border-b">Compte Source</th>
                <th className="px-6 py-5 border-b">Moyen de paiement</th>
                <th className="px-6 py-5 border-b">Compte destinataire</th>
                <th className="px-6 py-4 border-b text-right cursor-pointer" onClick={() => handleSort('expense')}>Dépense</th>
                <th className="px-6 py-4 border-b text-right cursor-pointer" onClick={() => handleSort('revenue')}>Revenu</th>
                <th className="px-6 py-5 border-b text-center">Rapprochement</th>
                <th className="px-6 py-5 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedTransactions.map(t => {
                const sourceAcc = accounts.find((a: any) => String(a.id) === String(t.sourceAccountId));
                const destAcc = t.destinationAccountId ? accounts.find((a: any) => String(a.id) === String(t.destinationAccountId)) : null;
                const cat = categories.find((c: any) => String(c.id) === String(t.categoryId));
                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-6 py-4 text-slate-400 font-bold">{formatDateDisplay(t.date)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{cat?.icon || '📦'}</span>
                        <span className="font-black text-slate-800 leading-tight">{cat?.name || 'Transfert'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.subCategory || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium truncate max-w-[150px]">{t.description}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        {sourceAcc?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t.paymentMethod}</span>
                    </td>
                    <td className="px-6 py-4">
                      {destAcc ? (
                        <div className="flex items-center text-blue-500 font-black text-[10px] uppercase tracking-widest">
                          <ArrowRight size={10} className="mr-1" /> {destAcc.name}
                        </div>
                      ) : t.type === TransactionType.GOAL_DEPOSIT ? (
                        <div className="flex items-center text-pink-500 font-black text-[10px] uppercase tracking-widest">
                           <Target size={10} className="mr-1" /> Épargne 🎯
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-rose-500 font-black text-right text-base">
                      {t.expense > 0 ? `-${t.expense.toFixed(2)}€` : ''}
                    </td>
                    <td className="px-6 py-4 text-emerald-500 font-black text-right text-base">
                      {t.revenue > 0 ? `+${t.revenue.toFixed(2)}€` : ''}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${t.reconciliation !== 'NONE' ? 'bg-slate-900 text-white' : 'text-slate-300'}`}>
                        {t.reconciliation === 'GREEN_CHECK' ? '✅' : t.reconciliation === 'NONE' ? '-' : t.reconciliation}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 justify-center">
                        <button onClick={() => openEdit(t)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => confirmDelete(t, 'transaction')} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
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
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{showForm === 'add' ? 'Saisir une Transaction' : 'Détails de l\'Opération'}</h3>
              <button onClick={() => setShowForm(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LIGNE 1 : DATE ET TYPE */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                <input type="date" required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold transition-all" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type d'opération</label>
                <select className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as TransactionType, categoryId: '', subCategory: '' })}>
                  <option value={TransactionType.EXPENSE}>Dépense</option>
                  <option value={TransactionType.REVENUE}>Revenu</option>
                  <option value={TransactionType.TRANSFER}>Transfert Inter-Comptes</option>
                  <option value={TransactionType.GOAL_DEPOSIT}>Vers objectif d'épargne 🎯</option>
                </select>
              </div>

              {/* LIGNE 2 POUR ÉPARGNE : CIBLE ÉPARGNE */}
              {formData.type === TransactionType.GOAL_DEPOSIT && (
                <div className="md:col-span-2 space-y-1 animate-in slide-in-from-left duration-200">
                  <label className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Cible Épargne 🎯</label>
                  <select required className="w-full px-6 py-4 bg-pink-50 border-2 border-pink-100 rounded-2xl focus:border-pink-500 outline-none font-bold" value={formData.targetGoalId} onChange={e => setFormData({ ...formData, targetGoalId: e.target.value })}>
                    <option value="">Sélectionner l'objectif...</option>
                    {goals.map((g: any) => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
                  </select>
                </div>
              )}

              {/* SECTION SOURCE / DESTINATION / PAIEMENT */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compte Source</label>
                <select required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold" value={formData.sourceAccountId} onChange={e => setFormData({ ...formData, sourceAccountId: e.target.value })}>
                  {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {(formData.type === TransactionType.TRANSFER || formData.type === TransactionType.GOAL_DEPOSIT) ? (
                <div className="space-y-1 animate-in slide-in-from-left duration-200">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Compte de Destination</label>
                  <select required className="w-full px-6 py-4 bg-blue-50 border-2 border-blue-100 rounded-2xl focus:border-blue-500 outline-none font-bold" value={formData.destinationAccountId} onChange={e => setFormData({ ...formData, destinationAccountId: e.target.value })}>
                      <option value="">Sélectionner le compte...</option>
                      {accounts.filter((a: any) => String(a.id) !== String(formData.sourceAccountId)).map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode de paiement</label>
                  <select className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                    {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}

              {/* POUR TRANSFERT/EPARGNE : MODE PAIEMENT ET MONTANT AU DESSUS DE CATEGORIE */}
              {(formData.type === TransactionType.TRANSFER || formData.type === TransactionType.GOAL_DEPOSIT) && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode de paiement</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                      {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant (€)</label>
                    <input type="number" step="0.01" required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-2xl font-black focus:border-blue-500 focus:bg-white outline-none" value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} />
                  </div>
                </>
              )}

              {/* CHAMP CONDITIONNEL : NUMÉRO DE CHÈQUE (Sous source/paiement, au dessus de catégorie) */}
              {formData.paymentMethod === 'Chèque' && (
                <div className="md:col-span-2 space-y-1 animate-in slide-in-from-left duration-200">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Numéro de chèque</label>
                  <input type="text" className="w-full px-6 py-4 bg-blue-50 border-2 border-blue-100 rounded-2xl focus:border-blue-500 outline-none font-bold" value={formData.chequeNumber} onChange={e => setFormData({ ...formData, chequeNumber: e.target.value })} placeholder="ex: 1234567" />
                </div>
              )}

              {/* LIGNE CATÉGORIES */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</label>
                <select required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value, subCategory: '' })}>
                  <option value="">Sélectionner...</option>
                  {categories.filter((c:any) => c.type === (formData.type === TransactionType.REVENUE ? 'REVENUE' : 'EXPENSE') || formData.type === TransactionType.TRANSFER || formData.type === TransactionType.GOAL_DEPOSIT).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sous-Catégorie</label>
                <select className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold disabled:opacity-50" value={formData.subCategory} onChange={e => setFormData({ ...formData, subCategory: e.target.value })} disabled={!selectedCategory}>
                  <option value="">Aucune</option>
                  {selectedCategory?.subCategories?.map((s: string) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* LIGNE FINALE : MONTANT ET RAPPROCHEMENT (POUR DEPENSE/REVENU) OU RAPPROCHEMENT (TRANSFERT) */}
              {(formData.type === TransactionType.EXPENSE || formData.type === TransactionType.REVENUE) ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant (€)</label>
                    <input type="number" step="0.01" required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-2xl font-black focus:border-blue-500 focus:bg-white outline-none" value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rapprochement</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold" value={formData.reconciliation} onChange={e => setFormData({ ...formData, reconciliation: e.target.value as ReconciliationMarker })}>
                      {Object.values(ReconciliationMarker).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rapprochement</label>
                  <select className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold" value={formData.reconciliation} onChange={e => setFormData({ ...formData, reconciliation: e.target.value as ReconciliationMarker })}>
                    {Object.values(ReconciliationMarker).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description libre / Mémo</label>
                <textarea className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl h-24 focus:border-blue-500 focus:bg-white outline-none font-bold transition-all" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="ex: Courses hebdomadaires" />
              </div>

              <div className="md:col-span-2 flex space-x-4 pt-4">
                <button type="button" onClick={() => setShowForm(null)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all border border-slate-100">Annuler</button>
                <button type="submit" className="flex-1 py-4 font-bold bg-slate-900 text-white rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all uppercase text-[10px] tracking-widest">Enregistrer l'opération</button>
              </div>
            </form>

            {showForm === 'edit' && editingTransaction && (
              <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col items-center">
                <button 
                  type="button" 
                  onClick={() => { confirmDelete(editingTransaction, 'transaction'); setShowForm(null); }}
                  className="w-full py-4 bg-rose-50 text-rose-500 hover:bg-rose-100 font-black rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center transition-all active:scale-95 shadow-sm border border-rose-100"
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

export default Transactions;
