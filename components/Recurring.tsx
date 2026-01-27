
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { AppContextType, RecurringTransaction, Frequency, TransactionType, ReconciliationMarker, Transaction } from '../types';
import { Plus, Repeat, Trash2, Edit2, Calendar, X, ArrowRight, Pause, Play, Target, Zap, Clock, ArrowUpDown, CheckCircle2 } from 'lucide-react';

const Recurring: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const { recurring, accounts, transactions, categories, goals, addRecurring, confirmDelete, updateRecurring, addTransaction, notify } = context;
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

  const kpis = useMemo(() => {
    const active = recurring.filter(r => !r.isPaused);
    const paused = recurring.filter(r => r.isPaused);
    const totalAmount = active.reduce((sum, r) => sum + r.amount, 0);
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const remaining = active.reduce((sum, rec) => {
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

    return {
      totalAmount,
      remaining,
      activeCount: active.length,
      pausedCount: paused.length
    };
  }, [recurring, transactions]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedRecurring = useMemo(() => {
    let items = [...recurring];
    if (sortConfig) {
      items.sort((a: any, b: any) => {
        let valA: any = a[sortConfig.key];
        let valB: any = b[sortConfig.key];

        // Traitement spécial pour le nom de la catégorie au lieu de l'ID
        if (sortConfig.key === 'categoryId') {
          valA = categories.find(c => String(c.id) === String(a.categoryId))?.name || (a.type === 'GOAL_DEPOSIT' ? 'Épargne' : 'Transfert');
          valB = categories.find(c => String(c.id) === String(b.categoryId))?.name || (b.type === 'GOAL_DEPOSIT' ? 'Épargne' : 'Transfert');
        }

        if (valA === undefined) valA = '';
        if (valB === undefined) valB = '';

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [recurring, sortConfig, categories]);

  const handleZap = (rec: RecurringTransaction) => {
    const newT: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: rec.type,
      sourceAccountId: rec.sourceAccountId,
      destinationAccountId: rec.destinationAccountId,
      categoryId: rec.categoryId,
      subCategory: rec.subCategory,
      description: `[ZAP] ${rec.description}`,
      revenue: rec.type === TransactionType.REVENUE ? rec.amount : 0,
      expense: (rec.type === TransactionType.EXPENSE || rec.type === TransactionType.TRANSFER || rec.type === TransactionType.GOAL_DEPOSIT) ? rec.amount : 0,
      paymentMethod: rec.paymentMethod,
      reconciliation: ReconciliationMarker.NONE
    };
    addTransaction(newT);
    notify(`⚡ Transaction "${rec.description}" exécutée vers le journal.`);
  };

  const togglePause = (rec: RecurringTransaction) => {
    updateRecurring({ ...rec, isPaused: !rec.isPaused });
    notify(rec.isPaused ? "▶️ Échéance réactivée" : "⏸️ Échéance mise en pause");
  };

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

  const selectedCategory = categories.find(c => String(c.id) === String(formData.categoryId));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Échéancier Récurrent</h2>
        <button 
          onClick={() => { setFormData({ ...formData, startDate: new Date().toISOString().split('T')[0], amount: 0, endDate: '', targetGoalId: '', destinationAccountId: '', categoryId: '', subCategory: '' }); setShowForm('add'); }}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center border border-white/10"
        >
          <Plus size={18} className="mr-2" /> Créer une Occurrence
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard label="Volume Total Mensuel" value={kpis.totalAmount} icon={<Repeat size={20}/>} color="blue" />
        <KpiCard label="Reste à Passer (Mois)" value={kpis.remaining} icon={<Clock size={20}/>} color="rose" highlight />
        <KpiCard label="Contrats Actifs" value={kpis.activeCount} icon={<CheckCircle2 size={20}/>} color="emerald" suffix="" />
        <KpiCard label="Contrats en Pause" value={kpis.pausedCount} icon={<Pause size={20}/>} color="slate" suffix="" />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] min-w-[1400px]">
            <thead className="bg-slate-50 text-slate-500 uppercase font-black tracking-widest">
              <tr>
                <SortHeader label="Début" active={sortConfig?.key === 'startDate'} onClick={() => handleSort('startDate')} />
                <th className="px-6 py-5">Fin</th>
                <th className="px-6 py-5">Fréquence</th>
                <SortHeader label="Catégorie" active={sortConfig?.key === 'categoryId'} onClick={() => handleSort('categoryId')} />
                <SortHeader label="Sous-catégorie" active={sortConfig?.key === 'subCategory'} onClick={() => handleSort('subCategory')} />
                <th className="px-6 py-5">Description</th>
                <th className="px-6 py-5">Source</th>
                <th className="px-6 py-5">Mode</th>
                <th className="px-6 py-5">Destination</th>
                <th className="px-6 py-5 text-right">Montant</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRecurring.map((rec: any) => {
                const destAcc = rec.destinationAccountId ? accounts.find(a => String(a.id) === String(rec.destinationAccountId)) : null;
                const destGoal = rec.targetGoalId ? goals.find(g => String(g.id) === String(rec.targetGoalId)) : null;
                
                return (
                  <tr key={rec.id} className={`hover:bg-slate-50 group transition-all ${rec.isPaused ? 'bg-slate-50/50 grayscale' : ''}`}>
                    <td className="px-6 py-4 text-slate-400 font-bold">{rec.startDate}</td>
                    <td className="px-6 py-4 text-slate-400 font-bold">{rec.endDate || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg font-black uppercase text-[9px] ${rec.isPaused ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                        {rec.frequency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-700 uppercase flex items-center">
                        <span className="mr-2 text-base">{categories.find(c => String(c.id) === String(rec.categoryId))?.icon || (rec.type === 'GOAL_DEPOSIT' ? '🎯' : '💸')}</span>
                        {categories.find(c => String(c.id) === String(rec.categoryId))?.name || (rec.type === 'GOAL_DEPOSIT' ? 'Épargne' : 'Transfert')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-bold uppercase">{rec.subCategory || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 font-bold uppercase truncate max-w-[180px]">{rec.description}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 rounded-lg font-black uppercase text-[9px]">
                        {accounts.find(a => String(a.id) === String(rec.sourceAccountId))?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-bold uppercase">{rec.paymentMethod || 'Virement'}</td>
                    <td className="px-6 py-4">
                      {destAcc ? (
                        <div className="flex items-center text-blue-500 font-black text-[9px] uppercase">
                          <ArrowRight size={10} className="mr-1" /> {destAcc.name}
                        </div>
                      ) : destGoal ? (
                        <div className="flex items-center text-pink-500 font-black text-[9px] uppercase">
                           <Target size={10} className="mr-1" /> {destGoal.icon} {destGoal.name}
                        </div>
                      ) : <span className="text-slate-200">-</span>}
                    </td>
                    <td className={`px-6 py-4 text-right font-black text-sm ${rec.isPaused ? 'text-slate-300' : rec.type === 'REVENUE' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {rec.type === 'REVENUE' ? '+' : '-'}{rec.amount.toFixed(2)}€
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!rec.isPaused && (
                           <button onClick={() => handleZap(rec)} title="Exécuter maintenant" className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"><Zap size={14} fill="currentColor"/></button>
                        )}
                        <button onClick={() => togglePause(rec)} title={rec.isPaused ? "Réactiver" : "Mettre en pause"} className={`p-2 rounded-xl transition-all ${rec.isPaused ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}>
                          {rec.isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                        </button>
                        <button onClick={() => { setEditingRec(rec); setFormData({...rec}); setShowForm('edit'); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={14}/></button>
                        <button onClick={() => confirmDelete(rec, 'recurring')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={14}/></button>
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 shadow-2xl animate-in zoom-in duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                {showForm === 'add' ? 'Créer une occurrence' : 'Modifier l\'occurrence'}
              </h3>
              <button onClick={() => setShowForm(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date début</label>
                <input type="date" required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date fin (optionnel)</label>
                <input type="date" className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type d'opération</label>
                <select className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 uppercase" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TransactionType, categoryId: '', subCategory: ''})}>
                  <option value={TransactionType.EXPENSE}>Dépense</option>
                  <option value={TransactionType.REVENUE}>Revenu</option>
                  <option value={TransactionType.TRANSFER}>Transfert</option>
                  <option value={TransactionType.GOAL_DEPOSIT}>Vers objectif 🎯</option>
                </select>
              </div>
              {formData.type === TransactionType.GOAL_DEPOSIT && (
                <div className="md:col-span-2 space-y-1 animate-in slide-in-from-top duration-200">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objectif cible 🎯</label>
                  <select required className="w-full px-5 py-4 bg-blue-50 border-2 border-blue-100 rounded-2xl outline-none font-black uppercase" value={formData.targetGoalId} onChange={e => setFormData({...formData, targetGoalId: e.target.value})}>
                    <option value="">Sélectionner l'objectif...</option>
                    {goals.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compte Source</label>
                <select required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 uppercase" value={formData.sourceAccountId} onChange={e => setFormData({...formData, sourceAccountId: e.target.value})}>
                  {accounts.map((a:any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              {(formData.type === TransactionType.TRANSFER || formData.type === TransactionType.GOAL_DEPOSIT) ? (
                <div className="space-y-1 animate-in slide-in-from-top duration-200">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compte Destinataire</label>
                  <select required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 uppercase" value={formData.destinationAccountId} onChange={e => setFormData({...formData, destinationAccountId: e.target.value})}>
                    <option value="">Sélectionner...</option>
                    {accounts.map((a:any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="hidden md:block" />
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode de paiement</label>
                <select className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 uppercase" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                  <option value="Virement">Virement</option>
                  <option value="Prélèvement">Prélèvement</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Espèces">Espèces</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant (€)</label>
                <input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black outline-none focus:border-blue-500" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</label>
                <select 
                  required={formData.type !== TransactionType.TRANSFER && formData.type !== TransactionType.GOAL_DEPOSIT}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 uppercase" 
                  value={formData.categoryId} 
                  onChange={e => setFormData({...formData, categoryId: e.target.value, subCategory: ''})}
                >
                  <option value="">Sélectionner...</option>
                  {categories.filter(c => c.type === (formData.type === TransactionType.REVENUE ? 'REVENUE' : 'EXPENSE')).map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                  {(formData.type === TransactionType.TRANSFER || formData.type === TransactionType.GOAL_DEPOSIT) && (
                    <option value="transfer">Transfert Interne</option>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sous-catégorie</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 uppercase disabled:opacity-50" 
                  value={formData.subCategory} 
                  onChange={e => setFormData({...formData, subCategory: e.target.value})}
                  disabled={!selectedCategory || selectedCategory.subCategories.length === 0}
                >
                  <option value="">Aucune</option>
                  {selectedCategory?.subCategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description / Libellé</label>
                <textarea className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl h-20 outline-none font-bold focus:border-blue-500 uppercase" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="ex: Loyer mensuel" />
              </div>
              <div className="md:col-span-2 flex space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(null)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all">Annuler</button>
                <button type="submit" className="flex-1 py-4 font-bold bg-slate-900 text-white rounded-2xl shadow-xl uppercase text-[10px] tracking-widest active:scale-95 transition-all">Enregistrer l'échéance</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const KpiCard: React.FC<{ label: string, value: number, icon: React.ReactNode, color: 'blue' | 'rose' | 'emerald' | 'slate', highlight?: boolean, suffix?: string }> = ({ label, value, icon, color, highlight, suffix = "€" }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    slate: 'bg-slate-50 text-slate-500 border-slate-100'
  };

  return (
    <div className={`p-6 rounded-[2rem] border-2 shadow-sm flex flex-col justify-between ${colors[color]} ${highlight ? 'shadow-lg shadow-rose-100 animate-pulse' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="p-3 bg-white/60 rounded-xl shadow-inner">{icon}</div>
        <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Synthese</span>
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-black uppercase tracking-tight opacity-60 leading-tight mb-1">{label}</p>
        <h3 className="text-2xl font-black tracking-tighter">
          {typeof value === 'number' ? value.toLocaleString('fr-FR', { minimumFractionDigits: suffix === '€' ? 2 : 0 }) : value}
          <span className="text-sm ml-1 opacity-70">{suffix}</span>
        </h3>
      </div>
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

export default Recurring;
