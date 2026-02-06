"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

 interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  status: boolean;
  newsletter: boolean;
  emailVerified: boolean;
  mobileVerified: boolean;
  password?: string;
  confirmPassword?: string;
}

interface CustomerFormProps {
  formData: CustomerFormData
  onFormChange: (field: keyof CustomerFormData, value: string | boolean) => void
}


export function CustomerForm({ formData, onFormChange }: CustomerFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation functions
  const isPasswordValid = () => {
    if (!formData.password) return true; // Optional field
    return validatePassword(formData.password);
  };

  const isConfirmPasswordValid = () => {
    if (!formData.password) return true; // If password is empty, confirm password is not required
    if (!formData.confirmPassword) return false; // If password is provided, confirm password is required
    return formData.password === formData.confirmPassword;
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const getPasswordError = () => {
    if (!formData.password) return null;
    
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const getConfirmPasswordError = () => {
    if (formData.password && !formData.confirmPassword) {
      return "Please confirm your password";
    }
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  return (
    <div className="grid gap-6">
      {/* Personal Info */}
      <div className="grid gap-3">
        <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="first-name">First Name *</Label>
            <Input
              id="first-name"
              value={formData.firstName}
              onChange={(e) => onFormChange("firstName", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last-name">Last Name *</Label>
            <Input
              id="last-name"
              value={formData.lastName}
              onChange={(e) => onFormChange("lastName", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onFormChange("email", e.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="mobile">Telephone *</Label>
          <Input
            id="mobile"
            value={formData.mobile}
            onChange={(e) => onFormChange("mobile", e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="email-verified"
              checked={formData.emailVerified}
              onCheckedChange={(checked) => onFormChange("emailVerified", checked)}
            />
            <Label htmlFor="email-verified">Email Verified</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="mobile-verified"
              checked={formData.mobileVerified}
              onCheckedChange={(checked) => onFormChange("mobileVerified", checked)}
            />
            <Label htmlFor="mobile-verified">Mobile Verified</Label>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="grid gap-3">
        <h3 className="text-lg font-medium text-gray-900">Password (Optional)</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password || ""}
                onChange={(e) => onFormChange("password", e.target.value)}
                placeholder="Enter new password (min 6 characters)"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="min-h-[20px]">
              {getPasswordError() && (
                <p className="text-sm text-red-600">{getPasswordError()}</p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">
              Confirm Password
              {formData.password && <span className="text-red-500"> *</span>}
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword || ""}
                onChange={(e) => onFormChange("confirmPassword", e.target.value)}
                placeholder="Confirm password (min 6 characters)"
                required={!!formData.password}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="min-h-[20px]">
              {getConfirmPasswordError() && (
                <p className="text-sm text-red-600">{getConfirmPasswordError()}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="grid gap-3">
        <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
        <div className="flex items-center gap-2">
          <Switch
            id="status"
            checked={formData.status}
            onCheckedChange={(checked) => onFormChange("status", checked)}
          />
          <Label htmlFor="status">Active</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="newsletter"
            checked={formData.newsletter}
            onCheckedChange={(checked) => onFormChange("newsletter", checked)}
          />
          <Label htmlFor="newsletter">Subscribe to newsletter</Label>
        </div>
      </div>
    </div>
  )
}
