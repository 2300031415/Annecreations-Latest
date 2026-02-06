"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Order } from "@/types/orders";
import { ProductImage } from "@/components/ui/product-image";
import { formatDateIST } from "@/lib/date-utils";

interface OrderDetailsProps {
  order: Order;
}

export function OrderDetails({ order }: OrderDetailsProps) {
  if (!order || !order.products) {
    return <div>No order details available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Order Summary</h3>
          <p className="text-sm text-gray-500">
            Order placed on {formatDateIST(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Order Status</p>
          <p className="font-medium text-gray-900">{order.orderStatus}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <h4 className="mb-4 font-medium text-gray-900">Order Items</h4>
          <div className="space-y-4">
            {order.products.map((item) => (
              <div key={item.product._id} className="flex items-start gap-4 border-b border-gray-100 pb-4">
                <div className="relative h-24 w-24">
                  <ProductImage
                    src={item.product.image}
                    alt={item.product.productModel || "Product image"}
                    width={96}
                    height={96}
                    className="rounded-lg border border-gray-200"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h5 className="font-medium text-gray-900">{item.product.productModel}</h5>
                    <p className="font-medium text-gray-900">₹{item.subtotal}</p>
                  </div>
                  <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                  {item.options && item.options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-gray-700">Selected Options:</p>
                      {item.options.map((option) => (
                        <div key={option.option._id} className="flex justify-between text-sm text-gray-600">
                          <span>{option.option.name}</span>
                          <span>₹{option.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            {order.totals.map((total) => (
              <div key={total.code} className="flex justify-between text-sm">
                <span className="text-gray-500">{
                  total.code === 'subtotal' ? 'Subtotal' :
                  total.code === 'couponDiscount' ? 'Coupon Discount' :
                  total.code === 'total' ? 'Total' : total.code
                }</span>
                <span className={total.code === 'total' ? 'font-medium text-gray-900' : 'text-gray-600'}>
                  ₹{total.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h4 className="mb-4 font-medium text-gray-900">Payment Details</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Method</span>
              <span className="text-gray-900">{order.paymentMethod}</span>
            </div>
            {order.razorpayOrderId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Razorpay Order ID</span>
                <span className="text-gray-900">{order.razorpayOrderId}</span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <h5 className="mb-2 text-sm font-medium text-gray-900">Shipping Address</h5>
            <div className="text-sm text-gray-600">
              <p>{order.payment.firstName} {order.payment.lastName}</p>
              {order.payment.company && <p>{order.payment.company}</p>}
              <p>{order.payment.address1}</p>
              {order.payment.address2 && <p>{order.payment.address2}</p>}
              <p>{order.payment.city}, {order.payment.postcode}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}