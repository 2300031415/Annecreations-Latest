"use client"

import { ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ReactNode } from "react"

interface AccessDeniedProps {
  title?: string
  description?: string
  message?: string
  actions?: ReactNode
  className?: string
}

export function AccessDenied({ 
  title = "Access Denied",
  description = "You don't have permission to access this page",
  message = "This page requires specific permissions that haven't been granted to your account. Please contact your administrator if you believe you should have access.",
  actions,
  className = ""
}: AccessDeniedProps) {
  return (
    <div className={`flex min-h-[calc(100vh-200px)] items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <ShieldAlert className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-gray-600">
            {message}
          </p>
          {actions && (
            <div className="pt-2">
              {actions}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

