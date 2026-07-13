import { IUserRepository, UserProfile } from "../interfaces/IUserRepository";
import { supabase } from "../client";
import { withRetry } from "../utils/dbRetry";

export class SupabaseUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserProfile | null> {
    const { data, error } = await withRetry(() =>
      supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .maybeSingle()
    );

    if (error) {
      throw new Error(`Database error on profile search: ${error.message}`);
    }

    if (!data) return null;

    return this.mapToDomain(data);
  }

  async updateProfile(
    id: string,
    updates: Partial<Pick<UserProfile, "username" | "avatarUrl" | "preferences">>
  ): Promise<UserProfile> {
    const databaseUpdates: any = {};
    if (updates.username !== undefined) databaseUpdates.username = updates.username;
    if (updates.avatarUrl !== undefined) databaseUpdates.avatar_url = updates.avatarUrl;
    if (updates.preferences !== undefined) databaseUpdates.preferences = updates.preferences;
    databaseUpdates.updated_at = new Date().toISOString();

    const { data, error } = await withRetry(() =>
      supabase
        .from("users")
        .update(databaseUpdates)
        .eq("id", id)
        .select()
        .single()
    );

    if (error) {
      throw new Error(`Database error on profile update: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  private mapToDomain(dbData: any): UserProfile {
    return {
      id: dbData.id,
      email: dbData.email,
      username: dbData.username,
      avatarUrl: dbData.avatar_url,
      role: dbData.role,
      preferences: dbData.preferences || {},
      createdAt: new Date(dbData.created_at),
      updatedAt: new Date(dbData.updated_at),
    };
  }
}
