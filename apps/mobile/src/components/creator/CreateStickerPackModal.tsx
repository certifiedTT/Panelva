import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { X, ArrowRight, ArrowLeft, Upload, Plus, Trash2, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@panelva/theme';
import { trpc } from '../../../lib/trpc';

export interface CreateStickerPackModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface StickerDraft {
  name: string;
  imageUrl: string;
  animated: boolean;
}

export function CreateStickerPackModal({ visible, onClose, onSuccess }: CreateStickerPackModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80'
  );

  // Step 2: Stickers
  const [stickers, setStickers] = useState<StickerDraft[]>([
    {
      name: 'Hero Pose',
      imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=80',
      animated: false,
    },
    {
      name: 'Shocked',
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&auto=format&fit=crop&q=80',
      animated: true,
    },
  ]);
  const [newStickerName, setNewStickerName] = useState('');
  const [newStickerUrl, setNewStickerUrl] = useState('');
  const [newStickerAnimated, setNewStickerAnimated] = useState(false);

  // Step 3: Distribution
  const [distribution, setDistribution] = useState<'FREE' | 'PAID' | 'MEMBERSHIP'>('FREE');
  const [creditPrice, setCreditPrice] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mutations
  const createPackMutation = (trpc.creator as any).createStickerPack.useMutation();
  const uploadStickersMutation = (trpc.creator as any).uploadStickers.useMutation();
  const submitReviewMutation = (trpc.creator as any).submitStickerPackForReview.useMutation();

  const handleAddSticker = () => {
    if (!newStickerUrl.trim()) {
      Alert.alert('Image URL Required', 'Please provide a valid sticker image URL (PNG/WebP).');
      return;
    }
    if (stickers.length >= 64) {
      Alert.alert('Limit Reached', 'A sticker pack supports a maximum of 64 stickers.');
      return;
    }

    setStickers((prev) => [
      ...prev,
      {
        name: newStickerName.trim() || `Sticker ${prev.length + 1}`,
        imageUrl: newStickerUrl.trim(),
        animated: newStickerAnimated,
      },
    ]);
    setNewStickerName('');
    setNewStickerUrl('');
    setNewStickerAnimated(false);
  };

  const handleRemoveSticker = (index: number) => {
    setStickers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFinalSubmit = async () => {
    if (stickers.length === 0) {
      Alert.alert('Stickers Required', 'Please upload at least 1 sticker before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const priceNum = distribution === 'PAID' ? parseInt(creditPrice, 10) || 100 : 0;

      // 1. Create Pack
      const createdPack = await createPackMutation.mutateAsync({
        title,
        description,
        coverImage,
        accessType: distribution,
        price: priceNum,
      });

      // 2. Upload Stickers
      await uploadStickersMutation.mutateAsync({
        packId: createdPack.id,
        stickers: stickers.map((s, idx) => ({
          name: s.name,
          imageUrl: s.imageUrl,
          animated: s.animated,
          width: 128,
          height: 128,
          order: idx,
        })),
      });

      // 3. Submit for Review
      await submitReviewMutation.mutateAsync({
        packId: createdPack.id,
      });

      Alert.alert(
        'Submitted for Review! 🎉',
        'Your sticker pack is now in the review queue. Moderators will verify compliance and publish it soon.'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Creation Failed', err.message || 'Unable to submit sticker pack.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Create Sticker Pack</Text>
              <Text style={styles.stepIndicator}>Step {currentStep} of 3</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
          </View>

          {/* Step 1: Metadata */}
          {currentStep === 1 && (
            <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeading}>Pack Information</Text>
              <Text style={styles.fieldLabel}>Pack Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Neon Blade Chibi Express"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
                maxLength={60}
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your sticker pack for readers..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={300}
              />

              <Text style={styles.fieldLabel}>Cover Image URL (PNG/WebP) *</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor={colors.textMuted}
                value={coverImage}
                onChangeText={setCoverImage}
              />

              {coverImage ? (
                <View style={styles.coverPreviewContainer}>
                  <Text style={styles.previewLabel}>Cover Preview</Text>
                  <ExpoImage source={{ uri: coverImage }} style={styles.coverPreviewImage} />
                </View>
              ) : null}
            </ScrollView>
          )}

          {/* Step 2: Upload Stickers */}
          {currentStep === 2 && (
            <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
              <View style={styles.stepHeadingRow}>
                <Text style={styles.sectionHeading}>Upload Stickers</Text>
                <Text style={styles.countTag}>{stickers.length}/64 stickers</Text>
              </View>

              <Text style={styles.guidelineText}>
                Requirements: PNG, WebP, or Animated WebP. Transparent backgrounds supported. Max 64 stickers.
              </Text>

              {/* Add New Sticker Box */}
              <View style={styles.addStickerBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Sticker Name (e.g. Joyful Cry)"
                  placeholderTextColor={colors.textMuted}
                  value={newStickerName}
                  onChangeText={setNewStickerName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Sticker Image URL"
                  placeholderTextColor={colors.textMuted}
                  value={newStickerUrl}
                  onChangeText={setNewStickerUrl}
                />

                <TouchableOpacity
                  style={styles.animatedToggle}
                  onPress={() => setNewStickerAnimated(!newStickerAnimated)}
                >
                  <View style={[styles.checkbox, newStickerAnimated && styles.checkboxActive]}>
                    {newStickerAnimated && <CheckCircle2 size={12} color="#fff" />}
                  </View>
                  <Text style={styles.animatedToggleText}>Animated WebP sticker</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.addBtn} onPress={handleAddSticker}>
                  <Plus size={16} color="#fff" />
                  <Text style={styles.addBtnText}>Add Sticker</Text>
                </TouchableOpacity>
              </View>

              {/* Current Stickers Grid */}
              <Text style={styles.fieldLabel}>Pack Stickers ({stickers.length})</Text>
              <View style={styles.stickersGrid}>
                {stickers.map((s, idx) => (
                  <View key={idx} style={styles.stickerTile}>
                    <ExpoImage source={{ uri: s.imageUrl }} style={styles.stickerImage} />
                    <Text style={styles.stickerTileName} numberOfLines={1}>
                      {s.name}
                    </Text>
                    {s.animated && (
                      <View style={styles.animBadge}>
                        <Text style={styles.animBadgeText}>GIF/Anim</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.removeStickerBtn}
                      onPress={() => handleRemoveSticker(idx)}
                    >
                      <Trash2 size={12} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Step 3: Distribution */}
          {currentStep === 3 && (
            <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeading}>Choose Distribution</Text>
              <Text style={styles.guidelineText}>
                Select how readers will access and unlock your sticker pack on Panelva.
              </Text>

              {/* Free Option */}
              <TouchableOpacity
                style={[styles.distributionCard, distribution === 'FREE' && styles.distributionCardActive]}
                onPress={() => setDistribution('FREE')}
              >
                <View style={styles.radioCircle}>
                  {distribution === 'FREE' && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.distTitle}>Free for Everyone</Text>
                  <Text style={styles.distDesc}>
                    Any reader can claim and use these stickers in chapter comments and hub posts.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Paid Option */}
              <TouchableOpacity
                style={[styles.distributionCard, distribution === 'PAID' && styles.distributionCardActive]}
                onPress={() => setDistribution('PAID')}
              >
                <View style={styles.radioCircle}>
                  {distribution === 'PAID' && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.distTitle}>Paid (Credits Marketplace)</Text>
                  <Text style={styles.distDesc}>
                    Readers purchase with Credits. You earn 100% of revenue credits.
                  </Text>
                </View>
              </TouchableOpacity>

              {distribution === 'PAID' && (
                <View style={styles.priceContainer}>
                  <Text style={styles.fieldLabel}>Credit Price (e.g. 100, 200, 400 Credits)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={creditPrice}
                    onChangeText={setCreditPrice}
                  />
                </View>
              )}

              {/* Creator Membership Option */}
              <TouchableOpacity
                style={[
                  styles.distributionCard,
                  distribution === 'MEMBERSHIP' && styles.distributionCardActive,
                ]}
                onPress={() => setDistribution('MEMBERSHIP')}
              >
                <View style={styles.radioCircle}>
                  {distribution === 'MEMBERSHIP' && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.distTitle}>Creator Membership Exclusive</Text>
                  <Text style={styles.distDesc}>
                    Only active subscribers of your Creator Membership tiers can use this pack.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Review Checklist Banner */}
              <View style={styles.checklistBanner}>
                <ShieldAlert size={16} color="#f59e0b" />
                <Text style={styles.checklistText}>
                  Upon submitting, this pack enters the Admin Moderation queue for copyright and safety checks before going public.
                </Text>
              </View>
            </ScrollView>
          )}

          {/* Footer Actions */}
          <View style={styles.footer}>
            {currentStep > 1 ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentStep((prev) => (prev - 1) as any)}
                disabled={isSubmitting}
              >
                <ArrowLeft size={16} color="#9ca3af" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            ) : <View />}

            {currentStep < 3 ? (
              <TouchableOpacity
                style={[styles.nextButton, !title.trim() && styles.disabledButton]}
                onPress={() => {
                  if (!title.trim()) {
                    Alert.alert('Required Field', 'Please enter a title for your sticker pack.');
                    return;
                  }
                  setCurrentStep((prev) => (prev + 1) as any);
                }}
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <ArrowRight size={16} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                onPress={handleFinalSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Sparkles size={16} color="#fff" />
                    <Text style={styles.submitButtonText}>Submit for Review</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
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
  container: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  stepIndicator: {
    fontSize: 11,
    color: '#60a5fa',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#1f2937',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
  },
  stepContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  guidelineText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d1d5db',
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: '#1f2937',
    borderRadius: radius.md,
    color: '#fff',
    fontSize: 13,
    paddingHorizontal: spacing.sm + 2,
    height: 42,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: spacing.xs,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  coverPreviewContainer: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  coverPreviewImage: {
    width: 140,
    height: 90,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#374151',
  },
  stepHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countTag: {
    fontSize: 12,
    color: '#60a5fa',
    fontWeight: '700',
  },
  addStickerBox: {
    backgroundColor: '#1e293b',
    padding: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: spacing.md,
  },
  animatedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: spacing.xs,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  animatedToggleText: {
    fontSize: 12,
    color: '#d1d5db',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    height: 38,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  stickersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stickerTile: {
    width: '30%',
    backgroundColor: '#1f2937',
    padding: 6,
    borderRadius: radius.md,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#374151',
  },
  stickerImage: {
    width: 54,
    height: 54,
    borderRadius: 6,
    marginBottom: 4,
  },
  stickerTileName: {
    fontSize: 10,
    color: '#d1d5db',
    textAlign: 'center',
  },
  animBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  animBadgeText: {
    fontSize: 8,
    color: '#60a5fa',
    fontWeight: '700',
  },
  removeStickerBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 2,
  },
  distributionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#1f2937',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#374151',
    marginBottom: spacing.sm,
  },
  distributionCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#172554',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#60a5fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#60a5fa',
  },
  distTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  distDesc: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
    lineHeight: 16,
  },
  priceContainer: {
    backgroundColor: '#1e293b',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  checklistBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginTop: spacing.sm,
  },
  checklistText: {
    fontSize: 11,
    color: '#fef08a',
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    backgroundColor: '#111827',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 13,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
