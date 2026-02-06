import { FileDown, FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function OrdersHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500">Manage and track all customer orders.</p>
      </div>
      {/* <div className="flex gap-2">
        <Button variant="outline" className="gap-1 border-gray-300">
          <FileUp className="h-4 w-4" />
          Export
        </Button>
        <Button className="gap-1 bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90">
          <FileDown className="h-4 w-4" />
          Download Report
        </Button>
      </div> */}
    </div>
  )
}
