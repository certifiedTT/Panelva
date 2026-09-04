import { getSupabaseClient } from '../client';
import {
  ReportTargetType,
  ReportReason,
  ReportStatus,
  ModerationAction,
  TicketCategory,
  TicketStatus,
} from '@panelva/database';

export interface SubmitReportParams {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
}

/**
 * Submits an item to the Trust & Safety report queue.
 */
export async function submitUserReport(params: SubmitReportParams): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await (supabase.from('reports') as any).insert({
    reporter_id: params.reporterId,
    target_type: params.targetType,
    target_id: params.targetId,
    reason: params.reason,
    status: ReportStatus.PENDING,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to submit report: ${error.message}`);
  }
}

export interface ResolveReportParams {
  reportId: string;
  action: ModerationAction;
  notes?: string;
  resolvedBy: string;
}

/**
 * Resolves a moderation queue report and executes moderation action.
 */
export async function resolveModerationReport(params: ResolveReportParams): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await (supabase.from('reports') as any)
    .update({
      status: ReportStatus.RESOLVED,
      resolution_action: params.action,
      resolution_notes: params.notes || null,
      resolved_by: params.resolvedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.reportId);

  if (error) {
    throw new Error(`Failed to resolve report: ${error.message}`);
  }
}

export interface CreateSupportTicketParams {
  userId: string;
  category: TicketCategory;
  subject: string;
  message: string;
}

/**
 * Submits a new customer support ticket.
 */
export async function createSupportTicket(params: CreateSupportTicketParams): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await (supabase.from('support_tickets') as any).insert({
    user_id: params.userId,
    category: params.category,
    subject: params.subject,
    message: params.message,
    status: TicketStatus.OPEN,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to create support ticket: ${error.message}`);
  }
}

export interface FileCopyrightClaimParams {
  claimantId: string;
  workTitle: string;
  description: string;
  evidenceUrls: string[];
  claimedSeriesId?: string;
  claimedChapterId?: string;
}

/**
 * Submits an intellectual property copyright claim.
 */
export async function fileCopyrightClaim(params: FileCopyrightClaimParams): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await (supabase.from('copyright_claims') as any).insert({
    claimant_id: params.claimantId,
    work_title: params.workTitle,
    description: params.description,
    evidence_urls: params.evidenceUrls,
    claimed_series_id: params.claimedSeriesId || null,
    claimed_chapter_id: params.claimedChapterId || null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to file copyright claim: ${error.message}`);
  }
}

export interface RecordAuditLogParams {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}

/**
 * Appends an immutable audit log entry via stored procedure.
 */
export async function recordAuditLog(params: RecordAuditLogParams): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await (supabase as any).rpc('log_admin_action', {
    p_actor_id: params.actorId,
    p_action: params.action,
    p_target_type: params.targetType,
    p_target_id: params.targetId || null,
    p_details: params.details || {},
    p_ip: params.ip || null,
  });

  if (error) {
    console.error('Failed to write audit log:', error);
  }
}
