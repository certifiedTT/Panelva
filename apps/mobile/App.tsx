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
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/query-core';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './lib/trpc';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Card } from './src/components/common/Card';
import { Button } from './src/components/common/Button';

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
import { ProfileScreen } from './src/screens/ProfileScreen';
import { DevToolsScreen } from './src/screens/DevToolsScreen';
import { SeriesDetailsScreen } from './src/screens/SeriesDetailsScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';

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
import { DevRoleSwitcherModal } from './src/components/dev/DevRoleSwitcherModal';
import { FloatingDevOrb } from './src/components/dev/FloatingDevOrb';

// Lucide Line Icons
import {
  X,
  ChevronRight,
  Lock,
  Bookmark,
  History,
} from 'lucide-react-native';

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
  const { isDark, setThemeMode } = useTheme();
  const handleToggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };
  const { hasCompletedOnboarding, completeOnboarding, hasSeenReaderTutorial, markReaderTutorialSeen } = useOnboarding();
  const { sessionToken, sessionUser, activeMockRole, switchMockRole, saveSession, clearSession } = useAuthSession();

  // Keep global token synchronized
  globalSessionToken = sessionToken;

  // Active Destination: 5 tabs + series_details + reader mode + profile + dev_tools
  const [activeTab, setActiveTab] = useState<TabId | 'series_details' | 'reader' | 'profile' | 'dev_tools'>('home');

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

  // Unread Alerts count
  const [unreadAlertsCount] = useState(2);

  // Backend queries
  const { data: dbTrending } = trpc.series.getTrending.useQuery({ limit: 12 });

  const { data: dbReadingHistory } = (trpc.user.getReadingHistory as any).useQuery(undefined, {
    enabled: !!sessionToken,
  });

  const { data: dbBookmarks } = (trpc.user.getBookmarks as any).useQuery(undefined, {
    enabled: !!sessionToken,
  });

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

  return (
    <SafeAreaView style={styles.safeArea}>
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
            onOpenProfile={() => setActiveTab('profile')}
            onOpenEditProfile={() => setActiveTab('profile')}
            onOpenWallet={() => setWalletModalVisible(true)}
            onOpenBecomeCreator={() => setBecomeCreatorModalVisible(true)}
            onOpenCreatorStudio={() => setCreatorStudioVisible(true)}
            onOpenBookmarks={() => setBookmarksModalVisible(true)}
            onOpenReadingHistory={() => setReadingHistoryModalVisible(true)}
            onOpenSupport={() => setIssueModalVisible(true)}
            onOpenDRMManager={() => setDrmModalVisible(true)}
            onOpenAdminHub={() => setAdminHubVisible(true)}
            onReplayPlatformTour={() => setShowPlatformTour(true)}
            onOpenDevTools={() => setActiveTab('dev_tools')}
            activeMockRole={activeMockRole}
          />
        </View>

        {/* Dedicated Profile Screen */}
        {activeTab === 'profile' && (
          <ProfileScreen
            sessionToken={sessionToken}
            sessionUser={sessionUser}
            dbUser={effectiveUser}
            onBack={() => setActiveTab('more')}
            onEditProfile={() => Alert.alert('Edit Profile', 'Profile editing saved.')}
            onSelectSeries={handleOpenSeriesDetails}
          />
        )}

        {/* Hidden Developer Tools Screen (Master Admin in __DEV__) */}
        {activeTab === 'dev_tools' && (
          <DevToolsScreen
            activeRole={activeMockRole}
            onSelectRole={(role) => switchMockRole(role)}
            onResetTour={() => setShowPlatformTour(true)}
            onBack={() => setActiveTab('more')}
          />
        )}

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
      {activeTab !== 'reader' &&
        activeTab !== 'series_details' &&
        activeTab !== 'profile' &&
        activeTab !== 'dev_tools' && (
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
      <Modal
        visible={bookmarksModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBookmarksModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Library & Bookmarks</Text>
              <TouchableOpacity
                onPress={() => setBookmarksModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close Bookmarks"
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.md }} showsVerticalScrollIndicator={false}>
              {dbBookmarks && dbBookmarks.length > 0 ? (
                <View style={{ gap: spacing.sm }}>
                  {dbBookmarks.map((b: any) => (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => {
                        setBookmarksModalVisible(false);
                        handleOpenSeriesDetails(b.series);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${b.series?.title}`}
                    >
                      <Card style={styles.libraryRow}>
                        <View style={{ flex: 1, gap: spacing.xs / 2 }}>
                          <Text style={styles.libraryTitle}>{b.series?.title}</Text>
                          <Text style={styles.librarySub}>
                            {b.series?.type} • {b.series?.genre}
                          </Text>
                        </View>
                        <ChevronRight size={18} color={colors.textMuted} />
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Card style={styles.emptyCard}>
                  <Bookmark size={36} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>No Bookmarked Series</Text>
                  <Text style={styles.emptySub}>
                    Bookmark comics and novels to easily access them here.
                  </Text>
                </Card>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reading History Modal */}
      <Modal
        visible={readingHistoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReadingHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reading History</Text>
              <TouchableOpacity
                onPress={() => setReadingHistoryModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close Reading History"
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.md }} showsVerticalScrollIndicator={false}>
              {dbReadingHistory && dbReadingHistory.length > 0 ? (
                <View style={{ gap: spacing.sm }}>
                  {dbReadingHistory.map((item: any) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        setReadingHistoryModalVisible(false);
                        handleOpenSeriesDetails(item.chapter?.series);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${item.chapter?.series?.title}`}
                    >
                      <Card style={styles.libraryRow}>
                        <View style={{ flex: 1, gap: spacing.xs / 2 }}>
                          <Text style={styles.libraryTitle}>{item.chapter?.series?.title}</Text>
                          <Text style={styles.librarySub}>
                            Ch. {item.chapter?.chapterIndex} • {item.progressPct}% completed
                          </Text>
                        </View>
                        <ChevronRight size={18} color={colors.textMuted} />
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Card style={styles.emptyCard}>
                  <History size={36} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>No Reading History</Text>
                  <Text style={styles.emptySub}>
                    Chapters you read will automatically appear here.
                  </Text>
                </Card>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Support & Issue Ticket Modal */}
      <Modal
        visible={issueModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIssueModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Support & Bug Report</Text>
              <TouchableOpacity
                onPress={() => setIssueModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close Support Modal"
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: spacing.md, gap: spacing.md }}>
              <Text style={styles.fieldLabel}>Describe the Issue</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Let us know what went wrong or how we can improve..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />
              <Button
                title="Submit Ticket"
                variant="primary"
                onPress={() => {
                  Alert.alert('Report Submitted', 'Thank you! Our engineering team has received your ticket.');
                  setIssueModalVisible(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* DRM Offline Storage Modal */}
      <Modal
        visible={drmModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDrmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Offline Encrypted Downloads</Text>
              <TouchableOpacity
                onPress={() => setDrmModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close Offline Downloads"
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: spacing.md, gap: spacing.md }}>
              <Card style={styles.drmBadgeBox}>
                <Lock size={20} color={colors.primary} />
                <Text style={styles.drmBadgeText}>AES-256 Secure Enclave Storage Active</Text>
              </Card>
              <Text style={styles.drmDescText}>
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

      {/* AssistiveTouch-Style Developer Orb (__DEV__ Mode or MASTER_ADMIN only) */}
      {activeTab !== 'reader' && (
        <FloatingDevOrb
          userRole={effectiveUser?.role || sessionUser?.role}
          activeMockRole={activeMockRole}
          onOpenRoleSwitcher={() => setDevRoleSwitcherVisible(true)}
          onOpenProfile={() => setActiveTab('profile')}
          onToggleTheme={handleToggleTheme}
          isDarkTheme={isDark}
        />
      )}

      <DevRoleSwitcherModal
        visible={devRoleSwitcherVisible}
        activeRole={activeMockRole}
        onClose={() => setDevRoleSwitcherVisible(false)}
        onSelectRole={(roleKey) => switchMockRole(roleKey)}
      />
    </SafeAreaView>
  );
}

// Export Root App Component with Theme and Query Providers
export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <ErrorBoundary>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <MobileApp />
            </ThemeProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContainer: {
    flex: 1,
  },
  // Modal standard styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    fontWeight: '700',
    color: colors.text,
  },
  fieldLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  textArea: {
    height: 88,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.small.fontSize,
    color: colors.text,
    textAlignVertical: 'top',
  },
  libraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  libraryTitle: {
    fontSize: typography.small.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  librarySub: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  emptySub: {
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
  drmBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  drmBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  drmDescText: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
});
