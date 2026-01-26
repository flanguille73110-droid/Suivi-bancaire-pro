
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { AppContextType, RecurringTransaction, Frequency, TransactionType, ReconciliationMarker, Transaction } from '../types';
import { Plus, Repeat, Trash2, Edit2, Calendar, X, ArrowRight, Pause, Play, Target, Zap, Clock, ArrowUpDown } from 'lucide-react';

const Recurring: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
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

  const sortedRecurring = useMemo(() => {
    let items = [...recurring];
    if (sortConfig) {
      items.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [recurring, sortConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sourceAccountId || (!formData.categoryId && formData.type !== TransactionType.GOAL_DEPOSIT) || !formData.amount) return;
    
    const recData = {
      ...formData,
      endDate: formData.endDate || undefined,
      destinationAccountId: (formData.type === TransactionType.TRANSFER || formData.type === TransactionType.GOAL_DEPOSIT) ? formData.destinationAccountId : undefined,
      targetGoalId: formData.type === TransactionType.GOAL_DEPOSIT ? formData.targetGoalId : undefined
    };

    if (showForm === 'add') {
      addRecurring({ ...recData, id: Date.now().toString(), isPaused: false } as any);
    } else if (showForm === 'edit' && editingRec) {
      updateRecurring({ ...editingRec, ...recData } as any);
    }
    setShowForm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Échéancier Récurrent</h2>
        <button 
          onClick={() => { setFormData({ ...formData, startDate: new Date().toISOString().split('T')[0], amount: 0 }); setShowForm('add'); }}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center"
        >
          <Plus size={18} className="mr-2" /> Nouveau Contrat
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] min-w-[1000px]">
            <thead className="bg-slate-50 text-slate-500 uppercase font-black tracking-widest">
              <tr>
                <th className="px-4 py-5">Date Début</th>
                <th className="px-4 py-5">Catégorie</th>
                <th className="px-4 py-5">Description</th>
                <th className="px-4 py-5">Compte</th>
                <th className="px-4 py-5">Fréquence</th>
                <th className="px-4 py-5 text-right">Montant</th>
                <th className="px-4 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRecurring.map((rec: any) => (
                <tr key={rec.id} className={`hover:bg-slate-50 group transition-all ${rec.isPaused ? 'opacity-50 grayscale' : ''}`}>
                  <td className="px-4 py-4 text-slate-400 font-bold">{rec.startDate}</td>
                  <td className="px-4 py-4">
                    <span className="font-black text-slate-700 uppercase">{categories.find(c => c.id === rec.categoryId)?.name || 'Transfert'}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 font-bold uppercase truncate max-w-[200px]">{rec.description}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded-lg font-black uppercase text-[9px]">{accounts.find(a => a.id === rec.sourceAccountId)?.name}</span>
                  </td>
                  <td className="px-4 py-4 font-black uppercase text-blue-500">{rec.frequency}</td>
                  <td className={`px-4 py-4 text-right font-black ${rec.type === 'REVENUE' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {rec.type === 'REVENUE' ? '+' : '-'}{rec.amount.toFixed(2)}€
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => { setEditingRec(rec); setFormData({...rec}); setShowForm('edit'); }} className="p-2 text-slate-300 hover:text-blue-500"><Edit2 size={14}/></button>
                      <button onClick={() => confirmDelete(rec, 'recurring')} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 shadow-2xl animate-in zoom-in duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{showForm === 'add' ? 'Créer un contrat' : 'Modifier contrat'}</h3>
              <button onClick={() => setShowForm(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                <select className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 uppercase" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}>
                  <option value={TransactionType.EXPENSE}>Dépense</option>
                  <option value={TransactionType.REVENUE}>Revenu</option>
                  <option value={TransactionType.TRANSFER}>Transfert</option>
                  <option value={TransactionType.GOAL_DEPOSIT}>Vers Objectif 🎯</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fréquence</label>
                <select className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 uppercase" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value as Frequency})}>
                  <option value={Frequency.MONTHLY}>Mensuelle</option>
                  <option value={Frequency.WEEKLY}>Hebdomadaire</option>
                  <option value={Frequency.DAILY}>Quotidienne</option>
                  <option value={Frequency.YEARLY}>Annuelle</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compte Source</label>
                <select required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 uppercase" value={formData.sourceAccountId} onChange={e => setFormData({...formData, sourceAccountId: e.target.value})}>
                  {accounts.map((a:any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant (€)</label>
                <input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black outline-none focus:border-blue-500" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mémo / Description</label>
                <input type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 uppercase" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="ex: Loyer" />
              </div>

              <div className="md:col-span-2 flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowForm(null)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest border border-slate-100 rounded-2xl hover:bg-slate-50">Annuler</button>
                <button type="submit" className="flex-1 py-4 font-bold bg-slate-900 text-white rounded-2xl shadow-xl uppercase text-[10px] tracking-widest active:scale-95 transition-all">Enregistrer</button>
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
