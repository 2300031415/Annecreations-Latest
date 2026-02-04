"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  useUpdateCustomerProfileMutation,
  useAddCustomerAddressMutation,
  Customer,
  CustomerAddress,
} from "@/lib/redux/api/customerApi";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null | undefined;
  onAddressAdded?: () => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  customer,
  onAddressAdded,
}: EditProfileModalProps) {
  const [updateProfile, { isLoading }] = useUpdateCustomerProfileMutation();
  const [addAddress, { isLoading: isAddingAddress }] =
    useAddCustomerAddressMutation();

  // Profile form state
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [telephone, setTelephone] = useState("");
  const [newsletter, setNewsletter] = useState(false);

  // Address form state
  const [addressFirstname, setAddressFirstname] = useState("");
  const [addressLastname, setAddressLastname] = useState("");
  const [company, setCompany] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [countryId, setCountryId] = useState("223"); // Default to USA
  const [zoneId, setZoneId] = useState("");
  const [isDefault, setIsDefault] = useState(true);

  // Active tab
  const [activeTab, setActiveTab] = useState("profile");

  // Load customer data when modal opens
  useEffect(() => {
    if (customer) {
      setFirstname(customer.firstname || "");
      setLastname(customer.lastname || "");
      setTelephone(customer.telephone || "");
      setNewsletter(customer.newsletter || false);

      // Also set address form with customer name as default
      setAddressFirstname(customer.firstname || "");
      setAddressLastname(customer.lastname || "");
    }
  }, [customer]);

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer) return;

    try {
      await updateProfile({
        firstname,
        lastname,
        telephone,
        newsletter,
      }).unwrap();

      toast.success("Profile updated successfully");
      onClose();
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error?.data?.message || "Failed to update profile");
    }
  };

  // Handle address submission
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer) return;

    try {
      // Use the Redux mutation to add address
      await addAddress({
        firstname: addressFirstname,
        lastname: addressLastname,
        company,
        address_1: address1,
        address_2: address2,
        city,
        postcode,
        country_id: parseInt(countryId),
        zone_id: parseInt(zoneId),
        default: isDefault,
      }).unwrap();

      toast.success("Address added successfully");

      // Reset form
      setAddress1("");
      setAddress2("");
      setCity("");
      setPostcode("");
      setZoneId("");
      setCompany("");

      // Call callback if provided
      if (onAddressAdded) {
        onAddressAdded();
      }

      onClose();
    } catch (error: any) {
      console.error("Failed to add address:", error);
      toast.error(error?.data?.message || "Failed to add address");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information and manage your addresses.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="address">Add Address</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4 space-y-4">
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstname">First Name</Label>
                  <Input
                    id="firstname"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname">Last Name</Label>
                  <Input
                    id="lastname"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Telephone</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newsletter"
                  checked={newsletter}
                  onCheckedChange={(checked) => setNewsletter(!!checked)}
                />
                <Label htmlFor="newsletter">Subscribe to newsletter</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="address" className="mt-4 space-y-4">
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address-firstname">First Name</Label>
                  <Input
                    id="address-firstname"
                    value={addressFirstname}
                    onChange={(e) => setAddressFirstname(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address-lastname">Last Name</Label>
                  <Input
                    id="address-lastname"
                    value={addressLastname}
                    onChange={(e) => setAddressLastname(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company (Optional)</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address1">Address Line 1</Label>
                <Input
                  id="address1"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                <Input
                  id="address2"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postal Code</Label>
                  <Input
                    id="postcode"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={countryId}
                    onChange={(e) => setCountryId(e.target.value)}
                    required
                  >
                    <option value="223">United States</option>
                    <option value="38">Canada</option>
                    <option value="222">United Kingdom</option>
                    {/* Add more countries as needed */}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <select
                    id="state"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    required
                  >
                    <option value="">Select State/Province</option>
                    <option value="1">Alabama</option>
                    <option value="2">Alaska</option>
                    <option value="3">Arizona</option>
                    <option value="4">Arkansas</option>
                    <option value="5">California</option>
                    {/* Add more states as needed */}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="default-address"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(!!checked)}
                />
                <Label htmlFor="default-address">Set as default address</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAddingAddress}>
                  {isAddingAddress ? "Adding..." : "Add Address"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
