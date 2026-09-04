import { getSupabaseClient } from '../client';
import {
  Studio,
  StudioRole,
  ChapterTaskStatus,
  ChapterTaskStage,
  ContractStatus,
  validateRevenueSplits,
} from '@panelva/database';

export interface CreateStudioParams {
  name: string;
  slug: string;
  ownerId: string;
  bio?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

/**
 * Creates a new Studio organization and adds the creator as OWNER.
 */
export async function createStudio(params: CreateStudioParams): Promise<Studio> {
  const supabase = getSupabaseClient();

  const { data: studio, error: studioError } = await (supabase.from('studios') as any)
    .insert({
      name: params.name,
      slug: params.slug,
      owner_id: params.ownerId,
      bio: params.bio || null,
      logo_url: params.logoUrl || null,
      banner_url: params.bannerUrl || null,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (studioError) {
    throw new Error(`Failed to create studio: ${studioError.message}`);
  }

  // Automatically register owner in studio_members
  await (supabase.from('studio_members') as any).insert({
    studio_id: studio.id,
    user_id: params.ownerId,
    role: StudioRole.OWNER,
    joined_at: new Date().toISOString(),
  });

  return studio as Studio;
}

export interface InviteStudioMemberParams {
  studioId: string;
  userId: string;
  role: StudioRole;
}

/**
 * Adds or invites a creator into the studio team.
 */
export async function inviteStudioMember(params: InviteStudioMemberParams): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await (supabase.from('studio_members') as any).insert({
    studio_id: params.studioId,
    user_id: params.userId,
    role: params.role,
    joined_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to invite studio member: ${error.message}`);
  }
}

/**
 * Moves a Kanban task across columns (TODO -> IN_PROGRESS -> REVIEW -> DONE).
 */
export async function updateTaskStatus(taskId: string, status: ChapterTaskStatus): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await (supabase.from('chapter_tasks') as any)
    .update({ status })
    .eq('id', taskId);

  if (error) {
    throw new Error(`Failed to update task status: ${error.message}`);
  }
}

export interface CreateChapterVersionParams {
  chapterId: string;
  version: number;
  stage: ChapterTaskStage;
  fileUrl: string;
  notes?: string;
  createdBy?: string;
}

/**
 * Archives a non-destructive artwork or script revision in version history.
 */
export async function createChapterVersion(params: CreateChapterVersionParams): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await (supabase.from('chapter_versions') as any).insert({
    chapter_id: params.chapterId,
    version: params.version,
    stage: params.stage,
    file_url: params.fileUrl,
    notes: params.notes || null,
    created_by: params.createdBy || null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to create chapter version: ${error.message}`);
  }
}

export interface SetSeriesRevenueSplitsParams {
  seriesId: string;
  splits: {
    memberId: string;
    percentage: number;
    role: string;
  }[];
}

/**
 * Updates series revenue sharing. Enforces 100.00% validation check.
 */
export async function setSeriesRevenueSplits(params: SetSeriesRevenueSplitsParams): Promise<void> {
  // 1. Enforce 100% total rule before touching the database
  const validation = validateRevenueSplits(params.splits);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Revenue splits must total exactly 100.00%.');
  }

  const supabase = getSupabaseClient();

  // 2. Remove existing splits for series
  await supabase.from('series_revenue_splits').delete().eq('series_id', params.seriesId);

  // 3. Insert validated splits
  const rows = params.splits.map((s) => ({
    series_id: params.seriesId,
    member_id: s.memberId,
    percentage: s.percentage,
    role: s.role,
    created_at: new Date().toISOString(),
  }));

  const { error } = await (supabase.from('series_revenue_splits') as any).insert(rows);

  if (error) {
    throw new Error(`Failed to save revenue splits: ${error.message}`);
  }
}

/**
 * Digitally signs a studio collaboration agreement.
 */
export async function signContract(contractId: string, memberId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await (supabase.from('contracts') as any)
    .update({
      status: ContractStatus.SIGNED,
      signed_at: new Date().toISOString(),
    })
    .eq('id', contractId)
    .eq('member_id', memberId);

  if (error) {
    throw new Error(`Failed to sign contract: ${error.message}`);
  }
}
