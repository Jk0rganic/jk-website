import { COLLECT_AT_SHOP_ZONE } from "./shipping-zones";

interface BuildOrderPayloadProps {
  data: CheckoutFormType;
  cartDetails: NonNullable<CheckoutFormType["cartDetails"]>;
  totalPrice: NonNullable<CheckoutFormType["totalPrice"]>;
  deliveryMethod: CheckoutFormType["delivery_method"];
  shippingCost: NonNullable<CheckoutFormType["shippingCost"]>;
  shippingMethodTitle?: CheckoutFormType["shippingMethodTitle"];
}

export const buildOrderPayload = ({
  data,
  cartDetails,
  totalPrice,
  deliveryMethod,
  shippingCost,
  shippingMethodTitle,
}: BuildOrderPayloadProps) => {
  const line_items: LineItem[] = cartDetails.map((item) => ({
    product_id: item.databaseId,
    sku: item.sku || "",
    name: item.name,
    quantity: item.quantity,
    subtotal: (item.price * item.quantity).toFixed(2),
    total: (item.price * item.quantity).toFixed(2),
    ...(item.variation_id ? { variation_id: item.variation_id } : {}),
    meta_data: [
      ...(item.selectedSize ? [{ key: "Size", value: item.selectedSize }] : []),
      ...(item.image
        ? [
            {
              key: "_product_image",
              value:
                typeof item.image === "string"
                  ? item.image
                  : item.image.mediaItemUrl || "",
            },
          ]
        : []),
    ],
  }));

  const billing: CheckoutFormType["billing"] = {
    first_name: data.billing_first_name,
    last_name: data.billing_last_name,
    address_1: data.billing_address_1 || "",
    city: data.billing_city,
    postcode: data.billing_postcode || "",
    phone: data.billing_phone,
    email: data.email,
    country: "KE",
  };

  let shipping: Partial<CheckoutFormType["shipping"]> = {};
  let shipping_lines: CheckoutFormType["shipping_lines"] = [];
  const pickupMeta: CheckoutFormType["meta_data"] = [];
  const isCollectAtShop =
    deliveryMethod === "shipping" &&
    shippingMethodTitle === COLLECT_AT_SHOP_ZONE;

  if (deliveryMethod === "shipping") {
    shipping = isCollectAtShop
      ? billing
      : data.useDifferentShipping
        ? {
            first_name: data.shipping_first_name || "",
            last_name: data.shipping_last_name || "",
            address_1: data.shipping_address_1 || "",
            city: data.shipping_city || "",
            postcode: data.shipping_postcode || "",
            phone: data.shipping_phone || "",
            country: "KE",
          }
        : billing;

    const itemsSummary = cartDetails
      .map(
        (item) =>
          `${item.name}${item.selectedSize ? ` (${item.selectedSize})` : ""} × ${item.quantity}`,
      )
      .join(", ");

    shipping_lines = isCollectAtShop
      ? [
          {
            method_id: "local_pickup",
            method_title: COLLECT_AT_SHOP_ZONE,
            total: "0.00",
          },
        ]
      : [
          {
            method_id: "flat_rate",
            method_title: shippingMethodTitle || "Shipping Fee",
            total: shippingCost.toFixed(2),
            meta_data: [{ key: "Items", value: itemsSummary }],
          },
        ];
  }

  if (deliveryMethod === "pickup") {
    shipping_lines = [
      {
        method_id: "local_pickup",
        method_title: "Local Pickup",
        total: "0.00",
      },
    ];
  }

  return {
    payment_method: data.paymentMethod === "pay_online" ? "intasend" : "cod",
    payment_method_title:
      data.paymentMethod === "pay_online" ? "Online Payment" : "Cash on Delivery",
    set_paid: false,
    status: "pending",
    billing,
    shipping,
    line_items,
    shipping_lines,
    customer_note: data.customer_note || "",
    total:
      deliveryMethod === "shipping" ? totalPrice + shippingCost : totalPrice,
    meta_data: [
      { key: "_terms_agreed", value: data.termsAgreement ? "yes" : "no" },
      ...pickupMeta,
    ],
  };
};
