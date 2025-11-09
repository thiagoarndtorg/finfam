"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Save, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useFamily } from "@/contexts/family-context"
import { useFamilyBudgets, useSaveBudgets, useFamilyMembers } from "@/hooks/use-api"
import { useEffect } from "react"

//

export function BudgetSettingsForm() {
  // Contexto e hooks
  const { familyId, categories } = useFamily()
  const [familyMembers, setFamilyMembers] = useState<Array<{id: number; userId: number; username: string}>>([])
  const { data: budgetsData, execute: fetchBudgets } = useFamilyBudgets()
  const { execute: saveBudgets, isLoading: isSaving } = useSaveBudgets()
  const { data: membersData, execute: fetchMembers } = useFamilyMembers()

  // Período atual (mês e ano correntes)
  const currentDate = new Date()
  const [year] = useState(currentDate.getFullYear())
  const [month] = useState(currentDate.getMonth() + 1)

  // Estados de budgets
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({})
  const [memberBudgets, setMemberBudgets] = useState<Record<string, string>>({})

  // Carregar dados iniciais
  useEffect(() => {
    if (familyId) {
      fetchBudgets(familyId, year, month)
      fetchMembers(familyId)
    }
  }, [familyId, year, month])

  // Atualizar membros quando dados chegarem
  useEffect(() => {
    if (membersData) {
      setFamilyMembers(membersData)
    }
  }, [membersData])

  // Atualizar budgets quando dados chegarem
  useEffect(() => {
    if (budgetsData) {
      const catBudgets: Record<string, string> = {}
      const memBudgets: Record<string, string> = {}

      budgetsData.forEach(budget => {
        if (budget.budgetType === 'CATEGORY' && budget.categoryId) {
          catBudgets[budget.categoryId.toString()] = budget.amount.toFixed(2)
        } else if (budget.budgetType === 'MEMBER' && budget.userId) {
          memBudgets[budget.userId.toString()] = budget.amount.toFixed(2)
        }
      })

      setCategoryBudgets(catBudgets)
      setMemberBudgets(memBudgets)
    }
  }, [budgetsData])

  const handleCategoryBudgetChange = (id: any, value: any) => {
    setCategoryBudgets((prev) => ({
      ...prev,
      [String(id)]: value,
    }))
  }

  const handleMemberBudgetChange = (id: any, value: any) => {
    setMemberBudgets((prev) => ({
      ...prev,
      [String(id)]: value,
    }))
  }

  const handleSaveBudgets = async () => {
    if (!familyId) return

    // Construir array de budgets a partir dos estados
    const budgets = [
      // Budgets de categorias
      ...Object.entries(categoryBudgets).map(([categoryId, amount]) => ({
        categoryId: parseInt(categoryId),
        userId: undefined,
        budgetType: 'CATEGORY',
        amount: parseFloat(amount) || 0
      })),
      // Budgets de membros
      ...Object.entries(memberBudgets).map(([userId, amount]) => ({
        categoryId: undefined,
        userId: parseInt(userId),
        budgetType: 'MEMBER',
        amount: parseFloat(amount) || 0
      }))
    ]

    try {
      await saveBudgets({ familyId, year, month, budgets })
      toast.success("Budget settings saved successfully")
      // Recarregar dados atualizados
      fetchBudgets(familyId, year, month)
    } catch (error) {
      toast.error("Failed to save budget settings")
    }
  }

  const handleResetBudgets = () => {
    if (familyId) {
      fetchBudgets(familyId, year, month)
      toast.info("Budget settings reset to saved values")
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="by-category">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="by-category">By Category</TabsTrigger>
          <TabsTrigger value="by-member">By Family Member</TabsTrigger>
        </TabsList>

        <TabsContent value="by-category" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id} className="overflow-hidden">
                <div className="h-2" style={{ backgroundColor: category.color }}></div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                    <div className="flex items-center">
                      <span className="mr-2">R$</span>
                      <Input
                        id={`category-${category.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={categoryBudgets[String(category.id)] ?? ""}
                        onChange={(e) => handleCategoryBudgetChange(category.id, e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="by-member" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {familyMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Label htmlFor={`member-${member.id}`}>{member.username}</Label>
                    <div className="flex items-center">
                      <span className="mr-2">R$</span>
                      <Input
                        id={`member-${member.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={memberBudgets[String(member.userId)] ?? ""}
                        onChange={(e) => handleMemberBudgetChange(member.userId, e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleResetBudgets}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button onClick={handleSaveBudgets} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Budgets
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

