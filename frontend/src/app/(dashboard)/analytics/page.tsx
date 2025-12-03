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

export default function AnalyticsPage() {
  const { t } = useI18n();
  const [dateRange, setDateRange] = useState({
    from: new Date(2023, 0, 1),
    to: new Date(),
  });

  const handleExportData = () => {
    // Implement export functionality here
    console.log("Exporting data...");
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
