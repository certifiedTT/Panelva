import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import {
  Sparkles,
  Palette,
  Users,
  Coins,
  Check,
  Plus,
  BookOpen,
  TrendingUp,
  X,
  History,
  Settings,
  Eye,
  BookText,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Card, Button, Badge, AnalyticsCard } from '@panelva/ui';
import {
  MOCK_AUDIENCE_INSIGHTS,
  MOCK_REVENUE_BREAKDOWN,
  MOCK_PAYOUT_DETAILS,
  MOCK_COLLABORATION_INVITATIONS,
  MOCK_PLATFORM_SERIES,
} from '../../data/mockData';
import { LinkedContentModal } from './LinkedContentModal';
import { MobileWorkspaceLayout, MobileWorkspaceNavGroup } from '../workspace/WorkspaceLayout';

interface CreatorStudioModalProps {
  visible: boolean;
  onClose: () => void;
  dbUser: any;
}

type StudioTab =
  | 'overview'
  | 'series'
  | 'upload'
  | 'drafts'
  | 'analytics'
  | 'revenue'
  | 'collabs'
  | 'audience'
  | 'linked'
  | 'settings';

export function CreatorStudioModal({ visible, onClose, dbUser }: CreatorStudioModalProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('overview');

  // Series management state
  const [seriesList, setSeriesList] = useState(MOCK_PLATFORM_SERIES);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(MOCK_PLATFORM_SERIES[0]?.id || '1');
  const [linkedModalVisible, setLinkedModalVisible] = useState(false);

  // Upload chapter state
  const [chapterNumber, setChapterNumber] = useState('14');
  const [chapterSubtitle, setChapterSubtitle] = useState('');
  const [chapterTier, setChapterTier] = useState<'FREE' | 'AD_SUPPORTED' | 'PREMIUM'>('PREMIUM');
  const [chapterContent, setChapterContent] = useState('');
  const [chapterScheduledDate, setChapterScheduledDate] = useState('');

  // Live formatted chapter title helper
  const getFormattedPreview = (num: string, sub?: string) => {
    const raw = (num || '1').trim();
    const lower = raw.toLowerCase();
    let prefix = raw;
    if (
      !lower.startsWith('chapter') &&
      !lower.startsWith('ch.') &&
      !lower.startsWith('ch ') &&
      !lower.startsWith('prologue') &&
      !lower.startsWith('epilogue') &&
      !lower.startsWith('special') &&
      !lower.startsWith('extra') &&
      !lower.startsWith('side story')
    ) {
      prefix = `Chapter ${raw}`;
    } else {
      prefix = raw.charAt(0).toUpperCase() + raw.slice(1);
    }
    return sub?.trim() ? `${prefix}: ${sub.trim()}` : prefix;
  };

  // Drafts state
  const [drafts, setDrafts] = useState([
    {
      id: 'd-1',
      title: 'Chapter 15: Neon Whispers',
      series: 'Shadow City: Neon Blade',
      wordCount: 3400,
      lastModified: '2 hours ago',
    },
    {
      id: 'd-2',
      title: 'Chapter 16: The Undercurrent',
      series: 'Shadow City: Neon Blade',
      wordCount: 1850,
      lastModified: 'Yesterday',
    },
  ]);

  // Memberships & Tiers state
  const [tiers, setTiers] = useState([
    {
      id: 't-1',
      name: 'Apprentice Supporter',
      price: '$2.99/mo',
      subscribers: 142,
      perks: ['Early access to 2 chapters', 'Supporter badge'],
    },
    {
      id: 't-2',
      name: 'Vanguard Patron',
      price: '$7.99/mo',
      subscribers: 88,
      perks: ['Early access to 5 chapters', 'Exclusive discord role', 'Hi-res illustration downloads'],
    },
    {
      id: 't-3',
      name: 'Archon VIP',
      price: '$19.99/mo',
      subscribers: 29,
      perks: ['All Vanguard perks', 'Behind-the-scenes sketches', 'Name credited in end credits'],
    },
  ]);
  const [newTierName, setNewTierName] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('');
  const [newTierPerks, setNewTierPerks] = useState('');

  // Collabs state aligned with MOCK_COLLABORATION_INVITATIONS shape
  const [collabs, setCollabs] = useState<any[]>(MOCK_COLLABORATION_INVITATIONS);
  const [newCollabCreator, setNewCollabCreator] = useState('');
  const [newCollabRole, setNewCollabRole] = useState('COLORIST');
  const [newCollabSplit, setNewCollabSplit] = useState('20');

  // Payout state
  const [payoutAmount, setPayoutAmount] = useState('450.00');
  const [payoutMethod, setPayoutMethod] = useState<'STRIPE' | 'PAYPAL' | 'BANK'>('STRIPE');

  // Series status note
  const [managedStatus, setManagedStatus] = useState<'ONGOING' | 'COMING_SOON' | 'SEASON_ENDED' | 'HIATUS'>('ONGOING');
  const [statusNote, setStatusNote] = useState('');

  const currentSeries = seriesList.find((s) => s.id === selectedSeriesId) || seriesList[0];

  const handlePublishChapter = () => {
    if (!chapterNumber.trim()) {
      Alert.alert('Missing Number', 'Please enter a chapter number (e.g. 14, 0.5, 3.1.5, Prologue).');
      return;
    }
    const formatted = getFormattedPreview(chapterNumber, chapterSubtitle);
    Alert.alert('Chapter Uploaded', `"${formatted}" has been queued and published successfully!`);
    setChapterSubtitle('');
    setChapterContent('');
  };

  const handleSaveDraft = () => {
    if (!chapterNumber.trim()) {
      Alert.alert('Missing Number', 'Please enter a chapter number.');
      return;
    }
    const formatted = getFormattedPreview(chapterNumber, chapterSubtitle);
    setDrafts([
      {
        id: `d-${Date.now()}`,
        title: formatted,
        series: currentSeries?.title || 'Current Series',
        wordCount: chapterContent.length ? Math.round(chapterContent.length / 5) : 800,
        lastModified: 'Just now',
      },
      ...drafts,
    ]);
    Alert.alert('Draft Saved', 'Draft manuscript saved to your studio vault.');
  };

  const handleAddTier = () => {
    if (!newTierName.trim() || !newTierPrice.trim()) {
      Alert.alert('Missing Info', 'Please provide tier name and price.');
      return;
    }
    setTiers([
      ...tiers,
      {
        id: `t-${Date.now()}`,
        name: newTierName.trim(),
        price: newTierPrice.startsWith('$') ? newTierPrice.trim() : `$${newTierPrice.trim()}/mo`,
        subscribers: 0,
        perks: newTierPerks.split(',').map((p) => p.trim()).filter(Boolean),
      },
    ]);
    setNewTierName('');
    setNewTierPrice('');
    setNewTierPerks('');
    Alert.alert('Tier Created', 'New membership tier is now active.');
  };

  const handleSendCollab = () => {
    if (!newCollabCreator.trim()) {
      Alert.alert('Missing Creator', 'Enter creator handle to send invitation.');
      return;
    }
    setCollabs([
      {
        id: `collab-${Date.now()}`,
        series: { id: currentSeries?.id || 'series-001', title: currentSeries?.title || 'Shadow City' },
        role: newCollabRole,
        shareRatio: Number(newCollabSplit) || 20,
        message: 'Collaboration invitation sent',
        inviter: { username: newCollabCreator.trim(), avatarUrl: '' },
        status: 'PENDING',
        createdAt: 'Just now',
      },
      ...collabs,
    ]);
    setNewCollabCreator('');
    Alert.alert('Invitation Sent', `Collaboration request sent to @${newCollabCreator}!`);
  };

  const handleRequestPayout = () => {
    Alert.alert(
      'Payout Requested',
      `Payout request for $${payoutAmount} via ${payoutMethod} submitted for platform clearance.`
    );
  };

  const mobileCreatorGroups: MobileWorkspaceNavGroup[] = [
    {
      id: 'workspace',
      label: 'Workspace',
      items: [
        { id: 'overview', label: 'Overview', icon: ({ size, color }) => <TrendingUp size={size} color={color} /> },
        { id: 'series', label: 'Series Management', icon: ({ size, color }) => <BookOpen size={size} color={color} />, badge: seriesList.length },
        { id: 'upload', label: 'Upload Chapter', icon: ({ size, color }) => <Plus size={size} color={color} /> },
        { id: 'drafts', label: 'Drafts Vault', icon: ({ size, color }) => <Palette size={size} color={color} />, badge: drafts.length },
      ],
    },
    {
      id: 'business',
      label: 'Business',
      items: [
        { id: 'analytics', label: 'Analytics', icon: ({ size, color }) => <Eye size={size} color={color} /> },
        { id: 'revenue', label: 'Memberships & Revenue', icon: ({ size, color }) => <Coins size={size} color={color} /> },
        { id: 'audience', label: 'Audience & Fans', icon: ({ size, color }) => <Users size={size} color={color} /> },
      ],
    },
    {
      id: 'community_settings',
      label: 'Community & Settings',
      items: [
        { id: 'collabs', label: 'Collaborations', icon: ({ size, color }) => <Users size={size} color={color} />, badge: collabs.length },
        { id: 'linked', label: 'Linked Works', icon: ({ size, color }) => <BookText size={size} color={color} /> },
        { id: 'settings', label: 'Studio Settings', icon: ({ size, color }) => <Settings size={size} color={color} /> },
      ],
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <MobileWorkspaceLayout
        type="creator"
        title="Creator Studio"
        contextSubtitle={activeTab.toUpperCase()}
        user={{
          username: dbUser?.username,
          penName: dbUser?.username || 'Creator',
          role: 'CREATOR',
        }}
        roleBadge="Creator"
        groups={mobileCreatorGroups}
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId as StudioTab)}
        onClose={onClose}
      >
        {/* Tab Contents */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
        >
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <View style={{ gap: spacing.md }}>
              <Card style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitle}>Workspace Telemetry</Text>
                <View style={styles.kpiGrid}>
                  <View style={styles.kpiBox}>
                    <Text style={[styles.kpiVal, { color: colors.primary }]}>384.2K</Text>
                    <Text style={styles.kpiLabel}>Total Views</Text>
                  </View>
                  <View style={styles.kpiBox}>
                    <Text style={[styles.kpiVal, { color: colors.success }]}>$1,845.50</Text>
                    <Text style={styles.kpiLabel}>Net Revenue</Text>
                  </View>
                  <View style={styles.kpiBox}>
                    <Text style={styles.kpiVal}>12.4K</Text>
                    <Text style={styles.kpiLabel}>Followers</Text>
                  </View>
                  <View style={styles.kpiBox}>
                    <Text style={[styles.kpiVal, { color: colors.warning }]}>259</Text>
                    <Text style={styles.kpiLabel}>Subscribers</Text>
                  </View>
                </View>
              </Card>

              {/* Quick Actions */}
              <Card style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="New Chapter"
                      variant="primary"
                      onPress={() => setActiveTab('upload')}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Link Novel/Comic"
                      variant="secondary"
                      onPress={() => setLinkedModalVisible(true)}
                    />
                  </View>
                </View>
              </Card>

              {/* Active Series Snapshot */}
              <Card style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitle}>Primary Serialized Title</Text>
                <View style={styles.seriesSnapshotRow}>
                  <View style={styles.seriesCoverMock}>
                    <BookOpen size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: spacing.xs / 2 }}>
                    <Text style={styles.seriesHeading}>
                      {currentSeries?.title || 'Shadow City'}
                    </Text>
                    <Text style={styles.seriesSub}>
                      {currentSeries?.type || 'COMIC'} • {currentSeries?.genre || 'Cyberpunk'} • Status: {managedStatus}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs }}>
                      <Badge variant="primary" size="sm">
                        13 Chapters
                      </Badge>
                      <Badge variant="success" size="sm">
                        Monetized
                      </Badge>
                    </View>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* SERIES MANAGEMENT TAB */}
          {activeTab === 'series' && (
            <View style={{ gap: spacing.md }}>
              <Card style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitle}>Series Schedule & State Control</Text>
                <Text style={styles.helperText}>
                  Broadcast production status, hiatus notices, and season transitions to your reader base.
                </Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {(['ONGOING', 'COMING_SOON', 'SEASON_ENDED', 'HIATUS'] as const).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusBtn,
                        {
                          backgroundColor: managedStatus === st ? colors.primary : colors.surface,
                          borderColor: managedStatus === st ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setManagedStatus(st)}
                      accessibilityRole="button"
                      accessibilityLabel={`Set series status to ${st}`}
                    >
                      <Text
                        style={{
                          color: managedStatus === st ? colors.text : colors.textMuted,
                          fontWeight: '700',
                          fontSize: typography.caption.fontSize,
                        }}
                      >
                        {st.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Status Bulletin / Reader Note:</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. Season 1 finale complete! Returning with Season 2 in October."
                  placeholderTextColor={colors.textMuted}
                  value={statusNote}
                  onChangeText={setStatusNote}
                />

                <Button
                  title="Update Series Status"
                  variant="primary"
                  onPress={() => Alert.alert('Saved', 'Series status broadcast updated successfully!')}
                />
              </Card>
            </View>
          )}

          {/* UPLOAD CHAPTER TAB */}
          {activeTab === 'upload' && (
            <View style={{ gap: spacing.md }}>
              <Card style={{ gap: spacing.sm }}>
                <Text style={styles.sectionTitle}>Upload & Schedule Chapter</Text>

                <Text style={styles.inputLabel}>Chapter Number *:</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. 14, 0.5, 3.1.5, Prologue, Special 1"
                  placeholderTextColor={colors.textMuted}
                  value={chapterNumber}
                  onChangeText={setChapterNumber}
                />

                <Text style={styles.inputLabel}>Chapter Title (Subtitle, Optional):</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. Echoes of Steel, Side Story"
                  placeholderTextColor={colors.textMuted}
                  value={chapterSubtitle}
                  onChangeText={setChapterSubtitle}
                />

                {/* Formatted Preview Banner */}
                <View style={styles.previewBanner}>
                  <Text style={styles.previewTag}>Preview:</Text>
                  <Text style={styles.previewText}>
                    {getFormattedPreview(chapterNumber, chapterSubtitle)}
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Access & Monetization Tier:</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {[
                    { id: 'FREE', label: 'Free' },
                    { id: 'AD_SUPPORTED', label: 'Ad-Supported' },
                    { id: 'PREMIUM', label: 'Early Access' },
                  ].map((tier) => (
                    <TouchableOpacity
                      key={tier.id}
                      style={[
                        styles.tierPill,
                        {
                          backgroundColor: chapterTier === tier.id ? colors.primary : colors.surface,
                          borderColor: chapterTier === tier.id ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setChapterTier(tier.id as any)}
                      accessibilityRole="button"
                      accessibilityLabel={`Set chapter tier to ${tier.label}`}
                    >
                      <Text
                        style={{
                          fontSize: typography.caption.fontSize,
                          fontWeight: '700',
                          color: chapterTier === tier.id ? colors.text : colors.textMuted,
                        }}
                      >
                        {tier.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Scheduled Release (Optional):</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="YYYY-MM-DD (leave empty for instant publish)"
                  placeholderTextColor={colors.textMuted}
                  value={chapterScheduledDate}
                  onChangeText={setChapterScheduledDate}
                />

                <Text style={styles.inputLabel}>Manuscript / Image URLs (Markdown / Text):</Text>
                <TextInput
                  style={[styles.inputField, { height: 100 }]}
                  placeholder="Paste episode manuscript text or image panel asset URLs..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={chapterContent}
                  onChangeText={setChapterContent}
                />

                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Publish Chapter"
                      variant="primary"
                      onPress={handlePublishChapter}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Save Draft"
                      variant="secondary"
                      onPress={handleSaveDraft}
                    />
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* DRAFTS TAB */}
          {activeTab === 'drafts' && (
            <View style={{ gap: spacing.md }}>
              <Card style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitle}>Saved Manuscript Drafts ({drafts.length})</Text>
                <View style={{ gap: spacing.sm }}>
                  {drafts.map((d) => (
                    <Card key={d.id} style={styles.itemCard}>
                      <View style={{ flex: 1, gap: spacing.xs / 2 }}>
                        <Text style={styles.itemTitle}>{d.title}</Text>
                        <Text style={styles.itemSubtitle}>
                          {d.series} • ~{d.wordCount} words • Saved {d.lastModified}
                        </Text>
                      </View>
                      <Button
                        title="Edit"
                        variant="secondary"
                        onPress={() => Alert.alert('Loaded', `Draft "${d.title}" loaded into upload editor.`)}
                      />
                    </Card>
                  ))}
                </View>
              </Card>
            </View>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <View style={{ gap: spacing.md }}>
              <Text style={styles.sectionTitle}>Reader Retention & Key Metrics</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <AnalyticsCard
                    title="Ch 1 Completion"
                    value="94.2%"
                    growth={3.5}
                    isPositive={true}
                    icon={<TrendingUp size={16} color={colors.success} />}
                    subtitle="vs last month"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AnalyticsCard
                    title="Avg Duration"
                    value="6m 48s"
                    growth={1.2}
                    isPositive={true}
                    icon={<Eye size={16} color={colors.primary} />}
                    subtitle="per reader"
                  />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <AnalyticsCard
                    title="Conversion"
                    value="8.7%"
                    growth={0.8}
                    isPositive={true}
                    icon={<Users size={16} color={colors.warning} />}
                    subtitle="subscribers"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AnalyticsCard
                    title="Top Chapter"
                    value="Ch. 12"
                    icon={<BookOpen size={16} color={colors.primary} />}
                    subtitle="4.8k reads"
                  />
                </View>
              </View>
            </View>
          )}

          {/* REVENUE & MEMBERSHIPS TAB */}
          {activeTab === 'revenue' && (
            <View style={{ gap: spacing.md }}>
              {/* Financial Balance */}
              <Card style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitle}>Earnings & Disbursement</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={[styles.kpiVal, { color: colors.success }]}>$1,845.50</Text>
                    <Text style={styles.kpiLabel}>Available Payout Balance</Text>
                  </View>
                  <Button
                    title="Request Payout"
                    variant="primary"
                    onPress={handleRequestPayout}
                  />
                </View>
              </Card>

              {/* Tiers List */}
              <Card style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitle}>Membership Tiers ({tiers.length})</Text>
                <View style={{ gap: spacing.sm }}>
                  {tiers.map((tier) => (
                    <Card key={tier.id} style={{ gap: spacing.xs }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.itemTitle}>{tier.name}</Text>
                        <Text style={[styles.itemTitle, { color: colors.primary }]}>{tier.price}</Text>
                      </View>
                      <Text style={styles.itemSubtitle}>{tier.subscribers} active supporters</Text>
                      <View style={{ marginTop: spacing.xs }}>
                        {tier.perks.map((p, idx) => (
                          <Text key={idx} style={styles.perkText}>
                            • {p}
                          </Text>
                        ))}
                      </View>
                    </Card>
                  ))}
                </View>

                {/* Add Tier Form */}
                <View style={styles.formDivider}>
                  <Text style={styles.sectionTitle}>Create New Tier</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Tier Name (e.g. Master Illuminator)"
                    placeholderTextColor={colors.textMuted}
                    value={newTierName}
                    onChangeText={setNewTierName}
                  />
                  <TextInput
                    style={styles.inputField}
                    placeholder="Monthly Price (e.g. $4.99/mo)"
                    placeholderTextColor={colors.textMuted}
                    value={newTierPrice}
                    onChangeText={setNewTierPrice}
                  />
                  <TextInput
                    style={styles.inputField}
                    placeholder="Perks (comma separated)"
                    placeholderTextColor={colors.textMuted}
                    value={newTierPerks}
                    onChangeText={setNewTierPerks}
                  />
                  <Button title="Create Tier" variant="primary" onPress={handleAddTier} />
                </View>
              </Card>
            </View>
          )}

          {/* COLLABORATIONS TAB */}
          {activeTab === 'collabs' && (
            <View style={{ gap: spacing.md }}>
              <Card style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitle}>Revenue Sharing & Team Members</Text>
                <View style={{ gap: spacing.sm }}>
                  {collabs.map((c) => (
                    <Card key={c.id} style={styles.itemCard}>
                      <View style={{ flex: 1, gap: spacing.xs / 2 }}>
                        <Text style={styles.itemTitle}>
                          @{c.inviter?.username || 'Collaborator'} ({c.role})
                        </Text>
                        <Text style={styles.itemSubtitle}>
                          {c.series?.title || 'Series'} • {c.shareRatio}% Revenue Allocation
                        </Text>
                      </View>
                      <Badge variant={c.status === 'ACCEPTED' ? 'success' : 'primary'} size="sm">
                        {c.status}
                      </Badge>
                    </Card>
                  ))}
                </View>

                {/* Send Collab Invite */}
                <View style={styles.formDivider}>
                  <Text style={styles.sectionTitle}>Invite Collaborator</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Creator Username (@penname)"
                    placeholderTextColor={colors.textMuted}
                    value={newCollabCreator}
                    onChangeText={setNewCollabCreator}
                  />
                  <TextInput
                    style={styles.inputField}
                    placeholder="Revenue Share % (e.g. 20)"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                    value={newCollabSplit}
                    onChangeText={setNewCollabSplit}
                  />
                  <Button
                    title="Send Collaboration Invite"
                    variant="primary"
                    onPress={handleSendCollab}
                  />
                </View>
              </Card>
            </View>
          )}

          {/* AUDIENCE TAB */}
          {activeTab === 'audience' && (
            <View style={{ gap: spacing.md }}>
              <Card style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitle}>Audience Demographics & Geo Distribution</Text>
                <View style={{ gap: spacing.sm }}>
                  <Card style={styles.metricRow}>
                    <Text style={styles.metricLabel}>North America (US & CA)</Text>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>48% (5.9K readers)</Text>
                  </Card>
                  <Card style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Europe (UK, DE, FR)</Text>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>26% (3.2K readers)</Text>
                  </Card>
                  <Card style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Asia Pacific (KR, JP, ID)</Text>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>18% (2.2K readers)</Text>
                  </Card>
                  <Card style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Latin America</Text>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>8% (1.1K readers)</Text>
                  </Card>
                </View>
              </Card>
            </View>
          )}

          {/* LINKED COMIC/NOVEL TAB */}
          {activeTab === 'linked' && (
            <View style={{ gap: spacing.md }}>
              <Card style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitle}>Format Synchronizer</Text>
                <Text style={styles.helperText}>
                  Connect your serialized web novel to its comic adaptation with chapter-by-chapter mapping.
                </Text>
                <Button
                  title="Open Format Synchronizer Modal"
                  variant="primary"
                  onPress={() => setLinkedModalVisible(true)}
                />
              </Card>
            </View>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <View style={{ gap: spacing.md }}>
              <Card style={{ gap: spacing.md }}>
                <Text style={styles.sectionTitle}>Creator Profile & Payout Preferences</Text>
                <Text style={styles.inputLabel}>Pen Name:</Text>
                <TextInput
                  style={styles.inputField}
                  defaultValue={dbUser?.username || 'Studio Spectre'}
                />

                <Text style={styles.inputLabel}>Creator Bio:</Text>
                <TextInput
                  style={[styles.inputField, { height: 72 }]}
                  multiline
                  defaultValue="Author & story architect crafting cyberpunk web series."
                />

                <Text style={styles.inputLabel}>Payout Settlement Method:</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {(['STRIPE', 'PAYPAL', 'BANK'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.tierPill,
                        {
                          backgroundColor: payoutMethod === m ? colors.primary : colors.surface,
                          borderColor: payoutMethod === m ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setPayoutMethod(m)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select payout method ${m}`}
                    >
                      <Text
                        style={{
                          fontSize: typography.caption.fontSize,
                          fontWeight: '700',
                          color: payoutMethod === m ? colors.text : colors.textMuted,
                        }}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Button
                  title="Save Settings"
                  variant="primary"
                  onPress={() => Alert.alert('Saved', 'Creator preferences saved successfully.')}
                />
              </Card>
            </View>
          )}
        </ScrollView>

        {/* Linked Content Modal */}
        <LinkedContentModal
          visible={linkedModalVisible}
          onClose={() => setLinkedModalVisible(false)}
          series={currentSeries}
        />
      </MobileWorkspaceLayout>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    fontWeight: '700',
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
  },
  kpiBox: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs / 2,
  },
  kpiVal: {
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    fontWeight: '800',
    color: colors.text,
  },
  kpiLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  seriesSnapshotRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  seriesCoverMock: {
    width: 64,
    height: 80,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seriesHeading: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  seriesSub: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  statusBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  inputLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  inputField: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.caption.fontSize,
    color: colors.text,
  },
  previewBanner: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTag: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  previewText: {
    fontSize: typography.caption.fontSize,
    color: colors.text,
    fontWeight: '700',
  },
  tierPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  itemTitle: {
    fontSize: typography.small.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  itemSubtitle: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  metricValue: {
    fontSize: typography.small.fontSize,
    fontWeight: '800',
    color: colors.text,
  },
  perkText: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
  formDivider: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
});
