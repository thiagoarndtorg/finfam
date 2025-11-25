"use client";

import { AccountsOverview } from "@/components/accounts-overview";
import { RecentTransactions } from "@/components/recent-transactions";
import { ExpenseSummary } from "@/components/expense-summary";
import { FinancialMetrics } from "@/components/financial-metrics";
import { ConnectBankButton } from "@/components/connect-bank-button";
import { UserFilter } from "@/components/user-filter";
import { DateFilter } from "@/components/date-filter";
import { CategoryFilter } from "@/components/category-filter";
import {
  useBankStatement,
  useFamilyFinancials,
  useFamilyCategories,
  useAutoSyncAccounts,
} from "@/hooks/use-api";
import { useContext, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { useFamily } from "@/contexts/family-context";
import { apiClient } from "@/middleware/api-client";

export default function Dashboard() {
  const { familyId, familyData, isLoading, error, transactions, setTransactions, setCategories, refreshFamilyData } = useFamily();
  const bankStatement = useBankStatement();
  const { data: categoriesData, execute: fetchCategories } = useFamilyCategories();
  const { execute: autoSyncAccounts } = useAutoSyncAccounts();
  
  // Track if auto-sync has been attempted to avoid running multiple times
  const hasAutoSynced = useRef(false);

  // Debug logging
  console.log("Dashboard render - familyId:", familyId, "familyData:", familyData, "isLoading:", isLoading, "error:", error);
  console.log("User authenticated:", apiClient.isAuthenticated());

  // Auto-sync accounts when dashboard loads
  useEffect(() => {
    const performAutoSync = async () => {
      if (familyId) {
        try {
          const syncResults = await autoSyncAccounts({ familyId });
          if (syncResults && syncResults.length > 0) {
            toast.success(`${syncResults.length} conta(s) sincronizada(s) com sucesso!`);
            // Refresh family data to show updated balances and transactions
            if (refreshFamilyData) {
              refreshFamilyData();
            }
          }
        } catch (error) {
          console.error("Auto-sync failed:", error);
          // Don't show error toast for auto-sync failures as they might be silent
        }
      }
    };

    // Only auto-sync if we have family data and accounts exist
    if (familyData && familyData.accounts && familyData.accounts.length > 0) {
      console.log("JINGOLASSSS");
      performAutoSync();
    }
  }, []);

  // Push flattened transactions into context whenever familyData changes
  useEffect(() => {
    if (!familyData) return;
    const flattened = (familyData.accounts || []).flatMap((a: any) =>
      (a.transactions || []).map((t: any) => ({
        ...t,
        // Ensure normalized shape if needed
        accountId: t.accountId ?? a.id,
      }))
    );
    setTransactions(flattened);
  }, [familyData, setTransactions]);

  // // Load categories when familyId changes
  // useEffect(() => {
  //   if (familyId) {
  //     fetchCategories(familyId);
  //   }
  // }, [familyId, fetchCategories]);

  // Update context when categories data changes
  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData);
    }
  }, [categoriesData, setCategories]);

  // Check authentication first
  if (!apiClient.isAuthenticated()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Please log in to access the dashboard</div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading family data...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Error loading data: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <ConnectBankButton />
          <UserFilter />
          <CategoryFilter />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <div className="lg:col-span-1">
          <AccountsOverview />
        </div>
        <div className="lg:col-span-1">
          <ExpenseSummary />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <RecentTransactions />
      </div>

      <FinancialMetrics />
    </div>
  );
}
