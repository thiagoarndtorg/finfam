"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import { useFamily } from "@/contexts/family-context"
import { format, parseISO, eachMonthOfInterval, subMonths, isWithinInterval } from "date-fns"

const CATEGORY_COLORS = ["#0ea5e9", "#8b5cf6", "#f43f5e", "#10b981", "#f59e0b", "#6366f1"]
const MEMBER_COLORS = ["#0ea5e9", "#8b5cf6", "#f43f5e", "#10b981"]

export function SpendingTrends() {
  const { theme } = useTheme()
  const [timeRange, setTimeRange] = useState("6months")
  const { transactions: contextTransactions } = useFamily()

  // Build transactions from context
  const transactions = useMemo(() => {
    return contextTransactions || []
  }, [contextTransactions])

  // Determine time range months
  const months = useMemo(() => {
    let monthCount = 6
    switch (timeRange) {
      case "3months":
        monthCount = 3
        break
      case "6months":
        monthCount = 6
        break
      case "1year":
        monthCount = 12
        break
    }
    const now = new Date()
    const start = subMonths(now, monthCount)
    return eachMonthOfInterval({ start, end: now })
  }, [timeRange])

  // Calculate overall financial trends
  const monthlyTrends = useMemo(() => {
    const sixMonthsAgo = subMonths(new Date(), 6)
    const monthIntervals = eachMonthOfInterval({ start: sixMonthsAgo, end: new Date() })

    const filteredTx = transactions.filter((t: any) => {
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      if (Number.isNaN(date.getTime())) return false
      return isWithinInterval(date, { start: sixMonthsAgo, end: new Date() })
    })

    const monthMap = new Map<string, { income: number; spending: number }>()
    
    for (const t of filteredTx) {
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      const monthKey = format(date, "MMM")
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { income: 0, spending: 0 })
      }
      
      const current = monthMap.get(monthKey)!
      if (t.transactionType === "INCOME") {
        current.income += Number(t.amount || 0)
      } else if (t.transactionType === "EXPENSE") {
        current.spending += Math.abs(Number(t.amount || 0))
      }
    }

    return monthIntervals.map(month => {
      const monthKey = format(month, "MMM")
      const data = monthMap.get(monthKey) || { income: 0, spending: 0 }
      return {
        month: monthKey,
        income: data.income,
        spending: data.spending,
        savings: data.income - data.spending,
      }
    })
  }, [transactions])

  // Calculate category trends (top 5 categories)
  const categoryTrends = useMemo(() => {
    const sixMonthsAgo = subMonths(new Date(), 6)
    const monthIntervals = eachMonthOfInterval({ start: sixMonthsAgo, end: new Date() })

    const filteredTx = transactions.filter((t: any) => {
      if (t.transactionType !== "EXPENSE") return false
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      if (Number.isNaN(date.getTime())) return false
      return isWithinInterval(date, { start: sixMonthsAgo, end: new Date() })
    })

    // Get top 5 categories
    const categoryTotal = new Map<string, number>()
    for (const t of filteredTx) {
      const categoryName = t.category?.name || "Uncategorized"
      categoryTotal.set(categoryName, (categoryTotal.get(categoryName) || 0) + Math.abs(Number(t.amount || 0)))
    }

    const topCategories = Array.from(categoryTotal.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)

    // Group by month and category
    const monthCategoryMap = new Map<string, Map<string, number>>()
    
    for (const t of filteredTx) {
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      const monthKey = format(date, "MMM")
      const categoryName = t.category?.name || "Uncategorized"
      
      if (!topCategories.includes(categoryName)) continue
      
      if (!monthCategoryMap.has(monthKey)) {
        monthCategoryMap.set(monthKey, new Map())
      }
      
      const categoryMap = monthCategoryMap.get(monthKey)!
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + Math.abs(Number(t.amount || 0)))
    }

    return monthIntervals.map(month => {
      const monthKey = format(month, "MMM")
      const categoryMap = monthCategoryMap.get(monthKey) || new Map()
      const result: any = { month: monthKey }
      topCategories.forEach(cat => {
        result[cat] = categoryMap.get(cat) || 0
      })
      return result
    })
  }, [transactions])

  // Calculate member trends
  const memberTrends = useMemo(() => {
    const sixMonthsAgo = subMonths(new Date(), 6)
    const monthIntervals = eachMonthOfInterval({ start: sixMonthsAgo, end: new Date() })

    const filteredTx = transactions.filter((t: any) => {
      if (t.transactionType !== "EXPENSE") return false
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      if (Number.isNaN(date.getTime())) return false
      return isWithinInterval(date, { start: sixMonthsAgo, end: new Date() })
    })

    // Group by month and userId
    const monthUserMap = new Map<string, Map<number, number>>()
    
    for (const t of filteredTx) {
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      const monthKey = format(date, "MMM")
      const userId = t.userId
      
      if (!userId) continue
      
      if (!monthUserMap.has(monthKey)) {
        monthUserMap.set(monthKey, new Map())
      }
      
      const userMap = monthUserMap.get(monthKey)!
      userMap.set(userId, (userMap.get(userId) || 0) + Math.abs(Number(t.amount || 0)))
    }

    // Get unique user IDs
    const userIds = new Set<number>()
    filteredTx.forEach(t => {
      if (t.userId) userIds.add(t.userId)
    })

    return monthIntervals.map(month => {
      const monthKey = format(month, "MMM")
      const userMap = monthUserMap.get(monthKey) || new Map()
      const result: any = { month: monthKey }
      userIds.forEach(userId => {
        result[`user${userId}`] = userMap.get(userId) || 0
      })
      return result
    })
  }, [transactions])

  // Get top categories for the chart
  const topCategories = useMemo(() => {
    const categoryTotal = new Map<string, number>()
    transactions
      .filter((t: any) => t.transactionType === "EXPENSE")
      .forEach((t: any) => {
        const categoryName = t.category?.name || "Uncategorized"
        categoryTotal.set(categoryName, (categoryTotal.get(categoryName) || 0) + Math.abs(Number(t.amount || 0)))
      })

    return Array.from(categoryTotal.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)
  }, [transactions])

  // Get unique user IDs for member trends
  const memberNames = useMemo(() => {
    const userIds = new Set<number>()
    transactions.forEach((t: any) => {
      if (t.userId) userIds.add(t.userId)
    })
    return Array.from(userIds)
  }, [transactions])

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overall">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="members">Family Members</TabsTrigger>
        </TabsList>

        <TabsContent value="overall">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-medium">Overall Financial Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} />
                <Tooltip formatter={(value) => [`R$${Number(value).toFixed(2)}`, ""]} />
                    <Line type="monotone" dataKey="income" stroke="#10b981" name="Income" strokeWidth={2} />
                    <Line type="monotone" dataKey="spending" stroke="#f43f5e" name="Spending" strokeWidth={2} />
                    <Line type="monotone" dataKey="savings" stroke="#0ea5e9" name="Savings" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-background border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Average Income</p>
                  <p className="text-2xl font-bold text-green-500">
                    R${" "}
                    {(monthlyTrends.reduce((sum, item) => sum + item.income, 0) / monthlyTrends.length).toFixed(2)}
                  </p>
                </div>
                <div className="bg-background border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Average Spending</p>
                  <p className="text-2xl font-bold text-red-500">
                    R${" "}
                    {(monthlyTrends.reduce((sum, item) => sum + item.spending, 0) / monthlyTrends.length).toFixed(2)}
                  </p>
                </div>
                <div className="bg-background border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Average Savings</p>
                  <p className="text-2xl font-bold text-blue-500">
                    R${" "}
                    {(monthlyTrends.reduce((sum, item) => sum + item.savings, 0) / monthlyTrends.length).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-medium">Category Spending Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={categoryTrends}>
                    <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} />
                <Tooltip formatter={(value) => [`R$${Number(value).toFixed(2)}`, ""]} />
                    {topCategories.map((category, index) => (
                      <Line
                        key={category}
                        type="monotone"
                        dataKey={category}
                        stroke={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        name={category}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-medium">Family Member Spending Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={memberTrends}>
                    <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} />
                <Tooltip formatter={(value) => [`R$${Number(value).toFixed(2)}`, ""]} />
                    {memberNames.map((userId, index) => (
                      <Line
                        key={userId}
                        type="monotone"
                        dataKey={`user${userId}`}
                        stroke={MEMBER_COLORS[index % MEMBER_COLORS.length]}
                        name={`User ${userId}`}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

