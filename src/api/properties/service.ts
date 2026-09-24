import { propertyDao } from "./dao";
import { PropertyFilterQuery } from "@/models/propertyModel";
import { UserSession } from "@/lib/auth";
import { ForbiddenError } from "@/lib/errors";
import { Prisma } from "@prisma/client";

export const propertyService = {
  async getPropertiesHierarchy(filter?: PropertyFilterQuery) {
    const where: Prisma.ProjectWhereInput = {};

    if (filter?.projectId) {
      where.id = filter.projectId;
    }

    const [projects, summary] = await Promise.all([
      propertyDao.getHierarchy(where),
      propertyDao.getInventorySummary(),
    ]);

    // Enhance hierarchy with project-level and building-level stats
    const enrichedProjects = projects.map((p) => {
      let projectUnitTotal = 0;
      let projectAvailable = 0;
      let projectBooked = 0;

      const buildings = p.buildings.map((b) => {
        let bAvailable = 0;
        let bBooked = 0;

        b.units.forEach((u) => {
          projectUnitTotal++;
          if (u.status === "AVAILABLE") {
            bAvailable++;
            projectAvailable++;
          } else if (u.status === "BOOKED" || u.status === "SOLD") {
            bBooked++;
            projectBooked++;
          }
        });

        return {
          ...b,
          stats: {
            totalUnits: b.units.length,
            availableUnits: bAvailable,
            bookedUnits: bBooked,
          },
        };
      });

      return {
        ...p,
        buildings,
        stats: {
          totalUnits: projectUnitTotal,
          availableUnits: projectAvailable,
          bookedUnits: projectBooked,
        },
      };
    });

    return {
      projects: enrichedProjects,
      summary,
    };
  },

  async getInventorySummary(_session: UserSession) {
    return propertyDao.getInventorySummary();
  },

  async createProject(data: any, session: UserSession) {
    if (session.role !== "ADMIN") {
      throw new ForbiddenError(
        "Access denied: Only Administrators can create new projects",
      );
    }
    return propertyDao.createProject(data);
  },

  async createBuilding(data: any, session: UserSession) {
    if (session.role !== "ADMIN") {
      throw new ForbiddenError(
        "Access denied: Only Administrators can create new buildings",
      );
    }
    return propertyDao.createBuilding(data);
  },

  async createUnit(data: any, session: UserSession) {
    if (session.role !== "ADMIN") {
      throw new ForbiddenError(
        "Access denied: Only Administrators can add inventory units",
      );
    }
    return propertyDao.createUnit(data);
  },
};
