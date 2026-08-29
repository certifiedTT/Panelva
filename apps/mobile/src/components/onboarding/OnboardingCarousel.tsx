import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { UserOnboardingPreferences } from '../../storage/storageKeys';
import {
  SparklesIcon,
  CreditsIcon,
  PaletteIcon,
  NovelsIcon,
  AlertsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  SeriesIcon,
  BookOpenIcon,
} from '../common/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ALL_GENRES = [
  { id: 'Action', label: 'Action' },
  { id: 'Fantasy', label: 'Fantasy' },
  { id: 'Romance', label: 'Romance' },
  { id: 'Sci-Fi', label: 'Sci-Fi' },
  { id: 'Supernatural', label: 'Supernatural' },
  { id: 'Drama', label: 'Drama' },
  { id: 'Mystery', label: 'Mystery' },
  { id: 'Thriller', label: 'Thriller' },
  { id: 'Comedy', label: 'Comedy' },
  { id: 'Slice of Life', label: 'Slice of Life' },
];

interface OnboardingCarouselProps {
  onComplete: (preferences: UserOnboardingPreferences) => void;
  onAuthenticate: (token: string, user: any) => void;
  trpcClient: any;
  devBaseUrl: string;
}

export function OnboardingCarousel({
  onComplete,
  onAuthenticate,
  trpcClient,
  devBaseUrl,
}: OnboardingCarouselProps) {
  const { colors, isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  // Preference states
  const [selectedRole, setSelectedRole] = useState<'READER' | 'CREATOR'>('READER');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Fantasy', 'Action', 'Romance']);
  const [selectedFormat, setSelectedFormat] = useState<'COMICS' | 'NOVELS' | 'BOTH'>('BOTH');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Auth states for Step 4
  const [isLogin, setIsLogin] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const toggleGenre = (genreId: string) => {
    if (selectedGenres.includes(genreId)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter((g) => g !== genreId));
      }
    } else {
      setSelectedGenres([...selectedGenres, genreId]);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      finalizeAndEnter();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finalizeAndEnter = () => {
    const preferences: UserOnboardingPreferences = {
      role: selectedRole,
      favoriteGenres: selectedGenres,
      preferredFormat: selectedFormat,
      notificationsEnabled,
    };
    onComplete(preferences);
  };

  const handleAuthSubmit = async () => {
    if (!authEmail || !authPassword || (!isLogin && !authUsername)) {
      setAuthError('Please fill in all required fields.');
      return;
    }
    setAuthError('');
    setAuthLoading(true);

    try {
      let resolvedEmail = authEmail;
      if (isLogin && !authEmail.includes('@')) {
        try {
          const res = await trpcClient.user.getEmailByUsername.query({ username: authEmail });
          if (res && res.email) {
            resolvedEmail = res.email;
          } else {
            setAuthError('User with this username was not found.');
            setAuthLoading(false);
            return;
          }
        } catch {
          setAuthError('Username lookup failed.');
          setAuthLoading(false);
          return;
        }
      }

      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(devBaseUrl + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resolvedEmail,
          password: authPassword,
          ...(isLogin ? {} : { username: authUsername }),
        }),
      });

      const resJson = await response.json();
      if (response.status !== 200 && response.status !== 201) {
        setAuthError(resJson.error || 'Authentication failed.');
        setAuthLoading(false);
        return;
      }

      if (isLogin) {
        const token = resJson.accessToken;
        if (!token) {
          setAuthError('Server did not return session token.');
          setAuthLoading(false);
          return;
        }
        onAuthenticate(token, {
          id: resJson.data?.id,
          email: resJson.data?.email,
          username: resJson.username,
          role: resJson.role,
        });
        finalizeAndEnter();
      } else {
        Alert.alert('Account Created!', 'Your account has been created. Please sign in to continue.');
        setIsLogin(true);
        setAuthError('');
      }
    } catch {
      setAuthError('Network error connecting to auth server.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Bar: Progress and Skip */}
      <View style={[styles.topBar, { backgroundColor: colors.bg }]}>
        <View style={styles.progressContainer}>
          {[0, 1, 2, 3, 4].map((step) => (
            <View
              key={step}
              style={[
                styles.progressBarSegment,
                {
                  backgroundColor:
                    step === currentStep
                      ? colors.primary
                      : step < currentStep
                      ? colors.primaryDark
                      : isDark
                      ? colors.surfaceSecondary
                      : colors.border,
                },
              ]}
            />
          ))}
        </View>
        {currentStep < 4 && (
          <TouchableOpacity
            onPress={finalizeAndEnter}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={[styles.skipButtonText, { color: colors.textMuted }]}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STEP 0: Welcome & Value Proposition */}
        {currentStep === 0 && (
          <View style={styles.stepCard}>
            <View
              style={[
                styles.badgePill,
                { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight },
              ]}
            >
              <SparklesIcon size={12} color={colors.primary} />
              <Text style={[styles.badgePillText, { color: colors.primary }]}>
                Next-Gen Webcomics & Serialized Novels
              </Text>
            </View>

            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Welcome to <Text style={{ color: colors.primary }}>Panelva</Text>
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
              Immerse yourself in high-definition digital comics, serialized webnovels, and a creator-first storytelling ecosystem.
            </Text>

            <View style={styles.featuresList}>
              <View
                style={[
                  styles.featureItem,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle },
                ]}
              >
                <View style={[styles.featureIconBg, { backgroundColor: colors.primaryMuted }]}>
                  <SeriesIcon size={20} color={colors.primary} />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>High-Definition Stories</Text>
                  <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                    Seamless vertical webcomic scrolling and customizable novel reading modes.
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.featureItem,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle },
                ]}
              >
                <View style={[styles.featureIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <CreditsIcon size={20} color={colors.accentGold || '#F59E0B'} />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Credits & Early Access</Text>
                  <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                    Premium enjoys instant access, Plus gets early access in 2h, and free readers read after 4h. Use Credits for chapter unlocks.
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.featureItem,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle },
                ]}
              >
                <View style={[styles.featureIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <PaletteIcon size={20} color="#10B981" />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Creator-Driven Ecosystem</Text>
                  <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                    Direct tipping, transparent revenue splits, and collaboration studio tools.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* STEP 1: Persona / Intent Selection */}
        {currentStep === 1 && (
          <View style={styles.stepCard}>
            <View
              style={[
                styles.badgePill,
                { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight },
              ]}
            >
              <Text style={[styles.badgePillText, { color: colors.primary }]}>Personalization (1/3)</Text>
            </View>

            <Text style={[styles.heroTitle, { color: colors.text }]}>How will you use Panelva?</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
              Choose your primary role to tailor your feed, reading tools, and workspace.
            </Text>

            <View style={styles.personaOptions}>
              <TouchableOpacity
                style={[
                  styles.personaCard,
                  {
                    backgroundColor:
                      selectedRole === 'READER'
                        ? isDark
                          ? 'rgba(37, 99, 235, 0.10)'
                          : 'rgba(37, 99, 235, 0.06)'
                        : colors.surfaceElevated,
                    borderColor: selectedRole === 'READER' ? colors.primary : colors.borderSubtle,
                  },
                ]}
                onPress={() => setSelectedRole('READER')}
                activeOpacity={0.7}
              >
                <View style={styles.personaHeader}>
                  <View style={[styles.personaIconWrapper, { backgroundColor: colors.primaryMuted }]}>
                    <BookOpenIcon size={20} color={colors.primary} />
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      { borderColor: selectedRole === 'READER' ? colors.primary : colors.border },
                      selectedRole === 'READER' && { backgroundColor: colors.primary },
                    ]}
                  >
                    {selectedRole === 'READER' && <CheckCircleIcon size={12} color="#FFFFFF" />}
                  </View>
                </View>
                <Text style={[styles.personaTitle, { color: colors.text }]}>I want to Read</Text>
                <Text style={[styles.personaDesc, { color: colors.textMuted }]}>
                  Explore trending series, bookmark favorites, track reading history, and interact with authors in chapter discussions.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.personaCard,
                  {
                    backgroundColor:
                      selectedRole === 'CREATOR'
                        ? isDark
                          ? 'rgba(37, 99, 235, 0.10)'
                          : 'rgba(37, 99, 235, 0.06)'
                        : colors.surfaceElevated,
                    borderColor: selectedRole === 'CREATOR' ? colors.primary : colors.borderSubtle,
                  },
                ]}
                onPress={() => setSelectedRole('CREATOR')}
                activeOpacity={0.7}
              >
                <View style={styles.personaHeader}>
                  <View style={[styles.personaIconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                    <PaletteIcon size={20} color="#8B5CF6" />
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      { borderColor: selectedRole === 'CREATOR' ? colors.primary : colors.border },
                      selectedRole === 'CREATOR' && { backgroundColor: colors.primary },
                    ]}
                  >
                    {selectedRole === 'CREATOR' && <CheckCircleIcon size={12} color="#FFFFFF" />}
                  </View>
                </View>
                <Text style={[styles.personaTitle, { color: colors.text }]}>I'm a Creator / Artist</Text>
                <Text style={[styles.personaDesc, { color: colors.textMuted }]}>
                  Publish comics and novels, access Creator Studio, configure monetization tiers, and collaborate with creative partners.
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 2: Taste Profiler (Genres & Format) */}
        {currentStep === 2 && (
          <View style={styles.stepCard}>
            <View
              style={[
                styles.badgePill,
                { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight },
              ]}
            >
              <Text style={[styles.badgePillText, { color: colors.primary }]}>Personalization (2/3)</Text>
            </View>

            <Text style={[styles.heroTitle, { color: colors.text }]}>Choose your favorite genres</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
              Select your preferences to customize your Home and Discovery recommendations.
            </Text>

            {/* Format Selection */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Preferred Story Format</Text>
            <View
              style={[
                styles.formatSegmentContainer,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle },
              ]}
            >
              {(['BOTH', 'COMICS', 'NOVELS'] as const).map((fmt) => {
                const isActive = selectedFormat === fmt;
                return (
                  <TouchableOpacity
                    key={fmt}
                    style={[
                      styles.formatSegmentBtn,
                      isActive && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setSelectedFormat(fmt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.formatSegmentText,
                        { color: isActive ? '#FFFFFF' : colors.textMuted, fontWeight: isActive ? '700' : '600' },
                      ]}
                    >
                      {fmt === 'BOTH' ? 'All Stories' : fmt === 'COMICS' ? 'Webcomics' : 'Webnovels'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Genre Tags */}
            <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 18 }]}>
              Favorite Genres ({selectedGenres.length} selected)
            </Text>
            <View style={styles.genreTagsContainer}>
              {ALL_GENRES.map((g) => {
                const isSelected = selectedGenres.includes(g.id);
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.genreTag,
                      {
                        backgroundColor: isSelected ? colors.primaryMuted : colors.surfaceElevated,
                        borderColor: isSelected ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => toggleGenre(g.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.genreTagText,
                        {
                          color: isSelected ? colors.primary : colors.textMuted,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 3: Notification Primer */}
        {currentStep === 3 && (
          <View style={styles.stepCard}>
            <View
              style={[
                styles.badgePill,
                { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight },
              ]}
            >
              <Text style={[styles.badgePillText, { color: colors.primary }]}>Personalization (3/3)</Text>
            </View>

            <Text style={[styles.heroTitle, { color: colors.text }]}>Never miss a chapter release</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
              Receive real-time alerts when your subscribed series update or creators publish new content.
            </Text>

            {/* Notification Preview Card */}
            <View
              style={[
                styles.notificationPreviewCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle },
              ]}
            >
              <View style={styles.notifHeader}>
                <View style={[styles.notifAppIcon, { backgroundColor: colors.primary }]}>
                  <AlertsIcon size={12} color="#FFFFFF" />
                </View>
                <Text style={[styles.notifAppName, { color: colors.textMuted }]}>
                  PANELVA &bull; Just now
                </Text>
              </View>
              <Text style={[styles.notifTitle, { color: colors.text }]}>New Chapter Unlocked!</Text>
              <Text style={[styles.notifBody, { color: colors.textSecondary }]}>
                "Shadow City: Neon Blade" Chapter 43 is now live in Early Access. Read it before anyone else!
              </Text>
            </View>

            <View
              style={[
                styles.notifToggleRow,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifToggleTitle, { color: colors.text }]}>
                  Release & Community Alerts
                </Text>
                <Text style={[styles.notifToggleDesc, { color: colors.textMuted }]}>
                  Notify me when bookmarked series update or creators post announcements.
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.customSwitch,
                  { backgroundColor: notificationsEnabled ? colors.primary : isDark ? colors.surfaceSecondary : colors.border },
                ]}
                onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.customSwitchThumb,
                    notificationsEnabled && styles.customSwitchThumbActive,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 4: Account Creation / Sign In / Guest */}
        {currentStep === 4 && (
          <View style={styles.stepCard}>
            <View
              style={[
                styles.badgePill,
                { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight },
              ]}
            >
              <Text style={[styles.badgePillText, { color: colors.primary }]}>Final Step</Text>
            </View>

            <Text style={[styles.heroTitle, { color: colors.text }]}>
              {isLogin ? 'Sign in to Panelva' : 'Create your Account'}
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
              Sync reading history across mobile and web, manage bookmarks, and access your Credits wallet.
            </Text>

            {authError ? (
              <View style={styles.authErrorContainer}>
                <Text style={styles.authErrorText}>{authError}</Text>
              </View>
            ) : null}

            {!isLogin && (
              <>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Username</Text>
                <TextInput
                  style={[
                    styles.authInput,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.borderSubtle,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Choose a username"
                  placeholderTextColor={colors.textMuted}
                  value={authUsername}
                  onChangeText={setAuthUsername}
                  autoCapitalize="none"
                />
              </>
            )}

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {isLogin ? 'Email or Username' : 'Email Address'}
            </Text>
            <TextInput
              style={[
                styles.authInput,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.borderSubtle,
                  color: colors.text,
                },
              ]}
              placeholder={isLogin ? 'Email or Username' : 'your.email@example.com'}
              placeholderTextColor={colors.textMuted}
              value={authEmail}
              onChangeText={setAuthEmail}
              autoCapitalize="none"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
            <TextInput
              style={[
                styles.authInput,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.borderSubtle,
                  color: colors.text,
                },
              ]}
              placeholder="Password (min 6 characters)"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={authPassword}
              onChangeText={(pass) => setAuthPassword(pass)}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                { backgroundColor: colors.primary, opacity: authLoading ? 0.7 : 1 },
              ]}
              onPress={handleAuthSubmit}
              disabled={authLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionBtnText}>
                {authLoading ? 'Connecting...' : isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsLogin(!isLogin);
                setAuthError('');
              }}
              style={styles.authToggleBtn}
              activeOpacity={0.7}
            >
              <Text style={[styles.authToggleText, { color: colors.primary }]}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]} />
            </View>

            <TouchableOpacity
              style={[
                styles.guestActionBtn,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle },
              ]}
              onPress={finalizeAndEnter}
              accessibilityRole="button"
              accessibilityLabel="Explore as guest"
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Text style={[styles.guestActionBtnText, { color: colors.text }]}>
                  Explore First as Guest
                </Text>
                <ChevronRightIcon size={14} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation Buttons */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.surfaceElevated, borderTopColor: colors.borderSubtle },
        ]}
      >
        {currentStep > 0 ? (
          <TouchableOpacity
            style={[
              styles.backBtn,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle },
            ]}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ChevronLeftIcon size={16} color={colors.text} />
              <Text style={[styles.backBtnText, { color: colors.text }]}>Back</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {currentStep < 4 && (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            onPress={handleNext}
            accessibilityRole="button"
            accessibilityLabel={currentStep === 3 ? 'Finish setup' : 'Continue'}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.nextBtnText}>
                {currentStep === 3 ? 'Finish Setup' : 'Continue'}
              </Text>
              <ChevronRightIcon size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    marginRight: 16,
  },
  progressBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  skipButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexGrow: 1,
  },
  stepCard: {
    flex: 1,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  featuresList: {
    gap: 14,
    marginTop: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 14,
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  personaOptions: {
    gap: 14,
  },
  personaCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 18,
  },
  personaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  personaIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  personaDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formatSegmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: 12,
  },
  formatSegmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  formatSegmentText: {
    fontSize: 13,
  },
  genreTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
  },
  genreTagText: {
    fontSize: 13,
  },
  notificationPreviewCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  notifAppIcon: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifAppName: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  notifBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  notifToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  notifToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  notifToggleDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  customSwitch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  customSwitchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  customSwitchThumbActive: {
    alignSelf: 'flex-end',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  authInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 14,
  },
  authErrorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  authErrorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryActionBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  authToggleBtn: {
    marginTop: 14,
    alignItems: 'center',
  },
  authToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  guestActionBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  guestActionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  backBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 2,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
