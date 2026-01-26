
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { AppContextType, SavingsGoal } from '../types';
import { Plus, Target, Award, ArrowRight, Pause, Play, Edit2, Trash2, X, Check, Calendar } from 'lucide-react';
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
      addGoal({ ...formData as SavingsGoal, id: Date.now().toString(), milestonesReached: [], isReached: (formData.currentAmount || 0) >= (formData.targetAmount || 1), isPaused: false });
    } else if (showForm === 'edit' && editingGoal) {
      updateGoal({ ...editingGoal, ...formData } as SavingsGoal);
    }
    setShowForm(null);
    setEditingGoal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Défis d'Épargne 🎯</h2>
        <button onClick={handleOpenAdd} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-2xl shadow-xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all">Nouvel Objectif</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {goals.map((goal:any) => {
          const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          return (
            <div key={goal.id} className={`group relative p-8 rounded-[2.5rem] border border-slate-100 shadow-xl transition-all ${goal.isReached ? 'bg-emerald-50 border-emerald-100 shadow-emerald-100' : goal.isPaused ? 'bg-slate-50 opacity-80 shadow-none' : 'bg-white'}`}>
              <div className="absolute top-6 right-6 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenEdit(goal)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => updateGoal({ ...goal, isPaused: !goal.isPaused })} className="p-2 text-slate-400 hover:text-amber-500 transition-colors">{goal.isPaused ? <Play size={16} /> : <Pause size={16} />}</button>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl bg-slate-50 shadow-inner relative">{goal.icon}</div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">{goal.name}</h3>
                <div className="relative w-44 h-44">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-slate-100 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                    <circle stroke={goal.isReached ? '#10b981' : goal.isPaused ? '#94a3b8' : goal.color} strokeWidth="8" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * progress) / 100} strokeLinecap="round" fill="transparent" r="40" cx="50" cy="50" transform="rotate(-90 50 50)" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in duration-500"><span className="text-4xl font-black text-slate-900 tracking-tighter">{progress}%</span></div>
                </div>
                <div className="w-full bg-slate-50/50 p-4 rounded-2xl space-y-2 border border-slate-100/50">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-slate-400">Économisé</span><span className="text-slate-900">{goal.currentAmount.toLocaleString()}€</span></div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-slate-400">Cible</span><span className="text-slate-900">{goal.targetAmount.toLocaleString()}€</span></div>
                </div>
                {goal.deadline && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center"><Calendar size={12} className="mr-1" /> {goal.deadline}</p>}
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
                <input type="text" required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 transition-all uppercase" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="ex: Voyage" />
              </div>
              <IconPicker value={formData.icon || '🎯'} onChange={(icon) => setFormData({ ...formData, icon })} />
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Couleur</label>
                  <input type="color" className="w-full h-14 p-1 bg-slate-50 border-2 border-transparent rounded-2xl outline-none" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compte de rattachement</label>
                  <select className="w-full px-5 h-14 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 transition-all uppercase appearance-none" value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})}>
                    <option value="">Sélectionner le compte...</option>
                    {accounts.map((a:any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant Cible (€)</label>
                  <input type="number" required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-blue-500 outline-none" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: Number(e.target.value)})} placeholder="Cible" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Épargne actuelle (€)</label>
                  <input type="number" required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-500 outline-none" value={formData.currentAmount} onChange={e => setFormData({...formData, currentAmount: Number(e.target.value)})} placeholder="Actuel" />
                </div>
              </div>
              
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
                  <Trash2 size={16} className="mr-2" /> Supprimer ce projet
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
