import { getSupabaseClient } from '../client';
import {
  Report,
  AuditLog,
  SupportTicket,
  CopyrightClaim,
  SystemMetric,
} from '@panelva/database';

export const enterpriseQueryKeys = {
  all: ['enterprise'] as const,
  reports: (status?: string) => [...enterpriseQueryKeys.all, 'reports', status] as const,
  auditLogs: () => [...enterpriseQueryKeys.all, 'auditLogs'] as const,
  supportTickets: (category?: string, status?: string) => [
    ...enterpriseQueryKeys.all,
    'supportTickets',
    category,
    status,
  ] as const,
  copyrightClaims: (status?: string) => [...enterpriseQueryKeys.all, 'copyrightClaims', status] as const,
  systemMetrics: () => [...enterpriseQueryKeys.all, 'systemMetrics'] as const,
};

/**
 * Fetches moderation report queue sorted by priority score (high to low).
 */
export async function fetchModerationReports(status?: string, limit = 50): Promise<Report[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('reports').select('*');

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch moderation queue: ${error.message}`);
  }

  return (data as unknown as Report[]) || [];
}

/**
 * Fetches immutable audit logs (accessible by Master Admin only).
 */
export async function fetchAuditLogs(limit = 100): Promise<AuditLog[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  return (data as unknown as AuditLog[]) || [];
}

/**
 * Fetches customer support tickets.
 */
export async function fetchSupportTickets(
  category?: string,
  status?: string,
  limit = 50
): Promise<SupportTicket[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('support_tickets').select('*');

  if (category) {
    query = query.eq('category', category);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch support tickets: ${error.message}`);
  }

  return (data as unknown as SupportTicket[]) || [];
}

/**
 * Fetches formal copyright claims for IP protection.
 */
export async function fetchCopyrightClaims(status?: string): Promise<CopyrightClaim[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('copyright_claims').select('*');

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch copyright claims: ${error.message}`);
  }

  return (data as unknown as CopyrightClaim[]) || [];
}

/**
 * Fetches platform health & operational latencies.
 */
export async function fetchSystemMetrics(): Promise<SystemMetric[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('system_metrics')
    .select('*')
    .order('recorded_at', { ascending: false });

  if (error) {
    return [];
  }

  return (data as unknown as SystemMetric[]) || [];
}
