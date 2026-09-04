import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Clock, Heart, Store, Sparkles, Package, X, ArrowLeft } from 'lucide-react-native';
import { radius, spacing } from '@panelva/theme';
import { trpc } from '../../../lib/trpc';
import { RecentTab } from './tabs/RecentTab';
import { FavoritesTab, FavoriteItem } from './tabs/FavoritesTab';
import { CreatorPacksTab, PackItem } from './tabs/CreatorPacksTab';
import { GifBrowserTab, GifItem } from './tabs/GifBrowserTab';
import { MyPacksTab, OwnedPackItem } from './tabs/MyPacksTab';
import { StickerContextMenuModal } from './StickerContextMenuModal';
import { LockedContentModal } from './LockedContentModal';

export type PickerTab = 'recent' | 'favorites' | 'creator_packs' | 'gifs' | 'packs';

export interface StickerPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: any) => void;
  onSelectGif: (gif: any) => void;
  initialTab?: PickerTab;
}

export function StickerPickerModal({
  visible,
  onClose,
  onSelectSticker,
  onSelectGif,
  initialTab = 'recent',
}: StickerPickerModalProps) {
  const [activeTab, setActiveTab] = useState<PickerTab>(initialTab);
  const [activePackDetail, setActivePackDetail] = useState<any | null>(null);

  // Context Menu state
  const [contextMenuTarget, setContextMenuTarget] = useState<any | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  // Locked Content Modal state
  const [lockedModalData, setLockedModalData] = useState<{
    visible: boolean;
    reason: any;
    packTitle?: string;
    price?: number;
  }>({
    visible: false,
    reason: 'LOCKED',
  });

  // Queries
  const { data: recents } = (trpc.sticker as any).getRecentMedia.useQuery(undefined, { enabled: visible });
  const { data: favorites, refetch: refetchFavorites } = (trpc.sticker as any).getFavorites.useQuery(undefined, { enabled: visible });
  const { data: freePacks, isLoading: freeLoading, refetch: refetchFree } = (trpc.sticker as any).getCreatorPacks.useQuery(
    { accessType: 'FREE' },
    { enabled: visible }
  );
  const { data: paidPacks, isLoading: paidLoading, refetch: refetchPaid } = (trpc.sticker as any).getCreatorPacks.useQuery(
    { accessType: 'PAID' },
    { enabled: visible }
  );
  const { data: myPacks, isLoading: myPacksLoading, refetch: refetchMyPacks } = (trpc.sticker as any).getMyPacks.useQuery(
    undefined,
    { enabled: visible }
  );

  // Mutations
  const toggleFavoriteMutation = (trpc.sticker as any).toggleFavorite.useMutation({
    onSuccess: (data: any) => {
      refetchFavorites();
      Alert.alert(data.favorited ? 'Favorited' : 'Removed', data.message);
    },
  });

  const claimPackMutation = (trpc.sticker as any).claimFreePack.useMutation({
    onSuccess: () => {
      refetchMyPacks();
      refetchFree();
      Alert.alert('Claimed!', 'Free sticker pack added to My Packs library.');
    },
    onError: (err: any) => Alert.alert('Claim Error', err.message),
  });

  const purchasePackMutation = (trpc.sticker as any).purchasePack.useMutation({
    onSuccess: () => {
      refetchMyPacks();
      refetchPaid();
      Alert.alert('Purchased!', 'Sticker pack purchased and unlocked in your library.');
    },
    onError: (err: any) => Alert.alert('Purchase Error', err.message),
  });

  const handleSelectStickerInternal = (sticker: any) => {
    onSelectSticker(sticker);
    onClose();
  };

  const handleSelectGifInternal = (gif: any) => {
    onSelectGif(gif);
    onClose();
  };

  const handleOpenContextMenu = (item: any) => {
    const isFav = favorites?.some((f: any) => f.mediaId === (item.id || item.mediaId));
    setIsFavorited(Boolean(isFav));
    setContextMenuTarget(item);
  };

  const handleToggleFavorite = () => {
    if (!contextMenuTarget) return;
    const mediaType = contextMenuTarget.mediaType || (contextMenuTarget.url ? 'GIF' : 'STICKER');
    const mediaId = contextMenuTarget.id || contextMenuTarget.mediaId;
    const provider = contextMenuTarget.provider || (mediaType === 'GIF' ? 'Tenor' : 'Panelva');

    toggleFavoriteMutation.mutate({
      mediaType,
      mediaId,
      provider,
      metadata: {
        name: contextMenuTarget.name || contextMenuTarget.title,
        url: contextMenuTarget.url,
        imageUrl: contextMenuTarget.imageUrl || contextMenuTarget.url,
      },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandleRow}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header Row / Navigation Tabs */}
          {activePackDetail ? (
            <View style={styles.packDetailHeader}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setActivePackDetail(null)}
              >
                <ArrowLeft size={16} color="#fff" />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.packDetailTitle} numberOfLines={1}>
                {activePackDetail.title}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.navRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'recent' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('recent')}
                >
                  <Clock size={14} color={activeTab === 'recent' ? '#fff' : '#9ca3af'} />
                  <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
                    Recent
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'favorites' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('favorites')}
                >
                  <Heart size={14} color={activeTab === 'favorites' ? '#fff' : '#9ca3af'} />
                  <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
                    Favorites
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'creator_packs' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('creator_packs')}
                >
                  <Store size={14} color={activeTab === 'creator_packs' ? '#fff' : '#9ca3af'} />
                  <Text style={[styles.tabText, activeTab === 'creator_packs' && styles.tabTextActive]}>
                    Creator Packs
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'gifs' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('gifs')}
                >
                  <Sparkles size={14} color={activeTab === 'gifs' ? '#fff' : '#9ca3af'} />
                  <Text style={[styles.tabText, activeTab === 'gifs' && styles.tabTextActive]}>
                    GIFs
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'packs' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('packs')}
                >
                  <Package size={14} color={activeTab === 'packs' ? '#fff' : '#9ca3af'} />
                  <Text style={[styles.tabText, activeTab === 'packs' && styles.tabTextActive]}>
                    Packs
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          )}

          {/* Active Pack Detail View */}
          {activePackDetail ? (
            <ScrollView contentContainerStyle={styles.packStickersGrid} showsVerticalScrollIndicator={false}>
              {activePackDetail.stickers && activePackDetail.stickers.length > 0 ? (
                activePackDetail.stickers.map((st: any) => (
                  <TouchableOpacity
                    key={st.id}
                    style={styles.packStickerTile}
                    onPress={() => handleSelectStickerInternal(st)}
                    onLongPress={() => handleOpenContextMenu(st)}
                    activeOpacity={0.7}
                  >
                    <ExpoImage source={{ uri: st.imageUrl }} style={styles.packStickerImage} />
                    <Text style={styles.packStickerName} numberOfLines={1}>
                      {st.name}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No stickers in this pack.</Text>
                </View>
              )}
            </ScrollView>
          ) : (
            /* Tab Views */
            <View style={{ flex: 1 }}>
              {activeTab === 'recent' && (
                <RecentTab
                  recents={recents || []}
                  onSelectSticker={handleSelectStickerInternal}
                  onSelectGif={handleSelectGifInternal}
                />
              )}

              {activeTab === 'favorites' && (
                <FavoritesTab
                  favorites={favorites || []}
                  onSelectSticker={handleSelectStickerInternal}
                  onSelectGif={handleSelectGifInternal}
                  onLockedClick={(fav) => {
                    setLockedModalData({
                      visible: true,
                      reason: fav.lockReason || 'LOCKED',
                      packTitle: fav.metadata?.packTitle,
                    });
                  }}
                  onLongPress={handleOpenContextMenu}
                />
              )}

              {activeTab === 'creator_packs' && (
                <CreatorPacksTab
                  freePacks={freePacks || []}
                  paidPacks={paidPacks || []}
                  isLoading={freeLoading || paidLoading}
                  onClaimPack={(p) => claimPackMutation.mutate({ packId: p.id })}
                  onBuyPack={(p) => purchasePackMutation.mutate({ packId: p.id })}
                  onSelectPack={(p) => setActivePackDetail(p)}
                />
              )}

              {activeTab === 'gifs' && (
                <GifBrowserTab
                  onSelectGif={handleSelectGifInternal}
                  onLongPress={handleOpenContextMenu}
                />
              )}

              {activeTab === 'packs' && (
                <MyPacksTab
                  packs={myPacks || []}
                  isLoading={myPacksLoading}
                  onSelectPack={(p) => setActivePackDetail(p)}
                  onBrowseMarketplace={() => setActiveTab('creator_packs')}
                />
              )}
            </View>
          )}

          {/* Long Press Context Menu */}
          <StickerContextMenuModal
            visible={Boolean(contextMenuTarget)}
            onClose={() => setContextMenuTarget(null)}
            stickerName={contextMenuTarget?.name || contextMenuTarget?.title || 'Media Item'}
            isFavorited={isFavorited}
            onToggleFavorite={handleToggleFavorite}
          />

          {/* Locked Content Experience Modal */}
          <LockedContentModal
            visible={lockedModalData.visible}
            onClose={() => setLockedModalData((prev) => ({ ...prev, visible: false }))}
            reason={lockedModalData.reason}
            packTitle={lockedModalData.packTitle}
            price={lockedModalData.price}
          />
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
    borderColor: '#1f2937',
    height: '62%',
    paddingBottom: spacing.md,
  },
  dragHandleRow: {
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4b5563',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    paddingBottom: spacing.xs,
  },
  tabsContainer: {
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#1f2937',
  },
  tabBtnActive: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  packDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    fontSize: 12,
    color: '#60a5fa',
    fontWeight: '700',
  },
  packDetailTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    maxWidth: 200,
  },
  packStickersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.md,
  },
  packStickerTile: {
    width: '22%',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#374151',
  },
  packStickerImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginBottom: 2,
  },
  packStickerName: {
    fontSize: 9,
    color: '#d1d5db',
    textAlign: 'center',
  },
  emptyContainer: {
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
