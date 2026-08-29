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
import { CloseIcon, PaletteIcon } from '../common/Icons';

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
  const { colors } = useTheme();
  const [penName, setPenName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedType, setSelectedType] = useState('ILLUSTRATOR');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  const submitApplication = trpc.creator.submitApplication.useMutation({
    onSuccess: () => {
      Alert.alert(
        'Application Submitted! 🎉',
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
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
                <PaletteIcon size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Become a Panelva Creator</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>Publish series, grow your audience & earn</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <CloseIcon size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
            {/* Pen Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Pen Name / Public Creator Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. LunaDraws, AlexMage"
                placeholderTextColor={colors.textMuted}
                value={penName}
                onChangeText={setPenName}
              />
            </View>

            {/* Creator Type */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Creator Primary Discipline *</Text>
              <View style={{ gap: 8 }}>
                {CREATOR_TYPES.map((t) => {
                  const isSelected = selectedType === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.typeCard,
                        {
                          backgroundColor: isSelected ? colors.primaryMuted : colors.surfaceElevated,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedType(t.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.typeRadio, { borderColor: isSelected ? colors.primary : colors.textSubtle }]}>
                        {isSelected && <View style={[styles.typeRadioInner, { backgroundColor: colors.primary }]} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.typeTitle, { color: colors.text }]}>{t.label}</Text>
                        <Text style={[styles.typeDesc, { color: colors.textMuted }]}>{t.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Portfolio URL */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Portfolio / Sample URL *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
                placeholder="https://artstation.com/... or Google Drive link"
                placeholderTextColor={colors.textMuted}
                value={portfolioUrl}
                onChangeText={setPortfolioUrl}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            {/* Bio */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Short Bio & Pitch</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
                placeholder="Tell us about the series or projects you plan to publish..."
                placeholderTextColor={colors.textMuted}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={submitApplication.isLoading}
              activeOpacity={0.8}
            >
              {submitApplication.isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Creator Application</Text>
              )}
            </TouchableOpacity>
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
    maxHeight: '90%',
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
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 10,
  },
  typeRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeRadioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  typeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  typeDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
