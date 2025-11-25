"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BudgetSettingsForm } from "@/components/budget-management/budget-settings-form"
import { CategoryManagement } from "@/components/budget-management/category-management"
import { useFamily } from "@/contexts/family-context"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"

export default function BudgetManagementPage() {
  const { isCurrentUserAdmin, currentUserRole } = useFamily();
  const router = useRouter();

  useEffect(() => {
    if (currentUserRole === 'MEMBER') {
      toast.error('Acesso negado. Apenas administradores podem gerenciar orçamentos.');
      router.push('/');
    }
  }, [currentUserRole, router]);

  if (!currentUserRole) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUserRole === 'MEMBER') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Budget & Category Management</h1>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
        <TabsTrigger value="categories">Category Management</TabsTrigger>
          <TabsTrigger value="budget">Budget Settings</TabsTrigger>
        
        </TabsList>
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

       
      </Tabs>
    </div>
  )
}

