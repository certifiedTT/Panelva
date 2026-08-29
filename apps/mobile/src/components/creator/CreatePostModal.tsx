import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { trpc } from '../../../lib/trpc';
import {
  CloseIcon,
  SparklesIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
} from '../common/Icons';

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
  const { colors } = useTheme();
  const [selectedTypeId, setSelectedTypeId] = useState('TEXT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrlInput, setMediaUrlInput] = useState('');

  // Poll state
  const [pollOptions, setPollOptions] = useState<string[]>(['Option A', 'Option B']);
  const [pollDurationDays, setPollDurationDays] = useState(3);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);

  const currentTypeConfig =
    CREATOR_POST_TYPES.find((t) => t.id === selectedTypeId) || CREATOR_POST_TYPES[0];

  const createPostMutation = trpc.post.createPost.useMutation({
    onSuccess: () => {
      Alert.alert('Post Published! ✨', 'Your post is now live in the Creator Hub.');
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
    setIsMultipleChoice(false);
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
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
                <SparklesIcon size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>New Creator Post</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {currentTypeConfig.badge} • Publish to Community Feed
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <CloseIcon size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
            {/* Horizontal Post Format Selector */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Post Format</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeSelectorScroll}>
              {CREATOR_POST_TYPES.map((t) => {
                const isSelected = selectedTypeId === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.typeSelectorBtn,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceElevated,
                        borderColor: isSelected ? colors.primaryDark : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedTypeId(t.id)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.typeSelectorText,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary, fontWeight: isSelected ? '700' : '500' },
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
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
                placeholder={currentTypeConfig.placeholderTitle}
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Content Input */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Message Content *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
                placeholder={currentTypeConfig.placeholderContent}
                placeholderTextColor={colors.textMuted}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Media Attachment URL */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Image / Artwork URL {currentTypeConfig.requiresMedia ? '*' : '(Optional)'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={colors.textMuted}
                value={mediaUrlInput}
                onChangeText={setMediaUrlInput}
              />
            </View>

            {/* DYNAMIC POLL CONFIGURATOR (If post type is POLL) */}
            {selectedTypeId === 'POLL' && (
              <View style={[styles.pollConfigCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.pollHeading, { color: colors.text }]}>Poll Options ({pollOptions.length}/6)</Text>
                  <TouchableOpacity style={styles.addOptionBtn} onPress={handleAddPollOption}>
                    <PlusIcon size={14} color={colors.primary} />
                    <Text style={[styles.addOptionText, { color: colors.primary }]}>Add Option</Text>
                  </TouchableOpacity>
                </View>

                {/* Option inputs */}
                <View style={{ gap: 8, marginTop: 8 }}>
                  {pollOptions.map((opt, idx) => (
                    <View key={idx} style={styles.pollOptionRow}>
                      <View style={[styles.optionIndexBadge, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.optionIndexText, { color: colors.textSecondary }]}>
                          {String.fromCharCode(65 + idx)}
                        </Text>
                      </View>
                      <TextInput
                        style={[
                          styles.pollOptionInput,
                          { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
                        ]}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        placeholderTextColor={colors.textMuted}
                        value={opt}
                        onChangeText={(t) => handleUpdatePollOptionText(idx, t)}
                      />
                      {pollOptions.length > 2 && (
                        <TouchableOpacity
                          style={styles.deleteOptionBtn}
                          onPress={() => handleRemovePollOption(idx)}
                        >
                          <TrashIcon size={16} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                {/* Poll Duration */}
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 6 }]}>
                    Voting Duration
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {POLL_DURATIONS.map((dur) => {
                      const isSelected = pollDurationDays === dur.days;
                      return (
                        <TouchableOpacity
                          key={dur.days}
                          style={[
                            styles.durPill,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.surface,
                              borderColor: isSelected ? colors.primaryDark : colors.border,
                            },
                          ]}
                          onPress={() => setPollDurationDays(dur.days)}
                        >
                          <Text style={[styles.durPillText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
                            {dur.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.cancelActionBtn, { borderColor: colors.border }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelActionText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.publishBtn, { backgroundColor: colors.primary }]}
                onPress={handlePublish}
                disabled={createPostMutation.isLoading}
                activeOpacity={0.85}
              >
                {createPostMutation.isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <CheckIcon size={16} color="#FFFFFF" />
                    <Text style={styles.publishBtnText}>Publish Post</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  typeSelectorScroll: {
    gap: 8,
    paddingBottom: 14,
  },
  typeSelectorBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeSelectorText: {
    fontSize: 12,
  },
  fieldGroup: {
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  textArea: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pollConfigCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    gap: 8,
  },
  pollHeading: {
    fontSize: 13,
    fontWeight: '800',
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pollOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionIndexBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIndexText: {
    fontSize: 12,
    fontWeight: '800',
  },
  pollOptionInput: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  deleteOptionBtn: {
    padding: 6,
  },
  durPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  durPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  cancelActionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  publishBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
