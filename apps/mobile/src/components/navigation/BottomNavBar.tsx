import React from 'react';
import { BottomNav, BottomNavTabId, BottomNavProps } from '@panelva/ui';

export type TabId = BottomNavTabId;

export function BottomNavBar(props: BottomNavProps) {
  return <BottomNav {...props} />;
}
