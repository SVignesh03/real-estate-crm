import { Prisma, LeadStage } from "@prisma/client";
import { leadDao } from "./dao";
import {
  CreateLeadInput,
  UpdateLeadInput,
  CreateLeadNoteInput,
  LeadFilterQuery,
} from "@/models/leadModel";
import { UserSession } from "@/lib/auth";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export const leadService = {
  async getLeads(query: LeadFilterQuery, session: UserSession) {
    const where: Prisma.LeadWhereInput = {};

    // 1. RBAC Check: Sales Reps can ONLY see their assigned leads
    if (session.role === "SALES_REP") {
      where.assignedToId = session.userId;
    } else if (query.assignedToId) {
      // Admin can filter by any sales rep or unassigned
      if (query.assignedToId === "unassigned") {
        where.assignedToId = null;
      } else {
        where.assignedToId = query.assignedToId;
      }
    }

    // 2. Stage Filter
    if (query.stage) {
      where.stage = query.stage as LeadStage;
    }

    // 3. Search Filter (name, email, phone)
    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [leads, totalCount] = await Promise.all([
      leadDao.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      leadDao.count(where),
    ]);

    return {
      items: leads,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  },

  async getLeadById(id: string, session: UserSession) {
    const lead = await leadDao.findById(id);
    if (!lead) {
      throw new NotFoundError("Lead not found");
    }

    // RBAC Check
    if (session.role === "SALES_REP" && lead.assignedToId !== session.userId) {
      throw new ForbiddenError(
        "Access denied: You can only view leads assigned to your representative account.",
      );
    }

    return lead;
  },

  async createLead(input: CreateLeadInput, session: UserSession) {
    const data = { ...input };

    // RBAC Check: If Sales Rep creates a lead, automatically assign to themselves
    if (session.role === "SALES_REP") {
      data.assignedToId = session.userId;
    }

    return leadDao.create(data);
  },

  async updateLead(id: string, input: UpdateLeadInput, session: UserSession) {
    const existing = await leadDao.findById(id);
    if (!existing) {
      throw new NotFoundError("Lead not found");
    }

    // RBAC Check: Sales Rep can only update their own leads
    if (session.role === "SALES_REP") {
      if (existing.assignedToId !== session.userId) {
        throw new ForbiddenError(
          "Access denied: You can only modify leads assigned to your account.",
        );
      }

      // Sales Rep CANNOT reassign leads to another rep
      if (
        input.assignedToId !== undefined &&
        input.assignedToId !== session.userId
      ) {
        throw new ForbiddenError(
          "Access denied: Only Administrators possess privileges to reassign leads.",
        );
      }
    }

    return leadDao.update(id, input);
  },

  async addNote(
    leadId: string,
    input: CreateLeadNoteInput,
    session: UserSession,
  ) {
    const existing = await leadDao.findById(leadId);
    if (!existing) {
      throw new NotFoundError("Lead not found");
    }

    // RBAC Check
    if (
      session.role === "SALES_REP" &&
      existing.assignedToId !== session.userId
    ) {
      throw new ForbiddenError(
        "Access denied: You cannot add notes to leads assigned to other representatives.",
      );
    }

    return leadDao.addNote(leadId, session.userId, input);
  },

  async getDashboardMetrics(session: UserSession) {
    const where: Prisma.LeadWhereInput =
      session.role === "SALES_REP" ? { assignedToId: session.userId } : {};

    const [totalLeads, allLeads, followUps] = await Promise.all([
      leadDao.count(where),
      leadDao.findMany({ where }),
      leadDao.getFollowUpsDue(
        session.role === "SALES_REP" ? session.userId : undefined,
      ),
    ]);

    // Calculate stage distribution for pipeline funnel
    const stageCounts: Record<LeadStage, number> = {
      NEW: 0,
      CONTACTED: 0,
      SITE_VISIT: 0,
      INTERESTED: 0,
      NEGOTIATION: 0,
      BOOKED: 0,
      LOST: 0,
    };

    allLeads.forEach((l) => {
      if (stageCounts[l.stage] !== undefined) {
        stageCounts[l.stage]++;
      }
    });

    const activePipelineCount =
      stageCounts.NEW +
      stageCounts.CONTACTED +
      stageCounts.SITE_VISIT +
      stageCounts.INTERESTED +
      stageCounts.NEGOTIATION;

    return {
      totalLeads,
      activePipelineCount,
      stageCounts,
      followUpsDueToday: followUps,
    };
  },
};
