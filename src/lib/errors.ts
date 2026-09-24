import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad request") {
    super(message, 400);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied: insufficient permissions") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = "Conflict: resource state prohibits this action",
  ) {
    super(message, 409);
    this.name = "ConflictError";
  }
}

export function handleControllerError(error: unknown) {
  console.error("[API Controller Error]:", error);

  if (error instanceof ZodError) {
    const errorDetails = error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    return NextResponse.json(
      {
        success: false,
        error: `Validation failed: ${errorDetails}`,
      },
      { status: 400 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: error.statusCode },
    );
  }

  const message =
    error instanceof Error ? error.message : "Internal Server Error";
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 500 },
  );
}
