import { Transaction } from "./transaction-type"

export interface Bank {
  id: number;
  bankCode: string;
  name: string;
}

export interface Account {
  id: number;
  userId: number;
  familyId: number;
  bankId: number;
  bank?: Bank; // Bank object with bankCode
  bankCode?: string; // Bank code (e.g., "077" for INTER, "380" for PICPAY) - extracted from bank object
  bankEnum?: string; // Bank enum name (e.g., "INTER", "PICPAY") - comes from API response
  itemId: string;
  name: string;
  balance: number;
  currency: string;
  color: string;
  isActive: boolean;
  createdAt?: string; // ISO date string from backend
  transactions: Transaction[];
}

export interface AccountsResponse {
  accounts: Account[];
}
