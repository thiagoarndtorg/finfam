"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { FamilySpendingOverview } from "@/components/analytics/family-spending-overview";
import { CategoryAnalysis } from "@/components/analytics/category-analysis";
import { MemberComparison } from "@/components/analytics/member-comparison";
import { SpendingTrends } from "@/components/analytics/spending-trends";
import { BudgetPerformance } from "@/components/analytics/budget-performance";
import { useI18n } from "@/contexts/i18n-context";
import { useFamily } from "@/contexts/family-context";

export default function AnalyticsPage() {
  const { t } = useI18n();
  const { transactions, familyData } = useFamily();
  const [dateRange, setDateRange] = useState({
    from: new Date(2023, 0, 1),
    to: new Date(),
  });

  const handleExportData = () => {
    // Get transactions from familyData (raw transactions from API)
    const allTransactions: any[] = [];
    if (familyData?.accounts) {
      familyData.accounts.forEach((account: any) => {
        if (account.transactions && Array.isArray(account.transactions)) {
          account.transactions.forEach((tx: any) => {
            allTransactions.push({
              ...tx,
              accountName: account.name || `Account ${account.id}`,
              accountId: account.id,
            });
          });
        }
      });
    }

    if (allTransactions.length === 0) {
      alert("No transactions to export");
      return;
    }

    // Prepare CSV headers
    const headers = [
      "ID",
      "Date",
      "Description",
      "Amount",
      "Type",
      "Category",
      "Account",
      "ML Suggested Category",
      "ML Confidence",
    ];

    // Prepare CSV rows
    const rows = allTransactions.map((tx: any) => {
      // Format amount (already in decimal format from API)
      const amount = tx.amount ? Number(tx.amount).toFixed(2) : "0.00";
      
      // Format date
      const date = tx.transactionDate || "";
      const formattedDate = date ? new Date(date).toLocaleDateString("en-US") : "";
      
      // Get account name
      const accountName = tx.accountName || `Account ${tx.accountId || "N/A"}`;
      
      // Get category name
      const categoryName = tx.category?.name || "Uncategorized";
      
      // Get type
      const type = tx.transactionType || "";
      const typeDisplay = type === "INCOME" ? "Income" : "Expense";
      
      // ML fields
      const mlSuggested = tx.mlSuggestedCategory || "";
      const mlConfidence = tx.mlConfidence ? (Number(tx.mlConfidence) * 100).toFixed(2) + "%" : "";
      
      return [
        tx.id || "",
        formattedDate,
        tx.description || "",
        amount,
        typeDisplay,
        categoryName,
        accountName,
        mlSuggested,
        mlConfidence,
      ];
    });

    // Escape CSV values (handle commas, quotes, newlines)
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Build CSV content
    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map(row => row.map(escapeCSV).join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("analytics.title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleExportData} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t("analytics.exportData")}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">{t("analytics.overview")}</TabsTrigger>
          <TabsTrigger value="by-member">{t("analytics.byMember")}</TabsTrigger>
          <TabsTrigger value="by-category">{t("analytics.byCategory")}</TabsTrigger>
          <TabsTrigger value="trends">{t("analytics.trends")}</TabsTrigger>
          <TabsTrigger value="budget">{t("analytics.budget")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <FamilySpendingOverview />
        </TabsContent>

        <TabsContent value="by-member" className="space-y-4">
          <MemberComparison />
        </TabsContent>

        <TabsContent value="by-category" className="space-y-4">
          <CategoryAnalysis />
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <SpendingTrends />
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <BudgetPerformance />
        </TabsContent>
      </Tabs>
    </div>
  );
}
