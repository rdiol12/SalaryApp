import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../constants/theme.js";

export default function FloatingButton({ isVisible, onPress }) {
  if (!isVisible) return null;

  return (
    <TouchableOpacity
      style={styles.fab}
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
    bottom: 30,
    alignSelf: "center",
    left: 0,
    right: 0,
    marginLeft: "auto",
    marginRight: "auto",
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
