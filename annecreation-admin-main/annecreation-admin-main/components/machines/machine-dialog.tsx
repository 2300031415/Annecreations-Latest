"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MachineForm } from "@/components/machines/machine-form"

interface MachineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: any
  mode?: "add" | "edit"
}

export function MachineDialog({ open, onOpenChange, category, mode = "add" }: MachineDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Machine" : "Edit Machine"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Add a new machine with category and subcategory details."
              : "Edit the machine category and subcategory details."}
          </DialogDescription>
        </DialogHeader>
        <MachineForm initialData={category} onClose={() => onOpenChange(false)} mode={mode} />
      </DialogContent>
    </Dialog>
  )
}
