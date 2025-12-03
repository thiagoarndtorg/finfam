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
import { useI18n } from "@/contexts/i18n-context";
import { useFamilyFinancials, useUpdateTransaction, useDeleteTransaction } from "@/hooks/use-api";

// Start with empty; will load from backend
const initialTransactions: any[] = [];

export function RecentTransactions() {
  const {
    familyId,
    filteredTransactions: contextTransactions,
    categories,
    updateTransaction,
    familyData,
    refreshFamilyData,
  } = useFamily();
  const { t } = useI18n();
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
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Build a map of accountId -> accountName for labeling
  const accountIdToName = useMemo(() => {
    const map = new Map<number, string>();
    const accounts = familyData?.accounts ?? [];
    accounts.forEach((acc: any) => map.set(acc.id, acc.name));
    return map;
  }, [familyData]);

  // Use context transactions and normalize them
  // This effect normalizes transactions from context for display
  useEffect(() => {
    if (!familyId) {
      setTransactions([]);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);

    if (contextTransactions.length > 0) {
      // Use transactions from context - this is the single source of truth
      const normalized = contextTransactions.map((f: any) => {
        return {
          id: String(f.id),
          description: f.description,
          amount: Math.round(Number(f.amount) * 100), // convert to cents
          date: f.transactionDate,
          category: f.category?.name || t("transactions.uncategorized"),
          categoryId: f.category?.id,
          categoryObject: f.category, // Keep full category object for editing
          account: accountIdToName.get(f.accountId) || `Account ${f.accountId}`,
          type: f.transactionType === "INCOME" ? "income" : "expense",
        };
      });
      setTransactions(normalized);
    } else {
      setTransactions([]);
    }

    setIsLoadingData(false);
  }, [familyId, contextTransactions, accountIdToName]);

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
    // Normalize amount: API expects positive amount with transactionType
    const amountValue = Math.abs(updatedTransaction.amount) / 100;

    // Update via API and capture the response
    const apiResponse = await updateTransactionAPI({
      id: Number(updatedTransaction.id),
      familyId,
      categoryId: updatedTransaction.categoryId,
      amount: amountValue,
      description: updatedTransaction.description,
      transactionDate: updatedTransaction.date,
      transactionType: updatedTransaction.type.toUpperCase(),
    });

    if (!apiResponse) {
      throw new Error("Failed to update transaction: API returned no response");
    }

    // Update context with API response, including the full category object
    // Find current transaction from context to preserve category if API doesn't return it
    const currentTransaction = contextTransactions.find((t: any) => t.id === Number(updatedTransaction.id));
    updateTransaction(Number(updatedTransaction.id), {
      category: apiResponse.category || currentTransaction?.category || updatedTransaction.categoryObject,
      categoryId: apiResponse.category?.id || updatedTransaction.categoryId,
      amount: apiResponse.amount || amountValue,
      description: apiResponse.description || updatedTransaction.description,
      transactionDate: apiResponse.transactionDate || updatedTransaction.date,
      transactionType: apiResponse.transactionType || updatedTransaction.type.toUpperCase(),
    });

    setEditingTransaction(null);
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
        <CardTitle className="text-xl font-medium">{t("dashboard.recentTransactions")}</CardTitle>
        <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("common.search") + "..."}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t("common.category")} />
            </SelectTrigger>
            <SelectContent>
              {filterCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? t("transactions.allCategories") : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t("common.account")} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account} value={account}>
                  {account === "all" ? t("transactions.allAccounts") : account}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingData ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">{t("transactions.loading")}</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    <Button variant="ghost" className="p-0" onClick={() => handleSort("description")}>
                      {t("transactions.description")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="p-0" onClick={() => handleSort("category")}>
                      {t("common.category")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="p-0" onClick={() => handleSort("account")}>
                      {t("common.account")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="p-0" onClick={() => handleSort("date")}>
                      {t("common.date")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" className="p-0" onClick={() => handleSort("amount")}>
                      {t("common.amount")}
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
                      {t("transactions.noTransactions")}
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
                            className={`inline-flex items-center ${transaction.type === "income"
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
                                <span>{t("common.edit")}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeletingTransaction(transaction)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>{t("common.delete")}</span>
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
        )}
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
