import { Request, Response, NextFunction } from "express";
import { IAuthService, UserSession } from "../interfaces/IAuthService";

// Extend Express Request typing context to propagate the session down routes
declare global {
  namespace Express {
    interface Request {
      user?: UserSession;
    }
  }
}

/**
 * Higher-order middleware factory that creates a JWT authentication middleware
 * using the abstract IAuthService dependency.
 */
export function createAuthMiddleware(authService: IAuthService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          status: "fail",
          error: "Missing authorization token header.",
        });
        return;
      }

      const token = authHeader.substring(7); // Extract token from 'Bearer <token>'
      if (!token) {
        res.status(401).json({
          status: "fail",
          error: "Authentication token is empty or malformed.",
        });
        return;
      }

      // Delegate verification to decoupled auth service provider
      const session = await authService.verifyToken(token);
      req.user = session;

      next();
    } catch (error: any) {
      res.status(401).json({
        status: "fail",
        error: error.message || "Invalid session credentials.",
      });
    }
  };
}

/**
 * Access control middleware checking user authorization against a list of roles.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: "fail",
        error: "User context not identified.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: "fail",
        error: "Access denied. Insufficient role permissions.",
      });
      return;
    }

    next();
  };
}
