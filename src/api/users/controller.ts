import { NextRequest, NextResponse } from "next/server";
import { userService } from "./service";
import {
  createUserSchema,
  updateUserRoleSchema,
  resetPasswordSchema,
  userFilterSchema,
} from "@/models/userModel";
import { requireAuth } from "@/lib/auth";
import { handleControllerError } from "@/lib/errors";

export const userController = {
  async list(req: NextRequest) {
    try {
      const session = requireAuth(req);
      const url = new URL(req.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      const validated = userFilterSchema.parse(queryParams);

      const result = await userService.listUsers(validated, session);
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
      const validated = createUserSchema.parse(body);

      const result = await userService.createUser(validated, session);
      return NextResponse.json(
        {
          success: true,
          data: result,
          message: "User created successfully",
        },
        { status: 201 },
      );
    } catch (error) {
      return handleControllerError(error);
    }
  },

  async updateRole(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    try {
      const session = requireAuth(req);
      const { id } = await params;
      const body = await req.json();
      const validated = updateUserRoleSchema.parse(body);

      const result = await userService.updateUserRole(id, validated, session);
      return NextResponse.json({
        success: true,
        data: result,
        message: "User role updated successfully",
      });
    } catch (error) {
      return handleControllerError(error);
    }
  },

  async resetPassword(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    try {
      const session = requireAuth(req);
      const { id } = await params;
      const body = await req.json();
      const validated = resetPasswordSchema.parse(body);

      const result = await userService.resetUserPassword(
        id,
        validated.newPassword,
        session,
      );
      return NextResponse.json({
        success: true,
        data: result,
        message: "Password reset successfully",
      });
    } catch (error) {
      return handleControllerError(error);
    }
  },

  async delete(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    try {
      const session = requireAuth(req);
      const { id } = await params;

      const result = await userService.deleteUser(id, session);
      return NextResponse.json(result);
    } catch (error) {
      return handleControllerError(error);
    }
  },
};
