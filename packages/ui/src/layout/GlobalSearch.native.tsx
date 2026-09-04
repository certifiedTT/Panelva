import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageStyle,
  Modal,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Search, X, BookOpen, User, Building2, MessageSquare } from "lucide-react-native";
import { colors, spacing, radius, typography } from "@panelva/theme";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  badge?: string;
}

export interface GroupedSearchResults {
  series?: SearchResultItem[];
  creators?: SearchResultItem[];
  studios?: SearchResultItem[];
  posts?: SearchResultItem[];
}

export interface GlobalSearchNativeProps {
  visible: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (text: string) => void;
  results: GroupedSearchResults;
  onSelectItem: (type: "series" | "creators" | "studios" | "posts", item: SearchResultItem) => void;
  isLoading?: boolean;
}

export function GlobalSearch({
  visible,
  onClose,
  query,
  onQueryChange,
  results,
  onSelectItem,
  isLoading = false,
}: GlobalSearchNativeProps) {
  const totalResults =
    (results.series?.length || 0) +
    (results.creators?.length || 0) +
    (results.studios?.length || 0) +
    (results.posts?.length || 0);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Search Header Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Search series, creators, studios, posts..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => onQueryChange("")} style={styles.clearBtn}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Grouped Results */}
        <ScrollView style={styles.resultsScroll} contentContainerStyle={styles.scrollContent}>
          {isLoading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Searching...</Text>
            </View>
          )}

          {!isLoading && query.trim() !== "" && totalResults === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found for "{query}"</Text>
            </View>
          )}

          {/* 1. Series */}
          {results.series && results.series.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <BookOpen size={14} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                  SERIES ({results.series.length})
                </Text>
              </View>
              {results.series.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.resultRow}
                  onPress={() => onSelectItem("series", item)}
                  activeOpacity={0.7}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.seriesThumb as ImageStyle} />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <BookOpen size={16} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.rowInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.subtitle && <Text style={styles.itemSubtitle}>{item.subtitle}</Text>}
                  </View>
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 2. Creators */}
          {results.creators && results.creators.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <User size={14} color="#93C5FD" />
                <Text style={[styles.sectionTitle, { color: "#93C5FD" }]}>
                  CREATORS ({results.creators.length})
                </Text>
              </View>
              {results.creators.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.resultRow}
                  onPress={() => onSelectItem("creators", item)}
                  activeOpacity={0.7}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.avatarThumb as ImageStyle} />
                  ) : (
                    <View style={[styles.avatarThumb, styles.avatarPlaceholder]}>
                      <User size={16} color="#60A5FA" />
                    </View>
                  )}
                  <View style={styles.rowInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.subtitle && <Text style={styles.itemSubtitle}>{item.subtitle}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 3. Studios */}
          {results.studios && results.studios.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Building2 size={14} color="#6EE7B7" />
                <Text style={[styles.sectionTitle, { color: "#6EE7B7" }]}>
                  STUDIOS ({results.studios.length})
                </Text>
              </View>
              {results.studios.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.resultRow}
                  onPress={() => onSelectItem("studios", item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconThumb}>
                    <Building2 size={16} color="#34D399" />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.subtitle && <Text style={styles.itemSubtitle}>{item.subtitle}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 4. Posts */}
          {results.posts && results.posts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MessageSquare size={14} color="#FCD34D" />
                <Text style={[styles.sectionTitle, { color: "#FCD34D" }]}>
                  POSTS ({results.posts.length})
                </Text>
              </View>
              {results.posts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.resultRow}
                  onPress={() => onSelectItem("posts", item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconThumb}>
                    <MessageSquare size={16} color="#FBBF24" />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.subtitle && <Text style={styles.itemSubtitle}>{item.subtitle}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.text,
    ...typography.body,
  },
  clearBtn: {
    padding: spacing.xs,
  },
  cancelBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  cancelText: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: "600",
  },
  resultsScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  section: {
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  seriesThumb: {
    width: 36,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
  },
  thumbPlaceholder: {
    width: 36,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarThumb: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconThumb: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    ...typography.bodySm,
    fontWeight: "600",
    color: colors.text,
  },
  itemSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  badge: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.primary,
    fontWeight: "600",
  },
});
