"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tag } from "lucide-react"
import { useFamily } from "@/contexts/family-context"

type FilterCategory = {
  id: string;
  name: string;
  checked: boolean;
}

export function CategoryFilter() {
  const { categories: contextCategories, selectedCategoryIds, setSelectedCategoryIds } = useFamily();
  const [categories, setCategories] = useState<FilterCategory[]>([])

  // Transform context categories to filter format and sync with selectedCategoryIds
  useEffect(() => {
    if (contextCategories.length > 0) {
      const transformedCategories: FilterCategory[] = contextCategories.map((category) => {
        const checked = selectedCategoryIds.length === 0 || selectedCategoryIds.includes(category.id);
        return {
          id: String(category.id),
          name: category.name,
          checked
        };
      });
      setCategories(transformedCategories);
    }
  }, [contextCategories, selectedCategoryIds]);

  const handleCheckedChange = (id: string, checked: boolean) => {
    const categoryId = Number(id);
    
    // Update local state for immediate UI feedback
    setCategories((prev) =>
      prev.map((category) => {
        if (category.id === id) {
          return { ...category, checked }
        }
        return category
      }),
    )
    
    // Update context
    if (selectedCategoryIds.length === 0) {
      // Currently showing all categories
      if (checked) {
        // Do nothing, still showing all
      } else {
        // Category is unchecking one, so show all except this one
        const allCategoryIds = categories.map(c => Number(c.id));
        const newSelection = allCategoryIds.filter(cid => cid !== categoryId);
        setSelectedCategoryIds(newSelection);
      }
    } else {
      // Currently showing specific categories
      if (checked) {
        // Add category to selection
        const newSelection = [...selectedCategoryIds, categoryId];
        setSelectedCategoryIds(newSelection);
      } else {
        // Remove category from selection
        const newSelection = selectedCategoryIds.filter(cid => cid !== categoryId);
        // If no categories selected, show all (empty array means all)
        setSelectedCategoryIds(newSelection.length === 0 ? [] : newSelection);
      }
    }
  }

  const selectedCount = selectedCategoryIds.length === 0 
    ? categories.filter((category) => category.checked).length 
    : selectedCategoryIds.length;
  const totalCount = categories.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          <span>
            Categories: {selectedCount}/{totalCount}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Expense Categories</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {categories.map((category) => (
          <DropdownMenuCheckboxItem
            key={category.id}
            checked={category.checked}
            onCheckedChange={(checked) => handleCheckedChange(category.id, checked)}
          >
            {category.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

