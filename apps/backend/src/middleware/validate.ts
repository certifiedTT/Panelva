import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

/**
 * Sanitizes input strings to prevent cross-site scripting (XSS) attacks.
 * Strips HTML tags, script elements, and trims excessive whitespaces.
 */
export function sanitizeString(val: string): string {
  if (typeof val !== "string") return val;
  return val
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "") // Prune script tags & contents
    .replace(/<\/?[^>]+(>|$)/g, "") // Prune other HTML tags
    .trim();
}

/**
 * Recursively scans and sanitizes request elements (body, query, params).
 */
export function sanitizeInput(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }
  
  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeInput(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Standard Express middleware utilizing Zod schemas for input validation
 * and executing custom sanitization filters on incoming string payloads.
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Sanitize request components prior to schema checks (XSS prevention)
      req.body = sanitizeInput(req.body);
      req.query = sanitizeInput(req.query);
      req.params = sanitizeInput(req.params);

      // 2. Validate sanitized fields against Zod structure
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Propagate the parsed data back to express context
      req.body = parsed.body || req.body;
      req.query = parsed.query || req.query;
      req.params = parsed.params || req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: "fail",
          error: "Validation failed",
          details: error.errors.map((e) => ({
            field: e.path.join(".").replace(/^body\.|^query\.|^params\./, ""),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
