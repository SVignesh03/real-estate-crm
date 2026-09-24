import { z } from "zod";

export const projectStatusEnum = z.enum([
  "PLANNING",
  "UNDER_CONSTRUCTION",
  "COMPLETED",
]);
export type ProjectStatusType = z.infer<typeof projectStatusEnum>;

export const unitTypeEnum = z.enum([
  "STUDIO",
  "ONE_BHK",
  "TWO_BHK",
  "THREE_BHK",
  "PENTHOUSE",
]);
export type UnitTypeType = z.infer<typeof unitTypeEnum>;

export const unitStatusEnum = z.enum([
  "AVAILABLE",
  "BOOKED",
  "BLOCKED",
  "SOLD",
]);
export type UnitStatusType = z.infer<typeof unitStatusEnum>;

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters"),
  description: z.string().trim().optional().nullable(),
  location: z.string().trim().min(2, "Location is required"),
  status: projectStatusEnum.default("UNDER_CONSTRUCTION"),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const createBuildingSchema = z.object({
  name: z.string().trim().min(1, "Building name is required"),
  projectId: z.string().trim().min(1, "Project ID is required"),
  floors: z.number().int().positive("Floors count must be positive").default(1),
});
export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;

export const createUnitSchema = z.object({
  unitNumber: z.string().trim().min(1, "Unit number is required"),
  buildingId: z.string().trim().min(1, "Building ID is required"),
  floor: z.number().int().nonnegative("Floor must be 0 or higher"),
  type: unitTypeEnum,
  areaSqFt: z.number().positive("Area must be a positive number"),
  price: z.number().positive("Price must be a positive number"),
  status: unitStatusEnum.default("AVAILABLE"),
});
export type CreateUnitInput = z.infer<typeof createUnitSchema>;

export const propertyFilterSchema = z.object({
  projectId: z.string().optional(),
  buildingId: z.string().optional(),
  status: unitStatusEnum.optional(),
  type: unitTypeEnum.optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
});
export type PropertyFilterQuery = z.infer<typeof propertyFilterSchema>;

export const unitResponseSchema = z.object({
  id: z.string(),
  unitNumber: z.string(),
  buildingId: z.string(),
  floor: z.number(),
  type: unitTypeEnum,
  areaSqFt: z.number(),
  price: z.number(),
  status: unitStatusEnum,
  buildingName: z.string().optional(),
  projectName: z.string().optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});
export type UnitResponse = z.infer<typeof unitResponseSchema>;

export const buildingResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  projectId: z.string(),
  floors: z.number(),
  units: z.array(unitResponseSchema).optional(),
});
export type BuildingResponse = z.infer<typeof buildingResponseSchema>;

export const projectResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  location: z.string(),
  status: projectStatusEnum,
  buildings: z.array(buildingResponseSchema).optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});
export type ProjectResponse = z.infer<typeof projectResponseSchema>;
