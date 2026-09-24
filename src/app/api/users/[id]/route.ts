import { NextRequest } from "next/server";
import { userController } from "@/api/users/controller";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return userController.updateRole(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return userController.delete(req, context);
}
