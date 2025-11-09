"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

// Mock data for expense categories
const expenseCategories = [
  { id: "1", name: "Groceries" },
  { id: "2", name: "Dining" },
  { id: "3", name: "Transportation" },
  { id: "4", name: "Housing" },
  { id: "5", name: "Utilities" },
  { id: "6", name: "Entertainment" },
  { id: "7", name: "Healthcare" },
  { id: "8", name: "Shopping" },
  { id: "9", name: "Travel" },
  { id: "10", name: "Education" },
  { id: "11", name: "Other" },
]

export function AddExpenseModal({ isOpen, onClose, onAddExpense, accounts }) {
  const [amount, setAmount] = useState("")
  const [account, setAccount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(new Date())

  const handleSubmit = (e) => {
    e.preventDefault()

    // Convert amount to cents for storage
    const amountInCents = Math.round(Number.parseFloat(amount) * 100)

    onAddExpense(amountInCents, account, category, description, date)

    // Reset form
    setAmount("")
    setAccount("")
    setCategory("")
    setDescription("")
    setDate(new Date())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount (R$)</Label>
            <Input
              id="expense-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-account">Account</Label>
            <Select value={account} onValueChange={setAccount} required>
              <SelectTrigger id="expense-account">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} (R$ {(acc.balance / 100).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="expense-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-description">Description</Label>
            <Input
              id="expense-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Grocery shopping at Supermarket"
              required
            />
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
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!amount || !account || !category || !description}>
              Add Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

