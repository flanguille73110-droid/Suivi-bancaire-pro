
import React, { useContext } from 'react';
import { AppContext } from '../App';
import { AppContextType, BankAccount, RecurringTransaction } from '../types';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  ChevronRight
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const { accounts, goals, transactions, recurring } = context;

  const getCalculatedBalance = (acc: BankAccount) => {
    const accTransactions = transactions.filter(t => t.sourceAccountId === acc.id || t.destinationAccountId === acc.id);
    return accTransactions.reduce((accSum, t) => {
      if (t.sourceAccountId === acc.id) return accSum + (t.revenue - t.expense);
      if (t.destinationAccountId === acc.id) return accSum + t.expense;
      return accSum;
    }, acc.initialBalance);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + getCalculatedBalance(acc), 0);

  const activeAlerts = context.budgets.filter(b => {
    const categoryTransactions = transactions.filter(t => t.categoryId === b.categoryId && new Date(t.date).getMonth() === new Date().getMonth());
    const spent = categoryTransactions.reduce((sum, t) => sum + t.expense, 0);
    return spent >= b.amount * 0.8;
  });

  // Fonction pour formater la date de l'échéance au format JJ/MM
  const formatRecurringDate = (startDateStr: string) => {
    const date = new Date(startDateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-10 rounded-[3rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-pink-500 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="relative z-10">
            <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.3em]">Patrimoine Financier Global</p>
            <h2 className="text-6xl font-black mt-4 tracking-tighter tabular-nums">
              {totalBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}<span className="text-3xl ml-1">€</span>
            </h2>
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {accounts.map(acc => {
                const calcBalance = getCalculatedBalance(acc);
                return (
                  <div key={acc.id} className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 hover:bg-white/20 transition-all cursor-pointer">
                    <p className="text-[9px] font-black text-white/60 uppercase truncate">{acc.name}</p>
                    <p className="font-black text-sm mt-1">{calcBalance.toLocaleString('fr-FR')}€</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-800 uppercase tracking-tight">Objectifs Prioritaires</h3>
              <TrendingUp className="text-pink-500" size={24} />
            </div>
            <div className="space-y-6">
              {goals.slice(0, 3).map(goal => (
                <div key={goal.id} className="group">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                    <span className="text-slate-400 group-hover:text-blue-500 transition-colors">{goal.name}</span>
                    <span className="text-slate-900">{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-pink-500 shadow-lg shadow-pink-200" 
                      style={{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {goals.length === 0 && <p className="text-slate-400 text-sm italic py-8 text-center">Aucun objectif en cours</p>}
            </div>
          </div>
          <button 
            className="mt-8 flex items-center justify-center space-x-2 text-blue-600 text-xs font-black uppercase tracking-widest hover:text-blue-700 transition-colors"
            onClick={() => context.setActiveTab('objectifs')}
          >
            <span>Gérer l'épargne</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 uppercase tracking-tight">Alertes Budgétaires</h3>
            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><AlertTriangle size={20} /></div>
          </div>
          <div className="space-y-4">
            {activeAlerts.length > 0 ? activeAlerts.map(alert => {
              const cat = context.categories.find(c => c.id === alert.categoryId);
              return (
                <div key={alert.id} className="flex items-center p-5 bg-gradient-to-r from-amber-50 to-white border border-amber-100 rounded-3xl group hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mr-4 text-2xl group-hover:scale-110 transition-transform">
                    {cat?.icon || '⚠️'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{cat?.name || 'Budget'}</p>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Seuil de vigilance atteint</p>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-12 space-y-3">
                 <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck size={32} />
                 </div>
                 <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Tous les voyants sont au vert</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 uppercase tracking-tight">Echéances imminentes</h3>
            <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><Clock size={20} /></div>
          </div>
          <div className="space-y-4">
            {recurring.length > 0 ? recurring.slice(0, 4).map(rec => (
              <div key={rec.id} className="flex items-center justify-between p-5 hover:bg-slate-50 rounded-3xl transition-all border border-transparent hover:border-slate-100">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mr-4">
                    <Clock size={18} className="text-slate-400" />
                  </div>
                  <div>
                    {/* Affichage de la sous-catégorie en gras et majuscules */}
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[120px]">
                      {rec.subCategory || 'Général'}
                    </p>
                    {/* Affichage de la date au format JJ/MM */}
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {formatRecurringDate(rec.startDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                   <p className={`text-lg font-black ${rec.type === 'REVENUE' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {rec.type === 'REVENUE' ? '+' : '-'}{rec.amount}€
                   </p>
                </div>
              </div>
            )) : (
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest text-center py-12">Aucun contrat récurrent</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
