import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import {
  CloseIcon,
  CrownIcon,
  ShieldAlertIcon,
  CreatorHubIcon,
  UsersIcon,
  DollarSignIcon,
  ActivityIcon,
  AlertsIcon,
  HomeIcon,
} from '../common/Icons';

import { AdminOverviewView } from './AdminOverviewView';
import { AdminModerationView } from './AdminModerationView';
import { AdminCreatorsView } from './AdminCreatorsView';
import { AdminUsersView } from './AdminUsersView';
import { AdminFinanceView } from './AdminFinanceView';
import { AdminAuditLogsView } from './AdminAuditLogsView';
import { AdminNotificationsView } from './AdminNotificationsView';
import {
  getVisibleAdminTabs,
  getRoleBadgeColor,
  getRoleDisplayName,
} from '../../data/mockRoles';
import { MobileWorkspaceLayout, MobileWorkspaceNavGroup } from '../workspace/WorkspaceLayout';

interface AdminHubModalProps {
  visible: boolean;
  onClose: () => void;
  dbUser: any;
}

export function AdminHubModal({ visible, onClose, dbUser }: AdminHubModalProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('overview');

  const userRole = dbUser?.role || 'USER';
  const roleLabel = getRoleDisplayName(userRole);
  const allowedTabs = getVisibleAdminTabs(userRole);

  const adminNavGroups: MobileWorkspaceNavGroup[] = [
    {
      id: 'overview',
      label: 'Overview',
      items: [
        {
          id: 'overview',
          label: 'Operations Overview',
          icon: ({ size, color }) => <HomeIcon size={size} color={color} />,
          authorized: allowedTabs.includes('overview' as any),
        },
      ],
    },
    {
      id: 'management',
      label: 'Management',
      items: [
        {
          id: 'users',
          label: 'User Directory',
          icon: ({ size, color }) => <UsersIcon size={size} color={color} />,
          authorized: allowedTabs.includes('users' as any),
        },
        {
          id: 'creators',
          label: 'Creator Directory',
          icon: ({ size, color }) => <CreatorHubIcon size={size} color={color} />,
          authorized: allowedTabs.includes('creators' as any),
        },
        {
          id: 'moderation',
          label: 'Moderation & Safety',
          icon: ({ size, color }) => <ShieldAlertIcon size={size} color={color} />,
          authorized: allowedTabs.includes('moderation' as any),
        },
      ],
    },
    {
      id: 'finance',
      label: 'Finance',
      items: [
        {
          id: 'finance',
          label: 'Platform Finance & Payouts',
          icon: ({ size, color }) => <DollarSignIcon size={size} color={color} />,
          authorized: allowedTabs.includes('finance' as any),
        },
      ],
    },
    {
      id: 'system',
      label: 'System & Governance',
      items: [
        {
          id: 'audit',
          label: 'Audit Logs',
          icon: ({ size, color }) => <ActivityIcon size={size} color={color} />,
          authorized: allowedTabs.includes('audit' as any),
        },
        {
          id: 'notifications',
          label: 'Alerts & System Logs',
          icon: ({ size, color }) => <AlertsIcon size={size} color={color} />,
          authorized: allowedTabs.includes('notifications' as any),
        },
      ],
    },
  ];

  // If active tab is not visible for current role, default to first visible tab or overview
  const effectiveActiveTab = allowedTabs.includes(activeTab as any) ? activeTab : (allowedTabs[0] || 'overview');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <MobileWorkspaceLayout
        type="admin"
        title="Admin Console"
        contextSubtitle={effectiveActiveTab.toUpperCase()}
        user={{
          username: dbUser?.username || 'Admin',
          role: userRole,
        }}
        roleBadge={roleLabel}
        groups={adminNavGroups}
        activeTab={effectiveActiveTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        onClose={onClose}
      >
        {/* Active Operational View */}
        <View style={styles.mainContent}>
          {effectiveActiveTab === 'overview' && (
            <AdminOverviewView onNavigateTab={(tab) => setActiveTab(tab)} userRole={userRole} />
          )}
          {effectiveActiveTab === 'moderation' && <AdminModerationView />}
          {effectiveActiveTab === 'creators' && <AdminCreatorsView />}
          {effectiveActiveTab === 'users' && <AdminUsersView currentAdminRole={userRole} />}
          {effectiveActiveTab === 'finance' && <AdminFinanceView />}
          {effectiveActiveTab === 'audit' && <AdminAuditLogsView />}
          {effectiveActiveTab === 'notifications' && <AdminNotificationsView />}
        </View>
      </MobileWorkspaceLayout>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
  },
});
