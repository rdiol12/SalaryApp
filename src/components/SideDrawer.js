import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideOutLeft,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { darkTheme as T } from "../constants/theme.js";
import { calculateNetSalary } from "../utils/calculations.js";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

export default function SideDrawer({
  isOpen,
  onClose,
  onAction,
  config,
  shifts,
}) {
  if (!isOpen) return null;

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  };

  const DrawerItem = ({ icon, label, action, color = T.text }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        triggerHaptic();
        onAction(action);
      }}
      activeOpacity={0.6}
    >
      <View style={[styles.iconWrapper, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.itemLabel, { color: T.text }]}>{label}</Text>
      <Ionicons
        name="chevron-back"
        size={14}
        color={T.textMuted}
        style={{ marginLeft: "auto" }}
      />
    </TouchableOpacity>
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer Content */}
      <Animated.View
        entering={SlideInLeft.springify().damping(22).stiffness(120)}
        exiting={SlideOutLeft.duration(250)}
        style={[styles.drawer, T.shadows.lg]}
      >
        <BlurView intensity={95} tint="light" style={StyleSheet.absoluteFill} />

        <LinearGradient
          colors={["rgba(255,255,255,0.7)", "rgba(255,255,255,0.4)"]}
          style={styles.gradientOverlay}
        >
          <View style={styles.header}>
            <LinearGradient
              colors={T.gradients.accent}
              style={styles.profileCircle}
            >
              <Ionicons name="person" size={28} color="#fff" />
            </LinearGradient>
            <View style={styles.headerInfo}>
              <Text style={styles.username}>{config.userName || "משתמש"}</Text>
              <Text style={styles.subtitle}>ניהול שכר חכם</Text>
            </View>
          </View>

          {shifts &&
            (() => {
              const stats = calculateNetSalary(shifts, config);
              const goal = Number(config.monthlyGoal) || 0;
              const hasGoal = goal > 0;
              const progress = hasGoal ? Math.min(stats.net / goal, 1) : 0;
              const isReached = hasGoal && progress >= 1;
              return (
                <View style={[styles.progressArea, T.shadows.sm]}>
                  <View style={styles.goalRow}>
                    <Text style={styles.goalLabel}>התקדמות ליעד</Text>
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
                    <LinearGradient
                      colors={
                        isReached ? T.gradients.green : T.gradients.accent
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.bar, { width: `${progress * 100}%` }]}
                    />
                  </View>
                  <View style={styles.goalAmountRow}>
                    <Text style={styles.goalAmount}>
                      {hasGoal
                        ? `₪${Math.round(stats.net).toLocaleString()} / ₪${goal.toLocaleString()}`
                        : "לא הוגדר יעד"}
                    </Text>
                  </View>
                </View>
              );
            })()}

          <View style={styles.menuContent}>
            <Text style={styles.sectionTitle}>תפריט ראשי</Text>
            <DrawerItem
              icon="settings-outline"
              label="הגדרות פרופיל"
              action="settings"
              color={T.accent}
            />
            <DrawerItem
              icon="bar-chart-outline"
              label="סטטיסטיקה וגרפים"
              action="stats"
              color={T.accent}
            />
            <DrawerItem
              icon="document-text-outline"
              label="השוואת תלוש שכר"
              action="payslip"
              color={T.accent}
            />
            <DrawerItem
              icon="logo-whatsapp"
              label="שלח דוח ב-WhatsApp"
              action="whatsapp"
              color={T.green}
            />

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>נתונים</Text>
            <DrawerItem
              icon="cloud-upload-outline"
              label="גיבוי נתונים"
              action="backup"
              color={T.purple}
            />
            <DrawerItem
              icon="trash-outline"
              label="איפוס נתוני חודש"
              action="reset"
              color={T.red}
            />

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>אודות</Text>
            <DrawerItem
              icon="information-circle-outline"
              label="מידע על האפליקציה"
              action="info"
              color={T.textSecondary}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>SalaryApp Premium v1.2.0</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: "transparent",
    borderTopRightRadius: T.radiusXl,
    borderBottomRightRadius: T.radiusXl,
    overflow: "hidden",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.8)",
  },
  gradientOverlay: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 14,
  },
  profileCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    ...T.shadows.md,
  },
  headerInfo: {
    alignItems: "flex-end",
  },
  username: {
    color: T.text,
    fontSize: 19,
    fontWeight: "800",
  },
  subtitle: {
    color: T.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  progressArea: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: T.radiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  goalRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  goalLabel: {
    color: T.text,
    fontSize: 13,
    fontWeight: "700",
  },
  goalPercent: {
    fontSize: 13,
    fontWeight: "800",
  },
  track: {
    height: 10,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 5,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 5,
  },
  goalAmountRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    marginTop: 8,
  },
  goalAmount: {
    color: T.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  menuContent: {
    flex: 1,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    color: T.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginRight: 12,
    marginBottom: 12,
    marginTop: 18,
    textAlign: "right",
    letterSpacing: 1,
  },
  item: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: T.radiusLg,
    gap: 14,
    marginBottom: 4,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 18,
    marginHorizontal: 16,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
  },
  footerText: {
    color: T.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },
});
