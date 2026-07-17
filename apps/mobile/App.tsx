import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Switch, 
  Alert,
  Modal,
  Dimensions,
  FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Screen Dimensions for responsiveness
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RNPlan {
  id: 'PLUS' | 'PREMIUM';
  name: string;
  price: string;
  period: string;
  features: { title: string; subtitle: string }[];
  highlightColor: string;
}

const RN_PLANS: RNPlan[] = [
  {
    id: 'PLUS',
    name: 'Panelva Plus',
    price: '$4.99',
    period: '/ month',
    highlightColor: '#a78bfa',
    features: [
      { title: '6-hour early access on new chapters', subtitle: 'Read fresh releases before everyone else' },
      { title: 'Basic offline downloads', subtitle: 'Save up to 10 chapters encrypting at rest' },
      { title: 'No banner ads', subtitle: 'Enjoy a cleaner reading interface' }
    ]
  },
  {
    id: 'PREMIUM',
    name: 'Panelva Premium',
    price: '$9.99',
    period: '/ month',
    highlightColor: '#fbbf24',
    features: [
      { title: 'Instant early access to all content', subtitle: 'No wait times or schedules on early chapters' },
      { title: 'Unlimited offline downloads', subtitle: 'AES-256 secure encrypted caching' },
      { title: 'No ads, animated PFP & badges', subtitle: 'Plus the rest of the Premium perks' }
    ]
  }
];

function ContentAccessModal({
  visible,
  onClose,
  accessType,
  seriesTitle,
  chapterTitle,
  onUnlockWithAds,
  onUpgradeSubscription,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  accessType: 'AD_SUPPORTED' | 'PREMIUM';
  seriesTitle: string;
  chapterTitle: string;
  onUnlockWithAds: () => void;
  onUpgradeSubscription: (tier: 'PLUS' | 'PREMIUM') => void;
  colors: any;
}) {
  const [selectedPlanId, setSelectedPlanId] = useState<'PLUS' | 'PREMIUM'>('PREMIUM');
  const currentPlan = RN_PLANS.find(p => p.id === selectedPlanId) || RN_PLANS[1];

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalRNContainer, { backgroundColor: '#12121A', borderColor: colors.border }]}>
          
          {/* Header */}
          <View style={styles.modalRNHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={[styles.lockIconContainer, { backgroundColor: accessType === 'PREMIUM' ? 'rgba(251,191,36,0.1)' : 'rgba(52,152,219,0.1)' }]}>
                <Text style={{ fontSize: 18, color: accessType === 'PREMIUM' ? '#fbbf24' : '#3498db' }}>
                  {accessType === 'PREMIUM' ? '👑' : '📺'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalRNTitle}>
                  {accessType === 'PREMIUM' ? 'Premium only' : 'Ad-supported unlock'}
                </Text>
                <Text style={styles.modalRNSubtitle} numberOfLines={1}>
                  {seriesTitle} &bull; {chapterTitle}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalRNCloseBtn}>
              <Text style={{ color: '#8E8E9F', fontSize: 18, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable content to prevent clipping on small devices */}
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
            {/* Segmented plan selection */}
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              <Text style={styles.toggleSectionLabel}>Subscription Tiers</Text>
              <View style={styles.toggleBarContainer}>
                {RN_PLANS.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.toggleBarBtn, selectedPlanId === p.id && styles.toggleBarBtnActive]}
                    onPress={() => setSelectedPlanId(p.id)}
                  >
                    <Text style={[styles.toggleBarBtnText, selectedPlanId === p.id && { color: '#c084fc' }]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Gold highlighted offer card */}
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              <View style={[
                styles.highlightPromoCard, 
                { 
                  borderColor: currentPlan.id === 'PREMIUM' ? 'rgba(251,191,36,0.25)' : 'rgba(167,139,250,0.25)',
                  backgroundColor: currentPlan.id === 'PREMIUM' ? 'rgba(251,191,36,0.06)' : 'rgba(167,139,250,0.06)'
                }
              ]}>
                <View style={[styles.highlightPromoIconBg, { backgroundColor: currentPlan.id === 'PREMIUM' ? 'rgba(251,191,36,0.15)' : 'rgba(167,139,250,0.15)' }]}>
                  <Text style={{ fontSize: 16, color: currentPlan.highlightColor }}>👑</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <Text style={[styles.highlightPromoTitle, { color: currentPlan.highlightColor }]}>
                      {currentPlan.name}
                    </Text>
                    <Text style={styles.highlightPromoPrice}>{currentPlan.price}</Text>
                    <Text style={styles.highlightPromoPeriod}>{currentPlan.period}</Text>
                  </View>
                  <Text style={styles.highlightPromoDesc}>
                    Unlock premium chapters instantly and enjoy offline AES-256 secure downloads.
                  </Text>
                </View>
              </View>
            </View>

            {/* Feature List rows */}
            <View style={{ paddingHorizontal: 16, marginTop: 14, gap: 10 }}>
              {currentPlan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRowItem}>
                  <Text style={[styles.featureCheckmark, { color: currentPlan.highlightColor }]}>✓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureItemTitle}>{feature.title}</Text>
                    <Text style={styles.featureItemSub}>{feature.subtitle}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.modalRNFooter, { borderTopColor: '#28283A' }]}>
            {accessType === 'AD_SUPPORTED' ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={onUnlockWithAds} style={[styles.footerBtn, { backgroundColor: '#7c3aed', flex: 1 }]}>
                  <Text style={styles.footerBtnText}>🎬 Unlock with Ads</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onUpgradeSubscription(selectedPlanId)} style={[styles.footerBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flex: 1 }]}>
                  <Text style={[styles.footerBtnText, { color: '#FFFFFF' }]}>👑 Go Premium</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={onClose} style={[styles.footerBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flex: 1 }]}>
                  <Text style={[styles.footerBtnText, { color: '#FFFFFF' }]}>Not Now</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => onUpgradeSubscription(selectedPlanId)} 
                  style={[styles.footerBtn, { backgroundColor: currentPlan.id === 'PREMIUM' ? '#fbbf24' : '#a78bfa', flex: 1 }]}
                >
                  <Text style={[styles.footerBtnText, { color: currentPlan.id === 'PREMIUM' ? '#000000' : '#FFFFFF' }]}>
                    Upgrade to {selectedPlanId === 'PREMIUM' ? 'Premium' : 'Plus'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

        </View>
      </View>
    </Modal>
  );
}

// Mock Data
const MOCK_SERIES = [
  { id: '1', title: 'Love Bites', rating: '9.8', genre: 'Romance', type: 'MANHWA', coverBg: '#4c0519', views: '3.9M', status: 'Ongoing', author: 'Lee Jehwan', chapters: 'Chapter 42 • 2 hours ago', isHot: true },
  { id: '2', title: 'Star Catcher', rating: '9.5', genre: 'Romance', type: 'MANHWA', coverBg: '#1e1b4b', views: '3.0M', status: 'Ongoing', author: 'DrawPro', chapters: 'Chapter 36 • 1 day ago', isHot: true },
  { id: '3', title: 'A Spell for a Smith', rating: '9.7', genre: 'Fantasy', type: 'MANHWA', coverBg: '#022c22', views: '3.4M', status: 'Ongoing', author: 'MagusSmith', chapters: 'Chapter 48 • 3 days ago', isHot: false },
  { id: '4', title: 'Surviving as a Barbarian', rating: '9.9', genre: 'Fantasy', type: 'MANHWA', coverBg: '#450a0a', views: '4.4M', status: 'Ongoing', author: 'BarbarianKing', chapters: 'Chapter 78 • 5 days ago', isHot: true },
  { id: '5', title: 'Swolemates', rating: '9.2', genre: 'Comedy', type: 'MANHWA', coverBg: '#1f2937', views: '7.6M', status: 'Completed', author: 'GymTons', chapters: 'Chapter 88 • 1 week ago', isHot: false },
  { id: '6', title: 'Born to be Grand Duchess', rating: '9.6', genre: 'Shoujo', type: 'NOVEL', coverBg: '#0c4a6e', views: '5.4M', status: 'Ongoing', author: 'DuchessPen', chapters: 'Chapter 52 • 5 days ago', isHot: true },
  { id: '7', title: 'Demon Hunter Life', rating: '9.4', genre: 'Action', type: 'NOVEL', coverBg: '#062f4f', views: '2.5M', status: 'Ongoing', author: 'HunterJong', chapters: 'Chapter 30 • 2 days ago', isHot: false },
  { id: '8', title: 'Girlfriend Manual', rating: '9.3', genre: 'Romance', type: 'MANGA', coverBg: '#581c87', views: '2.2M', status: 'Completed', author: 'ManualMaker', chapters: 'Chapter 64 • 4 days ago', isHot: false },
  { id: '9', title: 'Alimony Aiming', rating: '9.1', genre: 'Drama', type: 'NOVEL', coverBg: '#111827', views: '1.9M', status: 'Ongoing', author: 'LawyerLover', chapters: 'Chapter 45 • 6 days ago', isHot: false },
  { id: '10', title: 'Archmage Curriculum', rating: '9.5', genre: 'Fantasy', type: 'MANHWA', coverBg: '#065f46', views: '1.6M', status: 'Ongoing', author: 'MageTeacher', chapters: 'Chapter 34 • 3 hours ago', isHot: true }
];

