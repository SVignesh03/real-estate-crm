import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const propertyDao = {
  async getHierarchy(whereProjects?: Prisma.ProjectWhereInput) {
    return prisma.project.findMany({
      where: whereProjects,
      include: {
        buildings: {
          include: {
            units: {
              include: {
                booking: {
                  select: {
                    id: true,
                    bookingNumber: true,
                    status: true,
                    leadId: true,
                  },
                },
              },
              orderBy: [{ floor: "asc" }, { unitNumber: "asc" }],
            },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  async findUnitById(id: string) {
    return prisma.unit.findUnique({
      where: { id },
      include: {
        building: {
          include: {
            project: true,
          },
        },
        booking: true,
      },
    });
  },

  async getInventorySummary() {
    const units = await prisma.unit.findMany({
      select: {
        id: true,
        status: true,
        price: true,
      },
    });

    const counts = {
      total: units.length,
      available: 0,
      booked: 0,
      blocked: 0,
      sold: 0,
    };

    let totalInventoryValue = 0;
    let bookedRevenue = 0;

    units.forEach((u) => {
      const priceNum = Number(u.price);
      totalInventoryValue += priceNum;

      if (u.status === "AVAILABLE") counts.available++;
      else if (u.status === "BOOKED") {
        counts.booked++;
        bookedRevenue += priceNum;
      } else if (u.status === "BLOCKED") counts.blocked++;
      else if (u.status === "SOLD") {
        counts.sold++;
        bookedRevenue += priceNum;
      }
    });

    const occupancyRate =
      counts.total > 0
        ? Math.round(((counts.booked + counts.sold) / counts.total) * 100)
        : 0;

    return {
      counts,
      occupancyRate,
      totalInventoryValue,
      bookedRevenue,
    };
  },

  async createProject(data: {
    name: string;
    description?: string | null;
    location: string;
    status?: any;
  }) {
    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description || null,
        location: data.location,
        status: data.status || "UNDER_CONSTRUCTION",
      },
    });
  },

  async createBuilding(data: {
    name: string;
    projectId: string;
    floors: number;
  }) {
    return prisma.building.create({
      data: {
        name: data.name,
        projectId: data.projectId,
        floors: data.floors,
      },
    });
  },

  async createUnit(data: {
    unitNumber: string;
    buildingId: string;
    floor: number;
    type: any;
    areaSqFt: number;
    price: number;
    status?: any;
  }) {
    return prisma.unit.create({
      data: {
        unitNumber: data.unitNumber,
        buildingId: data.buildingId,
        floor: data.floor,
        type: data.type,
        areaSqFt: data.areaSqFt,
        price: new Prisma.Decimal(data.price),
        status: data.status || "AVAILABLE",
      },
    });
  },
};
