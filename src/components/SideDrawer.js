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
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideOutLeft,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { darkTheme as T } from "../constants/theme.js";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

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
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrapper, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.itemLabel, { color: T.text }]}>{label}</Text>
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
        entering={SlideInLeft.springify().damping(20).stiffness(100)}
        exiting={SlideOutLeft.duration(250)}
        style={[styles.drawer, T.shadows.lg]}
      >
        <View style={styles.header}>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={30} color="#fff" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.username}>שלום!</Text>
            <Text style={styles.subtitle}>ניהול משמרות חכם</Text>
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
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>גרסה 1.2.0</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: T.cardBg,
    paddingTop: 60,
    borderTopRightRadius: T.radiusXl,
    borderBottomRightRadius: T.radiusXl,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: T.accent,
    justifyContent: "center",
    alignItems: "center",
    ...T.shadows.sm,
  },
  headerInfo: {
    alignItems: "flex-end",
  },
  username: {
    color: T.text,
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    color: T.textMuted,
    fontSize: 12,
  },
  menuContent: {
    flex: 1,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    color: T.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    marginRight: 12,
    marginBottom: 12,
    marginTop: 16,
    textAlign: "right",
  },
  item: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: T.radiusMd,
    gap: 14,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: T.divider,
    marginVertical: 15,
    marginHorizontal: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: T.divider,
    alignItems: "center",
  },
  footerText: {
    color: T.textMuted,
    fontSize: 10,
  },
});
