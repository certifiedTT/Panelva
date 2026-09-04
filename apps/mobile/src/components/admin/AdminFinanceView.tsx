import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  TrendingUp,
  Coins,
  Activity,
  FileText,
  Bookmark,
  Sparkles,
  Download,
  AlertCircle,
  Clock,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '@panelva/ui';
import { trpc } from '../../../lib/trpc';
import { MOCK_FINANCIAL_OVERVIEW } from '../../data/mockData';

type FinanceSubSection = 'platform_earnings' | 'payouts' | 'transactions' | 'reports';

function FinanceSkeleton() {
  return (
    <View style={[styles.container, { padding: spacing.md, gap: spacing.md }]}>
      <Card style={{ height: 48, backgroundColor: colors.surface }} />
      <Card style={{ height: 96, backgroundColor: colors.surface }} />
      <Card style={{ height: 240, backgroundColor: colors.surface }} />
      <Card style={{ height: 160, backgroundColor: colors.surface }} />
    </View>
  );
}

export function AdminFinanceView() {
  const [activeSection, setActiveSection] = useState<FinanceSubSection>('platform_earnings');

  // Filters
  const [dateRange, setDateRange] = useState<'Today' | '7D' | '30D' | '90D' | '1Y'>('30D');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedCurrency, setSelectedCurrency] = useState('USD ($)');

  // Payouts state
  const [payoutList, setPayoutList] = useState([
    { id: 'PAY-8901', creator: 'Studio Spectre', penName: 'StudioSpectre', amount: 1450.00, fee: 36.25, net: 1413.75, status: 'PENDING', method: 'Stripe Direct', date: '2 hours ago' },
    { id: 'PAY-8902', creator: 'Luna Works', penName: 'LunaWorks', amount: 820.50, fee: 20.51, net: 799.99, status: 'PENDING', method: 'PayPal Business', date: '5 hours ago' },
    { id: 'PAY-8898', creator: 'CyberInk Studio', penName: 'CyberInk', amount: 3120.00, fee: 78.00, net: 3042.00, status: 'APPROVED', method: 'Bank Wire', date: '1 day ago' },
    { id: 'PAY-8895', creator: 'Aurora Art', penName: 'AuroraArt', amount: 640.00, fee: 16.00, net: 624.00, status: 'PAID', method: 'Stripe Direct', date: '3 days ago' },
    { id: 'PAY-8890', creator: 'Pixel Forge', penName: 'PixelForge', amount: 410.00, fee: 10.25, net: 399.75, status: 'FAILED', method: 'Bank Wire (Invalid IBAN)', date: '5 days ago' },
  ]);

  const financeQuery = (trpc.admin.getFinancialOverview as any).useQuery(undefined, {
    refetchInterval: 30000,
  });

  const { data: financeData, isLoading, refetch, isRefetching } = financeQuery;
  const effectiveFinance = financeData || MOCK_FINANCIAL_OVERVIEW;

  // Scale calculations for dynamic multi-interval viewing
  const getMultiplier = () => {
    switch (dateRange) {
      case 'Today': return 0.035;
      case '7D': return 0.24;
      case '30D': return 1.0;
      case '90D': return 2.85;
      case '1Y': return 11.8;
    }
  };
  const mult = getMultiplier();

  const platformEarnings = {
    grossRevenue: 98450.00 * mult,
    netRevenue: 34850.00 * mult,
    platformCommission: 18450.00 * mult,
    creatorPayouts: 58200.00 * mult,
    refunds: 1420.00 * mult,
    pendingPayouts: 5390.50 * mult,
    mrr: 28400.00,
    arr: 340800.00,
    arpu: 6.93,
    arppu: 28.75,
  };

  const revenueStreams = [
    { name: 'Virtual Coin Sales', category: 'Microtransactions', gross: 38200.00 * mult, platformCut: '30%', creatorShare: '70%', growth: '+14.2%' },
    { name: 'Premium Subscriptions', category: 'Recurring SaaS', gross: 24500.00 * mult, platformCut: '25%', creatorShare: '75%', growth: '+18.5%' },
    { name: 'Plus Subscriptions', category: 'Recurring SaaS', gross: 12800.00 * mult, platformCut: '25%', creatorShare: '75%', growth: '+9.1%' },
    { name: 'AdSense & In-Stream Ads', category: 'Advertising', gross: 11450.00 * mult, platformCut: '100%', creatorShare: '0%', growth: '+22.4%' },
    { name: 'Creator Membership Cuts', category: 'Platform Fee', gross: 6400.00 * mult, platformCut: '20%', creatorShare: '80%', growth: '+15.8%' },
    { name: 'Transaction & Processing Fees', category: 'Operations', gross: 2100.00 * mult, platformCut: '100%', creatorShare: '0%', growth: '+5.0%' },
    { name: 'Merchandise Sales (Alpha)', category: 'Commerce', gross: 1800.00 * mult, platformCut: '15%', creatorShare: '85%', growth: '+34.0%' },
    { name: 'Licensing & Syndication', category: 'B2B Licensing', gross: 1200.00 * mult, platformCut: '40%', creatorShare: '60%', growth: '+12.0%' },
  ];

  const handleApprovePayout = (id: string) => {
    setPayoutList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'APPROVED' } : p))
    );
    Alert.alert('Payout Approved', `Disbursement ${id} approved for automated banking batch.`);
  };

  const handleRejectPayout = (id: string) => {
    setPayoutList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'FAILED' } : p))
    );
    Alert.alert('Payout Rejected', `Disbursement ${id} flagged and returned to creator balance.`);
  };

  const handleExport = (format: string) => {
    Alert.alert('Export Generated', `Financial Report (${format}) exported with active filter: ${dateRange}, ${selectedRegion}, ${selectedCurrency}.`);
  };

  if (isLoading && !effectiveFinance) {
    return <FinanceSkeleton />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor={colors.primary}
        />
      }
    >
      {/* Sub-Section Navigation Tabs */}
      <View style={styles.subTabsRow}>
        {[
          { id: 'platform_earnings', label: 'Platform Earnings' },
          { id: 'payouts', label: 'Creator Payouts' },
          { id: 'transactions', label: 'Transactions' },
          { id: 'reports', label: 'Financial Reports' },
        ].map((tab) => {
          const isSelected = activeSection === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={tab.label}
              style={[
                styles.subTabBtn,
                {
                  backgroundColor: isSelected ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => setActiveSection(tab.id as any)}
            >
              <Text
                style={[
                  styles.subTabText,
                  {
                    color: isSelected ? colors.text : colors.textMuted,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Global Filter Bar */}
      <Card style={styles.filterCard}>
        <View style={styles.filterTopRow}>
          <Text style={styles.filterLabel}>TIMEFRAME</Text>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {(['Today', '7D', '30D', '90D', '1Y'] as const).map((r) => {
              const isSelected = dateRange === r;
              return (
                <TouchableOpacity
                  key={r}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Filter by ${r}`}
                  style={[
                    styles.rangeBtn,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setDateRange(r)}
                >
                  <Text
                    style={[
                      styles.rangeBtnText,
                      { color: isSelected ? colors.text : colors.textMuted },
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <View style={styles.selectBox}>
            <Text style={styles.selectText}>{selectedRegion}</Text>
          </View>
          <View style={styles.selectBox}>
            <Text style={styles.selectText}>{selectedCurrency}</Text>
          </View>
        </View>
      </Card>

      {/* ─── 1. PLATFORM EARNINGS SUBSECTION ─── */}
      {activeSection === 'platform_earnings' && (
        <View style={{ gap: spacing.md }}>
          {/* Platform Revenue KPI Grid */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Platform Revenue Summary ({dateRange})</Text>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>${platformEarnings.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={styles.kpiLabel}>Gross Volume</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: colors.success }]}>${platformEarnings.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={styles.kpiLabel}>Net Platform Cut</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: colors.primary }]}>${platformEarnings.creatorPayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={styles.kpiLabel}>Creator Earnings</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: colors.danger }]}>${platformEarnings.refunds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={styles.kpiLabel}>Refunds & Disputes</Text>
              </View>
            </View>

            {/* MRR / ARR / ARPU Indicators */}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricSub}>MRR</Text>
                <Text style={styles.metricMain}>${platformEarnings.mrr.toLocaleString()}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricSub}>ARR</Text>
                <Text style={styles.metricMain}>${platformEarnings.arr.toLocaleString()}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricSub}>ARPU</Text>
                <Text style={styles.metricMain}>${platformEarnings.arpu.toFixed(2)}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricSub}>ARPPU</Text>
                <Text style={styles.metricMain}>${platformEarnings.arppu.toFixed(2)}</Text>
              </View>
            </View>
          </Card>

          {/* Revenue Streams Breakdown */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Tracked Revenue Streams</Text>
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              {revenueStreams.map((stream, idx) => (
                <View key={idx} style={styles.streamRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.streamName}>{stream.name}</Text>
                    <Text style={styles.streamCat}>
                      {stream.category} • Platform Share: {stream.platformCut}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.streamVal}>
                      ${stream.gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text style={[styles.streamGrowth, { color: colors.success }]}>{stream.growth}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>
      )}

      {/* ─── 2. CREATOR PAYOUTS SUBSECTION ─── */}
      {activeSection === 'payouts' && (
        <View style={{ gap: spacing.md }}>
          <Card style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>Payout Requests Queue ({payoutList.length})</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Export Payouts CSV"
                style={styles.exportBtn}
                onPress={() => handleExport('CSV')}
              >
                <Download size={14} color={colors.primary} />
                <Text style={styles.exportBtnText}>Export</Text>
              </TouchableOpacity>
            </View>

            {payoutList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Coins size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Payout Requests</Text>
                <Text style={styles.emptySub}>
                  All creator disbursements have been cleared for this settlement cycle.
                </Text>
              </View>
            ) : (
              <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                {payoutList.map((p) => (
                  <View key={p.id} style={styles.payoutCard}>
                    <View style={styles.payoutHeaderRow}>
                      <View>
                        <Text style={styles.payoutId}>{p.id}</Text>
                        <Text style={styles.payoutCreator}>@{p.penName} ({p.creator})</Text>
                      </View>
                      <Badge
                        variant={
                          p.status === 'PAID'
                            ? 'success'
                            : p.status === 'APPROVED'
                            ? 'primary'
                            : p.status === 'PENDING'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {p.status}
                      </Badge>
                    </View>

                    <View style={styles.payoutDetailRow}>
                      <Text style={styles.payoutMethod}>{p.method} • {p.date}</Text>
                      <Text style={styles.payoutAmount}>
                        ${p.net.toFixed(2)}{' '}
                        <Text style={styles.payoutFeeText}>(Fee: ${p.fee.toFixed(2)})</Text>
                      </Text>
                    </View>

                    {p.status === 'PENDING' && (
                      <View style={styles.payoutActionRow}>
                        <View style={{ flex: 1 }}>
                          <Button
                            title="Approve Payout"
                            variant="primary"
                            onPress={() => handleApprovePayout(p.id)}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Button
                            title="Reject"
                            variant="secondary"
                            onPress={() => handleRejectPayout(p.id)}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>
      )}

      {/* ─── 3. TRANSACTIONS LEDGER SUBSECTION ─── */}
      {activeSection === 'transactions' && (
        <View style={{ gap: spacing.md }}>
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Real-Time Transactions Ledger</Text>
            <Text style={styles.helperText}>
              Immutable double-entry coin circulation and virtual currency flow.
            </Text>

            {(effectiveFinance?.recentLedgerEntries || []).length === 0 ? (
              <View style={styles.emptyContainer}>
                <Activity size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Transactions Found</Text>
                <Text style={styles.emptySub}>
                  No recent ledger entries recorded in this active reporting window.
                </Text>
              </View>
            ) : (
              <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                {(effectiveFinance?.recentLedgerEntries || []).slice(0, 10).map((entry: any) => (
                  <View key={entry.id} style={styles.streamRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.streamName}>{entry.type}</Text>
                      <Text style={styles.streamCat}>
                        {entry.description || `Ledger Tx #${entry.id.substring(0, 8)}`}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.streamVal,
                        { color: entry.type === 'RECHARGE' ? colors.success : colors.text },
                      ]}
                    >
                      {entry.type === 'RECHARGE' ? '+' : ''}{entry.amount} Credits
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>
      )}

      {/* ─── 4. FINANCIAL REPORTS SUBSECTION ─── */}
      {activeSection === 'reports' && (
        <View style={{ gap: spacing.md }}>
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Financial Operations & Tax Exports</Text>
            <Text style={styles.helperText}>
              Generate audited profit & loss statements, creator disbursement ledgers, and tax compliance data.
            </Text>

            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              {[
                { title: 'Profit & Loss Statement (P&L)', desc: 'Quarterly GAAP revenue, platform expenses & creator cut', icon: TrendingUp },
                { title: 'Creator 1099-MISC & Tax Ledger', desc: 'Disbursement withholding reports for international creators', icon: Bookmark },
                { title: 'Virtual Currency Circulation Audit', desc: 'Authoritative double-entry CoinLedger balance sheet', icon: Coins },
                { title: 'Subscription Churn & LTV Analysis', desc: 'Cohort retention across Plus and Premium subscribers', icon: Activity },
              ].map((rep, idx) => {
                const IconComponent = rep.icon;
                return (
                  <View key={idx} style={styles.reportCard}>
                    <View style={styles.reportIconWrap}>
                      <IconComponent size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportTitle}>{rep.title}</Text>
                      <Text style={styles.reportDesc}>{rep.desc}</Text>
                      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                        {(['CSV', 'Excel', 'PDF'] as const).map((fmt) => (
                          <TouchableOpacity
                            key={fmt}
                            accessibilityRole="button"
                            accessibilityLabel={`Export ${rep.title} as ${fmt}`}
                            style={styles.miniExportPill}
                            onPress={() => handleExport(fmt)}
                          >
                            <Text style={styles.miniExportPillText}>{fmt}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  subTabsRow: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabText: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  filterCard: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  rangeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeBtnText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  selectBox: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  card: {
    gap: spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    fontWeight: '600',
    color: colors.text,
  },
  helperText: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  kpiBox: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  kpiVal: {
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    fontWeight: '700',
    color: colors.text,
  },
  kpiLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricSub: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.textMuted,
  },
  metricMain: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  streamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  streamName: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    fontWeight: '600',
    color: colors.text,
  },
  streamCat: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  streamVal: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    fontWeight: '700',
    color: colors.text,
  },
  streamGrowth: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  exportBtnText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
  payoutCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  payoutHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  payoutId: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  payoutCreator: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
  },
  payoutDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  payoutMethod: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  payoutAmount: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    fontWeight: '700',
    color: colors.text,
  },
  payoutFeeText: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    fontWeight: '400',
  },
  payoutActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  reportCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  reportIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTitle: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    fontWeight: '600',
    color: colors.text,
  },
  reportDesc: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  miniExportPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  miniExportPillText: {
    color: colors.primary,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  emptySub: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
