import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../constants/theme.js";

export default function Header({ viewMode, setViewMode, onOpenSettings }) {
  const getTitle = () => {
    if (viewMode === "calendar") return "שעות עבודה";
    if (viewMode === "list") return "שעות";
    if (viewMode === "stats") return "השכר שלי";
    if (viewMode === "yearly") return "גרף שנתי";
    return "השכר שלי";
  };

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // ignore
    }
  };

  const TabButton = ({ mode, icon, label }) => {
    const active = viewMode === mode;
    return (
      <TouchableOpacity
        style={[styles.tab, active && styles.activeTab]}
        onPress={() => {
          triggerHaptic();
          setViewMode(mode);
        }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={icon}
          size={14}
          color={active ? T.accent : T.textSecondary}
        />
        <Text style={[styles.tabText, active && styles.activeTabText]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic();
            onOpenSettings?.();
          }}
          style={styles.settingsBtn}
          activeOpacity={0.6}
        >
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: T.accent,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "700",
  },
  settingsBtn: {
    padding: 4,
  },
  rightSpacer: {
    width: 24,
    height: 24,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: T.inputBg,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 18,
    padding: 6,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: {
    color: T.textSecondary,
    fontSize: 11,
    fontWeight: "500",
  },
  activeTabText: {
    color: T.accent,
    fontWeight: "700",
  },
});
