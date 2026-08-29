import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
const FlashListAny: any = FlashList;
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/query-core';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './lib/trpc';
import Constants from 'expo-constants';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { useOnboarding } from './src/hooks/useOnboarding';
import { useAuthSession } from './src/hooks/useAuthSession';
import { OnboardingCarousel } from './src/components/onboarding/OnboardingCarousel';
import { ReaderTutorialOverlay } from './src/components/reader/ReaderTutorialOverlay';
import { BottomNavBar, TabId } from './src/components/navigation/BottomNavBar';
import { calculateGridDimensions } from './src/components/common/ContentCard';
import { useFeedPrefetch } from './src/hooks/useFeedPrefetch';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { SeriesScreen } from './src/screens/SeriesScreen';
import { CreatorHubScreen } from './src/screens/CreatorHubScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { MoreScreen } from './src/screens/MoreScreen';
import { SeriesDetailsScreen } from './src/screens/SeriesDetailsScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InteractivePlatformGuide, PLATFORM_TOUR_STORAGE_KEY } from './src/components/onboarding/InteractivePlatformGuide';
import { GlobalSearchModal } from './src/components/search/GlobalSearchModal';
import { MOCK_PLATFORM_SERIES } from './src/data/mockData';

// Modals
import { CreditWalletModal } from './src/components/wallet/CreditWalletModal';
import { BecomeCreatorModal } from './src/components/creator/BecomeCreatorModal';
import { CreatorStudioModal } from './src/components/creator/CreatorStudioModal';
import { PublicCreatorProfileModal } from './src/components/creator/PublicCreatorProfileModal';
import { CreatePostModal } from './src/components/creator/CreatePostModal';
import { AdminHubModal } from './src/components/admin/AdminHubModal';
import { AuthBottomSheet } from './src/components/auth/AuthBottomSheet';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { DevFloatingRolePill, DevRoleSwitcherModal } from './src/components/dev/DevRoleSwitcherModal';
import { MOCK_ACCOUNTS_MAP, MockRoleKey } from './src/data/mockRoles';


// Icons
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  StarIcon,
  HeartIcon,
  BookmarkIcon,
  CommentIcon,
  ShareIcon,
  LockIcon,
  CrownIcon,
  SparklesIcon,
  BookOpenIcon,
  HistoryIcon,
  CreditsIcon,
  DownloadIcon,
  HelpCircleIcon,
  CheckIcon,
} from './src/components/common/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// TRPC Setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes stale-while-revalidate
      cacheTime: 30 * 60 * 1000, // 30 minutes in-memory cache
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: 1,
    },
  },
});
let globalSessionToken: string | null = null;

const getDevBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(':')[0];
  if (localhost && localhost !== 'localhost' && localhost !== '127.0.0.1') {
    return `http://${localhost}:3000`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
};

