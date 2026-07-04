import type * as CheckoutTypes from "./checkout/checkout";
import type * as PostTypes from "./post/post";
import type * as ProductTypes from "./product/product";

declare global {
  type Session = AuthTypes.Session;

  type CheckoutFormType = CheckoutTypes.CheckoutFormType;
  type WooOrderResponse = CheckoutTypes.WooOrderResponse;

  type CartItem = CheckoutTypes.CartItem;
  type BillingAddress = CheckoutTypes.BillingAddress;
  type ShippingAddress = CheckoutTypes.ShippingAddress;
  type OrderMeta = CheckoutTypes.OrderMeta;
  type LineItem = CheckoutTypes.LineItem;
  type ShippingLine = CheckoutTypes.ShippingLine;

  type Blog = PostTypes.PostTypes;
  type GetPostBySlugVariables = PostTypes.GetPostBySlugVariables;

  type Product = ProductTypes.ProductTypes;
  type GetProductBySlugVariables = ProductTypes.GetProductBySlugVariables;
  type ProductVariation = ProductTypes.ProductVariation;
  type ProductCategory = ProductTypes.ProductCategory;

  type DashboardOrder = Pick<
    WooOrderResponse,
    | "id"
    | "status"
    | "date_created"
    | "total"
    | "currency"
    | "billing"
    | "shipping"
    | "line_items"
    | "shipping_lines"
    | "date_paid"
    | "needs_payment"
    | "meta_data"
    | "customer_note"
  > & {
    payment_method: string;
    payment_method_title: string;
    discount_total?: string;
    total_discount?: string;
    coupon_lines?: Array<{ code: string; discount: string }>;
  };

  type OrderSummary = Pick<
    WooOrderResponse,
    "id" | "status" | "date_created" | "total" | "currency"
  >;
}
