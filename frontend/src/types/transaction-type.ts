export interface Category {
  id: number;
  familyId: number;
  name: string;
  icon: string;
  color: string;
  isIncome: boolean;
  isSystem: boolean;
}

export interface Transaction {
  id: number;
  accountId: number;
  userId: number;
  familyId: number;
  category: Category;
  amount: number;
  description: string;
  transactionDate: string;
  transactionType: "EXPENSE" | "INCOME";
}
