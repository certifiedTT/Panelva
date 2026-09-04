import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Palette,
  X,
  Sparkles,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Button } from '../common/Button';
import { trpc } from '../../../lib/trpc';

interface BecomeCreatorModalProps {
  visible: boolean;
  onClose: () => void;
  sessionToken: string | null;
  onRequireAuth: () => void;
  onSuccessSubmit?: () => void;
}

const CREATOR_TYPES = [
  { id: 'ILLUSTRATOR', label: 'Illustrator / Artist', desc: 'Comics, Webtoons, Manga, Concept Art' },
  { id: 'WRITER', label: 'Writer / Novelist', desc: 'Light novels, web novels, screenplays' },
  { id: 'STUDIO', label: 'Creative Studio', desc: 'Collaborative teams, coloring & lineart production' },
];

export function BecomeCreatorModal({
  visible,
  onClose,
  sessionToken,
  onRequireAuth,
  onSuccessSubmit,
}: BecomeCreatorModalProps) {
  const [penName, setPenName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedType, setSelectedType] = useState('ILLUSTRATOR');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  const submitApplication = trpc.creator.submitApplication.useMutation({
    onSuccess: () => {
      Alert.alert(
        'Application Submitted',
        'Your creator application has been submitted for review. You will receive an alert once approved.'
      );
      setPenName('');
      setBio('');
      setPortfolioUrl('');
      onClose();
      if (onSuccessSubmit) onSuccessSubmit();
    },
    onError: (err) => {
      Alert.alert('Submission Error', err.message);
    },
  });

  const handleSubmit = () => {
    if (!sessionToken) {
      onClose();
      onRequireAuth();
      return;
    }

    if (!penName.trim()) {
      Alert.alert('Required Field', 'Please enter your public Pen Name.');
      return;
    }
    if (!portfolioUrl.trim()) {
      Alert.alert('Required Field', 'Please provide a valid portfolio or sample artwork link.');
      return;
    }

    submitApplication.mutate({
      penName: penName.trim(),
      bio: bio.trim() || 'Comic & Novel Creator on Panelva',
      type: selectedType as any,
      portfolioUrl: portfolioUrl.trim(),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={styles.iconCircle}>
                  <Palette size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.title}>Become a Panelva Creator</Text>
                  <Text style={styles.subtitle}>Publish series, grow your audience & earn</Text>
                </View>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close modal"
                onPress={onClose}
                style={styles.closeBtn}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Guest Warning Banner if unauthenticated */}
              {!sessionToken && (
                <View style={styles.guestBanner}>
                  <Sparkles size={16} color={colors.primary} />
                  <Text style={styles.guestBannerText}>
                    You will be prompted to sign in when submitting your application.
                  </Text>
                </View>
              )}

              {/* Pen Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>PEN NAME / PUBLIC CREATOR NAME *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. LunaDraws, AlexMage"
                  placeholderTextColor={colors.textMuted}
                  value={penName}
                  onChangeText={setPenName}
                  editable={!submitApplication.isLoading}
                />
              </View>

              {/* Creator Type */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CREATOR PRIMARY DISCIPLINE *</Text>
                <View style={{ gap: spacing.sm }}>
                  {CREATOR_TYPES.map((t) => {
                    const isSelected = selectedType === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={t.label}
                        style={[
                          styles.typeCard,
                          {
                            backgroundColor: isSelected ? colors.card : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setSelectedType(t.id)}
                        disabled={submitApplication.isLoading}
                      >
                        <View
                          style={[
                            styles.typeRadio,
                            { borderColor: isSelected ? colors.primary : colors.border },
                          ]}
                        >
                          {isSelected && <View style={styles.typeRadioInner} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.typeTitle}>{t.label}</Text>
                          <Text style={styles.typeDesc}>{t.desc}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Portfolio URL */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>PORTFOLIO / SAMPLE URL *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://artstation.com/... or Google Drive link"
                  placeholderTextColor={colors.textMuted}
                  value={portfolioUrl}
                  onChangeText={setPortfolioUrl}
                  keyboardType="url"
                  autoCapitalize="none"
                  editable={!submitApplication.isLoading}
                />
              </View>

              {/* Bio */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>SHORT BIO & PITCH</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Tell us about the series or projects you plan to publish..."
                  placeholderTextColor={colors.textMuted}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={3}
                  editable={!submitApplication.isLoading}
                />
              </View>

              {/* Submit Button */}
              <View style={{ marginTop: spacing.md }}>
                <Button
                  title={
                    submitApplication.isLoading
                      ? 'Submitting Application...'
                      : 'Submit Creator Application'
                  }
                  variant="primary"
                  disabled={submitApplication.isLoading}
                  onPress={handleSubmit}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
  },
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '92%',
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
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  guestBannerText: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    flex: 1,
  },
  fieldGroup: {
    marginTop: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.small.fontSize,
    color: colors.text,
  },
  textArea: {
    minHeight: 96,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.small.fontSize,
    color: colors.text,
    textAlignVertical: 'top',
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  typeRadio: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeRadioInner: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  typeTitle: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    fontWeight: '700',
    color: colors.text,
  },
  typeDesc: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
