import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { trpc } from '../../../lib/trpc';
import {
  CreditsIcon,
  CloseIcon,
  CreditCardIcon,
  SparklesIcon,
  HistoryIcon,
  CheckIcon,
} from '../common/Icons';

interface CreditWalletModalProps {
  visible: boolean;
  onClose: () => void;
  sessionToken: string | null;
  wCoinBalance?: number;
  creditBalance?: number;
  creditsBalance?: number;
  onRequireAuth: () => void;
  onSuccessRecharge?: () => void;
}

const CREDIT_PACKAGES = [
  { id: 'p1', credits: 100, priceUsd: 0.99, bonusCredits: 0, tag: null },
  { id: 'p2', credits: 550, priceUsd: 4.99, bonusCredits: 50, tag: 'POPULAR' },
  { id: 'p3', credits: 1200, priceUsd: 9.99, bonusCredits: 200, tag: 'BEST VALUE' },
  { id: 'p4', credits: 3200, priceUsd: 24.99, bonusCredits: 700, tag: 'MEGA PACK' },
];

export function CreditWalletModal({
  visible,
  onClose,
  sessionToken,
  wCoinBalance = 0,
  creditBalance,
  creditsBalance,
  onRequireAuth,
  onSuccessRecharge,
}: CreditWalletModalProps) {
  const effectiveBalance = creditBalance !== undefined ? creditBalance : creditsBalance !== undefined ? creditsBalance : wCoinBalance;
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'buy' | 'history' | 'promo'>('buy');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('p2');

  const selectedPackage = CREDIT_PACKAGES.find(p => p.id === selectedPackageId) || CREDIT_PACKAGES[1];

  // Transaction history query
  const { data: transactionHistory, isLoading: historyLoading, refetch: refetchHistory } =
    (trpc.user.getTransactionHistory as any).useQuery(undefined, {
      enabled: visible && !!sessionToken && activeTab === 'history',
    });

  // Recharge mutation
  const rechargeMutation = trpc.user.rechargeCoins.useMutation({
    onSuccess: (data) => {
      Alert.alert('Credits Added!', `Successfully recharged ${selectedPackage.credits} Credits to your wallet.`);
      if (onSuccessRecharge) onSuccessRecharge();
      refetchHistory();
    },
    onError: (err) => {
      Alert.alert('Recharge Failed', err.message);
    },
  });

  // Promo code mutation
  const redeemPromoMutation = trpc.user.redeemPromoCode.useMutation({
    onSuccess: (data) => {
      Alert.alert('Promo Code Redeemed', data.message || 'Promo reward activated successfully.');
      setPromoCodeInput('');
      if (onSuccessRecharge) onSuccessRecharge();
      refetchHistory();
    },
    onError: (err) => {
      Alert.alert('Redemption Error', err.message);
    },
  });

  const handleBuyCredits = () => {
    if (!sessionToken) {
      onClose();
      onRequireAuth();
      return;
    }

    rechargeMutation.mutate({
      amountCoins: selectedPackage.credits,
      amountUsd: selectedPackage.priceUsd,
    });
  };

  const handleRedeemPromo = () => {
    if (!sessionToken) {
      onClose();
      onRequireAuth();
      return;
    }
    if (!promoCodeInput.trim()) {
      Alert.alert('Enter Code', 'Please enter a valid promotional code.');
      return;
    }
    redeemPromoMutation.mutate({ code: promoCodeInput.trim() });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.walletIconCircle, { backgroundColor: colors.primaryMuted }]}>
                <CreditsIcon size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Credit Wallet</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Manage and purchase credits for premium unlocks
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close Wallet">
              <CloseIcon size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Current Balance Card */}
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
            <View style={[styles.balanceCard, { backgroundColor: colors.primary, borderColor: colors.primaryDark }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.balanceLabel}>AVAILABLE CREDIT BALANCE</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                  <Text style={styles.balanceNumber}>
                    {sessionToken ? effectiveBalance.toLocaleString() : '0'}
                  </Text>
                  <Text style={styles.balanceUnit}>Credits</Text>
                </View>
              </View>
              <View style={styles.balanceCardIcon}>
                <SparklesIcon size={26} color="rgba(255,255,255,0.85)" />
              </View>
            </View>
          </View>

          {/* Sub-tabs */}
          <View style={[styles.tabBar, { borderBottomColor: colors.borderSubtle }]}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'buy' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('buy')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'buy' ? colors.primary : colors.textMuted }]}>
                Buy Credits
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'promo' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('promo')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'promo' ? colors.primary : colors.textMuted }]}>
                Promo Code
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'history' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('history')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'history' ? colors.primary : colors.textMuted }]}>
                Credit History
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {activeTab === 'buy' && (
              <View style={{ gap: 12 }}>
                <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Select a Credit Package</Text>
                {CREDIT_PACKAGES.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[
                        styles.packageCard,
                        {
                          backgroundColor: isSelected ? colors.primaryMuted : colors.surfaceElevated,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedPackageId(pkg.id)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <View style={[styles.pkgRadio, { borderColor: isSelected ? colors.primary : colors.textSubtle }]}>
                          {isSelected && <View style={[styles.pkgRadioInner, { backgroundColor: colors.primary }]} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.pkgCredits, { color: colors.text }]}>
                              {pkg.credits.toLocaleString()} Credits
                            </Text>
                            {pkg.tag && (
                              <View style={[styles.pkgTagBadge, { backgroundColor: pkg.tag === 'POPULAR' ? colors.accentGold : colors.primary }]}>
                                <Text style={styles.pkgTagText}>{pkg.tag}</Text>
                              </View>
                            )}
                          </View>
                          {pkg.bonusCredits > 0 ? (
                            <Text style={[styles.pkgBonusText, { color: colors.success }]}>
                              Includes +{pkg.bonusCredits} bonus credits
                            </Text>
                          ) : (
                            <Text style={[styles.pkgStandardText, { color: colors.textMuted }]}>Standard bundle</Text>
                          )}
                        </View>
                      </View>
                      <Text style={[styles.pkgPrice, { color: isSelected ? colors.primary : colors.text }]}>
                        ${pkg.priceUsd.toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={handleBuyCredits}
                  disabled={rechargeMutation.isLoading}
                  activeOpacity={0.8}
                >
                  {rechargeMutation.isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionBtnText}>
                      Purchase {selectedPackage.credits.toLocaleString()} Credits for ${selectedPackage.priceUsd.toFixed(2)}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'promo' && (
              <View style={{ gap: 14 }}>
                <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Redeem a Code</Text>
                <Text style={[styles.promoDescription, { color: colors.textMuted }]}>
                  Have a promotional code or creator gift code? Enter it below to add credits or unlock perks.
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. PANELVA-PROMO-2026"
                  placeholderTextColor={colors.textMuted}
                  value={promoCodeInput}
                  onChangeText={setPromoCodeInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={handleRedeemPromo}
                  disabled={redeemPromoMutation.isLoading}
                  activeOpacity={0.8}
                >
                  {redeemPromoMutation.isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionBtnText}>Redeem Code</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'history' && (
              <View style={{ gap: 10 }}>
                <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Recent Credit Transactions</Text>
                {historyLoading ? (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                ) : !sessionToken ? (
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    Sign in to view your credit history.
                  </Text>
                ) : transactionHistory && transactionHistory.length > 0 ? (
                  transactionHistory.map((item: any) => (
                    <View
                      key={item.id}
                      style={[styles.historyRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.historyDesc, { color: colors.text }]}>
                          {item.description || item.type}
                        </Text>
                        <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.historyAmount,
                          {
                            color: item.type === 'RECHARGE' || item.type === 'GIFT_RECEIVED'
                              ? colors.success
                              : colors.textMuted,
                          },
                        ]}
                      >
                        {item.type === 'RECHARGE' || item.type === 'GIFT_RECEIVED' ? '+' : '-'}
                        {item.amount} Credits
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No credit transactions yet.
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  walletIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  balanceCard: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  balanceNumber: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  balanceUnit: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    borderBottomWidth: 1,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  pkgRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkgRadioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  pkgCredits: {
    fontSize: 14,
    fontWeight: '700',
  },
  pkgTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pkgTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  pkgBonusText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  pkgStandardText: {
    fontSize: 11,
    marginTop: 2,
  },
  pkgPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  promoDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  historyDesc: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 11,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 13,
  },
});
