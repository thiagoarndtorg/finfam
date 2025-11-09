"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2 } from "lucide-react"

export function EditMemberModal({ isOpen, onClose, member, onSave }) {
  const [role, setRole] = useState(member.role)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (member) {
      setRole(member.role)
    }
  }, [member])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSave({
        ...member,
        role,
      })
    } catch (error) {
      console.error("Error updating member:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Family Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <RadioGroup value={role} onValueChange={setRole} disabled={isLoading}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="viewer" id="edit-viewer" />
                <Label htmlFor="edit-viewer" className="cursor-pointer">
                  Viewer (can only view data)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="edit-admin" />
                <Label htmlFor="edit-admin" className="cursor-pointer">
                  Administrator (can manage accounts and invite others)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
