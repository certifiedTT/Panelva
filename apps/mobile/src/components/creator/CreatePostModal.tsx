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
  Sparkles,
  X,
  Plus,
  Trash2,
  Check,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { trpc } from '../../../lib/trpc';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccessCreated?: () => void;
}

export interface PostTypeConfig {
  id: string;
  label: string;
  badge: string;
  placeholderTitle: string;
  placeholderContent: string;
  requiresMedia?: boolean;
}

export const CREATOR_POST_TYPES: PostTypeConfig[] = [
  {
    id: 'TEXT',
    label: 'Text Post',
    badge: 'General',
    placeholderTitle: 'e.g. Quick thoughts on the latest episode',
    placeholderContent: 'Share updates, thoughts, or short notes with your community...',
  },
  {
    id: 'IMAGE',
    label: 'Image Post',
    badge: 'Visual',
    placeholderTitle: 'e.g. New cover illustration WIP',
    placeholderContent: 'Describe your illustration, sketch, or artwork...',
    requiresMedia: true,
  },
  {
    id: 'POLL',
    label: 'Interactive Poll',
    badge: 'Poll',
    placeholderTitle: 'e.g. Which character background should we explore next?',
    placeholderContent: 'Add context or voting rules for your readers...',
  },
  {
    id: 'ANNOUNCEMENT',
    label: 'Announcement',
    badge: 'Official',
    placeholderTitle: 'e.g. Season 2 Release Schedule & Print Edition',
    placeholderContent: 'Important announcements, schedule changes, or release dates...',
  },
  {
    id: 'SERIES_UPDATE',
    label: 'Series Update',
    badge: 'Episode Drop',
    placeholderTitle: 'e.g. Episode 18 now live + early access info',
    placeholderContent: 'Let readers know about newly published chapters or hiatus updates...',
  },
  {
    id: 'BEHIND_THE_SCENES',
    label: 'Behind the Scenes',
    badge: 'Studio BTS',
    placeholderTitle: 'e.g. Storyboarding process for the grand duel scene',
    placeholderContent: 'Share sketches, drafts, script notes, and production stories...',
  },
  {
    id: 'CONCEPT_ART',
    label: 'Concept Art',
    badge: 'Art Design',
    placeholderTitle: 'e.g. Character design turnaround & color palette',
    placeholderContent: 'Showcase character turnaround sheets, weapon blueprints, and arrays...',
    requiresMedia: true,
  },
  {
    id: 'QA',
    label: 'Q&A / AMA',
    badge: 'Q&A',
    placeholderTitle: 'e.g. Ask Me Anything: Lore & Magic System Q&A',
    placeholderContent: 'Invite fans to drop their lore questions and character inquiries...',
  },
  {
    id: 'VIDEO',
    label: 'Video Clip',
    badge: 'Animation',
    placeholderTitle: 'e.g. Animated teaser / Speedpaint timelapse',
    placeholderContent: 'Share video link or speedpaint process description...',
    requiresMedia: true,
  },
];

const POLL_DURATIONS = [
  { label: '24 Hours', days: 1 },
  { label: '3 Days', days: 3 },
  { label: '7 Days', days: 7 },
  { label: '14 Days', days: 14 },
];

