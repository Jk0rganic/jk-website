import { z } from "zod";

export const commentSchema = z.object({
  name: z.string().min(1, "*"),
  email: z.string().email("*"),
  comment: z.string().min(1, "*"),
  saveDetails: z.boolean().optional(),
});

export type ContactFormSchemaType = z.infer<typeof contactFormSchema>;

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(100, { message: "Name cannot exceed 100 characters" })
    .trim()
    .refine((val) => val.split(" ").length >= 2, {
      message: "Please enter both first and last name.",
    }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  subject: z
    .string()
    .min(3, { message: "Subject must be at least 3 characters long" })
    .max(150, { message: "Subject cannot exceed 150 characters" })
    .trim(),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters long" })
    .max(1000, { message: "Message cannot exceed 1000 characters" })
    .trim(),
});

export const reviewSchema = z.object({
  reviewer: z
    .string()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),

  reviewer_email: z
    .string()
    .email({ message: "Invalid email address" })
    .min(1, { message: "Email is required" })
    .max(100, { message: "Email must be less than 100 characters" }),

  rating: z
    .number()
    .min(1, { message: "Rating must be at least 1" })
    .max(5, { message: "Rating must be no more than 5" }),

  review: z
    .string()
    .min(1, { message: "Review is required" })
    .max(1000, { message: "Review must be less than 1000 characters" }),
});
export const commentsSchema = z.object({
  reviewer: reviewSchema.shape.reviewer,
  reviewer_email: reviewSchema.shape.reviewer_email,
  review: reviewSchema.shape.review,
});

export const registerUserSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Full Name must be at least 2 characters long")
      .max(50, "Full Name cannot exceed 50 characters"),

    email: z.string().email("Invalid email address"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password cannot exceed 100 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).+$/,
        "Password must contain uppercase, lowercase, number, and special character",
      ),

    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type RegisterUserSchema = z.infer<typeof registerUserSchema>;

export const loginSchema = z.object({
  email: registerUserSchema.shape.email,
  password: z.string().min(1, "Enter your password"),
});

export const verificationSchema = z.object({
  email: registerUserSchema.shape.email,
  code: z
    .string()
    .min(1, "Verification code is required")
    .max(6, "Verification code cannot exceed 6 characters"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(100, { message: "Password cannot exceed 100 characters" })
      .regex(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).+$/,
        "Password must contain uppercase, lowercase, number, and special character",
      ),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const newPasswordSchema = z.object({
  email: registerUserSchema.shape.email,
});

export type EmailVerificationSchema = z.infer<typeof emailVerificationSchema>;

export const emailVerificationSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});
