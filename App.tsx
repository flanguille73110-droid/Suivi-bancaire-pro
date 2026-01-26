
import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard as CardIcon, 
  Tag, 
  ArrowRightLeft, 
  Repeat, 
  PieChart, 
  Target, 
  Download,
  Upload,
  Plus,
  Settings,
  Menu,
  X,
  BookOpen,
  Code2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { 
  BankAccount, 
  Transaction, 
  Category, 
  CreditCard, 
  RecurringTransaction, 
  Budget, 
  SavingsGoal, 
  TransactionType,
  ReconciliationMarker,
  Frequency,
  AppContextType
} from './types';

const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Alimentation', icon: '🛒', color: '#ef4444', subCategories: ['Supermarché', 'Restaurant'], type: TransactionType.EXPENSE },
  { id: '2', name: 'Salaire', icon: '💰', color: '#10b981', subCategories: ['Employeur', 'Prime'], type: TransactionType.REVENUE },
  { id: '3', name: 'Logement', icon: '🏠', color: '#3b82f6', subCategories: ['Loyer', 'Électricité'], type: TransactionType.EXPENSE },
];

const INITIAL_ACCOUNTS: BankAccount[] = [
  { id: 'main', name: 'Compte Principal', icon: '🏦', color: '#6366f1', initialBalance: 1500, isPrincipal: true, bankBalanceManual: 1500, cardOutstandingManual: 0 },
  { id: 'livreta', name: 'Livret A', icon: '🐷', color: '#f59e0b', initialBalance: 5000, isPrincipal: false, bankBalanceManual: 5000, cardOutstandingManual: 0 },
];

export const AppContext = createContext<AppContextType | null>(null);

const Layout: React.FC<{ children: React.ReactNode, activeTab: string, setTab: (t: string) => void }> = ({ children, activeTab, setTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Comptes', icon: Wallet },
    { id: 'cards', label: 'Cartes', icon: CardIcon },
    { id: 'categories', label: 'Catégories', icon: Tag },
    { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
    { id: 'recurring', label: 'Récurrentes', icon: Repeat },
    { id: 'financial-analysis', label: 'Analyse financière', icon: BarChart3 },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'goals', label: 'Objectifs', icon: Target },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'import', label: 'Import Excel', icon: Upload },
    { id: 'notice', label: 'Notice', icon: BookOpen },
    { id: 'code', label: 'Code Source', icon: Code2 },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {!isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(true)} />}
      <aside className={`fixed md:relative z-30 flex flex-col w-64 h-full transition-transform duration-300 transform bg-white border-r border-slate-200 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-pink-600 text-white shadow-lg">
          <span className="text-xl font-bold tracking-tight">Suivi Bancaire</span>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden"><X size={20} /></button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto border-t border-slate-100">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`flex items-center w-full px-4 py-3 text-sm font-bold transition-all rounded-xl ${activeTab === item.id ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg shadow-pink-200' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <item.icon className="mr-3" size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 md:hidden"><Menu size={24} /></button>
          <div className="flex items-center space-x-4"><h1 className="text-xl font-semibold capitalize">{activeTab.replace('-', ' ')}</h1></div>
          <div className="flex items-center space-x-3">
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"><Settings size={20} /></button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-pink-400" />
          </div>
        </header>
        <section className="flex-1 overflow-y-auto p-6 scroll-smooth">{children}</section>
      </main>
    </div>
  );
};

