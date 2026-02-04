import { Tag, Gift, Mail, Users, TrendingUp, MessageSquare } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export function MarketingCards() {
  const marketingTools = [
    {
      title: "Coupons",
      description: "Create and manage discount coupons",
      icon: Tag,
      href: "/dashboard/marketing/coupons",
      color: "#ffb729",
    },
    {
      title: "Purpletree SMS",
      description: "Configure SMS notifications and two-factor authentication",
      icon: MessageSquare,
      href: "/dashboard/marketing/purpletree-sms",
      color: "#ffb729",
    },
    {
      title: "Promotions",
      description: "Set up special offers and deals",
      icon: Gift,
      href: "/dashboard/marketing/promotions",
      color: "#ffb729",
    },
    {
      title: "Email Campaigns",
      description: "Create and send email marketing campaigns",
      icon: Mail,
      href: "/dashboard/marketing/email-campaigns",
      color: "#ffb729",
    },
    {
      title: "Referral Program",
      description: "Manage customer referral incentives",
      icon: Users,
      href: "/dashboard/marketing/referrals",
      color: "#ffb729",
    },
    {
      title: "SEO Tools",
      description: "Optimize your store for search engines",
      icon: TrendingUp,
      href: "/dashboard/marketing/seo",
      color: "#ffb729",
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {marketingTools.map((tool) => (
        <Link key={tool.title} href={tool.href} className="block">
          <Card className="h-full border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium text-gray-900">{tool.title}</CardTitle>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: tool.color }}
              >
                <tool.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-gray-500">{tool.description}</CardDescription>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
