import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import {
  HomeIcon,
  SeriesIcon,
  CreatorHubIcon,
  AlertsIcon,
  MoreIcon,
} from '../common/Icons';

export type TabId = 'home' | 'series' | 'creator_hub' | 'alerts' | 'more';

interface BottomNavBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  unreadAlertsCount?: number;
}

export function BottomNavBar({ activeTab, onTabChange, unreadAlertsCount = 0 }: BottomNavBarProps) {
  const { colors } = useTheme();

  const tabs: { id: TabId; label: string; icon: (color: string) => React.ReactNode }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: (color) => <HomeIcon size={22} color={color} strokeWidth={2.2} />,
    },
    {
      id: 'series',
      label: 'Series',
      icon: (color) => <SeriesIcon size={22} color={color} strokeWidth={2.2} />,
    },
    {
      id: 'creator_hub',
      label: 'Creator Hub',
      icon: (color) => <CreatorHubIcon size={22} color={color} strokeWidth={2.2} />,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: (color) => (
        <View style={{ position: 'relative' }}>
          <AlertsIcon size={22} color={color} strokeWidth={2.2} />
          {unreadAlertsCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>
                {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
              </Text>
            </View>
          )}
        </View>
      ),
    },
    {
      id: 'more',
      label: 'More',
      icon: (color) => <MoreIcon size={22} color={color} strokeWidth={2.2} />,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.header, borderTopColor: colors.border }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const iconColor = isActive ? colors.primary : colors.textMuted;
        const textColor = isActive ? colors.primary : colors.textMuted;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <View style={[styles.iconContainer, isActive && { backgroundColor: colors.primaryMuted }]}>
              {tab.icon(iconColor)}
            </View>
            <Text style={[styles.label, { color: textColor, fontWeight: isActive ? '700' : '500' }]} numberOfLines={1}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
    paddingBottom: 6,
    paddingTop: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingVertical: 2,
  },
  iconContainer: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -7,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
