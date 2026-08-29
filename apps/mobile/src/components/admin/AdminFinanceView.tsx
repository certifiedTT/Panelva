import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { trpc } from '../../../lib/trpc';
import {
  CreditsIcon,
  RefreshCwIcon,
  ActivityIcon,
  CheckIcon,
  CloseIcon,
  SparklesIcon,
  TrendingUpIcon,
  BookmarkIcon,
  UsersIcon,
} from '../common/Icons';
import { MOCK_FINANCIAL_OVERVIEW } from '../../data/mockData';

type FinanceSubSection = 'platform_earnings' | 'payouts' | 'transactions' | 'reports';

export function AdminFinanceView() {
  const { colors } = useTheme();
  const [activeSection, setActiveSection] = useState<FinanceSubSection>('platform_earnings');

  // Filters
  const [dateRange, setDateRange] = useState<'Today' | '7D' | '30D' | '90D' | '1Y'>('30D');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedCurrency, setSelectedCurrency] = useState('USD ($)');
  const [selectedProvider, setSelectedProvider] = useState('All Providers');
  const [searchQuery, setSearchQuery] = useState('');

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
    Alert.alert('Export Generated', `Financial Report (${format}) exported with active filter: ${dateRange}, ${selectedRegion}, ${selectedProvider}.`);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
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
      <View style={[styles.subTabsRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
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
                    color: isSelected ? '#FFFFFF' : colors.textMuted,
                    fontWeight: isSelected ? '800' : '600',
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
      <View style={[styles.filterCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
        <View style={styles.filterTopRow}>
          <Text style={[styles.filterLabel, { color: colors.textMuted }]}>TIMEFRAME:</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['Today', '7D', '30D', '90D', '1Y'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.rangeBtn,
                  {
                    backgroundColor: dateRange === r ? colors.primary : colors.surface,
                    borderColor: dateRange === r ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setDateRange(r)}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: dateRange === r ? '#FFFFFF' : colors.text }}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <View style={[styles.selectBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.selectText, { color: colors.text }]}>{selectedRegion}</Text>
          </View>
          <View style={[styles.selectBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.selectText, { color: colors.text }]}>{selectedCurrency}</Text>
          </View>
        </View>
      </View>

      {/* ─── 1. PLATFORM EARNINGS SUBSECTION ─── */}
      {activeSection === 'platform_earnings' && (
        <View style={{ gap: 16 }}>
          {/* Platform Revenue KPI Grid */}
          <View style={[styles.kpiCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Platform Revenue Summary ({dateRange})</Text>
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.kpiVal, { color: colors.text }]}>${platformEarnings.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Gross Volume</Text>
              </View>
              <View style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.kpiVal, { color: colors.success }]}>${platformEarnings.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Net Platform Cut</Text>
              </View>
              <View style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.kpiVal, { color: colors.primary }]}>${platformEarnings.creatorPayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Creator Earnings</Text>
              </View>
              <View style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.kpiVal, { color: colors.error }]}>${platformEarnings.refunds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Refunds & Disputes</Text>
              </View>
            </View>

            {/* MRR / ARR / ARPU Indicators */}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricSub, { color: colors.textMuted }]}>MRR</Text>
                <Text style={[styles.metricMain, { color: colors.text }]}>${platformEarnings.mrr.toLocaleString()}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricSub, { color: colors.textMuted }]}>ARR</Text>
                <Text style={[styles.metricMain, { color: colors.text }]}>${platformEarnings.arr.toLocaleString()}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricSub, { color: colors.textMuted }]}>ARPU</Text>
                <Text style={[styles.metricMain, { color: colors.text }]}>${platformEarnings.arpu.toFixed(2)}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricSub, { color: colors.textMuted }]}>ARPPU</Text>
                <Text style={[styles.metricMain, { color: colors.text }]}>${platformEarnings.arppu.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Revenue Streams Breakdown */}
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tracked Revenue Streams</Text>
            <View style={{ gap: 10, marginTop: 12 }}>
              {revenueStreams.map((stream, idx) => (
                <View key={idx} style={[styles.streamRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.streamName, { color: colors.text }]}>{stream.name}</Text>
                    <Text style={[styles.streamCat, { color: colors.textMuted }]}>
                      {stream.category} • Platform Share: {stream.platformCut}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.streamVal, { color: colors.text }]}>
                      ${stream.gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text style={[styles.streamGrowth, { color: colors.success }]}>{stream.growth}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ─── 2. CREATOR PAYOUTS SUBSECTION ─── */}
      {activeSection === 'payouts' && (
        <View style={{ gap: 16 }}>
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Payout Requests Queue ({payoutList.length})</Text>
              <TouchableOpacity
                style={[styles.exportBtn, { backgroundColor: colors.primaryMuted }]}
                onPress={() => handleExport('CSV')}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>Export Payouts</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginTop: 14 }}>
              {payoutList.map((p) => (
                <View key={p.id} style={[styles.payoutCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={[styles.payoutId, { color: colors.primary }]}>{p.id}</Text>
                      <Text style={[styles.payoutCreator, { color: colors.text }]}>@{p.penName} ({p.creator})</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            p.status === 'PAID'
                              ? colors.success + '25'
                              : p.status === 'APPROVED'
                              ? colors.primaryMuted
                              : p.status === 'PENDING'
                              ? (colors.accentGold || '#F59E0B') + '25'
                              : colors.error + '25',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              p.status === 'PAID'
                                ? colors.success
                                : p.status === 'APPROVED'
                                ? colors.primary
                                : p.status === 'PENDING'
                                ? colors.accentGold || '#F59E0B'
                                : colors.error,
                          },
                        ]}
                      >
                        {p.status}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.payoutDetailRow, { borderTopColor: colors.borderSubtle }]}>
                    <Text style={[styles.payoutMethod, { color: colors.textMuted }]}>{p.method} • {p.date}</Text>
                    <Text style={[styles.payoutAmount, { color: colors.text }]}>
                      ${p.net.toFixed(2)} <Text style={{ fontSize: 10, color: colors.textMuted }}>(Fee: ${p.fee.toFixed(2)})</Text>
                    </Text>
                  </View>

                  {p.status === 'PENDING' && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <TouchableOpacity
                        style={[styles.payoutActionBtn, { backgroundColor: colors.success, flex: 1 }]}
                        onPress={() => handleApprovePayout(p.id)}
                      >
                        <Text style={styles.payoutActionBtnText}>Approve Payout</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.payoutActionBtn, { backgroundColor: colors.error, flex: 1 }]}
                        onPress={() => handleRejectPayout(p.id)}
                      >
                        <Text style={styles.payoutActionBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ─── 3. TRANSACTIONS LEDGER SUBSECTION ─── */}
      {activeSection === 'transactions' && (
        <View style={{ gap: 16 }}>
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Real-Time Transactions Ledger</Text>
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              Immutable double-entry coin circulation and virtual currency flow.
            </Text>

            <View style={{ gap: 10, marginTop: 14 }}>
              {(effectiveFinance?.recentLedgerEntries || []).slice(0, 10).map((entry: any) => (
                <View key={entry.id} style={[styles.streamRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.streamName, { color: colors.text }]}>{entry.type}</Text>
                    <Text style={[styles.streamCat, { color: colors.textMuted }]}>
                      {entry.description || `Ledger Tx #${entry.id.substring(0, 8)}`}
                    </Text>
                  </View>
                  <Text style={[styles.streamVal, { color: entry.type === 'RECHARGE' ? colors.success : colors.text }]}>
                    {entry.type === 'RECHARGE' ? '+' : ''}{entry.amount} Credits
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ─── 4. FINANCIAL REPORTS SUBSECTION ─── */}
      {activeSection === 'reports' && (
        <View style={{ gap: 16 }}>
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Financial Operations & Tax Exports</Text>
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              Generate audited profit & loss statements, creator disbursement ledgers, and tax compliance data.
            </Text>

            <View style={{ gap: 12, marginTop: 16 }}>
              {[
                { title: 'Profit & Loss Statement (P&L)', desc: 'Quarterly GAAP revenue, platform expenses & creator cut', icon: TrendingUpIcon },
                { title: 'Creator 1099-MISC & Tax Ledger', desc: 'Disbursement withholding reports for international creators', icon: BookmarkIcon },
                { title: 'Virtual Currency Circulation Audit', desc: 'Authoritative double-entry CoinLedger balance sheet', icon: CreditsIcon },
                { title: 'Subscription Churn & LTV Analysis', desc: 'Cohort retention across Plus and Premium subscribers', icon: ActivityIcon },
              ].map((rep, idx) => {
                const IconComponent = rep.icon;
                return (
                  <View key={idx} style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                      <IconComponent size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reportTitle, { color: colors.text }]}>{rep.title}</Text>
                      <Text style={[styles.reportDesc, { color: colors.textMuted }]}>{rep.desc}</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <TouchableOpacity
                          style={[styles.miniExportPill, { backgroundColor: colors.primaryMuted }]}
                          onPress={() => handleExport('CSV')}
                        >
                          <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>CSV</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.miniExportPill, { backgroundColor: colors.primaryMuted }]}
                          onPress={() => handleExport('Excel')}
                        >
                          <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>Excel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.miniExportPill, { backgroundColor: colors.primaryMuted }]}
                          onPress={() => handleExport('PDF')}
                        >
                          <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>PDF</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  subTabsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 14,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabText: {
    fontSize: 11,
  },
  filterCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  filterTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rangeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  selectBox: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  selectText: {
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  kpiCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  helperText: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  kpiBox: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricSub: {
    fontSize: 9,
    fontWeight: '800',
  },
  metricMain: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  streamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  streamName: {
    fontSize: 12,
    fontWeight: '700',
  },
  streamCat: {
    fontSize: 10,
    marginTop: 2,
  },
  streamVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  streamGrowth: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  exportBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  payoutCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  payoutId: {
    fontSize: 11,
    fontWeight: '800',
  },
  payoutCreator: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  payoutDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  payoutMethod: {
    fontSize: 11,
  },
  payoutAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  payoutActionBtn: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  reportCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  reportDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  miniExportPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});
