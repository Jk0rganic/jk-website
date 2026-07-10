import { z } from "zod";

export const createAdminSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required"),
    email: z.string().trim().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm the password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type CreateAdminValues = z.infer<typeof createAdminSchema>;

export const resetAdminPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm the password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const adminStatusSchema = z.object({
  disabled: z.boolean(),
});

export type ResetAdminPasswordValues = z.infer<typeof resetAdminPasswordSchema>;
export type AdminStatusValues = z.infer<typeof adminStatusSchema>;
