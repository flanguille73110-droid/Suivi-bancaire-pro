
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { AppContextType, Category, TransactionType } from '../types';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import IconPicker from './IconPicker';

const CategoriesView: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const { categories, addCategory, confirmDelete, updateCategory } = context;
  const [showForm, setShowForm] = useState<'add' | 'edit' | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [newSubName, setNewSubName] = useState<string>("");
  const [activeSubInput, setActiveSubInput] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Category>>({
    name: '', icon: '📁', color: '#64748b', subCategories: [], type: TransactionType.EXPENSE
  });

  const handleOpenAdd = () => {
    setFormData({ name: '', icon: '📁', color: '#64748b', subCategories: [], type: TransactionType.EXPENSE });
    setShowForm('add');
    setEditingCat(null);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCat(cat);
    setFormData({ ...cat });
    setShowForm('edit');
  };

  const handleAddSub = (cat: Category) => {
    if (!newSubName.trim()) return;
    const updatedSubs = [...cat.subCategories, newSubName.trim()].sort((a: string, b: string) => a.localeCompare(b));
    updateCategory({ ...cat, subCategories: updatedSubs });
    setNewSubName("");
    setActiveSubInput(null);
  };

  const handleRemoveSub = (cat: Category, subName: string) => {
    const filteredSubs = cat.subCategories.filter((s: string) => s !== subName);
    updateCategory({ ...cat, subCategories: filteredSubs });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    if (showForm === 'add') {
      addCategory({ ...formData as Category, id: Date.now().toString(), subCategories: formData.subCategories || [] });
    } else if (showForm === 'edit' && editingCat) {
      updateCategory({ ...editingCat, ...formData } as Category);
    }
    setShowForm(null);
    setEditingCat(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Gestion des Catégories</h2>
        <button onClick={handleOpenAdd} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-2xl shadow-xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center">
          <Plus size={18} className="mr-2" /> Nouvelle Catégorie
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat: Category) => (
          <div key={cat.id} className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner uppercase" style={{ backgroundColor: cat.color + '20' }}>{cat.icon}</div>
                <div>
                  <h3 className="font-bold text-slate-800 tracking-tight uppercase">{cat.name}</h3>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${cat.type === 'REVENUE' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                    {cat.type === 'REVENUE' ? 'Revenu' : 'Dépense'}
                  </span>
                </div>
              </div>
              <button onClick={() => handleOpenEdit(cat)} className="px-3 py-2 bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all font-black text-[10px] uppercase tracking-tighter border border-slate-100">
                <Edit2 size={12} className="inline mr-1" /> Éditer
              </button>
            </div>
            
            <div className="flex-1 px-6 pb-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sous-catégories</p>
                {activeSubInput === cat.id ? (
                  <div className="flex items-center space-x-1 animate-in slide-in-from-right duration-200">
                    <input autoFocus type="text" className="text-xs border-2 border-blue-200 rounded-xl px-3 py-1.5 outline-none w-28 font-bold" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSub(cat)}/>
                    <button onClick={() => handleAddSub(cat)} className="p-1.5 text-white bg-emerald-500 rounded-lg shadow-sm"><Check size={14}/></button>
                  </div>
                ) : (
                  <button onClick={() => setActiveSubInput(cat.id)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"><Plus size={12} className="inline mr-1" /> AJOUTER</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {cat.subCategories.map((sub: string) => (
                  <div key={`${cat.id}-${sub}`} className="flex items-center bg-slate-50 text-slate-700 rounded-xl text-[10px] font-black border border-slate-100 overflow-hidden uppercase tracking-tight">
                    <span className="px-3 py-2 border-r border-slate-100">{sub}</span>
                    <button onClick={() => handleRemoveSub(cat, sub)} className="p-2 text-slate-400 hover:text-white hover:bg-rose-500 transition-all"><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-200 relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{showForm === 'add' ? 'Nouvelle Catégorie' : 'Modifier Catégorie'}</h3>
              <button onClick={() => { setShowForm(null); setEditingCat(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                  <select className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 uppercase" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}>
                    <option value={TransactionType.EXPENSE}>Dépense</option>
                    <option value={TransactionType.REVENUE}>Revenu</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom</label>
                  <input type="text" required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold focus:border-blue-500 uppercase" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="ex: Shopping" />
                </div>
              </div>
              <IconPicker value={formData.icon || '📁'} onChange={(icon) => setFormData({ ...formData, icon })} />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Couleur</label>
                <input type="color" className="w-full h-14 p-1 border-2 border-slate-100 rounded-2xl bg-white" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
              </div>
              
              <div className="flex space-x-3 mt-8">
                <button type="button" onClick={() => { setShowForm(null); setEditingCat(null); }} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest border border-slate-100 rounded-2xl hover:bg-slate-50">Annuler</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl uppercase text-[10px] tracking-widest active:scale-95 transition-transform">Enregistrer</button>
              </div>
            </form>

            {showForm === 'edit' && editingCat && (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { confirmDelete(editingCat, 'category'); setShowForm(null); }}
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

export default CategoriesView;
