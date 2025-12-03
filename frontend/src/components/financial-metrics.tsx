"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useFamily } from "@/contexts/family-context"
import { useI18n } from "@/contexts/i18n-context"
import { format, parseISO, eachMonthOfInterval, subMonths, isWithinInterval } from "date-fns"

export function FinancialMetrics() {
  const { familyId, filteredTransactions: contextTransactions, categories } = useFamily()
  const { t } = useI18n()

  // Build transactions from context
  const transactions = useMemo(() => {
    return contextTransactions
  }, [familyId, contextTransactions])

  // Process monthly income and expenses for last 6 months
  const monthlyData = useMemo(() => {
    const now = new Date()
    const sixMonthsAgo = subMonths(now, 6)
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now })

    // Filter transactions within the period
    const filteredTx = transactions.filter((t: any) => {
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      if (Number.isNaN(date.getTime())) return false
      return isWithinInterval(date, { start: sixMonthsAgo, end: now })
    })

    // Group by month
    const monthMap = new Map<string, { income: number; expenses: number }>()

    for (const t of filteredTx) {
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      const monthKey = format(date, "MMM")

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { income: 0, expenses: 0 })
      }

      const current = monthMap.get(monthKey)!
      if (t.transactionType === "INCOME") {
        current.income += Number(t.amount || 0)
      } else if (t.transactionType === "EXPENSE") {
        current.expenses += Math.abs(Number(t.amount || 0))
      }
    }

    // Create array with all months, filling in missing months with zeros
    return months.map(month => {
      const monthKey = format(month, "MMM")
      const data = monthMap.get(monthKey) || { income: 0, expenses: 0 }
      return {
        month: monthKey,
        income: data.income,
        expenses: data.expenses,
        savings: data.income - data.expenses,
      }
    })
  }, [transactions])

  // Process category breakdown for last 6 months
  const categoryData = useMemo(() => {
    const now = new Date()
    const sixMonthsAgo = subMonths(now, 6)

    // Filter expense transactions within the period
    const expenseTx = transactions.filter((t: any) => {
      if (t.transactionType !== "EXPENSE") return false
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      if (Number.isNaN(date.getTime())) return false
      return isWithinInterval(date, { start: sixMonthsAgo, end: now })
    })

    // Group by category
    const categoryMap = new Map<string, number>()
    for (const f of expenseTx) {
      const categoryName = f.category?.name || t("transactions.uncategorized")
      const amount = Math.abs(Number(f.amount || 0))
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + amount)
    }

    return Array.from(categoryMap.entries()).map(([category, amount]) => ({ category, amount }))
  }, [transactions])

  // Process savings goals for last 6 months
  const savingsData = useMemo(() => {
    const averageSavings = monthlyData.length > 0
      ? monthlyData.reduce((sum, item) => sum + item.savings, 0) / monthlyData.length
      : 0 // Default target if no data

    return monthlyData.map(item => ({
      month: item.month,
      target: averageSavings,
      actual: item.savings,
    }))
  }, [monthlyData])
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        {!familyId ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No family selected</p>
          </div>
        ) : (
          <Tabs defaultValue="income-expenses">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="income-expenses">Income & Expenses</TabsTrigger>
              <TabsTrigger value="category-breakdown">Category Breakdown</TabsTrigger>
              <TabsTrigger value="savings-goals">Savings Goals</TabsTrigger>
            </TabsList>

            <TabsContent value="income-expenses" className="space-y-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} />
                    <Tooltip formatter={(value) => [`R$${Number(value).toFixed(2)}`, ""]} />
                    <Line type="monotone" dataKey="income" stroke="#10b981" name="Income" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{t("dashboard.averageMonthlyIncome")}</p>
                    <p className="text-2xl font-bold">
                      R$ {(monthlyData.reduce((sum, item) => sum + item.income, 0) / monthlyData.length).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{t("dashboard.averageMonthlyExpenses")}</p>
                    <p className="text-2xl font-bold">
                      R${" "}
                      {(monthlyData.reduce((sum, item) => sum + item.expenses, 0) / monthlyData.length).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Average Monthly Savings</p>
                    <p className="text-2xl font-bold">
                      R${" "}
                      {(monthlyData.reduce((sum, item) => sum + item.savings, 0) / monthlyData.length).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="category-breakdown">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis dataKey="category" />
                    <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} />
                    <Tooltip formatter={(value) => [`R$${Number(value).toFixed(2)}`, "Amount"]} />
                    <Bar dataKey="amount" fill="#8884d8" name="Amount" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="savings-goals">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={savingsData}>
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} />
                    <Tooltip formatter={(value) => [`R$${Number(value).toFixed(2)}`, ""]} />
                    <Bar dataKey="target" fill="#94a3b8" name="Target" />
                    <Bar dataKey="actual" fill="#10b981" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

