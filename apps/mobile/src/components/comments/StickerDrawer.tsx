import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import {
  Search,
  Flame,
  Zap,
  Rocket,
  Crown,
  Sparkles,
  Sword,
  Shield,
  Eye,
  Moon,
  Smile,
  PartyPopper,
  Skull,
  Ghost,
  Heart,
  Gem,
  ThumbsUp,
  AlertCircle,
  Trophy,
  Feather,
  BookOpen,
  X,
} from 'lucide-react-native';
import { colors, radius, spacing } from '@panelva/theme';

export interface StickerItem {
  id: string;
  category: string;
  name: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
}

export const STICKER_CATALOG: StickerItem[] = [
  // Trending
  { id: 't-flame', category: 'Trending', name: 'On Fire', icon: Flame, color: '#f97316' },
  { id: 't-zap', category: 'Trending', name: 'Hyped', icon: Zap, color: '#eab308' },
  { id: 't-rocket', category: 'Trending', name: 'To The Moon', icon: Rocket, color: '#3b82f6' },
  { id: 't-crown', category: 'Trending', name: 'Peak Cinema', icon: Crown, color: '#f59e0b' },
  { id: 't-trophy', category: 'Trending', name: 'Goat', icon: Trophy, color: '#facc15' },

  // Anime
  { id: 'a-sparkles', category: 'Anime', name: 'Power Up', icon: Sparkles, color: '#a855f7' },
  { id: 'a-sword', category: 'Anime', name: 'Domain Slice', icon: Sword, color: '#ef4444' },
  { id: 'a-shield', category: 'Anime', name: 'Defended', icon: Shield, color: '#3b82f6' },
  { id: 'a-eye', category: 'Anime', name: 'Omni Vision', icon: Eye, color: '#06b6d4' },
  { id: 'a-moon', category: 'Anime', name: 'Night Blade', icon: Moon, color: '#818cf8' },

  // Funny
  { id: 'f-smile', category: 'Funny', name: 'Lol', icon: Smile, color: '#eab308' },
  { id: 'f-party', category: 'Funny', name: 'Celebration', icon: PartyPopper, color: '#ec4899' },
  { id: 'f-skull', category: 'Funny', name: 'Dead', icon: Skull, color: '#9ca3af' },
  { id: 'f-ghost', category: 'Funny', name: 'Ghosted', icon: Ghost, color: '#cbd5e1' },

  // Love
  { id: 'l-heart', category: 'Love', name: 'Loved It', icon: Heart, color: '#f43f5e' },
  { id: 'l-gem', category: 'Love', name: 'Absolute Gem', icon: Gem, color: '#06b6d4' },
  { id: 'l-sparkle', category: 'Love', name: 'Wholesome', icon: Sparkles, color: '#ec4899' },

  // Reactions
  { id: 'r-thumbs', category: 'Reactions', name: 'Respect', icon: ThumbsUp, color: '#10b981' },
  { id: 'r-alert', category: 'Reactions', name: 'Plot Twist', icon: AlertCircle, color: '#f59e0b' },
  { id: 'r-fire', category: 'Reactions', name: 'Cooked', icon: Flame, color: '#ea580c' },

  // Horror
  { id: 'h-skull', category: 'Horror', name: 'Terrifying', icon: Skull, color: '#ef4444' },
  { id: 'h-ghost', category: 'Horror', name: 'Spooky', icon: Ghost, color: '#64748b' },
  { id: 'h-moon', category: 'Horror', name: 'Blood Moon', icon: Moon, color: '#dc2626' },

  // Panelva Originals
  { id: 'p-feather', category: 'Panelva Originals', name: 'Author Quill', icon: Feather, color: '#3b82f6' },
  { id: 'p-book', category: 'Panelva Originals', name: 'Masterpiece', icon: BookOpen, color: '#10b981' },
  { id: 'p-crown', category: 'Panelva Originals', name: 'Panelva Gold', icon: Crown, color: '#f59e0b' },
];

export const STICKER_CATEGORIES = [
  'Trending',
  'Anime',
  'Funny',
  'Love',
  'Reactions',
  'Horror',
  'Panelva Originals',
];

export interface StickerDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: StickerItem) => void;
}

export function StickerDrawer({ visible, onClose, onSelectSticker }: StickerDrawerProps) {
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStickers = useMemo(() => {
    let list = STICKER_CATALOG;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      );
    }
    return list.filter((s) => s.category === activeCategory);
  }, [activeCategory, searchQuery]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandleRow}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header Row */}
          <View style={styles.headerRow}>
            <Text style={styles.sheetTitle}>Stickers</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search size={14} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search stickers..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={14} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Category Tabs */}
          {!searchQuery && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {STICKER_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                    onPress={() => setActiveCategory(cat)}
                  >
                    <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Sticker Grid */}
          <ScrollView contentContainerStyle={styles.gridContent} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {filteredStickers.map((sticker) => {
                const Icon = sticker.icon;
                return (
                  <TouchableOpacity
                    key={sticker.id}
                    style={styles.stickerTile}
                    onPress={() => {
                      onSelectSticker(sticker);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.stickerIconWrapper, { borderColor: sticker.color + '40' }]}>
                      <Icon size={24} color={sticker.color} />
                    </View>
                    <Text style={styles.stickerLabel} numberOfLines={1}>
                      {sticker.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {filteredStickers.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No stickers found matching "{searchQuery}"</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderColor: '#1F2937',
    maxHeight: '60%',
    paddingBottom: spacing.lg,
  },
  dragHandleRow: {
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  dragHandle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4B5563',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  closeBtn: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    height: 34,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    padding: 0,
  },
  categoryRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: '#1F2937',
  },
  categoryPillActive: {
    backgroundColor: '#2563EB',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  gridContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stickerTile: {
    width: '22%',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  stickerIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  stickerLabel: {
    fontSize: 10,
    color: '#D1D5DB',
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
