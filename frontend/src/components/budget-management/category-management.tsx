"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useFamily } from "@/contexts/family-context"
import { useI18n } from "@/contexts/i18n-context"
import { useFamilyCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/use-api"

export function CategoryManagement() {
  const { familyId, categories, setCategories } = useFamily()
  const { t } = useI18n()
  const { data: categoriesData, execute: fetchCategories } = useFamilyCategories()
  const { execute: createCategory } = useCreateCategory()
  const { execute: updateCategory } = useUpdateCategory()
  const { execute: deleteCategory } = useDeleteCategory()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState(null)
  const [newCategory, setNewCategory] = useState({ name: "", color: "#0ea5e9", icon: "📁", isIncome: false })

  // Fetch categories when component mounts
  useEffect(() => {
    if (familyId) {
      fetchCategories(familyId)
    }
  }, [familyId])

  // Update context when data changes
  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData)
    }
  }, [categoriesData, setCategories])

  const handleAddCategory = async () => {
    try {
      const result = await createCategory({
        familyId,
        name: newCategory.name,
        color: newCategory.color,
        icon: newCategory.icon,
        isIncome: newCategory.isIncome
      })
      
      if (result) {
        setCategories([...categories, result])
        setNewCategory({ name: "", color: "#0ea5e9", icon: "📁", isIncome: false })
        setIsAddDialogOpen(false)
        toast.success(t("toasts.success.categoryAdded"))
      }
    } catch (error) {
      toast.error(t("toasts.error.categoryAdd"))
    }
  }

  const handleEditCategory = async () => {
    try {
      const result = await updateCategory({
        id: currentCategory.id,
        familyId,
        name: currentCategory.name,
        color: currentCategory.color,
        icon: currentCategory.icon,
        isIncome: currentCategory.isIncome
      })
      
      if (result) {
        setCategories(categories.map((category) => (category.id === currentCategory.id ? result : category)))
        setIsEditDialogOpen(false)
        toast.success(t("toasts.success.categoryUpdated"))
      }
    } catch (error) {
      toast.error(t("toasts.error.categoryUpdate"))
    }
  }

  const handleDeleteCategory = async () => {
    try {
      await deleteCategory({ id: currentCategory.id, familyId })
      setCategories(categories.filter((category) => category.id !== currentCategory.id))
      setIsDeleteDialogOpen(false)
      toast.success(t("toasts.success.categoryDeleted"))
    } catch (error) {
      toast.error(t("toasts.error.categoryDelete"))
    }
  }

  const openEditDialog = (category) => {
    setCurrentCategory({ ...category })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (category) => {
    setCurrentCategory(category)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("categories.add")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">{t("categories.color")}</TableHead>
              <TableHead className="w-[50px]">{t("categories.icon")}</TableHead>
              <TableHead>{t("categories.categoryName")}</TableHead>
              <TableHead className="text-right w-[120px]">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: category.color }}></div>
                </TableCell>
                <TableCell>
                  <div className="text-xl">{category.icon}</div>
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">{t("common.edit")}</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(category)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t("common.delete")}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("categories.add")}</DialogTitle>
            <DialogDescription>{t("categories.addDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">{t("categories.categoryName")}</Label>
              <Input
                id="category-name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder={t("categories.categoryNamePlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-color">{t("categories.color")}</Label>
              <div className="flex gap-2">
                <Input
                  id="category-color"
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <div className="w-10 h-10 rounded-md" style={{ backgroundColor: newCategory.color }}></div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-icon">Icon (Emoji)</Label>
              <Input
                id="category-icon"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                placeholder="📁"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAddCategory} disabled={!newCategory.name}>
              {t("categories.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      {currentCategory && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("categories.edit")}</DialogTitle>
              <DialogDescription>{t("categories.editDescription")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category-name">{t("categories.categoryName")}</Label>
                <Input
                  id="edit-category-name"
                  value={currentCategory.name}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category-color">{t("categories.color")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-category-color"
                    type="color"
                    value={currentCategory.color}
                    onChange={(e) => setCurrentCategory({ ...currentCategory, color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <div className="w-10 h-10 rounded-md" style={{ backgroundColor: currentCategory.color }}></div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category-icon">{t("categories.icon")} ({t("categories.emoji")})</Label>
                <Input
                  id="edit-category-icon"
                  value={currentCategory.icon}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, icon: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleEditCategory} disabled={!currentCategory.name}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Category Dialog */}
      {currentCategory && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("categories.delete")}</DialogTitle>
              <DialogDescription>
                {t("categories.deleteConfirm")}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 border rounded-md">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: currentCategory.color }}></div>
                <div className="text-xl">{currentCategory.icon}</div>
                <span className="font-medium">{currentCategory.name}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleDeleteCategory}>
                {t("categories.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

