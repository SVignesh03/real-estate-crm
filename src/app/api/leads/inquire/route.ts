import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { handleControllerError } from "@/lib/errors";

const publicInquirySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number must be at least 7 digits")
    .optional()
    .default("+1 (555) 000-0000"),
  unitId: z.string().trim().optional(),
  interestedUnitId: z.string().trim().optional(),
  note: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = publicInquirySchema.parse(body);

    const unitId = data.unitId || data.interestedUnitId;
    if (!unitId) {
      return NextResponse.json(
        { success: false, error: "Unit ID is required" },
        { status: 400 },
      );
    }

    const noteText = data.note || data.notes;

    // Verify unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        building: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!unit) {
      return NextResponse.json(
        { success: false, error: "Property unit not found" },
        { status: 404 },
      );
    }

    // Find default admin for initial note author if needed
    const defaultAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    // Create Lead in stage NEW
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        source: "PUBLIC_INQUIRY",
        stage: "NEW",
        budget: unit.price,
        interestedUnitId: unit.id,
        notes:
          noteText && defaultAdmin
            ? {
                create: [
                  {
                    authorId: defaultAdmin.id,
                    content: `Web Inquiry for Unit ${unit.unitNumber} (${unit.building.project.name}): ${noteText}`,
                  },
                ],
              }
            : undefined,
      },
      include: {
        interestedUnit: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Inquiry submitted successfully. A representative will contact you shortly.",
        data: lead,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleControllerError(error);
  }
}
