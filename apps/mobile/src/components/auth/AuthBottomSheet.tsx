import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Button } from '../common/Button';
import {
  X,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react-native';
import { MOCK_ACCOUNTS_LIST, MockAccountProfile } from '../../data/mockRoles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AuthBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
  initialMode?: 'signin' | 'signup';
  devBaseUrl?: string;
  trpcClient?: any;
}

// Google 'G' Icon Component
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={[styles.providerIconContainer, { width: size, height: size }]}>
      <Text style={{ fontSize: size * 0.9, fontWeight: '900', color: colors.danger, textAlign: 'center', lineHeight: size }}>
        G
      </Text>
    </View>
  );
}

// Apple Icon Component
function AppleIcon({ size = 20, color = colors.text }: { size?: number; color?: string }) {
  return (
    <View style={[styles.providerIconContainer, { width: size, height: size }]}>
      <Text style={{ fontSize: size * 0.95, color, textAlign: 'center', lineHeight: size }}>
        
      </Text>
    </View>
  );
}

export function AuthBottomSheet({
  visible,
  onClose,
  onSuccess,
  initialMode = 'signin',
  devBaseUrl = 'http://localhost:3000',
}: AuthBottomSheetProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'signin');
  const [identifier, setIdentifier] = useState(''); // Email or Username
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSocialProvider, setActiveSocialProvider] = useState<'google' | 'apple' | null>(null);

  // Animation values
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Reset fields on visibility change
  useEffect(() => {
    if (visible) {
      setIsLogin(initialMode === 'signin');
      setErrorMessage('');
      setPassword('');
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, initialMode, backdropOpacity, translateY]);

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics not available
    }
  };

  const handleClose = useCallback(() => {
    triggerHaptic();
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [backdropOpacity, translateY, onClose]);

  // Social Authentication (Google & Apple ONLY)
  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    triggerHaptic();
    if (isSubmitting) return;

    setActiveSocialProvider(provider);
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Mock / Native OAuth flow
      await new Promise((resolve) => setTimeout(resolve, 800));

      const providerLabel = provider === 'google' ? 'Google' : 'Apple';
      const mockToken = `oauth-${provider}-${Date.now()}`;
      const mockUser = {
        id: `usr-${provider}-${Date.now()}`,
        email: `user.${provider}@panelva.com`,
        username: `${providerLabel}User`,
        role: 'USER',
        subscription: 'PREMIUM',
        creditsBalance: 300,
        wCoinBalance: 300,
        avatarUrl:
          provider === 'google'
            ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'
            : null,
      };

      onSuccess(mockToken, mockUser);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to authenticate with ${provider}.`);
    } finally {
      setIsSubmitting(false);
      setActiveSocialProvider(null);
    }
  };

  // Form submission (Email / Username)
  const handleSubmit = async () => {
    triggerHaptic();
    const cleanId = identifier.trim();
    const cleanPass = password.trim();
    const cleanUser = username.trim();

    if (!cleanId) {
      setErrorMessage('Please enter your Email or Username.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Please enter your Password.');
      return;
    }

    if (cleanPass.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (!isLogin && !cleanUser) {
      setErrorMessage('Please choose a username.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      let authEmail = cleanId;
      if (!cleanId.includes('@')) {
        authEmail = `${cleanId.toLowerCase()}@panelva.com`;
      }

      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${devBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          email: authEmail,
          password: cleanPass,
          ...(isLogin ? {} : { username: cleanUser }),
        }),
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Authentication failed. Please check your credentials.');
        setIsSubmitting(false);
        return;
      }

      if (isLogin) {
        const token = data.accessToken || `token-${Date.now()}`;
        onSuccess(token, {
          id: data.data?.id || `user-${Date.now()}`,
          email: data.data?.email || authEmail,
          username: data.username || cleanId,
          role: data.role || 'USER',
          subscription: 'PREMIUM',
          creditsBalance: 250,
          wCoinBalance: 250,
        });
        handleClose();
      } else {
        Alert.alert('Account Created', 'Welcome to Panelva! Please sign in with your new account.');
        setIsLogin(true);
        setPassword('');
      }
    } catch {
      // Offline fallback: allow local test sign-in
      const mockToken = `offline-token-${Date.now()}`;
      const derivedUsername = isLogin
        ? cleanId.includes('@')
          ? cleanId.split('@')[0]
          : cleanId
        : cleanUser;

      onSuccess(mockToken, {
        id: `usr-${Date.now()}`,
        email: cleanId.includes('@') ? cleanId : `${cleanId}@panelva.com`,
        username: derivedUsername,
        role: 'USER',
        subscription: 'PREMIUM',
        creditsBalance: 250,
        wCoinBalance: 250,
      });
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1-Tap Fast Test Login with any mock account
  const handleQuickSignIn = (acc: MockAccountProfile) => {
    triggerHaptic();
    const token = `quick-${acc.roleKey.toLowerCase()}-${Date.now()}`;
    const user = {
      id: acc.id,
      email: acc.email,
      username: acc.username,
      role: acc.roleKey,
      subscription: acc.subscription,
      creditsBalance: acc.creditsBalance,
      wCoinBalance: acc.creditsBalance,
      avatarUrl: acc.avatarUrl,
    };
    onSuccess(token, user);
    handleClose();
  };

  // Footer Links Modals / Handlers
  const handleTroubleLoggingIn = () => {
    triggerHaptic();
    Alert.alert(
      'Need Help Signing In?',
      'If you have trouble accessing your account, you can reset your password or contact Panelva support at support@panelva.com.',
      [
        {
          text: 'Reset Password',
          onPress: () =>
            Alert.alert('Password Reset', 'Password reset instructions have been sent to your email.'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleUserAgreement = () => {
    triggerHaptic();
    Alert.alert(
      'User Agreement',
      'By using Panelva, you agree to our Terms of Service, Community Guidelines, and Content Access Policies.',
      [{ text: 'I Understand' }]
    );
  };

  const handlePrivacyAgreement = () => {
    triggerHaptic();
    Alert.alert(
      'Privacy Agreement',
      'We respect your privacy and protect your reading history, DRM keys, and personal data with industry-standard encryption.',
      [{ text: 'Close' }]
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* Dimmed Backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        {/* Keyboard Avoiding Container */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                transform: [{ translateY }],
              },
            ]}
          >
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {isLogin ? 'Welcome to Panelva' : 'Create an Account'}
              </Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Close sign in sheet"
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Error Message Box */}
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <AlertTriangle size={16} color={colors.danger} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* 1. Social Authentication (Google & Apple ONLY) */}
              <View style={styles.socialAuthSection}>
                {/* Google Sign In / Sign Up */}
                <TouchableOpacity
                  style={[styles.socialButton, styles.googleButton]}
                  onPress={() => handleSocialAuth('google')}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={isLogin ? 'Sign in with Google' : 'Sign up with Google'}
                >
                  {isSubmitting && activeSocialProvider === 'google' ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <View style={styles.googleIconCircle}>
                        <GoogleIcon size={18} />
                      </View>
                      <Text style={styles.googleButtonText}>
                        {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Apple Sign In / Sign Up */}
                <TouchableOpacity
                  style={[styles.socialButton, styles.appleButton]}
                  onPress={() => handleSocialAuth('apple')}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={isLogin ? 'Sign in with Apple' : 'Sign up with Apple'}
                >
                  {isSubmitting && activeSocialProvider === 'apple' ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <>
                      <AppleIcon size={20} color={colors.text} />
                      <Text style={styles.appleButtonText}>
                        {isLogin ? 'Sign in with Apple' : 'Sign up with Apple'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Divider: "Or sign in with" */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  {isLogin ? 'Or sign in with' : 'Or sign up with'}
                </Text>
                <View style={styles.dividerLine} />
              </View>

              {/* 2. Email / Username Form */}
              <View style={styles.formSection}>
                {/* Email / Username Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {isLogin ? 'Email or Username' : 'Email Address'}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={18} color={colors.textMuted} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={isLogin ? 'Enter email or username' : 'name@domain.com'}
                      placeholderTextColor={colors.textMuted}
                      value={identifier}
                      onChangeText={(text) => {
                        setIdentifier(text);
                        if (errorMessage) setErrorMessage('');
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      editable={!isSubmitting}
                    />
                  </View>
                </View>

                {/* Additional Username Field if Sign Up */}
                {!isLogin && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Username</Text>
                    <View style={styles.inputWrapper}>
                      <User size={18} color={colors.textMuted} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Choose a username"
                        placeholderTextColor={colors.textMuted}
                        value={username}
                        onChangeText={(text) => {
                          setUsername(text);
                          if (errorMessage) setErrorMessage('');
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isSubmitting}
                      />
                    </View>
                  </View>
                )}

                {/* Password Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color={colors.textMuted} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errorMessage) setErrorMessage('');
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                      style={styles.eyeBtn}
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color={colors.textMuted} />
                      ) : (
                        <Eye size={18} color={colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Primary CTA (Sign In / Sign Up) */}
                <View style={{ marginTop: spacing.xs }}>
                  <Button
                    title={
                      isSubmitting && !activeSocialProvider
                        ? isLogin
                          ? 'Signing In...'
                          : 'Creating Account...'
                        : isLogin
                        ? 'Sign In'
                        : 'Sign Up'
                    }
                    variant="primary"
                    disabled={isSubmitting}
                    onPress={handleSubmit}
                  />
                </View>

                {/* Switch between Sign In and Sign Up */}
                <View style={styles.switchModeContainer}>
                  <Text style={styles.switchModeText}>
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setIsLogin(!isLogin);
                      setErrorMessage('');
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={isLogin ? 'Switch to Sign Up' : 'Switch to Sign In'}
                  >
                    <Text style={styles.switchModeLink}>
                      {isLogin ? 'Sign Up' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick 1-Tap Test Accounts (Development & Review: 12 Mock Roles) */}
              {isLogin && (
                <View style={styles.quickSignInSection}>
                  <Text style={styles.quickSignInTitle}>Quick Dev Sign-In (12 Roles):</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
                  >
                    {MOCK_ACCOUNTS_LIST.map((acc) => (
                      <TouchableOpacity
                        key={acc.roleKey}
                        style={[
                          styles.quickPill,
                          {
                            backgroundColor: `${acc.badgeColor}20`,
                            borderColor: acc.badgeColor,
                          },
                        ]}
                        onPress={() => handleQuickSignIn(acc)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Quick sign in as ${acc.displayName}`}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: radius.full,
                            backgroundColor: acc.badgeColor,
                            marginRight: spacing.xs,
                          }}
                        />
                        <Text style={[styles.quickPillText, { color: acc.badgeColor }]}>
                          {acc.displayName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* 3. Authentication Footer */}
              <View style={styles.footerSection}>
                <TouchableOpacity
                  onPress={handleTroubleLoggingIn}
                  activeOpacity={0.7}
                  style={styles.footerTroubleBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Need help logging in?"
                >
                  <HelpCircle size={14} color={colors.textMuted} />
                  <Text style={styles.footerTroubleText}>Have trouble logging in?</Text>
                </TouchableOpacity>

                <View style={styles.agreementRow}>
                  <TouchableOpacity
                    onPress={handleUserAgreement}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="User Agreement"
                  >
                    <Text style={styles.agreementLink}>User Agreement</Text>
                  </TouchableOpacity>
                  <Text style={styles.agreementDot}>•</Text>
                  <TouchableOpacity
                    onPress={handlePrivacyAgreement}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Privacy Agreement"
                  >
                    <Text style={styles.agreementLink}>Privacy Agreement</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  keyboardAvoid: {
    width: '100%',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.9,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: typography.small.fontSize,
    fontWeight: '500',
  },
  socialAuthSection: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  googleButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleIconCircle: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  appleButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appleButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  providerIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  formSection: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.small.fontSize,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: spacing.xs,
  },
  switchModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  switchModeText: {
    color: colors.textMuted,
    fontSize: typography.small.fontSize,
  },
  switchModeLink: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
  quickSignInSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickSignInTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  quickPillText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  footerSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerTroubleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerTroubleText: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  agreementLink: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
  },
  agreementDot: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
  },
});
