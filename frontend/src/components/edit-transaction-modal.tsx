"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useFamily } from "@/contexts/family-context";
import { useFamilyCategories } from "@/hooks/use-api";
import { useI18n } from "@/contexts/i18n-context";
import toast from "react-hot-toast";

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onSave: (transaction: any) => void;
}

export function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  onSave,
}: EditTransactionModalProps) {
  const { familyId, categories: contextCategories } = useFamily();
  const { data: apiCategories, execute: fetchCategories } = useFamilyCategories();
  const { t } = useI18n();





  const categories = apiCategories || contextCategories;


  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(Math.abs(transaction.amount / 100).toFixed(2));
  const [categoryId, setCategoryId] = useState(String(transaction.categoryId || transaction.categoryObject?.id));
  const [account, setAccount] = useState(transaction.account);
  const [date, setDate] = useState(new Date(transaction.date));
  const [type, setType] = useState(transaction.type);

  // Fetch categories when modal opens or familyId changes
  useEffect(() => {
    if (isOpen && familyId) {
      fetchCategories(familyId);
    }
  }, [isOpen, familyId, fetchCategories]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {

      const amountInCents = Math.round(Number.parseFloat(amount) * 100);


      const updatedTransaction = {
        ...transaction,
        description,
        amount: type === "income" ? amountInCents : -amountInCents,
        categoryId: Number(categoryId),
        account,
        date: date.toISOString().split("T")[0],
        type,
      };


      await onSave(updatedTransaction);

      toast.success(t("toasts.success.transactionUpdated"));
    } catch (error) {
      console.error("Failed to update transaction:", error);
      toast.error(t("toasts.error.transactionUpdate"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transaction-description">Description</Label>
            <Input
              id="transaction-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-type">Type</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger id="transaction-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-amount">Amount (R$)</Label>
            <Input
              id="transaction-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger id="transaction-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories && categories.length > 0 ? (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      <div className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>
                    Carregando categorias...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-account">Account</Label>
            <Select value={account} onValueChange={setAccount} required>
              <SelectTrigger id="transaction-account">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key={account} value={account}>
                  {account}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus required />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
