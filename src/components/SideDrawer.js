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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

export default function SideDrawer({ isOpen, onClose, onAction, config }) {
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
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

        <LinearGradient
          colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.7)"]}
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

          <View style={styles.menuContent}>
            <Text style={styles.sectionTitle}>תפריט ראשי</Text>
            <DrawerItem
              icon="settings-outline"
              label="הגדרות פרופיל"
              action="settings"
              color={T.accent}
            />
            <DrawerItem
              icon="cloud-upload-outline"
              label="גיבוי וסנכרון"
              action="backup"
              color={T.purple}
            />
            <DrawerItem
              icon="download-outline"
              label="ייצוא נתונים (CSV)"
              action="export"
              color={T.green}
            />

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>אודות</Text>
            <DrawerItem
              icon="information-circle-outline"
              label="מידע על האפליקציה"
              action="info"
              color={T.textSecondary}
            />
            <DrawerItem
              icon="star-outline"
              label="דרג אותנו"
              action="rate"
              color={T.orange}
            />
            <DrawerItem
              icon="chatbubble-outline"
              label="צור קשר"
              action="contact"
              color={T.accent}
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
