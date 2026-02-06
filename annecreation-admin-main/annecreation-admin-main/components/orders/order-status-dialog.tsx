"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useUpdateOrderStatusMutation } from "@/lib/redux/api/ordersApi";
import { toast } from "sonner";

interface OrderStatusDialogProps {
  children: React.ReactNode;
  orderId: string;
  currentStatus: string;
  defaultStatus?: string;
  onStatusUpdated?: () => void;
}

export function OrderStatusDialog({ children, orderId, currentStatus, defaultStatus = "paid", onStatusUpdated }: OrderStatusDialogProps) {
  const [open, setOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState(defaultStatus);
  const [comment, setComment] = useState("");
  const [notify, setNotify] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate comment if provided
    if (comment && !comment.startsWith("pay_")) {
      toast.error("Comment must start with 'pay_'");
      return;
    }

    setIsSubmitting(true);

    const updatedComment = 'Payment Successful. Razorpay Payment Id: ' + comment;

    try {
      await updateOrderStatus({
        id: orderId,
        data: {
          orderStatus,
          comment: updatedComment || undefined,
          notify,
        },
      }).unwrap();

      toast.success("Order status updated successfully");
      setOpen(false);
      setComment("");
      setOrderStatus(defaultStatus);
      setNotify(true);
      
      // Call the callback to refresh data
      if (onStatusUpdated) {
        onStatusUpdated();
      }
    } catch (error: any) {
      console.error("Failed to update order status:", error);
      toast.error(error?.data?.message || "Failed to update order status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setComment("");
      setOrderStatus(defaultStatus);
      setNotify(true);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={orderStatus} onValueChange={setOrderStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Input
              id="comment"
              placeholder="payment id"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {comment && !comment.startsWith("pay_") && (
              <p className="text-sm text-red-600">Comment must start with "pay_"</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify"
              checked={notify}
              onCheckedChange={(checked) => setNotify(checked as boolean)}
            />
            <Label htmlFor="notify" className="text-sm">
              Notify customer
            </Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (comment ? !comment.startsWith("pay_") : false)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
