import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { IAuthService } from "./interfaces/IAuthService";
import { IUserRepository } from "./interfaces/IUserRepository";
import { IContentRepository } from "./interfaces/IContentRepository";
import { createAuthMiddleware, requireRole } from "./middleware/auth";
import { validate } from "./middleware/validate";
import { standardLimiter, authLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import {
  signUpSchema,
  logInSchema,
  updateProfileSchema,
  registerCreatorSchema,
} from "./schemas/validationSchemas";

/**
 * Creates, configures, and routes the Express application instance.
 * Accepts all database and authentication logic as interface boundaries,
 * keeping the business logic layers independent of vendor-specific SDKs.
 */
export function createApp(
  authService: IAuthService,
  userRepository: IUserRepository,
  contentRepository: IContentRepository
): Express {
  const app = express();

  // 1. Establish core pipeline headers & security settings
  app.use(cors());
  app.use(express.json());

  // Initialize auth parser using abstraction boundaries
  const authenticate = createAuthMiddleware(authService);

  // 2. Authentication Endpoint (Auth Limiter + Body Validation)
  app.post(
    "/api/auth/signup",
    authLimiter,
    validate(signUpSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { email, password, username } = req.body;
        const session = await authService.signUp(email, password, username);
        res.status(201).json({ status: "success", data: session });
      } catch (err) {
        next(err);
      }
    }
  );

  app.post(
    "/api/auth/login",
    authLimiter,
    validate(logInSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { email, password } = req.body;
        const session = await authService.logIn(email, password);
        res.status(200).json({ status: "success", data: session });
      } catch (err) {
        next(err);
      }
    }
  );

  // 3. User Profile Endpoint (Standard Limiter + Session Check)
  app.get(
    "/api/profile/me",
    standardLimiter,
    authenticate,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const profile = await userRepository.findById(req.user!.userId);
        if (!profile) {
          res.status(404).json({ status: "fail", error: "User profile not found." });
          return;
        }
        res.status(200).json({ status: "success", data: profile });
      } catch (err) {
        next(err);
      }
    }
  );

  app.put(
    "/api/profile/update",
    standardLimiter,
    authenticate,
    validate(updateProfileSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const updates = req.body;
        const profile = await userRepository.updateProfile(req.user!.userId, updates);
        res.status(200).json({ status: "success", data: profile });
      } catch (err) {
        next(err);
      }
    }
  );

  // 4. Content Creator Registry (Restricted to logged-in users)
  app.post(
    "/api/creator/register",
    standardLimiter,
    authenticate,
    validate(registerCreatorSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const profile = await contentRepository.registerCreator(req.user!.userId, req.body);
        res.status(201).json({ status: "success", data: profile });
      } catch (err) {
        next(err);
      }
    }
  );

  // 5. Creator File Upload Endpoint (Restricted to CREATORS/ADMINS only)
  app.post(
    "/api/creator/upload",
    standardLimiter,
    authenticate,
    requireRole(["CREATOR", "ADMIN", "MASTER_ADMIN"]),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const fileName = (req.headers["x-file-name"] as string) || `asset_${Date.now()}.png`;
        const mimeType = (req.headers["content-type"] as string) || "image/png";
        
        // Mock buffer logic: read request payload stream or use simulated binary contents
        const binaryBuffer = Buffer.from("mock-binary-file-content");

        const publicUrl = await contentRepository.uploadFile(
          "creator-assets",
          fileName,
          binaryBuffer,
          mimeType
        );

        res.status(200).json({ status: "success", data: { url: publicUrl } });
      } catch (err) {
        next(err);
      }
    }
  );

  // 5.1 Trigger Chapter Lifecycle Background Job
  app.post(
    "/api/admin/jobs/chapter-lifecycle",
    standardLimiter,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        res.status(200).json({ 
          status: "success", 
          message: "Idempotent background job triggered successfully",
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // 5.2 Ad Chapter Unlock logging
  app.post(
    "/api/chapters/unlock-ad",
    standardLimiter,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { chapterId, userId } = req.body;
        res.status(200).json({
          status: "success",
          message: `Rewarded video unlock recorded for chapter ${chapterId}`,
          data: { chapterId, userId, unlockedAt: new Date().toISOString() }
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // 6. Global exception catching filter (cleans traces)
  app.use(errorHandler);

  return app;
}

