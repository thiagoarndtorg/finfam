"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TransferModal({ isOpen, onClose, onTransfer, accounts }) {
  const [amount, setAmount] = useState("")
  const [fromAccount, setFromAccount] = useState("")
  const [toAccount, setToAccount] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()

    // Convert amount to cents for storage
    const amountInCents = Math.round(Number.parseFloat(amount) * 100)

    onTransfer(amountInCents, fromAccount, toAccount, description)

    // Reset form
    setAmount("")
    setFromAccount("")
    setToAccount("")
    setDescription("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Between Accounts</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from-account">From Account</Label>
            <Select value={fromAccount} onValueChange={setFromAccount} required>
              <SelectTrigger id="from-account">
                <SelectValue placeholder="Select source account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (R$ {(account.balance / 100).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-account">To Account</Label>
            <Select value={toAccount} onValueChange={setToAccount} required>
              <SelectTrigger id="to-account">
                <SelectValue placeholder="Select destination account" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((account) => account.id !== fromAccount)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} (R$ {(account.balance / 100).toFixed(2)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-amount">Amount (R$)</Label>
            <Input
              id="transfer-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Monthly savings transfer"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!fromAccount || !toAccount || !amount || fromAccount === toAccount}>
              Transfer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

