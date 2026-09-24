import bcrypt from "bcryptjs";
import { userDao } from "./dao";
import {
  CreateUserInput,
  UpdateUserRoleInput,
  UserFilterQuery,
  UserDirectoryItem,
} from "@/models/userModel";
import { UserSession } from "@/lib/auth";
import {
  ForbiddenError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from "@/lib/errors";

export const userService = {
  async listUsers(filter: UserFilterQuery, session: UserSession) {
    if (session.role !== "ADMIN") {
      throw new ForbiddenError(
        "Access denied: User management is restricted to Administrators",
      );
    }

    const { users, totalCount } = await userDao.listUsers(filter);

    const items: UserDirectoryItem[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      leadsCount: u._count.assignedLeads,
      bookingsCount: u._count.bookings,
      notesCount: u._count.notes,
    }));

    const totalPages = Math.ceil(totalCount / filter.limit) || 1;

    return {
      items,
      totalCount,
      totalPages,
      currentPage: filter.page,
    };
  },

  async createUser(input: CreateUserInput, session: UserSession) {
    if (session.role !== "ADMIN") {
      throw new ForbiddenError(
        "Access denied: User creation is restricted to Administrators",
      );
    }

    const existing = await userDao.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("A user with this email address already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const created = await userDao.createUser({
      name: input.name,
      email: input.email,
      password: passwordHash,
      role: input.role,
    });

    return created;
  },

  async updateUserRole(
    userId: string,
    input: UpdateUserRoleInput,
    session: UserSession,
  ) {
    if (session.role !== "ADMIN") {
      throw new ForbiddenError(
        "Access denied: Role modification is restricted to Administrators",
      );
    }

    if (userId === session.userId && input.role !== "ADMIN") {
      throw new BadRequestError(
        "Administrators cannot demote their own active account",
      );
    }

    const user = await userDao.findById(userId);
    if (!user) {
      throw new NotFoundError("Target user not found");
    }

    return userDao.updateUserRole(userId, input.role);
  },

  async resetUserPassword(
    targetUserId: string,
    newPassword: string,
    session: UserSession,
  ) {
    if (session.role !== "ADMIN") {
      throw new ForbiddenError(
        "Access denied: Password reset is restricted to Administrators",
      );
    }

    const user = await userDao.findById(targetUserId);
    if (!user) {
      throw new NotFoundError("Target user not found");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userDao.updateUserPassword(targetUserId, passwordHash);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      message: "Password reset successfully",
    };
  },

  async deleteUser(userId: string, session: UserSession) {
    if (session.role !== "ADMIN") {
      throw new ForbiddenError(
        "Access denied: User deletion is restricted to Administrators",
      );
    }

    if (userId === session.userId) {
      throw new BadRequestError(
        "Administrators cannot delete their own active account",
      );
    }

    const user = await userDao.findById(userId);
    if (!user) {
      throw new NotFoundError("Target user not found");
    }

    if (user._count.assignedLeads > 0 || user._count.bookings > 0) {
      throw new ConflictError(
        `Cannot delete user with ${user._count.assignedLeads} assigned lead(s) and ${user._count.bookings} confirmed booking(s). Reassign these records first.`,
      );
    }

    await userDao.deleteUser(userId);
    return { success: true, message: "User deleted successfully" };
  },
};
