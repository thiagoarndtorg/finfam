"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BudgetSettingsForm } from "@/components/budget-management/budget-settings-form"
import { CategoryManagement } from "@/components/budget-management/category-management"

export default function BudgetManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Budget & Category Management</h1>
      </div>

      <Tabs defaultValue="budget" className="space-y-4">
        <TabsList>
          <TabsTrigger value="budget">Budget Settings</TabsTrigger>
          <TabsTrigger value="categories">Category Management</TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Allocation</CardTitle>
              <CardDescription>Set monthly budget limits for each spending category and family member</CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>Create, edit, and delete expense categories to organize your spending</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

