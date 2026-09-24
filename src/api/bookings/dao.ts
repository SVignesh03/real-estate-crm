import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ConflictError, NotFoundError } from "@/lib/errors";

export interface CreateBookingDaoParams {
  unitId: string;
  leadId: string;
  bookedById: string;
  bookingAmount: number;
  totalAmount: number;
  notes?: string | null;
}

export const bookingDao = {
  async findMany(
    where?: Prisma.BookingWhereInput,
    skip?: number,
    take?: number,
  ) {
    return prisma.booking.findMany({
      where,
      skip,
      take,
      include: {
        unit: {
          include: {
            building: {
              include: {
                project: true,
              },
            },
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            stage: true,
          },
        },
        bookedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { bookingDate: "desc" },
    });
  },

  async count(where?: Prisma.BookingWhereInput) {
    return prisma.booking.count({ where });
  },

  async findById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        unit: {
          include: {
            building: {
              include: {
                project: true,
              },
            },
          },
        },
        lead: true,
        bookedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  },

  /**
   * ACID Interactive Transaction:
   * 1. Atomically updates Unit status from 'AVAILABLE' to 'BOOKED'.
   * 2. Checks affected row count; throws 409 Conflict if unit is unavailable.
   3. Creates Booking record.
   4. Transitions Lead stage to 'BOOKED' and commits.
   */
  async executeAtomicBooking(params: CreateBookingDaoParams) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify lead exists first
      const lead = await tx.lead.findUnique({
        where: { id: params.leadId },
      });
      if (!lead) {
        throw new NotFoundError(
          `Lead with ID '${params.leadId}' does not exist`,
        );
      }

      // 2. Atomic conditional update on Unit
      const affectedRows = await tx.$executeRaw`
        UPDATE "Unit"
        SET "status" = 'BOOKED'::"UnitStatus", "updatedAt" = NOW()
        WHERE "id" = ${params.unitId} AND "status" = 'AVAILABLE'::"UnitStatus"
      `;

      if (affectedRows === 0) {
        throw new ConflictError(
          "Unit is no longer available or already booked by another transaction",
        );
      }

      // 3. Generate unique booking code: BK-${Date.now().toString(36).toUpperCase()}-${random}
      const bookingNumber = `BK-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 4. Insert Booking record
      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          unitId: params.unitId,
          leadId: params.leadId,
          bookedById: params.bookedById,
          bookingAmount: new Prisma.Decimal(params.bookingAmount),
          totalAmount: new Prisma.Decimal(params.totalAmount),
          status: "CONFIRMED",
          notes: params.notes || null,
        },
        include: {
          unit: {
            include: {
              building: {
                include: {
                  project: true,
                },
              },
            },
          },
          lead: true,
          bookedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // 5. Transition Lead stage to 'BOOKED'
      await tx.lead.update({
        where: { id: params.leadId },
        data: {
          stage: "BOOKED",
          interestedUnitId: params.unitId,
        },
      });

      return booking;
    });
  },
};
