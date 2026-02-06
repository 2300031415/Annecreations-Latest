"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Star } from "lucide-react";
import {
  useGetCustomerProfileQuery,
  useDeleteCustomerAddressMutation,
  useSetDefaultAddressMutation,
} from "@/lib/redux/api/customerApi";
import {
  isCustomerAuthenticated,
  getCustomerFullName,
} from "@/lib/customerAuth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { EditProfileModal } from "@/components/customers/edit-profile-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CustomerAccountPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

  // Fetch customer profile data
  const {
    data: customerData,
    isLoading,
    error,
    refetch,
  } = useGetCustomerProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Address mutations
  const [deleteAddress, { isLoading: isDeleting }] =
    useDeleteCustomerAddressMutation();
  const [setDefaultAddress, { isLoading: isSettingDefault }] =
    useSetDefaultAddressMutation();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isCustomerAuthenticated();
      setIsAuthenticated(authenticated);

      if (!authenticated) {
        router.push("/customer/login");
      }
    };

    checkAuth();
  }, [router]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("customerAccessToken");
    localStorage.removeItem("customerRefreshToken");
    localStorage.removeItem("customer");

    toast.success("You have been logged out successfully");
    router.push("/customer/login");
  };

  // Handle modal open
  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  // Handle address added
  const handleAddressAdded = () => {
    refetch();
    toast.success("Address added to your account");
  };

  // Handle address deletion
  const handleDeleteAddress = async () => {
    if (addressToDelete === null) return;

    try {
      await deleteAddress(addressToDelete).unwrap();
      toast.success("Address deleted successfully");
      refetch();
      setAddressToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete address:", error);
      toast.error(error?.data?.message || "Failed to delete address");
    }
  };

  // Handle setting default address
  const handleSetDefaultAddress = async (addressId: number) => {
    try {
      await setDefaultAddress(addressId).unwrap();
      toast.success("Default address updated");
      refetch();
    } catch (error: any) {
      console.error("Failed to set default address:", error);
      toast.error(error?.data?.message || "Failed to set default address");
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#ffb729]" />
          <p className="text-lg font-medium">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg font-medium text-red-500">
            Error loading your account information
          </p>
          <Button onClick={() => router.push("/customer/login")}>
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account Dashboard</h1>
        <p className="text-gray-500">
          Welcome back, {getCustomerFullName(customerData || null)}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">First Name</p>
                <p className="font-medium">{customerData?.firstname}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Name</p>
                <p className="font-medium">{customerData?.lastname}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{customerData?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{customerData?.telephone}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={handleEditProfile}>
              Edit Profile
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Newsletter Subscription</p>
              <p className="font-medium">
                {customerData?.newsletter ? "Subscribed" : "Not subscribed"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Status</p>
              <p className="font-medium">
                {customerData?.status ? "Active" : "Inactive"}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => router.push("/customer/account/change-password")}
            >
              Change Password
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700"
            >
              Log Out
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Address Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Addresses</h2>
          <Button onClick={handleEditProfile}>Add New Address</Button>
        </div>

        {customerData?.addresses && customerData.addresses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {customerData.addresses.map((address) => (
              <Card key={address.address_id} className="relative">
                {address.default && (
                  <div className="absolute top-2 right-2 bg-[#ffb729] text-[#311807] text-xs font-medium px-2 py-1 rounded-full">
                    Default
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">
                    {address.firstname} {address.lastname}
                  </CardTitle>
                  {address.company && (
                    <CardDescription>{address.company}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p>{address.address_1}</p>
                  {address.address_2 && <p>{address.address_2}</p>}
                  <p>
                    {address.city}, {address.zone_id} {address.postcode}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  {!address.default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleSetDefaultAddress(address.address_id)
                      }
                      disabled={isSettingDefault}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500"
                    onClick={() => setAddressToDelete(address.address_id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-gray-500">
                You haven't added any addresses yet.
              </p>
              <div className="mt-4 flex justify-center">
                <Button onClick={handleEditProfile}>Add New Address</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customer={customerData}
        onAddressAdded={handleAddressAdded}
      />

      {/* Delete Address Confirmation */}
      <AlertDialog
        open={addressToDelete !== null}
        onOpenChange={() => setAddressToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              address from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAddress}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Address"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
