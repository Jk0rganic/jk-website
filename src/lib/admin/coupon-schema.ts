import { z } from "zod";

const optionalAmount = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) =>
      !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
    { message: "Enter a valid amount" },
  );

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Coupon code is required")
      .max(40, "Coupon code is too long")
      .transform((value) => value.toUpperCase()),
    discountType: z.enum(["percent", "fixed_cart"], {
      error: "Select a discount type",
    }),
    amount: z.string().trim().min(1, "Discount amount is required"),
    description: z.string().trim().optional(),
    published: z.boolean(),
    usageLimit: optionalAmount,
    minimumAmount: optionalAmount,
    maximumAmount: optionalAmount,
    usageLimitPerUser: optionalAmount,
    individualUse: z.boolean().optional(),
    expiresAt: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    const amount = Number(data.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid discount amount",
        path: ["amount"],
      });
      return;
    }

    if (data.discountType === "percent" && amount > 100) {
      ctx.addIssue({
        code: "custom",
        message: "Percentage cannot exceed 100",
        path: ["amount"],
      });
    }
  });

export type CouponFormValues = z.infer<typeof couponFormSchema>;
