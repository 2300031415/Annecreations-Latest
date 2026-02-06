"use client"

import { MachinesHeader } from "@/components/machines/machines-header"
import { MachinesList } from "@/components/machines/machines-list"

export function MachinesShell() {
  return (
    <div className="flex flex-col gap-6">
      <MachinesHeader />
      <MachinesList />
    </div>
  )
}
