"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFamily } from "@/contexts/family-context"
import { format, parseISO, eachMonthOfInterval, subMonths, isWithinInterval, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from "date-fns"

const CATEGORY_COLORS = ["#0ea5e9", "#8b5cf6", "#f43f5e", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6", "#f97316", "#64748b", "#8b5cf6", "#6366f1", "#a855f7", "#22c55e"]
const MEMBER_COLORS = ["#0ea5e9", "#8b5cf6", "#f43f5e", "#10b981"]

export function CategoryAnalysis() {
  const [selectedCategory, setSelectedCategory] = useState("")
  const [timeframe, setTimeframe] = useState("month")
  const { transactions: contextTransactions, familyMembers } = useFamily()

  // Build transactions from context
  const transactions = useMemo(() => {
    return contextTransactions || []
  }, [contextTransactions])

  // Calculate spending by category
  const categorySpendingData = useMemo(() => {
    const now = new Date()
    let start: Date
    switch (timeframe) {
      case "week":
        start = startOfWeek(now)
        break
      case "quarter":
        start = startOfQuarter(now)
        break
      case "year":
        start = startOfYear(now)
        break
      case "month":
      default:
        start = startOfMonth(now)
    }

    // Filter expense transactions within the period
    const expenseTx = transactions.filter((t: any) => {
      if (t.transactionType !== "EXPENSE") return false
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      if (Number.isNaN(date.getTime())) return false
      return isWithinInterval(date, { start, end: now })
    })

    // Group by category
    const categoryMap = new Map<string, { amount: number; color: string }>()
    let colorIndex = 0

    for (const t of expenseTx) {
      const categoryName = t.category?.name || "Uncategorized"
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          amount: 0,
          color: CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length]
        })
        colorIndex++
      }
      const categoryData = categoryMap.get(categoryName)!
      categoryData.amount += Math.abs(Number(t.amount || 0))
    }

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, amount: data.amount, color: data.color }))
      .sort((a, b) => b.amount - a.amount)
  }, [transactions, timeframe])

  const categoryColor = categorySpendingData.find((c) => c.category === selectedCategory)?.color || "#0ea5e9"

  // Calculate spending by member per selected category
  const memberData = useMemo(() => {
    if (!selectedCategory) return []

    const now = new Date()
    let start: Date
    switch (timeframe) {
      case "week":
        start = startOfWeek(now)
        break
      case "quarter":
        start = startOfQuarter(now)
        break
      case "year":
        start = startOfYear(now)
        break
      case "month":
      default:
        start = startOfMonth(now)
    }

    // Filter expense transactions within the period for selected category
    const expenseTx = transactions.filter((t: any) => {
      if (t.transactionType !== "EXPENSE") return false
      const categoryName = t.category?.name || "Uncategorized"
      if (categoryName !== selectedCategory) return false
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      if (Number.isNaN(date.getTime())) return false
      return isWithinInterval(date, { start, end: now })
    })

    // Create a map of userId -> username from familyMembers
    const memberNameMap = new Map<number, string>()
    if (familyMembers) {
      familyMembers.forEach((member) => {
        memberNameMap.set(member.userId, member.username || `User ${member.userId}`)
      })
    }

    // Group by userId
    const userMap = new Map<number, { name: string; amount: number }>()
    let colorIndex = 0

    for (const t of expenseTx) {
      const userId = t.userId
      if (!userId) continue

      if (!userMap.has(userId)) {
      
        const username = memberNameMap.get(userId) || `User ${userId}`
        userMap.set(userId, {
          name: username,
          amount: 0
        })
        colorIndex++
      }

      const userData = userMap.get(userId)!
      userData.amount += Math.abs(Number(t.amount || 0))
    }

    return Array.from(userMap.values())
  }, [transactions, timeframe, selectedCategory, familyMembers])

  // Calculate monthly trends for selected category
  const trendData = useMemo(() => {
    if (!selectedCategory) return []

    const sixMonthsAgo = subMonths(new Date(), 6)
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: new Date() })

    // Filter expense transactions within the period for selected category
    const expenseTx = transactions.filter((t: any) => {
      if (t.transactionType !== "EXPENSE") return false
      const categoryName = t.category?.name || "Uncategorized"
      if (categoryName !== selectedCategory) return false
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      if (Number.isNaN(date.getTime())) return false
      return isWithinInterval(date, { start: sixMonthsAgo, end: new Date() })
    })

    // Group by month
    const monthMap = new Map<string, number>()
    for (const t of expenseTx) {
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      const monthKey = format(date, "MMM")
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + Math.abs(Number(t.amount || 0)))
    }

    return months.map(month => ({
      month: format(month, "MMM"),
      amount: monthMap.get(format(month, "MMM")) || 0
    }))
  }, [transactions, selectedCategory])

  const totalSpending = useMemo(() => categorySpendingData.reduce((sum, item) => sum + item.amount, 0), [categorySpendingData])

  // Set first category as default if not set
  useEffect(() => {
    if (!selectedCategory && categorySpendingData.length > 0) {
      setSelectedCategory(categorySpendingData[0].category)
    }
  }, [categorySpendingData, selectedCategory])

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categorySpendingData.map((category) => (
              <SelectItem key={category.category} value={category.category}>
                {category.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-medium">Category Spending Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categorySpendingData}>
                  <XAxis dataKey="category" />
                  <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} />
                  <Tooltip formatter={(value) => [`R$${Number(value).toFixed(2)}`, "Amount"]} />
                  <Bar dataKey="amount">
                    {categorySpendingData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.category === selectedCategory ? entry.color : `${entry.color}80`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">Who Spends on {selectedCategory}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberData}>
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} />
                  <Tooltip formatter={(value) => [`R$${Number(value).toFixed(2)}`, "Amount"]} />
                  <Bar dataKey="amount" fill={categoryColor} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">{selectedCategory} Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} />
                  <Tooltip formatter={(value) => [`R$${Number(value).toFixed(2)}`, "Amount"]} />
                  <Bar dataKey="amount" fill={categoryColor} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-medium">Category Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pie">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pie">Pie Chart</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            <TabsContent value="pie">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySpendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="amount"
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categorySpendingData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.category === selectedCategory ? entry.color : entry.color}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`R$${Number(value).toFixed(2)}`, "Amount"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="list">
              <div className="space-y-2 mt-4">
                {categorySpendingData
                  .sort((a, b) => b.amount - a.amount)
                  .map((category) => (
                    <div
                      key={category.category}
                      className={`flex items-center justify-between p-2 rounded-md ${
                        category.category === selectedCategory ? "bg-secondary" : "bg-background border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                          aria-hidden="true"
                        ></div>
                        <span>{category.category}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-medium">R$ {category.amount.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">
                          {((category.amount / totalSpending) * 100).toFixed(0)}% of total
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

