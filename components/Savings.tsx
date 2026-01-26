
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { AppContextType, SavingsGoal } from '../types';
import { Plus, Target, Award, ArrowRight, Pause, Play, Edit2, Trash2, X, Check, Calendar, TrendingUp, Clock } from 'lucide-react';
import IconPicker from './IconPicker';

const Goals: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const { goals, accounts, addGoal, updateGoal, confirmDelete } = context;
  const [showForm, setShowForm] = useState<'add' | 'edit' | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  
  const [formData, setFormData] = useState<Partial<SavingsGoal>>({
    name: '', icon: '🎯', targetAmount: 0, currentAmount: 0, color: '#ec4899', accountId: accounts[0]?.id || '', deadline: ''
  });

  const handleOpenAdd = () => {
    setFormData({ name: '', icon: '🎯', targetAmount: 0, currentAmount: 0, color: '#ec4899', accountId: accounts[0]?.id || '', deadline: '' });
    setShowForm('add');
    setEditingGoal(null);
  };

  const handleOpenEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({ ...goal });
    setShowForm('edit');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) return;
    if (showForm === 'add') {
      addGoal({ 
        ...formData as SavingsGoal, 
        id: Date.now().toString(), 
        milestonesReached: [], 
        isReached: (formData.currentAmount || 0) >= (formData.targetAmount || 1), 
        isPaused: false 
      });
    } else if (showForm === 'edit' && editingGoal) {
      updateGoal({ ...editingGoal, ...formData } as SavingsGoal);
    }
    setShowForm(null);
    setEditingGoal(null);
  };

  const calculateMonthlyRequired = (goal: Partial<SavingsGoal>) => {
    if (!goal.deadline || !goal.targetAmount) return 0;
    const remaining = Math.max(0, (goal.targetAmount || 0) - (goal.currentAmount || 0));
    if (remaining <= 0) return 0;

    const now = new Date();
    const end = new Date(goal.deadline);
    
    // Calcul de la différence en mois
    let months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    
    // Si l'échéance est ce mois-ci ou passée, on divise par 1 pour le mois en cours
    if (months <= 0) return remaining;

    return remaining / months;
  };

  const monthlyEffort = useMemo(() => calculateMonthlyRequired(formData), [formData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Défis d'Épargne 🎯</h2>
        <button onClick={handleOpenAdd} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-2xl shadow-xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all">Nouvel Objectif</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {goals.map((goal: any) => {
          const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const monthly = calculateMonthlyRequired(goal);
          return (
            <div key={goal.id} className={`group relative p-8 rounded-[2.5rem] border border-slate-100 shadow-xl transition-all ${goal.isReached ? 'bg-emerald-50 border-emerald-100 shadow-emerald-100' : goal.isPaused ? 'bg-slate-50 opacity-80 shadow-none' : 'bg-white'}`}>
              <div className="absolute top-6 right-6 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenEdit(goal)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => updateGoal({ ...goal, isPaused: !goal.isPaused })} className="p-2 text-slate-400 hover:text-amber-500 transition-colors">{goal.isPaused ? <Play size={16} /> : <Pause size={16} />}</button>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl bg-slate-50 shadow-inner relative">{goal.icon}</div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{goal.name}</h3>
                
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-slate-100 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                    <circle stroke={goal.isReached ? '#10b981' : goal.isPaused ? '#94a3b8' : goal.color} strokeWidth="8" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * progress) / 100} strokeLinecap="round" fill="transparent" r="40" cx="50" cy="50" transform="rotate(-90 50 50)" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in duration-500">
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{progress}%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-50/80 p-5 rounded-3xl space-y-3 border border-slate-100">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-slate-400">Économisé</span><span className="text-slate-900">{goal.currentAmount.toLocaleString('fr-FR')}€</span></div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-slate-400">Cible</span><span className="text-slate-900">{goal.targetAmount.toLocaleString('fr-FR')}€</span></div>
                  
                  {monthly > 0 && !goal.isReached && (
                    <div className="pt-2 border-t border-slate-200 mt-2 flex justify-between items-center text-blue-600">
                      <span className="text-[9px] font-black uppercase tracking-widest flex items-center"><TrendingUp size={10} className="mr-1" /> À prévoir / mois</span>
                      <span className="text-sm font-black tracking-tighter">{monthly.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€</span>
                    </div>
                  )}
                </div>

                {goal.deadline && (
                  <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest space-x-2">
                    <Clock size={12} />
                    <span>Échéance : {new Date(goal.deadline).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-200 border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{showForm === 'add' ? 'Nouveau Défi' : 'Paramètres Projet'}</h3>
              <button onClick={() => { setShowForm(null); setEditingGoal(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Titre du projet</label>
                <input type="text" required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 transition-all uppercase" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="ex: Voyage Japon" />
              </div>
              
              <IconPicker value={formData.icon || '🎯'} onChange={(icon) => setFormData({ ...formData, icon })} />
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Couleur</label>
                  <input type="color" className="w-full h-14 p-1 bg-slate-50 border-2 border-transparent rounded-2xl outline-none" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compte de rattachement</label>
                  <select className="w-full px-5 h-14 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 transition-all uppercase" value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})}>
                    {accounts.map((a:any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant Cible (€)</label>
                  <input type="number" required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-blue-500 outline-none" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: Number(e.target.value)})} placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date d'échéance</label>
                  <input type="date" className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Épargne déjà constituée (€)</label>
                <input type="number" required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-500 outline-none" value={formData.currentAmount} onChange={e => setFormData({...formData, currentAmount: Number(e.target.value)})} placeholder="0.00" />
              </div>

              {monthlyEffort > 0 && (
                <div className="p-6 bg-blue-50 rounded-[1.5rem] border border-blue-100 flex items-center justify-between animate-in slide-in-from-top duration-300">
                  <div className="flex items-center space-x-3 text-blue-600">
                    <TrendingUp size={24} />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest">Effort d'épargne mensuel</span>
                      <span className="text-lg font-black tracking-tight">{Math.ceil(monthlyEffort).toLocaleString('fr-FR')}€ / mois</span>
                    </div>
                  </div>
                  <Check size={20} className="text-blue-400" />
                </div>
              )}
              
              <div className="flex space-x-4 mt-8">
                <button type="button" onClick={() => { setShowForm(null); setEditingGoal(null); }} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all">Annuler</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl uppercase text-[10px] tracking-widest active:scale-95 transition-transform">Enregistrer</button>
              </div>
            </form>

            {showForm === 'edit' && editingGoal && (
              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center">
                <button 
                  type="button" 
                  onClick={() => { confirmDelete(editingGoal, 'goal'); setShowForm(null); }}
                  className="w-full py-4 bg-rose-50 text-rose-500 hover:bg-rose-100 font-black rounded-2xl uppercase text-[10px] tracking-widest border border-rose-100 flex items-center justify-center transition-all active:scale-95 shadow-sm"
                >
                  <Trash2 size={16} className="mr-2" /> Supprimer cet objectif
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
