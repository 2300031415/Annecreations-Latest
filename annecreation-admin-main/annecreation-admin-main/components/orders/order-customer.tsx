"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@/types/orders";
import { MapPin, Phone, Mail, Building2, Calendar } from "lucide-react";
import { formatDateIST } from "@/lib/date-utils";

interface OrderCustomerProps {
  order: Order;
}

export function OrderCustomer({ order }: OrderCustomerProps) {
  if (!order || !order.customer) {
    return <div>No customer information available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-900">
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <span className="text-lg font-medium text-gray-700">
                    {`${order.customer.firstName?.[0] || ""}${order.customer.lastName?.[0] || ""}`}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {`${order.customer.firstName || ""} ${order.customer.lastName || ""}`}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="h-4 w-4" />
                    <span>{order.customer.email || "No email provided"}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone className="h-4 w-4" />
                  <span>{order.customer.mobile || "No mobile provided"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Order Date: {formatDateIST(order.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-900">
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.payment.firstName} {order.payment.lastName}
                    </p>
                    {order.payment.company && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Building2 className="h-3 w-3" />
                        <span>{order.payment.company}</span>
                      </div>
                    )}
                    <p className="mt-1 text-sm text-gray-600">
                      {order.payment.address1}
                      {order.payment.address2 && (
                        <>
                          <br />
                          {order.payment.address2}
                        </>
                      )}
                      <br />
                      {order.payment.city}, {order.payment.postcode}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Method:</span>
                      <span className="font-medium text-gray-900">
                        {order.paymentMethod}
                      </span>
                    </div>
                    {order.razorpayOrderId && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Razorpay Order ID:</span>
                        <span className="font-medium text-gray-900">
                          {order.razorpayOrderId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}