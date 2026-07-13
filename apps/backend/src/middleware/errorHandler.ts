import { Request, Response, NextFunction } from "express";

/**
 * Global Express error handling middleware.
 * Captures all unhandled exceptions, securely logs stack traces and debugging metadata
 * to the server stdout/stderr, and returns clean, schema-safe JSON errors to clients.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const timestamp = new Date().toISOString();
  
  // 1. Secure Logging (completely internal: hidden from public endpoints)
  console.error("--------------------------------------------------");
  console.error(`[FATAL ERROR] Timestamp: ${timestamp}`);
  console.error(`Route: ${req.method} ${req.path}`);
  console.error(`Client IP: ${req.headers["x-forwarded-for"] || req.socket.remoteAddress}`);
  console.error(`Error message: ${err.message || err}`);
  if (err.stack) {
    console.error(`Stack trace:\n${err.stack}`);
  }
  console.error("--------------------------------------------------");

  // 2. Extract operational status code or fallback to 500
  const statusCode = err.statusCode || 500;

  // 3. Safe Client Payload Generation (no leaking of schema, stack, or framework details)
  let safeMessage = "An unexpected error occurred. Please contact support.";
  
  if (statusCode < 500 && err.message) {
    // For client-side bad requests, it is safe to return the error description
    safeMessage = err.message;
  }

  res.status(statusCode).json({
    status: "error",
    error: safeMessage,
  });
}
