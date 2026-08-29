import { describe, it, expect } from 'vitest';
import {
  getEarlyAccessSchedule,
  checkEarlyAccessPermission,
  formatEarlyAccessDuration,
} from './earlyAccess';

describe('Early Access System', () => {
  const publishTime = new Date('2026-08-20T12:00:00Z');

  describe('getEarlyAccessSchedule', () => {
    it('calculates exact +2h and +4h access timestamps', () => {
      const schedule = getEarlyAccessSchedule(publishTime, new Date('2026-08-20T12:00:00Z'));
      
      expect(schedule.premiumAccessAt.toISOString()).toBe('2026-08-20T12:00:00.000Z');
      expect(schedule.plusAccessAt.toISOString()).toBe('2026-08-20T14:00:00.000Z');
      expect(schedule.freeAccessAt.toISOString()).toBe('2026-08-20T16:00:00.000Z');
      expect(schedule.isEarlyAccessActive).toBe(true);
      expect(schedule.isPlusAvailable).toBe(false);
      expect(schedule.isFreeAvailable).toBe(false);
    });

    it('identifies when Plus becomes available (+2h)', () => {
      const atPlusTime = new Date('2026-08-20T14:00:00Z');
      const schedule = getEarlyAccessSchedule(publishTime, atPlusTime);
      
      expect(schedule.isEarlyAccessActive).toBe(true);
      expect(schedule.isPlusAvailable).toBe(true);
      expect(schedule.isFreeAvailable).toBe(false);
      expect(schedule.timeUntilPlusMs).toBe(0);
      expect(schedule.timeUntilFreeMs).toBe(2 * 60 * 60 * 1000);
    });

    it('identifies when Free becomes available (+4h) and early access expires', () => {
      const atFreeTime = new Date('2026-08-20T16:00:01Z');
      const schedule = getEarlyAccessSchedule(publishTime, atFreeTime);
      
      expect(schedule.isEarlyAccessActive).toBe(false);
      expect(schedule.isPlusAvailable).toBe(true);
      expect(schedule.isFreeAvailable).toBe(true);
      expect(schedule.timeUntilPlusMs).toBe(0);
      expect(schedule.timeUntilFreeMs).toBe(0);
    });
  });

  describe('checkEarlyAccessPermission', () => {
    // T = 12:00 PM (Publication)
    const t0 = new Date('2026-08-20T12:00:00Z');
    // T = 1:00 PM (Within 0h-2h)
    const t1 = new Date('2026-08-20T13:00:00Z');
    // T = 2:30 PM (Within 2h-4h)
    const t2 = new Date('2026-08-20T14:30:00Z');
    // T = 4:30 PM (Past 4h)
    const t4 = new Date('2026-08-20T16:30:00Z');

    it('Premium subscribers always have immediate access at any time', () => {
      expect(checkEarlyAccessPermission(publishTime, 'PREMIUM', 'USER', false, t0).hasAccess).toBe(true);
      expect(checkEarlyAccessPermission(publishTime, 'PREMIUM', 'USER', false, t1).hasAccess).toBe(true);
      expect(checkEarlyAccessPermission(publishTime, 'PREMIUM', 'USER', false, t2).hasAccess).toBe(true);
      expect(checkEarlyAccessPermission(publishTime, 'PREMIUM', 'USER', false, t4).hasAccess).toBe(true);
    });

    it('Plus subscribers are blocked before 2 hours, and allowed after 2 hours', () => {
      // At T+1h -> Blocked
      const checkT1 = checkEarlyAccessPermission(publishTime, 'PLUS', 'USER', false, t1);
      expect(checkT1.hasAccess).toBe(false);
      expect(checkT1.requiredTier).toBe('PREMIUM');

      // At T+2.5h -> Allowed
      const checkT2 = checkEarlyAccessPermission(publishTime, 'PLUS', 'USER', false, t2);
      expect(checkT2.hasAccess).toBe(true);
      expect(checkT2.reason).toBe('PLUS_TIER');
    });

    it('Free readers are blocked before 4 hours, and allowed after 4 hours', () => {
      // At T+1h -> Blocked, can upgrade to Premium
      const checkT1 = checkEarlyAccessPermission(publishTime, 'NONE', 'USER', false, t1);
      expect(checkT1.hasAccess).toBe(false);
      expect(checkT1.requiredTier).toBe('PREMIUM');

      // At T+2.5h -> Blocked, can upgrade to Plus
      const checkT2 = checkEarlyAccessPermission(publishTime, 'NONE', 'USER', false, t2);
      expect(checkT2.hasAccess).toBe(false);
      expect(checkT2.requiredTier).toBe('PLUS');

      // At T+4.5h -> Allowed! (Early access window ended)
      const checkT4 = checkEarlyAccessPermission(publishTime, 'NONE', 'USER', false, t4);
      expect(checkT4.hasAccess).toBe(true);
      expect(checkT4.isEarlyAccessActive).toBe(false);
      expect(checkT4.reason).toBe('EARLY_ACCESS_EXPIRED');
    });

    it('Admins and Creators always bypass early access', () => {
      expect(checkEarlyAccessPermission(publishTime, 'NONE', 'ADMIN', false, t0).hasAccess).toBe(true);
      expect(checkEarlyAccessPermission(publishTime, 'NONE', 'MASTER_ADMIN', false, t0).hasAccess).toBe(true);
      expect(checkEarlyAccessPermission(publishTime, 'NONE', 'USER', true, t0).hasAccess).toBe(true);
    });
  });

  describe('formatEarlyAccessDuration', () => {
    it('formats hours and minutes accurately', () => {
      expect(formatEarlyAccessDuration(92 * 60 * 1000)).toBe('1h 32m');
      expect(formatEarlyAccessDuration(120 * 60 * 1000)).toBe('2h');
      expect(formatEarlyAccessDuration(45 * 60 * 1000)).toBe('45m');
      expect(formatEarlyAccessDuration(0)).toBe('Available now');
      expect(formatEarlyAccessDuration(-5000)).toBe('Available now');
    });
  });
});
