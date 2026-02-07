import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkTheme as T } from '../constants/theme';

export default function Header({ viewMode, setViewMode, onOpenSettings }) {
  const getTitle = () => {
    if (viewMode === 'calendar') return 'שעות עבודה';
    if (viewMode === 'list') return 'שעות';
    if (viewMode === 'stats') return 'השכר שלי';
    if (viewMode === 'yearly') return 'גרף שנתי';
    return 'השכר שלי';
  };

  const TabButton = ({ mode, icon, label }) => {
    const active = viewMode === mode;
    return (
      <TouchableOpacity
        style={[styles.tab, active && styles.activeTab]}
        onPress={() => setViewMode(mode)}
        activeOpacity={0.7}
      >
        <Ionicons name={icon} size={14} color={active ? T.accent : T.textSecondary} />
        <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onOpenSettings} style={styles.settingsBtn} activeOpacity={0.6}>
          <Ionicons name="settings-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{getTitle()}</Text>
        <View style={styles.rightSpacer} />
      </View>

      <View style={styles.tabContainer}>
        <TabButton mode="yearly" icon="trophy-outline" label="שנתי" />
        <TabButton mode="stats" icon="bar-chart-outline" label="חודשי" />
        <TabButton mode="list" icon="list-outline" label="רשימה" />
        <TabButton mode="calendar" icon="calendar-outline" label="לוח שנה" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: T.bg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  settingsBtn: {
    padding: 4,
  },
  rightSpacer: {
    width: 24,
    height: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: T.cardBg,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: T.radiusMd,
    padding: 4,
    borderWidth: 1,
    borderColor: T.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: T.accentLight,
  },
  tabText: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  activeTabText: {
    color: T.accent,
    fontWeight: '600',
  },
});
