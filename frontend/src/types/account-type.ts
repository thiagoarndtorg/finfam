import { Transaction } from "./transaction-type"

export interface Account {
  id: number;
  userId: number;
  familyId: number;
  bankId: number;
  itemId: string;
  name: string;
  balance: number;
  currency: string;
  color: string;
  isActive: boolean;
  transactions: Transaction[];
}

export interface AccountsResponse {
  accounts: Account[];
}
