import { Prisma } from "@prisma/client";
import { bookingDao } from "./dao";
import { CreateBookingInput, BookingFilterQuery } from "@/models/bookingModel";
import { UserSession } from "@/lib/auth";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export const bookingService = {
  async createBooking(input: CreateBookingInput, session: UserSession) {
    // 1. RBAC check on Lead: Sales Rep can only book for leads assigned to them
    const targetLead = await prisma.lead.findUnique({
      where: { id: input.leadId },
    });

    if (!targetLead) {
      throw new NotFoundError(`Lead with ID '${input.leadId}' not found.`);
    }

    if (
      session.role === "SALES_REP" &&
      targetLead.assignedToId !== session.userId
    ) {
      throw new ForbiddenError(
        "Access denied: You can only book property units for leads assigned to your representative account.",
      );
    }

    // 2. Execute isolated ACID transaction
    return bookingDao.executeAtomicBooking({
      unitId: input.unitId,
      leadId: input.leadId,
      bookedById: session.userId,
      bookingAmount: input.bookingAmount,
      totalAmount: input.totalAmount,
      notes: input.notes,
    });
  },

  async getBookings(query: BookingFilterQuery, session: UserSession) {
    const where: Prisma.BookingWhereInput = {};

    // RBAC: Sales Reps view bookings they processed
    if (session.role === "SALES_REP") {
      where.bookedById = session.userId;
    } else {
      if (query.bookedById) {
        where.bookedById = query.bookedById;
      }
    }

    if (query.status) {
      where.status = query.status;
    }
    if (query.leadId) {
      where.leadId = query.leadId;
    }
    if (query.unitId) {
      where.unitId = query.unitId;
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [bookings, totalCount] = await Promise.all([
      bookingDao.findMany(where, skip, limit),
      bookingDao.count(where),
    ]);

    return {
      items: bookings,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  },

  async getBookingById(id: string, session: UserSession) {
    const booking = await bookingDao.findById(id);
    if (!booking) {
      throw new NotFoundError("Booking record not found");
    }

    if (session.role === "SALES_REP" && booking.bookedById !== session.userId) {
      throw new ForbiddenError(
        "Access denied: You can only view booking records associated with your account.",
      );
    }

    return booking;
  },
};