const CAROUSEL_ITEMS = [
  { id: '1', title: 'Love Bites', rating: '★ 9.8', genre: 'Romance', type: 'Manhwa', coverBg: '#9f1239', quote: 'A bloodthirsty roommate contract begins...' },
  { id: '4', title: 'Surviving as a Barbarian', rating: '★ 9.9', genre: 'Fantasy', type: 'Manhwa', coverBg: '#781c1c', quote: 'Brutal dungeon crawling has never felt this real.' },
  { id: '6', title: 'Born to be Grand Duchess', rating: '★ 9.6', genre: 'Shoujo', type: 'Novel', coverBg: '#0369a1', quote: 'Reborn to rewrite royal splits and claim her throne.' }
];

const MOCK_NOTIFICATIONS = {
  updates: [
    { id: 'u1', title: 'Love Bites Chapter 42', content: 'New chapter out! Step into a world of visual romance and sweet bloodthirsty bites.', time: '2 hours ago' },
    { id: 'u2', title: 'Demon Hunter Life Chapter 30', content: 'HunterJong just dropped the latest update! Read the battle now.', time: '2 days ago' },
    { id: 'u3', title: 'Archmage Curriculum Chapter 34', content: 'School of elemental arrays is now open. Study the curriculum.', time: '3 hours ago' }
  ],
  announcements: [
    { id: 'a1', title: 'Panelva Premium Coins Sale 🪙', content: 'Get 50% extra bonus tokens on all packs today only.', time: '1 day ago' },
    { id: 'a2', title: 'Community Comments Policy Updated 📜', content: 'We updated our community guidelines. Read them under App settings.', time: '3 days ago' }
  ]
};

