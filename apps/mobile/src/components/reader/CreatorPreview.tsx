import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '../../theme/ThemeContext';
import { Creator } from '../../types';
import { CheckIcon, ChevronRightIcon } from '../common/Icons';

export interface CreatorPreviewProps {
  creator: Creator | null;
  onViewProfile?: (creatorId: string) => void;
}

/**
 * Creator attribution card displayed within the reader / series flow.
 */
export function CreatorPreview({ creator, onViewProfile }: CreatorPreviewProps) {
  const { colors } = useTheme();

  if (!creator) return null;

  const penName = creator.penName || 'Original Creator';
  const avatarUrl = creator.avatarUrl || creator.user?.avatarUrl;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
      onPress={() => {
        if (creator.id && onViewProfile) {
          onViewProfile(creator.id);
        }
      }}
      activeOpacity={0.8}
    >
      <View style={[styles.avatarCircle, { backgroundColor: colors.primaryMuted }]}>
        {avatarUrl ? (
          <ExpoImage source={{ uri: avatarUrl }} style={styles.avatarImg} />
        ) : (
          <Text style={[styles.initialText, { color: colors.primary }]}>
            {penName[0]?.toUpperCase() || 'C'}
          </Text>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.nameText, { color: colors.text }]}>{penName}</Text>
          {creator.isVetted && (
            <View style={[styles.vettedBadge, { backgroundColor: colors.primary }]}>
              <CheckIcon size={10} color="#FFFFFF" />
            </View>
          )}
        </View>
        <Text style={[styles.subText, { color: colors.textMuted }]}>Author • View Creator Profile</Text>
      </View>

      <ChevronRightIcon size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 40,
    height: 40,
  },
  initialText: {
    fontSize: 16,
    fontWeight: '800',
  },
  nameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  vettedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subText: {
    fontSize: 11,
    marginTop: 2,
  },
});
