import { z } from "zod";

export const roleEnum = z.enum(["ADMIN", "SALES_REP"]);
export type RoleType = z.infer<typeof roleEnum>;

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: roleEnum,
  createdAt: z.date().or(z.string()),
});
export type UserResponse = z.infer<typeof userResponseSchema>;

export const authSessionSchema = z.object({
  user: userResponseSchema,
  token: z.string().optional(),
});
export type AuthSession = z.infer<typeof authSessionSchema>;
