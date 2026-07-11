import { z } from "zod";
import {
  getParcelTownNamesForCounty,
  isDoorToDoorCounty,
  KENYA_COUNTIES,
} from "@/data/kenya-delivery";

const requiredString = (msg: string) => z.string().min(1, msg);
const optionalString = z.string().optional();

function matchOption(value: string, options: readonly string[]) {
  const normalized = value.trim().toLowerCase();
  return options.find((option) => option.toLowerCase() === normalized);
}

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
    billing_city: optionalString,
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
    paymentMethod: z.literal("pay_online", {
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
      if (!data.billing_city?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Town / City is required",
          path: ["billing_city"],
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

    const matchedCounty = matchOption(data.county, KENYA_COUNTIES);

    if (!matchedCounty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a county from the list",
        path: ["county"],
      });
      return;
    }

    if (isDoorToDoorCounty(matchedCounty)) {
      if (!data.billing_address_1?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Street address is required for door-to-door delivery",
          path: ["billing_address_1"],
        });
      }
      if (!data.billing_city?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Area / estate is required for door-to-door delivery",
          path: ["billing_city"],
        });
      }
    } else {
      if (!data.parcel_town?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select the nearest town/centre for pickup",
          path: ["parcel_town"],
        });
      } else if (
        !matchOption(
          data.parcel_town,
          getParcelTownNamesForCounty(matchedCounty),
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a town/centre from the list",
          path: ["parcel_town"],
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
