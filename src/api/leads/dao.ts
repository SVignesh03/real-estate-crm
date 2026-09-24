import prisma from "@/lib/prisma";
import { Prisma, LeadStage } from "@prisma/client";
import {
  CreateLeadInput,
  UpdateLeadInput,
  CreateLeadNoteInput,
} from "@/models/leadModel";

export interface LeadFindManyParams {
  where?: Prisma.LeadWhereInput;
  skip?: number;
  take?: number;
  orderBy?: Prisma.LeadOrderByWithRelationInput;
}

export const leadDao = {
  async findMany({ where, skip, take, orderBy }: LeadFindManyParams = {}) {
    return prisma.lead.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { updatedAt: "desc" },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        interestedUnit: {
          select: {
            id: true,
            unitNumber: true,
            type: true,
            areaSqFt: true,
            price: true,
            status: true,
            building: {
              select: {
                id: true,
                name: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                    location: true,
                  },
                },
              },
            },
          },
        },
        notes: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  async count(where?: Prisma.LeadWhereInput) {
    return prisma.lead.count({ where });
  },

  async findById(id: string) {
    return prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        interestedUnit: {
          select: {
            id: true,
            unitNumber: true,
            type: true,
            areaSqFt: true,
            price: true,
            status: true,
            building: {
              select: {
                id: true,
                name: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                    location: true,
                  },
                },
              },
            },
          },
        },
        notes: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        bookings: {
          include: {
            unit: true,
            bookedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  },

  async create(data: CreateLeadInput) {
    return prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        source: data.source,
        stage: data.stage as LeadStage,
        budget:
          data.budget !== undefined && data.budget !== null
            ? new Prisma.Decimal(data.budget)
            : null,
        assignedToId: data.assignedToId || null,
        interestedUnitId: data.interestedUnitId || null,
      },
      include: {
        assignedTo: true,
        interestedUnit: true,
      },
    });
  },

  async update(id: string, data: UpdateLeadInput) {
    const updateData: Prisma.LeadUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.stage !== undefined) updateData.stage = data.stage as LeadStage;
    if (data.budget !== undefined) {
      updateData.budget =
        data.budget !== null ? new Prisma.Decimal(data.budget) : null;
    }
    if (data.assignedToId !== undefined) {
      updateData.assignedTo = data.assignedToId
        ? { connect: { id: data.assignedToId } }
        : { disconnect: true };
    }
    if (data.interestedUnitId !== undefined) {
      updateData.interestedUnit = data.interestedUnitId
        ? { connect: { id: data.interestedUnitId } }
        : { disconnect: true };
    }

    return prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: true,
        interestedUnit: true,
      },
    });
  },

  async addNote(leadId: string, authorId: string, input: CreateLeadNoteInput) {
    return prisma.leadNote.create({
      data: {
        leadId,
        authorId,
        content: input.content,
        nextFollowUpDate: input.nextFollowUpDate
          ? new Date(input.nextFollowUpDate)
          : null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  async getFollowUpsDue(salesRepId?: string) {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const where: Prisma.LeadNoteWhereInput = {
      nextFollowUpDate: {
        lte: endOfToday,
      },
    };

    if (salesRepId) {
      where.lead = {
        assignedToId: salesRepId,
      };
    }

    return prisma.leadNote.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            stage: true,
            assignedToId: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { nextFollowUpDate: "asc" },
    });
  },
};
