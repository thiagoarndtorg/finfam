"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useFamily } from "@/contexts/family-context";
import { useI18n } from "@/contexts/i18n-context";
import {
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { formatBrazilianCurrency } from "@/lib/utils";

const COLORS = ["#0ea5e9", "#8b5cf6", "#f43f5e", "#10b981", "#f59e0b", "#6366f1", "#a855f7", "#22c55e"];

export function ExpenseSummary() {
  const [timeframe, setTimeframe] = useState("month");
  const [showIncome, setShowIncome] = useState(false);
  const { familyId, filteredTransactions: contextTransactions, categories } = useFamily();
  const { t } = useI18n();

  // Build expenses or income per category from context transactions
  const { chartData, totalAmount } = useMemo(() => {
    // Filter by selected timeframe
    const now = new Date();
    let start: Date;
    switch (timeframe) {
      case "week":
        start = startOfWeek(now);
        break;
      case "quarter":
        start = startOfQuarter(now);
        break;
      case "year":
        start = startOfYear(now);
        break;
      case "month":
      default:
        start = startOfMonth(now);
        break;
    }

    // Use context transactions only - filter by type and timeframe
    const transactionType = showIncome ? "INCOME" : "EXPENSE";
    const filteredTx = contextTransactions
      .filter((t: any) => t.transactionType === transactionType)
      .filter((t: any) => {
        const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate);
        if (Number.isNaN(date.getTime())) return false;
        return isWithinInterval(date, { start, end: now });
      });

    // Group by category name
    const map = new Map<string, number>();
    for (const t of filteredTx) {
      const categoryName = t.category?.name || "Uncategorized";
      const amount = Math.abs(Number(t.amount || 0));
      map.set(categoryName, (map.get(categoryName) || 0) + amount);
    }

    const entries = Array.from(map.entries());
    const total = entries.reduce((s, [, v]) => s + v, 0);
    const data = entries.map(([name, value], idx) => ({ name, value, color: COLORS[idx % COLORS.length] }));

    return { chartData: data, totalAmount: total };
  }, [familyId, contextTransactions, timeframe, showIncome]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-medium">
          {showIncome ? t("dashboard.incomeSummary") : t("dashboard.expenseSummary")}
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="income-toggle" className="text-sm text-muted-foreground">
              {showIncome ? t("transactions.income") : t("transactions.expense")}
            </Label>
            <Switch
              id="income-toggle"
              checked={showIncome}
              onCheckedChange={setShowIncome}
            />
          </div>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t("common.filter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t("dashboard.thisWeek")}</SelectItem>
              <SelectItem value="month">{t("dashboard.thisMonth")}</SelectItem>
              <SelectItem value="quarter">{t("dashboard.thisQuarter")}</SelectItem>
              <SelectItem value="year">{t("dashboard.thisYear")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {!familyId ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold mb-4">R$ {totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mb-6">
              {showIncome ? t("dashboard.totalIncome") : t("dashboard.totalExpenses")}
            </p>

            <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, "Amount"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 space-y-2">
          {chartData.map((category) => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                  aria-hidden="true"
                ></div>
                <span className="text-sm">{category.name}</span>
              </div>
              <span className="text-sm font-medium">R$ {formatBrazilianCurrency(category.value)}</span>
            </div>
          ))}
        </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
