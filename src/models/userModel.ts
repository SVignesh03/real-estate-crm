import { z } from "zod";
import { Role } from "@prisma/client";

export const userRoleEnum = z.enum(["ADMIN", "SALES_REP"]);
export type UserRoleType = z.infer<typeof userRoleEnum>;

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: userRoleEnum.default("SALES_REP"),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserRoleSchema = z.object({
  role: userRoleEnum,
});
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const userFilterSchema = z.object({
  role: userRoleEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
export type UserFilterQuery = z.infer<typeof userFilterSchema>;

export interface UserDirectoryItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date | string;
  updatedAt: Date | string;
  leadsCount: number;
  bookingsCount: number;
  notesCount: number;
}
