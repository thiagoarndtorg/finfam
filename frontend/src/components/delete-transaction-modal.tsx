"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useFamily } from "@/contexts/family-context"
import { useDeleteTransaction } from "@/hooks/use-api"
import toast from "react-hot-toast"

export function DeleteTransactionModal({ isOpen, onClose, transaction, onDelete }) {
  const { familyId } = useFamily()
  const { execute: deleteTransactionAPI } = useDeleteTransaction()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    
    try {
      await deleteTransactionAPI({ id: Number(transaction.id), familyId })
      await onDelete(transaction.id)
      toast.success("Transação deletada com sucesso!")
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast.error("Erro ao deletar transação")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Transaction</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border rounded-md p-4">
            <p className="font-medium">{transaction.description}</p>
            <p className="text-sm text-muted-foreground">
              {transaction.category} • {transaction.account} • {new Date(transaction.date).toLocaleDateString()}
            </p>
            <p className={`text-sm font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
              {transaction.type === "income" ? "+" : "-"}R$ {Math.abs(transaction.amount / 100).toFixed(2)}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deletando..." : "Delete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

