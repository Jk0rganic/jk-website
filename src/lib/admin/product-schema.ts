import { z } from "zod";

export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, "Product name is required"),
    shortDescription: z.string().trim().optional(),
    description: z.string().trim().optional(),
    sku: z.string().trim().optional(),
    regularPrice: z
      .string()
      .trim()
      .min(1, "Selling price is required")
      .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
        message: "Enter a valid price",
      }),
    salePrice: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) =>
          !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
        { message: "Enter a valid discount price" },
      ),
    saleStartsAt: z.string().trim().optional(),
    saleEndsAt: z.string().trim().optional(),
    manageStock: z.boolean(),
    stockQuantity: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) =>
          !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
        { message: "Enter a valid stock count" },
      ),
    inStock: z.boolean(),
    published: z.boolean(),
    featured: z.boolean(),
    categoryIds: z.array(z.number()),
    imageIds: z.array(z.number().positive()),
    relatedProductIds: z.array(z.number()),
    crossSellProductIds: z.array(z.number()),
    upsellProductIds: z.array(z.number()),
  })
  .superRefine((data, context) => {
    if (data.saleEndsAt && !data.salePrice) {
      context.addIssue({
        code: "custom",
        path: ["saleEndsAt"],
        message: "Set a discount price before choosing an expiry date",
      });
    }

    if (
      data.saleStartsAt &&
      data.saleEndsAt &&
      data.saleEndsAt < data.saleStartsAt
    ) {
      context.addIssue({
        code: "custom",
        path: ["saleEndsAt"],
        message: "Discount expiry must be after the start date",
      });
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const variationFormSchema = z.object({
  id: z.number(),
  name: z.string(),
  regularPrice: z
    .string()
    .trim()
    .min(1, "Price is required")
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: "Enter a valid price",
    }),
  salePrice: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      { message: "Enter a valid discount price" },
    ),
  manageStock: z.boolean(),
  stockQuantity: z.string().trim().optional(),
  inStock: z.boolean(),
});

export type VariationFormValues = z.infer<typeof variationFormSchema>;