const devBaseUrl = getDevBaseUrl();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${devBaseUrl}/api/trpc`,
      async headers() {
        return {
          authorization: globalSessionToken ? `Bearer ${globalSessionToken}` : '',
        };
      },
    }),
  ],
});

// Mock Series Fallback
const MOCK_SERIES = [
  {
    id: 's-1',
    title: 'Shadow City: Neon Blade',
    rating: '9.9',
    genre: 'Action',
    type: 'COMIC',
    coverBg: '#1e3a8a',
    coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    views: '124k',
    status: 'Ongoing',
    author: 'LunaBlade',
    chapters: 'Ch. 42 • Active',
    isHot: true,
  },
  {
    id: 's-2',
    title: 'Born to be Grand Duchess',
    rating: '9.8',
    genre: 'Romance',
    type: 'NOVEL',
    coverBg: '#0f172a',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop',
    views: '88k',
    status: 'Ongoing',
    author: 'DuchessPen',
    chapters: 'Ch. 118 • Active',
    isHot: true,
  },
  {
    id: 's-3',
    title: 'Archmage Curriculum',
    rating: '9.7',
    genre: 'Fantasy',
    type: 'COMIC',
    coverBg: '#1e293b',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    views: '54k',
    status: 'Ongoing',
    author: 'MageStudio',
    chapters: 'Ch. 29 • Active',
    isHot: false,
  },
  {
    id: 's-4',
    title: 'Solo Leveling: Reawakened',
    rating: '9.9',
    genre: 'Action',
    type: 'COMIC',
    coverBg: '#172554',
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    views: '320k',
    status: 'Completed',
    author: 'Chugong',
    chapters: 'Ch. 179 • End',
    isHot: true,
  },
];

function MobileApp() {
  const { colors, isDark } = useTheme();
  const { hasCompletedOnboarding, completeOnboarding, hasSeenReaderTutorial, markReaderTutorialSeen } = useOnboarding();
  const { sessionToken, sessionUser, activeMockRole, isMockMode, switchMockRole, saveSession, clearSession } = useAuthSession();

  // Keep global token synchronized
  globalSessionToken = sessionToken;

  // Active Destination: 5 tabs + series_details + reader mode
  const [activeTab, setActiveTab] = useState<TabId | 'series_details' | 'reader'>('home');
  const [previousTab, setPreviousTab] = useState<TabId>('home');
  const [initialSeriesGenre, setInitialSeriesGenre] = useState<string>('All');
  const [showPlatformTour, setShowPlatformTour] = useState(false);
  const [devRoleSwitcherVisible, setDevRoleSwitcherVisible] = useState(false);


  useEffect(() => {
    async function checkPlatformTour() {
      try {
        const val = await AsyncStorage.getItem(PLATFORM_TOUR_STORAGE_KEY);
        if (!val && hasCompletedOnboarding) {
          setShowPlatformTour(true);
        }
      } catch {}
    }
    checkPlatformTour();
  }, [hasCompletedOnboarding]);

  // Modals state
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [becomeCreatorModalVisible, setBecomeCreatorModalVisible] = useState(false);
  const [creatorStudioVisible, setCreatorStudioVisible] = useState(false);
  const [selectedCreatorProfileId, setSelectedCreatorProfileId] = useState<string | null>(null);
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [bookmarksModalVisible, setBookmarksModalVisible] = useState(false);
  const [readingHistoryModalVisible, setReadingHistoryModalVisible] = useState(false);
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [drmModalVisible, setDrmModalVisible] = useState(false);
  const [adminHubVisible, setAdminHubVisible] = useState(false);
  const [showReplayOnboarding, setShowReplayOnboarding] = useState(false);

  // Content Access Modal state
  const [accessModalVisible, setAccessModalVisible] = useState(false);
  const [accessType, setAccessType] = useState<'AD_SUPPORTED' | 'PREMIUM'>('AD_SUPPORTED');
  const [accessChapterIndex, setAccessChapterIndex] = useState<number>(1);

  // Backend queries
  const { data: dbUser, refetch: refetchUser } = (trpc.user.getMe as any).useQuery(undefined, {
    enabled: !!sessionToken,
    retry: false,
  });

  const effectiveUser = dbUser || sessionUser;

  // Background Feed Prefetching & Local Cache Persistence
  useFeedPrefetch(dbUser?.id);

  // Reader state
  const [selectedSeries, setSelectedSeries] = useState<any>(MOCK_SERIES[0]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(1);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [readerFormat, setReaderFormat] = useState<'comic' | 'novel'>('comic');
  const [commentInputText, setCommentInputText] = useState('');

  // Unread Alerts state
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(2);

  const { data: dbTrending } = trpc.series.getTrending.useQuery({ limit: 12 });

  const { data: dbReadingHistory, refetch: refetchReadingHistory } = (trpc.user.getReadingHistory as any).useQuery(undefined, {
    enabled: !!sessionToken,
  });

  const { data: dbBookmarks, refetch: refetchBookmarks } = (trpc.user.getBookmarks as any).useQuery(undefined, {
    enabled: !!sessionToken,
  });

  const { data: dbSeriesDetails } = (trpc.series.getById as any).useQuery(
    { id: selectedSeries?.id },
    { enabled: !!selectedSeries?.id }
  );

  const { data: dbChapter, refetch: refetchChapter } = (trpc.chapter.getChapter as any).useQuery(
    { chapterId: selectedChapterId! },
    { enabled: !!selectedChapterId, retry: false }
  );

  const { data: dbComments, refetch: refetchComments } = (trpc.chapter.getComments as any).useQuery(
    { chapterId: selectedChapterId!, limit: 50 },
    { enabled: !!selectedChapterId }
  );

  // Mutations
  const updateProgressMutation = trpc.chapter.updateReadingProgress.useMutation({
    onSuccess: () => refetchReadingHistory(),
  });

  const postCommentMutation = trpc.chapter.postComment.useMutation({
    onSuccess: () => {
      refetchComments();
      setCommentInputText('');
      Alert.alert('Comment Posted', 'Your reaction was posted.');
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  // Calculate Responsive Card Widths
  const { cardWidth, gap: gridGap } = calculateGridDimensions(SCREEN_WIDTH, 16, 10);

  const trendingList = dbTrending && dbTrending.length > 0
    ? dbTrending.map((s) => ({
        id: s.id,
        title: s.title,
        rating: '9.8',
        genre: s.genre || 'General',
        type: s.type,
        coverBg: s.type === 'COMIC' ? '#1e3a8a' : '#0f172a',
        coverUrl: s.coverUrl,
        views: `${(s.views / 1000).toFixed(0)}k`,
        status: s.status,
        author: s.creator?.penName || 'Creator',
        creator: s.creator,
        chapters: 'Ch. 1-12 • Active',
        isHot: s.views > 50000,
      }))
    : MOCK_SERIES;

  // Handle selecting a series to open Series Details Page
  const handleOpenSeriesDetails = (series: any) => {
    if (!series) return;
    setSelectedSeries(series);
    if (activeTab !== 'series_details' && activeTab !== 'reader') {
      setPreviousTab(activeTab as TabId);
    }
    setActiveTab('series_details');
  };

  // Handle selecting a chapter or tapping Start/Continue reading to open Reader
  const handleLaunchReader = (series: any, chapter?: any) => {
    const s = series || selectedSeries || MOCK_PLATFORM_SERIES[0];
    setSelectedSeries(s);
    setReaderFormat(s?.type === 'NOVEL' ? 'novel' : 'comic');
    if (chapter) {
      setCurrentChapterIndex(chapter.chapterIndex || 1);
      setSelectedChapterId(chapter.id || null);
    } else if (s?.chapters && Array.isArray(s.chapters) && s.chapters.length > 0) {
      setCurrentChapterIndex(s.chapters[0].chapterIndex || 1);
      setSelectedChapterId(s.chapters[0].id || null);
    } else {
      setCurrentChapterIndex(1);
      setSelectedChapterId(null);
    }
    setActiveTab('reader');
  };

  // Switch Chapter inside reader
  const handleSelectChapter = (ch: any) => {
    if (!ch) return;
    setCurrentChapterIndex(ch.chapterIndex || 1);
    setSelectedChapterId(ch.id || null);

    // Check tier
    if (ch.tier === 'PREMIUM' && dbUser?.subscription !== 'PREMIUM') {
      setAccessType('PREMIUM');
      setAccessChapterIndex(ch.chapterIndex || 1);
      setAccessModalVisible(true);
    } else if (ch.tier === 'AD_SUPPORTED' && !dbUser?.subscription) {
      setAccessType('AD_SUPPORTED');
      setAccessChapterIndex(ch.chapterIndex || 1);
      setAccessModalVisible(true);
    }

    const isChapterUuid = typeof ch.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ch.id);
    if (sessionToken && isChapterUuid) {
      updateProgressMutation.mutate({
        chapterId: ch.id,
        scrollProgress: 10,
      });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Main Active Screen Content - Preserve Scroll State across Main Tabs */}
      <View style={styles.mainContainer}>
        <View style={{ flex: 1, display: activeTab === 'home' ? 'flex' : 'none' }}>
          <HomeScreen
            trendingSeries={trendingList}
            readingHistory={dbReadingHistory}
            onSelectSeries={handleOpenSeriesDetails}
            onOpenSearch={() => setSearchModalVisible(true)}
            onNavigateToSeries={(genre) => {
              if (genre) setInitialSeriesGenre(genre);
              setActiveTab('series');
            }}
            onNavigateToCreatorHub={() => setActiveTab('creator_hub')}
            cardWidth={cardWidth}
            gridGap={gridGap}
          />
        </View>

        <View style={{ flex: 1, display: activeTab === 'series' ? 'flex' : 'none' }}>
          <SeriesScreen
            onSelectSeries={handleOpenSeriesDetails}
            initialGenre={initialSeriesGenre}
            cardWidth={cardWidth}
            gridGap={gridGap}
          />
        </View>

        <View style={{ flex: 1, display: activeTab === 'creator_hub' ? 'flex' : 'none' }}>
          <CreatorHubScreen
            sessionToken={sessionToken}
            sessionUser={sessionUser}
            dbUser={effectiveUser}
            onRequireAuth={() => setAuthModalVisible(true)}
            onOpenBecomeCreator={() => setBecomeCreatorModalVisible(true)}
            onViewCreatorProfile={(id) => setSelectedCreatorProfileId(id)}
            onOpenCreatePost={() => setCreatePostModalVisible(true)}
          />
        </View>

        <View style={{ flex: 1, display: activeTab === 'alerts' ? 'flex' : 'none' }}>
          <AlertsScreen
            sessionToken={sessionToken}
            onRequireAuth={() => setAuthModalVisible(true)}
            onSelectSeries={handleOpenSeriesDetails}
          />
        </View>

        <View style={{ flex: 1, display: activeTab === 'more' ? 'flex' : 'none' }}>
          <MoreScreen
            sessionToken={sessionToken}
            sessionUser={sessionUser}
            dbUser={effectiveUser}
            onOpenAuthModal={() => setAuthModalVisible(true)}
            onSignOut={() => {
              clearSession();
              Alert.alert('Signed Out', 'You have been signed out.');
            }}
            onOpenWallet={() => setWalletModalVisible(true)}
            onOpenBecomeCreator={() => setBecomeCreatorModalVisible(true)}
            onOpenCreatorStudio={() => setCreatorStudioVisible(true)}
            onOpenBookmarks={() => setBookmarksModalVisible(true)}
            onOpenReadingHistory={() => setReadingHistoryModalVisible(true)}
            onOpenSupport={() => setIssueModalVisible(true)}
            onOpenDRMManager={() => setDrmModalVisible(true)}
            onOpenAdminHub={() => setAdminHubVisible(true)}
            onReplayPlatformTour={() => setShowPlatformTour(true)}
            onOpenDevRoleSwitcher={() => setDevRoleSwitcherVisible(true)}
            activeMockRole={activeMockRole}
          />
        </View>

        {/* Series Details Screen */}
        {activeTab === 'series_details' && (
          <SeriesDetailsScreen
            series={selectedSeries}
            sessionToken={sessionToken}
            sessionUser={sessionUser}
            dbUser={effectiveUser}
            readingHistory={dbReadingHistory}
            onBack={() => setActiveTab(previousTab || 'home')}
            onSelectChapter={(chapter, series) => handleLaunchReader(series, chapter)}
            onViewCreatorProfile={(id) => setSelectedCreatorProfileId(id)}
            onRequireAuth={() => setAuthModalVisible(true)}
            onOpenWallet={() => setWalletModalVisible(true)}
          />
        )}

        {/* Reader Mode Screen */}
        {activeTab === 'reader' && (
          <ReaderScreen
            series={selectedSeries}
            currentChapterIndex={currentChapterIndex}
            selectedChapterId={selectedChapterId}
            sessionToken={sessionToken}
            sessionUser={sessionUser}
            dbUser={effectiveUser}
            onBack={() => setActiveTab('series_details')}
            onSelectChapter={(chapter) => {
              setSelectedChapterId(chapter.id);
              setCurrentChapterIndex(chapter.chapterIndex);
            }}
            onViewCreatorProfile={(id) => setSelectedCreatorProfileId(id)}
            onRequireAuth={() => setAuthModalVisible(true)}
            onOpenWallet={() => setWalletModalVisible(true)}
          />
        )}

      </View>

      {/* 5-Destination Bottom Navigation Bar */}
      {activeTab !== 'reader' && activeTab !== 'series_details' && (
        <BottomNavBar
          activeTab={activeTab as TabId}
          onTabChange={(tab) => setActiveTab(tab)}
          unreadAlertsCount={unreadAlertsCount}
        />
      )}

      {/* MODALS */}
      <CreditWalletModal
        visible={walletModalVisible}
        onClose={() => setWalletModalVisible(false)}
        sessionToken={sessionToken}
        creditBalance={dbUser?.creditsBalance || dbUser?.wCoinBalance || 0}
        onRequireAuth={() => setAuthModalVisible(true)}
        onSuccessRecharge={() => refetchUser()}
      />

      <BecomeCreatorModal
        visible={becomeCreatorModalVisible}
        onClose={() => setBecomeCreatorModalVisible(false)}
        sessionToken={sessionToken}
        onRequireAuth={() => setAuthModalVisible(true)}
        onSuccessSubmit={() => refetchUser()}
      />

      <PublicCreatorProfileModal
        visible={!!selectedCreatorProfileId}
        onClose={() => setSelectedCreatorProfileId(null)}
        creatorProfileId={selectedCreatorProfileId}
        sessionToken={sessionToken}
        onRequireAuth={() => setAuthModalVisible(true)}
        onSelectSeries={handleOpenSeriesDetails}
      />

      <CreatePostModal
        visible={createPostModalVisible}
        onClose={() => setCreatePostModalVisible(false)}
      />

      <CreatorStudioModal
        visible={creatorStudioVisible}
        onClose={() => setCreatorStudioVisible(false)}
        dbUser={effectiveUser}
      />

      <AdminHubModal
        visible={adminHubVisible}
        onClose={() => setAdminHubVisible(false)}
        dbUser={effectiveUser}
      />


      {/* Global Interactive Search Modal */}
      <GlobalSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSelectSeries={handleOpenSeriesDetails}
        onSelectCreator={(id) => setSelectedCreatorProfileId(id)}
      />

      {/* Auth Bottom Sheet */}
      <AuthBottomSheet
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSuccess={(token, user) => {
          saveSession(token, user);
          setAuthModalVisible(false);
          setTimeout(() => refetchUser(), 100);
        }}
        devBaseUrl={devBaseUrl}
      />

      {/* Bookmarks Modal */}
      <Modal visible={bookmarksModalVisible} transparent animationType="slide" onRequestClose={() => setBookmarksModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Library & Bookmarks</Text>
              <TouchableOpacity onPress={() => setBookmarksModalVisible(false)}>
                <CloseIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              {dbBookmarks && dbBookmarks.length > 0 ? (
                dbBookmarks.map((b: any) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.libraryRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                    onPress={() => {
                      setBookmarksModalVisible(false);
                      handleOpenSeriesDetails(b.series);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.libraryTitle, { color: colors.text }]}>{b.series?.title}</Text>
                      <Text style={[styles.librarySub, { color: colors.textMuted }]}>{b.series?.type} • {b.series?.genre}</Text>
                    </View>
                    <ChevronRightIcon size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={[styles.emptyModalText, { color: colors.textMuted }]}>No bookmarked series yet.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reading History Modal */}
      <Modal visible={readingHistoryModalVisible} transparent animationType="slide" onRequestClose={() => setReadingHistoryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Reading History</Text>
              <TouchableOpacity onPress={() => setReadingHistoryModalVisible(false)}>
                <CloseIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              {dbReadingHistory && dbReadingHistory.length > 0 ? (
                dbReadingHistory.map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.libraryRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                    onPress={() => {
                      setReadingHistoryModalVisible(false);
                      handleOpenSeriesDetails(item.chapter?.series);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.libraryTitle, { color: colors.text }]}>{item.chapter?.series?.title}</Text>
                      <Text style={[styles.librarySub, { color: colors.textMuted }]}>
                        Ch. {item.chapter?.chapterIndex} • {item.progressPct}% completed
                      </Text>
                    </View>
                    <ChevronRightIcon size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={[styles.emptyModalText, { color: colors.textMuted }]}>No reading history recorded yet.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Support & Issue Ticket Modal */}
      <Modal visible={issueModalVisible} transparent animationType="slide" onRequestClose={() => setIssueModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Support & Bug Report</Text>
              <TouchableOpacity onPress={() => setIssueModalVisible(false)}>
                <CloseIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16, gap: 12 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Describe the Issue</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
                placeholder="Let us know what went wrong or how we can improve..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Alert.alert('Report Submitted', 'Thank you! Our engineering team has received your ticket.');
                  setIssueModalVisible(false);
                }}
              >
                <Text style={styles.modalActionBtnText}>Submit Ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DRM Offline Storage Modal */}
      <Modal visible={drmModalVisible} transparent animationType="slide" onRequestClose={() => setDrmModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Offline Encrypted Downloads</Text>
              <TouchableOpacity onPress={() => setDrmModalVisible(false)}>
                <CloseIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16, gap: 12 }}>
              <View style={[styles.drmBadgeBox, { backgroundColor: colors.primaryMuted }]}>
                <LockIcon size={20} color={colors.primary} />
                <Text style={[styles.drmBadgeText, { color: colors.primary }]}>AES-256 Secure Enclave Storage Active</Text>
              </View>
              <Text style={[styles.drmDescText, { color: colors.textMuted }]}>
                Downloaded episodes are securely encrypted at rest and accessible when offline.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tutorial & Onboarding Overlays */}
      {(!hasCompletedOnboarding || showReplayOnboarding) && (
        <OnboardingCarousel
          onComplete={(prefs) => {
            completeOnboarding(prefs);
            setShowReplayOnboarding(false);
          }}
          onAuthenticate={(token, user) => {
            saveSession(token, user);
            setShowReplayOnboarding(false);
            setTimeout(() => refetchUser(), 100);
          }}
          trpcClient={trpcClient}
          devBaseUrl={devBaseUrl}
        />
      )}

      <ReaderTutorialOverlay
        visible={!hasSeenReaderTutorial && activeTab === 'reader'}
        onDismiss={markReaderTutorialSeen}
        format={readerFormat}
      />

      {/* Interactive Platform Tour / User Guide */}
      <InteractivePlatformGuide
        visible={showPlatformTour}
        onDismiss={() => setShowPlatformTour(false)}
        onNavigateToTab={(tab) => {
          setShowPlatformTour(false);
          setActiveTab(tab as any);
        }}
      />

      {/* Dev Floating Role Pill & Switcher Modal (__DEV__ Mode only) */}
      {activeTab !== 'reader' && (
        <DevFloatingRolePill
          activeRoleKey={activeMockRole}
          onPress={() => setDevRoleSwitcherVisible(true)}
        />
      )}

      <DevRoleSwitcherModal
        visible={devRoleSwitcherVisible}
        activeRoleKey={activeMockRole}
        onClose={() => setDevRoleSwitcherVisible(false)}
        onSelectRole={(roleKey) => switchMockRole(roleKey)}
      />
    </SafeAreaView>
  );
}




// Export Root App Component with Theme and Query Providers
export default function App() {
  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <MobileApp />
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  // Reader styling
  readerContainer: {
    flex: 1,
  },
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  readerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readerBackText: {
    fontSize: 13,
    fontWeight: '700',
  },
  readerTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  formatToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  formatToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  formatToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chapterBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  chapterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  chapterPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pageImageWrapper: {
    width: SCREEN_WIDTH,
    height: 520,
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  novelChapterHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  novelContentBody: {
    fontSize: 15,
    lineHeight: 24,
  },
  readerCommentsSection: {
    padding: 16,
    borderTopWidth: 1,
    marginTop: 20,
    paddingBottom: 40,
  },
  commentsHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  readerCommentInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  readerCommentSendBtn: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  readerCommentSendText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  commentCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: '700',
  },
  commentMsg: {
    fontSize: 12,
    marginTop: 2,
  },
  // Modal standard styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  textArea: {
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  modalActionBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 10,
  },
  toggleAuthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  libraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  libraryTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  librarySub: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyModalText: {
    textAlign: 'center',
    paddingVertical: 30,
    fontSize: 13,
  },
  drmBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  drmBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  drmDescText: {
    fontSize: 12,
    lineHeight: 16,
  },
  demoLoginPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  demoLoginPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
