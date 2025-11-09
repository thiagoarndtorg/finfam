"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFamilyMembers } from "@/hooks/use-api"
import { useFamily } from "@/contexts/family-context"
import { parseISO, isWithinInterval, startOfWeek, startOfMonth, startOfQuarter, startOfYear, eachMonthOfInterval, subMonths, format } from "date-fns"

const MEMBER_COLORS = ["#0ea5e9", "#8b5cf6", "#f43f5e", "#10b981", "#f59e0b", "#6366f1", "#a855f7", "#22c55e"]

export function MemberComparison() {
  const [timeframe, setTimeframe] = useState("month")
  const { familyId, transactions: contextTransactions } = useFamily()
  const { execute: fetchFamilyMembers, data: familyMembersData, isLoading: membersLoading } = useFamilyMembers()

  // Fetch family members when familyId is available
  useEffect(() => {
    if (familyId) {
      fetchFamilyMembers(familyId)
    }
  }, [familyId, fetchFamilyMembers])

  // Build transactions from context
  const transactions = useMemo(() => {
    return contextTransactions || []
  }, [contextTransactions])

  // Process members data and create map
  const { members, memberMap } = useMemo(() => {
    const membersList = (familyMembersData || []).map((member, index) => ({
      id: member.userId.toString(),
      userId: member.userId,
      name: member.username,
      avatar: member.avatarUrl || "/placeholder.svg?height=40&width=40",
      color: MEMBER_COLORS[index % MEMBER_COLORS.length]
    }))
    
    const map = new Map<number, typeof membersList[0]>()
    membersList.forEach(member => {
      map.set(member.userId, member)
    })

    return { members: membersList, memberMap: map }
  }, [familyMembersData])

  // Set default selected member
  const [selectedMember, setSelectedMember] = useState<string>("")
  useEffect(() => {
    if (members.length > 0 && !selectedMember) {
      setSelectedMember(members[0].id)
    }
  }, [members, selectedMember])

  const selectedMemberData = members.find((m) => m.id === selectedMember)
  const selectedUserId = selectedMemberData?.userId

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

  // Calculate spending by category for selected member
  const memberData = useMemo(() => {
    if (!selectedUserId) return []

    const memberTx = filteredTransactions.filter((t: any) => t.userId === selectedUserId)
    const categoryMap = new Map<string, number>()

    for (const t of memberTx) {
      const categoryName = t.category?.name || "Uncategorized"
      const amount = Math.abs(Number(t.amount || 0))
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + amount)
    }

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredTransactions, selectedUserId])

  // Calculate monthly spending trends for selected member (last 6 months)
  const trendData = useMemo(() => {
    if (!selectedUserId) return []

    const now = new Date()
    const sixMonthsAgo = subMonths(now, 6)
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now })

    const memberTx = transactions.filter((t: any) => {
      if (t.transactionType !== "EXPENSE") return false
      if (t.userId !== selectedUserId) return false
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      if (Number.isNaN(date.getTime())) return false
      return isWithinInterval(date, { start: sixMonthsAgo, end: now })
    })

    const monthMap = new Map<string, number>()
    for (const t of memberTx) {
      const date = typeof t.transactionDate === "string" ? parseISO(t.transactionDate) : new Date(t.transactionDate)
      const monthKey = format(date, "MMM")
      const amount = Math.abs(Number(t.amount || 0))
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + amount)
    }

    return months.map(month => ({
      month: format(month, "MMM"),
      amount: monthMap.get(format(month, "MMM")) || 0
    }))
  }, [transactions, selectedUserId])

  const totalSpending = useMemo(() => memberData.reduce((sum, item) => sum + item.amount, 0), [memberData])

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">Loading family members...</p>
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">No family members found.</p>
      </div>
    )
  }

  if (!selectedMemberData) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedMemberData.avatar} alt={selectedMemberData.name} />
            <AvatarFallback>{selectedMemberData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select family member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {memberData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No spending data available for the selected period.</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={memberData} layout="vertical">
                    <XAxis type="number" tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} />
                    <YAxis type="category" dataKey="category" width={100} />
                    <Tooltip formatter={(value) => [`R$${Number(value).toFixed(2)}`, "Amount"]} />
                    <Bar dataKey="amount" fill={selectedMemberData.color} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No spending data available for the last 6 months.</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} />
                    <Tooltip formatter={(value) => [`R$${Number(value).toFixed(2)}`, "Amount"]} />
                    <Bar dataKey="amount" fill={selectedMemberData.color} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-medium">Spending Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {memberData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-muted-foreground">No spending data available.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-background border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total Spending</p>
                  <p className="text-2xl font-bold">R$ {totalSpending.toFixed(2)}</p>
                </div>
                <div className="bg-background border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Largest Category</p>
                  <p className="text-2xl font-bold">{memberData.length > 0 ? memberData[0].category : "N/A"}</p>
                </div>
                <div className="bg-background border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Average per Month</p>
                  <p className="text-2xl font-bold">
                    R$ {trendData.length > 0 ? (trendData.reduce((sum, item) => sum + item.amount, 0) / trendData.length).toFixed(2) : "0.00"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Top Expenses</h3>
                {memberData
                  .slice(0, 3)
                  .map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-background border rounded-md">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedMemberData.color }}
                          aria-hidden="true"
                        ></div>
                        <span>{item.category}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-medium">R$ {item.amount.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">
                          {totalSpending > 0 ? ((item.amount / totalSpending) * 100).toFixed(0) : 0}% of total
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
