import { NextRequest } from "next/server";
import { userController } from "@/api/users/controller";

export async function GET(req: NextRequest) {
  return userController.list(req);
}

export async function POST(req: NextRequest) {
  return userController.create(req);
}
