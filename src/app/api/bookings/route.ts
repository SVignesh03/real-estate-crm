import { NextRequest } from "next/server";
import { bookingController } from "@/api/bookings/controller";

export async function GET(req: NextRequest) {
  return bookingController.list(req);
}

export async function POST(req: NextRequest) {
  return bookingController.create(req);
}
