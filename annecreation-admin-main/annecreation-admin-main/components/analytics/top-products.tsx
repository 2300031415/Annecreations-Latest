import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function TopProducts({ className }: { className?: string }) {
  // Sample data
  const products = [
    {
      id: 1,
      name: "Floral Embroidery Design",
      sales: 245,
      revenue: "₹36,750",
      growth: "+12%",
      positive: true,
    },
    {
      id: 2,
      name: "Peacock Applique Pattern",
      sales: 186,
      revenue: "₹27,900",
      growth: "+8%",
      positive: true,
    },
    {
      id: 3,
      name: "Traditional Kutch Work",
      sales: 152,
      revenue: "₹22,800",
      growth: "+5%",
      positive: true,
    },
    {
      id: 4,
      name: "Geometric Quilting Pattern",
      sales: 132,
      revenue: "₹19,800",
      growth: "-3%",
      positive: false,
    },
    {
      id: 5,
      name: "Mandala Design Collection",
      sales: 125,
      revenue: "₹18,750",
      growth: "+2%",
      positive: true,
    },
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Top Selling Products</CardTitle>
        <CardDescription>Best performing products by sales volume</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {products.map((product) => (
            <div key={product.id} className="flex items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {product.sales} sales · {product.revenue}
                </p>
              </div>
              <div className="ml-auto font-medium">
                <Badge variant={product.positive ? "default" : "destructive"} className="ml-auto">
                  {product.growth}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
