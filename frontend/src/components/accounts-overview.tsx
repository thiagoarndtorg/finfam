"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Send, CreditCard, MoreHorizontal, RefreshCcw } from "lucide-react";
import { AddAccountModal } from "./add-account-modal";
import { TransferModal } from "./transfer-modal";
import { AddExpenseModal } from "./add-expense-modal";
import { useFamilyAccountsTemp, useSyncAccount } from "@/hooks/use-api";
import { useFamily } from "@/contexts/family-context";
import { useI18n } from "@/contexts/i18n-context";
import { Account } from "@/types/account-type";
import { getBankColor, formatBrazilianCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export function AccountsOverview() {
  const { familyId, refreshFamilyData } = useFamily();
  const { t } = useI18n();
  const { data: accountsData, isLoading, error, execute: fetchAccounts } = useFamilyAccountsTemp();
  const { execute: syncAccount } = useSyncAccount();
  const { data: banksData }: any = [];
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [refreshingAccountId, setRefreshingAccountId] = useState<number | null>(null);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);

  // Buscar contas quando o componente montar ou familyId mudar
  useEffect(() => {
    if (familyId) {
      fetchAccounts(familyId);
    }
  }, [familyId]); // Removido fetchAccounts da dependência

  // Atualizar accounts quando accountsData mudar
  useEffect(() => {
    if (accountsData?.accounts) {
      // Map accounts and set color based on bankEnum
      const accountsWithColor: Account[] = accountsData.accounts.map((account: any) => {
        return {
          ...account,
          color: account.color || getBankColor(account.bankEnum),
        } as Account;
      });
      setAccounts(accountsWithColor);
    }
  }, [accountsData]);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  const handleAddAccount = (newAccount: Account) => {
    setAccounts([...accounts, newAccount]);
    setIsAddAccountModalOpen(false);
  };



  const handleAddExpense = async (amount: number, account: number, category: string) => {
    // Note: In a real app, you would call the API here to create the expense transaction
    // For now, we'll just update local state and refresh data

    setAccounts(
      accounts.map((acc) => {
        if (acc.id === account) {
          return { ...acc, balance: acc.balance - amount };
        }
        return acc;
      })
    );

    // Refresh family data to get latest balance and transactions from backend
    try {
      await refreshFamilyData();
    } catch (error) {
      console.error("Failed to refresh family data after expense:", error);
    }

    setIsAddExpenseModalOpen(false);
  };

  const handleRefreshAccounts = async () => {
    try {
      // The refreshFamilyData function now includes auto-sync
      await refreshFamilyData();
    } catch (error) {
      console.error("Failed to refresh accounts:", error);
    }
  };

  const handleRefreshSingleAccount = async (accountId: number) => {
    if (!familyId) {
      toast.error("Family ID is required");
      return;
    }

    setRefreshingAccountId(accountId);
    try {
      await syncAccount(accountId, familyId);
      // Refresh accounts list to show updated balance
      await fetchAccounts(familyId);
      toast.success(t("toasts.success.accountRefreshed"));
    } catch (error: any) {
      console.error("Failed to refresh account:", error);
      toast.error(error?.message || t("toasts.error.accountRefresh"));
    } finally {
      setRefreshingAccountId(null);
    }
  };

  // Função para obter o nome do banco
  const getBankName = (bankId: number) => {
    return ""
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-medium">{t("dashboard.accountsOverview")}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefreshAccounts}
          title={t("dashboard.refreshAccounts")}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">{t("dashboard.loadingAccounts")}</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-red-600">{t("dashboard.errorLoadingAccounts")}</p>
            <Button size="sm" onClick={handleRefreshAccounts} className="mt-2">
              {t("dashboard.tryAgain")}
            </Button>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold mb-4">{formatBrazilianCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground mb-6">{t("dashboard.totalBalanceDescription")}</p>
            <div className="space-y-4 mb-6">
              {accounts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">{t("dashboard.noAccounts")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.addAccountButton")}
                  </p>
                </div>
              ) : (
                accounts.map((account) => {

                  console.log(account)
                  return (

                    <div key={account.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: account.color || getBankColor((account as any).bankEnum)
                          }}
                          aria-hidden="true"
                        ></div>
                        <div>
                          <p className="text-sm font-medium">{account.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {getBankName(account.bankId)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatBrazilianCurrency(account.balance)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRefreshSingleAccount(account.id)}
                          disabled={refreshingAccountId === account.id}
                          className={refreshingAccountId === account.id ? "animate-spin" : ""}
                          title={t("dashboard.refreshThisAccount")}
                        >
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

      </CardContent>

      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
        onAddAccount={handleAddAccount}
      />



      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        onAddExpense={handleAddExpense}
        accounts={accounts}
      />
    </Card>
  );
}
