import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { darkTheme as T } from "../constants/theme.js";

export default function Header({ viewMode, setViewMode, onOpenMenu }) {
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

  return (
    <View style={styles.safeArea}>
      <BlurView
        intensity={T.glassIntensity}
        tint="light"
        style={styles.blurContainer}
      >
        <LinearGradient
          colors={T.gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topRow}
        >
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              onOpenMenu?.();
            }}
            style={styles.settingsBtn}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="menu-outline" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{getTitle()}</Text>
          <View style={styles.rightSpacer}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color="rgba(255,255,255,0.7)"
            />
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: T.bg,
  },
  blurContainer: {
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  settingsBtn: {
    padding: 10,
  },
  rightSpacer: {
    width: 32,
    alignItems: "center",
  },
});
