// components/orders/types.ts
export interface OrderCustomer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
}

export interface OrderProduct {
  _id: string;
  description: string;
  image?: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  orderId: string;
  customer: OrderCustomer;
  products: Array<{
    product: OrderProduct;
  }>;
  total: number;
  dateModified: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}