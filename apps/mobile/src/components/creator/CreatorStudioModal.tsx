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
import { useTheme } from '../../theme/ThemeContext';
import {
  SparklesIcon,
  PaletteIcon,
  UsersIcon,
  CreditsIcon,
  CheckIcon,
  PlusIcon,
  BookOpenIcon,
  TrendingUpIcon,
  CloseIcon,
  HistoryIcon,
  SettingsIcon,
  HelpCircleIcon,
  NovelsIcon,
  EyeIcon,
  ShieldIcon,
} from '../common/Icons';
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
  const { colors } = useTheme();
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
    { id: 'd-1', title: 'Chapter 15: Neon Whispers', series: 'Shadow City: Neon Blade', wordCount: 3400, lastModified: '2 hours ago' },
    { id: 'd-2', title: 'Chapter 16: The Undercurrent', series: 'Shadow City: Neon Blade', wordCount: 1850, lastModified: 'Yesterday' },
  ]);

  // Memberships & Tiers state
  const [tiers, setTiers] = useState([
    { id: 't-1', name: 'Apprentice Supporter', price: '$2.99/mo', subscribers: 142, perks: ['Early access to 2 chapters', 'Supporter badge'] },
    { id: 't-2', name: 'Vanguard Patron', price: '$7.99/mo', subscribers: 88, perks: ['Early access to 5 chapters', 'Exclusive discord role', 'Hi-res illustration downloads'] },
    { id: 't-3', name: 'Archon VIP', price: '$19.99/mo', subscribers: 29, perks: ['All Vanguard perks', 'Behind-the-scenes sketches', 'Name credited in end credits'] },
  ]);
  const [newTierName, setNewTierName] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('');
  const [newTierPerks, setNewTierPerks] = useState('');

  // Collabs state
  const [collabs, setCollabs] = useState(MOCK_COLLABORATION_INVITATIONS);
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
        seriesTitle: currentSeries?.title || 'Shadow City',
        senderName: dbUser?.username || 'You',
        receiverName: newCollabCreator.trim(),
        role: newCollabRole,
        shareRatio: Number(newCollabSplit) || 20,
        status: 'PENDING',
        createdAt: 'Just now',
      },
      ...collabs,
    ]);
    setNewCollabCreator('');
    Alert.alert('Invitation Sent', `Collaboration request sent to @${newCollabCreator}!`);
  };

  const handleRequestPayout = () => {
    Alert.alert('Payout Requested', `Payout request for $${payoutAmount} via ${payoutMethod} submitted for platform clearance.`);
  };

  const mobileCreatorGroups: MobileWorkspaceNavGroup[] = [
    {
      id: 'workspace',
      label: 'Workspace',
      items: [
        { id: 'overview', label: 'Overview', icon: ({ size, color }) => <TrendingUpIcon size={size} color={color} /> },
        { id: 'series', label: 'Series Management', icon: ({ size, color }) => <BookOpenIcon size={size} color={color} />, badge: seriesList.length },
        { id: 'upload', label: 'Upload Chapter', icon: ({ size, color }) => <PlusIcon size={size} color={color} /> },
        { id: 'drafts', label: 'Drafts Vault', icon: ({ size, color }) => <PaletteIcon size={size} color={color} />, badge: drafts.length },
      ],
    },
    {
      id: 'business',
      label: 'Business',
      items: [
        { id: 'analytics', label: 'Analytics', icon: ({ size, color }) => <EyeIcon size={size} color={color} /> },
        { id: 'revenue', label: 'Memberships & Revenue', icon: ({ size, color }) => <CreditsIcon size={size} color={color} /> },
        { id: 'audience', label: 'Audience & Fans', icon: ({ size, color }) => <UsersIcon size={size} color={color} /> },
      ],
    },
    {
      id: 'community_settings',
      label: 'Community & Settings',
      items: [
        { id: 'collabs', label: 'Collaborations', icon: ({ size, color }) => <UsersIcon size={size} color={color} />, badge: collabs.length },
        { id: 'linked', label: 'Linked Works', icon: ({ size, color }) => <NovelsIcon size={size} color={color} /> },
        { id: 'settings', label: 'Studio Settings', icon: ({ size, color }) => <SettingsIcon size={size} color={color} /> },
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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <View style={{ gap: 16 }}>
              <View style={[styles.kpiCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Workspace Telemetry</Text>
                <View style={styles.kpiGrid}>
                  <View style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.kpiVal, { color: colors.primary }]}>384.2K</Text>
                    <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Total Views</Text>
                  </View>
                  <View style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.kpiVal, { color: colors.success }]}>$1,845.50</Text>
                    <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Net Revenue</Text>
                  </View>
                  <View style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.kpiVal, { color: colors.text }]}>12.4K</Text>
                    <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Followers</Text>
                  </View>
                  <View style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.kpiVal, { color: colors.accentGold || '#F59E0B' }]}>259</Text>
                    <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Subscribers</Text>
                  </View>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <TouchableOpacity
                    style={[styles.quickBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setActiveTab('upload')}
                  >
                    <PlusIcon size={16} color="#FFFFFF" />
                    <Text style={styles.quickBtnText}>New Chapter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                    onPress={() => setLinkedModalVisible(true)}
                  >
                    <BookOpenIcon size={16} color={colors.text} />
                    <Text style={[styles.quickBtnText, { color: colors.text }]}>Link Novel/Comic</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Active Series Snapshot */}
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Primary Serialized Title</Text>
                <View style={{ flexDirection: 'row', gap: 14, marginTop: 12 }}>
                  <View style={[styles.seriesCoverMock, { backgroundColor: colors.primaryMuted }]}>
                    <BookOpenIcon size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={[styles.seriesHeading, { color: colors.text }]}>{currentSeries?.title || 'Shadow City'}</Text>
                    <Text style={[styles.seriesSub, { color: colors.textMuted }]}>
                      {currentSeries?.type || 'COMIC'} • {currentSeries?.genre || 'Cyberpunk'} • Status: {managedStatus}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                      <View style={[styles.miniBadge, { backgroundColor: colors.primaryMuted }]}>
                        <Text style={[styles.miniBadgeText, { color: colors.primary }]}>13 Published Chapters</Text>
                      </View>
                      <View style={[styles.miniBadge, { backgroundColor: colors.success + '25' }]}>
                        <Text style={[styles.miniBadgeText, { color: colors.success }]}>Monetized</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* SERIES MANAGEMENT TAB */}
          {activeTab === 'series' && (
            <View style={{ gap: 16 }}>
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Series Schedule & State Control</Text>
                <Text style={[styles.helperText, { color: colors.textMuted }]}>
                  Broadcast production status, hiatus notices, and season transitions to your reader base.
                </Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
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
                    >
                      <Text style={{ color: managedStatus === st ? '#FFFFFF' : colors.text, fontWeight: '700', fontSize: 11 }}>
                        {st.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 14 }]}>Status Bulletin / Reader Note:</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. Season 1 finale complete! Returning with Season 2 in October."
                  placeholderTextColor={colors.textMuted}
                  value={statusNote}
                  onChangeText={setStatusNote}
                />

                <TouchableOpacity
                  style={[styles.actionPrimaryBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
                  onPress={() => Alert.alert('Saved', 'Series status broadcast updated successfully!')}
                >
                  <Text style={styles.actionPrimaryBtnText}>Update Series Status</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* UPLOAD CHAPTER TAB */}
          {activeTab === 'upload' && (
            <View style={{ gap: 16 }}>
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Upload & Schedule Chapter</Text>

                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Chapter Number *:</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. 14, 0.5, 3.1.5, Prologue, Special 1"
                  placeholderTextColor={colors.textMuted}
                  value={chapterNumber}
                  onChangeText={setChapterNumber}
                />

                <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 10 }]}>Chapter Title (Subtitle, Optional):</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. Echoes of Steel, Side Story"
                  placeholderTextColor={colors.textMuted}
                  value={chapterSubtitle}
                  onChangeText={setChapterSubtitle}
                />

                {/* Formatted Preview Banner */}
                <View style={{ backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary, borderRadius: 10, padding: 10, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '800', textTransform: 'uppercase' }}>Preview:</Text>
                  <Text style={{ fontSize: 12, color: colors.text, fontWeight: '800' }}>{getFormattedPreview(chapterNumber, chapterSubtitle)}</Text>
                </View>

                <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 10 }]}>Access & Monetization Tier:</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  {[
                    { id: 'FREE', label: 'Free Access' },
                    { id: 'AD_SUPPORTED', label: 'Ad-Supported' },
                    { id: 'PREMIUM', label: 'Early Access (Coins/Sub)' },
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
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: chapterTier === tier.id ? '#FFFFFF' : colors.text }}>
                        {tier.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 10 }]}>Scheduled Release (Optional):</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="YYYY-MM-DD (leave empty for instant publish)"
                  placeholderTextColor={colors.textMuted}
                  value={chapterScheduledDate}
                  onChangeText={setChapterScheduledDate}
                />

                <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 10 }]}>Manuscript / Image URLs (Markdown / Text):</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, height: 100 }]}
                  placeholder="Paste episode manuscript text or image panel asset URLs..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={chapterContent}
                  onChangeText={setChapterContent}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <TouchableOpacity
                    style={[styles.actionPrimaryBtn, { backgroundColor: colors.primary, flex: 1 }]}
                    onPress={handlePublishChapter}
                  >
                    <Text style={styles.actionPrimaryBtnText}>Publish Chapter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionSecondaryBtn, { borderColor: colors.border, backgroundColor: colors.surface, flex: 1 }]}
                    onPress={handleSaveDraft}
                  >
                    <Text style={[styles.actionSecondaryBtnText, { color: colors.text }]}>Save Draft</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* DRAFTS TAB */}
          {activeTab === 'drafts' && (
            <View style={{ gap: 16 }}>
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Saved Manuscript Drafts ({drafts.length})</Text>
                <View style={{ gap: 10, marginTop: 12 }}>
                  {drafts.map((d) => (
                    <View key={d.id} style={[styles.draftRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.draftTitle, { color: colors.text }]}>{d.title}</Text>
                        <Text style={[styles.draftMeta, { color: colors.textMuted }]}>
                          {d.series} • ~{d.wordCount} words • Saved {d.lastModified}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.miniActionBtn, { backgroundColor: colors.primaryMuted }]}
                        onPress={() => Alert.alert('Loaded', `Draft "${d.title}" loaded into upload editor.`)}
                      >
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <View style={{ gap: 16 }}>
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Reader Retention & Completion</Text>
                <View style={{ gap: 12, marginTop: 12 }}>
                  <View style={[styles.metricRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.metricLabel, { color: colors.text }]}>Chapter 1 Completion Rate</Text>
                    <Text style={[styles.metricValue, { color: colors.success }]}>94.2%</Text>
                  </View>
                  <View style={[styles.metricRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.metricLabel, { color: colors.text }]}>Average Read Duration</Text>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>6m 48s</Text>
                  </View>
                  <View style={[styles.metricRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.metricLabel, { color: colors.text }]}>Subscriber Conversion Rate</Text>
                    <Text style={[styles.metricValue, { color: colors.accentGold || '#F59E0B' }]}>8.7%</Text>
                  </View>
                  <View style={[styles.metricRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.metricLabel, { color: colors.text }]}>Top Performing Chapter</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]}>Ch. 12 (Climax)</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* REVENUE & MEMBERSHIPS TAB */}
          {activeTab === 'revenue' && (
            <View style={{ gap: 16 }}>
              {/* Financial Balance */}
              <View style={[styles.kpiCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Earnings & Disbursement</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <View>
                    <Text style={[styles.kpiVal, { color: colors.success }]}>$1,845.50</Text>
                    <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Available Payout Balance</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.actionPrimaryBtn, { backgroundColor: colors.success, paddingHorizontal: 16 }]}
                    onPress={handleRequestPayout}
                  >
                    <Text style={styles.actionPrimaryBtnText}>Request Payout</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tiers List */}
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Membership Tiers ({tiers.length})</Text>
                <View style={{ gap: 10, marginTop: 12 }}>
                  {tiers.map((tier) => (
                    <View key={tier.id} style={[styles.tierCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.tierTitle, { color: colors.text }]}>{tier.name}</Text>
                        <Text style={[styles.tierPrice, { color: colors.primary }]}>{tier.price}</Text>
                      </View>
                      <Text style={[styles.tierSubscribers, { color: colors.textMuted }]}>
                        {tier.subscribers} active supporters
                      </Text>
                      <View style={{ marginTop: 6 }}>
                        {tier.perks.map((p, idx) => (
                          <Text key={idx} style={[styles.perkBullet, { color: colors.textSecondary }]}>
                            • {p}
                          </Text>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                {/* Add Tier Form */}
                <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
                  <Text style={[styles.subHeading, { color: colors.text }]}>Create New Tier</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, marginTop: 8 }]}
                    placeholder="Tier Name (e.g. Master Illuminator)"
                    placeholderTextColor={colors.textMuted}
                    value={newTierName}
                    onChangeText={setNewTierName}
                  />
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, marginTop: 8 }]}
                    placeholder="Monthly Price (e.g. $4.99/mo)"
                    placeholderTextColor={colors.textMuted}
                    value={newTierPrice}
                    onChangeText={setNewTierPrice}
                  />
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, marginTop: 8 }]}
                    placeholder="Perks (comma separated)"
                    placeholderTextColor={colors.textMuted}
                    value={newTierPerks}
                    onChangeText={setNewTierPerks}
                  />
                  <TouchableOpacity
                    style={[styles.actionPrimaryBtn, { backgroundColor: colors.primary, marginTop: 10 }]}
                    onPress={handleAddTier}
                  >
                    <Text style={styles.actionPrimaryBtnText}>Create Tier</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* COLLABORATIONS TAB */}
          {activeTab === 'collabs' && (
            <View style={{ gap: 16 }}>
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue Sharing & Team Members</Text>
                <View style={{ gap: 10, marginTop: 12 }}>
                  {collabs.map((c) => (
                    <View key={c.id} style={[styles.collabRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.collabTitle, { color: colors.text }]}>
                          @{c.receiverName || c.senderName} ({c.role})
                        </Text>
                        <Text style={[styles.collabSub, { color: colors.textMuted }]}>
                          {c.seriesTitle} • {c.shareRatio}% Revenue Allocation
                        </Text>
                      </View>
                      <View style={[styles.miniBadge, { backgroundColor: c.status === 'ACCEPTED' ? colors.success + '25' : colors.primaryMuted }]}>
                        <Text style={[styles.miniBadgeText, { color: c.status === 'ACCEPTED' ? colors.success : colors.primary }]}>
                          {c.status}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Send Collab Invite */}
                <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
                  <Text style={[styles.subHeading, { color: colors.text }]}>Invite Collaborator</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, marginTop: 8 }]}
                    placeholder="Creator Username (@penname)"
                    placeholderTextColor={colors.textMuted}
                    value={newCollabCreator}
                    onChangeText={setNewCollabCreator}
                  />
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, marginTop: 8 }]}
                    placeholder="Revenue Share % (e.g. 20)"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                    value={newCollabSplit}
                    onChangeText={setNewCollabSplit}
                  />
                  <TouchableOpacity
                    style={[styles.actionPrimaryBtn, { backgroundColor: colors.primary, marginTop: 10 }]}
                    onPress={handleSendCollab}
                  >
                    <Text style={styles.actionPrimaryBtnText}>Send Collaboration Invite</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* AUDIENCE TAB */}
          {activeTab === 'audience' && (
            <View style={{ gap: 16 }}>
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Audience Demographics & Geo Distribution</Text>
                <View style={{ gap: 10, marginTop: 12 }}>
                  <View style={[styles.metricRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.metricLabel, { color: colors.text }]}>North America (US & CA)</Text>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>48% (5.9K readers)</Text>
                  </View>
                  <View style={[styles.metricRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.metricLabel, { color: colors.text }]}>Europe (UK, DE, FR)</Text>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>26% (3.2K readers)</Text>
                  </View>
                  <View style={[styles.metricRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.metricLabel, { color: colors.text }]}>Asia Pacific (KR, JP, ID)</Text>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>18% (2.2K readers)</Text>
                  </View>
                  <View style={[styles.metricRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.metricLabel, { color: colors.text }]}>Latin America</Text>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>8% (1.1K readers)</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* LINKED COMIC/NOVEL TAB */}
          {activeTab === 'linked' && (
            <View style={{ gap: 16 }}>
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Format Synchronizer</Text>
                <Text style={[styles.helperText, { color: colors.textMuted }]}>
                  Connect your serialized web novel to its comic adaptation with chapter-by-chapter mapping.
                </Text>
                <TouchableOpacity
                  style={[styles.actionPrimaryBtn, { backgroundColor: colors.primary, marginTop: 14 }]}
                  onPress={() => setLinkedModalVisible(true)}
                >
                  <Text style={styles.actionPrimaryBtnText}>Open Format Synchronizer Modal</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <View style={{ gap: 16 }}>
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Creator Profile & Payout Preferences</Text>
                <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 8 }]}>Pen Name:</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  defaultValue={dbUser?.username || 'Studio Spectre'}
                />

                <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 10 }]}>Creator Bio:</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, height: 70 }]}
                  multiline
                  defaultValue="Author & story architect crafting cyberpunk web series."
                />

                <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 10 }]}>Payout Settlement Method:</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
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
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: payoutMethod === m ? '#FFFFFF' : colors.text }}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.actionPrimaryBtn, { backgroundColor: colors.primary, marginTop: 14 }]}
                  onPress={() => Alert.alert('Saved', 'Creator preferences saved successfully.')}
                >
                  <Text style={styles.actionPrimaryBtnText}>Save Settings</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Linked Content Modal */}
        <LinkedContentModal
          visible={linkedModalVisible}
          onClose={() => setLinkedModalVisible(false)}
          sourceSeriesId={currentSeries?.id}
          sourceType={(currentSeries?.type as any) || 'COMIC'}
        />
      </MobileWorkspaceLayout>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabPillText: {
    fontSize: 12,
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
    fontSize: 15,
    fontWeight: '800',
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
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
    fontSize: 18,
    fontWeight: '900',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  quickBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  seriesCoverMock: {
    width: 60,
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seriesHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  seriesSub: {
    fontSize: 11,
    marginTop: 2,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  inputField: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
  },
  tierPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimaryBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  actionSecondaryBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  draftTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  draftMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  miniActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  tierCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  tierTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  tierPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  tierSubscribers: {
    fontSize: 10,
    marginTop: 2,
  },
  perkBullet: {
    fontSize: 11,
    lineHeight: 16,
  },
  collabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  collabTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  collabSub: {
    fontSize: 10,
    marginTop: 2,
  },
});
