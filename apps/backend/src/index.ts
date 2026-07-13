import dotenv from "dotenv";
import { createApp } from "./app";
import { SupabaseAuthService } from "./services/SupabaseAuthService";
import { SupabaseUserRepository } from "./repositories/SupabaseUserRepository";
import { SupabaseContentRepository } from "./repositories/SupabaseContentRepository";

// Load local configurations
dotenv.config();

const port = process.env.PORT || 3001;

// 1. Instantiate the Supabase-specific provider implementations
const authService = new SupabaseAuthService();
const userRepository = new SupabaseUserRepository();
const contentRepository = new SupabaseContentRepository();

// 2. Perform Dependency Injection (DI) into the decoupled Express app
const app = createApp(authService, userRepository, contentRepository);

// 3. Launch HTTP listener
app.listen(port, () => {
  console.log(`[Boot] Decoupled backend is listening on port ${port}`);
  console.log(`[Boot] Running with Supabase Concrete Providers`);
});
