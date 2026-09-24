import bcrypt from "bcryptjs";
import { authDao } from "./dao";
import { LoginInput, UserResponse } from "@/models/authModel";
import { UnauthorizedError } from "@/lib/errors";
import { signSessionToken, UserSession } from "@/lib/auth";

export const authService = {
  async login(
    input: LoginInput,
  ): Promise<{ user: UserResponse; token: string }> {
    const user = await authDao.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const session: UserSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = signSessionToken(session);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  },

  async getMe(userId: string): Promise<UserResponse> {
    const user = await authDao.findById(userId);
    if (!user) {
      throw new UnauthorizedError("User session expired or user not found");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  },

  async getTeamUsers() {
    return authDao.listAllUsers();
  },
};
