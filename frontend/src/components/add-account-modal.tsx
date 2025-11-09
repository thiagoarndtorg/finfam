"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AddAccountModal({ isOpen, onClose, onAddAccount }) {
  const [accountName, setAccountName] = useState("")
  const [institution, setInstitution] = useState("")
  const [initialBalance, setInitialBalance] = useState("")
  const [accountType, setAccountType] = useState("checking")

  const handleSubmit = (e) => {
    e.preventDefault()

    // Convert balance to cents for storage
    const balanceInCents = Math.round(Number.parseFloat(initialBalance) * 100)

    onAddAccount({
      id: Date.now().toString(),
      name: accountName,
      institution,
      balance: balanceInCents,
      type: accountType,
      color: getRandomColor(),
    })

    // Reset form
    setAccountName("")
    setInstitution("")
    setInitialBalance("")
    setAccountType("checking")
  }

  // Generate a random color for the account
  const getRandomColor = () => {
    const colors = ["#8a05be", "#ff7a00", "#ec7000", "#00a1df", "#00c389", "#6b4cd6"]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Account Name</Label>
            <Input
              id="account-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g., My Checking Account"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Financial Institution</Label>
            <Input
              id="institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g., Nubank"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-type">Account Type</Label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger id="account-type">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="credit">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initial-balance">Initial Balance (R$)</Label>
            <Input
              id="initial-balance"
              type="number"
              step="0.01"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Account</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