const INITIAL_COMMENTS = [
  { id: 'c1', author: 'WebtoonFanatic', tier: 'Premium', avatar: 'W', text: 'This chapter was absolutely fire! The pacing is getting so good.', likes: 142, dislikes: 3, timeAgo: '2h ago' },
  { id: 'c2', author: 'SoloLover', tier: 'Plus', avatar: 'S', text: 'I agree with the contract terms. Let them cook.', likes: 89, dislikes: 1, timeAgo: '4h ago' },
  { id: 'c3', author: 'AliceRead', tier: 'Guest', avatar: 'A', text: 'Wait, does this update weekly or monthly? The art style is gorgeous.', likes: 45, dislikes: 0, timeAgo: '1d ago' }
];

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'home' | 'comics' | 'novels' | 'notifications' | 'more' | 'reader' | 'creator_studio' | 'admin_panel' | 'drm_manager'>('home');
  
  // Custom states
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [latestReleaseToggle, setLatestReleaseToggle] = useState<'hot' | 'new'>('hot');
  const [notifSegment, setNotifSegment] = useState<'updates' | 'announcements' | 'invitations'>('updates');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOverlayVisible, setSearchOverlayVisible] = useState(false);
  const [selectedGenreTag, setSelectedGenreTag] = useState('All');
  const [selectedStatusTag, setSelectedStatusTag] = useState('All');

  // Collaboration Invitation States
  const [mobileInvitations, setMobileInvitations] = useState([
    {
      id: 'mi-1',
      senderName: 'DuchessPen',
      seriesTitle: 'Born to be the Grand Duchess',
      coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop',
      description: 'Reborn into royalty, she must claim her throne as the grand duchess, navigating waiting lists and premium splits.',
      genre: 'Romance',
      role: 'Illustrator',
      roleDescription: 'Draw beautiful royal ballrooms, gowns, and character profiles.',
      shareRatio: 30,
      message: 'Love your art style! Let us collaborate on this premium novel project.',
      terms: 'Deliver 1 chapter lineart every 5 days.',
      status: 'PENDING',
      date: 'July 15, 2026'
    }
  ]);
  const [activeMobileInvitation, setActiveMobileInvitation] = useState<any>(null);

  const handleMobileInvitationResponse = (responseStatus: 'ACCEPTED' | 'DECLINED') => {
    if (!activeMobileInvitation) return;
    
    // Update local invitation status
    setMobileInvitations(prev => 
      prev.map(item => item.id === activeMobileInvitation.id ? { ...item, status: responseStatus } : item)
    );

    if (responseStatus === 'ACCEPTED') {
      Alert.alert('Invitation Accepted', `You have successfully joined the "${activeMobileInvitation.seriesTitle}" project!`);
    } else {
      Alert.alert('Invitation Declined', `You declined the invitation to collaborate on "${activeMobileInvitation.seriesTitle}".`);
    }

    setActiveMobileInvitation(null);
  };

  // Issue reporting modal
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [issueType, setIssueType] = useState('Bug Report');
  const [issueDescription, setIssueDescription] = useState('');

  // Reader context
  const [selectedSeries, setSelectedSeries] = useState<any>(MOCK_SERIES[0]);
  const [readerFormat, setReaderFormat] = useState<'comic' | 'novel'>('comic');
  const [comments, setComments] = useState(INITIAL_COMMENTS);
  const [commentInputText, setCommentInputText] = useState('');
  const [agreeToRules, setAgreeToRules] = useState(false);
  const [showRulesSheet, setShowRulesSheet] = useState(false);

  // Chapter access control states
  const [currentChapter, setCurrentChapter] = useState(1);
  const [unlockedAdChapters, setUnlockedAdChapters] = useState<Record<number, boolean>>({});
  const [accessModalVisible, setAccessModalVisible] = useState(false);
  const [simulatedAdPlaying, setSimulatedAdPlaying] = useState(false);
  const [adTimer, setAdTimer] = useState(5);
  
  // Report modal state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportedComment, setReportedComment] = useState<any>(null);
  const [selectedReportReason, setSelectedReportReason] = useState<string>('Be Respectful');

  // User details state
  const [userCoins, setUserCoins] = useState(480);
  const [userTier, setUserTier] = useState('Panelva Premium');
  const [promoCode, setPromoCode] = useState('');

  // Existing simulators states
  const [chapterTitle, setChapterTitle] = useState('');
  const [waitForFree, setWaitForFree] = useState(true);
  const [priceTier, setPriceTier] = useState('PREMIUM');
  const [downloadTarget, setDownloadTarget] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedEpisodes, setDownloadedEpisodes] = useState<Record<number, boolean>>({});
  const [stats, setStats] = useState({ penName: 'notjud3', followers: 1240, views: 24500 });
  const [applications, setApplications] = useState([
    { id: 'app-5', penName: 'MagusSmith', type: 'WRITER', bio: 'Fantasy writer focusing on crafting and magic systems.', portfolioUrl: 'https://portfolio.panelva/magussmith' }
  ]);

  // Color theme palettes
  const colors = {
    bg: theme === 'dark' ? '#0D0D12' : '#F4F4F6',
    header: theme === 'dark' ? '#161622' : '#FFFFFF',
    panel: theme === 'dark' ? '#1E1E2A' : '#FFFFFF',
    border: theme === 'dark' ? '#28283A' : '#E2E2E8',
    text: theme === 'dark' ? '#FFFFFF' : '#0D0D12',
    textMuted: theme === 'dark' ? '#8E8E9F' : '#6C6C7C',
    accent: '#6c5ce7',
    accentText: '#FFFFFF',
  };

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLaunchReader = (series: any) => {
    setSelectedSeries(series);
    setReaderFormat(series.type === 'NOVEL' ? 'novel' : 'comic');
    setCurrentChapter(1); // Default to Chapter 1
    setActiveTab('reader');
  };

  const isAdLocked = currentChapter === 3 
                     && !(userTier.includes('Premium') || userTier.includes('Plus'))
                     && !unlockedAdChapters[3];

  const isPremiumLocked = currentChapter === 4 
                     && !userTier.includes('Premium');

  const handleSelectChapter = (chNum: number) => {
    setCurrentChapter(chNum);
    
    // Check if locked
    const nextAdLocked = chNum === 3 
                       && !(userTier.includes('Premium') || userTier.includes('Plus'))
                       && !unlockedAdChapters[3];
    const nextPremLocked = chNum === 4 
                       && !userTier.includes('Premium');
                       
    if (nextAdLocked || nextPremLocked) {
      setAccessModalVisible(true);
    }
  };

  const handleUpgradeRNSubscription = (tier: 'PLUS' | 'PREMIUM') => {
    setUserTier(tier === 'PREMIUM' ? 'Panelva Premium' : 'Panelva Plus');
    setAccessModalVisible(false);
    Alert.alert('Subscription Upgraded', `Thank you for upgrading to ${tier === 'PREMIUM' ? 'Panelva Premium' : 'Panelva Plus'}!`);
  };

  const handleUnlockRNWithAds = () => {
    setAccessModalVisible(false);
    setSimulatedAdPlaying(true);
    setAdTimer(5);
    
    const interval = setInterval(() => {
      setAdTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setSimulatedAdPlaying(false);
          setUnlockedAdChapters(prevUnlocks => ({ ...prevUnlocks, [3]: true }));
          Alert.alert('Unlocked Successfully', 'The chapter has been unlocked. Happy reading!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Redeem promo code
  const handleRedeemCode = () => {
    if (!promoCode.trim()) {
      Alert.alert('Error', 'Please enter a valid promotion code.');
      return;
    }
    const code = promoCode.trim().toUpperCase();
    if (code === 'PLUS500') {
      setUserCoins(prev => prev + 500);
      Alert.alert('Promo Redeemed', 'Successfully added 500 Virtual Coins to your wallet!');
    } else if (code === 'PREMIUMNOW') {
      setUserTier('Panelva Premium (VIP)');
      Alert.alert('Promo Redeemed', 'Your account has been upgraded to Panelva Premium VIP Tier!');
    } else {
      Alert.alert('Invalid Code', 'The code you entered is invalid or expired.');
    }
    setPromoCode('');
  };

  // Submit support ticket
  const handleSubmitIssue = () => {
    if (!issueDescription.trim()) {
      Alert.alert('Validation Failed', 'Please describe the problem.');
      return;
    }
    Alert.alert(
      'Issue Logged Successfully',
      `Your support ticket has been created!\nType: ${issueType}\nWe will contact you at notjud3@gmail.com.`
    );
    setIssueDescription('');
    setIssueModalVisible(false);
  };

  // Comment focus bottom sheet trigger
  const handleCommentInputFocus = () => {
    if (!agreeToRules) {
      setShowRulesSheet(true);
    }
  };

  // Agree and understand community guidelines
  const handleConfirmRulesAgreement = () => {
    setAgreeToRules(true);
    setShowRulesSheet(false);
  };

  // Post comment
  const handlePostComment = () => {
    if (!agreeToRules) {
      setShowRulesSheet(true);
      return;
    }
    if (!commentInputText.trim()) return;
    const newComment = {
      id: `c-${Date.now()}`,
      author: 'notjud3',
      tier: 'Premium',
      avatar: 'N',
      text: commentInputText,
      likes: 0,
      dislikes: 0,
      timeAgo: 'Just now'
    };
    setComments([newComment, ...comments]);
    setCommentInputText('');
  };

  // Report handling
  const handleOpenReport = (comment: any) => {
    setReportedComment(comment);
    setReportModalVisible(true);
  };

  const handleSubmitReport = () => {
    Alert.alert(
      'Report Submitted',
      `Thank you. The comment by "${reportedComment?.author}" was reported for violating the directive: "${selectedReportReason}". Our moderators will review this shortly.`
    );
    setReportModalVisible(false);
    setReportedComment(null);
  };

  // Simulated DRM download
  const handleOfflineDownload = () => {
    setDownloading(true);
    setDownloadProgress(0);
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloading(false);
          setDownloadedEpisodes(old => ({ ...old, [downloadTarget]: old[downloadTarget] ? false : true }));
          Alert.alert(
            'Secure Cache Sync',
            `Episode ${downloadTarget} downloaded and encrypted with AES-256 in app storage. Keys securely locked in Enclave.`
          );
          return 100;
        }
        return prev + 10;
      });
    }, 120);
  };

  // Filter series based on search queries
  const filteredSearchList = MOCK_SERIES.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.genre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenreTag === 'All' ? true : item.genre === selectedGenreTag;
    const matchesStatus = selectedStatusTag === 'All' ? true : item.status === selectedStatusTag;
    return matchesSearch && matchesGenre && matchesStatus;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* TOP UTILITY HEADER BAR */}
      {activeTab !== 'reader' && (
        <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerWordmark, { color: theme === 'dark' ? '#FFFFFF' : '#0D0D12' }]}>Panelva</Text>
          <View style={styles.headerRightButtons}>
            <TouchableOpacity 
              style={[styles.headerIconBtn, { backgroundColor: colors.border }]} 
              onPress={() => setSearchOverlayVisible(true)}
            >
              <Text style={{ fontSize: 16 }}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.headerIconBtn, { backgroundColor: colors.border }]} 
              onPress={handleToggleTheme}
            >
              <Text style={{ fontSize: 16 }}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MAIN VIEW CONTROLLER */}
      <View style={styles.mainContent}>

        {/* 🏠 TAB 1: HOME DASHBOARD FLOW */}
        {activeTab === 'home' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            
            {/* 1. Featured Hero Carousel */}
            <View style={styles.carouselContainer}>
              <View style={[styles.carouselCard, { backgroundColor: CAROUSEL_ITEMS[activeCarouselIndex].coverBg }]}>
                <View style={styles.carouselOverlay}>
                  <View style={styles.carouselBadgeRow}>
                    <View style={styles.genreBadge}>
                      <Text style={styles.genreBadgeText}>{CAROUSEL_ITEMS[activeCarouselIndex].type.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.genreBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                      <Text style={styles.genreBadgeText}>{CAROUSEL_ITEMS[activeCarouselIndex].genre}</Text>
                    </View>
                    <Text style={styles.carouselRating}>{CAROUSEL_ITEMS[activeCarouselIndex].rating}</Text>
                  </View>
                  <Text style={styles.carouselTitle}>{CAROUSEL_ITEMS[activeCarouselIndex].title}</Text>
                  <Text style={styles.carouselQuote}>{CAROUSEL_ITEMS[activeCarouselIndex].quote}</Text>
                  
                  <TouchableOpacity 
                    style={styles.carouselCtaBtn}
                    onPress={() => {
                      const series = MOCK_SERIES.find(s => s.id === CAROUSEL_ITEMS[activeCarouselIndex].id);
                      if (series) handleLaunchReader(series);
                    }}
                  >
                    <Text style={styles.carouselCtaText}>Read Now →</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Snap indicators / pagers */}
              <View style={styles.carouselPagination}>
                {CAROUSEL_ITEMS.map((item, idx) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.carouselDot, activeCarouselIndex === idx && styles.carouselDotActive]}
                    onPress={() => setActiveCarouselIndex(idx)}
                  />
                ))}
              </View>
            </View>

            {/* 2. Popular Today Section */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Popular Today</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularScrollTrack}>
                {MOCK_SERIES.slice(0, 5).map(item => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.popularCard, { backgroundColor: colors.panel, borderColor: colors.border }]}
                    onPress={() => handleLaunchReader(item)}
                  >
                    <View style={[styles.popularThumbnail, { backgroundColor: item.coverBg }]}>
                      <Text style={styles.popularBadgeText}>{item.type}</Text>
                    </View>
                    <Text style={[styles.popularTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.popularRating}>★ {item.rating}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 3. Contextual Banner Module */}
            <View style={[styles.bannerContainer, { backgroundColor: colors.panel, borderColor: colors.border }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.bannerTitle, { color: colors.text }]}>Need Help or Found an Issue?</Text>
                <Text style={[styles.bannerSubtitle, { color: colors.textMuted }]}>Report client crashes, billing delays, or styling bugs directly to devs.</Text>
              </View>
              <TouchableOpacity 
                style={styles.bannerCtaBtn}
                onPress={() => setIssueModalVisible(true)}
              >
                <Text style={styles.bannerCtaText}>Report Issue</Text>
              </TouchableOpacity>
            </View>

            {/* 4. Latest Releases Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>Latest Releases</Text>
                <View style={styles.releaseSegmentRow}>
                  <TouchableOpacity 
                    style={[styles.releaseSegmentBtn, latestReleaseToggle === 'hot' && styles.releaseSegmentBtnActive]}
                    onPress={() => setLatestReleaseToggle('hot')}
                  >
                    <Text style={[styles.releaseSegmentText, latestReleaseToggle === 'hot' && styles.releaseSegmentTextActive]}>Hot 🔥</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.releaseSegmentBtn, latestReleaseToggle === 'new' && styles.releaseSegmentBtnActive]}
                    onPress={() => setLatestReleaseToggle('new')}
                  >
                    <Text style={[styles.releaseSegmentText, latestReleaseToggle === 'new' && styles.releaseSegmentTextActive]}>New 🕒</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Vertical list view */}
              <View style={{ gap: 12, marginTop: 8 }}>
                {MOCK_SERIES.filter(s => latestReleaseToggle === 'hot' ? s.isHot : !s.isHot).slice(0, 4).map(item => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.mediaRow, { backgroundColor: colors.panel, borderColor: colors.border }]}
                    onPress={() => handleLaunchReader(item)}
                  >
                    {/* Left: Thumbnail with corner badge */}
                    <View style={[styles.mediaRowThumb, { backgroundColor: item.coverBg }]}>
                      <View style={styles.mediaRowBadge}>
                        <Text style={styles.mediaRowBadgeText}>{item.type}</Text>
                      </View>
                    </View>
                    
                    {/* Right: Info metadata */}
                    <View style={styles.mediaRowInfo}>
                      <View style={styles.mediaRowTitleRow}>
                        <Text style={[styles.mediaRowTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.mediaRowRating}>★ {item.rating}</Text>
                      </View>
                      <View style={styles.mediaRowMetaRow}>
                        <Text style={[styles.mediaRowStatusText, { color: colors.textMuted }]}>
                          <Text style={{ color: '#34c759' }}>🟢</Text> {item.status}
                        </Text>
                        <Text style={styles.mediaRowAuthor}>{item.author}</Text>
                      </View>
                      {/* Clickable Chapter stacks */}
                      <View style={styles.chapterStack}>
                        <Text style={styles.chapterStackText}>{item.chapters}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 5. Most Popular Leaderboard Section */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Most Popular Leaderboard</Text>
              <View style={[styles.leaderboardStack, { backgroundColor: colors.panel, borderColor: colors.border }]}>
                {MOCK_SERIES.slice(0, 10).map((item, idx) => {
                  const rankStyles = [
                    styles.rankNumberText,
                    idx === 0 ? { color: '#FFD700', fontSize: 24, fontWeight: '900' as const } : null,
                    idx === 1 ? { color: '#C0C0C0', fontSize: 22, fontWeight: '900' as const } : null,
                    idx === 2 ? { color: '#CD7F32', fontSize: 20, fontWeight: '900' as const } : null,
                  ].filter(Boolean) as any;
                  return (
                    <TouchableOpacity 
                      key={item.id} 
                      style={[styles.leaderboardRow, { borderBottomColor: colors.border }]}
                      onPress={() => handleLaunchReader(item)}
                    >
                      <View style={styles.rankContainer}>
                        <Text style={rankStyles}>{idx + 1}</Text>
                      </View>
                      <View style={[styles.leaderboardThumb, { backgroundColor: item.coverBg }]} />
                      
                      <View style={{ flex: 1, paddingLeft: 12 }}>
                        <Text style={[styles.leaderboardTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                          <View style={[styles.miniBadge, { backgroundColor: colors.border }]}>
                            <Text style={[styles.miniBadgeText, { color: colors.textMuted }]}>{item.genre}</Text>
                          </View>
                          <View style={[styles.miniBadge, { backgroundColor: colors.border }]}>
                            <Text style={[styles.miniBadgeText, { color: colors.textMuted }]}>{item.type}</Text>
                          </View>
                        </View>
                      </View>
                      
                      <Text style={styles.leaderboardViews}>{item.views}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Extra padding at bottom for navigation bar */}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* 📚 TAB 2: COMICS GRID VIEW */}
        {activeTab === 'comics' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.gridHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Comics Graphic Feed</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Browse illustrative series</Text>
            </View>
            
            <View style={styles.gridContainer}>
              {MOCK_SERIES.filter(s => s.type !== 'NOVEL').map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.gridCard, { backgroundColor: colors.panel, borderColor: colors.border }]}
                  onPress={() => handleLaunchReader(item)}
                >
                  <View style={[styles.gridThumbnail, { backgroundColor: item.coverBg }]}>
                    <Text style={styles.popularBadgeText}>{item.genre}</Text>
                  </View>
                  <View style={{ padding: 8 }}>
                    <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{item.author}</Text>
                    <Text style={styles.gridRating}>★ {item.rating}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* 📖 TAB 3: NOVELS CATALOG VIEW */}
        {activeTab === 'novels' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.gridHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Light Novels Catalog</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Light novels and text fiction</Text>
            </View>

            <View style={{ paddingHorizontal: 16, gap: 12 }}>
              {MOCK_SERIES.filter(s => s.type === 'NOVEL').map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.novelRowItem, { backgroundColor: colors.panel, borderColor: colors.border }]}
                  onPress={() => handleLaunchReader(item)}
                >
                  <View style={[styles.novelRowThumb, { backgroundColor: item.coverBg }]} />
                  <View style={{ flex: 1, paddingLeft: 12 }}>
                    <Text style={[styles.novelRowTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>By {item.author} &bull; {item.views} reads</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                      <View style={[styles.miniBadge, { backgroundColor: colors.border }]}>
                        <Text style={{ color: colors.textMuted, fontSize: 10 }}>Novel</Text>
                      </View>
                      <View style={[styles.miniBadge, { backgroundColor: colors.border }]}>
                        <Text style={{ color: colors.textMuted, fontSize: 10 }}>{item.genre}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.novelRowRating, { color: colors.accent }]}>★ {item.rating}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* 🔔 TAB 4: NOTIFICATIONS FEED */}
        {activeTab === 'notifications' && (
          <View style={{ flex: 1 }}>
            {/* Segment Tab Selection */}
            <View style={[styles.notifTabBar, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.notifTabBtn, notifSegment === 'updates' && { borderBottomColor: colors.accent }]}
                onPress={() => setNotifSegment('updates')}
              >
                <Text style={[styles.notifTabText, { color: notifSegment === 'updates' ? colors.accent : colors.textMuted }]}>
                  Direct Updates
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.notifTabBtn, notifSegment === 'announcements' && { borderBottomColor: colors.accent }]}
                onPress={() => setNotifSegment('announcements')}
              >
                <Text style={[styles.notifTabText, { color: notifSegment === 'announcements' ? colors.accent : colors.textMuted }]}>
                  Announcements
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.notifTabBtn, notifSegment === 'invitations' && { borderBottomColor: colors.accent }]}
                onPress={() => setNotifSegment('invitations')}
              >
                <Text style={[styles.notifTabText, { color: notifSegment === 'invitations' ? colors.accent : colors.textMuted }]}>
                  Invites ({mobileInvitations.filter(i => i.status === 'PENDING').length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Notification Lists */}
            <ScrollView style={{ flex: 1, padding: 16 }}>
              {notifSegment === 'invitations' ? (
                mobileInvitations.map(item => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.notifCard, { backgroundColor: colors.panel, borderColor: colors.border }]}
                    onPress={() => item.status === 'PENDING' && setActiveMobileInvitation(item)}
                  >
                    <View style={styles.notifHeaderRow}>
                      <Text style={[styles.notifTitle, { color: colors.accent, fontWeight: 'bold' }]}>
                        Collab Invitation
                      </Text>
                      <Text style={[styles.notifTime, { color: item.status === 'PENDING' ? '#f59e0b' : item.status === 'ACCEPTED' ? '#34c759' : '#ff3b30', fontWeight: 'bold', fontSize: 11 }]}>
                        {item.status}
                      </Text>
                    </View>
                    <Text style={[styles.notifContent, { color: colors.text, fontWeight: 'bold', marginTop: 4 }]}>
                      {item.seriesTitle}
                    </Text>
                    <Text style={[styles.notifContent, { color: colors.textMuted }]}>
                      Invited by @{item.senderName} to join as {item.role} ({item.shareRatio}% split).
                    </Text>
                    {item.status === 'PENDING' && (
                      <Text style={{ color: colors.accent, fontSize: 11, fontWeight: 'bold', marginTop: 8 }}>
                        👉 Tap to review proposal & respond
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                MOCK_NOTIFICATIONS[notifSegment as 'updates' | 'announcements'].map(item => (
                  <View key={item.id} style={[styles.notifCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
                    <View style={styles.notifHeaderRow}>
                      <Text style={[styles.notifTitle, { color: colors.text }]}>{item.title}</Text>
                      <Text style={styles.notifTime}>{item.time}</Text>
                    </View>
                    <Text style={[styles.notifContent, { color: colors.textMuted }]}>{item.content}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        )}

        {/* ⋯ TAB 5: USER HUB ("MORE" TAB) */}
        {activeTab === 'more' && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 16 }}>
            
            {/* 1. Profile Profile Snapshot */}
            <View style={[styles.profileCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
              <View style={styles.profileAvatarContainer}>
                <Text style={styles.profileAvatarText}>N</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileUsername, { color: colors.text }]}>notjud3</Text>
                <View style={styles.profileBadgeRow}>
                  <View style={[styles.tierLabelBadge, { backgroundColor: 'rgba(108, 92, 231, 0.15)' }]}>
                    <Text style={[styles.tierLabelText, { color: colors.accent }]}>{userTier}</Text>
                  </View>
                </View>
                <Text style={[styles.walletLabelText, { color: colors.textMuted }]}>
                  Virtual Balance: <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>🪙 {userCoins} Tokens</Text>
                </Text>
              </View>
            </View>

            {/* 2. Account Settings Menu */}
            <Text style={[styles.userHubSectionTitle, { color: colors.text }]}>Account Settings</Text>
            <View style={[styles.hubListMenu, { backgroundColor: colors.panel, borderColor: colors.border }]}>
              <TouchableOpacity style={[styles.hubMenuItem, { borderBottomColor: colors.border }]} onPress={() => Alert.alert('Profile Settings', 'Modify bio, avatar, linked social, and credentials.')}>
                <Text style={[styles.hubMenuLabel, { color: colors.text }]}>👤 Profile Settings</Text>
                <Text style={{ color: colors.textMuted }}>❯</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hubMenuItem} onPress={() => Alert.alert('Subscription & Passes', 'Current Status: Panelva Plus\nDuration: Lifetime Premium pass active.')}>
                <Text style={[styles.hubMenuLabel, { color: colors.text }]}>🎫 Subscription & Passes</Text>
                <Text style={{ color: colors.textMuted }}>❯</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Economy & Claims Section */}
            <Text style={[styles.userHubSectionTitle, { color: colors.text }]}>Economy & Claims</Text>
            <View style={[styles.hubListMenu, { backgroundColor: colors.panel, borderColor: colors.border, padding: 12 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Redeem Promotional Codes</Text>
              <View style={styles.redeemRow}>
                <TextInput 
                  style={[styles.input, { flex: 1, backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]} 
                  placeholder="Enter code (e.g. PLUS500)"
                  placeholderTextColor={colors.textMuted}
                  value={promoCode}
                  onChangeText={setPromoCode}
                />
                <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeemCode}>
                  <Text style={styles.redeemBtnText}>Redeem</Text>
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>Tip: Use promo code "PLUS500" for free coins or "PREMIUMNOW" for tier upgrades.</Text>
              </View>
            </View>

            {/* 4. Support Framework */}
            <Text style={[styles.userHubSectionTitle, { color: colors.text }]}>Support Framework</Text>
            <View style={[styles.hubListMenu, { backgroundColor: colors.panel, borderColor: colors.border }]}>
              <TouchableOpacity style={[styles.hubMenuItem, { borderBottomColor: colors.border }]} onPress={() => Alert.alert('App Preferences', 'Cache Capacity: 256MB/512MB Max\nNotifications: Enabled\nDownload Path: /storage/emulated/0/Android/data/com.panelva.mobile/files/')}>
                <Text style={[styles.hubMenuLabel, { color: colors.text }]}>⚙️ App Preferences</Text>
                <Text style={{ color: colors.textMuted }}>❯</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hubMenuItem} onPress={() => setIssueModalVisible(true)}>
                <Text style={[styles.hubMenuLabel, { color: colors.text }]}>🛠️ Help Desk & Ticket Pipeline</Text>
                <Text style={{ color: colors.textMuted }}>❯</Text>
              </TouchableOpacity>
            </View>

            {/* 5. Developer & Legacy Portals Simulation */}
            <Text style={[styles.userHubSectionTitle, { color: colors.accent }]}>Developer Simulation Panels</Text>
            <View style={[styles.hubListMenu, { backgroundColor: colors.panel, borderColor: colors.border }]}>
              <TouchableOpacity style={[styles.hubMenuItem, { borderBottomColor: colors.border }]} onPress={() => setActiveTab('creator_studio')}>
                <Text style={[styles.hubMenuLabel, { color: colors.text }]}>🎨 Creator Studio Simulation</Text>
                <Text style={{ color: colors.accent }}>Launch ❯</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.hubMenuItem, { borderBottomColor: colors.border }]} onPress={() => setActiveTab('admin_panel')}>
                <Text style={[styles.hubMenuLabel, { color: colors.text }]}>🛡️ Admin Application Vetting</Text>
                <Text style={{ color: colors.accent }}>Launch ❯</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hubMenuItem} onPress={() => setActiveTab('drm_manager')}>
                <Text style={[styles.hubMenuLabel, { color: colors.text }]}>🔒 DRM & AES-256 Storage Manager</Text>
                <Text style={{ color: colors.accent }}>Launch ❯</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* 📱 TAB 6: COMIC/NOVEL READER SCREEN */}
        {activeTab === 'reader' && (
          <View style={{ flex: 1 }}>
            
            {/* Header toolbar */}
            <View style={[styles.readerHeader, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
              <TouchableOpacity style={styles.readerBackBtn} onPress={() => setActiveTab('home')}>
                <Text style={{ color: colors.text, fontSize: 16 }}>◀ Return</Text>
              </TouchableOpacity>
              <Text style={[styles.readerTitleText, { color: colors.text }]} numberOfLines={1}>
                {selectedSeries?.title}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity 
                  style={[styles.miniBtn, readerFormat === 'comic' && styles.activeMiniBtn]} 
                  onPress={() => setReaderFormat('comic')}
                >
                  <Text style={styles.miniBtnText}>Comic</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.miniBtn, readerFormat === 'novel' && styles.activeMiniBtn]} 
                  onPress={() => setReaderFormat('novel')}
                >
                  <Text style={styles.miniBtnText}>Prose</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Scrollable reading area */}
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              
              {/* Chapter Selection Bar */}
              <View style={{ backgroundColor: colors.panel, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
                  {[1, 2, 3, 4].map(chNum => {
                    let badge = 'Free';
                    if (chNum === 3) badge = '🎬 Ads';
                    if (chNum === 4) badge = '👑 Premium';
                    const isSelected = currentChapter === chNum;
                    return (
                      <TouchableOpacity
                        key={chNum}
                        onPress={() => handleSelectChapter(chNum)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 6,
                          borderRadius: 20,
                          backgroundColor: isSelected ? colors.accent : colors.bg,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.accent : colors.border,
                          alignItems: 'center',
                          flexDirection: 'row',
                          gap: 4
                        }}
                      >
                        <Text style={{ color: isSelected ? '#FFFFFF' : colors.text, fontWeight: 'bold', fontSize: 12 }}>
                          Ch {chNum}
                        </Text>
                        <Text style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textMuted, fontSize: 10 }}>
                          ({badge})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {isAdLocked || isPremiumLocked ? (
                <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                  <Text style={{ fontSize: 60, marginBottom: 20 }}>{isPremiumLocked ? '👑' : '📺'}</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 10 }}>
                    {isPremiumLocked ? 'Episode Locked (Premium Exclusive)' : 'Episode Locked (Ad-Supported)'}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 18 }}>
                    {isPremiumLocked 
                      ? 'This chapter is exclusive to Panelva Premium subscribers. Upgrade your subscription to read instantly!' 
                      : 'This chapter belongs to the Ad-Unlockable tier. Watch a short rewarded video or go Premium for instant access!'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setAccessModalVisible(true)}
                    style={{
                      backgroundColor: colors.accent,
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>Unlock Chapter</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Visual Panel Scroller / Text Prose */
                readerFormat === 'comic' ? (
                  <View style={styles.comicReaderContainer}>
                    <View style={[styles.comicPanelBg, { backgroundColor: '#2c2c35' }]}>
                      <Text style={styles.comicPanelLabel}>[ Comic Strip Visual Frame 1 ]</Text>
                    </View>
                    <View style={[styles.comicPanelBg, { backgroundColor: '#1c1c24' }]}>
                      <Text style={styles.comicPanelLabel}>[ Comic Strip Visual Frame 2 ]</Text>
                    </View>
                    <View style={[styles.comicPanelBg, { backgroundColor: '#0d0d12' }]}>
                      <Text style={styles.comicPanelLabel}>[ Comic Strip Visual Frame 3 ]</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.novelReaderContainer}>
                    <Text style={styles.novelTitleText}>Chapter {currentChapter}: {currentChapter === 1 ? 'The Encounter' : currentChapter === 2 ? 'Secrets Unveiled' : currentChapter === 3 ? 'A Shadow Arises' : 'The Final Frontier'}</Text>
                    <Text style={styles.novelParagraphText}>
                      The rain beat relentlessly against the windowpane, throwing long, eerie shadows across the wooden floor. 
                      Elian looked at the scroll clutched in his hand, the ink dissolving into black patterns under his sweat.
                    </Text>
                    <Text style={styles.novelParagraphText}>
                      "This isn't how it was supposed to go," he whispered to the silence of the room. The contract lay broken, and with it, the only seal that could bind the entities returning from the void.
                    </Text>
                  </View>
                )
              )}

              {/* COMMUNTIY COMMENT SYSTEM */}
              <View style={[styles.commentsSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.commentsSectionTitle, { color: colors.text }]}>Comments ({comments.length})</Text>
                
                {/* Guidelines Consent notification banner */}
                {!agreeToRules && (
                  <View style={[styles.agreementWarnBanner, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: '#f59e0b' }]}>
                    <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: 'bold' }}>⚠️ Action Required</Text>
                    <Text style={{ color: colors.text, fontSize: 12, marginTop: 2 }}>You must agree to community safety directives before writing comments.</Text>
                    <TouchableOpacity style={styles.readRulesBannerBtn} onPress={() => setShowRulesSheet(true)}>
                      <Text style={{ color: '#0D0D12', fontSize: 11, fontWeight: 'bold' }}>Review & Agree</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Comment Text Entry Node */}
                <View style={styles.commentInputBox}>
                  <TextInput 
                    style={[styles.input, { flex: 1, backgroundColor: colors.panel, color: colors.text, borderColor: colors.border }]}
                    placeholder={agreeToRules ? "Write a reply..." : "Remember to keep it respectful and follow community guidelines..."}
                    placeholderTextColor={colors.textMuted}
                    onFocus={handleCommentInputFocus}
                    value={commentInputText}
                    onChangeText={setCommentInputText}
                  />
                  <TouchableOpacity 
                    style={[styles.commentSendBtn, { backgroundColor: commentInputText.trim() ? colors.accent : colors.border }]}
                    onPress={handlePostComment}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' }}>Send</Text>
                  </TouchableOpacity>
                </View>

                {/* Comments List */}
                <View style={{ gap: 14, marginTop: 16 }}>
                  {comments.map(c => (
                    <View key={c.id} style={[styles.commentCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
                      <View style={styles.commentHeader}>
                        <View style={styles.commentAvatar}>
                          <Text style={styles.commentAvatarText}>{c.avatar}</Text>
                        </View>
                        <View style={{ flex: 1, paddingLeft: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.commentAuthor, { color: colors.text }]}>{c.author}</Text>
                            <View style={styles.tierMiniBadge}>
                              <Text style={styles.tierMiniBadgeText}>{c.tier.toUpperCase()}</Text>
                            </View>
                          </View>
                          <Text style={styles.commentTime}>{c.timeAgo}</Text>
                        </View>
                        {/* Report dots menu trigger */}
                        <TouchableOpacity style={styles.reportMenuDots} onPress={() => handleOpenReport(c)}>
                          <Text style={{ color: colors.textMuted, fontSize: 16, fontWeight: 'bold' }}>⋯</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <Text style={[styles.commentContent, { color: colors.text }]}>{c.text}</Text>
                      
                      <View style={styles.commentActions}>
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>👍 {c.likes}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>👎 {c.dislikes}</Text>
                        <Text style={{ color: colors.accent, fontSize: 12 }}>Reply</Text>
                      </View>
                    </View>
                  ))}
                </View>

              </View>

              {/* Bottom scroll padding */}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        )}

        {/* 🎨 LEGACY SIMULATION 1: CREATOR STUDIO */}
        {activeTab === 'creator_studio' && (
          <ScrollView style={{ padding: 16 }}>
            <View style={styles.simHeaderRow}>
              <TouchableOpacity onPress={() => setActiveTab('more')} style={styles.simBackBtn}>
                <Text style={{ color: colors.accent }}>◀ Back to User Hub</Text>
              </TouchableOpacity>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Creator Studio Simulation</Text>
            </View>

            <View style={[styles.statsCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
              <Text style={[styles.statsText, { color: colors.text }]}>Pen Name: {stats.penName}</Text>
              <Text style={[styles.statsText, { color: colors.text }]}>Followers: {stats.followers}</Text>
              <Text style={[styles.statsText, { color: colors.text }]}>Views: {stats.views} / 100,000</Text>
            </View>

            <View style={[styles.uploadCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.text }]}>Chapter Title</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]} 
                placeholder="Enter title (e.g. Chapter 12: Escape)"
                placeholderTextColor={colors.textMuted}
                value={chapterTitle}
                onChangeText={setChapterTitle}
              />

              <Text style={[styles.label, { color: colors.text }]}>Wait-For-Free (7 Day Drop)</Text>
              <View style={[styles.switchRow, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>
                  {waitForFree ? 'Enabled (Tier drops every 7 days)' : 'Disabled (Permanent Paywall)'}
                </Text>
                <Switch 
                  value={waitForFree} 
                  onValueChange={setWaitForFree}
                  trackColor={{ false: '#3a3a3c', true: '#6c5ce7' }}
                />
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Pricing Tier</Text>
              <View style={styles.tierGrid}>
                {['FREE', 'AD_SUPPORTED', 'PREMIUM'].map(t => (
                  <TouchableOpacity 
                    key={t}
                    style={[styles.tierBtn, priceTier === t && styles.activeTierBtn]}
                    onPress={() => setPriceTier(t)}
                  >
                    <Text style={styles.tierBtnText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={() => {
                if (!chapterTitle.trim()) {
                  Alert.alert('Validation Error', 'Please enter a chapter title');
                  return;
                }
                Alert.alert('Upload Success', `Chapter uploaded!\nTitle: ${chapterTitle}\nTier: ${priceTier}\nWait-For-Free: ${waitForFree ? '7 Days' : 'Locked'}`);
                setChapterTitle('');
              }}>
                <Text style={styles.primaryBtnText}>Publish New Chapter</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* 🛡️ LEGACY SIMULATION 2: ADMIN VETTING PANEL */}
        {activeTab === 'admin_panel' && (
          <View style={{ flex: 1, padding: 16 }}>
            <View style={styles.simHeaderRow}>
              <TouchableOpacity onPress={() => setActiveTab('more')} style={styles.simBackBtn}>
                <Text style={{ color: colors.accent }}>◀ Back to User Hub</Text>
              </TouchableOpacity>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Admin Applications Vetting</Text>
            </View>

            <ScrollView style={{ flex: 1 }}>
              {applications.map(app => (
                <View key={app.id} style={[styles.appCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
                  <Text style={[styles.appTitle, { color: colors.text }]}>{app.penName} ({app.type})</Text>
                  <Text style={[styles.appText, { color: colors.textMuted }]}>{app.bio}</Text>
                  <Text style={styles.portfolioLink}>{app.portfolioUrl}</Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: '#34c759' }]} 
                      onPress={() => {
                        setApplications(prev => prev.filter(a => a.id !== app.id));
                        Alert.alert('Vetting Completed', `Approved Creator application for ${app.penName}`);
                      }}
                    >
                      <Text style={styles.actionBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: '#ff3b30' }]} 
                      onPress={() => {
                        setApplications(prev => prev.filter(a => a.id !== app.id));
                        Alert.alert('Vetting Completed', `Denied Creator application for ${app.penName}`);
                      }}
                    >
                      <Text style={styles.actionBtnText}>Deny</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {applications.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No pending creator applications in the mobile queue.</Text>
              )}
            </ScrollView>
          </View>
        )}

        {/* 🔒 LEGACY SIMULATION 3: DRM MANAGER */}
        {activeTab === 'drm_manager' && (
          <ScrollView style={{ padding: 16 }}>
            <View style={styles.simHeaderRow}>
              <TouchableOpacity onPress={() => setActiveTab('more')} style={styles.simBackBtn}>
                <Text style={{ color: colors.accent }}>◀ Back to User Hub</Text>
              </TouchableOpacity>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>DRM Offline Storage Manager</Text>
            </View>

            <View style={[styles.statsCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
              <Text style={{ color: '#34c759', fontWeight: 'bold' }}>🔒 AES-256 Encryption at Rest</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                Content pages are stored in app-private containers. Key handles are locked in the Keychain / Secure Enclave.
              </Text>
            </View>

            <View style={[styles.uploadCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.text }]}>Choose Episode to Cache Offline</Text>
              <View style={styles.tierGrid}>
                {[1, 2, 3].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.tierBtn, downloadTarget === num && styles.activeTierBtn]}
                    onPress={() => setDownloadTarget(num)}
                  >
                    <Text style={styles.tierBtnText}>Episode {num}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {downloading ? (
                <View style={{ marginTop: 20 }}>
                  <Text style={{ color: colors.text, fontSize: 13, marginBottom: 8 }}>
                    Downloading asset blobs: {downloadProgress}%
                  </Text>
                  <View style={{ height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ width: `${downloadProgress}%`, height: '100%', backgroundColor: colors.accent }} />
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.primaryBtn} onPress={handleOfflineDownload}>
                  <Text style={styles.primaryBtnText}>
                    {downloadedEpisodes[downloadTarget] ? "Decrypt & Remove" : "Secure Download Offline"}
                  </Text>
                </TouchableOpacity>
              )}

              {downloadedEpisodes[downloadTarget] && (
                <View style={[styles.drmPathCard, { backgroundColor: 'rgba(52, 199, 89, 0.08)' }]}>
                  <Text style={{ color: '#34c759', fontWeight: 'bold', fontSize: 13 }}>✓ Securely Cached & Encrypted</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>Key Handle: enclave_aes_key_ep_{downloadTarget}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>Path: /data/user/0/panelva/files/secure_ep_{downloadTarget}.bin</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}

      </View>

      {/* PERSISTENT FIXED SAFE-AREA BOTTOM NAVIGATION BAR */}
      {activeTab !== 'reader' && (
        <View style={[styles.navBar, { backgroundColor: colors.header, borderTopColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.navItem, activeTab === 'comics' && styles.activeNavItem]} 
            onPress={() => setActiveTab('comics')}
          >
            <Text style={styles.navIcon}>📚</Text>
            <Text style={[styles.navText, { color: activeTab === 'comics' ? colors.accent : colors.textMuted }]}>Comics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, activeTab === 'novels' && styles.activeNavItem]} 
            onPress={() => setActiveTab('novels')}
          >
            <Text style={styles.navIcon}>📖</Text>
            <Text style={[styles.navText, { color: activeTab === 'novels' ? colors.accent : colors.textMuted }]}>Novels</Text>
          </TouchableOpacity>

          {/* Home Center Weighted Icon */}
          <TouchableOpacity 
            style={[styles.navItem, styles.homeCenterNavItem]} 
            onPress={() => {
              setActiveTab('home');
              setActiveCarouselIndex(0);
            }}
          >
            <View style={[styles.homeCenterIconWrapper, { backgroundColor: colors.accent }]}>
              <Text style={{ fontSize: 24, color: '#FFFFFF' }}>🏠</Text>
            </View>
            <Text style={[styles.navText, { color: activeTab === 'home' ? colors.accent : colors.textMuted, marginTop: 2 }]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navItem, activeTab === 'notifications' && styles.activeNavItem]} 
            onPress={() => setActiveTab('notifications')}
          >
            <Text style={styles.navIcon}>🔔</Text>
            <Text style={[styles.navText, { color: activeTab === 'notifications' ? colors.accent : colors.textMuted }]}>Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navItem, activeTab === 'more' && styles.activeNavItem]} 
            onPress={() => setActiveTab('more')}
          >
            <Text style={styles.navIcon}>⋯</Text>
            <Text style={[styles.navText, { color: activeTab === 'more' ? colors.accent : colors.textMuted }]}>More</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 🔍 FULL SCREEN SEARCH OVERLAY WITH CATEGORIES/STATUS TAGS */}
      <Modal
        visible={searchOverlayVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSearchOverlayVisible(false)}
      >
        <SafeAreaView style={[styles.searchOverlayContainer, { backgroundColor: colors.bg }]}>
          <View style={[styles.searchHeader, { borderBottomColor: colors.border }]}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.panel, color: colors.text, borderColor: colors.border }]}
              placeholder="Search by title, author, or genre..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity 
              style={[styles.searchCloseBtn, { backgroundColor: colors.border }]} 
              onPress={() => {
                setSearchOverlayVisible(false);
                setSearchQuery('');
              }}
            >
              <Text style={{ color: colors.text, fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Search Filters Row */}
          <View style={styles.searchFilterSection}>
            <Text style={[styles.filterHeading, { color: colors.text }]}>Genres:</Text>
            <View style={styles.tagFilterRow}>
              {['All', 'Romance', 'Fantasy', 'Action', 'Shoujo', 'Comedy'].map(g => (
                <TouchableOpacity 
                  key={g} 
                  style={[styles.filterTagBtn, selectedGenreTag === g && { backgroundColor: colors.accent }]}
                  onPress={() => setSelectedGenreTag(g)}
                >
                  <Text style={[styles.filterTagText, { color: selectedGenreTag === g ? '#FFF' : colors.text }]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterHeading, { color: colors.text, marginTop: 12 }]}>Status:</Text>
            <View style={styles.tagFilterRow}>
              {['All', 'Ongoing', 'Completed'].map(s => (
                <TouchableOpacity 
                  key={s} 
                  style={[styles.filterTagBtn, selectedStatusTag === s && { backgroundColor: colors.accent }]}
                  onPress={() => setSelectedStatusTag(s)}
                >
                  <Text style={[styles.filterTagText, { color: selectedStatusTag === s ? '#FFF' : colors.text }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Search results list */}
          <ScrollView style={{ flex: 1, padding: 16 }}>
            <Text style={[styles.searchResultTitle, { color: colors.text }]}>Results ({filteredSearchList.length})</Text>
            {filteredSearchList.map(item => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.searchResultRow, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setSearchOverlayVisible(false);
                  handleLaunchReader(item);
                }}
              >
                <View style={[styles.searchResultThumb, { backgroundColor: item.coverBg }]} />
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <Text style={[styles.searchResultTitleText, { color: colors.text }]}>{item.title}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{item.author} &bull; {item.genre}</Text>
                  <Text style={{ color: colors.accent, fontSize: 11, fontWeight: 'bold', marginTop: 4 }}>{item.type}</Text>
                </View>
                <Text style={{ color: colors.textMuted }}>➔</Text>
              </TouchableOpacity>
            ))}
            {filteredSearchList.length === 0 && (
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>No matching series found.</Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 🛠️ NATIVE ISSUE REPORT MODAL */}
      <Modal
        visible={issueModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIssueModalVisible(false)}
      >
        <View style={styles.modalBgDim}>
          <View style={[styles.modalCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Native Support Desk Ticket</Text>
              <TouchableOpacity onPress={() => setIssueModalVisible(false)}>
                <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Select Issue Category</Text>
            <View style={styles.tierGrid}>
              {['Bug Report', 'Billing Issue', 'Styling Glitch', 'Creator Inquiry'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.tierBtn, issueType === type && styles.activeTierBtn]}
                  onPress={() => setIssueType(type)}
                >
                  <Text style={styles.tierBtnText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Describe the Problem</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
              multiline
              numberOfLines={4}
              placeholder="Provide a detailed description of what happened..."
              placeholderTextColor={colors.textMuted}
              value={issueDescription}
              onChangeText={setIssueDescription}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitIssue}>
              <Text style={styles.primaryBtnText}>Submit Support Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 📜 SYSTEM RULES/GUIDELINES BOTTOM SHEET MODAL */}
      <Modal
        visible={showRulesSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRulesSheet(false)}
      >
        <View style={styles.bottomSheetBgDim}>
          <View style={[styles.bottomSheetContainer, { backgroundColor: colors.panel }]}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.dragBar} />
              <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>Panelva Community Guidelines</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                Please review and accept our rules before commenting.
              </Text>
            </View>

            <ScrollView style={styles.bottomSheetScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.rulesList}>
                <View style={styles.ruleBulletRow}>
                  <Text style={styles.ruleBulletNum}>1</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ruleTitle, { color: colors.text }]}>Be Respectful</Text>
                    <Text style={[styles.ruleDesc, { color: colors.textMuted }]}>
                      No harassment, threats, hate speech, racism, sexism, or abusive profile contents. Personal attacks are strictly banned.
                    </Text>
                  </View>
                </View>

                <View style={styles.ruleBulletRow}>
                  <Text style={styles.ruleBulletNum}>2</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ruleTitle, { color: colors.text }]}>Keep Comments Clean</Text>
                    <Text style={[styles.ruleDesc, { color: colors.textMuted }]}>
                      No pornography, explicit sexual images, gore, suggestive baits, or sexualization of minors.
                    </Text>
                  </View>
                </View>

                <View style={styles.ruleBulletRow}>
                  <Text style={styles.ruleBulletNum}>3</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ruleTitle, { color: colors.text }]}>Stay On Topic</Text>
                    <Text style={[styles.ruleDesc, { color: colors.textMuted }]}>
                      Discuss the chapter or series. No trolling, political fights, derailments, or spoiler baits.
                    </Text>
                  </View>
                </View>

                <View style={styles.ruleBulletRow}>
                  <Text style={styles.ruleBulletNum}>4</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ruleTitle, { color: colors.text }]}>Do Not Abuse Platform</Text>
                    <Text style={[styles.ruleDesc, { color: colors.textMuted }]}>
                      No advertising, referral spamming, premium begging, mini-modding, or moderation bypasses.
                    </Text>
                  </View>
                </View>

                <View style={styles.ruleBulletRow}>
                  <Text style={styles.ruleBulletNum}>5</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ruleTitle, { color: colors.text }]}>English Only</Text>
                    <Text style={[styles.ruleDesc, { color: colors.textMuted }]}>
                      All remarks must be in English for moderation integrity.
                    </Text>
                  </View>
                </View>

                <View style={styles.ruleBulletRow}>
                  <Text style={styles.ruleBulletNum}>6</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ruleTitle, { color: colors.text }]}>Enforcement Rules</Text>
                    <Text style={[styles.ruleDesc, { color: colors.textMuted }]}>
                      We may strip accounts, ban IPs, or lock profiles, including alternate evasion accounts.
                    </Text>
                  </View>
                </View>

                <View style={styles.ruleBulletRow}>
                  <Text style={styles.ruleBulletNum}>7</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ruleTitle, { color: colors.text }]}>Common Sense</Text>
                    <Text style={[styles.ruleDesc, { color: colors.textMuted }]}>
                      Moderators may sanction disruptive behaviors that are not explicitly documented above.
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.agreeCtaBtn} onPress={handleConfirmRulesAgreement}>
                <Text style={styles.agreeCtaBtnText}>I Agree & Understand</Text>
              </TouchableOpacity>
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🛡️ MODERATION COMMENT REPORT MODAL */}
      <Modal
        visible={reportModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalBgDim}>
          <View style={[styles.modalCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Report Offensive Remark</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 12 }}>
              Choose the directive violated by the comment of "{reportedComment?.author}":
            </Text>

            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {[
                'Be Respectful',
                'Keep Comments Clean',
                'Stay On Topic',
                'Do Not Abuse Platform',
                'English Only',
                'Enforcement Rules',
                'Common Sense'
              ].map(reason => (
                <TouchableOpacity 
                  key={reason} 
                  style={styles.reportReasonRow} 
                  onPress={() => setSelectedReportReason(reason)}
                >
                  <View style={[styles.reportRadioCircle, { borderColor: colors.accent }]}>
                    {selectedReportReason === reason && <View style={[styles.reportRadioInner, { backgroundColor: colors.accent }]} />}
                  </View>
                  <Text style={[styles.reportReasonText, { color: colors.text }]}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitReport}>
              <Text style={styles.primaryBtnText}>Submit Abuse Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Content Access Modal component */}
      <ContentAccessModal
        visible={accessModalVisible}
        onClose={() => setAccessModalVisible(false)}
        accessType={isPremiumLocked ? 'PREMIUM' : 'AD_SUPPORTED'}
        seriesTitle={selectedSeries?.title || 'Series'}
        chapterTitle={`Chapter ${currentChapter}`}
        onUnlockWithAds={handleUnlockRNWithAds}
        onUpgradeSubscription={handleUpgradeRNSubscription}
        colors={colors}
      />

      {/* Simulated Rewarded Ad Player */}
      <Modal visible={simulatedAdPlaying} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 40, marginBottom: 20 }}>🎬</Text>
          <Text style={{ fontSize: 18, color: '#FFFFFF', fontWeight: 'bold', marginBottom: 8 }}>
            Sponsor Advertisement Streaming
          </Text>
          <Text style={{ fontSize: 14, color: '#8E8E9F', textAlign: 'center', marginBottom: 30 }}>
            Please watch this video completely to unlock Chapter {currentChapter}.
          </Text>
          <View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#7c3aed', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#7c3aed', fontSize: 20, fontWeight: 'bold' }}>{adTimer}s</Text>
          </View>
        </View>
      </Modal>

      {/* Collaboration Proposal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!activeMobileInvitation}
        onRequestClose={() => setActiveMobileInvitation(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Collaboration Details</Text>
              <TouchableOpacity onPress={() => setActiveMobileInvitation(null)}>
                <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              {/* Series Title & Role */}
              <Text style={{ color: colors.accent, fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' }}>
                {activeMobileInvitation?.genre}
              </Text>
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 20, marginVertical: 4 }}>
                {activeMobileInvitation?.seriesTitle}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>
                {activeMobileInvitation?.description}
              </Text>

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />

              {/* Role Details */}
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>Proposed Role</Text>
              <Text style={{ color: colors.accent, fontWeight: 'bold', fontSize: 16, marginTop: 2 }}>
                {activeMobileInvitation?.role}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 16 }}>
                {activeMobileInvitation?.roleDescription}
              </Text>

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />

              {/* Splits Breakdown */}
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>Revenue Share Details</Text>
              <Text style={{ color: '#34c759', fontWeight: 'bold', fontSize: 18, marginTop: 2 }}>
                {activeMobileInvitation?.shareRatio}% Split Ratio
              </Text>

              <View style={{ backgroundColor: colors.bg, padding: 10, borderRadius: 8, marginTop: 8 }}>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Revenue distribution preview
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ color: colors.text, fontSize: 12 }}>@{activeMobileInvitation?.senderName} (Primary)</Text>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold' }}>
                    {100 - (activeMobileInvitation?.shareRatio || 0)}%
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ color: colors.accent, fontSize: 12, fontWeight: 'bold' }}>You ({activeMobileInvitation?.role})</Text>
                  <Text style={{ color: colors.accent, fontSize: 12, fontWeight: 'bold' }}>
                    {activeMobileInvitation?.shareRatio}%
                  </Text>
                </View>
              </View>

              {/* Optional Message */}
              {activeMobileInvitation?.message && (
                <>
                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
                  <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>Message from Owner</Text>
                  <Text style={{ color: colors.textMuted, fontStyle: 'italic', fontSize: 13, marginTop: 4 }}>
                    "{activeMobileInvitation?.message}"
                  </Text>
                </>
              )}

              {/* Terms and Conditions */}
              {activeMobileInvitation?.terms && (
                <>
                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
                  <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>Terms & Conditions</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 16 }}>
                    {activeMobileInvitation?.terms}
                  </Text>
                </>
              )}

              {/* Date */}
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 16, marginBottom: 24 }}>
                Invited on {activeMobileInvitation?.date}
              </Text>
            </ScrollView>

            <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.modalActionBtn, { borderColor: '#ff3b30', borderWidth: 1 }]} 
                onPress={() => {
                  handleMobileInvitationResponse('DECLINED');
                }}
              >
                <Text style={{ color: '#ff3b30', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalActionBtn, { backgroundColor: '#34c759' }]} 
                onPress={() => {
                  handleMobileInvitationResponse('ACCEPTED');
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>Accept & Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerWordmark: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1.5,
  },
  headerRightButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
  },
  
  // Carousel Hero
  carouselContainer: {
    marginVertical: 12,
    alignItems: 'center',
  },
  carouselCard: {
    width: SCREEN_WIDTH - 24,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  carouselOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 16,
    justifyContent: 'flex-end',
  },
  carouselBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  genreBadge: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  genreBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  carouselRating: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  carouselTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  carouselQuote: {
    color: '#EAEAEA',
    fontSize: 12,
    marginTop: 4,
  },
  carouselCtaBtn: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  carouselCtaText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 11,
  },
  carouselPagination: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8E8E9F',
  },
  carouselDotActive: {
    backgroundColor: '#6c5ce7',
    width: 14,
  },

  // Popular section
  sectionContainer: {
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  popularScrollTrack: {
    gap: 12,
    paddingVertical: 4,
  },
  popularCard: {
    width: 110,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  popularThumbnail: {
    height: 140,
    justifyContent: 'flex-end',
    padding: 6,
  },
  popularBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  popularTitle: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingTop: 6,
  },
  popularRating: {
    fontSize: 11,
    color: '#FFD700',
    paddingHorizontal: 6,
    paddingBottom: 6,
    marginTop: 2,
  },

  // Banner Module
  bannerContainer: {
    margin: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    fontSize: 11,
    marginTop: 4,
  },
  bannerCtaBtn: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  bannerCtaText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Latest releases
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  releaseSegmentRow: {
    flexDirection: 'row',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 2,
  },
  releaseSegmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 18,
  },
  releaseSegmentBtnActive: {
    backgroundColor: '#6c5ce7',
  },
  releaseSegmentText: {
    color: '#8E8E9F',
    fontSize: 11,
    fontWeight: 'bold',
  },
  releaseSegmentTextActive: {
    color: '#FFF',
  },
  mediaRow: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  mediaRowThumb: {
    width: 60,
    height: 80,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  mediaRowBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(108, 92, 231, 0.95)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderBottomRightRadius: 4,
  },
  mediaRowBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  mediaRowInfo: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'space-between',
  },
  mediaRowTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mediaRowTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 6,
  },
  mediaRowRating: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  mediaRowMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  mediaRowStatusText: {
    fontSize: 11,
  },
  mediaRowAuthor: {
    color: '#8E8E9F',
    fontSize: 11,
  },
  chapterStack: {
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 6,
  },
  chapterStackText: {
    color: '#6c5ce7',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Leaderboard
  leaderboardStack: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
  },
  rankNumberText: {
    color: '#8E8E9F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaderboardThumb: {
    width: 40,
    height: 50,
    borderRadius: 4,
  },
  leaderboardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  miniBadgeText: {
    fontSize: 9,
  },
  leaderboardViews: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6c5ce7',
  },

  // Comics Grid
  gridHeaderRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (SCREEN_WIDTH - 32) / 2,
    marginHorizontal: 4,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gridThumbnail: {
    height: 120,
    justifyContent: 'flex-end',
    padding: 6,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  gridRating: {
    fontSize: 11,
    color: '#FFD700',
    marginTop: 4,
  },

  // Novels List
  novelRowItem: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  novelRowThumb: {
    width: 50,
    height: 65,
    borderRadius: 4,
  },
  novelRowTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  novelRowRating: {
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Notifications
  notifTabBar: {
    height: 48,
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  notifTabBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  notifTabText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  notifCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 6,
  },
  notifTime: {
    fontSize: 10,
    color: '#8E8E9F',
  },
  notifContent: {
    fontSize: 12,
    lineHeight: 16,
  },

  // User Hub
  profileCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  profileAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileUsername: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileBadgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tierLabelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierLabelText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  walletLabelText: {
    fontSize: 12,
    marginTop: 6,
  },
  userHubSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 8,
  },
  hubListMenu: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  hubMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  hubMenuLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  redeemRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  redeemBtn: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 6,
  },
  redeemBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Reader Mode
  readerHeader: {
    height: 56,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  readerBackBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  readerTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  comicReaderContainer: {
    paddingVertical: 10,
    alignItems: 'center',
    gap: 10,
  },
  comicPanelBg: {
    width: SCREEN_WIDTH - 20,
    height: 400,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comicPanelLabel: {
    color: '#8e8e93',
    fontSize: 14,
  },
  novelReaderContainer: {
    padding: 20,
  },
  novelTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#6c5ce7',
  },
  novelParagraphText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'justify',
  },
  commentsSection: {
    borderTopWidth: 1,
    padding: 16,
    marginTop: 20,
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  agreementWarnBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  readRulesBannerBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  commentInputBox: {
    flexDirection: 'row',
    gap: 8,
  },
  commentSendBtn: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  commentCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  commentCardReported: {
    opacity: 0.5,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  tierMiniBadge: {
    backgroundColor: 'rgba(108, 92, 231, 0.12)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  tierMiniBadgeText: {
    color: '#6c5ce7',
    fontSize: 8,
    fontWeight: 'bold',
  },
  commentTime: {
    color: '#8E8E9F',
    fontSize: 10,
    marginTop: 1,
  },
  reportMenuDots: {
    padding: 4,
  },
  commentContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },

  // Legacy studio / Admin simulator
  simHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  simBackBtn: {
    paddingVertical: 4,
  },
  statsCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
  },
  uploadCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 12,
    flex: 1,
  },
  tierGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tierBtn: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTierBtn: {
    backgroundColor: '#6c5ce7',
  },
  tierBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  primaryBtn: {
    backgroundColor: '#6c5ce7',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  appCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  appText: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  portfolioLink: {
    color: '#6c5ce7',
    fontSize: 12,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
  },
  drmPathCard: {
    marginTop: 20,
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#34c759',
  },

  // Navigation icons / styles
  navBar: {
    height: 60,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  homeCenterNavItem: {
    marginTop: -16,
  },
  homeCenterIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  activeNavItem: {
    // Nav active styling handled via conditional text coloring
  },
  navIcon: {
    fontSize: 16,
  },
  navText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },

  // Search Overlay
  searchOverlayContainer: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  searchCloseBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchFilterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  tagFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterTagBtn: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  filterTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchResultThumb: {
    width: 45,
    height: 60,
    borderRadius: 4,
  },
  searchResultTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchResultTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  // Modal Backdrop
  modalBgDim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  textArea: {
    height: 100,
    borderRadius: 6,
    borderWidth: 1,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 13,
    marginBottom: 16,
  },

  // Bottom Sheet
  bottomSheetBgDim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  bottomSheetHeader: {
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginBottom: 8,
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSheetScroll: {
    padding: 16,
  },
  rulesList: {
    gap: 16,
    marginBottom: 20,
  },
  ruleBulletRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  ruleBulletNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6c5ce7',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: 'bold',
    fontSize: 11,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  ruleDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  agreeCtaBtn: {
    backgroundColor: '#6c5ce7',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  agreeCtaBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // Report Reasons
  reportReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  reportRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reportReasonText: {
    fontSize: 13,
  },

  // Content Access Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalRNContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  modalRNHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  lockIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRNTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalRNSubtitle: {
    fontSize: 11,
    marginTop: 1,
    color: '#8E8E9F',
  },
  modalRNCloseBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleSectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#8E8E9F',
    marginBottom: 6,
  },
  toggleBarContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  toggleBarBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleBarBtnActive: {
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
  },
  toggleBarBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8E8E9F',
  },
  highlightPromoCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  highlightPromoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightPromoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  highlightPromoPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  highlightPromoPeriod: {
    fontSize: 10,
    color: '#8E8E9F',
  },
  highlightPromoDesc: {
    fontSize: 10,
    color: '#d1d1e0',
    marginTop: 2,
    lineHeight: 14,
  },
  featureRowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
    padding: 8,
    borderRadius: 8,
  },
  featureCheckmark: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: -2,
  },
  featureItemTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f3f4f6',
  },
  featureItemSub: {
    fontSize: 10,
    color: '#8E8E9F',
    marginTop: 1,
  },
  modalRNFooter: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderTopWidth: 1,
  },
  footerBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  miniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeMiniBtn: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  miniBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalActions: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    borderTopWidth: 1,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
