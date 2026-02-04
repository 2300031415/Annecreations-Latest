"use client";

import {
  CheckCircle2,
  ShoppingCart,
  XCircle,
  AlertCircle,
  Clock,
  IndianRupee,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@/types/orders";
import { Badge } from "@/components/ui/badge";
import { formatDateOnlyIST, formatTimeOnlyIST } from "@/lib/date-utils";

interface OrderTimelineProps {
  order: Order;
}

export function OrderTimeline({ order }: OrderTimelineProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return {
          icon: CheckCircle2,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-100',
          badgeColor: 'bg-green-100 text-green-700',
        };
      case 'pending':
        return {
          icon: Clock,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          badgeColor: 'bg-yellow-100 text-yellow-700',
        };
      case 'cancelled':
        return {
          icon: XCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-100',
          badgeColor: 'bg-red-100 text-red-700',
        };
      default:
        return {
          icon: AlertCircle,
          iconColor: 'text-gray-600',
          bgColor: 'bg-gray-100',
          badgeColor: 'bg-gray-100 text-gray-700',
        };
    }
  };

  const formatDateTime = (dateString: string) => {
    return {
      date: formatDateOnlyIST(dateString),
      time: formatTimeOnlyIST(dateString),
    };
  };

  // Find payment status
  const paymentEvent = order.history.find(event => 
    event.comment?.toLowerCase().includes('payment completed')
  );

  return (
    <div className="space-y-6">
      {/* Order Summary Card */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-900">Order Summary</CardTitle>
            <Badge 
              variant="secondary" 
              className={getStatusConfig(order.orderStatus).badgeColor}
            >
              {order.orderStatus.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Order Created</h4>
                <div className="text-sm text-gray-500">
                  {formatDateTime(order.createdAt).date} at {formatDateTime(order.createdAt).time}
                </div>
              </div>
              <div className="mt-1 space-y-1">
                <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
                <p className="text-sm text-gray-600">
                  Total Amount: <IndianRupee className="inline h-3 w-3" />{order.total}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status History Card */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-gray-900">Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-6">
            {order.history.map((event, index) => {
              const statusConfig = getStatusConfig(event.orderStatus);
              const StatusIcon = statusConfig.icon;
              const { date, time } = formatDateTime(event.createdAt);

              return (
                <div key={index} className="relative flex items-center gap-4">
                  <div
                    className={`absolute -left-0 top-0 -ml-px h-full w-0.5 ${
                      index < order.history.length - 1 ? statusConfig.bgColor : 'bg-transparent'
                    }`}
                    aria-hidden="true"
                  />
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${statusConfig.bgColor}`}>
                    <StatusIcon className={`h-5 w-5 ${statusConfig.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        {event.orderStatus.toUpperCase()}
                      </h4>
                      <div className="text-sm text-gray-500">
                        {date} at {time}
                      </div>
                    </div>
                    {event.comment && (
                      <p className="text-sm text-gray-600">{event.comment}</p>
                    )}
                    {event.notify && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Customer Notified
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
                
}
