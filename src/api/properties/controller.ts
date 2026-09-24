import { NextRequest, NextResponse } from "next/server";
import {
  propertyFilterSchema,
  createProjectSchema,
  createBuildingSchema,
  createUnitSchema,
} from "@/models/propertyModel";
import { propertyService } from "./service";
import { handleControllerError, BadRequestError } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";

export const propertyController = {
  async getHierarchy(req: NextRequest) {
    try {
      const url = new URL(req.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      const validatedFilter = propertyFilterSchema.parse(queryParams);

      const result =
        await propertyService.getPropertiesHierarchy(validatedFilter);

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return handleControllerError(error);
    }
  },

  async getSummary(req: NextRequest) {
    try {
      const session = requireAuth(req);
      const summary = await propertyService.getInventorySummary(session);

      return NextResponse.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      return handleControllerError(error);
    }
  },

  async create(req: NextRequest) {
    try {
      const session = requireAuth(req);
      const url = new URL(req.url);
      const type = url.searchParams.get("type") || "project";
      const body = await req.json();

      let result;
      if (type === "project") {
        const validated = createProjectSchema.parse(body);
        result = await propertyService.createProject(validated, session);
      } else if (type === "building") {
        const validated = createBuildingSchema.parse(body);
        result = await propertyService.createBuilding(validated, session);
      } else if (type === "unit") {
        const validated = createUnitSchema.parse(body);
        result = await propertyService.createUnit(validated, session);
      } else {
        throw new BadRequestError("Invalid property resource creation type");
      }

      return NextResponse.json(
        {
          success: true,
          data: result,
        },
        { status: 201 },
      );
    } catch (error) {
      return handleControllerError(error);
    }
  },
};
