import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/models/authModel";
import { authService } from "./service";
import { handleControllerError } from "@/lib/errors";
import { AUTH_COOKIE_NAME, requireAuth } from "@/lib/auth";

export const authController = {
  async login(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedInput = loginSchema.parse(body);

      const result = await authService.login(validatedInput);

      const response = NextResponse.json({
        success: true,
        data: result,
      });

      // Set HTTP-only secure cookie
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: result.token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return response;
    } catch (error) {
      return handleControllerError(error);
    }
  },

  async logout() {
    try {
      const response = NextResponse.json({
        success: true,
        message: "Successfully logged out",
      });

      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });

      return response;
    } catch (error) {
      return handleControllerError(error);
    }
  },

  async getMe(req: NextRequest) {
    try {
      const session = requireAuth(req);
      const user = await authService.getMe(session.userId);

      return NextResponse.json({
        success: true,
        data: user,
      });
    } catch (error) {
      return handleControllerError(error);
    }
  },

  async getTeam(req: NextRequest) {
    try {
      requireAuth(req);
      const team = await authService.getTeamUsers();

      return NextResponse.json({
        success: true,
        data: team,
      });
    } catch (error) {
      return handleControllerError(error);
    }
  },
};
