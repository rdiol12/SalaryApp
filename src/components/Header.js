import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkTheme as T } from '../constants/theme';

export default function Header({ config, viewMode, setViewMode, onOpenSettings }) {

  const TabButton = ({ mode, icon, label }) => {
    const active = viewMode === mode;
    return (
      <TouchableOpacity
        style={[styles.tab, active && styles.activeTab]}
        onPress={() => setViewMode(mode)}
        activeOpacity={0.7}
      >
        <Ionicons name={icon} size={16} color={active ? T.text : T.textSecondary} />
        <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onOpenSettings} style={styles.settingsBtn} activeOpacity={0.6}>
          <View style={styles.settingsCircle}>
            <Ionicons name="settings-outline" size={20} color={T.accent} />
          </View>
        </TouchableOpacity>

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>שלום, {config.userName || 'אורח'}</Text>
          <Text style={styles.subText}>ניהול שכר חכם</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TabButton mode="stats" icon="bar-chart-outline" label="סטטיסטיקה" />
        <TabButton mode="list" icon="list-outline" label="רשימה" />
        <TabButton mode="calendar" icon="calendar-outline" label="לוח שנה" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: T.bg,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: T.divider,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  welcomeContainer: {
    alignItems: 'flex-end',
  },
  welcomeText: {
    color: T.text,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: -0.3,
  },
  subText: {
    color: T.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  settingsBtn: {
    padding: 4,
  },
  settingsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: T.tabBg,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: T.radiusMd,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 5,
  },
  activeTab: {
    backgroundColor: T.tabActive,
  },
  tabText: {
    color: T.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  activeTabText: {
    color: T.text,
    fontWeight: '600',
  },
});
