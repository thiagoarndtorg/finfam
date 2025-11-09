"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function DeleteMemberModal({ isOpen, onClose, member, onDelete }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      await onDelete(member.id)
    } catch (error) {
      console.error("Error deleting member:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  const mapRoleDisplay = (role) => {
    return role === "ADMIN" ? "Administrator" : "Viewer"
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Remove Family Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this family member? They will no longer have access to your financial
            dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border rounded-md p-4">
            <p className="font-medium">{member.username || member.name}</p>
            <p className="text-sm text-muted-foreground">{member.email}</p>
            <p className="text-sm text-muted-foreground">
              Role: {mapRoleDisplay(member.role)}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
