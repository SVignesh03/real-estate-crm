import { NextRequest } from "next/server";
import { propertyController } from "@/api/properties/controller";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get("summary") === "true") {
    return propertyController.getSummary(req);
  }
  return propertyController.getHierarchy(req);
}

export async function POST(req: NextRequest) {
  return propertyController.create(req);
}