import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Transactions from './components/Transactions';
import CategoriesView from './components/Categories';
import Goals from './components/Savings';
import Budgets from './components/Budgets';
import Recurring from './components/Recurring';
import FinancialAnalysis from './components/FinancialAnalysis';
import Cards from './components/Cards';
import Export from './components/Export';
import ImportExcel from './components/ImportExcel';
import Notice from './components/Notice';
import CodeViewer from './components/CodeViewer';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('sb_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('sb_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('sb_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });
  const [cards, setCards] = useState<CreditCard[]>(() => {
    const saved = localStorage.getItem('sb_cards');
    return saved ? JSON.parse(saved) : [];
  });
  const [recurring, setRecurring] = useState<RecurringTransaction[]>(() => {
    const saved = localStorage.getItem('sb_recurring');
    return saved ? JSON.parse(saved) : [];
  });
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('sb_budgets');
    return saved ? JSON.parse(saved) : [];
  });
  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('sb_goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [notification, setNotification] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<string>('');

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    localStorage.setItem('sb_accounts', JSON.stringify(accounts));
    localStorage.setItem('sb_transactions', JSON.stringify(transactions));
    localStorage.setItem('sb_categories', JSON.stringify(categories));
    localStorage.setItem('sb_cards', JSON.stringify(cards));
    localStorage.setItem('sb_recurring', JSON.stringify(recurring));
    localStorage.setItem('sb_budgets', JSON.stringify(budgets));
    localStorage.setItem('sb_goals', JSON.stringify(goals));
  }, [accounts, transactions, categories, cards, recurring, budgets, goals]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let newTransactions: Transaction[] = [];
    let updatedRecurringList = [...recurring];
    let hasChanges = false;

    updatedRecurringList = updatedRecurringList.map(rec => {
      if (rec.isPaused) return rec;

      const startDate = new Date(rec.startDate);
      const endDate = rec.endDate ? new Date(rec.endDate) : null;
      let lastProcessed = rec.lastProcessedDate ? new Date(rec.lastProcessedDate) : new Date(startDate);
      
      let nextDate = new Date(lastProcessed);
      if (rec.lastProcessedDate) {
          nextDate = getNextOccurrence(nextDate, rec.frequency as Frequency);
      } else {
          nextDate = new Date(startDate);
      }

      let currentRecProcessedDate = rec.lastProcessedDate || null;

      while (nextDate <= today && (!endDate || nextDate <= endDate)) {
        const dateStr = nextDate.toISOString().split('T')[0];
        const nextDateObj = new Date(nextDate);
        
        const isAlreadyInJournal = transactions.some((t: Transaction) => 
          String(t.sourceAccountId) === String(rec.sourceAccountId) &&
          t.categoryId === rec.categoryId &&
          Math.abs((t.expense || t.revenue) - rec.amount) < 0.1 &&
          new Date(t.date).getMonth() === nextDateObj.getMonth() &&
          new Date(t.date).getFullYear() === nextDateObj.getFullYear()
        );

        if (!isAlreadyInJournal) {
          const t: Transaction = {
            id: `auto-${rec.id}-${Date.now()}-${Math.random()}`,
            date: dateStr,
            categoryId: rec.categoryId,
            subCategory: rec.subCategory,
            description: `[Auto] ${rec.description}`,
            sourceAccountId: rec.sourceAccountId,
            destinationAccountId: rec.destinationAccountId,
            paymentMethod: rec.paymentMethod,
            type: rec.type,
            revenue: rec.type === TransactionType.REVENUE ? rec.amount : 0,
            expense: (rec.type === TransactionType.EXPENSE || rec.type === TransactionType.TRANSFER || rec.type === TransactionType.GOAL_DEPOSIT) ? rec.amount : 0,
            reconciliation: ReconciliationMarker.NONE
          };
          newTransactions.push(t);
        }
        
        currentRecProcessedDate = dateStr;
        hasChanges = true;
        nextDate = getNextOccurrence(nextDate, rec.frequency as Frequency);
      }

      return { ...rec, lastProcessedDate: currentRecProcessedDate || rec.lastProcessedDate };
    });

    if (hasChanges) {
      if (newTransactions.length > 0) {
        setTransactions(prev => [...newTransactions, ...prev]);
        notify(`${newTransactions.length} transactions récurrentes générées.`);
      }
      setRecurring(updatedRecurringList);
    }
  }, []);

  const getNextOccurrence = (date: Date, freq: Frequency): Date => {
    const d = new Date(date);
    if (freq === Frequency.DAILY) d.setDate(d.getDate() + 1);
    else if (freq === Frequency.WEEKLY) d.setDate(d.getDate() + 7);
    else if (freq === Frequency.MONTHLY) d.setMonth(d.getMonth() + 1);
    else if (freq === Frequency.YEARLY) d.setFullYear(d.getFullYear() + 1);
    return d;
  };

  const confirmDelete = (item: any, type: string) => {
    setItemToDelete(item);
    setDeleteType(type);
    setShowDeleteModal(true);
  };

  const executeDelete = () => {
    if (!itemToDelete) return;
    const id = String(itemToDelete.id);

    switch(deleteType) {
      case 'account': setAccounts(prev => prev.filter(a => String(a.id) !== id)); break;
      case 'card': setCards(prev => prev.filter(c => String(c.id) !== id)); break;
      case 'category': setCategories(prev => prev.filter(c => String(c.id) !== id)); break;
      case 'transaction': setTransactions(prev => prev.filter(t => String(t.id) !== id)); break;
      case 'recurring': setRecurring(prev => prev.filter(r => String(r.id) !== id)); break;
      case 'goal': setGoals(prev => prev.filter(g => String(g.id) !== id)); break;
      case 'budget': setBudgets(prev => prev.filter(b => String(b.id) !== id)); break;
    }

    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const contextValue: AppContextType = {
    accounts, transactions, categories, cards, recurring, budgets, goals, setActiveTab, notify,
    addTransaction: (t: Transaction) => setTransactions(prev => [t, ...prev]),
    updateTransaction: (t: Transaction) => setTransactions(prev => prev.map(item => String(item.id) === String(t.id) ? t : item)),
    deleteTransaction: (id: string) => setTransactions(prev => prev.filter(t => String(t.id) !== id)),
    addAccount: (a: BankAccount) => setAccounts(prev => [...prev, a]),
    updateAccount: (a: BankAccount) => setAccounts(prev => prev.map(item => String(item.id) === String(a.id) ? a : item)),
    deleteAccount: (id: string) => setAccounts(prev => prev.filter(a => String(a.id) !== id)),
    addCategory: (c: Category) => setCategories(prev => [...prev, c].sort((a,b) => a.name.localeCompare(b.name))),
    updateCategory: (c: Category) => setCategories(prev => prev.map(item => String(item.id) === String(c.id) ? c : item).sort((a,b) => a.name.localeCompare(b.name))),
    deleteCategory: (id: string) => setCategories(prev => prev.filter(c => String(c.id) !== id)),
    addGoal: (g: SavingsGoal) => setGoals(prev => [...prev, g]),
    updateGoal: (g: SavingsGoal) => setGoals(prev => prev.map(item => String(item.id) === String(g.id) ? g : item)),
    deleteGoal: (id: string) => setGoals(prev => prev.filter(g => String(g.id) !== id)),
    addBudget: (b: Budget) => setBudgets(prev => [...prev, b]),
    updateBudget: (b: Budget) => setBudgets(prev => prev.map(item => String(item.id) === String(b.id) ? b : item)),
    deleteBudget: (id: string) => setBudgets(prev => prev.filter(b => String(b.id) !== id)),
    addRecurring: (r: RecurringTransaction) => setRecurring(prev => [...prev, r]),
    updateRecurring: (r: RecurringTransaction) => setRecurring(prev => prev.map(item => String(item.id) === String(r.id) ? r : item)),
    deleteRecurring: (id: string) => setRecurring(prev => prev.filter(r => String(r.id) !== id)),
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'accounts': return <Accounts />;
      case 'cards': return <Cards />;
      case 'categories': return <CategoriesView />;
      case 'transactions': return <Transactions />;
      case 'recurring': return <Recurring />;
      case 'financial-analysis': return <FinancialAnalysis />;
      case 'budgets': return <Budgets />;
      case 'goals': return <Goals />;
      case 'export': return <Export />;
      case 'import': return <ImportExcel />;
      case 'notice': return <Notice />;
      case 'code': return <CodeViewer />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Layout activeTab={activeTab} setTab={setActiveTab}>{renderContent()}</Layout>
      {notification && (
        <div className="fixed bottom-8 right-8 z-[250] animate-in slide-in-from-bottom duration-300">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center space-x-3">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <p className="text-xs font-black uppercase tracking-widest">{notification}</p>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-sm p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-6 animate-in zoom-in duration-200">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center shadow-inner">
              <AlertTriangle size={40} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Confirmer la suppression</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Êtes-vous sûr de vouloir supprimer <span className="text-slate-900 font-bold">"{itemToDelete?.name || itemToDelete?.description || 'cet élément'}"</span> ?
              </p>
              <p className="text-[10px] text-rose-400 font-black uppercase mt-4 tracking-widest">Cette action est irréversible</p>
            </div>
            <div className="flex w-full space-x-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-xs tracking-widest hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all">Annuler</button>
              <button onClick={executeDelete} className="flex-1 py-4 bg-rose-500 text-white font-bold uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center"><Trash2 size={16} className="mr-2" /> Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
};

export default App;
