"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFamily } from "@/contexts/family-context";
import { useFamilyCategories } from "@/hooks/use-api";
import { useI18n } from "@/contexts/i18n-context";

interface CorrectCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number;
  onSave: (categoryName: string) => void;
}

export function CorrectCategoryModal({
  isOpen,
  onClose,
  transactionId,
  onSave,
}: CorrectCategoryModalProps) {
  const { familyId, categories: contextCategories } = useFamily();
  const { data: apiCategories, execute: fetchCategories } = useFamilyCategories();
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    if (familyId) {
      fetchCategories(familyId);
    }
  }, [familyId, fetchCategories]);

  const availableCategories = apiCategories || contextCategories || [];

  const handleSave = () => {
    if (selectedCategory) {
      onSave(selectedCategory);
      setSelectedCategory("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("transactions.selectCategory")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t("common.category")}</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t("transactions.selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((category: any) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={!selectedCategory}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

