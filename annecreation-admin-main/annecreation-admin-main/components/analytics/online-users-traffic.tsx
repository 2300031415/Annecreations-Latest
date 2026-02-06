import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// Mock data for traffic sources
const trafficSources = [
  {
    source: "Direct",
    visitors: 42,
    percentage: 35,
  },
  {
    source: "Google",
    visitors: 28,
    percentage: 23,
  },
  {
    source: "Facebook",
    visitors: 15,
    percentage: 12,
  },
  {
    source: "Instagram",
    visitors: 12,
    percentage: 10,
  },
  {
    source: "Twitter",
    visitors: 8,
    percentage: 7,
  },
  {
    source: "Other",
    visitors: 15,
    percentage: 13,
  },
]

export function OnlineUsersTraffic() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Sources</CardTitle>
        <CardDescription>Where your visitors are coming from</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trafficSources.map((source) => (
            <div key={source.source} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{source.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{source.visitors} visitors</span>
                  <span className="text-sm font-medium">{source.percentage}%</span>
                </div>
              </div>
              <Progress value={source.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" className="w-full" size="sm">
          <span>View detailed analytics</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
