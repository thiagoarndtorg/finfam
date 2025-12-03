"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BudgetSettingsForm } from "@/components/budget-management/budget-settings-form"
import { CategoryManagement } from "@/components/budget-management/category-management"
import { useFamily } from "@/contexts/family-context"
import { useI18n } from "@/contexts/i18n-context"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"

export default function BudgetManagementPage() {
  const { isCurrentUserAdmin, currentUserRole } = useFamily();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (currentUserRole === 'MEMBER') {
      toast.error(t("toasts.error.accessDenied"));
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
        <h1 className="text-3xl font-bold tracking-tight">{t("budget.budgetManagement")}</h1>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
        <TabsTrigger value="categories">{t("budget.categoryManagement")}</TabsTrigger>
          <TabsTrigger value="budget">{t("budget.budgetSettings")}</TabsTrigger>
        
        </TabsList>
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("budget.categoryManagement")}</CardTitle>
              <CardDescription>{t("budget.categoryManagementDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryManagement />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("budget.budgetAllocation")}</CardTitle>
              <CardDescription>{t("budget.budgetAllocationDescription")}</CardDescription>
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

