import { z } from "zod";

export const signUpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username cannot exceed 30 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain alphanumeric characters and underscores")
      .optional(),
  }),
});

export const logInSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address format"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username cannot exceed 30 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain alphanumeric characters and underscores")
      .optional(),
    avatarUrl: z.string().url("Invalid avatar URL format").optional().nullable(),
    preferences: z.record(z.any()).optional(),
  }),
});

export const registerCreatorSchema = z.object({
  body: z.object({
    penName: z
      .string()
      .min(2, "Pen name must be at least 2 characters")
      .max(50, "Pen name cannot exceed 50 characters"),
    bio: z
      .string()
      .max(500, "Bio cannot exceed 500 characters")
      .optional()
      .nullable(),
    portfolioUrl: z.string().url("Invalid portfolio URL format").optional().nullable(),
  }),
});
