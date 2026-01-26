
export enum TransactionType {
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
  GOAL_DEPOSIT = 'GOAL_DEPOSIT'
}

export enum ReconciliationMarker {
  GREEN_CHECK = 'GREEN_CHECK',
  D = 'D',
  D2 = 'D2',
  G = 'G',
  G2 = 'G2',
  C = 'C',
  NONE = 'NONE'
}

export enum Frequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  subCategories: string[];
  type: TransactionType;
}

export interface BankAccount {
  id: string;
  name: string;
  icon: string;
  color: string;
  initialBalance: number;
  isPrincipal: boolean;
  bankBalanceManual?: number;
  cardOutstandingManual?: number;
}

export interface CreditCard {
  id: string;
  name: string;
  icon: string;
  color: string;
  accountId: string;
}

export interface Transaction {
  id: string;
  date: string;
  categoryId: string;
  subCategory: string;
  description: string;
  sourceAccountId: string;
  destinationAccountId?: string;
  paymentMethod: string;
  type: TransactionType;
  revenue: number;
  expense: number;
  reconciliation: ReconciliationMarker;
}

export interface RecurringTransaction {
  id: string;
  startDate: string;
  endDate?: string;
  lastProcessedDate?: string;
  type: TransactionType;
  categoryId: string;
  subCategory: string;
  description: string;
  sourceAccountId: string;
  destinationAccountId?: string;
  targetGoalId?: string;
  frequency: Frequency;
  amount: number;
  paymentMethod: string;
  isPaused?: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'MONTHLY' | 'YEARLY';
  alertThresholds: number[];
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  accountId: string;
  isReached: boolean;
  isPaused?: boolean;
  milestonesReached: number[];
}

export interface AppContextType {
  accounts: BankAccount[];
  transactions: Transaction[];
  categories: Category[];
  cards: CreditCard[];
  recurring: RecurringTransaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (a: BankAccount) => void;
  updateAccount: (a: BankAccount) => void;
  deleteAccount: (id: string) => void;
  addCategory: (c: Category) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  addGoal: (g: SavingsGoal) => void;
  updateGoal: (g: SavingsGoal) => void;
  deleteGoal: (id: string) => void;
  addBudget: (b: Budget) => void;
  updateBudget: (b: Budget) => void;
  deleteBudget: (id: string) => void;
  addRecurring: (r: RecurringTransaction) => void;
  updateRecurring: (r: RecurringTransaction) => void;
  deleteRecurring: (id: string) => void;
  setActiveTab: (tab: string) => void;
  notify: (message: string) => void;
}
