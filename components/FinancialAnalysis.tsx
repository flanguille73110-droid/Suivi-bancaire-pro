
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../App';
import { Transaction, Category, BankAccount } from '../types';
import { BarChart3, TrendingUp, TrendingDown, Filter, Calendar, X, Search, RotateCcw } from 'lucide-react';

const FinancialAnalysis: React.FC = () => {
  const context = useContext(AppContext) as any;
  const { transactions, accounts, categories } = context;

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categoryId: '',
    subCategory: '',
    month: '', // Format "0" à "11"
    year: '',   // Format "YYYY"
    startDate: '',
    endDate: '',
    amount: '',
    type: '' // '', 'REVENUE', 'EXPENSE'
  });

  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  // Trouver le compte principal
  const principalAccount = accounts.find((a: BankAccount) => a.isPrincipal);

  // Extraire les années uniques présentes dans les transactions pour le filtre
  const availableYears = useMemo(() => {
    const years = transactions.map((t: Transaction) => new Date(t.date).getFullYear().toString());
    return Array.from(new Set(years)).sort((a: string, b: string) => b.localeCompare(a));
  }, [transactions]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const getMonthName = (dateStr: string) => {
    const date = new Date(dateStr);
    return months[date.getMonth()];
  };

  const getYear = (dateStr: string) => {
    return new Date(dateStr).getFullYear();
  };

  // LOGIQUE DE FILTRAGE MULTI-CRITÈRES
  const filteredData = useMemo(() => {
    if (!principalAccount) return [];

    return transactions.filter((t: Transaction) => {
      // 1. Filtrer par compte principal obligatoirement
      const isFromPrincipal = String(t.sourceAccountId) === String(principalAccount.id) || 
                              String(t.destinationAccountId) === String(principalAccount.id);
      if (!isFromPrincipal) return false;

      const tDate = new Date(t.date);
      const tDateStr = t.date; // YYYY-MM-DD

      // 2. Filtre par Catégorie
      if (filters.categoryId && String(t.categoryId) !== String(filters.categoryId)) return false;

      // 3. Filtre par Sous-catégorie
      if (filters.subCategory && t.subCategory !== filters.subCategory) return false;

      // 4. Filtre par Mois
      if (filters.month !== '' && tDate.getMonth().toString() !== filters.month) return false;

      // 5. Filtre par Année
      if (filters.year && tDate.getFullYear().toString() !== filters.year) return false;

      // 6. Filtre par Date de début
      if (filters.startDate && tDateStr < filters.startDate) return false;

      // 7. Filtre par Date de fin
      if (filters.endDate && tDateStr > filters.endDate) return false;

      // 8. Filtre par Montant (Revenu ou Dépense)
      if (filters.amount !== '') {
        const amt = parseFloat(filters.amount);
        if (Math.abs(t.revenue - amt) > 0.001 && Math.abs(t.expense - amt) > 0.001) return false;
      }

      // 9. Filtre par Type (Revenu ou Dépense)
      if (filters.type === 'REVENUE' && t.revenue <= 0) return false;
      if (filters.type === 'EXPENSE' && t.expense <= 0) return false;

      return true;
    }).sort((a: Transaction, b: Transaction) => b.date.localeCompare(a.date));
  }, [transactions, principalAccount, filters]);

  // CALCUL DES STATS SUR LES DONNÉES FILTRÉES
  const stats = useMemo(() => {
    const totalRevenue = filteredData.reduce((sum: number, t: Transaction) => sum + (t.revenue || 0), 0);
    const totalExpense = filteredData.reduce((sum: number, t: Transaction) => sum + (t.expense || 0), 0);
    return { totalRevenue, totalExpense, balance: totalRevenue - totalExpense };
  }, [filteredData]);

  const resetFilters = () => {
    setFilters({ 
      categoryId: '', 
      subCategory: '', 
      month: '', 
      year: '',
      startDate: '',
      endDate: '',
      amount: '',
      type: ''
    });
  };

  const isFilterActive = filters.categoryId || filters.subCategory || filters.month !== '' || filters.year || 
                        filters.startDate || filters.endDate || filters.amount !== '' || filters.type !== '';

  if (!principalAccount) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <BarChart3 size={64} strokeWidth={1} className="mb-4" />
        <p className="font-bold">Aucun compte principal défini.</p>
        <p className="text-xs uppercase tracking-widest mt-2">Veuillez configurer un compte principal dans l'onglet Comptes.</p>
      </div>
    );
  }

  const selectedCategory = categories.find((c: Category) => String(c.id) === String(filters.categoryId));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Barre d'outils et Bouton Filtre */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center">
            Analyse financière
            {isFilterActive && <span className="ml-3 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center">
            <Filter size={12} className="mr-1" /> {principalAccount.name} • {filteredData.length} résultats
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {isFilterActive && (
            <button 
              onClick={resetFilters}
              className="px-4 py-3 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center"
            >
              <RotateCcw size={14} className="mr-2" /> Réinitialiser
            </button>
          )}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center bg-gradient-to-r from-blue-500 to-pink-500 text-white"
          >
            {showFilters ? <X size={16} className="mr-2" /> : <Search size={16} className="mr-2" />}
            {showFilters ? 'Fermer la recherche' : 'Rechercher / Filtrer'}
          </button>
        </div>
      </div>

      {/* Formulaire de filtres dynamique avec layout réorganisé */}
      {showFilters && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-50 shadow-2xl animate-in slide-in-from-top duration-300 space-y-6">
          {/* 1ère ligne : Date de début, Catégorie, Mois, Montant */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date début</label>
              <input 
                type="date"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none font-bold focus:border-blue-500 transition-all"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none font-bold focus:border-blue-500 transition-all"
                value={filters.categoryId}
                onChange={(e) => setFilters({...filters, categoryId: e.target.value, subCategory: ''})}
              >
                <option value="">Toutes les catégories</option>
                {categories.map((c: Category) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mois</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none font-bold focus:border-blue-500 transition-all"
                value={filters.month}
                onChange={(e) => setFilters({...filters, month: e.target.value})}
              >
                <option value="">Toute l'année</option>
                {months.map((m, idx) => <option key={m} value={idx.toString()}>{m}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant (€)</label>
              <input 
                type="number"
                step="0.01"
                placeholder="Ex: 50.00"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none font-bold focus:border-blue-500 transition-all"
                value={filters.amount}
                onChange={(e) => setFilters({...filters, amount: e.target.value})}
              />
            </div>
          </div>

          {/* 2eme ligne : Date de fin , Sous catégories, Année, Critère revenu ou dépense */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date fin</label>
              <input 
                type="date"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none font-bold focus:border-blue-500 transition-all"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sous-catégorie</label>
              <select 
                disabled={!filters.categoryId}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none font-bold focus:border-blue-500 transition-all disabled:opacity-50"
                value={filters.subCategory}
                onChange={(e) => setFilters({...filters, subCategory: e.target.value})}
              >
                <option value="">Toutes</option>
                {selectedCategory?.subCategories.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Année</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none font-bold focus:border-blue-500 transition-all"
                value={filters.year}
                onChange={(e) => setFilters({...filters, year: e.target.value})}
              >
                <option value="">Toutes</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type d'opération</label>
              <select 
                className={`w-full px-4 py-3 border-2 border-transparent rounded-xl outline-none font-bold transition-all ${filters.type === 'REVENUE' ? 'bg-emerald-50 text-emerald-700 focus:border-emerald-500' : filters.type === 'EXPENSE' ? 'bg-rose-50 text-rose-700 focus:border-rose-500' : 'bg-slate-50 focus:border-blue-500'}`}
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
              >
                <option value="">Tout (Revenu & Dépense)</option>
                <option value="REVENUE">Revenu uniquement</option>
                <option value="EXPENSE">Dépense uniquement</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Header Statistique - RECALCULÉ DYNAMIQUEMENT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Revenus Filtrés</p>
            <h3 className="text-2xl font-black text-emerald-500 mt-1">+{stats.totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dépenses Filtrées</p>
            <h3 className="text-2xl font-black text-rose-500 mt-1">-{stats.totalExpense.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
            <TrendingDown size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-[2rem] shadow-xl text-white flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-blue-100/70 uppercase tracking-[0.2em]">Résultat du filtre</p>
            <h3 className="text-2xl font-black mt-1">{stats.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</h3>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center shadow-inner">
            <BarChart3 size={24} />
          </div>
        </div>
      </div>

      {/* Tableau d'analyse - FILTRÉ */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-50 text-slate-500 uppercase font-black tracking-[0.15em]">
              <tr>
                <th className="px-6 py-6">Date</th>
                <th className="px-6 py-6">Catégorie</th>
                <th className="px-6 py-6">Sous-catégorie</th>
                <th className="px-6 py-6 text-right">Revenus</th>
                <th className="px-6 py-6 text-right">Dépenses</th>
                <th className="px-6 py-6 text-center">Mois</th>
                <th className="px-6 py-6 text-center">Année</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.length > 0 ? filteredData.map((t: Transaction) => {
                const cat = categories.find((c: Category) => String(c.id) === String(t.categoryId));
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap text-slate-400 font-bold">
                      <div className="flex items-center space-x-2">
                         <Calendar size={12} className="text-slate-300" />
                         <span>{formatDateDisplay(t.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl drop-shadow-sm">{cat?.icon || '📦'}</span>
                        <span className="font-black text-slate-800 uppercase tracking-tighter">{cat?.name || 'Virement'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-400 uppercase font-medium tracking-tight">
                      {t.subCategory || '-'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {t.revenue > 0 ? (
                        <span className="font-black text-emerald-500 text-sm">+{t.revenue.toFixed(2)}€</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {t.expense > 0 ? (
                        <span className="font-black text-rose-500 text-sm">-{t.expense.toFixed(2)}€</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full font-black uppercase tracking-widest text-[9px]">
                        {getMonthName(t.date)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-black uppercase tracking-widest text-[9px] border border-blue-100">
                        {getYear(t.date)}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-300 font-bold italic">
                    Aucune transaction ne correspond à vos critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalysis;
