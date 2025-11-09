"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditTransactionModal } from "./edit-transaction-modal";
import { DeleteTransactionModal } from "./delete-transaction-modal";
import { useFamily } from "@/contexts/family-context";
import { useFamilyFinancials, useUpdateTransaction, useDeleteTransaction } from "@/hooks/use-api";

// Start with empty; will load from backend
const initialTransactions: any[] = [];

export function RecentTransactions({ accountsData }: { accountsData?: any }) {
  const {
    familyId,
    filteredTransactions: contextTransactions,
    categories,
    updateTransaction,
    refreshFamilyData,
  } = useFamily();
  const { data, execute } = useFamilyFinancials();
  const { execute: updateTransactionAPI } = useUpdateTransaction();
  const { execute: deleteTransactionAPI } = useDeleteTransaction();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);

  // // Fetch accounts+transactions once familyId is available
  // useEffect(() => {
  //   if (!accountsData && familyId) {
  //     execute(familyId);
  //   }
  // }, [familyId, accountsData]);

  // Build a map of accountId -> accountName for labeling
  const accountIdToName = useMemo(() => {
    const map = new Map<number, string>();
    const accounts = accountsData?.accounts ?? data?.accounts ?? [];
    accounts.forEach((acc: any) => map.set(acc.id, acc.name));
    return map;
  }, [data, accountsData]);

  // Use context transactions if available, otherwise normalize from accountsData
  useEffect(() => {
    if (contextTransactions.length > 0) {
      // Use transactions from context
      const normalized = contextTransactions.map((t: any) => {
        return {
          id: String(t.id),
          description: t.description,
          amount: Math.round(Number(t.amount) * 100), // convert to cents
          date: t.transactionDate,
          category: t.category?.name || "Uncategorized",
          categoryId: t.category?.id,
          categoryObject: t.category, // Keep full category object for editing
          account: accountIdToName.get(t.accountId) || `Account ${t.accountId}`,
          type: t.transactionType === "INCOME" ? "income" : "expense",
        };
      });
      setTransactions(normalized);
    } else {
      // Fallback to accountsData
      const accounts = accountsData?.accounts ?? data?.accounts ?? [];
      if (!accounts.length) return;

      const normalized = accounts.flatMap((acc: any) =>
        (acc.transactions || []).map((t: any) => {
          return {
            id: String(t.id),
            description: t.description,
            amount: Math.round(Number(t.amount) * 100), // convert to cents
            date: t.transactionDate,
            category: t.category?.name || "Uncategorized",
            categoryId: t.category?.id,
            categoryObject: t.category, // Keep full category object for editing
            account: accountIdToName.get(t.accountId) || acc.name || `Account ${t.accountId}`,
            type: t.transactionType === "INCOME" ? "income" : "expense",
          };
        })
      );
      setTransactions(normalized);
    }
  }, [data, accountsData, accountIdToName, contextTransactions]);

  // Get unique categories and accounts for filters
  const filterCategories = ["all", ...new Set(transactions.map((t) => t.category))];
  const accounts = ["all", ...new Set(transactions.map((t) => t.account))];

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter((transaction) => {
      const matchesSearch = transaction.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
      const matchesAccount = accountFilter === "all" || transaction.account === accountFilter;
      return matchesSearch && matchesCategory && matchesAccount;
    })
    .sort((a, b) => {
      if (sortField === "amount") {
        return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount;
      } else if (sortField === "date") {
        return sortDirection === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return sortDirection === "asc"
          ? String(a[sortField as keyof typeof a]).localeCompare(
              String(b[sortField as keyof typeof b])
            )
          : String(b[sortField as keyof typeof b]).localeCompare(
              String(a[sortField as keyof typeof a])
            );
      }
    });

  // Handle transaction edit
  const handleEditTransaction = async (updatedTransaction: any) => {
    try {
      // Update via API
      await updateTransactionAPI({
        id: Number(updatedTransaction.id),
        familyId,
        categoryId: updatedTransaction.categoryId,
        amount: updatedTransaction.amount / 100, // convert from cents
        description: updatedTransaction.description,
        transactionDate: updatedTransaction.date,
        transactionType: updatedTransaction.type.toUpperCase(),
      });

      // Update context
      updateTransaction(Number(updatedTransaction.id), {
        categoryId: updatedTransaction.categoryId,
        amount: updatedTransaction.amount / 100,
        description: updatedTransaction.description,
        transactionDate: updatedTransaction.date,
        transactionType: updatedTransaction.type.toUpperCase(),
      });

      // Update local state
      setTransactions((prev) =>
        prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
      );

      // Refresh family data to get latest balance and transactions
      await refreshFamilyData();

      setEditingTransaction(null);
    } catch (error) {
      console.error("Failed to update transaction:", error);
    }
  };

  // Handle transaction delete
  const handleDeleteTransaction = async (id: string) => {
    try {
      // Call API to delete transaction
      await deleteTransactionAPI({
        id: Number(id),
        familyId,
      });

      // Remove from local state
      setTransactions((prev) => prev.filter((t) => t.id !== id));

      // Refresh family data to get latest balance and transactions
      await refreshFamilyData();

      setDeletingTransaction(null);
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <CardTitle className="text-xl font-medium">Recent Transactions</CardTitle>
        <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {filterCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account} value={account}>
                  {account === "all" ? "All Accounts" : account}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  <Button variant="ghost" className="p-0" onClick={() => handleSort("description")}>
                    Description
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-0" onClick={() => handleSort("category")}>
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-0" onClick={() => handleSort("account")}>
                    Account
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-0" onClick={() => handleSort("date")}>
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" className="p-0" onClick={() => handleSort("amount")}>
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => {
                  console.log(transaction);
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>{transaction.account}</TableCell>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center ${
                            transaction.type === "income"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}R${" "}
                          {Math.abs(transaction.amount / 100).toFixed(2)}
                          {transaction.type === "income" ? (
                            <ArrowUpRight className="h-4 w-4 ml-1" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 ml-1" />
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingTransaction(transaction)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeletingTransaction(transaction)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {editingTransaction && (
        <EditTransactionModal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          transaction={editingTransaction}
          onSave={handleEditTransaction}
        />
      )}

      {deletingTransaction && (
        <DeleteTransactionModal
          isOpen={!!deletingTransaction}
          onClose={() => setDeletingTransaction(null)}
          transaction={deletingTransaction}
          onDelete={handleDeleteTransaction}
        />
      )}
    </Card>
  );
}
