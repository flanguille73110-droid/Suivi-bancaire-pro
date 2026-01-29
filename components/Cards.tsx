
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { AppContextType, CreditCard, Transaction } from '../types';
import { Plus, Trash2, Edit2, X, ArrowLeft, Calendar, Tag, CreditCard as CardIcon, CreditCard as CardIconLucide, TrendingDown, Clock, ArrowUpDown } from 'lucide-react';
import IconPicker from './IconPicker';

const Cards: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const { cards, accounts, transactions, categories, addCard, updateCard, confirmDelete } = context;
  
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<'add' | 'edit' | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [formData, setFormData] = useState<Partial<CreditCard>>({
    name: '', icon: '💳', color: '#1e293b', accountId: accounts[0]?.id || ''
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const getCardMonthlyTotal = (cardName: string) => {
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.paymentMethod === `Carte: ${cardName}` && 
               tDate.getMonth() === currentMonth && 
               tDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.expense, 0);
  };

  const selectedCard = useMemo(() => 
    cards.find(c => String(c.id) === String(selectedCardId)),
    [cards, selectedCardId]
  );

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCardTransactions = useMemo(() => {
    if (!selectedCard) return [];
    let items = transactions.filter(t => t.paymentMethod === `Carte: ${selectedCard.name}`);
    
    items.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortConfig.key === 'categoryId') {
        valA = categories.find(c => String(c.id) === String(a.categoryId))?.name || '';
        valB = categories.find(c => String(c.id) === String(b.categoryId))?.name || '';
      } else if (sortConfig.key === 'amount') {
        valA = a.expense || -a.revenue;
        valB = b.expense || -b.revenue;
      } else if (sortConfig.key === 'description') {
        valA = a.description.toLowerCase();
        valB = b.description.toLowerCase();
      } else if (sortConfig.key === 'subCategory') {
        valA = (a.subCategory || '').toLowerCase();
        valB = (b.subCategory || '').toLowerCase();
      } else {
        valA = (a as any)[sortConfig.key];
        valB = (b as any)[sortConfig.key];
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [transactions, selectedCard, sortConfig, categories]);

  const totalCardsOutstanding = useMemo(() => {
    return transactions.reduce((sum, t) => {
      const tDate = new Date(t.date);
      if (t.paymentMethod.startsWith('Carte:') && 
          tDate.getMonth() === currentMonth && 
          tDate.getFullYear() === currentYear) {
        return sum + t.expense;
      }
      return sum;
    }, 0);
  }, [transactions]);

  const currentMonthTotal = useMemo(() => {
    if (!selectedCard) return 0;
    return getCardMonthlyTotal(selectedCard.name);
  }, [selectedCard, transactions]);

  const handleOpenAdd = () => {
    setFormData({ name: '', icon: '💳', color: '#1e293b', accountId: accounts[0]?.id || '' });
    setShowForm('add');
    setEditingCard(null);
  };

  const handleOpenEdit = (e: React.MouseEvent, card: CreditCard) => {
    e.stopPropagation();
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

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  if (selectedCardId && selectedCard) {
    return (
      <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-20">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedCardId(null)} 
            className="text-[10px] font-black text-slate-400 hover:text-blue-500 flex items-center bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 uppercase tracking-widest transition-all"
          >
            <ArrowLeft size={16} className="mr-2" /> Retour aux cartes
          </button>
          
          <div className="flex items-center space-x-4 bg-white px-8 py-3 rounded-[2rem] border border-slate-100 shadow-sm">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl text-white shadow-lg" style={{ backgroundColor: selectedCard.color }}>
                {selectedCard.icon}
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">{selectedCard.name}</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                   Journal des dépenses carte
                </p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-pink-500 p-8 rounded-[3rem] shadow-xl border border-white/10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                <Clock size={80} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-4">EN-COURS CARTE</p>
              <div className="flex items-end space-x-2">
                <h3 className="text-4xl font-black tracking-tighter tabular-nums">
                   {currentMonthTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                   <span className="text-xl ml-1 text-white/60">€</span>
                </h3>
              </div>
              <div className="mt-4 flex items-center space-x-2 text-white/80 font-black uppercase text-[9px] tracking-widest">
                <TrendingDown size={12} />
                <span>En-cours</span>
              </div>
           </div>
           
           <div className="md:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex items-center space-x-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                 <CardIconLucide size={32} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Rappel Mode de paiement</p>
                 <p className="text-sm font-bold text-slate-700 leading-relaxed uppercase">
                    Utilisez le mode <span className="text-blue-600">"Carte: {selectedCard.name}"</span> lors de la saisie de vos transactions pour alimenter ce tableau.
                 </p>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden max-h-[700px] overflow-y-auto custom-table-scroll">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] relative border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase font-black tracking-widest border-b border-slate-100 sticky top-0 z-20 shadow-sm">
                <tr>
                  <SortHeader label="Date" active={sortConfig.key === 'date'} onClick={() => requestSort('date')} className="px-8 py-4" />
                  <SortHeader label="Catégorie" active={sortConfig.key === 'categoryId'} onClick={() => requestSort('categoryId')} className="px-6 py-4" />
                  <SortHeader label="Sous-catégorie" active={sortConfig.key === 'subCategory'} onClick={() => requestSort('subCategory')} className="px-6 py-4" />
                  <SortHeader label="Descriptif" active={sortConfig.key === 'description'} onClick={() => requestSort('description')} className="px-6 py-4" />
                  <SortHeader label="Montant" active={sortConfig.key === 'amount'} onClick={() => requestSort('amount')} className="px-8 py-4 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedCardTransactions.length > 0 ? sortedCardTransactions.map((t) => {
                  const cat = categories.find(c => String(c.id) === String(t.categoryId));
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5 whitespace-nowrap text-slate-400 font-bold">
                        <div className="flex items-center space-x-2">
                           <Calendar size={12} className="text-slate-300" />
                           <span>{formatDateDisplay(t.date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                           <span className="text-lg">{cat?.icon || '📦'}</span>
                           <span className="font-black text-slate-700 uppercase tracking-tighter">{cat?.name || 'Virement'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-slate-400 uppercase font-bold">{t.subCategory || '-'}</td>
                      <td className="px-6 py-5 text-slate-600 font-medium truncate max-w-[250px] italic">{t.description}</td>
                      <td className={`px-8 py-5 text-right font-black text-sm ${t.expense > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {t.expense > 0 ? `-${t.expense.toFixed(2)}€` : `+${t.revenue.toFixed(2)}€`}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-bold italic">
                      Aucune transaction trouvée pour cette carte.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Mes Cartes Bancaires</h2>
        <button onClick={handleOpenAdd} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-2xl shadow-lg font-black uppercase text-[10px] tracking-widest flex items-center hover:scale-[1.02] transition-transform active:scale-95"><Plus size={18} className="mr-2" /> Ajouter une Carte</button>
      </div>

      <div className="mb-8">
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-pink-500 p-8 rounded-[3rem] shadow-xl border border-white/10 text-white relative overflow-hidden group max-w-md mx-auto">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
              <Clock size={80} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-4">TOTAL EN COURS DES CARTES</p>
            <div className="flex items-end space-x-2">
              <h3 className="text-4xl font-black tracking-tighter tabular-nums">
                 {totalCardsOutstanding.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                 <span className="text-xl ml-1 text-white/60">€</span>
              </h3>
            </div>
            <div className="mt-4 flex items-center space-x-2 text-white/80 font-black uppercase text-[9px] tracking-widest">
              <TrendingDown size={12} />
              <span>Global mois en cours</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.map((card: CreditCard) => {
          const monthlyTotal = getCardMonthlyTotal(card.name);
          return (
            <div 
              key={card.id} 
              onClick={() => setSelectedCardId(card.id)}
              className="relative cursor-pointer aspect-[1.6/1] rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden group transition-all hover:-translate-y-2" 
              style={{ backgroundColor: card.color }}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <div className="h-full flex flex-col justify-between relative z-10">
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-md shadow-inner">{card.icon}</div>
                  <div className="text-right">
                    <span className="block text-[10px] font-black uppercase tracking-[0.25em] bg-white/20 px-4 py-1.5 rounded-xl backdrop-blur-md border border-white/20 mb-2">Visa Premium</span>
                    <div className="bg-black/20 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 animate-in slide-in-from-right duration-300">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/60 mb-1 text-left">En-cours</p>
                      <p className="text-sm font-black tracking-tighter tabular-nums">{monthlyTotal.toLocaleString('fr-FR')}€</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xl font-black tracking-tight mb-1 uppercase">{card.name}</p>
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Compte : {accounts.find((a:any) => String(a.id) === String(card.accountId))?.name}</p>
                    <div className="flex space-x-2">
                      <button 
                        onClick={(e) => handleOpenEdit(e, card)} 
                        className="p-3 bg-white/20 rounded-2xl hover:bg-white/40 transition-all active:scale-90 shadow-lg border border-white/10 opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto">
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

const SortHeader: React.FC<{ label: string, active?: boolean, onClick: () => void, className?: string }> = ({ label, active, onClick, className }) => (
  <th className={`cursor-pointer hover:bg-slate-100/50 transition-all border-b ${className || ''}`} onClick={onClick}>
    <div className={`flex items-center space-x-1 ${className?.includes('right') ? 'justify-end' : className?.includes('center') ? 'justify-center' : ''}`}>
      <span className="whitespace-nowrap">{label}</span>
      <ArrowUpDown size={10} className={active ? 'text-blue-500' : 'text-slate-300'} />
    </div>
  </th>
);

export default Cards;
