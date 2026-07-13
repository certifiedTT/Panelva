import { IAuthService, UserSession } from "../interfaces/IAuthService";
import { supabase } from "../client";
import { withRetry } from "../utils/dbRetry";

export class SupabaseAuthService implements IAuthService {
  async signUp(
    email: string,
    password: string,
    username?: string
  ): Promise<UserSession> {
    const { data, error } = await withRetry(() =>
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split("@")[0],
          },
        },
      })
    );

    if (error) {
      // Secure: generic error message to prevent user enumeration
      throw new Error("Registration failed. Please verify your details and try again.");
    }

    if (!data.user) {
      throw new Error("Registration succeeded but user payload is missing.");
    }

    return {
      userId: data.user.id,
      email: data.user.email || email,
      role: "USER",
      token: data.session?.access_token,
    };
  }

  async logIn(email: string, password: string): Promise<UserSession> {
    const { data, error } = await withRetry(() =>
      supabase.auth.signInWithPassword({
        email,
        password,
      })
    );

    if (error || !data.user || !data.session) {
      // Secure: generic credentials validation error
      throw new Error("Invalid credentials");
    }

    // Query user role from public profiles table
    const { data: profile } = await withRetry(() =>
      supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single()
    );

    return {
      userId: data.user.id,
      email: data.user.email || email,
      role: profile?.role || "USER",
      token: data.session.access_token,
    };
  }

  async verifyToken(token: string): Promise<UserSession> {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new Error("Invalid or expired session token");
    }

    const { data: profile } = await withRetry(() =>
      supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single()
    );

    return {
      userId: data.user.id,
      email: data.user.email || "",
      role: profile?.role || "USER",
      token,
    };
  }
}
