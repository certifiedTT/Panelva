import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldAlert, Shield, Palette, Crown, Sparkles } from 'lucide-react-native';
import { radius, spacing } from '@panelva/theme';

export interface RoleBadgeProps {
  role?: string;
  subscription?: string;
  size?: 'sm' | 'md';
}

export function RoleBadge({ role = 'USER', subscription = 'NONE', size = 'sm' }: RoleBadgeProps) {
  const isMasterAdmin = role === 'MASTER_ADMIN';
  const isAdmin = role === 'ADMIN' || role === 'MODERATOR' || role === 'STAFF';
  const isCreator = role === 'CREATOR' || role === 'VERIFIED_CREATOR';
  const isPremium = subscription === 'PREMIUM';
  const isPlus = subscription === 'PLUS';

  const iconSize = size === 'sm' ? 10 : 12;

  if (isMasterAdmin) {
    return (
      <View style={[styles.badge, styles.badgeMasterAdmin]}>
        <ShieldAlert size={iconSize} color="#ef4444" />
        <Text style={[styles.badgeText, styles.textMasterAdmin]}>Master Admin</Text>
      </View>
    );
  }

  if (isAdmin) {
    return (
      <View style={[styles.badge, styles.badgeAdmin]}>
        <Shield size={iconSize} color="#3b82f6" />
        <Text style={[styles.badgeText, styles.textAdmin]}>Staff</Text>
      </View>
    );
  }

  if (isCreator) {
    return (
      <View style={[styles.badge, styles.badgeCreator]}>
        <Palette size={iconSize} color="#10b981" />
        <Text style={[styles.badgeText, styles.textCreator]}>Creator</Text>
      </View>
    );
  }

  if (isPremium) {
    return (
      <View style={[styles.badge, styles.badgePremium]}>
        <Crown size={iconSize} color="#f59e0b" />
        <Text style={[styles.badgeText, styles.textPremium]}>Premium</Text>
      </View>
    );
  }

  if (isPlus) {
    return (
      <View style={[styles.badge, styles.badgePlus]}>
        <Sparkles size={iconSize} color="#60a5fa" />
        <Text style={[styles.badgeText, styles.textPlus]}>Plus</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badgeMasterAdmin: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  textMasterAdmin: {
    color: '#ef4444',
  },
  badgeAdmin: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  textAdmin: {
    color: '#60a5fa',
  },
  badgeCreator: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  textCreator: {
    color: '#10b981',
  },
  badgePremium: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  textPremium: {
    color: '#f59e0b',
  },
  badgePlus: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderColor: 'rgba(37, 99, 235, 0.35)',
  },
  textPlus: {
    color: '#60a5fa',
  },
});
