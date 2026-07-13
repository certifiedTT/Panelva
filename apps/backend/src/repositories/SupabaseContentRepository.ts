import { IContentRepository, ContentMetadata } from "../interfaces/IContentRepository";
import { supabase } from "../client";
import { withRetry } from "../utils/dbRetry";

export class SupabaseContentRepository implements IContentRepository {
  async registerCreator(
    userId: string,
    data: { penName: string; bio?: string; portfolioUrl?: string }
  ): Promise<ContentMetadata> {
    // 1. Insert Creator profile metadata
    const { data: creatorData, error: creatorError } = await withRetry(() =>
      supabase
        .from("creators")
        .insert({
          user_id: userId,
          pen_name: data.penName,
          bio: data.bio,
          portfolio_url: data.portfolioUrl,
          is_vetted: false, // Pending vetting verification
        })
        .select()
        .single()
    );

    if (creatorError) {
      throw new Error(`Database error on creator registration: ${creatorError.message}`);
    }

    // 2. Elevate user role to CREATOR in public users profile
    const { error: userError } = await withRetry(() =>
      supabase
        .from("users")
        .update({ role: "CREATOR", updated_at: new Date().toISOString() })
        .eq("id", userId)
    );

    if (userError) {
      throw new Error(`Database error elevating user role: ${userError.message}`);
    }

    return this.mapToDomain(creatorData);
  }

  async getCreatorProfile(userId: string): Promise<ContentMetadata | null> {
    const { data, error } = await withRetry(() =>
      supabase
        .from("creators")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()
    );

    if (error) {
      throw new Error(`Database error retrieving creator profile: ${error.message}`);
    }

    if (!data) return null;

    return this.mapToDomain(data);
  }

  async uploadFile(
    bucketName: string,
    path: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<string> {
    // Upload standard file array buffers to Supabase Buckets
    const { error } = await withRetry(() =>
      supabase.storage
        .from(bucketName)
        .upload(path, fileBuffer, {
          contentType: mimeType,
          cacheControl: "3600",
          upsert: true,
        })
    );

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);

    if (!data || !data.publicUrl) {
      throw new Error("Failed to retrieve public file asset URL.");
    }

    return data.publicUrl;
  }

  private mapToDomain(dbData: any): ContentMetadata {
    return {
      id: dbData.id,
      userId: dbData.user_id,
      penName: dbData.pen_name,
      bio: dbData.bio,
      portfolioUrl: dbData.portfolio_url,
      isVetted: dbData.is_vetted,
      createdAt: new Date(dbData.created_at),
    };
  }
}
