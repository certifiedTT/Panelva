import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, Package, Flag, X } from 'lucide-react-native';
import { radius, spacing } from '@panelva/theme';

export interface StickerContextMenuModalProps {
  visible: boolean;
  onClose: () => void;
  stickerName: string;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onViewPack?: () => void;
  onReport?: () => void;
}

export function StickerContextMenuModal({
  visible,
  onClose,
  stickerName,
  isFavorited,
  onToggleFavorite,
  onViewPack,
  onReport,
}: StickerContextMenuModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.menuContainer}>
          <View style={styles.header}>
            <Text style={styles.stickerTitle} numberOfLines={1}>
              {stickerName || 'Sticker'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <X size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Favorite Action */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onToggleFavorite();
              onClose();
            }}
          >
            <Heart
              size={16}
              color={isFavorited ? '#ef4444' : '#9ca3af'}
              fill={isFavorited ? '#ef4444' : 'transparent'}
            />
            <Text style={[styles.menuItemText, isFavorited && { color: '#ef4444' }]}>
              {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
            </Text>
          </TouchableOpacity>

          {/* View Pack Action */}
          {onViewPack && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                onViewPack();
              }}
            >
              <Package size={16} color="#60a5fa" />
              <Text style={styles.menuItemText}>View Pack</Text>
            </TouchableOpacity>
          )}

          {/* Report Action */}
          <TouchableOpacity
            style={[styles.menuItem, styles.reportItem]}
            onPress={() => {
              onClose();
              onReport?.();
            }}
          >
            <Flag size={16} color="#f87171" />
            <Text style={[styles.menuItemText, { color: '#f87171' }]}>Report Sticker</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  menuContainer: {
    width: 260,
    backgroundColor: '#1e293b',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginBottom: 4,
  },
  stickerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    maxWidth: 180,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  menuItemText: {
    fontSize: 12,
    color: '#e5e7eb',
    fontWeight: '600',
  },
  reportItem: {
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
});
