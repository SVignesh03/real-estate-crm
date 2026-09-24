import { z } from "zod";

export const leadStageEnum = z.enum([
  "NEW",
  "CONTACTED",
  "SITE_VISIT",
  "INTERESTED",
  "NEGOTIATION",
  "BOOKED",
  "LOST",
]);
export type LeadStageType = z.infer<typeof leadStageEnum>;

export const createLeadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().min(7, "Phone number must be at least 7 digits"),
  source: z
    .string()
    .trim()
    .min(1, "Lead source is required")
    .default("WEBSITE"),
  stage: leadStageEnum.default("NEW"),
  budget: z
    .number()
    .positive("Budget must be a positive amount")
    .optional()
    .nullable(),
  assignedToId: z.string().trim().min(1).optional().nullable(),
  interestedUnitId: z.string().trim().min(1).optional().nullable(),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = createLeadSchema.partial();
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const createLeadNoteSchema = z.object({
  content: z.string().trim().min(1, "Note content cannot be empty"),
  nextFollowUpDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .or(z.date())
    .optional()
    .nullable(),
});
export type CreateLeadNoteInput = z.infer<typeof createLeadNoteSchema>;

export const leadFilterSchema = z.object({
  stage: leadStageEnum.optional(),
  assignedToId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type LeadFilterQuery = z.infer<typeof leadFilterSchema>;

export const leadNoteResponseSchema = z.object({
  id: z.string(),
  leadId: z.string(),
  authorId: z.string(),
  author: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    })
    .optional(),
  content: z.string(),
  nextFollowUpDate: z.date().or(z.string()).nullable(),
  createdAt: z.date().or(z.string()),
});
export type LeadNoteResponse = z.infer<typeof leadNoteResponseSchema>;

export const leadResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  source: z.string(),
  stage: leadStageEnum,
  budget: z.number().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
  assignedTo: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      role: z.string(),
    })
    .nullable()
    .optional(),
  interestedUnitId: z.string().nullable().optional(),
  interestedUnit: z
    .object({
      id: z.string(),
      unitNumber: z.string(),
      price: z.number(),
      status: z.string(),
      type: z.string(),
      building: z
        .object({
          name: z.string(),
          project: z.object({
            name: z.string(),
          }),
        })
        .optional(),
    })
    .nullable()
    .optional(),
  notes: z.array(leadNoteResponseSchema).optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});
export type LeadResponse = z.infer<typeof leadResponseSchema>;
