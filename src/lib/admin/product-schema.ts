import { z } from "zod";

export const productFormSchema = z.object({
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
  categoryIds: z.array(z.number()),
  relatedProductIds: z.array(z.number()),
  crossSellProductIds: z.array(z.number()),
  upsellProductIds: z.array(z.number()),
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
      (value) =>
        !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      { message: "Enter a valid discount price" },
    ),
  manageStock: z.boolean(),
  stockQuantity: z.string().trim().optional(),
  inStock: z.boolean(),
});

export type VariationFormValues = z.infer<typeof variationFormSchema>;
