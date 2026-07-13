export interface ContentMetadata {
  id: string;
  userId: string;
  penName: string;
  bio: string | null;
  portfolioUrl: string | null;
  isVetted: boolean;
  createdAt: Date;
}

export interface IContentRepository {
  registerCreator(
    userId: string,
    data: { penName: string; bio?: string; portfolioUrl?: string }
  ): Promise<ContentMetadata>;
  getCreatorProfile(userId: string): Promise<ContentMetadata | null>;
  uploadFile(
    bucketName: string,
    path: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<string>;
}
