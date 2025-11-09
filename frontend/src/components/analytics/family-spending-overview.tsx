"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useTheme } from "next-themes"
import { useFamily } from "@/contexts/family-context"
import { format, parseISO, eachMonthOfInterval, subMonths, isWithinInterval, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from "date-fns"

const MEMBER_COLORS = ["#0ea5e9", "#8b5cf6", "#f43f5e", "#10b981", "#f59e0b", "#6366f1", "#a855f7", "#22c55e"]

export function FamilySpendingOverview() {
  const { theme } = useTheme()
  const [timeframe, setTimeframe] = useState("month")
  const { transactions: contextTransactions } = useFamily()

  // Build transactions from context
  const transactions = useMemo(() => {
    return contextTransactions || []
  }, [contextTransactions])

  // Filter transactions by timeframe and calculate monthly spending
  const monthlySpendingData = useMemo(() => {
    const now = new Date()

    // Filter expense transactions for the last 6 months
    const sixMonthsAgo = subMonths(now, 6)
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now })

    const expenseTx = transactions.filter((t: any) => {
      if (t.transactionType !== "EXPENSE") return false
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      if (Number.isNaN(date.getTime())) return false
      return isWithinInterval(date, { start: sixMonthsAgo, end: now })
    })

    const monthMap = new Map<string, number>()
    for (const t of expenseTx) {
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      const monthKey = format(date, "MMM")
      const amount = Math.abs(Number(t.amount || 0))
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + amount)
    }

    // Calculate average for budget line
    const spendingValues = Array.from(monthMap.values())
    const avgBudget = spendingValues.length > 0 ? spendingValues.reduce((sum, val) => sum + val, 0) / spendingValues.length : 0

    return months.map(month => {
      const monthKey = format(month, "MMM")
      const totalSpending = monthMap.get(monthKey) || 0
      return {
        month: monthKey,
        totalSpending,
        budget: avgBudget,
      }
    })
  }, [transactions])

  // Calculate spending by user (simulating family members)
  const memberSpendingData = useMemo(() => {
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

    // Group by userId
    const userMap = new Map<number, { name: string; spending: number; color: string }>()
    let colorIndex = 0

    for (const t of expenseTx) {
      const userId = t.userId
      if (!userId) continue

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          name: `User ${userId}`,
          spending: 0,
          color: MEMBER_COLORS[colorIndex % MEMBER_COLORS.length]
        })
        colorIndex++
      }

      const userData = userMap.get(userId)!
      userData.spending += Math.abs(Number(t.amount || 0))
    }

    return Array.from(userMap.values()).map(({ name, spending, color }) => ({ name, spending, color }))
  }, [transactions, timeframe])

  const totalSpending = useMemo(() => memberSpendingData.reduce((sum, member) => sum + member.spending, 0), [memberSpendingData])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-medium">Family Spending Overview</CardTitle>
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
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySpendingData}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} />
                <Tooltip formatter={(value) => [`R$${Number(value).toFixed(2)}`, ""]} />
                <Line type="monotone" dataKey="totalSpending" stroke="#f43f5e" name="Total Spending" strokeWidth={2} />
                <Line
                  type="monotone"
                  dataKey="budget"
                  stroke="#10b981"
                  name="Budget"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Spending by Family Member</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberSpendingData}>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `R$${(value / 100).toFixed(0)}`} />
                <Tooltip formatter={(value) => [`R$${Number(value).toFixed(2)}`, "Spending"]} />
                <Bar dataKey="spending" name="Spending">
                  {memberSpendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-medium">Spending Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={memberSpendingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="spending"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {memberSpendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`R$${Number(value).toFixed(2)}`, "Spending"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2">
            {memberSpendingData.map((member) => (
              <div key={member.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: member.color }}
                    aria-hidden="true"
                  ></div>
                  <span className="text-sm">{member.name}</span>
                </div>
                <span className="text-sm font-medium">
                  R$ {member.spending.toFixed(2)} ({((member.spending / totalSpending) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

