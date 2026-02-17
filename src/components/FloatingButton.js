import React from "react";
import { TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../constants/theme.js";

const TAB_BAR_HEIGHT = 68;

export default function FloatingButton({ isVisible, onPress }) {
  const insets = useSafeAreaInsets();
  if (!isVisible) return null;

  const bottomOffset = TAB_BAR_HEIGHT + (Platform.OS === "ios" ? insets.bottom || 20 : 20) + 16;

  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: bottomOffset }]}
      onPress={() => {
        try {
          Haptics.selectionAsync();
        } catch (e) {}
        onPress?.();
      }}
      activeOpacity={0.8}
    >
      <Ionicons name="add" size={32} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    alignSelf: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: T.accent,
    justifyContent: "center",
    alignItems: "center",
    ...T.shadows.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
});
