import { z } from "zod";
import {
  findParcelOffice,
  getParcelTownsForCounty,
  isDoorToDoorCounty,
} from "@/data/kenya-delivery";

const requiredString = (msg: string) => z.string().min(1, msg);
const optionalString = z.string().optional();

export const checkOutSchema = z
  .object({
    email: requiredString("Email address is required").email(
      "Enter a valid email address",
    ),
    shippingZone: optionalString,
    pickupPoint: optionalString,
    county: optionalString,
    delivery_subtype: z.enum(["door_to_door", "parcel_office"]).optional(),
    parcel_town: optionalString,
    parcel_office_id: optionalString,

    // Billing
    billing_first_name: requiredString("First name is required"),
    billing_last_name: requiredString("Last name is required"),
    billing_address_1: optionalString,
    billing_city: requiredString("Town / City is required"),
    billing_postcode: optionalString,
    billing_phone: requiredString("Phone Number is required"),

    // Shipping
    shipping_first_name: optionalString,
    shipping_last_name: optionalString,
    shipping_address_1: optionalString,
    shipping_city: optionalString,
    shipping_postcode: optionalString,
    shipping_phone: optionalString,

    useDifferentShipping: z.boolean().optional(),
    delivery_method: z.enum(["shipping", "pickup"]),
    paymentMethod: z.enum(["pay_online", "pay_on_delivery"], {
      error: "Please select a payment method",
    }),
    customer_note: z.string().trim().max(300).optional(),
    termsAgreement: z.boolean().refine((v) => v === true, {
      message: "You must agree to the terms and conditions",
    }),
    saveInfo: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === "pay_online") {
      const digits = data.billing_phone.replace(/\D/g, "");
      const validKenyan =
        (digits.startsWith("254") && digits.length === 12) ||
        (digits.startsWith("0") && digits.length === 10) ||
        (digits.startsWith("7") && digits.length === 9);

      if (!validKenyan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid Kenyan phone number (07XXXXXXXX)",
          path: ["billing_phone"],
        });
      }
    }

    if (data.delivery_method === "pickup") {
      if (!data.pickupPoint?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a pick-up point",
          path: ["pickupPoint"],
        });
      }
      return;
    }

    if (data.delivery_method !== "shipping") return;

    if (!data.county?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select your county",
        path: ["county"],
      });
      return;
    }

    if (isDoorToDoorCounty(data.county)) {
      if (!data.billing_address_1?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Street address is required for door-to-door delivery",
          path: ["billing_address_1"],
        });
      }
    } else {
      const parcelTowns = getParcelTownsForCounty(data.county);
      const canUseDefaultParcelOffice =
        parcelTowns.length === 1 && parcelTowns[0].offices.length === 1;

      if (!data.parcel_town?.trim()) {
        if (!canUseDefaultParcelOffice) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please select your town / stage area",
            path: ["parcel_town"],
          });
        }
      }
      if (!data.parcel_office_id?.trim()) {
        if (!canUseDefaultParcelOffice) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please select a parcel office",
            path: ["parcel_office_id"],
          });
        }
      } else if (
        data.county &&
        data.parcel_office_id &&
        !findParcelOffice(data.county, data.parcel_office_id)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a valid parcel office",
          path: ["parcel_office_id"],
        });
      }
    }

    if (!data.useDifferentShipping) return;

    const requiredShippingKeys = [
      "shipping_first_name",
      "shipping_last_name",
      "shipping_city",
      "shipping_phone",
    ] as const;

    for (const key of requiredShippingKeys) {
      if (!data[key]?.toString().trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required",
          path: [key],
        });
      }
    }

    if (
      isDoorToDoorCounty(data.county ?? "") &&
      !data.shipping_address_1?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Street address is required",
        path: ["shipping_address_1"],
      });
    }
  });

export type CheckOutSchemaType = z.infer<typeof checkOutSchema>;
