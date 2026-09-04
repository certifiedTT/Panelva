import React from "react";
import { View, StyleSheet, SafeAreaView, ViewStyle, StyleProp } from "react-native";
import { colors } from "@panelva/theme";
import { BottomNav, BottomNavTabId } from "./BottomNav.native";

export interface MobileShellNativeProps {
  children: React.ReactNode;
  activeTab?: BottomNavTabId;
  onTabChange?: (tab: BottomNavTabId) => void;
  unreadAlertsCount?: number;
  header?: React.ReactNode;
  hideBottomNav?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function MobileShell({
  children,
  activeTab = "home",
  onTabChange,
  unreadAlertsCount = 0,
  header,
  hideBottomNav = false,
  style,
}: MobileShellNativeProps) {
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      {header && <View style={styles.headerContainer}>{header}</View>}
      <View style={styles.content}>{children}</View>
      {!hideBottomNav && onTabChange && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={onTabChange}
          unreadAlertsCount={unreadAlertsCount}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    width: "100%",
  },
  content: {
    flex: 1,
  },
});
