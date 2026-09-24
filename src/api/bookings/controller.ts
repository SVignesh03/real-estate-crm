import { NextRequest, NextResponse } from "next/server";
import {
  createBookingSchema,
  bookingFilterSchema,
} from "@/models/bookingModel";
import { bookingService } from "./service";
import { handleControllerError } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";

export const bookingController = {
  async create(req: NextRequest) {
    try {
      const session = requireAuth(req);
      const body = await req.json();
      const validatedInput = createBookingSchema.parse(body);

      const booking = await bookingService.createBooking(
        validatedInput,
        session,
      );

      return NextResponse.json(
        {
          success: true,
          data: booking,
        },
        { status: 201 },
      );
    } catch (error) {
      return handleControllerError(error);
    }
  },

  async list(req: NextRequest) {
    try {
      const session = requireAuth(req);
      const url = new URL(req.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      const validatedQuery = bookingFilterSchema.parse(queryParams);

      const result = await bookingService.getBookings(validatedQuery, session);

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

  async getById(req: NextRequest, id: string) {
    try {
      const session = requireAuth(req);
      const booking = await bookingService.getBookingById(id, session);

      return NextResponse.json({
        success: true,
        data: booking,
      });
    } catch (error) {
      return handleControllerError(error);
    }
  },
};
