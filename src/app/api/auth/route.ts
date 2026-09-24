import { NextRequest } from "next/server";
import { authController } from "@/api/auth/controller";

export async function POST(req: NextRequest) {
  return authController.login(req);
}

export async function DELETE() {
  return authController.logout();
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get("team") === "true") {
    return authController.getTeam(req);
  }
  return authController.getMe(req);
}
