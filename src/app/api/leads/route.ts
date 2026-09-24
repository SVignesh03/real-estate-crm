import { NextRequest } from "next/server";
import { leadController } from "@/api/leads/controller";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get("metrics") === "true") {
    return leadController.getMetrics(req);
  }
  return leadController.list(req);
}

export async function POST(req: NextRequest) {
  return leadController.create(req);
}
