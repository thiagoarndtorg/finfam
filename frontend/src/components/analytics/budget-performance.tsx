"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Progress } from "@/components/ui/progress"
import { useFamilyBudgets, useFamilyMembers } from "@/hooks/use-api"
import { useFamily } from "@/contexts/family-context"
import { parseISO, isWithinInterval, startOfWeek, startOfMonth, startOfQuarter, startOfYear, format } from "date-fns"

const CATEGORY_COLORS = ["#0ea5e9", "#8b5cf6", "#f43f5e", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6", "#f97316", "#64748b", "#8b5cf6", "#6366f1", "#a855f7", "#22c55e"]

export function BudgetPerformance() {
  const [timeframe, setTimeframe] = useState("month")
  const { familyId, transactions: contextTransactions } = useFamily()
  const { execute: fetchBudgets, data: budgetsData, isLoading: budgetsLoading } = useFamilyBudgets()
  const { execute: fetchMembers, data: membersData, isLoading: membersLoading } = useFamilyMembers()

  // Build transactions from context
  const transactions = useMemo(() => {
    return contextTransactions || []
  }, [contextTransactions])

  // Calculate year and month from timeframe
  const { year, month } = useMemo(() => {
    const now = new Date()
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1 // JavaScript months are 0-indexed
    }
  }, [timeframe])

  // Fetch budgets when familyId or timeframe changes
  useEffect(() => {
    if (familyId) {
      fetchBudgets(familyId, year, month)
      fetchMembers(familyId)
    }
  }, [familyId, year, month, fetchBudgets, fetchMembers])

  // Create member map for quick lookups
  const memberMap = useMemo(() => {
    const map = new Map<number, string>()
    ;(membersData || []).forEach((member: any) => {
      map.set(member.userId, member.username)
    })
    return map
  }, [membersData])

  // Filter transactions by timeframe
  const filteredTransactions = useMemo(() => {
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

    return transactions.filter((t: any) => {
      if (t.transactionType !== "EXPENSE") return false
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      if (Number.isNaN(date.getTime())) return false
      return isWithinInterval(date, { start, end: now })
    })
  }, [transactions, timeframe])

  // Process category budgets
  const budgetCategories = useMemo(() => {
    const budgets = budgetsData || []
    const categoryBudgets = budgets.filter((b: any) => b.budgetType === "CATEGORY")

    // Create map of categoryId to budget amount
    const budgetMap = new Map<number, number>()
    categoryBudgets.forEach((budget: any) => {
      if (budget.categoryId) {
        budgetMap.set(budget.categoryId, budget.amount || 0)
      }
    })

    // Calculate actual spending per category
    const spendingMap = new Map<number, number>()
    filteredTransactions.forEach((t: any) => {
      if (t.category?.id) {
        const categoryId = t.category.id
        const amount = Math.abs(Number(t.amount || 0))
        spendingMap.set(categoryId, (spendingMap.get(categoryId) || 0) + amount)
      }
    })

    // Combine budgets with spending
    const categoryData = new Map<string, { budget: number; spent: number; categoryName: string; color: string }>()
    let colorIndex = 0

    categoryBudgets.forEach((budget: any) => {
      if (budget.categoryId && budget.categoryName) {
        const categoryId = budget.categoryId
        const budgetAmount = budget.amount || 0
        const spent = spendingMap.get(categoryId) || 0
        const remaining = budgetAmount - spent
        const percentSpent = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
        let status: "on-track" | "at-limit" | "over-budget"
        
        if (percentSpent < 90) {
          status = "on-track"
        } else if (percentSpent >= 90 && percentSpent <= 100) {
          status = "at-limit"
        } else {
          status = "over-budget"
        }

        categoryData.set(budget.categoryName, {
          budget: budgetAmount,
          spent,
          categoryName: budget.categoryName,
          color: CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length]
        })
        colorIndex++
      }
    })

    return Array.from(categoryData.values()).map((item) => {
      const remaining = item.budget - item.spent
      const percentSpent = item.budget > 0 ? (item.spent / item.budget) * 100 : 0
      let status: "on-track" | "at-limit" | "over-budget"
      
      if (percentSpent < 90) {
        status = "on-track"
      } else if (percentSpent >= 90 && percentSpent <= 100) {
        status = "at-limit"
      } else {
        status = "over-budget"
      }

      return {
        ...item,
        remaining,
        status
      }
    })
  }, [budgetsData, filteredTransactions])

  // Process member budgets
  const memberBudgetPerformance = useMemo(() => {
    const budgets = budgetsData || []
    const memberBudgets = budgets.filter((b: any) => b.budgetType === "MEMBER")

    // Create map of userId to budget amount
    const budgetMap = new Map<number, number>()
    memberBudgets.forEach((budget: any) => {
      if (budget.userId) {
        budgetMap.set(budget.userId, budget.amount || 0)
      }
    })

    // Calculate actual spending per member
    const spendingMap = new Map<number, number>()
    filteredTransactions.forEach((t: any) => {
      const userId = t.userId
      if (userId) {
        const amount = Math.abs(Number(t.amount || 0))
        spendingMap.set(userId, (spendingMap.get(userId) || 0) + amount)
      }
    })

    // Combine budgets with spending
    return Array.from(budgetMap.entries()).map(([userId, budgetAmount]) => {
      const spent = spendingMap.get(userId) || 0
      const remaining = budgetAmount - spent
      const percentSpent = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
      let status: "on-track" | "at-limit" | "over-budget"
      
      if (percentSpent < 90) {
        status = "on-track"
      } else if (percentSpent >= 90 && percentSpent <= 100) {
        status = "at-limit"
      } else {
        status = "over-budget"
      }

      return {
        name: memberMap.get(userId) || `User ${userId}`,
        budget: budgetAmount,
        spent,
        remaining,
        status
      }
    })
  }, [budgetsData, filteredTransactions, memberMap])

  // Calculate overall budget totals
  const totalBudget = useMemo(() => budgetCategories.reduce((sum, item) => sum + item.budget, 0), [budgetCategories])
  const totalSpent = useMemo(() => budgetCategories.reduce((sum, item) => sum + item.spent, 0), [budgetCategories])
  const totalRemaining = totalBudget - totalSpent
  const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const getStatusColor = (status: "on-track" | "at-limit" | "over-budget") => {
    switch (status) {
      case "on-track":
        return "text-green-500"
      case "at-limit":
        return "text-yellow-500"
      case "over-budget":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getProgressColor = (status: "on-track" | "at-limit" | "over-budget") => {
    switch (status) {
      case "on-track":
        return "bg-green-500"
      case "at-limit":
        return "bg-yellow-500"
      case "over-budget":
        return "bg-red-500"
      default:
        return "bg-primary"
    }
  }

  if (budgetsLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">Loading budget data...</p>
      </div>
    )
  }

  if (budgetCategories.length === 0 && memberBudgetPerformance.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
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
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">No budgets set for this period.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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

      {budgetCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">Overall Budget Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-background border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">R$ {totalBudget.toFixed(2)}</p>
              </div>
              <div className="bg-background border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">R$ {totalSpent.toFixed(2)}</p>
              </div>
              <div className="bg-background border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={`text-2xl font-bold ${totalRemaining >= 0 ? "text-green-500" : "text-red-500"}`}>
                  R$ {totalRemaining.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Budget Usage</span>
                <span className="text-sm text-muted-foreground">{percentSpent.toFixed(0)}% used</span>
              </div>
              <Progress
                value={percentSpent}
                className={`h-2 ${percentSpent > 90 ? "bg-red-500" : percentSpent > 75 ? "bg-yellow-500" : "bg-green-500"}`}
              />
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetCategories} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} />
                  <YAxis type="category" dataKey="categoryName" width={100} />
                  <Tooltip
                    formatter={(value) => [`R$${Number(value).toFixed(2)}`, ""]}
                    labelFormatter={(label) => `Category: ${label}`}
                  />
                  <Bar dataKey="budget" name="Budget" stackId="a" fill="#94a3b8" />
                  <Bar dataKey="spent" name="Spent" stackId="b">
                    {budgetCategories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.status === "over-budget" ? "#f43f5e" : entry.status === "at-limit" ? "#f59e0b" : "#10b981"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {budgetCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-medium">Category Budget Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgetCategories.map((category) => (
                  <div key={category.categoryName} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{category.categoryName}</span>
                      <span className={getStatusColor(category.status)}>
                        {category.status === "over-budget"
                          ? "Over Budget"
                          : category.status === "at-limit"
                            ? "At Limit"
                            : "On Track"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>
                        R$ {category.spent.toFixed(2)} / R$ {category.budget.toFixed(2)}
                      </span>
                      <span>{((category.spent / category.budget) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={(category.spent / category.budget) * 100}
                      className={`h-2 ${getProgressColor(category.status)}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {memberBudgetPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-medium">Family Member Budget Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {memberBudgetPerformance.map((member) => (
                  <div key={member.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{member.name}</span>
                      <span className={getStatusColor(member.status)}>
                        {member.status === "over-budget"
                          ? "Over Budget"
                          : member.status === "at-limit"
                            ? "At Limit"
                            : "On Track"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>
                        R$ {member.spent.toFixed(2)} / R$ {member.budget.toFixed(2)}
                      </span>
                      <span>{((member.spent / member.budget) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={(member.spent / member.budget) * 100}
                      className={`h-2 ${getProgressColor(member.status)}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
