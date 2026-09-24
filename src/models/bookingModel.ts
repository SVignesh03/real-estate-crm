import { z } from "zod";

export const bookingStatusEnum = z.enum(["CONFIRMED", "CANCELLED", "PENDING"]);
export type BookingStatusType = z.infer<typeof bookingStatusEnum>;

export const createBookingSchema = z
  .object({
    unitId: z.string().trim().min(1, "Unit ID is required for booking"),
    leadId: z.string().trim().min(1, "Lead ID is required for booking"),
    bookingAmount: z.coerce
      .number()
      .positive("Booking token amount must be strictly greater than zero"),
    totalAmount: z.coerce
      .number()
      .positive("Total property amount must be strictly greater than zero"),
    notes: z.string().trim().optional().nullable(),
  })
  .refine((data) => data.bookingAmount <= data.totalAmount, {
    message: "Booking token amount cannot exceed total agreed property amount",
    path: ["bookingAmount"],
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const bookingFilterSchema = z.object({
  status: bookingStatusEnum.optional(),
  leadId: z.string().optional(),
  unitId: z.string().optional(),
  bookedById: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type BookingFilterQuery = z.infer<typeof bookingFilterSchema>;

export const bookingResponseSchema = z.object({
  id: z.string(),
  bookingNumber: z.string(),
  unitId: z.string(),
  leadId: z.string(),
  bookedById: z.string(),
  bookingAmount: z.number(),
  totalAmount: z.number(),
  status: bookingStatusEnum,
  notes: z.string().nullable().optional(),
  bookingDate: z.date().or(z.string()),
  unit: z
    .object({
      id: z.string(),
      unitNumber: z.string(),
      type: z.string(),
      areaSqFt: z.number(),
      price: z.number(),
      building: z
        .object({
          name: z.string(),
          project: z
            .object({
              name: z.string(),
              location: z.string(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
  lead: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      phone: z.string(),
    })
    .optional(),
  bookedBy: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      role: z.string(),
    })
    .optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});
export type BookingResponse = z.infer<typeof bookingResponseSchema>;
