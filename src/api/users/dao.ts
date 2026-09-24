import prisma from "@/lib/prisma";
import { Role, Prisma } from "@prisma/client";
import { UserFilterQuery } from "@/models/userModel";

export const userDao = {
  async listUsers(filter: UserFilterQuery) {
    const where: Prisma.UserWhereInput = {};

    if (filter.role) {
      where.role = filter.role;
    }

    if (filter.search) {
      const term = filter.search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              assignedLeads: true,
              bookings: true,
              notes: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: filter.limit,
        skip: (filter.page - 1) * filter.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, totalCount };
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedLeads: true,
            bookings: true,
            notes: true,
          },
        },
      },
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  },

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        password: data.password,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async updateUserRole(id: string, role: Role) {
    return prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async updateUserPassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { password: passwordHash },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });
  },

  async deleteUser(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  },
};
