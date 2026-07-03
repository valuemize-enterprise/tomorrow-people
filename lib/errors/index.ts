/**
 * lib/errors/index.ts
 *
 * Typed error classes for consistent HTTP error responses.
 * Throw these inside service functions; catch them in the API handler wrapper.
 *
 * Usage:
 *   throw new NotFoundError("Habit not found")
 *   throw new ForbiddenError()
 */

import { NextResponse } from "next/server"

// ─── Base ─────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message)
    this.name = "AppError"
  }
}

// ─── Subtypes ─────────────────────────────────────────────────────

export class UnauthorisedError extends AppError {
  constructor(message = "Unauthorised") {
    super(message, 401, "UNAUTHORISED")
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN")
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND")
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    public readonly issues?: Record<string, string[]>,
  ) {
    super(message, 422, "VALIDATION_ERROR")
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "RATE_LIMIT_EXCEEDED")
  }
}

export class InternalError extends AppError {
  constructor(message = "Internal server error") {
    super(message, 500, "INTERNAL_ERROR")
  }
}

// ─── Error → NextResponse ─────────────────────────────────────────

export function toErrorResponse(err: unknown): NextResponse {
  // Known app error — safe to expose message
  if (err instanceof ValidationError) {
    return NextResponse.json(
      { error: err.message, code: err.code, issues: err.issues },
      { status: err.statusCode },
    )
  }

  if (err instanceof AppError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.statusCode },
    )
  }

  // Unknown error — log details server-side, return generic message to client
  console.error("[API Error]", err)
  return NextResponse.json(
    { error: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
    { status: 500 },
  )
}
