import { NextRequest, NextResponse } from "next/server";
import {
  createLeadSchema,
  updateLeadSchema,
  createLeadNoteSchema,
  leadFilterSchema,
} from "@/models/leadModel";
import { leadService } from "./service";
import { handleControllerError } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";

export const leadController = {
  async list(req: NextRequest) {
    try {
      const session = requireAuth(req);
      const url = new URL(req.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      const validatedQuery = leadFilterSchema.parse(queryParams);

      const result = await leadService.getLeads(validatedQuery, session);

      return NextResponse.json({
        success: true,
        data: result.items,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
      });
    } catch (error) {
      return handleControllerError(error);
    }
  },

  async create(req: NextRequest) {
    try {
      const session = requireAuth(req);
      const body = await req.json();
      const validatedInput = createLeadSchema.parse(body);

      const newLead = await leadService.createLead(validatedInput, session);

      return NextResponse.json(
        {
          success: true,
          data: newLead,
        },
        { status: 201 },
      );
    } catch (error) {
      return handleControllerError(error);
    }
  },

  async getById(req: NextRequest, id: string) {
    try {
      const session = requireAuth(req);
      const lead = await leadService.getLeadById(id, session);

      return NextResponse.json({
        success: true,
        data: lead,
      });
    } catch (error) {
      return handleControllerError(error);
    }
  },

  async update(req: NextRequest, id: string) {
    try {
      const session = requireAuth(req);
      const body = await req.json();
      const validatedInput = updateLeadSchema.parse(body);

      const updated = await leadService.updateLead(id, validatedInput, session);

      return NextResponse.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      return handleControllerError(error);
    }
  },

  async addNote(req: NextRequest, id: string) {
    try {
      const session = requireAuth(req);
      const body = await req.json();
      const validatedInput = createLeadNoteSchema.parse(body);

      const note = await leadService.addNote(id, validatedInput, session);

      return NextResponse.json(
        {
          success: true,
          data: note,
        },
        { status: 201 },
      );
    } catch (error) {
      return handleControllerError(error);
    }
  },

  async getMetrics(req: NextRequest) {
    try {
      const session = requireAuth(req);
      const metrics = await leadService.getDashboardMetrics(session);

      return NextResponse.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      return handleControllerError(error);
    }
  },
};
