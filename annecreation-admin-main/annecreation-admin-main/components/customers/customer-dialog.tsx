"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "./customer-form";
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from "@/lib/redux/api/admincustomerApi";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

interface CustomerDialogProps {
  children: React.ReactNode;
  mode?: "create" | "edit";
  customer?: any;
}

export function CustomerDialog({
  children,
  mode = "create",
  customer,
}: CustomerDialogProps) {
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: customer?.firstName || "",
    lastName: customer?.lastName || "",
    email: customer?.email || "",
    mobile: customer?.mobile || "",
    status: customer?.status ?? true,
    newsletter: customer?.newsletter ?? false,
    emailVerified: customer?.emailVerified ?? false,
    mobileVerified: customer?.mobileVerified ?? false,
    
    // profilePic: null, // later if you need a file
  });

  useEffect(() => {
    if (mode === "edit" && customer) {
      setFormData({
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        email: customer.email || "",
        mobile: customer.mobile || "",
        status: customer.status ?? true,
        newsletter: customer.newsletter ?? false,
        emailVerified: customer.emailVerified ?? false,
        mobileVerified: customer.mobileVerified ?? false,
      });
    }
  }, [customer, mode]);

  const [createCustomer, { isLoading: creating }] =
    useCreateCustomerMutation();
  const [updateCustomer, { isLoading: updating }] =
    useUpdateCustomerMutation();
  const { canCreate, canUpdate } = usePermissions();

  const handleFormChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Utility: Detect if we need FormData
  const buildRequestBody = (data: typeof formData) => {
    const hasFile = Object.values(data).some((val) => val instanceof File);
    if (hasFile) {
      const fd = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          fd.append(key, value instanceof File ? value : String(value));
        }
      });
      return fd;
    }
    return data; // plain JSON
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const body = buildRequestBody(formData);

      if (mode === "edit" && customer?._id) {
        await updateCustomer({ id: customer._id, body }).unwrap();
        toast.success("Customer updated successfully");
      } else {
        await createCustomer(body).unwrap();
        toast.success("Customer created successfully");
      }

      setOpen(false);

      if (mode === "create") {
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          mobile: "",
          status: true,
          newsletter: false,
        });
      }
    } catch (error: unknown) {
      toast.error("Failed to save customer");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Customer" : "Edit Customer"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new customer account with contact information."
              : "Update the customer's information."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <CustomerForm formData={formData} onFormChange={handleFormChange} />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            {((mode === "create" && canCreate('customers')) || (mode === "edit" && canUpdate('customers'))) && (
              <Button
                type="submit"
                disabled={creating || updating}
                className="bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90"
              >
                {mode === "create" ? "Create Customer" : "Save Changes"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
