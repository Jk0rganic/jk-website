// WooCommerce API response — only fields used after order creation
export type WooOrderResponse = {
  id: number;
  status: string;
  total: string;
  currency: string;
  currency_symbol: string;
  payment_method: "intasend" | "cod";
  payment_method_title: "Online Payment" | "Cash on Delivery";
  customer_note: string;
  date_created: string;
  date_paid: string | null;
  date_completed: string | null;
  needs_payment: boolean;
  needs_processing: boolean;
  payment_url: string;
  billing: BillingAddress;
  shipping: ShippingAddress;
  line_items: LineItem[];
  shipping_lines: ShippingLine[];
  meta_data: OrderMeta[];
};

// Form input — maps to checkOutSchema
export type CheckoutFormType = {
  email: string;
  billing_first_name: string;
  billing_last_name: string;
  billing_address_1?: string;
  billing_city: string;
  billing_postcode?: string;
  billing_phone: string;
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_address_1?: string;
  shipping_city?: string;
  shipping_postcode?: string;
  shipping_phone?: string;
  shipping_email?: string;
  useDifferentShipping?: boolean;
  county?: string;
  delivery_subtype?: "door_to_door" | "parcel_office";
  parcel_town?: string;
  parcel_office_id?: string;
  pickupPoint?: string;
  delivery_method: "shipping" | "pickup";
  paymentMethod: "pay_online" | "pay_on_delivery";
  customer_note?: string;
  termsAgreement: boolean;
  saveInfo?: boolean;
  totalPrice?: number;
  shippingCost?: number;
  shippingMethodTitle?: string;

  // nested shapes for OrderBuilder usage
  billing: BillingAddress;
  shipping: ShippingAddress;
  shipping_lines: ShippingLine[];
  shippingZone?: ShippingZone;
  meta_data: OrderMeta[];
  line_items: LineItem[];
  cartDetails?: CartItem[];
};

export interface CartItem {
  id: string;
  databaseId: number;
  sku?: string;
  name: string;
  quantity: number;
  price: number;
  variation_id?: number;
  meta_id?: number;
  selectedSize?: string | null;
  image?: any;
}

export interface BillingAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  postcode: string;
  phone: string;
  email: string;
  country: string;
  state?: string;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  postcode: string;
  phone: string;
  country: string;
  state?: string;
}

export interface OrderMeta {
  key: string;
  value: string;
}

export interface LineItem {
  id?: number;
  product_id: number;
  name: string;
  quantity: number;
  subtotal: string;
  total: string;
  sku: string;
  variation_id?: number;
  meta_data: OrderMeta[];
  image?: { id?: number; src?: string };
  price?: number;
}

export interface ShippingLine {
  method_id: string;
  method_title: string;
  total: string;
  meta_data?: OrderMeta[];
}

export interface ShippingZone {
  zone: string;
  fee_ksh: number;
}
