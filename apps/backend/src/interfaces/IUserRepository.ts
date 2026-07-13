export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  role: string;
  preferences: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRepository {
  findById(id: string): Promise<UserProfile | null>;
  updateProfile(
    id: string,
    updates: Partial<Pick<UserProfile, "username" | "avatarUrl" | "preferences">>
  ): Promise<UserProfile>;
}
