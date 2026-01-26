
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { AppContextType, CreditCard } from '../types';
import { CreditCard as CardIcon, Plus, Trash2, Edit2, X } from 'lucide-react';
import IconPicker from './IconPicker';

const Cards: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const { cards, accounts, addCard, updateCard, confirmDelete } = context;
  
  const [showForm, setShowForm] = useState<'add' | 'edit' | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [formData, setFormData] = useState<Partial<CreditCard>>({
    name: '', icon: '💳', color: '#1e293b', accountId: accounts[0]?.id || ''
  });

  const handleOpenAdd = () => {
    setFormData({ name: '', icon: '💳', color: '#1e293b', accountId: accounts[0]?.id || '' });
    setShowForm('add');
    setEditingCard(null);
  };

  const handleOpenEdit = (card: CreditCard) => {
    setEditingCard(card);
    setFormData(card);
    setShowForm('edit');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.accountId) return;
    
    if (showForm === 'add') {
      addCard({ ...formData as CreditCard, id: Date.now().toString() });
    } else if (showForm === 'edit' && editingCard) {
      updateCard({ ...editingCard, ...formData } as CreditCard);
    }
    setShowForm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Mes Cartes Bancaires</h2>
        <button onClick={handleOpenAdd} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-2xl shadow-lg font-black uppercase text-[10px] tracking-widest flex items-center hover:scale-[1.02] transition-transform active:scale-95"><Plus size={18} className="mr-2" /> Ajouter une Carte</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.map((card: CreditCard) => (
          <div key={card.id} className="relative aspect-[1.6/1] rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden group transition-all hover:-translate-y-2" style={{ backgroundColor: card.color }}>
            <div className="h-full flex flex-col justify-between relative z-10">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-md shadow-inner">{card.icon}</div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] bg-white/20 px-4 py-1.5 rounded-xl backdrop-blur-md border border-white/20">Visa Premium</span>
              </div>
              <div>
                <p className="text-xl font-black tracking-tight mb-1 uppercase">{card.name}</p>
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Compte : {accounts.find((a:any) => String(a.id) === String(card.accountId))?.name}</p>
                  <button onClick={() => handleOpenEdit(card)} className="p-3 bg-white/20 rounded-2xl hover:bg-white/40 transition-all active:scale-90 shadow-lg border border-white/10 opacity-0 group-hover:opacity-100"><Edit2 size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-200 flex flex-col border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{showForm === 'add' ? 'Nouvelle Carte' : 'Paramètres Carte'}</h3>
              <button onClick={() => setShowForm(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom de la carte</label>
                <input type="text" required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 transition-all uppercase" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="ex: VISA GOLD" />
              </div>
              <IconPicker value={formData.icon || '💳'} onChange={(icon) => setFormData({ ...formData, icon })} />
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Couleur visuelle</label>
                  <input type="color" className="w-full h-14 p-1 bg-slate-50 border-2 border-transparent rounded-2xl outline-none" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compte de rattachement</label>
                  <select className="w-full px-5 h-14 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 transition-all uppercase appearance-none" value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})}>
                    <option value="">Sélectionner un compte...</option>
                    {accounts.map((a:any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-4 mt-8">
                <button type="button" onClick={() => setShowForm(null)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all">Annuler</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl uppercase text-[10px] tracking-widest active:scale-95 transition-transform">Enregistrer</button>
              </div>
            </form>

            {showForm === 'edit' && editingCard && (
              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center">
                <button 
                  type="button" 
                  onClick={() => {
                    confirmDelete(editingCard, 'card');
                    setShowForm(null);
                  }}
                  className="w-full py-4 bg-rose-50 text-rose-500 hover:bg-rose-100 font-black rounded-2xl uppercase text-[10px] tracking-widest border border-rose-100 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  <Trash2 size={16} className="mr-2" /> Supprimer cette carte
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cards;
