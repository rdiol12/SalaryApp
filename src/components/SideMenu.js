import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { calculateNetSalary } from "../utils/calculations.js";
import { darkTheme as T } from "../constants/theme.js";
import { backupData } from "../utils/exportUtils.js";

export default function SideMenu({
  visible,
  onClose,
  onOpenSettings,
  onOpenPayslip,
  onOpenStats,
  onReset,
  shifts,
  config,
}) {
  const stats = calculateNetSalary(shifts, config);
  const goal = Number(config.monthlyGoal) || 1;
  const progress = Math.min(stats.net / goal, 1);
  const isReached = progress >= 1;

  const shareToWhatsApp = () => {
    let msg = `*דוח שכר ל-${config.userName}*\n\n`;
    Object.keys(shifts)
      .sort()
      .forEach((date) => {
        const s = shifts[date];
        msg += `• ${date}: ${s.type} (${s.totalHours} שעות)\n`;
      });
    msg += `\n*סיכום:*\nברוטו: ₪${stats.gross}\nנטו משוער: *₪${stats.net}*`;

    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`).catch(
      () => alert("ודא ש-WhatsApp מותקן"),
    );
  };

  const MenuItem = ({ icon, label, onPress, color }) => (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.6}>
      <Ionicons name="chevron-back" size={16} color={T.textMuted} />
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, color && { color }]}>{label}</Text>
        <View
          style={[styles.itemIcon, color && { backgroundColor: color + "22" }]}
        >
          <Ionicons name={icon} size={18} color={color || T.accent} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.outside} onPress={onClose} />
        <SafeAreaView style={styles.menu}>
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={T.accent} />
            </View>
            <Text style={styles.userName}>{config.userName}</Text>
          </View>

          <View style={styles.progressArea}>
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>יעד נטו</Text>
              <Text
                style={[
                  styles.goalPercent,
                  { color: isReached ? T.green : T.accent },
                ]}
              >
                {Math.round(progress * 100)}%
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${progress * 100}%`,
                    backgroundColor: isReached ? T.green : T.accent,
                  },
                ]}
              />
            </View>
            <Text style={styles.goalAmount}>
              ₪{Math.round(stats.net).toLocaleString()} / ₪
              {goal.toLocaleString()}
            </Text>
          </View>

          <View style={styles.menuItems}>
            <MenuItem
              icon="settings-outline"
              label="הגדרות פרופיל"
              onPress={onOpenSettings}
            />
            <MenuItem
              icon="bar-chart-outline"
              label="סטטיסטיקה וגרפים"
              onPress={onOpenStats}
            />
            <MenuItem
              icon="document-text-outline"
              label="השוואת תלוש שכר"
              onPress={onOpenPayslip}
            />
            <MenuItem
              icon="logo-whatsapp"
              label="שלח דוח ב-WhatsApp"
              onPress={shareToWhatsApp}
              color={T.green}
            />
          </View>

          <TouchableOpacity
            style={styles.resetBtn}
            onPress={onReset}
            activeOpacity={0.6}
          >
            <Text style={styles.resetText}>איפוס נתוני חודש</Text>
            <Ionicons name="trash-outline" size={18} color={T.red} />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: T.overlay,
    flexDirection: "row-reverse",
  },
  outside: {
    flex: 1,
  },
  menu: {
    width: 300,
    backgroundColor: T.cardBg,
    padding: 20,
  },
  userSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: T.accentLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  userName: {
    color: T.text,
    fontSize: 20,
    fontWeight: "700",
  },
  progressArea: {
    backgroundColor: T.cardBgElevated,
    borderRadius: T.radiusMd,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: T.border,
  },
  goalRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  goalLabel: {
    color: T.textSecondary,
    fontSize: 13,
  },
  goalPercent: {
    fontSize: 13,
    fontWeight: "700",
  },
  track: {
    height: 6,
    backgroundColor: T.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  goalAmount: {
    color: T.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  menuItems: {
    gap: 2,
  },
  item: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.divider,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: T.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: {
    color: T.text,
    fontSize: 15,
    flex: 1,
    textAlign: "right",
  },
  resetBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: "auto",
    paddingVertical: 12,
    borderRadius: T.radiusMd,
    backgroundColor: T.redLight,
  },
  resetText: {
    color: T.red,
    fontSize: 14,
    fontWeight: "600",
  },
});
