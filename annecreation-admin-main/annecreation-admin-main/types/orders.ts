export interface OrderCustomer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
}

export interface OrderProduct {
  _id: string;
  productModel: string;
  sku: string;
  description: string;
  image: string;
}

export interface OrderOption {
  option: {
    _id: string;
    name: string;
  };
  price: number;
  fileSize: number;
  mimeType: string;
  downloadCount: number;
}

export interface OrderProductWithOptions {
  product: OrderProduct;
  options: OrderOption[];
  subtotal: number;
}

export interface OrderTotal {
  code: string;
  value: number;
  sortOrder: number;
}

export interface OrderPayment {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  postcode: string;
  country: string;
  zone: string;
  addressFormat: string;
  method: string;
  code: string;
}

export interface OrderHistory {
  orderStatus: string;
  comment: string;
  notify: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  customer: OrderCustomer;
  orderStatus: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  payment: OrderPayment;
  razorpayOrderId: string | null;
  languageId: string;
  ip: string;
  forwardedIp: string;
  userAgent: string;
  acceptLanguageId?: string;
  products: OrderProductWithOptions[];
  product_count: number;
  totals: OrderTotal[];
  history: OrderHistory[];
  coupon?: string;
  couponDiscount?: string;
}

export interface OrderListResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}