
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { AppContextType, Budget, Category, Transaction, BankAccount } from '../types';
import { Plus, BarChart3, AlertCircle, X, Trash2, Edit2, Wallet, PieChart, Coins, ArrowRight } from 'lucide-react';

const Budgets: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const { budgets, categories, transactions, accounts, recurring, addBudget, updateBudget, confirmDelete } = context;

  const [showForm, setShowForm] = useState<'add' | 'edit' | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [displayAmount, setDisplayAmount] = useState("");
  
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: 0,
    period: 'MONTHLY' as 'MONTHLY' | 'YEARLY',
    thresholds: '50,80,100'
  });

  // --- CALCULS DES INDICATEURS GLOBAUX ---

  const principalAccount = useMemo(() => accounts.find(a => a.isPrincipal), [accounts]);

  const resteAVivre = useMemo(() => {
    if (!principalAccount) return 0;

    // 1. Calcul Solde Réel du compte principal
    const accTransactions = transactions.filter(t => 
      String(t.sourceAccountId) === String(principalAccount.id) || 
      String(t.destinationAccountId) === String(principalAccount.id)
    );
    const realBalance = accTransactions.reduce((balance, t) => {
      if (String(t.sourceAccountId) === String(principalAccount.id)) return balance + t.revenue - t.expense;
      if (String(t.destinationAccountId) === String(principalAccount.id)) return balance + t.expense;
      return balance;
    }, principalAccount.initialBalance);

    // 2. Calcul Reste à passer (Récurrentes non encore débitées ce mois-ci)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const remainingRecurring = recurring
      .filter(rec => !rec.isPaused && String(rec.sourceAccountId) === String(principalAccount.id))
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

    return realBalance - remainingRecurring;
  }, [principalAccount, transactions, recurring]);

  const totalBudgetsMax = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.amount, 0);
  }, [budgets]);

  const globalResteADepenser = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const totalSpentInBudgets = budgets.reduce((sum, budget) => {
      const spent = transactions
        .filter(t => 
          String(t.categoryId) === String(budget.categoryId) && 
          new Date(t.date).getMonth() === currentMonth &&
          new Date(t.date).getFullYear() === currentYear
        )
        .reduce((s, t) => s + t.expense, 0);
      return sum + spent;
    }, 0);

    return totalBudgetsMax - totalSpentInBudgets;
  }, [budgets, transactions, totalBudgetsMax]);

  // --- GESTION FORMULAIRE ---

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
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Suivi des Budgets</h2>
        <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center" onClick={handleOpenAdd}>
          <Plus size={18} className="mr-2" /> Définir un Budget
        </button>
      </div>

      {/* --- KPI HEADER : LES 3 INDICATEURS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard 
          label="Reste à vivre" 
          value={resteAVivre} 
          icon={<Wallet size={20}/>} 
          color="blue" 
          description="Solde réel principal - échéances"
        />
        <KpiCard 
          label="Total des budgets" 
          value={totalBudgetsMax} 
          icon={<PieChart size={20}/>} 
          color="slate" 
          description="Somme des plafonds définis"
        />
        <KpiCard 
          label="Reste à dépenser" 
          value={globalResteADepenser} 
          icon={<Coins size={20}/>} 
          color="emerald" 
          description="Marge globale sur budgets"
          highlight={globalResteADepenser < totalBudgetsMax * 0.15}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {budgets.map((budget: Budget) => {
          const category = categories.find((c:any) => String(c.id) === String(budget.categoryId));
          const spent = transactions.filter(t => t.categoryId === budget.categoryId && new Date(t.date).getMonth() === new Date().getMonth()).reduce((s,t) => s + t.expense, 0);
          const percent = Math.min(100, Math.round((spent / budget.amount) * 100));
          const remaining = Math.max(0, budget.amount - spent);

          return (
            <div key={budget.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-5 group relative hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-inner bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform" style={{ color: category?.color }}>
                    {category?.icon || '📁'}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">{category?.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{budget.period === 'MONTHLY' ? 'Période : Mensuel' : 'Période : Annuel'}</p>
                  </div>
                </div>
                <button onClick={() => handleOpenEdit(budget)} className="p-3 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={18} /></button>
              </div>

              <div className="space-y-3">
                <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 shadow-sm ${percent >= 100 ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`} 
                    style={{ width: `${percent}%` }} 
                  />
                </div>
                
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase text-slate-400 tracking-tighter">
                      Consommé : <span className="text-slate-900 text-sm">{spent.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span> / <span className="text-slate-500">{budget.amount.toLocaleString('fr-FR')}€</span>
                    </p>
                    {/* Badge Reste disponible demandé */}
                    <div className="flex items-center text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-xl w-fit border border-emerald-100 animate-in slide-in-from-left duration-300 shadow-sm">
                       <span className="text-[10px] font-black uppercase tracking-widest mr-2">Reste disponible :</span>
                       <span className="text-sm font-black tracking-tighter">{remaining.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-black tabular-nums ${percent >= 100 ? 'text-rose-500' : percent >= 80 ? 'text-amber-500' : 'text-blue-500'}`}>{percent}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {budgets.length === 0 && (
          <div className="md:col-span-2 py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-400">
             <PieChart size={48} strokeWidth={1} className="mb-4 opacity-50" />
             <p className="font-bold uppercase text-[10px] tracking-widest">Aucun budget configuré pour le moment</p>
          </div>
        )}
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
                  <option value="">Choisir une catégorie...</option>
                  {categories.filter((c:any) => c.type === 'EXPENSE').map((c:any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Limite maximale (€)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  required 
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-xl outline-none focus:border-blue-500" 
                  value={displayAmount} 
                  onChange={handleAmountChange} 
                  placeholder="0,00"
                />
              </div>
              
              <div className="flex space-x-4 mt-8">
                <button type="button" onClick={() => setShowForm(null)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all">Annuler</button>
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

const KpiCard: React.FC<{ label: string, value: number, icon: React.ReactNode, color: string, description?: string, highlight?: boolean }> = ({ label, value, icon, color, description, highlight }) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <div className={`p-6 rounded-[2.5rem] border-2 shadow-sm flex flex-col justify-between transition-all ${colorMap[color] || colorMap.slate} ${highlight ? 'animate-pulse shadow-lg ring-2 ring-rose-200' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white rounded-xl shadow-sm">{icon}</div>
        <div className="text-right">
           <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-tight">{label}</p>
           {description && <p className="text-[8px] font-bold uppercase opacity-40">{description}</p>}
        </div>
      </div>
      <h3 className="text-2xl font-black tracking-tighter text-right">
        {value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
      </h3>
    </div>
  );
};

export default Budgets;
