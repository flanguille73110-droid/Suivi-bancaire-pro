
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { AppContextType, Budget, Category } from '../types';
import { Plus, BarChart3, AlertCircle, X, Trash2, Edit2 } from 'lucide-react';

const Budgets: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const { budgets, categories, transactions, addBudget, updateBudget, confirmDelete } = context;

  const [showForm, setShowForm] = useState<'add' | 'edit' | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [displayAmount, setDisplayAmount] = useState("");
  
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: 0,
    period: 'MONTHLY' as 'MONTHLY' | 'YEARLY',
    thresholds: '50,80,100'
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace('.', ',');
    if (/^[0-9]*,?[0-9]*$/.test(val)) {
      setDisplayAmount(val);
      const numericVal = parseFloat(val.replace(',', '.'));
      setFormData({ ...formData, amount: isNaN(numericVal) ? 0 : numericVal });
    }
  };

  const handleOpenAdd = () => {
    setFormData({ categoryId: '', amount: 0, period: 'MONTHLY', thresholds: '50,80,100' });
    setDisplayAmount("");
    setShowForm('add');
    setEditingBudget(null);
  };

  const handleOpenEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({ 
      categoryId: budget.categoryId, 
      amount: budget.amount, 
      period: budget.period, 
      thresholds: budget.alertThresholds.map(t => t*100).join(',') 
    });
    setDisplayAmount(budget.amount.toString().replace('.', ','));
    setShowForm('edit');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.amount) return;
    const thresholdsArr = formData.thresholds.split(',').map(t => parseInt(t.trim()) / 100).filter(t => !isNaN(t));
    const budgetData = { categoryId: formData.categoryId, amount: formData.amount, period: formData.period, alertThresholds: thresholdsArr.length > 0 ? thresholdsArr : [0.5, 0.8, 1.0] };
    if (showForm === 'add') { addBudget({ ...budgetData, id: Date.now().toString() }); }
    else if (showForm === 'edit' && editingBudget) { updateBudget({ ...editingBudget, ...budgetData }); }
    setShowForm(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Limites de Dépenses</h2>
        <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center" onClick={handleOpenAdd}>
          <Plus size={18} className="mr-2" /> Définir un Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {budgets.map((budget: Budget) => {
          const category = categories.find((c:any) => String(c.id) === String(budget.categoryId));
          const spent = transactions.filter(t => t.categoryId === budget.categoryId && new Date(t.date).getMonth() === new Date().getMonth()).reduce((s,t) => s + t.expense, 0);
          const percent = Math.min(100, Math.round((spent / budget.amount) * 100));
          return (
            <div key={budget.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-4 group relative hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner uppercase" style={{ backgroundColor: category?.color + '15', color: category?.color }}>{category?.icon || '📁'}</div>
                  <div>
                    <h3 className="font-black text-slate-800 tracking-tight uppercase">{category?.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{budget.period === 'MONTHLY' ? 'Mensuel' : 'Annuel'}</p>
                  </div>
                </div>
                <button onClick={() => handleOpenEdit(budget)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit2 size={18} /></button>
              </div>
              <div className="h-5 w-full bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100">
                <div className={`h-full rounded-full transition-all duration-1000 ${percent >= 100 ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`} style={{ width: `${percent}%` }} />
              </div>
              <div className="flex justify-between items-end">
                <p className="text-[11px] font-black uppercase text-slate-400 tracking-tight">
                  <span className="text-slate-900">{spent.toFixed(2)}€</span> / <span className="text-slate-900">{budget.amount}€</span>
                </p>
                <span className={`text-xs font-black ${percent >= 100 ? 'text-rose-500' : 'text-blue-500'}`}>{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{showForm === 'add' ? 'Définir Budget' : 'Ajuster Budget'}</h3>
              <button onClick={() => setShowForm(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie cible</label>
                <select required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 uppercase" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                  <option value="">Choisir...</option>
                  {categories.filter((c:any) => c.type === 'EXPENSE').map((c:any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Limite (€)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  required 
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black outline-none focus:border-blue-500" 
                  value={displayAmount} 
                  onChange={handleAmountChange} 
                  placeholder="0,00"
                />
              </div>
              
              <div className="flex space-x-4 mt-8">
                <button type="button" onClick={() => setShowForm(null)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest border border-slate-100 rounded-2xl hover:bg-slate-50">Annuler</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl uppercase text-[10px] tracking-widest transition-transform active:scale-95">Enregistrer</button>
              </div>
            </form>

            {showForm === 'edit' && editingBudget && (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { confirmDelete(editingBudget, 'budget'); setShowForm(null); }}
                  className="w-full py-4 bg-rose-50 text-rose-500 hover:bg-rose-100 font-black rounded-2xl uppercase text-[10px] tracking-widest border border-rose-100 flex items-center justify-center transition-all active:scale-95 shadow-sm"
                >
                  <Trash2 size={16} className="mr-2" /> Supprimer ce budget
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
