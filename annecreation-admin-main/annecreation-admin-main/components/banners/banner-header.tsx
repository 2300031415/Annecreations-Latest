import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"


export function BannerHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Banners</h1>
        <p className="text-sm text-gray-500">Manage your Banner Images.</p>
      </div>
      
    </div>
  )
}
