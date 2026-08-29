import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '../../theme/ThemeContext';
import { StarIcon } from './Icons';

export interface ContentCardItem {
  id?: string;
  title: string;
  rating?: string;
  genre?: string;
  type?: string;
  coverBg?: string;
  coverUrl?: string;
  views?: string;
  status?: string;
  author?: string;
  chapters?: string;
  isHot?: boolean;
}

export interface ContentCardProps {
  item?: ContentCardItem;
  title?: string;
  rating?: string;
  genre?: string;
  type?: string;
  coverBg?: string;
  coverUrl?: string;
  views?: string;
  status?: string;
  author?: string;
  chapters?: string;
  isHot?: boolean;
  onPress?: (item?: any) => void;
  colors?: any;
  cardWidth?: number;
  width?: number;
}

export function ContentCard(props: ContentCardProps) {
  const { colors: themeColors } = useTheme();
  const colors = props.colors || themeColors;

  const title = props.title || props.item?.title || 'Untitled';
  const rating = props.rating || props.item?.rating || '9.8';
  const genre = props.genre || props.item?.genre || 'General';
  const type = props.type || props.item?.type || 'COMIC';
  const coverBg = props.coverBg || props.item?.coverBg;
  const coverUrl = props.coverUrl || props.item?.coverUrl;
  const cardWidth = props.width || props.cardWidth || 140;

  const isNovel = type.toUpperCase() === 'NOVEL';
  const typeLabel = isNovel ? 'NOVEL' : (genre.toUpperCase() === 'ACTION' ? 'MANHWA' : type.toUpperCase());

  const handlePress = () => {
    if (props.onPress) {
      props.onPress(props.item || { title, rating, genre, type, coverBg, coverUrl });
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[
        styles.cardContainer,
        {
          width: cardWidth,
          backgroundColor: colors.surfaceElevated || colors.panel || '#161622',
          borderColor: colors.border || '#28283C',
        },
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${typeLabel}, rated ${rating}`}
    >
      {/* Cover Artwork Container (Aspect Ratio 3:4) */}
      <View
        style={[
          styles.coverWrapper,
          {
            backgroundColor: coverBg || (isNovel ? '#0f172a' : '#1e3a8a'),
          },
        ]}
      >
        {coverUrl ? (
          <ExpoImage
            source={{ uri: coverUrl }}
            style={styles.coverImage}
            contentFit="cover"
            transition={200}
          />
        ) : null}

        {/* Content Type Badge Overlay */}
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{typeLabel}</Text>
        </View>
      </View>

      {/* Metadata & Title Container */}
      <View style={styles.infoContainer}>
        <Text
          style={[styles.titleText, { color: colors.text || '#FFFFFF' }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {title}
        </Text>

        <View style={styles.ratingRow}>
          <StarIcon size={11} color="#F59E0B" filled={true} />
          <Text style={[styles.ratingText, { color: colors.textMuted || '#94A3B8' }]}>
            {rating}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Helper to calculate responsive grid column count and card width
export function calculateGridDimensions(screenWidth: number, containerPadding: number = 16, gap: number = 10) {
  const availableWidth = screenWidth - (containerPadding * 2);
  let numColumns = 4;

  if (screenWidth < 360) {
    numColumns = 2;
  } else if (screenWidth < 500) {
    numColumns = 3;
  } else {
    numColumns = 4;
  }

  const totalGaps = (numColumns - 1) * gap;
  const cardWidth = Math.floor((availableWidth - totalGaps) / numColumns);

  return { numColumns, cardWidth, gap };
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  coverWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(10, 10, 15, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  infoContainer: {
    padding: 8,
    justifyContent: 'space-between',
    minHeight: 56,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
