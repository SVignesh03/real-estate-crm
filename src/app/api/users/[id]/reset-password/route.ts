import { NextRequest } from "next/server";
import { userController } from "@/api/users/controller";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return userController.resetPassword(req, context);
}
