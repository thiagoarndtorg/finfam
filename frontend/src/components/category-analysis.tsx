"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for spending by category
const categorySpendingData = [
  { category: "Groceries", amount: 140000, color: "#0ea5e9" },
  { category: "Dining", amount: 80000, color: "#8b5cf6" },
  { category: "Transportation", amount: 45000, color: "#f43f5e" },
  { category: "Housing", amount: 200000, color: "#10b981" },
  { category: "Utilities", amount: 35000, color: "#f59e0b" },
  { category: "Entertainment", amount: 60000, color: "#6366f1" },
  { category: "Shopping", amount: 70000, color: "#ec4899" },
  { category: "Education", amount: 25000, color: "#14b8a6" },
  { category: "Healthcare", amount: 30000, color: "#f97316" },
  { category: "Other", amount: 15000, color: "#64748b" },
]

// Mock data for spending by family member per category
const memberSpendingByCategory = {
  Groceries: [
    { name: "Parent 1", amount: 80000 },
    { name: "Parent 2", amount: 60000 },
  ],
  Dining: [
    { name: "Parent 1", amount: 30000 },
    { name: "Parent 2", amount: 25000 },
    { name: "Child 1", amount: 15000 },
    { name: "Child 2", amount: 10000 },
  ],
  Transportation: [
    { name: "Parent 1", amount: 25000 },
    { name: "Parent 2", amount: 20000 },
  ],
  Entertainment: [
    { name: "Parent 1", amount: 15000 },
    { name: "Parent 2", amount: 20000 },
    { name: "Child 1", amount: 25000 },
    { name: "Child 2", amount: 20000 },
  ],
  Shopping: [
    { name: "Parent 1", amount: 20000 },
    { name: "Parent 2", amount: 15000 },
    { name: "Child 1", amount: 20000 },
    { name: "Child 2", amount: 15000 },
  ],
  Education: [
    { name: "Child 1", amount: 15000 },
    { name: "Child 2", amount: 10000 },
  ],
}

// Mock data for monthly trends by category
const monthlyTrendsByCategory = {
  Groceries: [
    { month: "Jan", amount: 120000 },
    { month: "Feb", amount: 130000 },
    { month: "Mar", amount: 135000 },
    { month: "Apr", amount: 140000 },
    { month: "May", amount: 145000 },
    { month: "Jun", amount: 140000 },
  ],
  Dining: [
    { month: "Jan", amount: 70000 },
    { month: "Feb", amount: 75000 },
    { month: "Mar", amount: 80000 },
    { month: "Apr", amount: 85000 },
    { month: "May", amount: 80000 },
    { month: "Jun", amount: 80000 },
  ],
  Transportation: [
    { month: "Jan", amount: 40000 },
    { month: "Feb", amount: 42000 },
    { month: "Mar", amount: 45000 },
    { month: "Apr", amount: 43000 },
    { month: "May", amount: 44000 },
    { month: "Jun", amount: 45000 },
  ],
}

export function CategoryAnalysis() {
  const [selectedCategory, setSelectedCategory] = useState("Groceries")
  const [timeframe, setTimeframe] = useState("month")

  const categoryColor = categorySpendingData.find((c) => c.category === selectedCategory)?.color || "#0ea5e9"
  const memberData = memberSpendingByCategory[selectedCategory] || []
  const trendData = monthlyTrendsByCategory[selectedCategory] || []

  const totalSpending = categorySpendingData.reduce((sum, item) => sum + item.amount, 0)

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
                  <YAxis tickFormatter={(value) => `R$${(value / 100).toFixed(0)}`} />
                  <Tooltip formatter={(value) => [`R$${(value / 100).toFixed(2)}`, "Amount"]} />
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
                  <YAxis tickFormatter={(value) => `R$${(value / 100).toFixed(0)}`} />
                  <Tooltip formatter={(value) => [`R$${(value / 100).toFixed(2)}`, "Amount"]} />
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
                  <YAxis tickFormatter={(value) => `R$${(value / 100).toFixed(0)}`} />
                  <Tooltip formatter={(value) => [`R$${(value / 100).toFixed(2)}`, "Amount"]} />
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
                    <Tooltip formatter={(value) => [`R$${(value / 100).toFixed(2)}`, "Amount"]} />
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
                        <span className="font-medium">R$ {(category.amount / 100).toFixed(2)}</span>
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

