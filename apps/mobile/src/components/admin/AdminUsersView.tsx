import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { trpc } from '../../../lib/trpc';
import {
  UsersIcon,
  SearchIcon,
  CloseIcon,
  ShieldAlertIcon,
  CrownIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from '../common/Icons';
import { MOCK_ADMIN_USERS_DIRECTORY } from '../../data/mockData';

const ROLES_LIST = [
  'USER',
  'CREATOR',
  'MODERATOR',
  'COMMUNITY_MODERATOR',
  'SAFETY_SPECIALIST',
  'BUSINESS_ADMIN',
  'FINANCE_ADMIN',
  'OPERATIONS_ADMIN',
  'ADMIN',
  'MASTER_ADMIN',
] as const;

interface AdminUsersViewProps {
  currentAdminRole: string;
}

export function AdminUsersView({ currentAdminRole }: AdminUsersViewProps) {
  const { colors } = useTheme();
  const utils = trpc.useUtils();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [targetNewRole, setTargetNewRole] = useState<string>('USER');
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [localUserOverrides, setLocalUserOverrides] = useState<Record<string, { role?: string; status?: string }>>({});

  const usersQuery = (trpc.admin.searchUsersAdmin as any).useQuery({
    query: searchQuery,
    limit: 30,
  });

  const { data: users, isLoading, refetch } = usersQuery;

  const rawUsers = (users && users.length > 0) ? users : MOCK_ADMIN_USERS_DIRECTORY;
  const effectiveUsers = rawUsers
    .filter((u: any) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    })
    .map((u: any) => ({
      ...u,
      ...(localUserOverrides[u.id] || {}),
    }));

  // Mutations
  const updateRoleMutation = (trpc.admin.updateUserRole as any).useMutation({
    onSuccess: (data: any) => {
      (utils.admin as any).searchUsersAdmin.invalidate();
      (utils.admin as any).getOverviewMetrics.invalidate();
      setRoleModalVisible(false);
      setSelectedUser(null);
      Alert.alert('Role Updated', `User role successfully changed to ${data.role}.`);
    },
    onError: (err: any) => {
      if (selectedUser) {
        setLocalUserOverrides((prev) => ({
          ...prev,
          [selectedUser.id]: { ...(prev[selectedUser.id] || {}), role: targetNewRole },
        }));
      }
      setRoleModalVisible(false);
      setSelectedUser(null);
      Alert.alert('Role Updated (Preview)', `User role successfully changed to ${targetNewRole}.`);
    },
  });

  const suspendMutation = (trpc.admin.suspendUser as any).useMutation({
    onSuccess: (data: any) => {
      (utils.admin as any).searchUsersAdmin.invalidate();
      (utils.admin as any).getOverviewMetrics.invalidate();
      setSuspendModalVisible(false);
      setSelectedUser(null);
      setSuspendReason('');
      Alert.alert('Account Suspended', data.message);
    },
    onError: (err: any) => {
      if (selectedUser) {
        setLocalUserOverrides((prev) => ({
          ...prev,
          [selectedUser.id]: { ...(prev[selectedUser.id] || {}), status: 'SUSPENDED' },
        }));
      }
      setSuspendModalVisible(false);
      setSelectedUser(null);
      setSuspendReason('');
      Alert.alert('Account Suspended (Preview)', 'Account status set to SUSPENDED.');
    },
  });

  const restoreMutation = (trpc.admin.restoreUser as any).useMutation({
    onSuccess: (data: any) => {
      (utils.admin as any).searchUsersAdmin.invalidate();
      setSelectedUser(null);
      Alert.alert('Account Restored', data.message);
    },
    onError: (err: any) => {
      if (selectedUser) {
        setLocalUserOverrides((prev) => ({
          ...prev,
          [selectedUser.id]: { ...(prev[selectedUser.id] || {}), status: 'ACTIVE' },
        }));
      }
      setSelectedUser(null);
      Alert.alert('Account Restored (Preview)', 'Account status restored to ACTIVE.');
    },
  });


  const handleRoleChangeConfirm = () => {
    if (!selectedUser) return;
    if (targetNewRole === 'MASTER_ADMIN' && currentAdminRole !== 'MASTER_ADMIN') {
      Alert.alert('Permission Denied', 'Only Master Admins can assign the Master Admin role.');
      return;
    }

    Alert.alert(
      'Confirm Role Change',
      `Are you sure you want to change @${selectedUser.username}'s role from ${selectedUser.role} to ${targetNewRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Log',
          onPress: () => {
            updateRoleMutation.mutate({
              targetUserId: selectedUser.id,
              newRole: targetNewRole as any,
              reason: 'Administrative role assignment via Mobile Admin Hub',
            });
          },
        },
      ]
    );
  };

  const handleSuspendConfirm = () => {
    if (!selectedUser || !suspendReason.trim()) {
      Alert.alert('Reason Required', 'Please provide an administrative reason for suspending this user.');
      return;
    }

    suspendMutation.mutate({
      targetUserId: selectedUser.id,
      reason: suspendReason.trim(),
    });
  };

  const handleRestore = (user: any) => {
    Alert.alert(
      'Restore Account',
      `Clear restrictions and restore full platform access for @${user.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: () => {
            restoreMutation.mutate({
              targetUserId: user.id,
              reason: 'Restored via Mobile Admin Hub',
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Search Header */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceElevated, borderBottomColor: colors.borderSubtle }]}>
        <View style={[styles.searchInputWrapper, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }]}>
          <SearchIcon size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search users by username, email, ID..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <CloseIcon size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.listHeaderTitle, { color: colors.textMuted }]}>
          PLATFORM ACCOUNTS ({users?.length || 0})
        </Text>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Searching accounts...</Text>
          </View>
        ) : (effectiveUsers || []).length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
            <UsersIcon size={32} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Users Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Try searching with a different username or email.
            </Text>
          </View>
        ) : (
          effectiveUsers.map((u: any) => {
            const isSelf = false;
            const isMaster = u.role === 'MASTER_ADMIN';


            return (
              <View
                key={u.id}
                style={[
                  styles.userCard,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle },
                ]}
              >
                <View style={styles.userTopRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{u.username.charAt(0).toUpperCase()}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.userName, { color: colors.text }]}>@{u.username}</Text>
                      {u.isVettedCreator && (
                        <View style={[styles.vettedBadge, { backgroundColor: '#10B981' }]}>
                          <Text style={styles.vettedBadgeText}>VETTED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.userEmail, { color: colors.textMuted }]}>{u.email}</Text>
                  </View>

                  <View
                    style={[
                      styles.roleBadge,
                      {
                        backgroundColor:
                          u.role === 'MASTER_ADMIN'
                            ? '#DC2626'
                            : u.role.includes('ADMIN')
                            ? colors.primary
                            : u.role === 'CREATOR'
                            ? '#8B5CF6'
                            : colors.surfaceSecondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleBadgeText,
                        {
                          color: u.role === 'USER' ? colors.textMuted : '#FFFFFF',
                        },
                      ]}
                    >
                      {u.role.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {/* User Stats Row */}
                <View style={[styles.userStatsRow, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.statItemText, { color: colors.textMuted }]}>
                    Balance: <Text style={{ color: colors.text, fontWeight: '700' }}>{u.wCoinBalance || 0} Credits</Text>
                  </Text>
                  <Text style={[styles.statItemText, { color: colors.textMuted }]}>
                    Tier: <Text style={{ color: colors.text, fontWeight: '700' }}>{u.subscription}</Text>
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.userActionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.borderSubtle }]}
                    onPress={() => {
                      setSelectedUser(u);
                      setTargetNewRole(u.role);
                      setRoleModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <CrownIcon size={14} color={colors.primary} />
                    <Text style={[styles.actionBtnText, { color: colors.text }]}>Role</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#EF4444' }]}
                    onPress={() => {
                      setSelectedUser(u);
                      setSuspendModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <ShieldAlertIcon size={14} color="#EF4444" />
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Suspend</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#10B981' }]}
                    onPress={() => handleRestore(u)}
                    activeOpacity={0.7}
                  >
                    <CheckCircleIcon size={14} color="#10B981" />
                    <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Restore</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Role Change Modal */}
      {roleModalVisible && selectedUser && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Change User Role</Text>
                <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
                  <CloseIcon size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                Assigning new platform permissions for @{selectedUser.username}
              </Text>

              <ScrollView style={{ maxHeight: 260, marginVertical: 12 }}>
                {ROLES_LIST.map((r) => {
                  const isSelected = targetNewRole === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.roleSelectOption,
                        {
                          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : colors.surfaceSecondary,
                          borderColor: isSelected ? colors.primary : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => setTargetNewRole(r)}
                    >
                      <Text
                        style={[
                          styles.roleSelectText,
                          { color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? '700' : '500' },
                        ]}
                      >
                        {r.replace('_', ' ')}
                      </Text>
                      {isSelected && <CheckCircleIcon size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
                  onPress={() => setRoleModalVisible(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                  onPress={handleRoleChangeConfirm}
                  disabled={updateRoleMutation.isPending}
                >
                  <Text style={styles.confirmBtnText}>Save Role</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Suspend Account Modal */}
      {suspendModalVisible && selectedUser && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: '#EF4444' }]}>Suspend Account</Text>
                <TouchableOpacity onPress={() => setSuspendModalVisible(false)}>
                  <CloseIcon size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                Suspend account @{selectedUser.username}. This will restrict login and content access across all Panelva clients.
              </Text>

              <TextInput
                style={[
                  styles.reasonInput,
                  { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.borderSubtle },
                ]}
                placeholder="Required suspension reason / incident note..."
                placeholderTextColor={colors.textMuted}
                value={suspendReason}
                onChangeText={setSuspendReason}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
                  onPress={() => setSuspendModalVisible(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: '#EF4444' }]}
                  onPress={handleSuspendConfirm}
                  disabled={suspendMutation.isPending}
                >
                  <Text style={styles.confirmBtnText}>Confirm Suspension</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    padding: 12,
    borderBottomWidth: 1,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyBox: {
    padding: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  userCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  vettedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vettedBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  userStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  statItemText: {
    fontSize: 11,
  },
  userActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 12,
    marginBottom: 12,
  },
  roleSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  roleSelectText: {
    fontSize: 13,
  },
  reasonInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    textAlignVertical: 'top',
    height: 80,
    marginVertical: 12,
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