export function CreatePostModal({ visible, onClose, onSuccessCreated }: CreatePostModalProps) {
  const [selectedTypeId, setSelectedTypeId] = useState('TEXT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrlInput, setMediaUrlInput] = useState('');

  // Poll state
  const [pollOptions, setPollOptions] = useState<string[]>(['Option A', 'Option B']);
  const [pollDurationDays, setPollDurationDays] = useState(3);

  const currentTypeConfig =
    CREATOR_POST_TYPES.find((t) => t.id === selectedTypeId) || CREATOR_POST_TYPES[0];

  const createPostMutation = trpc.post.createPost.useMutation({
    onSuccess: () => {
      Alert.alert('Post Published', 'Your post is now live in the Creator Hub.');
      resetForm();
      onClose();
      if (onSuccessCreated) onSuccessCreated();
    },
    onError: (err) => {
      Alert.alert('Post Creation Error', err.message);
    },
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
    setMediaUrlInput('');
    setPollOptions(['Option A', 'Option B']);
    setPollDurationDays(3);
  };

  const handleAddPollOption = () => {
    if (pollOptions.length >= 6) {
      Alert.alert('Max Options', 'You can add up to 6 options per poll.');
      return;
    }
    setPollOptions((prev) => [...prev, `Option ${String.fromCharCode(65 + prev.length)}`]);
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length <= 2) {
      Alert.alert('Minimum Options', 'A poll requires at least 2 options.');
      return;
    }
    setPollOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePollOptionText = (index: number, text: string) => {
    setPollOptions((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const handlePublish = () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please provide a title for your post.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Content Required', 'Please enter your message or announcement text.');
      return;
    }

    if (selectedTypeId === 'POLL') {
      const cleanOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (cleanOptions.length < 2) {
        Alert.alert('Incomplete Poll', 'Please provide text for at least 2 poll options.');
        return;
      }
    }

    const mediaUrls = mediaUrlInput.trim() ? [mediaUrlInput.trim()] : [];
    const finalPollOptions =
      selectedTypeId === 'POLL' ? pollOptions.map((o) => o.trim()).filter(Boolean) : [];

    createPostMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      type: selectedTypeId,
      mediaUrls,
      pollOptions: finalPollOptions,
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
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
                  <Sparkles size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.title}>New Creator Post</Text>
                  <Text style={styles.subtitle}>
                    {currentTypeConfig.badge} • Publish to Community Feed
                  </Text>
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
              {/* Horizontal Post Format Selector */}
              <Text style={styles.sectionLabel}>POST FORMAT</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typeSelectorScroll}
              >
                {CREATOR_POST_TYPES.map((t) => {
                  const isSelected = selectedTypeId === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`Format: ${t.label}`}
                      style={[
                        styles.typeSelectorBtn,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedTypeId(t.id)}
                    >
                      <Text
                        style={[
                          styles.typeSelectorText,
                          {
                            color: isSelected ? colors.text : colors.textMuted,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Title Input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>TITLE *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={currentTypeConfig.placeholderTitle}
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  editable={!createPostMutation.isLoading}
                />
              </View>

              {/* Content Input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>MESSAGE CONTENT *</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder={currentTypeConfig.placeholderContent}
                  placeholderTextColor={colors.textMuted}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={4}
                  editable={!createPostMutation.isLoading}
                />
              </View>

              {/* Media Attachment URL */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  IMAGE / ARTWORK URL {currentTypeConfig.requiresMedia ? '*' : '(OPTIONAL)'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor={colors.textMuted}
                  value={mediaUrlInput}
                  onChangeText={setMediaUrlInput}
                  keyboardType="url"
                  autoCapitalize="none"
                  editable={!createPostMutation.isLoading}
                />
              </View>

              {/* DYNAMIC POLL CONFIGURATOR (If post type is POLL) */}
              {selectedTypeId === 'POLL' && (
                <Card style={styles.pollConfigCard}>
                  <View style={styles.pollHeaderRow}>
                    <Text style={styles.pollHeading}>Poll Options ({pollOptions.length}/6)</Text>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Add Poll Option"
                      style={styles.addOptionBtn}
                      onPress={handleAddPollOption}
                      disabled={createPostMutation.isLoading}
                    >
                      <Plus size={16} color={colors.primary} />
                      <Text style={styles.addOptionText}>Add Option</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Option inputs */}
                  <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                    {pollOptions.map((opt, idx) => (
                      <View key={idx} style={styles.pollOptionRow}>
                        <View style={styles.optionIndexBadge}>
                          <Text style={styles.optionIndexText}>
                            {String.fromCharCode(65 + idx)}
                          </Text>
                        </View>
                        <TextInput
                          style={styles.pollOptionInput}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          placeholderTextColor={colors.textMuted}
                          value={opt}
                          onChangeText={(t) => handleUpdatePollOptionText(idx, t)}
                          editable={!createPostMutation.isLoading}
                        />
                        {pollOptions.length > 2 && (
                          <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={`Delete option ${String.fromCharCode(65 + idx)}`}
                            style={styles.deleteOptionBtn}
                            onPress={() => handleRemovePollOption(idx)}
                            disabled={createPostMutation.isLoading}
                          >
                            <Trash2 size={18} color={colors.danger} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Poll Duration */}
                  <View style={{ marginTop: spacing.md }}>
                    <Text style={styles.fieldLabel}>VOTING DURATION</Text>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                      {POLL_DURATIONS.map((dur) => {
                        const isSelected = pollDurationDays === dur.days;
                        return (
                          <TouchableOpacity
                            key={dur.days}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            accessibilityLabel={`Duration ${dur.label}`}
                            style={[
                              styles.durPill,
                              {
                                backgroundColor: isSelected ? colors.primary : colors.surface,
                                borderColor: isSelected ? colors.primary : colors.border,
                              },
                            ]}
                            onPress={() => setPollDurationDays(dur.days)}
                          >
                            <Text
                              style={[
                                styles.durPillText,
                                { color: isSelected ? colors.text : colors.textMuted },
                              ]}
                            >
                              {dur.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </Card>
              )}

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Cancel"
                    variant="secondary"
                    onPress={onClose}
                    disabled={createPostMutation.isLoading}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title={createPostMutation.isLoading ? 'Publishing...' : 'Publish Post'}
                    variant="primary"
                    disabled={createPostMutation.isLoading}
                    onPress={handlePublish}
                  />
                </View>
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
  sectionLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  typeSelectorScroll: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  typeSelectorBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  typeSelectorText: {
    fontSize: typography.small.fontSize,
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
  pollConfigCard: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  pollHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pollHeading: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    fontWeight: '700',
    color: colors.text,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  addOptionText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  pollOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIndexText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.textMuted,
  },
  pollOptionInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: typography.small.fontSize,
    color: colors.text,
  },
  deleteOptionBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durPillText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
