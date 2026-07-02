import { findParcelOffice } from "@/data/kenya-delivery";
import { getZoneNameForSubtype } from "./delivery-zones";

interface BuildOrderPayloadProps {
  data: CheckoutFormType;
  cartDetails: NonNullable<CheckoutFormType["cartDetails"]>;
  totalPrice: NonNullable<CheckoutFormType["totalPrice"]>;
  deliveryMethod: CheckoutFormType["delivery_method"];
  shippingCost: NonNullable<CheckoutFormType["shippingCost"]>;
  shippingMethodTitle?: CheckoutFormType["shippingMethodTitle"];
  couponCode?: string;
}

const PICKUP_POINT_DETAILS = {
  id: "stanbank_nairobi",
  name: "Nairobi CBD Pickup – Stanbank House",
  address:
    "Stanbank House, Moi Avenue, Next to Archives, 6th Floor, Shop B613, Nairobi",
};

export const buildOrderPayload = ({
  data,
  cartDetails,
  totalPrice,
  deliveryMethod,
  shippingCost,
  shippingMethodTitle,
  couponCode,
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
    ...(data.county ? { state: data.county } : {}),
  };

  let shipping: Partial<CheckoutFormType["shipping"]> = {};
  let shipping_lines: CheckoutFormType["shipping_lines"] = [];
  const deliveryMeta: CheckoutFormType["meta_data"] = [];

  if (deliveryMethod === "shipping") {
    const subtype = data.delivery_subtype ?? "door_to_door";
    const methodTitle =
      shippingMethodTitle ?? getZoneNameForSubtype(subtype);

    if (subtype === "parcel_office" && data.county && data.parcel_office_id) {
      const parcel = findParcelOffice(data.county, data.parcel_office_id);
      const office = parcel?.office;

      shipping = {
        first_name: data.billing_first_name,
        last_name: data.billing_last_name,
        address_1: office
          ? `${office.name} – ${office.address}`
          : data.billing_address_1 || "",
        city: data.parcel_town || data.billing_city,
        postcode: data.billing_postcode || "",
        phone: data.billing_phone,
        country: "KE",
        state: data.county,
      };

      deliveryMeta.push(
        { key: "_delivery_type", value: "parcel_office" },
        { key: "_county", value: data.county },
        { key: "_parcel_town", value: data.parcel_town || "" },
        {
          key: "_parcel_office_id",
          value: data.parcel_office_id,
        },
        {
          key: "_parcel_office_name",
          value: office?.name || "",
        },
        {
          key: "_parcel_office_address",
          value: office?.address || "",
        },
      );
    } else {
      shipping = data.useDifferentShipping
        ? {
            first_name: data.shipping_first_name || "",
            last_name: data.shipping_last_name || "",
            address_1: data.shipping_address_1 || "",
            city: data.shipping_city || "",
            postcode: data.shipping_postcode || "",
            phone: data.shipping_phone || "",
            country: "KE",
            state: data.county || "",
          }
        : billing;

      deliveryMeta.push(
        { key: "_delivery_type", value: "door_to_door" },
        ...(data.county ? [{ key: "_county", value: data.county }] : []),
      );
    }

    const itemsSummary = cartDetails
      .map(
        (item) =>
          `${item.name}${item.selectedSize ? ` (${item.selectedSize})` : ""} × ${item.quantity}`,
      )
      .join(", ");

    shipping_lines = [
      {
        method_id: "flat_rate",
        method_title: methodTitle,
        total: shippingCost.toFixed(2),
        meta_data: [{ key: "Items", value: itemsSummary }],
      },
    ];
  }

  const pickupMeta: CheckoutFormType["meta_data"] = [];

  if (deliveryMethod === "pickup") {
    shipping_lines = [
      {
        method_id: "local_pickup",
        method_title: "Local Pickup",
        total: "0.00",
      },
    ];
    pickupMeta.push(
      { key: "_pickup_point_id", value: PICKUP_POINT_DETAILS.id },
      { key: "_pickup_point_name", value: PICKUP_POINT_DETAILS.name },
      { key: "_pickup_point_address", value: PICKUP_POINT_DETAILS.address },
    );
  }

  const payload: Record<string, unknown> = {
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
    meta_data: [
      { key: "_terms_agreed", value: data.termsAgreement ? "yes" : "no" },
      ...deliveryMeta,
      ...pickupMeta,
    ],
  };

  if (couponCode) {
    payload.coupon_lines = [{ code: couponCode }];
  } else {
    payload.total =
      deliveryMethod === "shipping" ? totalPrice + shippingCost : totalPrice;
  }

  return payload;
};
